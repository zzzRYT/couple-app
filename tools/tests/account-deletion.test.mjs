// Pure tests for the account deletion modules (no database, no network): `node --test tools/tests/account-deletion.test.mjs`.
// The Deno integration tests in supabase/functions/account/__tests__ cover the same flow against a local stack.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runAccountDeletion, resumeAccountDeletions, errorCode, ALERT_ATTEMPTS } from '../../supabase/functions/account/runner.ts';
import { jwtClaims, reauthIsFresh, lastSignInAt } from '../../supabase/functions/account/reauth.ts';
import { appleClient, appleConfigFromEnv, clientSecret, AppleExchangeError, ProviderNotConfiguredError } from '../../supabase/functions/_shared/providers/apple.ts';
import { kakaoClientFromEnv } from '../../supabase/functions/_shared/providers/kakao.ts';
import { credentialBox } from '../../supabase/functions/_shared/credentialBox.ts';

const NOW = new Date('2026-11-02T00:00:00Z');
const USER = '00000000-0000-4000-8000-000000000001';
const ORDER = ['requested', 'space_ended', 'provider_revoked', 'auth_deleted', 'done'];

/** In-memory stand-in for the account_deletion RPCs with the same compare-and-set and lease rules as the migration. */
function fakeDb({ state = 'requested', provider = 'email', origin = 'app', credential = null, spaces = ['s1'], failOnce = {} } = {}) {
  const row = { state, provider, origin, attempts: 0, credential, locked: false, last: null, notes: [] };
  const calls = [];
  const remaining = new Set(spaces);
  return {
    row, calls, remaining,
    async rpc(name, args) {
      calls.push(name);
      if (failOnce[name]) { delete failOnce[name]; throw Object.assign(new Error('DB_ERROR'), {}); }
      switch (name) {
        case 'claim_account_deletion':
          if (row.locked || row.state === 'done') return null;
          row.locked = true;
          return { state: row.state, provider: row.provider, origin: row.origin, attempts: row.attempts, credential: row.credential };
        case 'advance_account_deletion':
          if (row.state !== args.from_state) return false;
          assert.equal(ORDER.indexOf(args.to_state), ORDER.indexOf(args.from_state) + 1, 'steps advance one at a time');
          row.state = args.to_state; row.attempts = 0; row.last = args.note;
          if (args.note) row.notes.push(args.note);
          if (args.to_state === 'done') row.locked = false;
          return true;
        case 'record_account_deletion_failure': row.attempts++; row.last = args.code; row.locked = false; return row.attempts;
        case 'release_account_deletion': row.locked = false; return null;
        case 'close_spaces_for_deletion': return [...remaining];
        case 'mark_purge_started': return null;
        case 'purge_space': assert.equal(args.at, 'infinity'); remaining.delete(args.target); return true;
        case 'finish_account_deletion': if (remaining.size) throw new Error('DB_ERROR'); return null;
        case 'due_account_deletions': return row.state === 'done' || row.locked ? [] : [USER];
        default: throw new Error(`unexpected rpc ${name}`);
      }
    },
  };
}
function ports(db, overrides = {}) {
  const log = { removed: [], deleted: [], revoked: [], unlinked: [], warnings: [] };
  return {
    log,
    ports: {
      db, now: () => NOW,
      storage: { removeSpaceObjects: async (id) => { log.removed.push(id); } },
      auth: { providerUserId: async () => 'kakao-123', deleteUser: async (id) => { log.deleted.push(id); } },
      apple: { exchange: async () => ({ token: 't', hint: 'refresh_token' }), revoke: async (tokens) => { log.revoked.push(tokens.token); } },
      kakao: { unlink: async (id) => { log.unlinked.push(id); } },
      box: { seal: async (x) => `sealed:${x}`, open: async (x) => x.replace(/^sealed:/, '') },
      warn: (code) => log.warnings.push(code),
      ...overrides,
    },
  };
}

