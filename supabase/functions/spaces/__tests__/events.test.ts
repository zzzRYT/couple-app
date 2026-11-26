import { assertEquals } from 'jsr:@std/assert@1';
import { call, localDeps, makeUser } from '../../_shared/__tests__/local.ts';
import { couple } from '../../_shared/__tests__/fixtures.ts';
import { spacesHandler } from '../index.ts';

Deno.test('V0-F19-AC-03 V0-F19-AC-04 V0-F19-AC-06 calendar events validate, replay, detect conflict and deletion', async () => {
  const h = spacesHandler(await localDeps());
  const owner = await makeUser('event-owner');
  const outsider = await makeUser('event-outsider');
  const created = await call(h, owner, 'POST', '/spaces/spaces', { anniversaryDate: '2025-01-01', timeZone: 'UTC' });
  const path = `/spaces/spaces/${created.body.spaceId}/events`;
  const input = { title: '저녁 약속', date: '2025-05-03', time: '19:00', endTime: '21:00', alert: '30m', ownerId: null };
  for (const bad of [
    { title: '  ' }, { title: 'a'.repeat(21) }, { date: '2025-02-30' }, { time: '24:00' }, { time: '9:00' }, { endTime: '19:00' },
    { endTime: '18:59' }, { time: null }, { alert: 'soon' }, { time: null, endTime: null, alert: '5m' },
    { ownerId: undefined }, { ownerId: 'nope' },
  ]) assertEquals((await call(h, owner, 'POST', path, { ...input, ...bad })).body.error.code, 'INVALID_REQUEST', JSON.stringify(bad));
  assertEquals((await call(h, outsider, 'POST', path, input)).status, 404);
  const allDay = await call(h, owner, 'POST', path, { ...input, time: null, endTime: null, alert: '1d' });
  assertEquals([allDay.status, allDay.body.time, allDay.body.endTime, allDay.body.alert, allDay.body.ownerId], [201, null, null, '1d', null]);
  const key = crypto.randomUUID();
  const first = await call(h, owner, 'POST', path, input, key);
  assertEquals([first.status, first.body.title, first.body.time, first.body.endTime, first.body.createdBy], [201, '저녁 약속', '19:00', '21:00', owner.id]);
  assertEquals(await call(h, owner, 'POST', path, input, key), first);
  const item = `${path}/${first.body.id}`;
  const changed = await call(h, owner, 'PATCH', item, { ...input, title: '새 제목', endTime: null, expectedVersion: 1 });
  assertEquals([changed.body.version, changed.body.title, changed.body.endTime], [2, '새 제목', null]);
  assertEquals((await call(h, owner, 'PATCH', item, { ...input, expectedVersion: 1 })).body.error.code, 'VERSION_CONFLICT');
  const snapshot = await call(h, owner, 'GET', `/spaces/spaces/${created.body.spaceId}/snapshot`);
  assertEquals(snapshot.body.events.map((e: { id: string }) => e.id), [allDay.body.id, first.body.id]);
  assertEquals((await call(h, owner, 'DELETE', item, { expectedVersion: 2 })).status, 204);
  const gone = await call(h, owner, 'PATCH', item, { ...input, expectedVersion: 2 });
  assertEquals([gone.status, gone.body.error.code, gone.body.error.gone], [404, 'NOT_FOUND', true]);
});

Deno.test('V0-F19-AC-03 V0-F19-AC-04 an event belongs to both or one member, and a partner can change that while the author stays', async () => {
  const deps = await localDeps();
  const h = spacesHandler(deps);
  const { a, b, c, spaceId } = await couple(deps);
  const path = `/spaces/spaces/${spaceId}/events`;
  const input = { title: '데이트', date: '2025-05-03', time: null, endTime: null, alert: 'none', ownerId: a.id };
  assertEquals((await call(h, a, 'POST', path, { ...input, ownerId: c.id })).body.error.code, 'INVALID_REQUEST', 'a non-member owner is rejected');
  const mine = await call(h, a, 'POST', path, input);
  assertEquals([mine.status, mine.body.ownerId, mine.body.createdBy], [201, a.id, a.id]);
  const item = `${path}/${mine.body.id}`;
  assertEquals((await call(h, b, 'PATCH', item, { ...input, ownerId: c.id, expectedVersion: 1 })).body.error.code, 'INVALID_REQUEST', 'an edit to a non-member owner is rejected');
  const moved = await call(h, b, 'PATCH', item, { ...input, ownerId: b.id, expectedVersion: 1 });
  assertEquals([moved.body.ownerId, moved.body.createdBy, moved.body.updatedBy], [b.id, a.id, b.id]);
  const together = await call(h, b, 'PATCH', item, { ...input, ownerId: null, expectedVersion: 2 });
  assertEquals([together.body.ownerId, together.body.createdBy], [null, a.id]);
});
