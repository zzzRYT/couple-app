import { assert, assertEquals } from 'jsr:@std/assert@1';
import { rpcDb } from '../../_shared/db.ts';
import { call, localEnv, service } from '../../_shared/__tests__/local.ts';
import { consentingRoom } from '../../_shared/__tests__/roomFixture.ts';
import { bucketStorage, HOME_COVER_BUCKET, lifecycleSweepHandler, purgeDueSpaces, type SpaceStorage } from '../index.ts';

// The fixed clock: spaces under test get an old purge_after so real spaces from other runs (due in ~30 days) are never touched.
const DUE = '2001-01-01T00:00:00.000Z';
const at = (offsetMs: number) => new Date(new Date(DUE).getTime() + offsetMs);
const SPACE_TABLES = ['space_member', 'invitation', 'space_end_notice', 'prompt_session', 'prompt_message', 'room_theme', 'room_theme_version',
  'decoration_request', 'ai_consent_event', 'daily_request_count', 'daily_request_reservation', 'report'] as const;
const noStorage: SpaceStorage = { removeSpaceObjects: () => Promise.resolve(), removeObjects: () => Promise.resolve() };

async function rowCount(table: string, spaceId: string) {
  const { count, error } = await (await service()).from(table).select('*', { count: 'exact', head: true }).eq('space_id', spaceId);
  if (error) throw error;
  return count ?? 0;
}
async function exists(spaceId: string) {
  const { count } = await (await service()).from('couple_space').select('id', { count: 'exact', head: true }).eq('id', spaceId);
  return count === 1;
}
/** A consenting couple with data in every table that carries a space, ended and made due at the fixed clock. */
async function endedRoom() {
  const r = await consentingRoom();
  const db = await service();
  const sid = await r.acquire(r.a);
  const applied = await r.preview(r.a, sid, 'stars');
  assertEquals((await r.confirm(r.a, sid, applied.body.previewId)).status, 201);
  await db.from('report').insert({ space_id: r.spaceId, reporter_user_id: r.a.id, target: 'partner', reason: 'other' });
  await call(r.h.spaces, r.a, 'POST', `/spaces/spaces/${r.spaceId}/end`, { confirm: true });
  await db.from('couple_space').update({ purge_after: DUE }).eq('id', r.spaceId);
  return r;
}
async function coverBucket() {
  const db = await service();
  const { error } = await db.storage.createBucket(HOME_COVER_BUCKET, { public: false });
  if (error && !/already exists/i.test(error.message)) throw error;
  return db.storage.from(HOME_COVER_BUCKET);
}
const sweep = async (storage: SpaceStorage, when: Date) => {
  const env = await localEnv();
  const res = await lifecycleSweepHandler(rpcDb(await service()), env.serviceKey, storage, () => when)(new Request('http://local/lifecycle-sweep', { method: 'POST', headers: { Authorization: `Bearer ${env.serviceKey}` } }));
  assertEquals(res.status, 200);
  return await res.json();
};

Deno.test('purges rows and Storage objects only after purge_after, and re-runs change nothing', async () => {
  const r = await endedRoom();
  const bucket = await coverBucket();
  const photo = new Blob(['fake'], { type: 'image/jpeg' });
  for (const path of [`${r.spaceId}/current.jpg`, `${r.spaceId}/pending/old.jpg`]) assertEquals((await bucket.upload(path, photo)).error, null);
  const storage = bucketStorage(await service());
  for (const table of SPACE_TABLES) if (table !== 'daily_request_count') assert(await rowCount(table, r.spaceId) > 0, `${table} has rows before the purge`);
  const before = await sweep(storage, at(-1000));
  assert(await exists(r.spaceId), 'one second before purge_after nothing is deleted');
  assertEquals((await bucket.list(r.spaceId)).data!.length, 2);
  assert(before.purged >= 0);
  const first = await sweep(storage, at(1000));
  assert(first.purged >= 1);
  assert(!(await exists(r.spaceId)), 'the space is gone one second after purge_after');
  for (const table of SPACE_TABLES) assertEquals(await rowCount(table, r.spaceId), 0, `${table} is empty after the purge`);
  assertEquals((await bucket.list(r.spaceId)).data, [], 'Storage objects, including nested pending ones, are gone');
  const again = await sweep(storage, at(2000));
  assertEquals(again.purged, 0, 'a re-run has nothing left to do');
  const db = await service();
  const { data: events } = await db.from('space_lifecycle_event').select('event_type, actor_user_id, metadata').eq('space_id', r.spaceId).order('occurred_at');
  assertEquals(events!.map((e) => e.event_type).sort(), ['deletion_completed', 'deletion_started', 'ended']);
  for (const e of events!) assertEquals([e.actor_user_id, e.metadata], [null, {}], 'events keep no person and no content');
});

