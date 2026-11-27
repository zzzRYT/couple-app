import { assertEquals } from 'jsr:@std/assert@1';
import { call, localDeps } from '../../_shared/__tests__/local.ts';
import { couple } from '../../_shared/__tests__/fixtures.ts';
import { spacesHandler } from '../index.ts';

Deno.test('V0-F19-AC-08 V0-F19-AC-09 a partner comments on the author\'s event, the author replies, and only a writer deletes their comment', async () => {
  const deps = await localDeps();
  const h = spacesHandler(deps);
  const { a, b, c, spaceId } = await couple(deps);
  const event = await call(h, a, 'POST', `/spaces/spaces/${spaceId}/events`, { title: '저녁 약속', date: '2025-05-03', time: null, endTime: null, alert: 'none', ownerId: a.id });
  const path = `/spaces/spaces/${spaceId}/events/${event.body.id}/comments`;
  for (const bad of [{}, { body: 123 }, { body: '   ' }, { body: '가'.repeat(201) }, { body: '👨‍👩‍👧'.repeat(81) }]) {
    assertEquals((await call(h, b, 'POST', path, bad)).body.error.code, 'INVALID_REQUEST', JSON.stringify(bad));
  }
  assertEquals((await call(h, c, 'POST', path, { body: 'hi' })).status, 404, 'an outsider cannot comment');
  assertEquals((await call(h, b, 'POST', `/spaces/spaces/${spaceId}/events/nope/comments`, { body: 'hi' })).status, 404, 'a malformed event id is not found');
  const key = crypto.randomUUID();
  const partner = await call(h, b, 'POST', path, { body: '  잘 다녀와  ' }, key);
  assertEquals([partner.status, partner.body.eventId, partner.body.body, partner.body.createdBy], [201, event.body.id, '잘 다녀와', b.id]);
  assertEquals(await call(h, b, 'POST', path, { body: '  잘 다녀와  ' }, key), partner, 'a replay with the same key returns the first comment');
  const reply = await call(h, a, 'POST', path, { body: '고마워' });
  assertEquals([reply.status, reply.body.createdBy], [201, a.id]);
  for (const viewer of [a, b]) {
    const snapshot = await call(h, viewer, 'GET', `/spaces/spaces/${spaceId}/snapshot`);
    assertEquals(snapshot.body.eventComments.map((x: { id: string }) => x.id), [partner.body.id, reply.body.id]);
  }
  assertEquals((await call(h, b, 'DELETE', `${path}/${reply.body.id}`)).status, 404, 'a partner cannot delete the author\'s comment');
  assertEquals((await call(h, a, 'DELETE', `${path}/${reply.body.id}`)).status, 204);
  const after = await call(h, b, 'GET', `/spaces/spaces/${spaceId}/snapshot`);
  assertEquals(after.body.eventComments.map((x: { id: string }) => x.id), [partner.body.id]);
  assertEquals((await call(h, a, 'DELETE', `/spaces/spaces/${spaceId}/events/${event.body.id}`, { expectedVersion: 1 })).status, 204);
  const gone = await call(h, b, 'POST', path, { body: '늦었다' });
  assertEquals([gone.status, gone.body.error.code, gone.body.error.gone], [404, 'NOT_FOUND', true]);
  assertEquals((await call(h, a, 'GET', `/spaces/spaces/${spaceId}/snapshot`)).body.eventComments, []);
});
