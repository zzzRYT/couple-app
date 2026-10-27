import { assertEquals, assertRejects } from 'jsr:@std/assert@1';
import { errorResponse } from '../errors.ts';
import { withIdempotency } from '../idempotency.ts';
import { safeLogFields } from '../logging.ts';
import { requireUser } from '../auth.ts';
Deno.test('errors use codes and retryability without natural language', async () => {
  const response = errorResponse('VERSION_CONFLICT', 409, false);
  assertEquals(response.status, 409);
  assertEquals(await response.json(), { error: { code: 'VERSION_CONFLICT', retryable: false } });
});
Deno.test('returns stored response on same idempotency key', async () => {
  const entries = new Map<string, unknown>();
  const store = { get: (key: string) => Promise.resolve(entries.get(key)), put: (key: string, value: unknown) => { entries.set(key, value); return Promise.resolve(); } };
  let calls = 0;
  const perform = () => Promise.resolve({ count: ++calls });
  assertEquals(await withIdempotency(store, 'user', 'endpoint', '550e8400-e29b-41d4-a716-446655440000', perform), { count: 1 });
  assertEquals(await withIdempotency(store, 'user', 'endpoint', '550e8400-e29b-41d4-a716-446655440000', perform), { count: 1 });
  assertEquals(calls, 1);
  await assertRejects(() => withIdempotency(store, 'user', 'endpoint', 'invalid', perform));
});
Deno.test('logs only allowed metadata', () => {
  assertEquals(safeLogFields({ event: 'request', status: 200, prompt: 'private', apiKey: 'private', signedUrl: 'private', inviteCode: 'private' }), { event: 'request', status: 200 });
});
Deno.test('auth validates the token with its injected verifier', async () => {
  assertEquals(await requireUser('Bearer valid', { getUser: () => Promise.resolve({ user: { id: 'user' }, error: null }) }), 'user');
  await assertRejects(() => requireUser('Bearer invalid', { getUser: () => Promise.resolve({ user: null, error: 'invalid' }) }));
});
