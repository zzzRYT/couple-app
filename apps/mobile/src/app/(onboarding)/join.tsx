import { router } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { JoinScreen } from '../../features/onboarding/JoinScreen';
import { useApp } from '../../lib/AppContext';
import { useSpace } from '../../features/space/SpaceContext';
export default function JoinRoute() {
  const { client } = useApp();
  const { reload } = useSpace();
  return <JoinScreen previewInvitation={client.previewInvitation} acceptInvitation={client.acceptInvitation}
    readClipboard={Clipboard.getStringAsync} onBack={() => router.back()} onJoined={() => { void reload(); router.replace('/home'); }} onOpenSpace={() => { void reload(); router.replace('/'); }} />;
}
