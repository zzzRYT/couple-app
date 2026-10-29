import type { SupabaseClient } from 'npm:@supabase/supabase-js@2';

// Shared by lifecycle-sweep and account/ports.ts. It lives here, not in lifecycle-sweep/index.ts, because that entry point
// imports the account wiring with top-level await: an import back into it never finishes evaluating in the Edge Runtime.

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
