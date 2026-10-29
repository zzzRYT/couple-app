import { buildMilestonePreset } from '../../../../../supabase/functions/_shared/milestonePresets';

const assets = ['obj_party_cake', 'obj_party_balloon', 'obj_party_ribbon', 'obj_shape_sparkle', 'obj_keep_gift'];
const input = (overrides: Record<string, unknown> = {}) => ({
  scene: { schemaVersion: 1 as const, canvasProfile: 'room-portrait-v1' as const, objects: [{ assetId: 'app_mascot', x: 0.5, y: 0.72, width: 0.2, height: 0.2, rotationDeg: 0, zIndex: 1, opacity: 1 }], texts: [] },
  roomPresentation: { schemaVersion: 1, visible: true, x: 0.5, y: 0.17, width: 0.84, height: 0.14, styleToken: 'day.default', textScale: 1 },
  roomThemeDocument: { schemaVersion: 1, mode: 'follow_time', timeZone: 'Asia/Seoul', day: { backgroundToken: 'room.day', paletteToken: 'room.day', assetVariants: [] }, night: { backgroundToken: 'room.night', paletteToken: 'room.night', assetVariants: [] } },
  key: 'd100', kind: 'day' as const, days: 100, anniversaryN: null, locale: 'ko-KR', activeAssetIds: assets, ...overrides,
});

it('places the day catalog preset in priority order with one localized keepsake text', () => {
  const result = buildMilestonePreset(input());
  expect(result.placed).toBe(5);
  expect(result.candidate.sceneDocument).toMatchObject({ objects: expect.arrayContaining([expect.objectContaining({ assetId: 'obj_party_cake' })]), texts: [expect.objectContaining({ text: '우리 100일' })] });
});

it('includes the anniversary gift and obeys the 16 object / 3 text limits', () => {
  const result = buildMilestonePreset(input({ kind: 'anniversary', anniversaryN: 1, days: null,
    scene: { ...input().scene, objects: [...input().scene.objects, ...Array.from({ length: 9 }, (_, i) => ({ assetId: 'obj_party_ribbon', x: 0.08 + i * 0.09, y: 0.55, width: 0.04, height: 0.04, rotationDeg: 0, zIndex: i + 2, opacity: 1 }))], texts: Array.from({ length: 3 }, () => ({ text: 'old', x: 0.5, y: 0.2, width: 0.3, height: 0.05, rotationDeg: 0, zIndex: 3, styleToken: 'text.primary' as const })) } }));
  expect((result.candidate.sceneDocument as { objects: unknown[]; texts: unknown[] }).objects.length).toBeLessThanOrEqual(16);
  expect((result.candidate.sceneDocument as { objects: unknown[]; texts: unknown[] }).texts).toHaveLength(3);
});

it('fails when no object can be placed and does not invent catalog entries', () => {
  expect(() => buildMilestonePreset(input({ scene: { ...input().scene, objects: Array.from({ length: 16 }, (_, i) => ({ assetId: i === 0 ? 'app_mascot' : 'obj_party_cake', x: 0.5, y: 0.72, width: 0.2, height: 0.2, rotationDeg: 0, zIndex: i, opacity: 1 })) } }))).toThrow('ROOM_FULL');
  expect(() => buildMilestonePreset(input({ activeAssetIds: [] }))).toThrow('ROOM_FULL');
});
