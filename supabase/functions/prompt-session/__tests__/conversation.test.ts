import { assert, assertEquals } from 'jsr:@std/assert@1';
import { call, localDeps, service, sql } from '../../_shared/__tests__/local.ts';
import { couple } from '../../_shared/__tests__/fixtures.ts';
import { promptSessionHandler } from '../index.ts';

Deno.test('both members read the conversation in order; outsiders get 403-equivalent 404', async () => {
  const deps = await localDeps();
  const h = promptSessionHandler(deps);
  const { a, b, c, spaceId } = await couple(deps);
  const db = await service();
  await db.from('prompt_message').insert([
    { space_id: spaceId, author_user_id: a.id, kind: 'user_prompt', body_text: 'first', created_at: '2026-10-27T00:00:01Z' },
    { space_id: spaceId, author_user_id: null, kind: 'status', body_text: null, created_at: '2026-10-27T00:00:02Z' },
    { space_id: spaceId, author_user_id: a.id, kind: 'preview', body_text: null, created_at: '2026-10-27T00:00:03Z' },
  ]);
  for (const user of [a, b]) {
    const read = await call(h, user, 'GET', `/prompt-session/spaces/${spaceId}/prompt-conversation`);
    assertEquals(read.status, 200);
    assertEquals(read.body.messages.map((m: { kind: string }) => m.kind), ['user_prompt', 'status', 'preview']);
  }
  const outsider = await call(h, c, 'GET', `/prompt-session/spaces/${spaceId}/prompt-conversation`);
  assert(outsider.status === 403 || outsider.status === 404, 'outsider learns nothing');
  assertEquals(outsider.body, { error: { code: 'NOT_FOUND', retryable: false } });
});
Deno.test('two concurrent acquires produce exactly one owner', async () => {
  const deps = await localDeps();
  const h = promptSessionHandler(deps);
  const { a, b, spaceId } = await couple(deps);
  const results = await Promise.all([a, b].map((u) => call(h, u, 'POST', `/prompt-session/spaces/${spaceId}/prompt-session/acquire`, {})));
  assertEquals(results.map((r) => r.status).sort(), [201, 409]);
  const loser = results.find((r) => r.status === 409)!;
  assertEquals(loser.body.error.code, 'SESSION_OCCUPIED');
  assertEquals(loser.body.error.ownerUserId, results.find((r) => r.status === 201)!.body.ownerUserId);
  assert(loser.body.error.expiresAt);
});
Deno.test('heartbeat, takeover guard and release follow the lease', async () => {
  const deps = await localDeps();
  const h = promptSessionHandler(deps);
  const { a, b, spaceId } = await couple(deps);
  const base = `/prompt-session/spaces/${spaceId}/prompt-session`;
  const acquired = await call(h, a, 'POST', `${base}/acquire`, {});
  const sid = acquired.body.sessionId;
  assertEquals((await call(h, a, 'POST', `${base}/${sid}/heartbeat`, { active: true })).status, 200);
  assertEquals((await call(h, b, 'POST', `${base}/${sid}/takeover`, { expectedOwnerUserId: a.id })).body.error.code, 'SESSION_OCCUPIED');
  await (await service()).from('prompt_session').update({ expires_at: new Date(Date.now() - 1000).toISOString() }).eq('id', sid);
  const taken = await call(h, b, 'POST', `${base}/${sid}/takeover`, { expectedOwnerUserId: a.id });
  assertEquals([taken.status, taken.body.sessionId, taken.body.ownerUserId], [200, sid, b.id]);
  assertEquals((await call(h, a, 'POST', `${base}/${sid}/release`, { reason: 'cancel' })).body.error.code, 'SESSION_OCCUPIED');
  assertEquals((await call(h, b, 'POST', `${base}/${sid}/release`, { reason: 'cancel' })).status, 204);
});
Deno.test('realtime payloads carry only ids and states', async () => {
  const deps = await localDeps();
  const h = promptSessionHandler(deps);
  const { a, spaceId } = await couple(deps);
  await call(h, a, 'POST', `/prompt-session/spaces/${spaceId}/prompt-session/acquire`, {});
  const rows = String(await sql(`select payload from realtime.messages where topic='space:${spaceId}'`)).split('\n').filter(Boolean);
  assert(rows.length > 0, 'events were broadcast');
  const data = rows.map((row) => ({ payload: JSON.parse(row) }));
  const allowed = new Set(['id', 'kind', 'memberCount', 'sessionId', 'status', 'ownerUserId', 'expiresAt', 'messageId', 'previewId', 'versionNumber', 'versionId', 'changedBy', 'at']);
  for (const { payload } of data) for (const key of Object.keys(payload)) assert(allowed.has(key), `unexpected payload field ${key}`);
});
Deno.test('an expired lease with a live preview is continued by start, and the conflict error names the session', async () => {
  const deps = await localDeps();
  const h = promptSessionHandler(deps);
  const { a, b, spaceId } = await couple(deps);
  const base = `/prompt-session/spaces/${spaceId}/prompt-session`;
  const acquired = await call(h, a, 'POST', `${base}/acquire`, {});
  const lost = await call(h, b, 'POST', `${base}/acquire`, {});
  assertEquals([lost.status, lost.body.error.code, lost.body.error.sessionId], [409, 'SESSION_OCCUPIED', acquired.body.sessionId]);
  const db = await service();
  await db.from('decoration_request').insert({ space_id: spaceId, session_id: acquired.body.sessionId, requested_by_user_id: a.id, base_version_number: 1,
    prompt_text: 'stars', state: 'previewed', result_candidate: {}, expires_at: new Date(Date.now() + 600_000).toISOString() });
  await db.from('prompt_session').update({ expires_at: new Date(Date.now() - 1000).toISOString() }).eq('id', acquired.body.sessionId);
  const revived = await call(h, a, 'POST', `${base}/acquire`, {});
  assertEquals([revived.status, revived.body.sessionId, revived.body.status], [201, acquired.body.sessionId, 'occupied']);
  await db.from('prompt_session').update({ expires_at: new Date(Date.now() - 1000).toISOString() }).eq('id', acquired.body.sessionId);
  const taken = await call(h, b, 'POST', `${base}/acquire`, {});
  assertEquals([taken.status, taken.body.sessionId, taken.body.ownerUserId], [201, acquired.body.sessionId, b.id]);
});
