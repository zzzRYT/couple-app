import { assertEquals } from 'jsr:@std/assert@1';
import { rpcDb } from '../../_shared/db.ts';
import { localEnv, service } from '../../_shared/__tests__/local.ts';
import { consentingRoom } from '../../_shared/__tests__/roomFixture.ts';
import { lifecycleSweepHandler } from '../index.ts';

const HOUR = 3_600_000;
async function messages(spaceId: string) {
  const { count } = await (await service()).from('prompt_message').select('id', { count: 'exact', head: true }).eq('space_id', spaceId);
  return count;
}
Deno.test('deletes unapplied prompt data after 24 hours and applied messages after 30 days; re-runs are stable', async () => {
  const env = await localEnv();
  const r = await consentingRoom();
  const sid = await r.acquire(r.a);
  const cancelled = await r.preview(r.a, sid, 'cancel me');
  await r.cancel(r.a, sid, cancelled.body.previewId);
  const sid2 = await r.acquire(r.a);
  const applied = await r.preview(r.a, sid2, 'keep me');
  await r.confirm(r.a, sid2, applied.body.previewId);
  const before = await messages(r.spaceId);
  const start = Date.now();
  const run = (offset: number) => lifecycleSweepHandler(rpcDbFrom(), env.serviceKey, () => new Date(start + offset))(new Request('http://local/lifecycle-sweep', { method: 'POST', headers: { Authorization: `Bearer ${env.serviceKey}` } }));
  assertEquals((await run(23 * HOUR)).status, 200);
  assertEquals(await messages(r.spaceId), before, 'nothing is deleted before 24 hours');
  await run(24 * HOUR + 60_000);
  const afterDay = await messages(r.spaceId);
  assertEquals(afterDay, 2, 'applied prompt and preview messages stay');
  const { data } = await (await service()).from('decoration_request').select('state').eq('space_id', r.spaceId);
  assertEquals(data!.map((d) => d.state), ['applied']);
  await run(24 * HOUR + 60_000);
  assertEquals(await messages(r.spaceId), afterDay, 're-running gives the same result');
  await run(30 * 24 * HOUR + 60_000);
  assertEquals(await messages(r.spaceId), 0);
  const { data: kept } = await (await service()).from('decoration_request').select('prompt_text').eq('space_id', r.spaceId);
  assertEquals(kept!.map((d) => d.prompt_text), [null]);
});
Deno.test('refuses callers without the service key', async () => {
  const env = await localEnv();
  const res = await lifecycleSweepHandler(rpcDbFrom(), env.serviceKey)(new Request('http://local/lifecycle-sweep', { method: 'POST', headers: { Authorization: 'Bearer nope' } }));
  assertEquals(res.status, 401);
});
let cachedDb: ReturnType<typeof rpcDb> | undefined;
function rpcDbFrom() {
  if (!cachedDb) throw new Error('db not ready');
  return cachedDb;
}
cachedDb = rpcDb(await service());
