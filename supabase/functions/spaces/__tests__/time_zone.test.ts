import { assertEquals } from 'jsr:@std/assert@1';
import { call, localDeps, makeUser } from '../../_shared/__tests__/local.ts';
import { spacesHandler } from '../index.ts';
Deno.test('V0-F12-AC-05 checks zone and version', async () => {
  const h = spacesHandler(await localDeps()); const user = await makeUser('v0-tz');
  const created = await call(h, user, 'POST', '/spaces/spaces', { anniversaryDate: '2025-01-01', timeZone: 'UTC' });
  const id = created.body.spaceId;
  const snapshot = await call(h, user, 'GET', `/spaces/spaces/${id}/snapshot`);
  const path = `/spaces/spaces/${id}/time-zone`;
  assertEquals((await call(h, user, 'PATCH', path, { timeZone: 'Bad/Zone', expectedUpdatedAt: snapshot.body.space.updatedAt })).status, 400);
  assertEquals((await call(h, user, 'PATCH', path, { timeZone: 'Asia/Seoul', expectedUpdatedAt: snapshot.body.space.updatedAt })).status, 200);
  assertEquals((await call(h, user, 'PATCH', path, { timeZone: 'UTC', expectedUpdatedAt: snapshot.body.space.updatedAt })).body.error.code, 'VERSION_CONFLICT');
});
