import { assertEquals } from 'jsr:@std/assert@1';
import { call, service, userClient } from '../../_shared/__tests__/local.ts';
import { consentingRoom } from '../../_shared/__tests__/roomFixture.ts';

Deno.test('disconnecting ends the space at once with its own reason and without a report', async () => {
  const r = await consentingRoom();
  const db = await service();
  const path = `/spaces/spaces/${r.spaceId}/block`;
  assertEquals((await call(r.h.spaces, r.b, 'POST', path, {})).status, 400, 'confirm is required');
  assertEquals((await call(r.h.spaces, r.c, 'POST', path, { confirm: true })).status, 404, 'outsiders get the same answer as a missing space');
  const res = await call(r.h.spaces, r.b, 'POST', path, { confirm: true });
  assertEquals(res, { status: 200, body: { status: 'ended' } }, 'no period or deletion date in the response');
  const { data: space } = await db.from('couple_space').select('status, ended_reason, ended_by_user_id').eq('id', r.spaceId).single();
  assertEquals(space, { status: 'ended', ended_reason: 'disconnect', ended_by_user_id: r.b.id });
  const { data: events } = await db.from('space_lifecycle_event').select('event_type, actor_user_id').eq('space_id', r.spaceId);
  assertEquals(events, [{ event_type: 'disconnected', actor_user_id: r.b.id }]);
  const { count } = await db.from('report').select('id', { count: 'exact', head: true }).eq('space_id', r.spaceId);
  assertEquals(count, 0, 'disconnecting never files a report');
  // The partner's access stops at once, through the API and through RLS.
  assertEquals((await r.snapshot(r.a)).status, 404);
  assertEquals((await r.conversation(r.a)).status, 404);
  const { data: rows } = await (await userClient(r.a)).from('prompt_message').select('id');
  assertEquals(rows, []);
  const partner = (await call(r.h.spaces, r.a, 'GET', '/spaces/spaces/mine')).body.ended;
  const me = (await call(r.h.spaces, r.b, 'GET', '/spaces/spaces/mine')).body.ended;
  assertEquals([partner.kind, partner.by, me.kind, me.by], ['disconnect', 'partner', 'disconnect', 'me']);
});
