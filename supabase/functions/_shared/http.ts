import { requireUser, type UserVerifier } from './auth.ts';
import { AppError, toResponse } from './errors.ts';
import { withIdempotency, type IdempotencyStore } from './idempotency.ts';
import { safeLogFields } from './logging.ts';
import { clientVerifier, rpcDb, serviceClient, tableIdempotencyStore, type Db } from './db.ts';

export type Deps = { db: Db; verifier: UserVerifier; idempotency: IdempotencyStore; now?: () => Date };
export type Context = { userId: string; params: Record<string, string>; body: Record<string, unknown>; query: URLSearchParams; deps: Deps; request: Request };
type Route = { method: string; pattern: RegExp; endpoint: string; handle: (ctx: Context) => Promise<Response | unknown>; idempotent: boolean };

/** Declares `/spaces/:spaceId/...` routes; mutations are replayed from the idempotency store. */
export function route(method: string, path: string, handle: Route['handle'], options: { idempotent?: boolean } = {}): Route {
  const pattern = new RegExp(`${path.replace(/:(\w+)/g, '(?<$1>[^/]+)')}$`);
  return { method, pattern, endpoint: `${method} ${path}`, handle, idempotent: options.idempotent ?? true };
}
export function defaultDeps(): Deps {
  const client = serviceClient();
  return { db: rpcDb(client), verifier: clientVerifier(client), idempotency: tableIdempotencyStore(client) };
}
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function uuidParam(value: unknown): string {
  if (typeof value !== 'string' || !UUID.test(value)) throw new AppError('NOT_FOUND');
  return value;
}
export function createHandler(routes: Route[], deps: Deps) {
  return async (request: Request): Promise<Response> => {
    const started = Date.now();
    const url = new URL(request.url);
    const match = routes.map((r) => ({ r, m: request.method === r.method ? url.pathname.match(r.pattern) : null })).find((x) => x.m);
    let response: Response;
    try {
      if (!match) throw new AppError('NOT_FOUND');
      const userId = await requireUser(request.headers.get('Authorization'), deps.verifier).catch(() => { throw new AppError('UNAUTHORIZED'); });
      const text = ['GET', 'HEAD', 'DELETE'].includes(request.method) ? '' : await request.text();
      let body: Record<string, unknown> = {};
      if (text) { try { body = JSON.parse(text); } catch { throw new AppError('INVALID_REQUEST'); } }
      if (!body || typeof body !== 'object' || Array.isArray(body)) throw new AppError('INVALID_REQUEST');
      const ctx: Context = { userId, params: { ...match.m!.groups }, body, query: url.searchParams, deps, request };
      if (request.method === 'GET') response = asResponse(await match.r.handle(ctx));
      else if (!match.r.idempotent) response = asResponse(await match.r.handle(ctx));
      else {
        const key = request.headers.get('Idempotency-Key') ?? (typeof body.idempotencyKey === 'string' ? body.idempotencyKey : null);
        if (!key) throw new AppError('INVALID_REQUEST');
        const stored = await withIdempotency(deps.idempotency, userId, `${match.r.endpoint} ${url.pathname}`, key, async () => serialize(asResponse(await match.r.handle(ctx))))
          .catch((error) => { if (error instanceof Error && error.message === 'INVALID_IDEMPOTENCY_KEY') throw new AppError('INVALID_REQUEST'); throw error; });
        response = deserialize(stored as Stored);
      }
    } catch (error) {
      response = toResponse(error);
    }
    console.log(JSON.stringify(safeLogFields({ event: 'request', endpoint: match?.r.endpoint ?? 'unknown', status: response.status, durationMs: Date.now() - started })));
    return response;
  };
}
type Stored = { status: number; body: unknown };
function asResponse(value: Response | unknown): Response {
  return value instanceof Response ? value : Response.json(value);
}
async function serialize(response: Response): Promise<Stored> {
  const text = await response.text();
  return { status: response.status, body: text ? JSON.parse(text) : null };
}
function deserialize(stored: Stored): Response {
  return stored.body === null ? new Response(null, { status: stored.status }) : Response.json(stored.body, { status: stored.status });
}
export function json(body: unknown, status = 200): Response { return Response.json(body, { status }); }
export function str(value: unknown, max = 10_000): string {
  if (typeof value !== 'string' || value.length > max) throw new AppError('INVALID_REQUEST');
  return value;
}
