import { AppError } from '../_shared/errors.ts';
import { createHandler, defaultDeps, json, route, str, uuidParam, type Deps } from '../_shared/http.ts';
import { parseCalendarDate } from '../_shared/dday.ts';

function calendarDate(value: unknown): string {
  const date = str(value, 10);
  if (parseCalendarDate(date) === null) throw new AppError('INVALID_REQUEST');
  return date;
}
export function spacesHandler(deps: Deps) {
  return createHandler([
    route('POST', '/spaces', async ({ userId, body, deps }) =>
      json(await deps.db.rpc('create_space', { actor: userId, anniversary: calendarDate(body.anniversaryDate), tz: str(body.timeZone ?? 'UTC', 64) }), 201)),
    route('GET', '/spaces/mine', ({ userId, deps }) => deps.db.rpc('my_spaces', { actor: userId })),
    route('POST', '/spaces/mine/ended/ack', async ({ userId, deps }) => {
      await deps.db.rpc('ack_ended_notice', { actor: userId });
      return new Response(null, { status: 204 });
    }),
    route('GET', '/spaces/:spaceId/snapshot', async ({ userId, params, deps }) => {
      const snapshot = await deps.db.rpc('space_snapshot', { actor: userId, target: uuidParam(params.spaceId) });
      if (!snapshot) throw new AppError('NOT_FOUND');
      return snapshot;
    }),
    route('PATCH', '/spaces/:spaceId/anniversary', ({ userId, params, body, deps }) =>
      deps.db.rpc('update_anniversary', { actor: userId, target: uuidParam(params.spaceId), anniversary: calendarDate(body.anniversaryDate), expected: str(body.expectedUpdatedAt, 64) })),
  ], deps);
}
if (import.meta.main) Deno.serve(spacesHandler(defaultDeps()));
