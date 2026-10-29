import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { takePendingInvite } from '../../lib/inviteLink';
import { JoinScreen } from '../../features/onboarding/JoinScreen';
import { useApp } from '../../lib/AppContext';
import { useSpace } from '../../features/space/SpaceContext';
export default function JoinRoute() {
  const { client } = useApp();
  const { reload, entry } = useSpace();
  const [pending, setPending] = useState<string | null | undefined>(undefined);
  useEffect(() => { void takePendingInvite().then(setPending); }, []);
  if (pending === undefined) return null;
  return <JoinScreen initialCode={pending} alreadyInSpace={!!pending && entry === 'active'} readClipboard={Clipboard.getStringAsync} onBack={() => router.dismissTo('/choose-space')} previewInvitation={client.previewInvitation} acceptInvitation={client.acceptInvitation}
    onJoined={() => { void reload(); }} onOpenSpace={() => { void reload(); }} />;
}
