import { assertEquals } from 'jsr:@std/assert@1';
import { call, localDeps, makeUser } from '../../_shared/__tests__/local.ts';
import { spacesHandler } from '../index.ts';

Deno.test('V0-F07 custom anniversaries validate, replay, detect conflict and deletion', async () => {
  const h = spacesHandler(await localDeps());
  const owner = await makeUser('anniversary-owner');
  const outsider = await makeUser('anniversary-outsider');
  const created = await call(h, owner, 'POST', '/spaces/spaces', { anniversaryDate: '2025-01-01', timeZone: 'UTC' });
  const path = `/spaces/spaces/${created.body.spaceId}/anniversaries`;
  const input = { title: '처음 만난 날', memo: null, date: '2025-05-03', repeat: 'yearly' };
  assertEquals((await call(h, owner, 'POST', path, { ...input, title: ' '.repeat(2) })).status, 400);
  assertEquals((await call(h, owner, 'POST', path, { ...input, title: 'a'.repeat(21) })).status, 400);
  assertEquals((await call(h, owner, 'POST', path, { ...input, memo: 'a'.repeat(101) })).status, 400);
  assertEquals((await call(h, outsider, 'POST', path, input)).status, 404);
  const key = crypto.randomUUID();
  const first = await call(h, owner, 'POST', path, input, key);
  assertEquals(first.status, 201);
  assertEquals(await call(h, owner, 'POST', path, input, key), first);
  const item = `${path}/${first.body.id}`;
  const changed = await call(h, owner, 'PATCH', item, { ...input, title: '새 제목', expectedVersion: 1 });
  assertEquals(changed.body.version, 2);
  assertEquals((await call(h, owner, 'PATCH', item, { ...input, expectedVersion: 1 })).body.error.code, 'VERSION_CONFLICT');
  assertEquals((await call(h, owner, 'DELETE', item, { expectedVersion: 2 })).status, 204);
  const gone = await call(h, owner, 'PATCH', item, { ...input, expectedVersion: 2 });
  assertEquals([gone.status, gone.body.error.code, gone.body.error.gone], [404, 'NOT_FOUND', true]);
});
