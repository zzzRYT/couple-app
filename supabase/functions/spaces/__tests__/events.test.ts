import { assertEquals } from 'jsr:@std/assert@1';
import { call, localDeps, makeUser } from '../../_shared/__tests__/local.ts';
import { spacesHandler } from '../index.ts';

Deno.test('V0-F19-AC-03 V0-F19-AC-04 V0-F19-AC-06 calendar events validate, replay, detect conflict and deletion', async () => {
  const h = spacesHandler(await localDeps());
  const owner = await makeUser('event-owner');
  const outsider = await makeUser('event-outsider');
  const created = await call(h, owner, 'POST', '/spaces/spaces', { anniversaryDate: '2025-01-01', timeZone: 'UTC' });
  const path = `/spaces/spaces/${created.body.spaceId}/events`;
  const input = { title: '저녁 약속', date: '2025-05-03', time: '19:00', endTime: '21:00', alert: '30m' };
  for (const bad of [
    { title: '  ' }, { title: 'a'.repeat(21) }, { date: '2025-02-30' }, { time: '24:00' }, { time: '9:00' }, { endTime: '19:00' },
    { endTime: '18:59' }, { time: null }, { alert: 'soon' }, { time: null, endTime: null, alert: '5m' },
  ]) assertEquals((await call(h, owner, 'POST', path, { ...input, ...bad })).body.error.code, 'INVALID_REQUEST', JSON.stringify(bad));
  assertEquals((await call(h, outsider, 'POST', path, input)).status, 404);
  const allDay = await call(h, owner, 'POST', path, { ...input, time: null, endTime: null, alert: '1d' });
  assertEquals([allDay.status, allDay.body.time, allDay.body.endTime, allDay.body.alert], [201, null, null, '1d']);
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
