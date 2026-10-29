import type { MySpace } from './client';

export type AppGate =
  | { kind: 'booting' }
  | { kind: 'signedOut' }
  | { kind: 'sessionExpired' }
  | { kind: 'needsOnboardingChoice'; pendingInvite: string | null }
  | { kind: 'ended'; notice: MySpace['ended'] }
  | { kind: 'active'; spaceId: string };

export type AppGateInput = {
  fontsLoaded: boolean;
  sessionLoaded: boolean;
  hasSession: boolean;
  sessionExpired?: boolean;
  entry: 'loading' | 'active' | 'ended' | 'none' | 'error';
  spaceId?: string | null;
  ended?: MySpace['ended'];
  pendingInviteLoaded: boolean;
  pendingInvite?: string | null;
};

/** Pure routing decision shared by the root navigator and transition tests. */
export function appGate(input: AppGateInput): AppGate {
  if (!input.fontsLoaded || !input.sessionLoaded) return { kind: 'booting' };
  if (input.sessionExpired) return { kind: 'sessionExpired' };
  if (!input.hasSession) return { kind: 'signedOut' };
  if (!input.pendingInviteLoaded || input.entry === 'loading' || input.entry === 'error') return { kind: 'booting' };
  if (input.entry === 'ended' && input.ended) return { kind: 'ended', notice: input.ended };
  if (input.entry === 'active' && input.spaceId) return { kind: 'active', spaceId: input.spaceId };
  return { kind: 'needsOnboardingChoice', pendingInvite: input.pendingInvite ?? null };
}
