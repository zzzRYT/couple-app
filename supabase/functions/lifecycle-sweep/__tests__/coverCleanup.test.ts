import { assertEquals } from 'jsr:@std/assert@1';
import type { Db } from '../../_shared/db.ts';
import type { SpaceStorage } from '../index.ts';
import { lifecycleSweepHandler, sweepHomeCoverDeletes } from '../index.ts';

Deno.test('cover cleanup removes only due paths and clears the queue after storage succeeds', async () => {
  const calls: string[] = [];
  const db: Db = { async rpc<T>(name, args) {
    calls.push(name);
    if (name === 'due_home_cover_deletes') return [{ space_id: 'space-1', object_path: 'space-1/cover/old.jpg' }] as T;
    if (name === 'due_home_cover_uploads') return [] as T;
    return undefined as T;
  } };
  const removed: string[][] = [];
  const storage: SpaceStorage = { async removeSpaceObjects() {}, async removeObjects(paths) { removed.push(paths); } };
  assertEquals(await sweepHomeCoverDeletes(db, storage, new Date('2026-11-03T00:00:00Z')), 1);
  assertEquals(removed, [['space-1/cover/old.jpg']]);
  assertEquals(calls, ['due_home_cover_deletes', 'finish_home_cover_delete', 'due_home_cover_uploads']);
});

Deno.test('failed Storage deletion keeps the queued object for a retry', async () => {
  const calls: string[] = [];
  const db: Db = { async rpc<T>(name) { calls.push(name); return [{ space_id: 'space-1', object_path: 'space-1/cover/old.jpg' }] as T; } };
  const storage: SpaceStorage = { async removeSpaceObjects() {}, async removeObjects() { throw new Error('storage failure'); } };
  assertEquals(await sweepHomeCoverDeletes(db, storage, new Date()), 0);
  assertEquals(calls, ['due_home_cover_deletes', 'due_home_cover_uploads']);
});

Deno.test('a failing cover queue lookup does not stop the space purge', async () => {
  const calls: string[] = [];
  const db: Db = { async rpc<T>(name) {
    calls.push(name);
    if (name === 'due_home_cover_deletes') throw new Error('function does not exist');
    if (name === 'sweep_prompt_data') return {} as T;
    if (name === 'due_purge_spaces') return ['space-1'] as T;
    if (name === 'purge_space') return true as T;
    return undefined as T;
  } };
  const storage: SpaceStorage = { async removeSpaceObjects() {}, async removeObjects() {} };
  const response = await lifecycleSweepHandler(db, 'key', storage)(new Request('https://x.test', { headers: { Authorization: 'Bearer key' } }));
  assertEquals(response.status, 200);
  assertEquals(await response.json(), { coverObjectsDeleted: 0, purged: 1, failed: 0 });
  assertEquals(calls.includes('purge_space'), true);
});
