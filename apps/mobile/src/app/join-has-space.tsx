import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { takePendingInvite } from '../lib/inviteLink';
import { JoinScreen } from '../features/onboarding/JoinScreen';
import { useMoveToPartner } from '../features/lifecycle/useMoveToPartner';
import { useApp } from '../lib/AppContext';
import { useSpace } from '../features/space/SpaceContext';

/** An invite link opened with a space: alone, it can move into the partner's space (V0-10); connected, it shows S05 "has space". */
export default function JoinHasSpaceRoute() {
  const { client } = useApp();
  const { reload } = useSpace();
  const { ready, ownCode, move } = useMoveToPartner();
  const [code, setCode] = useState<string | null | undefined>(undefined);
  useEffect(() => { void takePendingInvite().then(setCode); }, []);
  if (code === undefined || !ready) return null;
  return <JoinScreen initialCode={code} alreadyInSpace={!move} moveFromSpace={move} ownCode={ownCode} readClipboard={Clipboard.getStringAsync} onBack={() => router.dismissTo('/home')} previewInvitation={client.previewInvitation} acceptInvitation={client.acceptInvitation} onJoined={() => { void reload(); }} onOpenSpace={() => router.dismissTo('/home')} />;
}
