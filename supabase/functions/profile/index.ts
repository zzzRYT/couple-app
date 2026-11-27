import type { SupabaseClient } from 'npm:@supabase/supabase-js@2';
import { AppError } from '../_shared/errors.ts';
import { createHandler, defaultDeps, route, type Deps } from '../_shared/http.ts';
import { serviceClient } from '../_shared/db.ts';
import { reencodeProfilePhoto } from '../_shared/image.ts';
import { PROFILE_PHOTO_BUCKET } from '../_shared/spaceStorage.ts';

// About 1 MB once decoded (base64 is 4/3 the size); the app's 512x512 JPEG is far smaller.
const MAX_PHOTO_BASE64 = 1_400_000;
type PhotoStorage = { upload(path: string, bytes: Uint8Array): Promise<void>; remove(paths: string[]): Promise<void> };
// The client is made on first use so tests that never touch photos need no server environment.
function photoStorage(client: () => SupabaseClient): PhotoStorage {
  let made: SupabaseClient | undefined;
  const bucket = () => (made ??= client()).storage.from(PROFILE_PHOTO_BUCKET);
  return {
    async upload(path, bytes) { const { error } = await bucket().upload(path, bytes, { contentType: 'image/jpeg', upsert: false }); if (error) throw new Error('STORAGE_ERROR'); },
    async remove(paths) { const { error } = await bucket().remove(paths); if (error) throw new Error('STORAGE_ERROR'); },
  };
}
function decodePhoto(value: unknown): Uint8Array {
  if (typeof value !== 'string' || value.length > MAX_PHOTO_BASE64) throw new AppError('INVALID_REQUEST');
  try { return Uint8Array.from(atob(value), (char) => char.charCodeAt(0)); } catch { throw new AppError('INVALID_REQUEST'); }
}
export function profileHandler(deps: Deps, photos: PhotoStorage = photoStorage(serviceClient)) {
  // shortcut: a failed delete of the replaced photo orphans that object until account deletion purges the prefix; add a sweep if orphans matter.
  const removePrevious = (previous: string | null) => previous ? photos.remove([previous]).catch(() => {}) : undefined;
  return createHandler([
    route('GET', '/profile/preferences', ({ userId, deps }) => deps.db.rpc('get_preferences', { actor: userId })),
    route('PUT', '/profile/member', ({ userId, body, deps }) => {
      if (typeof body.displayName !== 'string') throw new AppError('INVALID_REQUEST');
      const name = body.displayName.trim();
      if (Array.from(name).length < 1 || Array.from(name).length > 20) throw new AppError('INVALID_REQUEST');
      let month: number | null = null, day: number | null = null, year: number | null = null;
      if (body.birthday !== null) {
        if (!body.birthday || typeof body.birthday !== 'object' || Array.isArray(body.birthday)) throw new AppError('INVALID_REQUEST');
        const birthday = body.birthday as Record<string, unknown>;
        if (!Number.isInteger(birthday.month) || !Number.isInteger(birthday.day) || (birthday.year != null && !Number.isInteger(birthday.year))) throw new AppError('INVALID_REQUEST');
        month = birthday.month as number; day = birthday.day as number; year = (birthday.year as number | null | undefined) ?? null;
        if (month < 1 || month > 12 || day < 1 || (year !== null && (year < 1900 || year > new Date().getUTCFullYear()))) throw new AppError('INVALID_REQUEST');
        const date = new Date(Date.UTC(year ?? 2000, month - 1, day));
        if (date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) throw new AppError('INVALID_REQUEST');
      }
      return deps.db.rpc('set_member_profile', { actor: userId, p_name: name, p_month: month, p_day: day, p_year: year });
    }),
    route('PATCH', '/profile/preferences', ({ userId, body, deps }) => {
      if (!('locale' in body) || typeof body.uiTheme !== 'string') throw new AppError('INVALID_REQUEST');
      return deps.db.rpc('set_preferences', { actor: userId, new_locale: body.locale, new_theme: body.uiTheme });
    }),
    route('PUT', '/profile/photo', async ({ userId, body, deps }) => {
      let photo: Uint8Array;
      try { photo = await reencodeProfilePhoto(decodePhoto(body.image)); } catch { throw new AppError('INVALID_REQUEST'); }
      const path = `${userId}/${crypto.randomUUID()}.jpg`;
      await photos.upload(path, photo);
      let previous: string | null;
      try { ({ previous } = await deps.db.rpc<{ previous: string | null }>('set_profile_photo', { actor: userId, p_path: path })); }
      catch (error) { await photos.remove([path]).catch(() => {}); throw error; }
      await removePrevious(previous);
      return new Response(null, { status: 204 });
    }),
    route('DELETE', '/profile/photo', async ({ userId, deps }) => {
      const { previous } = await deps.db.rpc<{ previous: string | null }>('set_profile_photo', { actor: userId, p_path: null });
      await removePrevious(previous);
      return new Response(null, { status: 204 });
    }),
  ], deps);
}
if (import.meta.main) Deno.serve(profileHandler(defaultDeps()));
