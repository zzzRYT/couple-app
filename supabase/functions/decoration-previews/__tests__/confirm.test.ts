import { assertEquals } from 'jsr:@std/assert@1';
import { service } from '../../_shared/__tests__/local.ts';
import { consentingRoom } from '../../_shared/__tests__/roomFixture.ts';

Deno.test('① only the owner confirms; ② version, pointer and release happen together', async () => {
  const r = await consentingRoom();
  const sid = await r.acquire(r.a);
  const preview = await r.preview(r.a, sid, 'stars');
  assertEquals((await r.confirm(r.b, sid, preview.body.previewId)).body.error.code, 'SESSION_OCCUPIED');
  const applied = await r.confirm(r.a, sid, preview.body.previewId);
  assertEquals([applied.status, applied.body.appliedVersion, applied.body.source], [201, 2, 'prompt']);
  for (const u of [r.a, r.b]) {
    const snap = await r.snapshot(u);
    assertEquals(snap.body.versionNumber, 2);
    assertEquals(snap.body.sceneDocument, preview.body.sceneDocument, 'both members see the same room');
    assertEquals(snap.body.promptSession, null, 'lease released');
  }
});
Deno.test('③ the same Idempotency-Key applies once', async () => {
  const r = await consentingRoom();
  const sid = await r.acquire(r.a);
  const preview = await r.preview(r.a, sid, 'stars');
  const key = crypto.randomUUID();
  const first = await r.confirm(r.a, sid, preview.body.previewId, 1, key);
  assertEquals(await r.confirm(r.a, sid, preview.body.previewId, 1, key), first);
  const { count } = await (await service()).from('room_theme_version').select('id', { count: 'exact', head: true }).eq('space_id', r.spaceId);
  assertEquals(count, 2);
});
Deno.test('④ stale base versions and concurrent applies conflict without duplicates', async () => {
  const r = await consentingRoom();
  const sid = await r.acquire(r.a);
  const preview = await r.preview(r.a, sid, 'stars');
  assertEquals((await r.confirm(r.a, sid, preview.body.previewId, 0)).body.error.code, 'VERSION_CONFLICT');
  const both = await Promise.all([r.confirm(r.a, sid, preview.body.previewId), r.confirm(r.a, sid, preview.body.previewId)]);
  assertEquals(both.map((x) => x.status).sort(), [201, 409]);
  const { count } = await (await service()).from('room_theme_version').select('id', { count: 'exact', head: true }).eq('space_id', r.spaceId);
  assertEquals(count, 2);
});
Deno.test('⑤ cancel releases the lease without changing the room; ⑥ an abandoned preview leaves the version', async () => {
  const r = await consentingRoom();
  const sid = await r.acquire(r.a);
  const preview = await r.preview(r.a, sid, 'stars');
  assertEquals((await r.snapshot(r.b)).body.versionNumber, 1, 'preview alone never changes the room');
  assertEquals((await r.cancel(r.a, sid, preview.body.previewId)).status, 204);
  const snap = await r.snapshot(r.a);
  assertEquals([snap.body.versionNumber, snap.body.promptSession], [1, null]);
});
Deno.test('⑦ undo after apply is ALREADY_APPLIED', async () => {
  const r = await consentingRoom();
  const sid = await r.acquire(r.a);
  const preview = await r.preview(r.a, sid, 'stars');
  await r.confirm(r.a, sid, preview.body.previewId);
  assertEquals((await r.undo(r.a, sid, preview.body.previewId)).body.error.code, 'ALREADY_APPLIED');
});
