import { call, localDeps, type TestUser } from './local.ts';
import { couple } from './fixtures.ts';
import { fakeModel, type Reply } from './fakeModel.ts';
import { decorationPreviewsHandler } from '../../decoration-previews/index.ts';
import { promptSessionHandler } from '../../prompt-session/index.ts';
import { aiConsentHandler } from '../../ai-consent/index.ts';
import { roomHandler } from '../../room/index.ts';
import { spacesHandler } from '../../spaces/index.ts';

/** A consenting couple with handlers for every room endpoint. */
export async function consentingRoom(replies: Reply[] = []) {
  const deps = await localDeps();
  const spy = fakeModel(replies);
  const h = { previews: decorationPreviewsHandler(deps, spy.model), session: promptSessionHandler(deps), room: roomHandler(deps), spaces: spacesHandler(deps) };
  const c = await couple(deps);
  const consent = aiConsentHandler(deps);
  for (const u of [c.a, c.b]) await call(consent, u, 'PUT', `/ai-consent/spaces/${c.spaceId}/ai-consent`, { state: 'granted', noticeVersion: 'ai-overseas-v1' });
  const s = `/prompt-session/spaces/${c.spaceId}/prompt-session`, p = `/decoration-previews/spaces/${c.spaceId}/decoration-previews`;
  return {
    ...c, deps, spy, h,
    acquire: async (u: TestUser) => (await call(h.session, u, 'POST', `${s}/acquire`, {})).body.sessionId as string,
    preview: (u: TestUser, sessionId: string, prompt: string, baseVersion = 1) => call(h.previews, u, 'POST', p, { prompt, sessionId, baseVersion }),
    confirm: (u: TestUser, sessionId: string, previewId: string, baseVersion = 1, key?: string) => call(h.previews, u, 'POST', `${p}/${previewId}/confirm`, { sessionId, baseVersion }, key),
    cancel: (u: TestUser, sessionId: string, previewId: string) => call(h.previews, u, 'DELETE', `${p}/${previewId}?sessionId=${sessionId}`),
    undo: (u: TestUser, sessionId: string, expectedPreviewId: string) => call(h.session, u, 'POST', `${s}/${sessionId}/undo`, { expectedPreviewId }),
    conversation: (u: TestUser) => call(h.session, u, 'GET', `/prompt-session/spaces/${c.spaceId}/prompt-conversation`),
    snapshot: (u: TestUser) => call(h.spaces, u, 'GET', `/spaces/spaces/${c.spaceId}/snapshot`),
    recall: (u: TestUser, expectedVersion: number) => call(h.room, u, 'POST', `/room/spaces/${c.spaceId}/room/mascot-recall`, { expectedVersion }),
  };
}
