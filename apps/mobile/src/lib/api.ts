import { randomUUID } from 'expo-crypto';
type Caller = (path: string, request: RequestInit) => Promise<Response>;
export function createApi(call: Caller, makeId: () => string = randomUUID) {
  return {
    async request(path: string, options: { method?: string; body?: unknown; retries?: number } = {}): Promise<Response> {
      const method = options.method ?? 'GET';
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (!['GET', 'HEAD'].includes(method.toUpperCase())) headers['Idempotency-Key'] = makeId();
      const init: RequestInit = { method, headers, ...(options.body === undefined ? {} : { body: JSON.stringify(options.body) }) };
      const retries = options.retries ?? 1;
      for (let attempt = 0; ; attempt++) {
        try {
          const response = await call(path, init);
          if (response.status < 500 || attempt >= retries) return response;
        } catch (error) {
          if (attempt >= retries) throw error;
        }
      }
    },
  };
}
