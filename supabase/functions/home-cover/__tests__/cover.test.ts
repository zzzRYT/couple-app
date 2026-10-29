import { assertEquals } from 'jsr:@std/assert@1.0.14';
import type { Deps } from '../../_shared/http.ts';
import type { IdempotencyStore } from '../../_shared/idempotency.ts';
import { homeCoverHandler } from '../index.ts';

const space = '10000000-0000-4000-8000-000000000071';
const user = '00000000-0000-4000-8000-000000000071';
// Smallest JPEG whose SOF0 header declares 300x200, so the header check passes and the stub re-encoder runs.
const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xc0, 0x00, 0x0b, 0x08, 0x00, 0xc8, 0x01, 0x2c, 0x01, 0x01, 0x11, 0x00, 0xff, 0xd9]);
function setup() {
  const rpcCalls: { name: string; args: Record<string, unknown> }[] = [];
  const stored = new Map<string, unknown>();
  const idempotency: IdempotencyStore = { async get(key) { return stored.get(key); }, async put(key, value) { stored.set(key, value); } };
  const deps: Deps = {
    db: { async rpc<T>(name: string, args: Record<string, unknown>) {
      rpcCalls.push({ name, args });
      if (name === 'create_home_cover_upload') return { id: args.upload, path: `${space}/incoming/${args.upload}` } as T;
      if (name === 'get_home_cover_upload' || name === 'get_home_cover_upload_slot') return { staging_path: `${space}/incoming/${args.upload}`, content_type: 'image/jpeg', byte_size: jpeg.byteLength } as T;
      if (name === 'mark_home_cover_uploaded') return { uploaded: true } as T;
      if (name === 'commit_home_cover') return { status: 'ready', version: 1, uploadedBy: user, updatedAt: '2026-11-02T00:00:00Z' } as T;
      if (name === 'get_home_cover') return { status: 'none', version: 0 } as T;
      return undefined as T;
    } },
    verifier: { async getUser() { return { user: { id: user }, error: null }; } },
    idempotency,
  };
  const uploads: string[] = [];
  const removals: string[][] = [];
  const storage = {
    async download() { return jpeg; },
    async upload(path: string) { uploads.push(path); },
    async createSignedUrl(path: string) { return `https://storage.example/read/${path}?token=short-lived`; },
    async remove(paths: string[]) { removals.push(paths); },
  };
  const handler = homeCoverHandler(deps, storage, () => new Date('2026-11-02T00:00:00Z'), async (bytes) => ({ bytes, width: 300, height: 200 }), { secret: 'test-key', origin: 'https://app.example' });
  return { handler, rpcCalls, uploads, removals };
}
function request(path: string, method: string, body?: unknown) {
  return new Request(`https://app.example/spaces/${space}${path}`, { method, headers: { Authorization: 'Bearer token', 'Idempotency-Key': crypto.randomUUID(), ...(body ? { 'Content-Type': 'application/json' } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
}

Deno.test('upload URL rejects unsupported format and oversized input before storage signing', async () => {
  const { handler, uploads } = setup();
  const format = await handler(request('/home-cover/upload-url', 'POST', { contentType: 'image/gif', byteSize: 100 }));
  const size = await handler(request('/home-cover/upload-url', 'POST', { contentType: 'image/jpeg', byteSize: 20 * 1024 * 1024 + 1 }));
  assertEquals((await format.json()).error.code, 'COVER_FORMAT_UNSUPPORTED');
  assertEquals((await size.json()).error.code, 'COVER_TOO_LARGE');
  assertEquals(uploads, []);
});

Deno.test('signed upload URL expires after five minutes and rejects an altered signature', async () => {
  const { handler, uploads } = setup();
  const response = await handler(request('/home-cover/upload-url', 'POST', { contentType: 'image/jpeg', byteSize: jpeg.byteLength }));
  const ticket = await response.json();
  assertEquals(Date.parse(ticket.expiresAt) - Date.parse('2026-11-02T00:00:00Z'), 5 * 60_000);
  const altered = new URL(ticket.uploadUrl);
  altered.searchParams.set('signature', '0'.repeat(64));
  const rejected = await handler(new Request(altered, { method: 'PUT', headers: { 'Content-Type': 'image/jpeg' }, body: new Uint8Array(jpeg.byteLength) }));
  assertEquals(rejected.status, 404);
  assertEquals(uploads, []);
});

Deno.test('a successful upload is re-encoded to a new object before version commit and staging cleanup', async () => {
  const { handler, rpcCalls, uploads, removals } = setup();
  const ticketResponse = await handler(request('/home-cover/upload-url', 'POST', { contentType: 'image/jpeg', byteSize: jpeg.byteLength }));
  const ticket = await ticketResponse.json();
  assertEquals(ticketResponse.status, 201);
  const upload = await handler(new Request(ticket.uploadUrl, { method: 'PUT', headers: { 'Content-Type': 'image/jpeg' }, body: jpeg }));
  assertEquals(upload.status, 204);
  const put = await handler(request('/home-cover', 'PUT', { uploadId: ticket.uploadId, crop: { x: 0, y: 0, width: 1, height: 1 } }));
  assertEquals((await put.json()).status, 'ready');
  assertEquals(rpcCalls.map((call) => call.name), ['create_home_cover_upload', 'get_home_cover_upload_slot', 'mark_home_cover_uploaded', 'get_home_cover_upload', 'commit_home_cover']);
  assertEquals(uploads.length, 2);
  assertEquals(removals, [[`${space}/incoming/${ticket.uploadId}`]]);
});

Deno.test('expired or malformed crop requests are rejected before committing', async () => {
  const { handler, rpcCalls } = setup();
  const response = await handler(request('/home-cover', 'PUT', { uploadId: crypto.randomUUID(), crop: { x: 0.8, y: 0, width: 0.4, height: 1 } }));
  assertEquals(response.status, 400);
  assertEquals(rpcCalls, []);
});
