import { useSyncExternalStore } from 'react';
import type { Provider } from '../auth/authPort';
import { ApiError } from '../../lib/errors';

export type Reauth = { provider: Provider; authorizationCode?: string };
export type ReauthResult = { kind: 'ok'; reauth: Reauth } | { kind: 'cancelled' } | { kind: 'error' };
/** Re-authentication with the account's provider (lib/reauth.ts); the email path exists only in development builds. */
export type ReauthPort = {
  apple(): Promise<ReauthResult>;
  kakao(): Promise<ReauthResult>;
  sendEmailCode(): Promise<boolean>;
  verifyEmailCode(code: string): Promise<ReauthResult>;
};
/**
 * accepted: the server took the request (202, or 409 ACCOUNT_DELETING). signedOut: the session no longer works (401), so
 * sign out without claiming success. offline: the request never reached the server; nothing is queued for later.
 */
export type SubmitResult = 'accepted' | 'signedOut' | 'reauthFailed' | 'offline' | 'failed';
export async function submitDeletion(send: () => Promise<unknown>): Promise<SubmitResult> {
  try {
    await send();
    return 'accepted';
  } catch (error) {
    if (!(error instanceof ApiError)) return 'offline';
    if (error.code === 'REAUTH_REQUIRED') return 'reauthFailed';
    if (error.code === 'ACCOUNT_DELETING') return 'accepted';
    if (error.status === 401) return 'signedOut';
    return 'failed';
  }
}

type LocalDeps = {
  signOut: () => Promise<void>;
  /** Every local notification this app scheduled; the server cannot reach them (FR-071 c). */
  cancelNotifications: () => Promise<void>;
  clearPendingInvite: () => Promise<void>;
  resetSpace: () => void;
};
/** After acceptance: drop device-only data (scheduled notifications, pending invite, cached space) and sign out locally. */
export async function clearDeviceAfterDeletion(outcome: 'accepted' | 'signedOut', deps: LocalDeps): Promise<void> {
  await deps.cancelNotifications().catch(() => undefined);
  await deps.clearPendingInvite().catch(() => undefined);
  deps.resetSpace();
  // Set before signing out so the login screen shows "Your account was deleted" on its first frame.
  if (outcome === 'accepted') farewell.set(true);
  await deps.signOut().catch(() => undefined);
}

/** In-memory flag for the S13-delete-done notice on the login screen; cleared when the person moves on. */
export const farewell = (() => {
  let value = false;
  const listeners = new Set<() => void>();
  return {
    get: () => value,
    set(next: boolean) { value = next; listeners.forEach((listener) => listener()); },
    subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
  };
})();
export function useAccountDeleted(): boolean {
  return useSyncExternalStore(farewell.subscribe, farewell.get, farewell.get);
}
