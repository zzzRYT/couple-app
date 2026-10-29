// T152: provider handling at the request handler, with fakes only (no stack). The state machine and the Apple/Kakao
// clients themselves are also covered by tools/tests/account-deletion.test.mjs, which runs under plain Node.
import { assert, assertEquals } from 'jsr:@std/assert@1';
import { accountHandler, type AccountDeps } from '../index.ts';
import { AppleExchangeError, ProviderNotConfiguredError, type AppleClient } from '../../_shared/providers/apple.ts';
import type { IdempotencyStore } from '../../_shared/idempotency.ts';

const USER = '00000000-0000-4000-8000-0000000000c1';
const NOW = new Date('2026-11-02T00:00:00Z');
const enc = (o: unknown) => btoa(JSON.stringify(o)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
function token(provider: string, signedInSecondsAgo: number) {
  const t = NOW.getTime() / 1000 - signedInSecondsAgo;
  return `${enc({ alg: 'HS256' })}.${enc({ sub: USER, iat: t, amr: [{ method: 'oauth', timestamp: t }], app_metadata: { provider } })}.sig`;
}
function memoryStore(): IdempotencyStore {
  const map = new Map<string, unknown>();
  return { get: (k) => Promise.resolve(map.get(k)), put: (k, v) => { map.set(k, v); return Promise.resolve(); } };
}
function deps(overrides: { apple?: AppleClient; kakao?: AccountDeps['ports']['kakao'] } = {}) {
  const rpcs: { name: string; args: Record<string, unknown> }[] = [];
  const logged: string[] = [];
  const db = { async rpc<T>(name: string, args: Record<string, unknown>): Promise<T> { rpcs.push({ name, args }); return (name === 'claim_account_deletion' ? null : { state: 'requested' }) as T; } };
  const account: AccountDeps = {
    db, verifier: { getUser: () => Promise.resolve({ user: { id: USER }, error: null }) }, idempotency: memoryStore(), now: () => NOW,
    ports: {
      db, now: () => NOW, storage: { removeSpaceObjects: () => Promise.resolve(), removeObjects: () => Promise.resolve() },
      auth: { providerUserId: () => Promise.resolve('k1'), deleteUser: () => Promise.resolve() },
      apple: overrides.apple ?? { exchange: () => Promise.resolve({ token: 'refresh-secret', hint: 'refresh_token' }), revoke: () => Promise.resolve() },
      kakao: 'kakao' in overrides ? overrides.kakao! : null,
      box: { seal: (x) => Promise.resolve(`sealed(${x.length})`), open: () => Promise.resolve('{}') },
    },
    signOutEverywhere: () => Promise.resolve(), providerOf: () => Promise.resolve('apple'), serviceKey: 'service-key',
  };
  const original = console.log;
  const handler = accountHandler(account);
  async function send(body: unknown, auth = token('apple', 30), path = '/account/deletion') {
    console.log = (line: string) => logged.push(line);
    try {
      const res = await handler(new Request(`http://local/functions/v1/account${path}`, { method: 'POST', headers: { Authorization: `Bearer ${auth}`, 'Idempotency-Key': crypto.randomUUID(), 'Content-Type': 'application/json' }, body: JSON.stringify(body) }));
      return { status: res.status, body: await res.json() };
    } finally { console.log = original; }
  }
  return { send, rpcs, logged };
}
const began = (rpcs: { name: string }[]) => rpcs.some((r) => r.name === 'begin_account_deletion');

Deno.test('① Apple: the code is exchanged before the accepting transaction and the sealed token is stored', async () => {
  const { send, rpcs } = deps();
  const res = await send({ confirm: true, reauth: { provider: 'apple', authorizationCode: 'code-1' } });
  assertEquals(res, { status: 202, body: { state: 'requested' } });
  const begin = rpcs.find((r) => r.name === 'begin_account_deletion')!;
  assertEquals(begin.args.reauth_provider, 'apple');
  assert(String(begin.args.credential).startsWith('sealed('), 'only the sealed form reaches the database');
  assertEquals(begin.args.credential_ttl_seconds, 86400);
});
Deno.test('① Apple: a refused code changes nothing and answers 401 REAUTH_REQUIRED', async () => {
  const { send, rpcs } = deps({ apple: { exchange: () => Promise.reject(new AppleExchangeError()), revoke: () => Promise.resolve() } });
  const res = await send({ confirm: true, reauth: { provider: 'apple', authorizationCode: 'bad' } });
  assertEquals(res.status, 401);
  assertEquals(res.body.error.code, 'REAUTH_REQUIRED');
  assert(!began(rpcs));
});
Deno.test('Apple secret missing: refused with PROVIDER_NOT_CONFIGURED before anything is deleted', async () => {
  const missing = new ProviderNotConfiguredError('APPLE_SECRET_MISSING');
  const { send, rpcs } = deps({ apple: { exchange: () => Promise.reject(missing), revoke: () => Promise.reject(missing) } });
  const res = await send({ confirm: true, reauth: { provider: 'apple', authorizationCode: 'code' } });
  assertEquals(res.status, 503);
  assertEquals(res.body.error.code, 'PROVIDER_NOT_CONFIGURED');
  assert(!began(rpcs));
});
Deno.test('② Kakao: refused while the hidden flag is off; accepted when the unlink client exists', async () => {
  const off = deps();
  assertEquals((await off.send({ confirm: true, reauth: { provider: 'kakao' } }, token('kakao', 10))).body.error.code, 'PROVIDER_NOT_CONFIGURED');
  assert(!began(off.rpcs));
  const on = deps({ kakao: { unlink: () => Promise.resolve() } });
  assertEquals((await on.send({ confirm: true, reauth: { provider: 'kakao' } }, token('kakao', 10))).status, 202);
});
Deno.test('③ email: no provider step and no credential', async () => {
  const { send, rpcs } = deps();
  assertEquals((await send({ confirm: true, reauth: { provider: 'email' } }, token('email', 10))).status, 202);
  assertEquals(rpcs.find((r) => r.name === 'begin_account_deletion')!.args.credential, null);
});
Deno.test('re-authentication: stale sign-in or another provider is 401 REAUTH_REQUIRED; bad bodies are 400', async () => {
  const { send, rpcs } = deps();
  assertEquals((await send({ confirm: true, reauth: { provider: 'email' } }, token('email', 301))).body.error.code, 'REAUTH_REQUIRED');
  assertEquals((await send({ confirm: true, reauth: { provider: 'apple', authorizationCode: 'c' } }, token('email', 10))).body.error.code, 'REAUTH_REQUIRED');
  assertEquals((await send({ confirm: false, reauth: { provider: 'email' } }, token('email', 10))).status, 400);
  assertEquals((await send({ confirm: true, reauth: { provider: 'apple' } })).status, 400);
  assertEquals((await send({ confirm: true, reauth: { provider: 'google' } })).status, 400);
  assert(!began(rpcs));
});
Deno.test('⑤ no key, token or code appears in logs or responses', async () => {
  const { send, logged } = deps();
  const res = await send({ confirm: true, reauth: { provider: 'apple', authorizationCode: 'code-secret' } });
  const text = JSON.stringify(res) + logged.join('\n');
  for (const secret of ['code-secret', 'refresh-secret', 'service-key']) assert(!text.includes(secret), secret);
});
Deno.test('operator route: only the service-role key starts an out-of-app deletion', async () => {
  const { send, rpcs } = deps();
  assertEquals((await send({ userId: USER }, 'not-the-key', '/account/operator-deletion')).status, 401);
  assert(!began(rpcs));
  const ok = await send({ userId: USER }, 'service-key', '/account/operator-deletion');
  assertEquals(ok.status, 202);
  assertEquals(rpcs.find((r) => r.name === 'begin_account_deletion')!.args.request_origin, 'operator');
});
