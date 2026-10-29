import type { SupabaseClient } from 'npm:@supabase/supabase-js@2';
import { rpcDb, serviceClient, type Db } from '../_shared/db.ts';
import { safeLogFields } from '../_shared/logging.ts';

/** Removes the Storage objects that belong to a space; it must finish before the space's rows are deleted. */
export interface SpaceStorage {
  removeSpaceObjects(spaceId: string): Promise<void>;
  removeObjects(paths: string[]): Promise<void>;
}
/** Home cover photos live in a private bucket under `<spaceId>/…`, current object and pending-delete objects alike. */
export const HOME_COVER_BUCKET = 'home-cover';
export function bucketStorage(client: SupabaseClient, bucket = HOME_COVER_BUCKET): SpaceStorage {
  async function remove(prefix: string): Promise<void> {
    for (;;) {
      const { data, error } = await client.storage.from(bucket).list(prefix, { limit: 100 });
      // A bucket that was never created has nothing to delete; any other error must stop the purge so it is retried.
      if (error) { if (/not.?found/i.test(error.message) || (error as { statusCode?: string }).statusCode === '404') return; throw error; }
      if (!data || data.length === 0) return;
      const files = data.filter((entry) => entry.id !== null).map((entry) => `${prefix}/${entry.name}`);
      for (const folder of data.filter((entry) => entry.id === null)) await remove(`${prefix}/${folder.name}`);
      if (files.length === 0) return;
      const { error: removeError } = await client.storage.from(bucket).remove(files);
      if (removeError) throw removeError;
    }
  }
  return {
    removeSpaceObjects: (spaceId) => remove(spaceId),
    async removeObjects(paths) { if (!paths.length) return; const { error } = await client.storage.from(bucket).remove(paths); if (error) throw error; },
  };
}

/** Removes prior cover versions only after their replacement has been committed for a full day. */
export async function sweepHomeCoverDeletes(db: Db, storage: SpaceStorage, at: Date): Promise<number> {
  const due = await db.rpc<{ space_id: string; object_path: string }[]>('due_home_cover_deletes', { at: at.toISOString(), max_count: 100 });
  let deleted = 0;
  for (const item of due) {
    await storage.removeObjects([item.object_path]);
    await db.rpc('finish_home_cover_delete', { target: item.space_id, object_path: item.object_path });
    deleted++;
  }
  const expired = await db.rpc<{ upload_id: string; object_path: string }[]>('due_home_cover_uploads', { at: at.toISOString(), max_count: 100 });
  for (const item of expired) {
    await storage.removeObjects([item.object_path]);
    await db.rpc('finish_home_cover_upload', { upload: item.upload_id, at: at.toISOString() });
    deleted++;
  }
  return deleted;
}

/**
 * Hard-deletes ended spaces past their retention, one space at a time: Storage objects first, then every row in one
 * transaction. A failure leaves that space `ended` (already invisible to clients) for the next run and never blocks the others.
 */
export async function purgeDueSpaces(db: Db, storage: SpaceStorage, at: Date): Promise<{ purged: number; failed: number }> {
  const due = await db.rpc<string[]>('due_purge_spaces', { at: at.toISOString(), max_count: 50 });
  let purged = 0, failed = 0;
  for (const spaceId of due) {
    try {
      await db.rpc('mark_purge_started', { target: spaceId });
      await storage.removeSpaceObjects(spaceId);
      if (await db.rpc<boolean>('purge_space', { target: spaceId, at: at.toISOString() })) purged++;
    } catch {
      failed++;
    }
  }
  return { purged, failed };
}

/** Scheduled job (pg_cron or a Supabase schedule) authenticated with the service-role key; safe to re-run. The schedule itself is not set up yet. */
export function lifecycleSweepHandler(db: Db, serviceKey: string, storage: SpaceStorage, now: () => Date = () => new Date()) {
  return async (request: Request): Promise<Response> => {
    if (request.headers.get('Authorization') !== `Bearer ${serviceKey}`) return Response.json({ error: { code: 'UNAUTHORIZED', retryable: false } }, { status: 401 });
    const at = now();
    const result = await db.rpc<Record<string, number>>('sweep_prompt_data', { at: at.toISOString() });
    const coverObjectsDeleted = await sweepHomeCoverDeletes(db, storage, at);
    const purge = await purgeDueSpaces(db, storage, at);
    console.log(JSON.stringify(safeLogFields({ event: 'lifecycle-sweep', status: 200 })));
    return Response.json({ ...result, coverObjectsDeleted, ...purge });
  };
}
if (import.meta.main) {
  const client = serviceClient();
  Deno.serve(lifecycleSweepHandler(rpcDb(client), Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? crypto.randomUUID(), bucketStorage(client)));
}
