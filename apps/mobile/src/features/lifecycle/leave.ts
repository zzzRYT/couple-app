import type { Snapshot } from '../../lib/client';
import { ApiError } from '../../lib/errors';

type Deps = {
  /** `client.endSpace` or `client.disconnect`: both are the same soft delete on the server. */
  close: (spaceId: string) => Promise<unknown>;
  releaseSession: (spaceId: string, sessionId: string) => Promise<void>;
  snapshot: Snapshot | null;
  userId: string | null;
  resetSpace: () => void;
  reload: () => Promise<void>;
};
/**
 * Closes the current space for both people: gives back a prompt lease this user holds (best effort), asks the server to end it,
 * drops every cached space value and re-reads where to go next. A 404 means the partner already ended it; that is not a failure.
 */
export async function leaveSpace({ close, releaseSession, snapshot, userId, resetSpace, reload }: Deps): Promise<void> {
  if (!snapshot) throw new Error('NO_SPACE');
  const lease = snapshot.promptSession;
  if (lease?.status === 'occupied' && lease.ownerUserId === userId) await releaseSession(snapshot.space.spaceId, lease.sessionId).catch(() => undefined);
  try {
    await close(snapshot.space.spaceId);
  } catch (error) {
    if (!(error instanceof ApiError && error.status === 404)) throw error;
  }
  resetSpace();
  await reload();
}
