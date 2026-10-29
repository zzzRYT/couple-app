import { router } from 'expo-router';
import { getCalendars } from 'expo-localization';
import { CreateSpaceScreen } from '../../features/onboarding/CreateSpaceScreen';
import { useApp } from '../../lib/AppContext';
import { useSpace } from '../../features/space/SpaceContext';
import { useNow } from '../../lib/useNow';
export default function CreateSpaceRoute() {
  const { client } = useApp();
  const { reload, queueInviteAfterActivation } = useSpace();
  const now = useNow();
  const timeZone = getCalendars()[0]?.timeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
  return <CreateSpaceScreen createSpace={client.createSpace} now={now} timeZone={timeZone}
    onCreated={() => { queueInviteAfterActivation(); void reload(); }}
    onBack={() => router.back()} onOpenSpace={() => { void reload(); }} />;
}
