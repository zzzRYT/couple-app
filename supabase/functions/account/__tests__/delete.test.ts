// T151: account deletion end to end against the local stack (`supabase start`). Email test users sign in with a password,
// so their tokens carry a fresh `amr` entry and `app_metadata.provider = email`.
import { assert, assertEquals, assertNotEquals } from 'jsr:@std/assert@1';
import { call, localDeps, localEnv, makeUser, service } from '../../_shared/__tests__/local.ts';
import { consentingRoom } from '../../_shared/__tests__/roomFixture.ts';
import { HOME_COVER_BUCKET } from '../../lifecycle-sweep/index.ts';
import { spacesHandler } from '../../spaces/index.ts';
import { invitationsHandler } from '../../invitations/index.ts';
import { accountHandler } from '../index.ts';
import { defaultDeletionPorts } from '../ports.ts';

async function handler(now?: () => Date) {
  const env = await localEnv();
  const vars: Record<string, string> = { SUPABASE_URL: env.url, SUPABASE_SERVICE_ROLE_KEY: env.serviceKey };
  const wiring = await defaultDeletionPorts((name) => vars[name]);
  return accountHandler({ ...(await localDeps(now ? { now } : {})), ...wiring });
}
const remove = { confirm: true, reauth: { provider: 'email' } };
async function count(table: string, column: string, value: string) {
  const { count, error } = await (await service()).from(table).select('*', { count: 'exact', head: true }).eq(column, value);
  if (error) throw error;
  return count ?? 0;
}

Deno.test('① without a recent sign-in the request is refused and nothing changes', async () => {
  const r = await consentingRoom();
  const later = await handler(() => new Date(Date.now() + 10 * 60 * 1000));
  const res = await call(later, r.a, 'POST', '/account/account/deletion', remove);
  assertEquals(res.status, 401);
  assertEquals(res.body.error.code, 'REAUTH_REQUIRED');
  assertEquals((await r.snapshot(r.a)).status, 200, 'the space is untouched');
});

Deno.test('③④⑤⑧⑨⑩ a member of an active space: accepted, space purged at once, partner told without a name, account gone', async () => {
  const r = await consentingRoom();
  const db = await service();
  const sid = await r.acquire(r.a);
  assert(sid);
  const bucket = db.storage.from(HOME_COVER_BUCKET);
  await db.storage.createBucket(HOME_COVER_BUCKET, { public: false }).catch(() => undefined);
  await bucket.upload(`${r.spaceId}/current.jpg`, new Blob(['x'], { type: 'image/jpeg' }));
  const h = await handler();
  const res = await call(h, r.a, 'DELETE', '/account/account', remove);
  assertEquals(res, { status: 202, body: { state: 'requested' } });
  assertEquals(await count('couple_space', 'id', r.spaceId), 0, 'deleted right away, no 30-day wait');
  assertEquals((await bucket.list(r.spaceId)).data?.length ?? 0, 0, 'Storage objects went first');
  assertEquals(await count('user_profile', 'user_id', r.a.id), 0, 'no profile shell');
  assertEquals((await db.auth.admin.getUserById(r.a.id)).data.user, null, 'the auth user is hard-deleted');
  const { data: row } = await db.from('account_deletion').select('state, provider_credential_enc').eq('user_id', r.a.id).single();
  assertEquals(row, { state: 'done', provider_credential_enc: null });
  const spaces = spacesHandler(await localDeps());
  const mine = await call(spaces, r.b, 'GET', '/spaces/spaces/mine');
  assertEquals(mine.body.ended.kind, 'account_deleted');
  assertEquals(mine.body.ended.by, 'partner');
  assert(!JSON.stringify(mine.body).includes(r.a.id), 'the deleter is not named');
  assertEquals((await call(spaces, r.a, 'GET', '/spaces/spaces/mine')).status, 401, 'the old token is refused even before it expires');
  assertEquals((await call(h, r.a, 'POST', '/account/account/deletion', remove)).status, 401, 'a retry after acceptance is a local sign-out for the app');
});

Deno.test('② alone with a pending invite: the code is revoked, nobody is notified', async () => {
  const solo = await makeUser('acct-solo');
  const spaces = spacesHandler(await localDeps());
  const created = await call(spaces, solo, 'POST', '/spaces/spaces', { anniversaryDate: '2025-01-01', timeZone: 'Asia/Seoul' });
  const invites = invitationsHandler(await localDeps(), () => 'test-pepper');
  assertEquals((await call(invites, solo, 'POST', `/invitations/spaces/${created.body.spaceId}/invitations`, { expiresInSeconds: 86400 })).status, 201);
  assertEquals((await call(await handler(), solo, 'POST', '/account/account/deletion', remove)).status, 202);
  assertEquals(await count('invitation', 'created_by_user_id', solo.id), 0, 'invites went with the purged space');
  assertEquals(await count('space_end_notice', 'by_user_id', solo.id), 0);
});

Deno.test('⑥ the same login signs up again as a new, empty account', async () => {
  const admin = await service();
  const email = `acct-again-${crypto.randomUUID()}@example.invalid`, password = crypto.randomUUID();
  const first = (await admin.auth.admin.createUser({ email, password, email_confirm: true })).data.user!;
  const env = await localEnv();
  const { createClient } = await import('npm:@supabase/supabase-js@2');
  const anon = createClient(env.url, env.anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const signed = await anon.auth.signInWithPassword({ email, password });
  assertEquals((await call(await handler(), { id: first.id, token: signed.data.session!.access_token }, 'POST', '/account/account/deletion', remove)).status, 202);
  const again = (await admin.auth.admin.createUser({ email, password, email_confirm: true })).data.user!;
  assertNotEquals(again.id, first.id);
  const token = (await anon.auth.signInWithPassword({ email, password })).data.session!.access_token;
  const mine = await call(spacesHandler(await localDeps()), { id: again.id, token }, 'GET', '/spaces/spaces/mine');
  assertEquals(mine.body, { active: null, ended: null });
});
