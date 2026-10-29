import { AppError } from '../_shared/errors.ts';
import { createHandler, defaultDeps, json, route, uuidParam, type Deps } from '../_shared/http.ts';
import { computeMilestones } from '../_shared/milestones.ts';
import { buildMilestonePreset } from '../_shared/milestonePresets.ts';

type Context = { eligible: boolean; anniversaryDate?: string; timeZone?: string; serverTime?: string };
type Celebration = { id: string; key: string; kind: 'day' | 'anniversary'; days: number | null; anniversaryN: number | null; milestoneDate: string; seenByMe: boolean; presetApplied: boolean };
export function milestonesHandler(deps: Deps) {
  return createHandler([
    route('GET', '/spaces/:spaceId/milestones/current', async ({ userId, params, deps }) => {
      const target = uuidParam(params.spaceId);
      let context: Context | null = null, result: ReturnType<typeof computeMilestones> | null = null;
      for (let attempt = 0; attempt < 2; attempt++) {
        context = await deps.db.rpc<Context>('milestone_context', { actor: userId, target });
        if (!context.eligible || !context.anniversaryDate || !context.timeZone || !context.serverTime) {
          return { dayCount: null, timezone: context.timeZone ?? null, celebration: null, upcoming: [] };
        }
        result = computeMilestones(context.anniversaryDate, context.timeZone, context.serverTime);
        try {
          await deps.db.rpc('record_milestones', { actor: userId, target, items: result.history, expected_anniversary: context.anniversaryDate,
            expected_timezone: context.timeZone, expected_today: result.today });
          break;
        } catch (error) {
          if (!(error instanceof AppError && error.code === 'VERSION_CONFLICT') || attempt === 1) throw error;
        }
      }
      if (!context || !result) throw new AppError('VERSION_CONFLICT');
      let celebration: Record<string, unknown> | null = null;
      if (result.celebration) {
        const item = await deps.db.rpc<Celebration | null>('read_current_milestone', { actor: userId, target, p_key: result.celebration.key });
        if (item) celebration = { ...item, daysAgo: result.celebration.daysAgo, presetAvailable: !item.presetApplied,
          presetId: item.kind === 'anniversary' ? 'milestone-anniversary' : 'milestone-day' };
      }
      return { dayCount: result.dayCount, timezone: context.timeZone, celebration, upcoming: result.upcoming };
    }),
    route('POST', '/spaces/:spaceId/milestones/:celebrationId/seen', async ({ userId, params, body, deps }) => {
      if (body.via !== 'home' && body.via !== 'room') throw new AppError('INVALID_REQUEST');
      await deps.db.rpc('mark_milestone_seen', { actor: userId, target: uuidParam(params.spaceId), celebration: uuidParam(params.celebrationId), via: body.via });
      return new Response(null, { status: 204 });
    }),
    route('POST', '/spaces/:spaceId/prompt-session/:sessionId/milestone-preview', async ({ userId, params, body, deps }) => {
      const target = uuidParam(params.spaceId), session = uuidParam(params.sessionId), celebration = uuidParam(body.celebrationId);
      const begun = await deps.db.rpc<Record<string, unknown>>('begin_milestone_preset', { actor: userId, target, session, celebration });
      const locale = body.locale === 'ko-KR' || body.locale === 'ja-JP' ? body.locale : 'en-US';
      let result;
      try {
        result = buildMilestonePreset({ scene: begun.sceneDocument as never, roomPresentation: begun.roomPresentation as Record<string, unknown>,
          roomThemeDocument: begun.roomThemeDocument as Record<string, unknown>, key: String(begun.key), kind: begun.kind as 'day' | 'anniversary',
          days: begun.days as number | null, anniversaryN: begun.anniversaryN as number | null, locale, activeAssetIds: begun.activeAssetIds as string[] });
      } catch (error) {
        if (error instanceof Error && error.message === 'ROOM_FULL') throw new AppError('ROOM_FULL');
        throw error;
      }
      return json(await deps.db.rpc('store_milestone_preset', { actor: userId, target, session, celebration,
        base_version: begun.baseVersion, candidate: result.candidate, placed: result.placed, requested: result.requested }), 201);
    }),
  ], deps);
}
if (import.meta.main) Deno.serve(milestonesHandler(defaultDeps()));
