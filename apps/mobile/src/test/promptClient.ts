import type { Conversation, Preview, PromptSession } from '../lib/client';
import type { PanelClient } from '../features/prompt/PromptPanel';
import { snapshotFixture } from './fixtures';
export const lease = (ownerUserId: string, expiresAt: string, sessionId = 'session-1'): PromptSession => ({ sessionId, ownerUserId, expiresAt, status: 'occupied' });
export const previewFixture = (previewId = 'preview-1'): Preview => {
  const base = snapshotFixture();
  return { previewId, sceneDocument: { ...base.sceneDocument, objects: [...base.sceneDocument.objects, { assetId: 'obj_decor_lamp', x: 0.2, y: 0.6, width: 0.15, height: 0.2, rotationDeg: 0, zIndex: 2, opacity: 1 }] }, roomPresentation: base.roomPresentation, roomThemeDocument: base.roomThemeDocument, expiresAt: '2026-10-28T03:00:00Z' };
};
export function panelClient(overrides: Partial<PanelClient> = {}, conversation: Conversation = { messages: [], session: null, currentPreview: null }): jest.Mocked<PanelClient> {
  return {
    acquire: jest.fn(), heartbeat: jest.fn(), takeover: jest.fn(), release: jest.fn().mockResolvedValue(undefined),
    conversation: jest.fn().mockResolvedValue(conversation), requestPreview: jest.fn(), confirmPreview: jest.fn(), cancelPreview: jest.fn().mockResolvedValue(undefined), undo: jest.fn(),
    ...overrides,
  } as jest.Mocked<PanelClient>;
}
