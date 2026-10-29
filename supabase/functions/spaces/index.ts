import { AppError } from '../_shared/errors.ts';
import { createHandler, defaultDeps, json, route, str, uuidParam, type Deps } from '../_shared/http.ts';
import { parseCalendarDate } from '../_shared/dday.ts';

function calendarDate(value: unknown): string {
  const date = str(value, 10);
  if (parseCalendarDate(date) === null) throw new AppError('INVALID_REQUEST');
  return date;
}
function requireConfirm(body: Record<string, unknown>) {
  if (body.confirm !== true) throw new AppError('INVALID_REQUEST');
}
function roomMode(body: Record<string, unknown>) {
  if (body.mode !== 'day' && body.mode !== 'night' && body.mode !== 'follow_time') throw new AppError('INVALID_REQUEST');
  const timeZone = str(body.timeZone, 64);
  try { new Intl.DateTimeFormat('en-US', { timeZone }).format(0); } catch { throw new AppError('INVALID_REQUEST'); }
  if (!Number.isInteger(body.expectedCurrentVersion) || (body.expectedCurrentVersion as number) < 1) throw new AppError('INVALID_REQUEST');
  return { mode: body.mode, timeZone, expected: body.expectedCurrentVersion as number };
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
    // "Disconnect" is the screen name; the endpoint keeps the contract name `block`. Both are the same soft delete with a different reason.
    route('POST', '/spaces/:spaceId/end', ({ userId, params, body, deps }) => {
      requireConfirm(body);
      return deps.db.rpc('end_space', { actor: userId, target: uuidParam(params.spaceId), reason: 'ended' });
    }),
    route('POST', '/spaces/:spaceId/block', ({ userId, params, body, deps }) => {
      requireConfirm(body);
      return deps.db.rpc('end_space', { actor: userId, target: uuidParam(params.spaceId), reason: 'disconnect' });
    }),
    route('PATCH', '/spaces/:spaceId/anniversary', ({ userId, params, body, deps }) =>
      deps.db.rpc('update_anniversary', { actor: userId, target: uuidParam(params.spaceId), anniversary: calendarDate(body.anniversaryDate), expected: str(body.expectedUpdatedAt, 64) })),
    route('PATCH', '/spaces/:spaceId/room-mode', ({ userId, params, body, deps }) => {
      const change = roomMode(body);
      return deps.db.rpc('update_room_mode', { actor: userId, target: uuidParam(params.spaceId), new_mode: change.mode, new_time_zone: change.timeZone, expected_version: change.expected });
    }),
  ], deps);
}
if (import.meta.main) Deno.serve(spacesHandler(defaultDeps()));