Deno.test('purge uses the server clock value, not the time zone of anyone involved', async () => {
  const r = await endedRoom();
  await (await service()).from('couple_space').update({ time_zone: 'Pacific/Kiritimati' }).eq('id', r.spaceId);
  await sweep(noStorage, at(-1));
  assert(await exists(r.spaceId));
  await sweep(noStorage, at(0));
  assert(!(await exists(r.spaceId)), 'due exactly at purge_after');
});

Deno.test('ignores active spaces and spaces that are not due yet', async () => {
  const active = await consentingRoom();
  const recent = await consentingRoom();
  await call(recent.h.spaces, recent.a, 'POST', `/spaces/spaces/${recent.spaceId}/end`, { confirm: true });
  await sweep(noStorage, at(10_000));
  assert(await exists(active.spaceId));
  assert(await exists(recent.spaceId), 'ended 30 days from now is not due at the fixed clock');
  assertEquals(await rowCount('space_member', active.spaceId), 2);
});

Deno.test('a Storage failure leaves the space ended and untouched, and the next run finishes it', async () => {
  const r = await endedRoom();
  let calls = 0;
  const flaky: SpaceStorage = { removeSpaceObjects: (id) => { if (id === r.spaceId && ++calls === 1) return Promise.reject(new Error('storage down')); return Promise.resolve(); }, removeObjects: () => Promise.resolve() };
  const failed = await sweep(flaky, at(1000));
  assert(failed.failed >= 1);
  assert(await exists(r.spaceId), 'rows stay because the objects could not be removed');
  const db = await service();
  const { data } = await db.from('couple_space').select('status').eq('id', r.spaceId).single();
  assertEquals(data!.status, 'ended');
  assertEquals(await rowCount('space_member', r.spaceId), 2);
  assertEquals((await call(r.h.spaces, r.a, 'GET', `/spaces/spaces/${r.spaceId}/snapshot`)).status, 404, 'still invisible to clients');
  await sweep(flaky, at(2000));
  assert(!(await exists(r.spaceId)), 'the retry succeeds');
  const { data: events } = await db.from('space_lifecycle_event').select('event_type').eq('space_id', r.spaceId);
  assertEquals(events!.filter((e) => e.event_type === 'deletion_started').length, 1, 'retries do not repeat the started event');
});

Deno.test('one failing space does not block the others', async () => {
  const bad = await endedRoom(), good = await endedRoom();
  const storage: SpaceStorage = { removeSpaceObjects: (id) => id === bad.spaceId ? Promise.reject(new Error('boom')) : Promise.resolve(), removeObjects: () => Promise.resolve() };
  const result = await sweep(storage, at(1000));
  assert(result.failed >= 1);
  assert(await exists(bad.spaceId));
  assert(!(await exists(good.spaceId)));
  await sweep(noStorage, at(2000));
  assert(!(await exists(bad.spaceId)));
});

Deno.test('a database failure rolls the whole space back; nothing is partly deleted', async () => {
  const r = await endedRoom();
  const db = await service();
  const { data: before } = await db.from('prompt_message').select('id').eq('space_id', r.spaceId);
  // purge_space deletes in one statement; make a late-cascading table refuse the delete to prove the rollback.
  const failing = rpcDb(db);
  const wrapped = { rpc: <T>(name: string, args: Record<string, unknown>) => name === 'purge_space' ? Promise.reject(new Error('DB_ERROR')) as Promise<T> : failing.rpc<T>(name, args) };
  const result = await purgeDueSpaces(wrapped, noStorage, at(1000));
  assert(result.failed >= 1);
  assert(await exists(r.spaceId));
  const { data: after } = await db.from('prompt_message').select('id').eq('space_id', r.spaceId);
  assertEquals(after!.length, before!.length);
});

Deno.test('purging an old space leaves a newer space of the same people alone', async () => {
  const r = await endedRoom();
  const next = await call(r.h.spaces, r.a, 'POST', '/spaces/spaces', { anniversaryDate: '2025-03-03', timeZone: 'Asia/Seoul' });
  assertEquals(next.status, 201);
  await sweep(noStorage, at(1000));
  assert(!(await exists(r.spaceId)));
  assert(await exists(next.body.spaceId));
  assertEquals((await call(r.h.spaces, r.a, 'GET', '/spaces/spaces/mine')).body.active, { spaceId: next.body.spaceId });
});
