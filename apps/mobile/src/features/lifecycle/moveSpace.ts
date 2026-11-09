import type { Snapshot } from '../../lib/client';
import { ApiError } from '../../lib/errors';
import { clearMilestoneStorage } from '../milestone/useMilestone';
import { cancelV0Notifications } from '../notifications/scheduler';
import { clearV0LocalData } from '../space/v0LocalData';
import { clearWidgets } from '../widgets/writer';

type Deps = {
  code: string;
  snapshot: Snapshot | null;
  userId: string | null;
  close: (spaceId: string) => Promise<unknown>;
  accept: (code: string) => Promise<unknown>;
  ackEnded: () => Promise<unknown>;
  releaseSession: (spaceId: string, sessionId: string) => Promise<void>;
  /** Keeps the code for the onboarding join screen when the join fails after the old space is gone. */
  keepCode: (code: string) => Promise<void>;
  resetSpace: () => void;
  reload: () => Promise<void>;
};
/**
 * V0-10: joins the partner's space from a space this user holds alone. A person has one active space, so the waiting space is
 * ended first (the existing end endpoint), then the invitation is accepted. Resetting the space right after the end drops the
 * old snapshot and its Realtime channel, so the gate shows loading instead of the ended screen while the join runs. When the
 * join fails, the code is kept as a pending invite and the onboarding join screen shows why (S05).
 */
export async function moveToPartnerSpace({ code, snapshot, userId, close, accept, ackEnded, releaseSession, keepCode, resetSpace, reload }: Deps): Promise<void> {
  if (!snapshot) throw new Error('NO_SPACE');
  // Never end a space that already has a partner from here: that is "disconnect", with its own confirmation.
  if (snapshot.space.memberCount >= 2) throw new Error('SPACE_HAS_PARTNER');
  const oldSpaceId = snapshot.space.spaceId;
  const lease = snapshot.promptSession;
  if (lease?.status === 'occupied' && lease.ownerUserId === userId) await releaseSession(oldSpaceId, lease.sessionId).catch(() => undefined);
  try {
    await close(oldSpaceId);
  } catch (error) {
    if (!(error instanceof ApiError && error.status === 404)) throw error;
  }
  resetSpace();
  try {
    await accept(code);
  } catch {
    await keepCode(code).catch(() => undefined);
  }
  // The end left a notice for this user too; acknowledge it so the next screen is the new space or the join screen, not "ended".
  await ackEnded().catch(() => undefined);
  if (userId) await clearMilestoneStorage(oldSpaceId, userId).catch(() => undefined);
  if (userId) await clearV0LocalData(userId, oldSpaceId).catch(() => undefined);
  await cancelV0Notifications().catch(() => undefined);
  await clearWidgets('none').catch(() => undefined);
  await reload();
}
