import type { SupabaseClient } from 'npm:@supabase/supabase-js@2';
import { AppError, toResponse } from '../_shared/errors.ts';
import { createHandler, json, route, uuidParam, type Deps } from '../_shared/http.ts';
import { clientVerifier, rpcDb, serviceClient, tableIdempotencyStore } from '../_shared/db.ts';
import { safeLogFields } from '../_shared/logging.ts';
import { inspectCoverHeader, reencodeCover } from './image.ts';

const BUCKET = 'home-cover';
const MAX_BYTES = 20 * 1024 * 1024;
const SIGNED_TTL_SECONDS = 5 * 60;
type Crop = { x: number; y: number; width: number; height: number };
type CoverStorage = {
  download(path: string): Promise<Uint8Array>;
  upload(path: string, bytes: Uint8Array, contentType?: string): Promise<void>;
  createSignedUrl(path: string, seconds: number): Promise<string>;
  remove(paths: string[]): Promise<void>;
};
function storageFor(client: SupabaseClient): CoverStorage {
  const bucket = client.storage.from(BUCKET);
  return {
    async download(path) { const { data, error } = await bucket.download(path); if (error || !data) throw new Error('STORAGE_ERROR'); return new Uint8Array(await data.arrayBuffer()); },
    async upload(path, bytes, contentType = 'image/jpeg') { const { error } = await bucket.upload(path, bytes, { contentType, upsert: false }); if (error) throw new Error('STORAGE_ERROR'); },
    async createSignedUrl(path, seconds) { const { data, error } = await bucket.createSignedUrl(path, seconds); if (error || !data) throw new Error('STORAGE_ERROR'); return data.signedUrl; },
    async remove(paths) { if (!paths.length) return; const { error } = await bucket.remove(paths); if (error) throw new Error('STORAGE_ERROR'); },
  };
}
function validCrop(value: unknown): value is Crop {
  if (!value || typeof value !== 'object') return false;
  const crop = value as Record<string, unknown>;
  return ['x', 'y', 'width', 'height'].every((key) => typeof crop[key] === 'number' && Number.isFinite(crop[key])) &&
    (crop.x as number) >= 0 && (crop.y as number) >= 0 && (crop.width as number) > 0 && (crop.height as number) > 0 &&
    (crop.x as number) + (crop.width as number) <= 1 && (crop.y as number) + (crop.height as number) <= 1;
}
async function readBoundedBody(request: Request, limit: number): Promise<Uint8Array> {
  const declared = Number(request.headers.get('Content-Length'));
  if (Number.isFinite(declared) && declared > limit) throw new AppError('COVER_TOO_LARGE');
  if (!request.body) throw new AppError('COVER_INVALID_IMAGE');
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > limit) { await reader.cancel(); throw new AppError('COVER_TOO_LARGE'); }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return bytes;
}
export function homeCoverHandler(deps: Deps, storage: CoverStorage, now: () => Date = () => new Date(), processImage = reencodeCover, signedConfig = { secret: uploadSecret, origin: uploadOrigin }) {
  const jsonHandler = createHandler([
    route('POST', '/spaces/:spaceId/home-cover/upload-url', async ({ userId, params, body }) => {
      const spaceId = uuidParam(params.spaceId);
      if (!['image/jpeg', 'image/png', 'image/heic'].includes(String(body.contentType))) throw new AppError('COVER_FORMAT_UNSUPPORTED');
      if (!Number.isInteger(body.byteSize) || Number(body.byteSize) <= 0 || Number(body.byteSize) > MAX_BYTES) throw new AppError('COVER_TOO_LARGE');
      const uploadId = crypto.randomUUID();
      const expiresAt = new Date(now().getTime() + 5 * 60_000).toISOString();
      const ticket = await deps.db.rpc<{ id: string; path: string }>('create_home_cover_upload', { target: spaceId, upload: uploadId, actor: userId, mime: body.contentType, size_bytes: body.byteSize, expires: expiresAt });
      const uploadUrl = await signedUploadUrl(signedConfig.secret, signedConfig.origin, { spaceId, userId, uploadId, expiresAt });
      return json({ uploadId, uploadUrl, expiresAt }, 201);
    }, { idempotent: false }),
    route('PUT', '/spaces/:spaceId/home-cover', async ({ userId, params, body }) => {
      const spaceId = uuidParam(params.spaceId);
      if (typeof body.uploadId !== 'string' || !validCrop(body.crop)) throw new AppError('INVALID_REQUEST');
      const uploadId = uuidParam(body.uploadId);
      const ticket = await deps.db.rpc<{ staging_path: string; content_type: string; byte_size: number }>('get_home_cover_upload', { target: spaceId, upload: uploadId, actor: userId, at: now().toISOString() });
      let original: Uint8Array;
      try { original = await storage.download(ticket.staging_path); } catch { throw new AppError('COVER_INVALID_IMAGE'); }
      if (original.byteLength !== ticket.byte_size || original.byteLength > MAX_BYTES || !['image/jpeg', 'image/png'].includes(ticket.content_type)) throw new AppError('COVER_INVALID_IMAGE');
      if (inspectCoverHeader(original)?.format !== ticket.content_type) throw new AppError('COVER_INVALID_IMAGE');
      let processed;
      try { processed = await processImage(original, body.crop); } catch { throw new AppError('COVER_INVALID_IMAGE'); }
      const finalPath = `${spaceId}/cover/${crypto.randomUUID()}.jpg`;
      await storage.upload(finalPath, processed.bytes);
      const digest = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new Uint8Array(processed.bytes)))).map((byte) => byte.toString(16).padStart(2, '0')).join('');
      let result;
      try {
        result = await deps.db.rpc('commit_home_cover', { target: spaceId, upload: uploadId, actor: userId, final_path: finalPath, mime: 'image/jpeg', size_bytes: processed.bytes.byteLength, width: processed.width, height: processed.height, digest, crop_data: body.crop, at: now().toISOString() });
      } catch (error) {
        await storage.remove([finalPath]).catch(() => {});
        throw error;
      }
      await storage.remove([ticket.staging_path]).catch(() => {});
      return result;
    }),
    route('GET', '/spaces/:spaceId/home-cover', async ({ userId, params }) => {
      const row = await deps.db.rpc<Record<string, unknown>>('get_home_cover', { target: uuidParam(params.spaceId), actor: userId });
      if (row.status !== 'ready' || typeof row.currentObjectPath !== 'string') return { status: 'none', version: row.version ?? 0, uploadedBy: row.uploadedBy ?? null, updatedAt: row.updatedAt ?? null };
      const signedUrl = await storage.createSignedUrl(row.currentObjectPath, SIGNED_TTL_SECONDS);
      return { status: 'ready', version: row.version, signedUrl, signedUrlExpiresAt: new Date(now().getTime() + SIGNED_TTL_SECONDS * 1000).toISOString(), crop: row.crop, uploadedBy: row.uploadedBy, updatedAt: row.updatedAt };
    }),
    route('DELETE', '/spaces/:spaceId/home-cover', async ({ userId, params }) => {
      await deps.db.rpc('remove_home_cover', { target: uuidParam(params.spaceId), actor: userId, at: now().toISOString() });
      return new Response(null, { status: 204 });
    }),
  ], deps);
  return async (request: Request): Promise<Response> => {
    const uploadMatch = new URL(request.url).pathname.match(/\/upload\/([0-9a-f-]{36})$/i);
    if (request.method !== 'PUT' || !uploadMatch) return jsonHandler(request);
    try {
      const url = new URL(request.url);
      const uploadId = uuidParam(uploadMatch[1]);
      const spaceId = uuidParam(url.searchParams.get('space') ?? '');
      const userId = uuidParam(url.searchParams.get('user') ?? '');
      const expiresAt = url.searchParams.get('expires') ?? '';
      const signature = url.searchParams.get('signature') ?? '';
      const payload = { spaceId, userId, uploadId, expiresAt };
      if (Date.parse(expiresAt) <= now().getTime() || !(await verifyUploadSignature(signedConfig.secret, payload, signature))) throw new AppError('NOT_FOUND');
      const ticket = await deps.db.rpc<{ staging_path: string; content_type: string; byte_size: number }>('get_home_cover_upload_slot', { target: spaceId, upload: uploadId, actor: userId, at: now().toISOString() });
      if (request.headers.get('Content-Type')?.split(';')[0] !== ticket.content_type) throw new AppError('COVER_FORMAT_UNSUPPORTED');
      const bytes = await readBoundedBody(request, Math.min(ticket.byte_size, MAX_BYTES));
      if (bytes.byteLength !== ticket.byte_size) throw new AppError('COVER_INVALID_IMAGE');
      await storage.upload(ticket.staging_path, bytes, ticket.content_type);
      try { await deps.db.rpc('mark_home_cover_uploaded', { target: spaceId, upload: uploadId, actor: userId, at: now().toISOString() }); }
      catch (error) { await storage.remove([ticket.staging_path]); throw error; }
      return new Response(null, { status: 204 });
    } catch (error) {
      return toResponse(error);
    }
  };
}
type SignedUpload = { spaceId: string; userId: string; uploadId: string; expiresAt: string };
let uploadSecret = '';
let uploadOrigin = '';
export function configureSignedUploads(secret: string, origin: string) { uploadSecret = secret; uploadOrigin = origin.replace(/\/$/, ''); }
function bytesToHex(bytes: Uint8Array) { return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join(''); }
async function signUpload(secret: string, payload: SignedUpload): Promise<string> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return bytesToHex(new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${payload.spaceId}:${payload.userId}:${payload.uploadId}:${payload.expiresAt}`))));
}
async function verifyUploadSignature(secret: string, payload: SignedUpload, signature: string): Promise<boolean> {
  const expected = await signUpload(secret, payload);
  if (signature.length !== expected.length) return false;
  let difference = 0;
  for (let index = 0; index < expected.length; index++) difference |= signature.charCodeAt(index) ^ expected.charCodeAt(index);
  return difference === 0;
}
async function signedUploadUrl(secret: string, origin: string, payload: SignedUpload): Promise<string> {
  const signature = await signUpload(secret, payload);
  const url = new URL(`${origin}/functions/v1/home-cover/upload/${payload.uploadId}`);
  url.search = new URLSearchParams({ space: payload.spaceId, user: payload.userId, expires: payload.expiresAt, signature }).toString();
  return url.toString();
}
if (import.meta.main) {
  const client = serviceClient();
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? crypto.randomUUID();
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  configureSignedUploads(serviceKey, supabaseUrl);
  const handler = homeCoverHandler({ db: rpcDb(client), verifier: clientVerifier(client), idempotency: tableIdempotencyStore(client) }, storageFor(client));
  Deno.serve(async (request) => {
    try { return await handler(request); } catch { console.log(JSON.stringify(safeLogFields({ event: 'home-cover', status: 503 }))); return Response.json({ error: { code: 'SERVER_ERROR', retryable: true } }, { status: 503 }); }
  });
}
