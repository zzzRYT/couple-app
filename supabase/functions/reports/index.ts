import { AppError } from '../_shared/errors.ts';
import { createHandler, defaultDeps, json, route, str, uuidParam, type Deps } from '../_shared/http.ts';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/** Reports are separate from disconnecting: they never end the space and the app is never told how they were handled. */
export function reportsHandler(deps: Deps) {
  return createHandler([
    route('POST', '/spaces/:spaceId/reports', async ({ userId, params, body, deps }) => {
      const messageId = body.messageId === undefined || body.messageId === null ? null : str(body.messageId, 36);
      if (messageId !== null && !UUID.test(messageId)) throw new AppError('INVALID_REQUEST');
      const detail = body.detail === undefined || body.detail === null ? null : str(body.detail, 200);
      return json(await deps.db.rpc('submit_report', {
        actor: userId, target: uuidParam(params.spaceId), report_target: str(body.target, 32), report_reason: str(body.reason, 32), report_detail: detail, report_message: messageId,
      }), 201);
    }),
  ], deps);
}
if (import.meta.main) Deno.serve(reportsHandler(defaultDeps()));
