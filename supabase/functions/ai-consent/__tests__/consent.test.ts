import { assertEquals } from 'jsr:@std/assert@1';
import { call, service } from '../../_shared/__tests__/local.ts';
import { consentingRoom } from '../../_shared/__tests__/roomFixture.ts';
import { aiConsentHandler } from '../index.ts';

Deno.test('members record only their own consent; revoking voids unapplied previews and is audited', async () => {
  const r = await consentingRoom();
  const h = aiConsentHandler(r.deps);
  const sid = await r.acquire(r.a);
  const preview = await r.preview(r.a, sid, 'stars');
  const revoked = await call(h, r.b, 'PUT', `/ai-consent/spaces/${r.spaceId}/ai-consent`, { state: 'revoked', noticeVersion: 'ai-overseas-v1' });
  assertEquals(revoked.body, { state: 'revoked', bothGranted: false });
  assertEquals((await r.confirm(r.a, sid, preview.body.previewId)).body.error.code, 'PREVIEW_CHANGED');
  const db = await service();
  const { data: members } = await db.from('space_member').select('user_id, ai_consent_state').eq('space_id', r.spaceId);
  assertEquals(Object.fromEntries(members!.map((m) => [m.user_id, m.ai_consent_state])), { [r.a.id]: 'granted', [r.b.id]: 'revoked' });
  const { count } = await db.from('ai_consent_event').select('id', { count: 'exact', head: true }).eq('space_id', r.spaceId);
  assertEquals(count, 3);
  assertEquals((await call(h, r.c, 'PUT', `/ai-consent/spaces/${r.spaceId}/ai-consent`, { state: 'granted', noticeVersion: 'ai-overseas-v1' })).status, 404);
  assertEquals((await call(h, r.a, 'PUT', `/ai-consent/spaces/${r.spaceId}/ai-consent`, { state: 'granted', noticeVersion: 'v0' })).status, 400);
});
