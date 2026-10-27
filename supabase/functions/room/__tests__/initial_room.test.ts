import { assertEquals } from 'jsr:@std/assert@1';
import { validateScene, validateTheme, validatePresentation } from '../../../../packages/scene-contract/src/index.ts';
import { call, localDeps, makeUser } from '../../_shared/__tests__/local.ts';
import { spacesHandler } from '../../spaces/index.ts';

Deno.test('a new space starts with a room that passes the shared validator', async () => {
  const h = spacesHandler(await localDeps());
  const a = await makeUser('room-init');
  const { body } = await call(h, a, 'POST', '/spaces/spaces', { anniversaryDate: '2025-01-01', timeZone: 'Asia/Seoul' });
  const snap = (await call(h, a, 'GET', `/spaces/spaces/${body.spaceId}/snapshot`)).body;
  assertEquals(validateScene(snap.sceneDocument, new Set(['app_mascot']), { initial: true }), { ok: true, errors: [] });
  assertEquals(validateTheme(snap.roomThemeDocument).ok, true);
  assertEquals(validatePresentation(snap.roomPresentation).ok, true);
  assertEquals([snap.versionNumber, snap.roomThemeDocument.mode, snap.roomThemeDocument.timeZone, snap.catalogVersion], [1, 'follow_time', 'Asia/Seoul', 1]);
});
