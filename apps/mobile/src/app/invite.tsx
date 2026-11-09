import { useCallback, useEffect, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { useTranslation } from 'react-i18next';
import { InviteScreen } from '../features/onboarding/InviteScreen';
import { useApp } from '../lib/AppContext';
import { useSpace } from '../features/space/SpaceContext';
import { LoadingScreen } from '../ui/CycleLoader';
import { readV0Invite, saveV0Invite, type StoredInvite } from '../features/space/v0LocalData';

/** `reissue=1` (home's expired code card) makes a new code straight away. */
export default function InviteRoute() {
  const { client } = useApp();
  const { state, refresh } = useSpace();
  const { t } = useTranslation();
  const { reissue } = useLocalSearchParams<{ reissue?: string }>();
  const snapshot = state.snapshot;
  const spaceId = snapshot?.space.spaceId;
  const [stored, setStored] = useState<StoredInvite | null | undefined>(undefined);
  useEffect(() => { if (spaceId) void readV0Invite(spaceId).then(setStored); }, [spaceId]);
  const createInvitation = useCallback(async () => {
    if (!spaceId) return Promise.reject(new Error('Space is not ready'));
    const invite = await client.createInvitation(spaceId);
    await saveV0Invite(spaceId, { code: invite.code, expiresAt: invite.expiresAt });
    return invite;
  }, [client, spaceId]);
  const closeInvite = useCallback(() => router.back(), []);
  const goHome = useCallback(() => router.dismissTo('/home'), []);
  if (!snapshot) return <LoadingScreen label={t('common.loading')} />;
  if (stored === undefined) return null;
  const live = snapshot.space.memberCount === 1 ? snapshot.space.invitation : null;
  // V0-10 opens this screen as V0-start-invite: when the live invitation is the one this device made, its code is shown again.
  const existing = live && stored && Date.parse(stored.expiresAt) === Date.parse(live.expiresAt) ? stored : null;
  return <InviteScreen copyCode={Clipboard.setStringAsync} createInvitation={createInvitation} memberCount={snapshot.space.memberCount} existingInvitation={existing} existingInvitationExpiresAt={live?.expiresAt ?? null} reissue={reissue === '1'} onInvitationCreated={refresh} onJoined={goHome} onLater={goHome} onBack={closeInvite} />;
}
