import { assertEquals } from 'jsr:@std/assert@1';
import { call, localDeps, makeUser, service } from '../../_shared/__tests__/local.ts';
import { spacesHandler } from '../index.ts';

Deno.test('creates a space, rejects a second one and reports mine', async () => {
  const h = spacesHandler(await localDeps());
  const a = await makeUser('sp-a');
  assertEquals((await call(h, a, 'GET', '/spaces/spaces/mine')).body, { active: null, ended: null });
  const created = await call(h, a, 'POST', '/spaces/spaces', { anniversaryDate: '2025-01-01', timeZone: 'Asia/Seoul' });
  assertEquals(created.status, 201);
  assertEquals({ ...created.body, spaceId: 'x' }, { spaceId: 'x', status: 'active', memberCount: 1, anniversaryDate: '2025-01-01' });
  assertEquals((await call(h, a, 'POST', '/spaces/spaces', { anniversaryDate: '2025-01-01', timeZone: 'Asia/Seoul' })).body.error.code, 'ALREADY_IN_SPACE');
  assertEquals((await call(h, a, 'GET', '/spaces/spaces/mine')).body.active, { spaceId: created.body.spaceId });
});
Deno.test('rejects malformed, nonexistent and future dates', async () => {
  const h = spacesHandler(await localDeps());
  const a = await makeUser('sp-d');
  for (const anniversaryDate of ['2026-02-30', '2999-01-01', 'nope']) {
    assertEquals((await call(h, a, 'POST', '/spaces/spaces', { anniversaryDate, timeZone: 'Asia/Seoul' })).status, 400);
  }
});
Deno.test('same idempotency key replays the first response', async () => {
  const h = spacesHandler(await localDeps());
  const a = await makeUser('sp-i'), key = crypto.randomUUID();
  const first = await call(h, a, 'POST', '/spaces/spaces', { anniversaryDate: '2025-01-01', timeZone: 'Asia/Seoul' }, key);
  const second = await call(h, a, 'POST', '/spaces/spaces', { anniversaryDate: '2025-01-01', timeZone: 'Asia/Seoul' }, key);
  assertEquals(second, first);
});
Deno.test('snapshot is members-only and ended spaces are 404', async () => {
  const h = spacesHandler(await localDeps());
  const a = await makeUser('sp-s'), c = await makeUser('sp-c');
  const { body } = await call(h, a, 'POST', '/spaces/spaces', { anniversaryDate: '2025-01-01', timeZone: 'Asia/Seoul' });
  const snap = await call(h, a, 'GET', `/spaces/spaces/${body.spaceId}/snapshot`);
  assertEquals(snap.status, 200);
  assertEquals(snap.body.space.memberCount, 1);
  assertEquals((await call(h, c, 'GET', `/spaces/spaces/${body.spaceId}/snapshot`)).status, 404);
  await (await service()).from('couple_space').update({ status: 'ended' }).eq('id', body.spaceId);
  assertEquals((await call(h, a, 'GET', `/spaces/spaces/${body.spaceId}/snapshot`)).status, 404);
});
Deno.test('anniversary update checks the expected timestamp', async () => {
  const h = spacesHandler(await localDeps());
  const a = await makeUser('sp-u');
  const { body } = await call(h, a, 'POST', '/spaces/spaces', { anniversaryDate: '2025-01-01', timeZone: 'Asia/Seoul' });
  const snap = await call(h, a, 'GET', `/spaces/spaces/${body.spaceId}/snapshot`);
  const ok = await call(h, a, 'PATCH', `/spaces/spaces/${body.spaceId}/anniversary`, { anniversaryDate: '2024-12-24', expectedUpdatedAt: snap.body.space.updatedAt });
  assertEquals(ok.status, 200);
  assertEquals(ok.body.milestonesReset, []);
  const stale = await call(h, a, 'PATCH', `/spaces/spaces/${body.spaceId}/anniversary`, { anniversaryDate: '2024-12-25', expectedUpdatedAt: snap.body.space.updatedAt });
  assertEquals(stale.body.error.code, 'VERSION_CONFLICT');
});
