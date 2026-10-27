import type { Snapshot } from '../lib/client';
import { defaultMascotPlacement } from '../../../../packages/scene-contract/src/mascot';
export const ME = '00000000-0000-0000-0000-00000000000a';
export const PARTNER = '00000000-0000-0000-0000-00000000000b';
export function snapshotFixture(overrides: { memberCount?: number; objects?: Snapshot['sceneDocument']['objects']; promptSession?: Snapshot['promptSession']; consent?: 'granted' | 'not_given' } = {}): Snapshot {
  const memberCount = overrides.memberCount ?? 2;
  return {
    space: { spaceId: 'space-1', status: 'active', anniversaryDate: '2025-06-29', timeZone: 'Asia/Seoul', memberCount, updatedAt: '2026-10-27T00:00:00Z', invitation: null },
    features: { generation: false, generatedRender: false }, versionNumber: 1,
    sceneDocument: { schemaVersion: 1, canvasProfile: 'room-portrait-v1', objects: overrides.objects ?? [defaultMascotPlacement()], texts: [] },
    roomPresentation: { schemaVersion: 1, visible: true, x: 0.5, y: 0.17, width: 0.84, height: 0.14, styleToken: 'day.default', textScale: 1 },
    roomThemeDocument: { schemaVersion: 1, mode: 'day', timeZone: 'Asia/Seoul', day: { backgroundToken: 'room.day', paletteToken: 'warm', assetVariants: [] }, night: { backgroundToken: 'room.night', paletteToken: 'warm', assetVariants: [] } },
    promptSession: overrides.promptSession ?? null, catalogVersion: 1, serverTime: '2026-10-27T03:00:00Z',
    members: [{ userId: ME, aiConsentState: overrides.consent ?? 'granted' }, ...(memberCount > 1 ? [{ userId: PARTNER, aiConsentState: overrides.consent ?? 'granted' } as const] : [])],
    me: { userId: ME },
  };
}
