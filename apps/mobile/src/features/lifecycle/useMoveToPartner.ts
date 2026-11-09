import { useCallback, useEffect, useState } from 'react';
import { useApp } from '../../lib/AppContext';
import { savePendingInvite } from '../../lib/inviteLink';
import { useSpace } from '../space/SpaceContext';
import { readV0Invite } from '../space/v0LocalData';
import { moveToPartnerSpace } from './moveSpace';

/**
 * V0-10 code entry from inside the app. `move` exists only while this user is alone in the space, so a connected couple never
 * gets an action that would end their space. `ownCode` is the code this device issued (undefined while it is read), so the
 * screen can refuse it instead of ending the space for nothing.
 */
export function useMoveToPartner() {
  const { client, userId } = useApp();
  const { state, reset, reload } = useSpace();
  const snapshot = state.snapshot;
  const spaceId = snapshot?.space.spaceId ?? null;
  const [ownCode, setOwnCode] = useState<{ spaceId: string; code: string | null } | null>(null);
  useEffect(() => {
    if (!spaceId) return;
    let alive = true;
    void readV0Invite(spaceId).then((invite) => { if (alive) setOwnCode({ spaceId, code: invite?.code ?? null }); });
    return () => { alive = false; };
  }, [spaceId]);
  const move = useCallback((code: string) => moveToPartnerSpace({
    code, snapshot, userId, close: client.endSpace, accept: client.acceptInvitation, ackEnded: client.ackEnded, releaseSession: client.release,
    keepCode: savePendingInvite, resetSpace: reset, reload,
  }), [client, snapshot, userId, reset, reload]);
  const alone = !!snapshot && snapshot.space.memberCount < 2;
  return { ready: !!snapshot && ownCode?.spaceId === spaceId, ownCode: ownCode?.spaceId === spaceId ? ownCode.code : undefined, move: alone ? move : undefined };
}
