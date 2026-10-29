import { useCallback } from 'react';
import { router } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { useTranslation } from 'react-i18next';
import { InviteScreen } from '../features/onboarding/InviteScreen';
import { useApp } from '../lib/AppContext';
import { useSpace } from '../features/space/SpaceContext';
import { LoadingScreen } from '../ui/CycleLoader';

export default function InviteRoute() {
  const { client } = useApp();
  const { state, refresh } = useSpace();
  const { t } = useTranslation();
  const snapshot = state.snapshot;
  const spaceId = snapshot?.space.spaceId;
  const createInvitation = useCallback(() => {
    if (!spaceId) return Promise.reject(new Error('Space is not ready'));
    return client.createInvitation(spaceId);
  }, [client, spaceId]);
  const closeInvite = useCallback(() => router.back(), []);
  if (!snapshot) return <LoadingScreen label={t('common.loading')} />;
  const pendingExpiry = snapshot.space.memberCount === 1 && snapshot.space.invitation ? snapshot.space.invitation.expiresAt : null;
  return <InviteScreen copyCode={Clipboard.setStringAsync} createInvitation={createInvitation} memberCount={snapshot.space.memberCount} existingInvitationExpiresAt={pendingExpiry} onInvitationCreated={refresh} onJoined={closeInvite} onLater={closeInvite} onBack={closeInvite} />;
}