test('an email account runs every step in order: purge spaces (Storage first), finish, delete the auth user, done', async () => {
  const db = fakeDb({ spaces: ['s1', 's2'] });
  const { ports: p, log } = ports(db);
  assert.equal(await runAccountDeletion(USER, p), 'done');
  assert.deepEqual(log.removed, ['s1', 's2']);
  assert.deepEqual(log.deleted, [USER]);
  assert.deepEqual(log.revoked, []);
  assert.ok(db.calls.indexOf('mark_purge_started') < db.calls.indexOf('purge_space'), 'purge is marked, Storage removed, then rows deleted');
  assert.ok(db.calls.lastIndexOf('purge_space') < db.calls.indexOf('finish_account_deletion'), 'the profile goes only after the spaces');
  assert.equal(db.row.locked, false);
});

test('a failure stays in the same step, backs off, and a later run resumes from there without repeating finished steps', async () => {
  const db = fakeDb({ provider: 'apple', credential: 'sealed:{"token":"r1","hint":"refresh_token"}' });
  let fail = true;
  const { ports: p, log } = ports(db, { apple: { exchange: async () => ({}), revoke: async (t) => { if (fail) throw new Error('APPLE_REVOKE_FAILED'); log.revoked.push(t.token); } } });
  assert.equal(await runAccountDeletion(USER, p), 'space_ended', 'stopped before the provider step finished');
  assert.equal(db.row.state, 'space_ended');
  assert.equal(db.row.last, 'APPLE_REVOKE_FAILED');
  assert.deepEqual(log.deleted, [], 'the auth user is not deleted before the revoke succeeded');
  fail = false;
  const removedBefore = log.removed.length;
  assert.deepEqual(await resumeAccountDeletions(p, NOW), { resumed: 1, pending: 0 });
  assert.deepEqual(log.revoked, ['r1']);
  assert.equal(log.removed.length, removedBefore, 'the purge step is not repeated');
  assert.equal(db.row.state, 'done');
});

test('a second runner never runs the same deletion while the lease is held', async () => {
  const db = fakeDb();
  db.row.locked = true;
  const { ports: p, log } = ports(db);
  assert.equal(await runAccountDeletion(USER, p), null);
  assert.deepEqual(log.removed, []);
});

test('a step moved on by someone else (compare-and-set false) stops without recording a failure', async () => {
  const db = fakeDb();
  const original = db.rpc;
  db.rpc = async (name, args) => { if (name === 'advance_account_deletion') { db.row.state = 'space_ended'; return false; } return original(name, args); };
  const { ports: p } = ports(db);
  assert.equal(await runAccountDeletion(USER, p), null);
  assert.equal(db.row.attempts, 0);
  assert.equal(db.row.locked, false);
});

test('spaces still present make finish fail and retry instead of deleting the auth user', async () => {
  const db = fakeDb({ state: 'provider_revoked', spaces: [] });
  db.remaining.add('late-space');
  const { ports: p, log } = ports(db);
  assert.equal(await runAccountDeletion(USER, p), 'provider_revoked');
  assert.deepEqual(log.deleted, []);
  assert.equal(db.row.last, 'DB_ERROR');
});

test('Apple without a kept token (operator request or expired) finishes with a content-free note and a warning', async () => {
  for (const [origin, note] of [['operator', 'APPLE_TOKEN_UNAVAILABLE'], ['app', 'APPLE_TOKEN_EXPIRED']]) {
    const db = fakeDb({ state: 'space_ended', provider: 'apple', origin, spaces: [] });
    const { ports: p, log } = ports(db);
    assert.equal(await runAccountDeletion(USER, p), 'done');
    assert.deepEqual(db.row.notes, [note]);
    assert.deepEqual(log.warnings, [note]);
    assert.deepEqual(log.revoked, []);
  }
});

test('Kakao unlinks with the provider user id; with the hidden flag off the step waits as PROVIDER_NOT_CONFIGURED', async () => {
  const db = fakeDb({ state: 'space_ended', provider: 'kakao', spaces: [] });
  const { ports: p, log } = ports(db);
  assert.equal(await runAccountDeletion(USER, p), 'done');
  assert.deepEqual(log.unlinked, ['kakao-123']);
  const off = fakeDb({ state: 'space_ended', provider: 'kakao', spaces: [] });
  const { ports: q, log: offLog } = ports(off, { kakao: null });
  assert.equal(await runAccountDeletion(USER, q), 'space_ended');
  assert.equal(off.row.last, 'PROVIDER_NOT_CONFIGURED');
  assert.deepEqual(offLog.deleted, []);
});

