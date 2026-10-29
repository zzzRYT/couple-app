import { rpcDb, serviceClient, type Db } from '../_shared/db.ts';
import { safeLogFields } from '../_shared/logging.ts';
import { bucketStorage, type SpaceStorage } from '../_shared/spaceStorage.ts';

export { bucketStorage, HOME_COVER_BUCKET, type SpaceStorage } from '../_shared/spaceStorage.ts';

/** Removes prior cover versions only after their replacement has been committed for a full day. */
export async function sweepHomeCoverDeletes(db: Db, storage: SpaceStorage, at: Date): Promise<number> {
  const due = await db.rpc<{ space_id: string; object_path: string }[]>('due_home_cover_deletes', { at: at.toISOString(), max_count: 100 });
  let deleted = 0;
  for (const item of due) {
    try {
      await storage.removeObjects([item.object_path]);
      await db.rpc('finish_home_cover_delete', { target: item.space_id, object_path: item.object_path });
      deleted++;
    } catch { /* stays queued for the next run */ }
  }
  const expired = await db.rpc<{ upload_id: string; object_path: string }[]>('due_home_cover_uploads', { at: at.toISOString(), max_count: 100 });
  for (const item of expired) {
    try {
      await storage.removeObjects([item.object_path]);
      await db.rpc('finish_home_cover_upload', { upload: item.upload_id, at: at.toISOString() });
      deleted++;
    } catch { /* stays queued for the next run */ }
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

/**
 * Scheduled job (pg_cron or a Supabase schedule) authenticated with the service-role key; safe to re-run. The schedule itself is not set up yet.
 * `resumeDeletions` continues account deletions that stopped part-way (account/runner.ts).
 */
export function lifecycleSweepHandler(db: Db, serviceKey: string, storage: SpaceStorage, now: () => Date = () => new Date(), resumeDeletions?: (at: Date) => Promise<{ resumed: number; pending: number }>) {
  return async (request: Request): Promise<Response> => {
    if (request.headers.get('Authorization') !== `Bearer ${serviceKey}`) return Response.json({ error: { code: 'UNAUTHORIZED', retryable: false } }, { status: 401 });
    const at = now();
    const result = await db.rpc<Record<string, number>>('sweep_prompt_data', { at: at.toISOString() });
    let coverObjectsDeleted = 0;
    try { coverObjectsDeleted = await sweepHomeCoverDeletes(db, storage, at); } catch { /* cover cleanup is retried next run and must not block the purge */ }
    const purge = await purgeDueSpaces(db, storage, at);
    const deletions = resumeDeletions ? await resumeDeletions(at) : {};
    console.log(JSON.stringify(safeLogFields({ event: 'lifecycle-sweep', status: 200 })));
    return Response.json({ ...result, coverObjectsDeleted, ...purge, ...deletions });
  };
}
if (import.meta.main) {
  const client = serviceClient();
  // Imported lazily so the account deletion modules load only in the deployed entry point, not when tests import the handler.
  const { defaultDeletionPorts } = await import('../account/ports.ts');
  const { resumeAccountDeletions } = await import('../account/runner.ts');
  const { ports } = await defaultDeletionPorts();
  Deno.serve(lifecycleSweepHandler(rpcDb(client), Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? crypto.randomUUID(), bucketStorage(client), undefined,
    (at) => resumeAccountDeletions(ports, at)));
}
