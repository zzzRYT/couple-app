import { assertEquals } from 'jsr:@std/assert@1';
import { validateCandidate } from '../sceneValidate.ts';
const theme = { schemaVersion: 1, mode: 'follow_time', timeZone: 'Asia/Seoul', day: { backgroundToken: 'room.day', paletteToken: 'room.day', assetVariants: [] }, night: { backgroundToken: 'room.night', paletteToken: 'room.night', assetVariants: [] } };
const presentation = { schemaVersion: 1, visible: true, x: 0.5, y: 0.17, width: 0.84, height: 0.14, styleToken: 'day.default', textScale: 1 };
const mascot = { assetId: 'app_mascot', x: 0.5, y: 0.72, width: 0.2, height: 0.2, rotationDeg: 0, zIndex: 1, opacity: 1 };
const scene = (objects: unknown[]) => ({ schemaVersion: 1, canvasProfile: 'room-portrait-v1', objects, texts: [] });
Deno.test('accepts the initial room and catalog placements', () => {
  assertEquals(validateCandidate({ sceneDocument: scene([mascot, { ...mascot, assetId: 'obj_sky_star', y: 0.4 }]), roomPresentation: presentation, roomThemeDocument: theme }, ['obj_sky_star']).ok, true);
});
Deno.test('rejects unknown assets and protected-zone intrusions with error paths', () => {
  const result = validateCandidate({ sceneDocument: scene([mascot, { ...mascot, assetId: 'obj_unknown', y: 0.4 }, { ...mascot, assetId: 'obj_sky_star', y: 0.02 }]), roomPresentation: presentation, roomThemeDocument: theme }, ['obj_sky_star']);
  assertEquals(result.errors, [{ path: '/objects/1/assetId', code: 'assetId' }]);
  const zone = validateCandidate({ sceneDocument: scene([mascot, { ...mascot, assetId: 'obj_sky_star', y: 0.02 }]), roomPresentation: presentation, roomThemeDocument: theme }, ['obj_sky_star']);
  assertEquals(zone.errors, [{ path: '/objects/1', code: 'protectedZone' }]);
});
