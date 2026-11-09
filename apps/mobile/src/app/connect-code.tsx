import { router } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { JoinScreen } from '../features/onboarding/JoinScreen';
import { useMoveToPartner } from '../features/lifecycle/useMoveToPartner';
import { useApp } from '../lib/AppContext';
import { useSpace } from '../features/space/SpaceContext';

/** V0-connect-code: enter the partner's code from Home or Settings (V0-10). */
export default function ConnectCodeRoute() {
  const { client } = useApp();
  const { reload } = useSpace();
  const { ready, ownCode, move } = useMoveToPartner();
  if (!ready) return null;
  return <JoinScreen readClipboard={Clipboard.getStringAsync} onBack={() => router.back()} previewInvitation={client.previewInvitation} acceptInvitation={client.acceptInvitation}
    moveFromSpace={move} ownCode={ownCode} onJoined={() => { void reload(); }} onOpenSpace={() => router.back()} />;
}
