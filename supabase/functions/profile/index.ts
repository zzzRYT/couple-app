import { AppError } from '../_shared/errors.ts';
import { createHandler, defaultDeps, route, type Deps } from '../_shared/http.ts';

export function profileHandler(deps: Deps) {
  return createHandler([
    route('GET', '/profile/preferences', ({ userId, deps }) => deps.db.rpc('get_preferences', { actor: userId })),
    route('PATCH', '/profile/preferences', ({ userId, body, deps }) => {
      if (!('locale' in body) || typeof body.uiTheme !== 'string') throw new AppError('INVALID_REQUEST');
      return deps.db.rpc('set_preferences', { actor: userId, new_locale: body.locale, new_theme: body.uiTheme });
    }),
  ], deps);
}
if (import.meta.main) Deno.serve(profileHandler(defaultDeps()));
