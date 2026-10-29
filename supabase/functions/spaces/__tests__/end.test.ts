import { assert, assertEquals } from 'jsr:@std/assert@1';
import { call, makeUser, service, userClient, type TestUser } from '../../_shared/__tests__/local.ts';
import { consentingRoom } from '../../_shared/__tests__/roomFixture.ts';
import { couple } from '../../_shared/__tests__/fixtures.ts';
import { invitationsHandler } from '../../invitations/index.ts';
import { spacesHandler } from '../index.ts';

const end = (h: ReturnType<typeof spacesHandler>, u: TestUser, spaceId: string, body: unknown = { confirm: true }, key?: string) => call(h, u, 'POST', `/spaces/spaces/${spaceId}/end`, body, key);
const mine = (h: ReturnType<typeof spacesHandler>, u: TestUser) => call(h, u, 'GET', '/spaces/spaces/mine');

Deno.test('ending closes the space for both members in one step and records why', async () => {
  const r = await consentingRoom();
  const db = await service();
  const sid = await r.acquire(r.a);
  assert(sid);
  assertEquals((await end(r.h.spaces, r.a, r.spaceId, {})).status, 400, 'confirm is required');
  assertEquals((await end(r.h.spaces, r.c, r.spaceId)).status, 404, 'outsiders cannot end it');
  const ended = await end(r.h.spaces, r.a, r.spaceId);
  assertEquals(ended, { status: 200, body: { status: 'ended' } });
  const { data: space } = await db.from('couple_space').select('*').eq('id', r.spaceId).single();
  assertEquals([space!.status, space!.ended_reason, space!.ended_by_user_id], ['ended', 'ended', r.a.id]);
  assertEquals(new Date(space!.purge_after).getTime() - new Date(space!.ended_at).getTime(), 30 * 24 * 3_600_000, 'purge_after = ended_at + 30 days');
  const { data: members } = await db.from('space_member').select('space_active').eq('space_id', r.spaceId);
  assertEquals(members!.map((m) => m.space_active), [false, false]);
  const { data: sessions } = await db.from('prompt_session').select('status, release_reason').eq('space_id', r.spaceId);
  assertEquals(sessions, [{ status: 'released', release_reason: 'space_ended' }]);
  const { data: events } = await db.from('space_lifecycle_event').select('event_type, actor_user_id').eq('space_id', r.spaceId);
  assertEquals(events, [{ event_type: 'ended', actor_user_id: r.a.id }]);
  assertEquals((await end(r.h.spaces, r.b, r.spaceId)).status, 404, 'the partner cannot end an already ended space');
});

Deno.test('an ended space is a missing space for every client call and for direct reads', async () => {
  const r = await consentingRoom();
  assertEquals((await (await userClient(r.a)).from('couple_space').select('id')).data!.length, 1, 'visible while active');
  await end(r.h.spaces, r.a, r.spaceId);
  const inv = invitationsHandler(r.deps, () => 'test-pepper');
  for (const u of [r.a, r.b]) {
    assertEquals((await r.snapshot(u)).status, 404);
    assertEquals((await r.conversation(u)).status, 404);
    assertEquals((await call(r.h.session, u, 'POST', `/prompt-session/spaces/${r.spaceId}/prompt-session/acquire`, {})).status, 404);
    assertEquals((await r.preview(u, crypto.randomUUID(), 'stars')).status, 404);
    assertEquals((await r.recall(u, 1)).status, 404);
    assertEquals((await call(inv, u, 'POST', `/invitations/spaces/${r.spaceId}/invitations`, {})).status, 404);
    const client = await userClient(u);
    for (const table of ['couple_space', 'space_member', 'prompt_message', 'prompt_session', 'room_theme', 'room_theme_version', 'invitation', 'space_lifecycle_event']) {
      const { data } = await client.from(table).select('*');
      assertEquals(data, [], `${table} is empty for ${u.id === r.a.id ? 'A' : 'B'}`);
    }
    const channel = client.channel(`space:${r.spaceId}`, { config: { private: true } });
    const status = await new Promise<string>((resolve) => channel.subscribe((s) => resolve(s)));
    assert(status !== 'SUBSCRIBED', 'the private channel refuses members of an ended space');
    await client.removeAllChannels();
  }
});

