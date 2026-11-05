import { AppError } from '../_shared/errors.ts';
import { createHandler, defaultDeps, json, route, str, uuidParam, type Deps } from '../_shared/http.ts';
import { parseCalendarDate } from '../_shared/dday.ts';

function calendarDate(value: unknown): string {
  const date = str(value, 10);
  if (parseCalendarDate(date) === null) throw new AppError('INVALID_REQUEST');
  return date;
}
function anniversaryBody(body: Record<string, unknown>) {
  if (typeof body.title !== 'string' || (body.memo !== null && typeof body.memo !== 'string')) throw new AppError('INVALID_REQUEST');
  const title = body.title.trim();
  const count = (value: string) => [...new Intl.Segmenter('ko', { granularity: 'grapheme' }).segment(value)].length;
  if (!title || count(title) > 20 || [...title].length > 40 || (typeof body.memo === 'string' && (count(body.memo) > 100 || [...body.memo].length > 200))) throw new AppError('INVALID_REQUEST');
  if (body.repeat !== 'yearly' && body.repeat !== 'once') throw new AppError('INVALID_REQUEST');
  return { p_title: title, p_memo: body.memo, p_date: calendarDate(body.date), p_repeat: body.repeat };
}
function expectedVersion(value: unknown): number {
  if (!Number.isInteger(value) || (value as number) < 1) throw new AppError('INVALID_REQUEST');
  return value as number;
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
    route('POST', '/spaces/:spaceId/anniversaries', async ({ userId, params, body, deps }) =>
      json(await deps.db.rpc('create_custom_anniversary', { actor: userId, target: uuidParam(params.spaceId), ...anniversaryBody(body) }), 201)),
    route('PATCH', '/spaces/:spaceId/anniversaries/:anniversaryId', ({ userId, params, body, deps }) =>
      deps.db.rpc('update_custom_anniversary', { actor: userId, target: uuidParam(params.spaceId), p_id: uuidParam(params.anniversaryId), p_expected_version: expectedVersion(body.expectedVersion), ...anniversaryBody(body) })),
    route('DELETE', '/spaces/:spaceId/anniversaries/:anniversaryId', async ({ userId, params, body, deps }) => {
      await deps.db.rpc('delete_custom_anniversary', { actor: userId, target: uuidParam(params.spaceId), p_id: uuidParam(params.anniversaryId), p_expected_version: expectedVersion(body.expectedVersion) });
      return new Response(null, { status: 204 });
    }),
    route('PATCH', '/spaces/:spaceId/time-zone', ({ userId, params, body, deps }) => {
      const timeZone = str(body.timeZone, 64);
      try { new Intl.DateTimeFormat('en-US', { timeZone }).format(0); } catch { throw new AppError('INVALID_REQUEST'); }
      return deps.db.rpc('update_space_time_zone', { actor: userId, target: uuidParam(params.spaceId), tz: timeZone, expected: str(body.expectedUpdatedAt, 64) });
    }),
    route('PATCH', '/spaces/:spaceId/room-mode', ({ userId, params, body, deps }) => {
      const change = roomMode(body);
      return deps.db.rpc('update_room_mode', { actor: userId, target: uuidParam(params.spaceId), new_mode: change.mode, new_time_zone: change.timeZone, expected_version: change.expected });
    }),
  ], deps);
}
if (import.meta.main) Deno.serve(spacesHandler(defaultDeps()));
