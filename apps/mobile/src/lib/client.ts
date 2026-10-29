import type { Api } from './api';
import { routes } from './routes';
export type Locale = 'ko-KR' | 'en-US' | 'ja-JP';
export type SceneDocument = { schemaVersion: 1; canvasProfile: 'room-portrait-v1'; objects: SceneObject[]; texts: SceneText[] };
export type SceneObject = { assetId: string; x: number; y: number; width: number; height: number; rotationDeg: number; zIndex: number; opacity: number; flipX?: boolean };
export type SceneText = { text: string; x: number; y: number; width: number; height: number; rotationDeg: number; zIndex: number; styleToken: 'text.primary' | 'text.accent' | 'text.soft' };
export type RoomPresentation = { schemaVersion: 1; visible: boolean; x: number; y: number; width: number; height: number; styleToken: string; textScale: number; surfaceToken?: string };
export type RoomThemeDocument = { schemaVersion: 1; mode: 'day' | 'night' | 'follow_time'; timeZone: string; day: unknown; night: unknown };
export type PromptSession = { sessionId: string; ownerUserId: string; expiresAt: string; status: 'occupied' | 'released' | 'expired' };
export type Snapshot = {
  space: { spaceId: string; status: 'active'; anniversaryDate: string; timeZone: string; memberCount: number; updatedAt: string; invitation: { status: string; expiresAt: string } | null };
  features: { generation: boolean; generatedRender: boolean }; versionNumber: number; sceneDocument: SceneDocument; roomPresentation: RoomPresentation; roomThemeDocument: RoomThemeDocument;
  promptSession: PromptSession | null; catalogVersion: number | string; serverTime: string; members: { userId: string; aiConsentState: 'not_given' | 'granted' | 'revoked' }[]; me: { userId: string };
};
export type MySpace = { active: { spaceId: string } | null; ended: { kind: 'ended' | 'disconnect' | 'account_deleted'; by: 'me' | 'partner'; at: string } | null };
export type Preview = { previewId: string; sceneDocument: SceneDocument; roomPresentation: RoomPresentation; roomThemeDocument: RoomThemeDocument; expiresAt: string; baseVersion?: number };
export type Message = { id: string; kind: 'user_prompt' | 'preview' | 'status'; authorUserId: string | null; bodyText: string | null; previewId: string | null; state: string | null; createdAt: string };
export type ReportTarget = 'partner' | 'shared_text' | 'room_scene';
export type ReportReason = 'harass' | 'inappropriate' | 'privacy' | 'other';
export type ReportInput = { target: ReportTarget; reason: ReportReason; detail?: string; messageId?: string };
export type Conversation = { messages: Message[]; session: PromptSession | null; currentPreview: Preview | null };
export function createClient(api: Api) {
  return {
    createSpace: (anniversaryDate: string, timeZone: string) => api.json<{ spaceId: string; memberCount: number }>(routes.createSpace(), { method: 'POST', body: { anniversaryDate, timeZone } }),
    mySpace: () => api.json<MySpace>(routes.mySpace()),
    snapshot: (spaceId: string) => api.json<Snapshot>(routes.snapshot(spaceId)),
    endSpace: (spaceId: string) => api.json<{ status: 'ended' }>(routes.endSpace(spaceId), { method: 'POST', body: { confirm: true } }),
    /** The screen says "disconnect"; the contract endpoint is still `block`. */
    disconnect: (spaceId: string) => api.json<{ status: 'ended' }>(routes.disconnect(spaceId), { method: 'POST', body: { confirm: true } }),
    ackEnded: () => api.json<void>(routes.ackEnded(), { method: 'POST', body: {} }),
    submitReport: (spaceId: string, input: ReportInput) => api.json<{ reportId: string }>(routes.report(spaceId), { method: 'POST', body: input }),
    updateAnniversary: (spaceId: string, anniversaryDate: string, expectedUpdatedAt: string) => api.json<{ anniversaryDate: string; updatedAt: string; milestonesReset: string[] }>(routes.anniversary(spaceId), { method: 'PATCH', body: { anniversaryDate, expectedUpdatedAt } }),
    createInvitation: (spaceId: string) => api.json<{ invitationId: string; code: string; expiresAt: string }>(routes.createInvitation(spaceId), { method: 'POST', body: { expiresInSeconds: 86400 } }),
    previewInvitation: (code: string) => api.json<{ anniversaryDate: string; memberCount: number }>(routes.previewInvitation(), { method: 'POST', body: { code } }),
    acceptInvitation: (code: string) => api.json<{ spaceId: string; memberCount: number }>(routes.acceptInvitation(), { method: 'POST', body: { code } }),
    preferences: () => api.json<{ locale: Locale | null; uiTheme: 'system' | 'light' | 'dark' }>(routes.preferences()),
    savePreferences: (locale: Locale | null, uiTheme: 'system' | 'light' | 'dark') => api.json<void>(routes.preferences(), { method: 'PATCH', body: { locale, uiTheme } }),
    conversation: (spaceId: string) => api.json<Conversation>(routes.conversation(spaceId)),
    acquire: (spaceId: string) => api.json<PromptSession>(routes.acquire(spaceId), { method: 'POST', body: {}, keyInBody: true }),
    heartbeat: (spaceId: string, sessionId: string) => api.json<PromptSession>(routes.session(spaceId, sessionId, 'heartbeat'), { method: 'POST', body: {} }),
    takeover: (spaceId: string, sessionId: string, expectedOwnerUserId: string) => api.json<PromptSession>(routes.session(spaceId, sessionId, 'takeover'), { method: 'POST', body: { expectedOwnerUserId }, keyInBody: true }),
    release: (spaceId: string, sessionId: string) => api.json<void>(routes.session(spaceId, sessionId, 'release'), { method: 'POST', body: { reason: 'cancel' } }),
    undo: (spaceId: string, sessionId: string, expectedPreviewId: string) => api.json<{ previewId: string | null }>(routes.session(spaceId, sessionId, 'undo'), { method: 'POST', body: { expectedPreviewId }, keyInBody: true }),
    setConsent: (spaceId: string, state: 'granted' | 'revoked') => api.json<void>(routes.consent(spaceId), { method: 'PUT', body: { state, noticeVersion: 'ai-overseas-v1' } }),
    requestPreview: (spaceId: string, prompt: string, sessionId: string, baseVersion: number) => api.json<Preview>(routes.previews(spaceId), { method: 'POST', body: { prompt, sessionId, baseVersion }, keyInBody: true }),
    confirmPreview: (spaceId: string, previewId: string, sessionId: string, baseVersion: number) => api.json<{ appliedVersion: number; source: 'prompt'; updatedAt: string }>(routes.confirmPreview(spaceId, previewId), { method: 'POST', body: { baseVersion, sessionId }, keyInBody: true }),
    cancelPreview: (spaceId: string, previewId: string, sessionId: string) => api.json<void>(routes.cancelPreview(spaceId, previewId, sessionId), { method: 'DELETE' }),
    mascotRecall: (spaceId: string, expectedVersion: number) => api.json<{ versionNumber: number }>(routes.mascotRecall(spaceId), { method: 'POST', body: { expectedVersion }, keyInBody: true }),
  };
}
export type Client = ReturnType<typeof createClient>;
