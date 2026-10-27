import { assertEquals } from 'jsr:@std/assert@1';
import { consentingRoom } from '../../_shared/__tests__/roomFixture.ts';
import { starProposal } from '../../_shared/__tests__/fakeModel.ts';
import type { ModelProposal } from '../../_shared/anthropic.ts';

const withoutMascot = (count: number): ModelProposal => {
  const base = starProposal();
  const item = base.objects[1]!;
  return { ...base, objects: Array.from({ length: count }, (_, i) => ({ ...item, x: 0.1 + (i % 4) * 0.25, y: 0.3 + Math.floor(i / 4) * 0.12, width: 0.08, height: 0.08 })) };
};
async function roomWithout(count: number) {
  const r = await consentingRoom([withoutMascot(count)]);
  const sid = await r.acquire(r.a);
  const preview = await r.preview(r.a, sid, 'take the mascot out and fill the room');
  await r.confirm(r.a, sid, preview.body.previewId);
  return r;
}
Deno.test('recalls the mascot once into a new version without AI or lease', async () => {
  const r = await roomWithout(3);
  const calls = r.spy.calls.length;
  const recalled = await r.recall(r.b, 2);
  assertEquals([recalled.status, recalled.body.versionNumber, recalled.body.source], [200, 3, 'mascot_recall']);
  const scene = (await r.snapshot(r.a)).body.sceneDocument;
  assertEquals(scene.objects.filter((o: { assetId: string }) => o.assetId === 'app_mascot').length, 1);
  assertEquals((await r.recall(r.b, 3)).body, { versionNumber: 3, source: 'mascot_recall', recalled: false }, 'idempotent when present');
  assertEquals(r.spy.calls.length, calls);
});
Deno.test('full rooms, active leases and stale versions are refused', async () => {
  const r = await roomWithout(16);
  assertEquals((await r.recall(r.a, 1)).body.error.code, 'VERSION_CONFLICT');
  assertEquals([(await r.recall(r.a, 2)).status, (await r.recall(r.a, 2)).body.error.code], [422, 'ROOM_FULL']);
  const s = await consentingRoom();
  await s.acquire(s.a);
  assertEquals((await s.recall(s.b, 1)).body.error.code, 'SESSION_OCCUPIED');
});
