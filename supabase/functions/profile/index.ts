import { AppError } from '../_shared/errors.ts';
import { createHandler, defaultDeps, route, type Deps } from '../_shared/http.ts';

export function profileHandler(deps: Deps) {
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
  ], deps);
}
if (import.meta.main) Deno.serve(profileHandler(defaultDeps()));
