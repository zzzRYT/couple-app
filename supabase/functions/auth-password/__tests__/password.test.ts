// Email and password against the local stack (`supabase start`): the real Auth server, migration and counters.
import { assert, assertEquals, assertNotEquals } from 'jsr:@std/assert@1';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { call, localDeps, localEnv, service, sql } from '../../_shared/__tests__/local.ts';
import { passwordHandler, type PasswordDeps } from '../index.ts';
import { authProvider } from '../provider.ts';
import { attemptKey, passwordIsAllowed } from '../rules.ts';

const PASSWORD = 'first-pass-1234';
const NEXT_PASSWORD = ['second', 'pass', '5678'].join('-');
const SECRET = 'test-attempt-secret';
async function handler(overrides: Partial<PasswordDeps> = {}) {
  const env = await localEnv();
  const db = await service();
  return passwordHandler({
    ...(await localDeps()), provider: authProvider(env.url, env.anonKey), attemptSecret: SECRET, sleep: () => Promise.resolve(),
    async emailOf(userId) { return (await db.auth.admin.getUserById(userId)).data.user?.email || null; },
    ...overrides,
  });
}
const address = (label: string) => `${label}-${crypto.randomUUID()}@example.invalid`;
async function makeAccount(label: string, password = PASSWORD) {
  const email = address(label);
  const { data, error } = await (await service()).auth.admin.createUser({ email, password, email_confirm: true });
  if (error || !data.user) throw error ?? new Error('createUser failed');
  return { id: data.user.id, email };
}
/** Turns an email test user into what Sign in with Apple leaves behind: an Apple identity, no password. */
async function makeAppleAccount(label: string) {
  const account = await makeAccount(label);
  await sql(`update auth.identities set provider='apple', provider_id='apple-${account.id}' where user_id='${account.id}'; update auth.users set encrypted_password=null, raw_app_meta_data='{"provider":"apple","providers":["apple"]}' where id='${account.id}'`);
  return account;
}
/** A session the way a mail link or Apple leaves one: `amr` says `otp`, not `password`. */
async function linkSession(email: string) {
  const db = await service();
  const env = await localEnv();
  const link = await db.auth.admin.generateLink({ type: 'magiclink', email });
  const anon = createClient(env.url, env.anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await anon.auth.verifyOtp({ type: 'magiclink', token_hash: link.data.properties!.hashed_token });
  if (error || !data.session) throw error ?? new Error('verify failed');
  return data.session;
}
const login = async (h: (r: Request) => Promise<Response>, email: string, password: string) => await call(h, null, 'POST', '/auth-password/auth-password/login', { email, password }, null);
const decode = (token: string) => JSON.parse(atob(token.split('.')[1]!.replace(/-/g, '+').replace(/_/g, '/')));
async function setting(key: string, value: string, run: () => Promise<void>) {
  const previous = await sql(`select value::text from public.app_settings where key='${key}'`);
  await sql(`update public.app_settings set value='${value}' where key='${key}'`);
  try { await run(); } finally { await sql(`update public.app_settings set value='${previous}' where key='${key}'`); }
}

Deno.test('V0-F15-AC-04 a right password signs in and clears the failures', async () => {
  const h = await handler();
  const account = await makeAccount('login');
  assertEquals((await login(h, account.email, 'wrong-pass-1')).status, 401);
  const key = await attemptKey(account.email, SECRET);
  assertEquals(await sql(`select failures from public.password_attempt where key_hash='${key}'`), '1');
  const res = await login(h, account.email.toUpperCase(), PASSWORD);
  assertEquals(res.status, 200);
  assertEquals(decode(res.body.accessToken).sub, account.id);
  assertEquals(await sql(`select count(*) from public.password_attempt where key_hash='${key}'`), '0');
});

Deno.test('V0-F15-AC-02 a wrong password and an unknown email get the same answer, after the same minimum time', async () => {
  const waits: number[] = [];
  const h = await handler({ sleep: (ms) => { waits.push(ms); return Promise.resolve(); } });
  const account = await makeAccount('same');
  const wrong = await login(h, account.email, 'wrong-pass-1');
  const unknown = await login(h, address('nobody'), 'wrong-pass-1');
  assertEquals(wrong, unknown);
  assertEquals(wrong, { status: 401, body: { error: { code: 'INVALID_LOGIN', retryable: false } } });
  assertEquals(waits.length, 2, 'both answers wait for the floor');
});

Deno.test('V0-F15-AC-03 five failures lock the email for ten minutes, known or not', async () => {
  const h = await handler();
  const account = await makeAccount('lock');
  const stranger = address('stranger');
  for (const email of [account.email, stranger]) {
    for (let i = 0; i < 4; i++) assertEquals((await login(h, email, 'wrong-pass-1')).body.error.code, 'INVALID_LOGIN');
    assertEquals((await login(h, email, 'wrong-pass-1')).body.error.code, 'LOGIN_LOCKED', 'the fifth failure says so at once');
  }
  const locked = await login(h, account.email, PASSWORD);
  assertEquals(locked, { status: 429, body: { error: { code: 'LOGIN_LOCKED', retryable: false } } });
  assertEquals(await login(h, stranger, PASSWORD), locked);
  const key = await attemptKey(account.email, SECRET);
  const left = Number(await sql(`select extract(epoch from locked_until - now()) from public.password_attempt where key_hash='${key}'`));
  assert(left > 590 && left <= 600, `locked for ${left}s`);
  await sql(`update public.password_attempt set locked_until=now() - interval '1 second' where key_hash='${key}'`);
  assertEquals((await login(h, account.email, PASSWORD)).status, 200, 'the lock ends after ten minutes');
});

Deno.test('V0-F15-AC-03 parallel guesses cannot pass the limit', async () => {
  let checked = 0;
  const env = await localEnv();
  const real = authProvider(env.url, env.anonKey);
  const h = await handler({ provider: { ...real, grant: (...args) => { checked++; return real.grant(...args); } } });
  const account = await makeAccount('parallel');
  await Promise.all(Array.from({ length: 12 }, () => login(h, account.email, 'wrong-pass-1')));
  assertEquals(checked, 5);
});

Deno.test('V0-F15-AC-03 an Auth outage does not count as a failure', async () => {
  const env = await localEnv();
  const h = await handler({ provider: { ...authProvider(env.url, env.anonKey), grant: () => Promise.resolve({ kind: 'unavailable' }) } });
  const email = address('outage');
  assertEquals((await login(h, email, 'wrong-pass-1')).body.error.code, 'RATE_LIMITED');
  assertEquals(await sql(`select failures from public.password_attempt where key_hash='${await attemptKey(email, SECRET)}'`), '0');
});

Deno.test('V0-F15-AC-05 with mail off, sign-up is closed in the function and in Auth, and only the review address passes', async () => {
  const h = await handler();
  const env = await localEnv();
  await setting('auth_email_enabled', 'false', async () => {
    const closed = await call(h, null, 'POST', '/auth-password/auth-password/signup', { email: address('closed'), password: PASSWORD, termsAccepted: true }, null);
    assertEquals(closed.body.error.code, 'MAIL_NOT_CONNECTED');
    const anon = createClient(env.url, env.anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
    assert((await anon.auth.signUp({ email: address('direct'), password: PASSWORD })).error, 'a direct Auth sign-up fails');
    assert((await (await service()).auth.admin.createUser({ email: address('admin'), password: PASSWORD, email_confirm: true })).error, 'so does an admin create');
    const review = address('review');
    await setting('review_login_email', JSON.stringify(review.toUpperCase()), async () => {
      assertEquals((await (await service()).auth.admin.createUser({ email: review, password: PASSWORD, email_confirm: true })).error, null);
    });
    assertEquals((await login(h, review, PASSWORD)).status, 200, 'sign-in stays open');
  });
});

Deno.test('V0-F15-AC-06 with mail on, the server applies the board rules and answers the same for an existing email', async () => {
  const h = await handler();
  const signup = (email: string, password: string, termsAccepted = true) => call(h, null, 'POST', '/auth-password/auth-password/signup', { email, password, termsAccepted, redirectTo: 'aroom://auth-callback' }, null);
  const email = address('signup');
  assertEquals((await signup(email, 'short1')).body.error.code, 'WEAK_PASSWORD');
  assertEquals((await signup(email, 'lettersonly')).body.error.code, 'WEAK_PASSWORD');
  assertEquals((await signup(email, '1234567890')).body.error.code, 'WEAK_PASSWORD');
  assertEquals((await signup('same1234@example.invalid', 'SAME1234@example.invalid')).body.error.code, 'WEAK_PASSWORD');
  assertEquals((await signup(email, PASSWORD, false)).status, 400);
  const fresh = await signup(email, PASSWORD);
  assertEquals(fresh, { status: 202, body: { state: 'sent' } });
  assertEquals(await signup((await makeAccount('existing')).email, PASSWORD), fresh);
  assertEquals((await login(h, email, PASSWORD)).body.error.code, 'INVALID_LOGIN', 'an unconfirmed email cannot sign in, and the answer does not say why');
});

Deno.test('V0-F15-AC-10 mail counts as connected only with the value on and Auth confirming email', async () => {
  const env = await localEnv();
  const real = authProvider(env.url, env.anonKey);
  const config = async (h: (r: Request) => Promise<Response>) => (await call(h, null, 'GET', '/auth-password/auth-password/config')).body.mail;
  assertEquals(await config(await handler()), true);
  const autoconfirm = await handler({ provider: { ...real, autoconfirms: () => Promise.resolve(true) } });
  assertEquals(await config(autoconfirm), false);
  assertEquals((await call(autoconfirm, null, 'POST', '/auth-password/auth-password/signup', { email: address('auto'), password: PASSWORD, termsAccepted: true }, null)).body.error.code, 'MAIL_NOT_CONNECTED');
  await setting('auth_email_enabled', 'false', async () => assertEquals(await config(await handler()), false));
});

Deno.test('V0-F15-AC-11 a password reaches no log, response, attempt row or idempotency row', async () => {
  const secret = `Secret-${crypto.randomUUID()}`;
  const h = await handler();
  const account = await makeAccount('quiet', secret);
  const lines: string[] = [];
  const original = console.log;
  console.log = (line: string) => lines.push(String(line));
  try {
    const signedIn = await login(h, account.email, secret);
    const user = { id: account.id, token: signedIn.body.accessToken as string };
    await login(h, account.email, `${secret}x`);
    const verified = await call(h, user, 'POST', '/auth-password/auth-password/verify', { password: secret }, 'pw-key');
    await call(h, { ...user, token: verified.body.accessToken }, 'POST', '/auth-password/auth-password/set', { currentPassword: secret, newPassword: `${secret}2` }, 'pw-key-2');
  } finally { console.log = original; }
  const text = lines.join('\n');
  assert(lines.length >= 4);
  assert(!text.includes(secret) && !text.includes(account.email), text);
  assertEquals(await sql(`select count(*) from public.idempotency_key where user_id='${account.id}'`), '0', 'password routes skip the idempotency store');
  assertEquals(await sql(`select count(*) from public.password_attempt where key_hash like '%@%'`), '0');
  assert(await sql(`select encrypted_password from auth.users where id='${account.id}'`).then((hash) => String(hash).startsWith('$2')), 'only the provider hash exists');
});

Deno.test('V0-F16-AC-04 an Apple account that made a password signs in with its email and stays Apple', async () => {
  const h = await handler();
  const account = await makeAppleAccount('apple-pw');
  assertEquals((await login(h, account.email, PASSWORD)).body.error.code, 'INVALID_LOGIN', 'no password yet');
  const session = await linkSession(account.email);
  const user = { id: account.id, token: session.access_token };
  assertEquals((await call(h, user, 'GET', '/auth-password/auth-password/state')).body, { hasPassword: false, promptSeen: false, email: account.email });
  assertEquals((await call(h, user, 'POST', '/auth-password/auth-password/set', { newPassword: 'made-by-apple-1' })).body, { state: 'saved' });
  assertEquals((await call(h, user, 'GET', '/auth-password/auth-password/state')).body.hasPassword, true);
  const res = await login(h, account.email, 'made-by-apple-1');
  const claims = decode(res.body.accessToken);
  assertEquals(claims.sub, account.id);
  assertEquals(claims.app_metadata.provider, 'apple');
  assertEquals(claims.amr[0].method, 'password');
});

Deno.test('V0-F16-AC-01 the prompt is remembered on the server', async () => {
  const h = await handler();
  const account = await makeAppleAccount('prompt');
  const user = { id: account.id, token: (await linkSession(account.email)).access_token };
  assertEquals((await call(h, user, 'POST', '/auth-password/auth-password/prompt-seen')).body, { state: 'seen' });
  assertEquals((await call(h, user, 'GET', '/auth-password/auth-password/state')).body.promptSeen, true);
});

Deno.test('V0-F16-AC-05 an account with no email cannot make a password it could not use', async () => {
  const h = await handler({ emailOf: () => Promise.resolve(null) });
  const account = await makeAppleAccount('no-email');
  const user = { id: account.id, token: (await linkSession(account.email)).access_token };
  assertEquals((await call(h, user, 'POST', '/auth-password/auth-password/set', { newPassword: 'made-by-apple-1' })).body.error.code, 'EMAIL_REQUIRED');
  assertEquals((await call(h, user, 'POST', '/auth-password/auth-password/verify', { password: 'made-by-apple-1' })).body.error.code, 'EMAIL_REQUIRED');
  assertEquals((await call(h, user, 'GET', '/auth-password/auth-password/state')).body.email, null);
});

Deno.test('V0-F17-AC-02 changing the password ends other devices and keeps this one', async () => {
  const h = await handler();
  const env = await localEnv();
  const account = await makeAccount('change');
  const here = await login(h, account.email, PASSWORD);
  const there = await login(h, account.email, PASSWORD);
  const user = { id: account.id, token: here.body.accessToken as string };
  assertEquals((await call(h, user, 'POST', '/auth-password/auth-password/set', { currentPassword: PASSWORD, newPassword: NEXT_PASSWORD })).body, { state: 'saved' });
  const refresh = async (token: string) => (await fetch(`${env.url}/auth/v1/token?grant_type=refresh_token`, { method: 'POST', headers: { apikey: env.anonKey, 'Content-Type': 'application/json' }, body: JSON.stringify({ refresh_token: token }) })).status;
  assertEquals(await refresh(here.body.refreshToken), 200);
  assertEquals(await refresh(there.body.refreshToken), 400);
  assertEquals((await login(h, account.email, NEXT_PASSWORD)).status, 200);
  assertEquals((await login(h, account.email, PASSWORD)).status, 401);
});

Deno.test('V0-F17-AC-03 a wrong current password is refused and shares the sign-in lock', async () => {
  const h = await handler();
  const account = await makeAccount('wrong-current');
  const user = { id: account.id, token: (await login(h, account.email, PASSWORD)).body.accessToken as string };
  const change = () => call(h, user, 'POST', '/auth-password/auth-password/set', { currentPassword: 'wrong-pass-1', newPassword: NEXT_PASSWORD });
  assertEquals((await change()).status, 403);
  assertEquals((await change()).body.error.code, 'WRONG_PASSWORD');
  for (let i = 0; i < 2; i++) await login(h, account.email, 'wrong-pass-1');
  assertEquals((await change()).body.error.code, 'LOGIN_LOCKED');
  assertEquals((await login(h, account.email, PASSWORD)).body.error.code, 'LOGIN_LOCKED');
  assertEquals((await call(h, user, 'POST', '/auth-password/auth-password/set', { currentPassword: PASSWORD, newPassword: 'short' })).body.error.code, 'WEAK_PASSWORD');
});

Deno.test('V0-F17-AC-04 without the current password a fresh Apple or mail sign-in is required, and a password session is not enough', async () => {
  const h = await handler();
  const account = await makeAccount('forgot');
  const passwordSession = { id: account.id, token: (await login(h, account.email, PASSWORD)).body.accessToken as string };
  assertEquals((await call(h, passwordSession, 'POST', '/auth-password/auth-password/set', { newPassword: NEXT_PASSWORD })).body.error.code, 'REAUTH_REQUIRED');
  const later = await handler({ now: () => new Date(Date.now() + 10 * 60 * 1000) });
  const proved = { id: account.id, token: (await linkSession(account.email)).access_token };
  assertEquals((await call(later, proved, 'POST', '/auth-password/auth-password/set', { newPassword: NEXT_PASSWORD })).body.error.code, 'REAUTH_REQUIRED', 'the proof expires');
  assertEquals((await call(h, proved, 'POST', '/auth-password/auth-password/set', { newPassword: NEXT_PASSWORD })).body, { state: 'saved' });
});

Deno.test('verify swaps the session for one that proves the password', async () => {
  const h = await handler();
  const account = await makeAccount('verify');
  const first = await login(h, account.email, PASSWORD);
  const res = await call(h, { id: account.id, token: first.body.accessToken }, 'POST', '/auth-password/auth-password/verify', { password: PASSWORD });
  assertEquals(res.status, 200);
  assertNotEquals(res.body.accessToken, first.body.accessToken);
  assertEquals(await sql(`select count(*) from auth.sessions where user_id='${account.id}'`), '1');
  assertEquals((await call(h, { id: account.id, token: res.body.accessToken }, 'POST', '/auth-password/auth-password/verify', { password: 'wrong-pass-1' })).status, 403);
});

Deno.test('the board rules', () => {
  assertEquals(passwordIsAllowed('abcd1234', 'a@b.co'), true);
  assertEquals(passwordIsAllowed('abc1234', 'a@b.co'), false);
  assertEquals(passwordIsAllowed('abcdefgh', 'a@b.co'), false);
  assertEquals(passwordIsAllowed('12345678', 'a@b.co'), false);
  assertEquals(passwordIsAllowed('haru1234@b.co', ' HARU1234@B.CO '), false);
  assertEquals(passwordIsAllowed(`a1${'가'.repeat(30)}`, 'a@b.co'), false, 'longer than bcrypt reads');
});
