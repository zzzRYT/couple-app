import { randomUUID } from 'expo-crypto';
import { ApiError } from './errors';
type Caller = (path: string, request: RequestInit) => Promise<Response>;
type RequestOptions = { method?: string; body?: Record<string, unknown>; retries?: number; keyInBody?: boolean; timeoutMs?: number };
export function createApi(call: Caller, makeId: () => string = randomUUID) {
  const api = {
    /** One key per logical mutation; retries of the same call reuse it, in the header and (when the contract asks) in the body. */
    async request(path: string, options: RequestOptions = {}): Promise<Response> {
      const method = options.method ?? 'GET';
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      const mutation = !['GET', 'HEAD'].includes(method.toUpperCase());
      const key = mutation ? makeId() : undefined;
      if (key) headers['Idempotency-Key'] = key;
      const body = options.keyInBody && key ? { ...options.body, idempotencyKey: key } : options.body;
      const init: RequestInit = { method, headers, ...(body === undefined ? {} : { body: JSON.stringify(body) }) };
      const retries = options.retries ?? 1;
      // A timeout surfaces as a network error (TypeError) so callers handle "the answer may still arrive" in one place.
      const send = async () => {
        if (!options.timeoutMs) return call(path, init);
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), options.timeoutMs);
        try { return await call(path, { ...init, signal: controller.signal }); } catch (error) {
          if (controller.signal.aborted) throw new TypeError('REQUEST_TIMEOUT');
          throw error;
        } finally { clearTimeout(timer); }
      };
      for (let attempt = 0; ; attempt++) {
        try {
          const response = await send();
          if (response.status < 500 || attempt >= retries) return response;
        } catch (error) {
          if (attempt >= retries) throw error;
        }
      }
    },
    /** Parses success bodies and turns `{ error: { code } }` responses into ApiError. */
    async json<T>(path: string, options: RequestOptions = {}): Promise<T> {
      const response = await api.request(path, options);
      if (response.status === 204) return undefined as T;
      const data = await response.json().catch(() => ({}));
      if (response.status >= 400) {
        const { error, ...rest } = data as { error?: { code?: string } & Record<string, unknown> };
        const { code, ...extra } = error ?? {};
        throw new ApiError(response.status, code ?? (response.status === 404 ? 'NOT_FOUND' : 'SERVER_ERROR'), { ...rest, ...extra });
      }
      return data as T;
    },
  };
  return api;
}
export type Api = ReturnType<typeof createApi>;
