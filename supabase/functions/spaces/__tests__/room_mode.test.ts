import { assertEquals } from 'jsr:@std/assert@1';
import { call, localDeps, makeUser } from '../../_shared/__tests__/local.ts';
import { couple } from '../../_shared/__tests__/fixtures.ts';
import { consentingRoom } from '../../_shared/__tests__/roomFixture.ts';
import { spacesHandler } from '../index.ts';

Deno.test('shared room mode updates the room version and space time zone for both members', async () => {
  const deps = await localDeps();
  const h = spacesHandler(deps);
  const { a, b, spaceId } = await couple(deps);
  const key = crypto.randomUUID();
  const first = await call(h, a, 'PATCH', `/spaces/spaces/${spaceId}/room-mode`, { mode: 'night', timeZone: 'America/Los_Angeles', expectedCurrentVersion: 1 }, key);
  assertEquals(first, { status: 200, body: { versionNumber: 2, mode: 'night', timeZone: 'America/Los_Angeles' } });
  assertEquals(await call(h, a, 'PATCH', `/spaces/spaces/${spaceId}/room-mode`, { mode: 'day', timeZone: 'Asia/Tokyo', expectedCurrentVersion: 1 }, key), first, 'the same key replays exactly once');
  const snapshot = await call(h, b, 'GET', `/spaces/spaces/${spaceId}/snapshot`);
  assertEquals([snapshot.body.space.timeZone, snapshot.body.roomThemeDocument.mode, snapshot.body.roomThemeDocument.timeZone, snapshot.body.versionNumber], ['America/Los_Angeles', 'night', 'America/Los_Angeles', 2]);
});

Deno.test('room mode rejects invalid zones, outsiders, and stale versions', async () => {
  const h = spacesHandler(await localDeps());
  const a = await makeUser('mode-owner'), outsider = await makeUser('mode-outsider');
  const created = await call(h, a, 'POST', '/spaces/spaces', { anniversaryDate: '2025-01-01', timeZone: 'Asia/Seoul' });
  const path = `/spaces/spaces/${created.body.spaceId}/room-mode`;
  assertEquals((await call(h, a, 'PATCH', path, { mode: 'day', timeZone: 'Mars/Olympus', expectedCurrentVersion: 1 })).body.error.code, 'INVALID_REQUEST');
  assertEquals((await call(h, outsider, 'PATCH', path, { mode: 'day', timeZone: 'Asia/Seoul', expectedCurrentVersion: 1 })).status, 404);
  assertEquals((await call(h, a, 'PATCH', path, { mode: 'day', timeZone: 'Asia/Seoul', expectedCurrentVersion: 2 })).body.error.code, 'VERSION_CONFLICT');
});

Deno.test('room mode is refused while a partner holds the prompt session and works once it is released', async () => {
  const r = await consentingRoom();
  const path = `/spaces/spaces/${r.spaceId}/room-mode`;
  const sid = await r.acquire(r.b);
  const blocked = await call(r.h.spaces, r.a, 'PATCH', path, { mode: 'night', timeZone: 'Asia/Seoul', expectedCurrentVersion: 1 });
  assertEquals([blocked.status, blocked.body.error.code, blocked.body.error.sessionId], [409, 'SESSION_OCCUPIED', sid]);
  assertEquals((await call(r.h.spaces, r.a, 'GET', `/spaces/spaces/${r.spaceId}/snapshot`)).body.versionNumber, 1);
  await call(r.h.session, r.b, 'POST', `/prompt-session/spaces/${r.spaceId}/prompt-session/${sid}/release`, { reason: 'cancel' });
  assertEquals((await call(r.h.spaces, r.a, 'PATCH', path, { mode: 'night', timeZone: 'Asia/Seoul', expectedCurrentVersion: 1 })).body.versionNumber, 2);
});
