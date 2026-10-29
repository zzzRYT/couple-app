import { useCallback } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { InviteScreen } from '../../features/onboarding/InviteScreen';
import { useApp } from '../../lib/AppContext';
import { useSpace } from '../../features/space/SpaceContext';
export default function InviteRoute() {
  const { client } = useApp();
  const { spaceId: current, state } = useSpace();
  const { spaceId: param } = useLocalSearchParams<{ spaceId?: string }>();
  const spaceId = param ?? current ?? '';
  const createInvitation = useCallback(() => client.createInvitation(spaceId), [client, spaceId]);
  return <InviteScreen copyCode={Clipboard.setStringAsync} createInvitation={createInvitation} memberCount={state.snapshot?.space.memberCount ?? 1} onJoined={() => router.replace('/home')} onLater={() => router.replace('/home')} onBack={() => (router.canGoBack() ? router.back() : router.replace('/home'))} />;
}
