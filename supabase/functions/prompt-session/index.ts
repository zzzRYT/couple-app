import { createHandler, defaultDeps, json, route, uuidParam, type Deps } from '../_shared/http.ts';

export function promptSessionHandler(deps: Deps) {
  const ids = (params: Record<string, string>) => ({ target: uuidParam(params.spaceId), session: uuidParam(params.sessionId) });
  return createHandler([
    route('GET', '/spaces/:spaceId/prompt-conversation', ({ userId, params, deps }) =>
      deps.db.rpc('prompt_conversation', { actor: userId, target: uuidParam(params.spaceId) })),
    route('POST', '/spaces/:spaceId/prompt-session/acquire', async ({ userId, params, deps }) =>
      json(await deps.db.rpc('acquire_session', { actor: userId, target: uuidParam(params.spaceId) }), 201)),
    route('POST', '/spaces/:spaceId/prompt-session/:sessionId/heartbeat', ({ userId, params, body, deps }) =>
      deps.db.rpc('heartbeat_session', { actor: userId, ...ids(params), active: body.active !== false })),
    route('POST', '/spaces/:spaceId/prompt-session/:sessionId/takeover', ({ userId, params, body, deps }) =>
      deps.db.rpc('takeover_session', { actor: userId, ...ids(params), expected_owner: uuidParam(body.expectedOwnerUserId) })),
    route('POST', '/spaces/:spaceId/prompt-session/:sessionId/release', async ({ userId, params, body, deps }) => {
      await deps.db.rpc('release_session', { actor: userId, ...ids(params), reason: body.reason });
      return new Response(null, { status: 204 });
    }),
    route('POST', '/spaces/:spaceId/prompt-session/:sessionId/undo', ({ userId, params, body, deps }) =>
      deps.db.rpc('undo_preview', { actor: userId, ...ids(params), expected: uuidParam(body.expectedPreviewId) })),
  ], deps);
}
if (import.meta.main) Deno.serve(promptSessionHandler(defaultDeps()));
