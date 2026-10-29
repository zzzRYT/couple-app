import { anthropicModel, ModelFailure, type DecorationModel, type ModelInput, type ModelProposal } from '../_shared/anthropic.ts';
import { AppError } from '../_shared/errors.ts';
import { createHandler, defaultDeps, json, route, str, uuidParam, type Deps } from '../_shared/http.ts';
import { validateCandidate, type Candidate } from '../_shared/sceneValidate.ts';
import { asksToChangeMascot } from './policy.ts';

type Begun = { requestId: string; sceneDocument: { objects: ModelInput['scene']['objects']; texts: ModelInput['scene']['texts'] }; roomPresentation: Record<string, unknown>; roomThemeDocument: Record<string, unknown> };
const PRESENTATION_TOKENS = ['day.default', 'day.card', 'day.minimal', 'day.accent', 'night.default', 'night.card', 'night.minimal', 'night.accent'];
const TEXT_TOKENS = ['text.primary', 'text.accent', 'text.soft'];
const RULES = ['at most 16 objects including the mascot', 'at most 3 texts of 1..40 characters', 'no URLs, markup or links in texts',
  'keep objects inside the room and away from the top 12% and bottom 10% (system bars and controls)', 'rotationDeg -180..180 for objects, -15..15 for texts', 'opacity 0.2..1', 'zIndex 0..31'];

function toCandidate(proposal: ModelProposal, begun: Begun): Candidate {
  // Malformed model output becomes an invalid candidate (repaired once), never a crash that would strand the quota reservation.
  const { visible, x, y, width, height, styleToken, textScale } = proposal.presentation ?? {} as ModelProposal['presentation'];
  const surface = begun.roomPresentation.surfaceToken === undefined ? {} : { surfaceToken: begun.roomPresentation.surfaceToken };
  return {
    sceneDocument: { schemaVersion: 1, canvasProfile: 'room-portrait-v1', objects: proposal.objects ?? null, texts: proposal.texts ?? null },
    roomPresentation: { schemaVersion: 1, visible, x, y, width, height, styleToken, textScale, ...surface },
    // Room mode and time zone are shared settings changed only through room-mode; prompts never touch them.
    roomThemeDocument: begun.roomThemeDocument,
  };
}
export function decorationPreviewsHandler(deps: Deps, model: DecorationModel = anthropicModel()) {
  return createHandler([
    route('POST', '/spaces/:spaceId/decoration-previews', async ({ userId, params, body, deps }) => {
      const target = uuidParam(params.spaceId), prompt = str(body.prompt, 2000);
      if (!Number.isInteger(body.baseVersion)) throw new AppError('INVALID_REQUEST');
      const begun = await deps.db.rpc<Begun>('begin_decoration', { actor: userId, target, session: uuidParam(body.sessionId), base_version: body.baseVersion, prompt });
      const fail = async (code: string, rejected: boolean, repairs: number) =>
        deps.db.rpc('fail_decoration', { request: begun.requestId, code, rejected, repairs });
      if (asksToChangeMascot(prompt)) {
        await fail('UNSUPPORTED_REQUEST', true, 0);
        throw new AppError('UNSUPPORTED_REQUEST');
      }
      const catalog = (await deps.db.rpc<string[]>('active_asset_ids', {})).map((assetId) => ({ assetId, description: assetId.replace(/^obj_/, '').replaceAll('_', ' ') }));
      const input: ModelInput = {
        prompt, scene: { objects: begun.sceneDocument.objects, texts: begun.sceneDocument.texts },
        presentation: begun.roomPresentation as ModelInput['presentation'], catalog: [{ assetId: 'app_mascot', description: 'fixed app mascot' }, ...catalog],
        presentationStyleTokens: PRESENTATION_TOKENS, textStyleTokens: TEXT_TOKENS, rules: RULES,
      };
      let repairs = 0;
      // Announces the stage to both screens; a request cancelled meanwhile reports false, which skips the model call and its cost.
      const stage = async (name: 'generating' | 'repairing') => {
        const alive = await deps.db.rpc<boolean>('mark_decoration_stage', { request: begun.requestId, stage: name }).catch(() => true);
        if (alive === false) throw new AppError('PREVIEW_CHANGED');
      };
      try {
        for (;;) {
          await stage(repairs > 0 ? 'repairing' : 'generating');
          const { proposal, model: modelId } = await model.propose(input, { escalate: repairs > 0 });
          if (proposal.decision !== 'propose') {
            await fail('UNSUPPORTED_REQUEST', true, repairs);
            throw new AppError('UNSUPPORTED_REQUEST');
          }
          const candidate = toCandidate(proposal, begun);
          const validation = validateCandidate(candidate, catalog.map((c) => c.assetId));
          if (validation.ok) {
            const preview = await deps.db.rpc('store_preview', { request: begun.requestId, candidate, repairs,
              prov: { model_provider: 'anthropic', model_id: modelId, request_id: begun.requestId } });
            return json(preview, 201);
          }
          if (repairs >= 1) {
            await fail('INVALID_CANDIDATE', false, repairs);
            throw new AppError('INVALID_CANDIDATE');
          }
          repairs++;
          input.repairErrors = validation.errors;
        }
      } catch (error) {
        if (error instanceof ModelFailure) {
          await fail('GENERATION_FAILED', false, repairs);
          throw new AppError('GENERATION_FAILED');
        }
        throw error;
      }
    }),
    route('POST', '/spaces/:spaceId/decoration-previews/:previewId/confirm', async ({ userId, params, body, deps }) => {
      if (!Number.isInteger(body.baseVersion)) throw new AppError('INVALID_REQUEST');
      const target = uuidParam(params.spaceId), preview = uuidParam(params.previewId);
      const result = await deps.db.rpc<Record<string, unknown>>('confirm_preview', { actor: userId, target, preview,
        session: uuidParam(body.sessionId), base_version: body.baseVersion });
      return json(result, 201);
    }),
    route('DELETE', '/spaces/:spaceId/decoration-previews/:previewId', async ({ userId, params, query, deps }) => {
      await deps.db.rpc('cancel_preview', { actor: userId, target: uuidParam(params.spaceId), preview: uuidParam(params.previewId), session: uuidParam(query.get('sessionId')) });
      return new Response(null, { status: 204 });
    }),
  ], deps);
}
if (import.meta.main) Deno.serve(decorationPreviewsHandler(defaultDeps()));
