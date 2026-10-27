/** Maps the logical routes of contracts/api.md onto Supabase Edge Function names. */
export const routes = {
  createSpace: () => 'spaces/spaces',
  mySpace: () => 'spaces/spaces/mine',
  snapshot: (spaceId: string) => `spaces/spaces/${spaceId}/snapshot`,
  anniversary: (spaceId: string) => `spaces/spaces/${spaceId}/anniversary`,
  createInvitation: (spaceId: string) => `invitations/spaces/${spaceId}/invitations`,
  previewInvitation: () => 'invitations/invitations/preview',
  acceptInvitation: () => 'invitations/invitations/accept',
  preferences: () => 'profile/profile/preferences',
  conversation: (spaceId: string) => `prompt-session/spaces/${spaceId}/prompt-conversation`,
  acquire: (spaceId: string) => `prompt-session/spaces/${spaceId}/prompt-session/acquire`,
  session: (spaceId: string, sessionId: string, action: 'heartbeat' | 'takeover' | 'release' | 'undo') => `prompt-session/spaces/${spaceId}/prompt-session/${sessionId}/${action}`,
  consent: (spaceId: string) => `ai-consent/spaces/${spaceId}/ai-consent`,
  previews: (spaceId: string) => `decoration-previews/spaces/${spaceId}/decoration-previews`,
  confirmPreview: (spaceId: string, previewId: string) => `decoration-previews/spaces/${spaceId}/decoration-previews/${previewId}/confirm`,
  cancelPreview: (spaceId: string, previewId: string, sessionId: string) => `decoration-previews/spaces/${spaceId}/decoration-previews/${previewId}?sessionId=${encodeURIComponent(sessionId)}`,
  mascotRecall: (spaceId: string) => `room/spaces/${spaceId}/room/mascot-recall`,
} as const;
export const spaceChannel = (spaceId: string) => `space:${spaceId}`;
