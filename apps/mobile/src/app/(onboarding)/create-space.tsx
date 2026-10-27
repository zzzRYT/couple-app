import { router } from 'expo-router';
import { getCalendars } from 'expo-localization';
import { CreateSpaceScreen } from '../../features/onboarding/CreateSpaceScreen';
import { useApp } from '../../lib/AppContext';
import { useSpace } from '../../features/space/SpaceContext';
import { useNow } from '../../lib/useNow';
export default function CreateSpaceRoute() {
  const { client } = useApp();
  const { reload } = useSpace();
  const now = useNow();
  const timeZone = getCalendars()[0]?.timeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
  return <CreateSpaceScreen createSpace={client.createSpace} now={now} timeZone={timeZone}
    onCreated={(spaceId) => { void reload(); router.replace({ pathname: '/invite', params: { spaceId } }); }}
    onOpenSpace={() => { void reload(); router.replace('/'); }} />;
}
