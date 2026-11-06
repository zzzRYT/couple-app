import type { MySpace } from './client';

export type AppGate =
  | { kind: 'booting' }
  | { kind: 'signedOut' }
  | { kind: 'sessionExpired' }
  | { kind: 'passwordRecovery' }
  | { kind: 'needsPasswordPrompt' }
  | { kind: 'needsOnboardingChoice'; pendingInvite: string | null }
  | { kind: 'needsProfile' }
  | { kind: 'offlineEmpty' }
  | { kind: 'ended'; notice: MySpace['ended'] }
  | { kind: 'active'; spaceId: string };

export type AppGateInput = {
  fontsLoaded: boolean;
  sessionLoaded: boolean;
  hasSession: boolean;
  sessionExpired?: boolean;
  entry: 'loading' | 'active' | 'ended' | 'none' | 'error' | 'offlineEmpty';
  spaceId?: string | null;
  ended?: MySpace['ended'];
  pendingInviteLoaded: boolean;
  pendingInvite?: string | null;
  snapshotProfile?: string | null;
  /** A mail link opened this session to set a new password (V0-auth-newpw). */
  passwordRecovery?: boolean;
  /** V0-auth-setpw-prompt is due; undefined while it is being read. Accounts with a space see the sheet on home instead. */
  passwordPrompt?: boolean;
};

/** Pure routing decision shared by the root navigator and transition tests. */
export function appGate(input: AppGateInput): AppGate {
  if (!input.fontsLoaded || !input.sessionLoaded) return { kind: 'booting' };
  if (input.sessionExpired) return { kind: 'sessionExpired' };
  if (!input.hasSession) return { kind: 'signedOut' };
  if (input.passwordRecovery) return { kind: 'passwordRecovery' };
  if (!input.pendingInviteLoaded || input.entry === 'loading' || input.entry === 'error') return { kind: 'booting' };
  if (input.entry === 'offlineEmpty') return { kind: 'offlineEmpty' };
  if (input.entry === 'ended' && input.ended) return { kind: 'ended', notice: input.ended };
  if (input.entry === 'active' && input.spaceId) {
    if (input.snapshotProfile === undefined) return { kind: 'booting' };
    if (input.snapshotProfile === null) return { kind: 'needsProfile' };
    return { kind: 'active', spaceId: input.spaceId };
  }
  if (input.passwordPrompt === undefined) return { kind: 'booting' };
  if (input.passwordPrompt) return { kind: 'needsPasswordPrompt' };
  return { kind: 'needsOnboardingChoice', pendingInvite: input.pendingInvite ?? null };
}
