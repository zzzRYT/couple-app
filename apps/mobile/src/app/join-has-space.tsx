import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { takePendingInvite } from '../lib/inviteLink';
import { JoinScreen } from '../features/onboarding/JoinScreen';
import { useApp } from '../lib/AppContext';

export default function JoinHasSpaceRoute() {
  const { client } = useApp();
  const [code, setCode] = useState<string | null | undefined>(undefined);
  useEffect(() => { void takePendingInvite().then(setCode); }, []);
  if (code === undefined) return null;
  return <JoinScreen initialCode={code} alreadyInSpace readClipboard={Clipboard.getStringAsync} onBack={() => router.back()} previewInvitation={client.previewInvitation} acceptInvitation={client.acceptInvitation} onJoined={() => {}} onOpenSpace={() => router.back()} />;
}