test('repeated failures raise an operational warning that carries only the code', async () => {
  const db = fakeDb({ state: 'space_ended', provider: 'apple', credential: 'sealed:{"token":"secret-refresh","hint":"refresh_token"}' });
  const { ports: p, log } = ports(db, { apple: { exchange: async () => ({}), revoke: async () => { throw new Error('upstream said: secret-refresh is bad'); } } });
  for (let i = 0; i < ALERT_ATTEMPTS; i++) await runAccountDeletion(USER, p);
  assert.equal(db.row.attempts, ALERT_ATTEMPTS);
  assert.deepEqual(log.warnings, ['STEP_FAILED']);
  assert.equal(db.row.last, 'STEP_FAILED', 'provider messages never reach the stored code');
});

test('errorCode keeps stable codes only', () => {
  assert.equal(errorCode(new Error('APPLE_REVOKE_FAILED')), 'APPLE_REVOKE_FAILED');
  assert.equal(errorCode({ code: 'PROVIDER_NOT_CONFIGURED' }), 'PROVIDER_NOT_CONFIGURED');
  assert.equal(errorCode(new Error('token abc.def leaked')), 'STEP_FAILED');
  assert.equal(errorCode('x'), 'STEP_FAILED');
});

function jwt(payload) {
  const enc = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
  return `${enc({ alg: 'HS256' })}.${enc(payload)}.sig`;
}
test('re-authentication counts only a sign-in with the same provider within five minutes', () => {
  const now = NOW.getTime() / 1000;
  const fresh = jwtClaims(jwt({ iat: now - 3000, amr: [{ method: 'oauth', timestamp: now - 120 }], app_metadata: { provider: 'apple' } }));
  assert.equal(lastSignInAt(fresh), now - 120);
  assert.equal(reauthIsFresh(fresh, 'apple', NOW.getTime()), true);
  assert.equal(reauthIsFresh(fresh, 'kakao', NOW.getTime()), false, 'provider mismatch');
  const stale = jwtClaims(jwt({ iat: now - 10, amr: [{ method: 'oauth', timestamp: now - 301 }], app_metadata: { provider: 'apple' } }));
  assert.equal(reauthIsFresh(stale, 'apple', NOW.getTime()), false, 'a refreshed token keeps the old sign-in time');
  const noAmr = jwtClaims(jwt({ iat: now - 30, app_metadata: { provider: 'email' } }));
  assert.equal(reauthIsFresh(noAmr, 'email', NOW.getTime()), true);
  assert.equal(reauthIsFresh(jwtClaims('not-a-jwt'), 'email', NOW.getTime()), false);
  assert.equal(reauthIsFresh(null, 'email', NOW.getTime()), false);
});

async function testKey() {
  const pair = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
  const der = Buffer.from(await crypto.subtle.exportKey('pkcs8', pair.privateKey)).toString('base64');
  return { pair, pem: `-----BEGIN PRIVATE KEY-----\n${der}\n-----END PRIVATE KEY-----` };
}
test('without the Apple secret every call fails with a clear "secret missing" error and nothing is sent', async () => {
  assert.equal(appleConfigFromEnv(() => undefined), null);
  let sent = 0;
  const client = appleClient(null, async () => { sent++; return new Response('{}'); });
  await assert.rejects(client.exchange('code'), (error) => error instanceof ProviderNotConfiguredError && error.missing === 'APPLE_SECRET_MISSING' && error.code === 'PROVIDER_NOT_CONFIGURED');
  await assert.rejects(client.revoke({ token: 't', hint: 'refresh_token' }), ProviderNotConfiguredError);
  assert.equal(sent, 0);
});