Deno.test('both members see one ended notice that disappears after their own ack, and can start again at once', async () => {
  const r = await consentingRoom();
  assertEquals((await mine(r.h.spaces, r.a)).body.active, { spaceId: r.spaceId });
  await end(r.h.spaces, r.a, r.spaceId);
  const a = (await mine(r.h.spaces, r.a)).body, b = (await mine(r.h.spaces, r.b)).body;
  assertEquals([a.active, a.ended.kind, a.ended.by], [null, 'ended', 'me']);
  assertEquals([b.active, b.ended.kind, b.ended.by], [null, 'ended', 'partner']);
  assertEquals(Object.keys(a.ended).sort(), ['at', 'by', 'kind'], 'no space data, ids or schedule');
  assertEquals((await call(r.h.spaces, r.a, 'POST', '/spaces/spaces/mine/ended/ack', {})).status, 204);
  assertEquals((await call(r.h.spaces, r.a, 'POST', '/spaces/spaces/mine/ended/ack', {})).status, 204, 'ack is idempotent');
  assertEquals((await mine(r.h.spaces, r.a)).body, { active: null, ended: null });
  assertEquals((await mine(r.h.spaces, r.b)).body.ended.by, 'partner', "the partner's notice is untouched");
  for (const u of [r.a, r.b]) assertEquals((await call(r.h.spaces, u, 'POST', '/spaces/spaces', { anniversaryDate: '2025-01-01', timeZone: 'Asia/Seoul' })).status, 201);
});

Deno.test('a new notice replaces older ones; the newest one is returned', async () => {
  const r = await consentingRoom();
  await end(r.h.spaces, r.a, r.spaceId);
  const next = await call(r.h.spaces, r.a, 'POST', '/spaces/spaces', { anniversaryDate: '2025-02-02', timeZone: 'Asia/Seoul' });
  const both = (await mine(r.h.spaces, r.a)).body;
  assertEquals([both.active, both.ended.kind], [{ spaceId: next.body.spaceId }, 'ended'], 'active space and an unread notice together');
  assertEquals((await call(r.h.spaces, r.a, 'POST', `/spaces/spaces/${next.body.spaceId}/block`, { confirm: true })).status, 200);
  const latest = (await mine(r.h.spaces, r.a)).body;
  assertEquals([latest.ended.kind, latest.ended.by], ['disconnect', 'me']);
});

Deno.test('ending revokes the open invitation', async () => {
  const deps = (await consentingRoom()).deps;
  const spaces = spacesHandler(deps), inv = invitationsHandler(deps, () => 'test-pepper');
  const a = await makeUser('end-inv');
  const created = await call(spaces, a, 'POST', '/spaces/spaces', { anniversaryDate: '2025-01-01', timeZone: 'Asia/Seoul' });
  const issued = await call(inv, a, 'POST', `/invitations/spaces/${created.body.spaceId}/invitations`, {});
  await end(spaces, a, created.body.spaceId);
  const db = await service();
  const { data } = await db.from('invitation').select('status').eq('space_id', created.body.spaceId);
  assertEquals(data, [{ status: 'revoked' }]);
  const joiner = await makeUser('end-inv-b');
  assertEquals((await call(inv, joiner, 'POST', '/invitations/invitations/accept', { code: issued.body.code })).body.error.code, 'INVITE_INVALID');
});

Deno.test('replaying the same idempotency key returns the first answer', async () => {
  const deps = (await consentingRoom()).deps;
  const spaces = spacesHandler(deps);
  const c = await couple(deps), key = crypto.randomUUID();
  const first = await end(spaces, c.a, c.spaceId, { confirm: true }, key);
  assertEquals(await end(spaces, c.a, c.spaceId, { confirm: true }, key), first);
});
