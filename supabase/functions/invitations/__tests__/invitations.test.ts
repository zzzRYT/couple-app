import { assert, assertEquals, assertMatch } from 'jsr:@std/assert@1';
import { call, localDeps, makeUser, service } from '../../_shared/__tests__/local.ts';
import { invitationsHandler } from '../index.ts';
import { spacesHandler } from '../../spaces/index.ts';

const env = (name: string) => name === 'INVITE_CODE_PEPPER' ? 'test-pepper' : undefined;
async function setup() {
  const deps = await localDeps();
  return { inv: invitationsHandler(deps, env), spaces: spacesHandler(deps) };
}
async function spaceWithCode(h: Awaited<ReturnType<typeof setup>>) {
  const a = await makeUser('inv-a');
  const space = await call(h.spaces, a, 'POST', '/spaces', { anniversaryDate: '2025-01-01', timeZone: 'Asia/Seoul' });
  const issued = await call(h.inv, a, 'POST', `/invitations/spaces/${space.body.spaceId}/invitations`, { expiresInSeconds: 60 });
  return { a, spaceId: space.body.spaceId as string, issued };
}
Deno.test('issues an 8-character 4-4 code once with a fixed 24 hour expiry', async () => {
  const h = await setup();
  const { issued } = await spaceWithCode(h);
  assertEquals(issued.status, 201);
  assertMatch(issued.body.code, /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{4}-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{4}$/);
  const hours = (Date.parse(issued.body.expiresAt) - Date.now()) / 3_600_000;
  assert(hours > 23.9 && hours <= 24.01, 'server ignores expiresInSeconds');
  const { data } = await (await service()).from('invitation').select('token_hash').eq('id', issued.body.invitationId).single();
  assert(!String(data!.token_hash).includes(issued.body.code.replace('-', '')), 'raw code is not stored');
});
Deno.test('accepts normalized input, then rejects reuse and a third member', async () => {
  const h = await setup();
  const { issued } = await spaceWithCode(h);
  const b = await makeUser('inv-b'), c = await makeUser('inv-c');
  const accepted = await call(h.inv, b, 'POST', '/invitations/invitations/accept', { code: ` ${issued.body.code.toLowerCase()} ` });
  assertEquals(accepted.status, 200);
  assertEquals(accepted.body.memberCount, 2);
  assertEquals((await call(h.inv, c, 'POST', '/invitations/invitations/accept', { code: issued.body.code })).body.error.code, 'INVITE_USED');
});
Deno.test('reissue revokes the previous code and forged codes are invalid', async () => {
  const h = await setup();
  const { a, spaceId, issued } = await spaceWithCode(h);
  const again = await call(h.inv, a, 'POST', `/invitations/spaces/${spaceId}/invitations`, {});
  const b = await makeUser('inv-b');
  assertEquals((await call(h.inv, b, 'POST', '/invitations/invitations/accept', { code: issued.body.code })).body.error.code, 'INVITE_INVALID');
  assertEquals((await call(h.inv, b, 'POST', '/invitations/invitations/accept', { code: 'AAAA-AAAA' })).status, 404);
  assertEquals((await call(h.inv, b, 'POST', '/invitations/invitations/preview', { code: again.body.code })).body.anniversaryDate, '2025-01-01');
  assertEquals((await call(h.inv, b, 'POST', '/invitations/invitations/accept', { code: again.body.code })).status, 200);
});
Deno.test('a member of another active space gets 409 and the code stays usable', async () => {
  const h = await setup();
  const { issued } = await spaceWithCode(h);
  const other = await spaceWithCode(h);
  const rejected = await call(h.inv, other.a, 'POST', '/invitations/invitations/accept', { code: issued.body.code });
  assertEquals(rejected.status, 409);
  assertEquals(rejected.body.error.code, 'ALREADY_IN_SPACE');
  const b = await makeUser('inv-b');
  assertEquals((await call(h.inv, b, 'POST', '/invitations/invitations/accept', { code: issued.body.code })).status, 200);
});
Deno.test('the N+1th failed attempt is 429 and locks valid codes until the unlock time', async () => {
  const h = await setup();
  const { issued } = await spaceWithCode(h);
  const b = await makeUser('inv-b');
  for (let i = 0; i < 10; i++) assertEquals((await call(h.inv, b, 'POST', '/invitations/invitations/accept', { code: 'ZZZZ-ZZZZ' })).status, 404);
  const locked = await call(h.inv, b, 'POST', '/invitations/invitations/accept', { code: issued.body.code });
  assertEquals(locked.status, 429);
  assertEquals(locked.body.error.code, 'RATE_LIMITED');
  assert(locked.body.error.retryAfterSeconds > 3500 && locked.body.error.retryAfterSeconds <= 3600);
  assert(Date.parse(locked.body.error.unlockAt) > Date.now());
});
Deno.test('requires authentication, membership and an idempotency key', async () => {
  const h = await setup();
  const { spaceId } = await spaceWithCode(h);
  const stranger = await makeUser('inv-x');
  assertEquals((await call(h.inv, null, 'POST', '/invitations/invitations/accept', { code: 'AAAA-AAAA' })).status, 401);
  assertEquals((await call(h.inv, stranger, 'POST', `/invitations/spaces/${spaceId}/invitations`, {})).status, 404);
  assertEquals((await call(h.inv, stranger, 'POST', '/invitations/invitations/accept', { code: 'AAAA-AAAA' }, null)).status, 400);
});
