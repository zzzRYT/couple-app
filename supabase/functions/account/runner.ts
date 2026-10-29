// The account deletion state machine after the accepting transaction (spec FR-073, Decided 45 and 47). Each step is
// idempotent and recorded in account_deletion.state, so a crash or a provider outage resumes where it stopped.
// No Deno globals or runtime imports: the same module runs in Deno and in Node tests (tools/tests).
import type { Db } from '../_shared/db.ts';
import type { SpaceStorage } from '../_shared/spaceStorage.ts';
import type { AppleClient, AppleTokens } from '../_shared/providers/apple.ts';
import type { KakaoClient } from '../_shared/providers/kakao.ts';
import type { CredentialBox } from '../_shared/credentialBox.ts';
import type { Provider } from './reauth.ts';

export type DeletionState = 'requested' | 'space_ended' | 'provider_revoked' | 'auth_deleted' | 'done';
type Claimed = { state: DeletionState; provider: Provider; origin: 'app' | 'operator'; attempts: number; credential: string | null };
export interface AuthAdmin {
  /** The provider's own user id from the auth user's identities (needed for Kakao unlink), or null. */
  providerUserId(userId: string, provider: Provider): Promise<string | null>;
  /** Hard-deletes the auth user; an already deleted user is success. */
  deleteUser(userId: string): Promise<void>;
}
export type DeletionPorts = {
  db: Db; storage: SpaceStorage; auth: AuthAdmin; apple: AppleClient; kakao: KakaoClient | null; box: CredentialBox;
  now?: () => Date;
  /** Operational warning with a content-free code only; never a user id, token or message. */
  warn?: (code: string) => void;
};
/** After this many failures in one step the runner keeps retrying but also raises an operational warning. */
export const ALERT_ATTEMPTS = 8;
// purge_space compares purge_after with this time; the deletion owns these spaces and has already made them due, so no clock skew can skip one.
const PURGE_NOW = 'infinity';

type StepResult = { next: DeletionState; note?: string };

/**
 * Runs the deletion of one person from its recorded state to `done`, holding the lease so the request handler and the
 * sweep never run it together. Returns the state reached, or null when another runner holds it or nothing is pending.
 */
export async function runAccountDeletion(userId: string, ports: DeletionPorts): Promise<DeletionState | null> {
  const now = ports.now ?? (() => new Date());
  const claimed = await ports.db.rpc<Claimed | null>('claim_account_deletion', { actor: userId, at: now().toISOString() });
  if (!claimed) return null;
  let state = claimed.state;
  try {
    while (state !== 'done') {
      const { next, note } = await step(state, userId, claimed, ports);
      const moved = await ports.db.rpc<boolean>('advance_account_deletion', { actor: userId, from_state: state, to_state: next, note: note ?? null });
      if (!moved) { await ports.db.rpc('release_account_deletion', { actor: userId }); return null; }
      if (note) ports.warn?.(note);
      state = next;
    }
    return state;
  } catch (error) {
    const code = errorCode(error);
    const attempts = await ports.db.rpc<number>('record_account_deletion_failure', { actor: userId, code, at: now().toISOString() });
    if (attempts >= ALERT_ATTEMPTS) ports.warn?.(code);
    return state;
  }
}

async function step(state: DeletionState, userId: string, claimed: Claimed, ports: DeletionPorts): Promise<StepResult> {
  switch (state) {
    case 'requested':
      await purgeSpaces(userId, ports);
      return { next: 'space_ended' };
    case 'space_ended':
      return await revokeProvider(userId, claimed, ports);
    case 'provider_revoked':
      await purgeSpaces(userId, ports);
      await ports.db.rpc('finish_account_deletion', { actor: userId });
      await ports.auth.deleteUser(userId);
      return { next: 'auth_deleted' };
    case 'auth_deleted':
      return { next: 'done' };
    default:
      throw new Error('INVALID_STATE');
  }
}

// Account deletion hard-deletes every space the person belonged to right away (Decided 47): Storage first, then rows. Safe to repeat.
async function purgeSpaces(userId: string, ports: DeletionPorts): Promise<void> {
  const spaces = await ports.db.rpc<string[]>('close_spaces_for_deletion', { actor: userId });
  for (const spaceId of spaces) {
    await ports.db.rpc('mark_purge_started', { target: spaceId });
    await ports.storage.removeSpaceObjects(spaceId);
    await ports.db.rpc<boolean>('purge_space', { target: spaceId, at: PURGE_NOW });
  }
}

async function revokeProvider(userId: string, claimed: Claimed, ports: DeletionPorts): Promise<StepResult> {
  if (claimed.provider === 'email') return { next: 'provider_revoked' };
  if (claimed.provider === 'apple') {
    // Out-of-app requests have no re-authentication code, and a kept token expires after 24 hours: record that and move on.
    if (!claimed.credential) return { next: 'provider_revoked', note: claimed.origin === 'operator' ? 'APPLE_TOKEN_UNAVAILABLE' : 'APPLE_TOKEN_EXPIRED' };
    const tokens = JSON.parse(await ports.box.open(claimed.credential)) as AppleTokens;
    await ports.apple.revoke(tokens);
    return { next: 'provider_revoked' };
  }
  if (!ports.kakao) throw Object.assign(new Error('PROVIDER_NOT_CONFIGURED'), { code: 'PROVIDER_NOT_CONFIGURED' });
  const kakaoId = await ports.auth.providerUserId(userId, 'kakao');
  if (!kakaoId) return { next: 'provider_revoked', note: 'KAKAO_ID_UNAVAILABLE' };
  await ports.kakao.unlink(kakaoId);
  return { next: 'provider_revoked' };
}

/** A stable, content-free code for account_deletion.last_error_code; messages from providers or the database are never stored. */
export function errorCode(error: unknown): string {
  const code = (error as { code?: unknown })?.code;
  if (typeof code === 'string' && /^[A-Z][A-Z0-9_]{0,63}$/.test(code)) return code;
  const message = error instanceof Error ? error.message : '';
  return /^[A-Z][A-Z0-9_]{0,63}$/.test(message) ? message : 'STEP_FAILED';
}

/** The sweep's safety net: resumes deletions that stopped part-way (crash, provider outage), oldest first. */
export async function resumeAccountDeletions(ports: DeletionPorts, at: Date): Promise<{ resumed: number; pending: number }> {
  const due = await ports.db.rpc<string[]>('due_account_deletions', { at: at.toISOString(), max_count: 20 });
  let resumed = 0, pending = 0;
  for (const userId of due) {
    const reached = await runAccountDeletion(userId, ports).catch(() => null);
    if (reached === 'done') resumed++; else pending++;
  }
  return { resumed, pending };
}