test('Apple exchange and revoke send the documented form with a valid ES256 client secret', async () => {
  const { pair, pem } = await testKey();
  const config = { teamId: 'TEAM123456', keyId: 'KEY1234567', privateKeyPem: pem, clientId: 'com.example.app' };
  const requests = [];
  const fetchFn = async (url, init) => {
    requests.push({ url, form: new URLSearchParams(init.body) });
    if (url.endsWith('/auth/token')) return new Response(JSON.stringify({ access_token: 'a', refresh_token: 'r', id_token: 'i' }), { status: 200 });
    return new Response('', { status: 200 });
  };
  const client = appleClient(config, fetchFn, () => NOW);
  assert.deepEqual(await client.exchange('one-time-code'), { token: 'r', hint: 'refresh_token' });
  await client.revoke({ token: 'r', hint: 'refresh_token' });
  assert.equal(requests[0].url, 'https://appleid.apple.com/auth/token');
  assert.equal(requests[0].form.get('grant_type'), 'authorization_code');
  assert.equal(requests[0].form.get('code'), 'one-time-code');
  assert.equal(requests[1].url, 'https://appleid.apple.com/auth/revoke');
  assert.equal(requests[1].form.get('token_type_hint'), 'refresh_token');
  assert.equal(requests[1].form.get('client_id'), 'com.example.app');
  const [h, b, s] = requests[1].form.get('client_secret').split('.');
  assert.deepEqual(JSON.parse(Buffer.from(h, 'base64url')), { alg: 'ES256', kid: 'KEY1234567' });
  const claims = JSON.parse(Buffer.from(b, 'base64url'));
  assert.deepEqual(claims, { iss: 'TEAM123456', iat: NOW.getTime() / 1000, exp: NOW.getTime() / 1000 + 300, aud: 'https://appleid.apple.com', sub: 'com.example.app' });
  const valid = await crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, pair.publicKey, Buffer.from(s, 'base64url'), new TextEncoder().encode(`${h}.${b}`));
  assert.equal(valid, true);
  assert.equal((await clientSecret(config, NOW)).split('.').length, 3);
});

test('Apple refusing the code is an exchange error (the handler answers REAUTH_REQUIRED); a revoke error is retryable', async () => {
  const { pem } = await testKey();
  const config = { teamId: 'T', keyId: 'K', privateKeyPem: pem, clientId: 'c' };
  const refused = appleClient(config, async () => new Response('{"error":"invalid_grant"}', { status: 400 }), () => NOW);
  await assert.rejects(refused.exchange('bad'), AppleExchangeError);
  await assert.rejects(refused.revoke({ token: 't', hint: 'refresh_token' }), /APPLE_REVOKE_FAILED/);
});

test('Kakao unlink stays off behind the hidden flag and uses the admin key form when enabled', async () => {
  assert.equal(kakaoClientFromEnv(() => undefined), null);
  assert.equal(kakaoClientFromEnv((n) => (n === 'KAKAO_ADMIN_KEY' ? 'k' : undefined)), null, 'a key alone does not enable it');
  const sent = [];
  const client = kakaoClientFromEnv((n) => ({ KAKAO_UNLINK_ENABLED: 'true', KAKAO_ADMIN_KEY: 'admin' })[n], async (url, init) => { sent.push({ url, init }); return new Response('{"id":1}'); });
  await client.unlink('42');
  assert.equal(sent[0].url, 'https://kapi.kakao.com/v1/user/unlink');
  assert.equal(sent[0].init.headers.Authorization, 'KakaoAK admin');
  assert.equal(new URLSearchParams(sent[0].init.body).get('target_id'), '42');
});

test('the credential box round-trips, never stores the plain token, and refuses tampering or another key', async () => {
  const box = await credentialBox('server-secret');
  const sealed = await box.seal('{"token":"refresh-123","hint":"refresh_token"}');
  assert.ok(!sealed.includes('refresh-123'));
  assert.equal(await box.open(sealed), '{"token":"refresh-123","hint":"refresh_token"}');
  await assert.rejects((await credentialBox('other-secret')).open(sealed), /CREDENTIAL_UNREADABLE/);
  await assert.rejects(box.open(sealed.slice(0, -4) + 'AAAA'), /CREDENTIAL_UNREADABLE/);
  await assert.rejects(credentialBox(''), /MISSING_SERVER_CONFIG/);
});
