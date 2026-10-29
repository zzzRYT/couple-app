import { assertEquals } from 'jsr:@std/assert@1';
import { milestonesHandler } from '../index.ts';
import type { Deps } from '../../_shared/http.ts';

const spaceId = '00000000-0000-4000-8000-000000000001';
const sessionId = '00000000-0000-4000-8000-000000000002';
const celebrationId = '00000000-0000-4000-8000-000000000003';
const sceneDocument = { schemaVersion: 1, canvasProfile: 'room-portrait-v1', objects: [
  { assetId: 'app_mascot', x: 0.5, y: 0.72, width: 0.2, height: 0.2, rotationDeg: 0, zIndex: 1, opacity: 1 },
], texts: [] };
const roomPresentation = { schemaVersion: 1, visible: true, x: 0.5, y: 0.17, width: 0.84, height: 0.14, styleToken: 'day.default', textScale: 1 };
const roomThemeDocument = { schemaVersion: 1, mode: 'follow_time', timeZone: 'Asia/Seoul',
  day: { backgroundToken: 'room.day', paletteToken: 'room.day', assetVariants: [] },
  night: { backgroundToken: 'room.night', paletteToken: 'room.night', assetVariants: [] } };
const activeAssetIds = ['obj_party_cake','obj_party_balloon','obj_party_ribbon','obj_shape_sparkle','obj_keep_gift'];

function deps(room = { sceneDocument, roomPresentation, roomThemeDocument, activeAssetIds, key: 'd100', kind: 'day', days: 100, anniversaryN: null, baseVersion: 4 }) {
  const calls: string[] = [];
  const dependencies: Deps = {
    db: { async rpc<T = unknown>(name: string): Promise<T> {
      calls.push(name);
      if (name === 'begin_milestone_preset') return room as T;
      if (name === 'store_milestone_preset') return { previewId: celebrationId, placed: 5, requested: 5 } as T;
      throw new Error(`unexpected rpc: ${name}`);
    } },
    verifier: { async getUser() { return { user: { id: 'user-a' }, error: null }; } },
    idempotency: { async get() { return undefined; }, async put() {} },
  };
  return { dependencies, calls };
}

async function request(handler: (request: Request) => Promise<Response>) {
  return await handler(new Request(`http://local/functions/v1/spaces/${spaceId}/prompt-session/${sessionId}/milestone-preview`, {
    method: 'POST', headers: { Authorization: 'Bearer test-token', 'Content-Type': 'application/json', 'Idempotency-Key': '00000000-0000-4000-8000-000000000004' },
    body: JSON.stringify({ celebrationId, locale: 'ko-KR' }),
  }));
}

Deno.test('milestone preset preview stores a localized catalog candidate without invoking AI or quota RPCs', async () => {
  const { dependencies, calls } = deps();
  const response = await request(milestonesHandler(dependencies));
  assertEquals(response.status, 201);
  assertEquals(calls, ['begin_milestone_preset','store_milestone_preset']);
  const body = await response.json();
  assertEquals([body.placed, body.requested], [5,5]);
});

Deno.test('a room with no available object slots returns ROOM_FULL without storing a preview', async () => {
  const fullScene = { ...sceneDocument, objects: Array.from({ length: 16 }, (_, index) => ({ ...sceneDocument.objects[0], assetId: index === 0 ? 'app_mascot' : 'obj_party_cake' })) };
  const { dependencies, calls } = deps({ sceneDocument: fullScene, roomPresentation, roomThemeDocument, activeAssetIds, key: 'd100', kind: 'day', days: 100, anniversaryN: null, baseVersion: 4 });
  const response = await request(milestonesHandler(dependencies));
  assertEquals(response.status, 422);
  assertEquals((await response.json()).error.code, 'ROOM_FULL');
  assertEquals(calls, ['begin_milestone_preset']);
});
