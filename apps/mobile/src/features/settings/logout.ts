import type { AuthPort, Provider } from '../auth/authPort';
import type { Snapshot } from '../../lib/client';

type Deps = {
  auth: Pick<AuthPort, 'signOut'>;
  releaseSession: (spaceId: string, sessionId: string) => Promise<void>;
  clearPendingInvite: () => Promise<void>;
  resetSpace: () => void;
  snapshot: Snapshot | null;
  userId: string | null;
};
const PROVIDERS: Provider[] = ['kakao', 'apple', 'email'];
/** The sign-in method the login screen should highlight next time, read from the Supabase session's provider. */
export function lastUsedProvider(provider: unknown): Provider | undefined {
  return PROVIDERS.find((candidate) => candidate === provider);
}
/** Releases a lease this user holds (best effort), signs out locally, then clears cached space state and any pending invite code. */
export async function logout({ auth, releaseSession, clearPendingInvite, resetSpace, snapshot, userId }: Deps): Promise<void> {
  const lease = snapshot?.promptSession;
  if (snapshot && lease?.status === 'occupied' && lease.ownerUserId === userId) {
    await releaseSession(snapshot.space.spaceId, lease.sessionId).catch(() => undefined);
  }
  await auth.signOut();
  await clearPendingInvite().catch(() => undefined);
  resetSpace();
}
