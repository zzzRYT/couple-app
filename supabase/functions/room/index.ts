import { AppError } from '../_shared/errors.ts';
import { createHandler, defaultDeps, route, uuidParam, type Deps } from '../_shared/http.ts';

export function roomHandler(deps: Deps) {
  return createHandler([
    route('POST', '/spaces/:spaceId/room/mascot-recall', ({ userId, params, body, deps }) => {
      if (!Number.isInteger(body.expectedVersion)) throw new AppError('INVALID_REQUEST');
      return deps.db.rpc('mascot_recall', { actor: userId, target: uuidParam(params.spaceId), expected_version: body.expectedVersion });
    }),
  ], deps);
}
if (import.meta.main) Deno.serve(roomHandler(defaultDeps()));
