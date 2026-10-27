import { assertEquals } from 'jsr:@std/assert@1';
import { consentingRoom } from '../../_shared/__tests__/roomFixture.ts';
import { starProposal } from '../../_shared/__tests__/fakeModel.ts';

Deno.test('undo walks back within the open conversation and keeps the lease and room', async () => {
  const r = await consentingRoom([starProposal('obj_sky_moon'), starProposal('obj_sky_star')]);
  const sid = await r.acquire(r.a);
  const first = await r.preview(r.a, sid, 'moon'), second = await r.preview(r.a, sid, 'star');
  assertEquals((await r.undo(r.a, sid, first.body.previewId)).body.error.code, 'PREVIEW_CHANGED');
  assertEquals((await r.undo(r.a, sid, second.body.previewId)).body, { previewId: first.body.previewId });
  for (const u of [r.a, r.b]) assertEquals((await r.conversation(u)).body.currentPreview.previewId, first.body.previewId, 'both members see the same preview');
  assertEquals((await r.undo(r.a, sid, first.body.previewId)).body, { previewId: null });
  assertEquals((await r.undo(r.a, sid, first.body.previewId)).body.error.code, 'NOTHING_TO_UNDO');
  const snap = await r.snapshot(r.a);
  assertEquals([snap.body.versionNumber, snap.body.promptSession.sessionId, snap.body.promptSession.ownerUserId], [1, sid, r.a.id]);
});
Deno.test('only the owner undoes', async () => {
  const r = await consentingRoom();
  const sid = await r.acquire(r.a);
  const preview = await r.preview(r.a, sid, 'stars');
  assertEquals((await r.undo(r.b, sid, preview.body.previewId)).body.error.code, 'SESSION_OCCUPIED');
});
