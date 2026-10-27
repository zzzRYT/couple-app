import { createHandler, defaultDeps, route, uuidParam, type Deps } from '../_shared/http.ts';

export function aiConsentHandler(deps: Deps) {
  return createHandler([
    route('PUT', '/spaces/:spaceId/ai-consent', ({ userId, params, body, deps }) =>
      deps.db.rpc('set_ai_consent', { actor: userId, target: uuidParam(params.spaceId), new_state: body.state, notice: body.noticeVersion })),
  ], deps);
}
if (import.meta.main) Deno.serve(aiConsentHandler(defaultDeps()));
