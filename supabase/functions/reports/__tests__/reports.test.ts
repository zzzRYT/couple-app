import { assertEquals } from 'jsr:@std/assert@1';
import { call, service, userClient } from '../../_shared/__tests__/local.ts';
import { consentingRoom } from '../../_shared/__tests__/roomFixture.ts';
import { reportsHandler } from '../index.ts';

Deno.test('files a report without ending the space and shows it only to its author', async () => {
  const r = await consentingRoom();
  const h = reportsHandler(r.deps), path = `/reports/spaces/${r.spaceId}/reports`;
  for (const target of ['partner', 'room_scene']) {
    const res = await call(h, r.a, 'POST', path, { target, reason: 'harass', detail: 'details' });
    assertEquals(res.status, 201);
    assertEquals(Object.keys(res.body).sort(), ['hiddenForReporter', 'reportId'], 'nothing about review or outcome');
  }
  const db = await service();
  const { data: message } = await db.from('prompt_message').insert({ space_id: r.spaceId, kind: 'user_prompt', author_user_id: r.b.id, body_text: 'hello' }).select('id').single();
  assertEquals((await call(h, r.a, 'POST', path, { target: 'shared_text', reason: 'other', messageId: message!.id })).status, 201);
  assertEquals((await call(h, r.a, 'POST', path, { target: 'shared_text', reason: 'other', detail: '   ' })).status, 201);
  const { data: stored } = await db.from('report').select('detail, status').eq('space_id', r.spaceId).order('created_at');
  assertEquals(stored!.map((s) => s.status), ['received', 'received', 'received', 'received']);
  assertEquals(stored![3]!.detail, null, 'blank notes are not stored');
  assertEquals((await (await userClient(r.a)).from('report').select('id')).data!.length, 4);
  assertEquals((await (await userClient(r.b)).from('report').select('id')).data, [], 'the reported partner never sees it');
  assertEquals((await r.snapshot(r.a)).status, 200, 'the space is still active');
  assertEquals((await r.snapshot(r.b)).status, 200);
});

Deno.test('rejects targets and reasons outside the contract, including the home cover photo', async () => {
  const r = await consentingRoom();
  const h = reportsHandler(r.deps), path = `/reports/spaces/${r.spaceId}/reports`;
  const bad = async (body: Record<string, unknown>, status = 400) => assertEquals((await call(h, r.a, 'POST', path, body)).status, status, JSON.stringify(body));
  await bad({ target: 'home_cover', reason: 'other' });
  await bad({ target: 'photo', reason: 'other' });
  await bad({ target: 'generated_object', reason: 'other' });
  await bad({ target: 'partner', reason: 'copyright' });
  await bad({ target: 'partner' });
  await bad({ reason: 'other' });
  await bad({ target: 'partner', reason: 'other', detail: 'x'.repeat(201) });
  await bad({ target: 'partner', reason: 'other', messageId: crypto.randomUUID() }, 400);
  await bad({ target: 'shared_text', reason: 'other', messageId: 'nope' });
  await bad({ target: 'shared_text', reason: 'other', messageId: crypto.randomUUID() }, 404);
  assertEquals((await call(h, r.c, 'POST', path, { target: 'partner', reason: 'other' })).status, 404, 'outsiders');
  assertEquals((await call(h, null, 'POST', path, { target: 'partner', reason: 'other' })).status, 401);
});

Deno.test('limits reports to 10 per user per day, and an ended space accepts none', async () => {
  const r = await consentingRoom();
  const h = reportsHandler(r.deps), path = `/reports/spaces/${r.spaceId}/reports`;
  for (let i = 0; i < 10; i++) assertEquals((await call(h, r.a, 'POST', path, { target: 'partner', reason: 'other' })).status, 201);
  const limited = await call(h, r.a, 'POST', path, { target: 'partner', reason: 'other' });
  assertEquals([limited.status, limited.body.error.code], [429, 'REPORT_RATE_LIMITED']);
  assertEquals((await call(h, r.b, 'POST', path, { target: 'partner', reason: 'other' })).status, 201, 'the limit is per reporter');
  await call(r.h.spaces, r.b, 'POST', `/spaces/spaces/${r.spaceId}/end`, { confirm: true });
  assertEquals((await call(h, r.b, 'POST', path, { target: 'partner', reason: 'other' })).status, 404);
});
