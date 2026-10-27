import { router } from 'expo-router';
import { HomeScreen } from '../../features/home/HomeScreen';
import { useApp } from '../../lib/AppContext';
import { useSpace } from '../../features/space/SpaceContext';
import { useNow } from '../../lib/useNow';
export default function HomeRoute() {
  const { client } = useApp();
  const { state, refresh } = useSpace();
  const now = useNow();
  const space = state.snapshot?.space;
  return <HomeScreen state={state} now={now} onOpenRoom={() => router.navigate('/room')} onOpenInvite={() => router.push({ pathname: '/invite', params: { spaceId: space?.spaceId } })}
    onSaveDate={async (date) => { if (space) { await client.updateAnniversary(space.spaceId, date, space.updatedAt); await refresh(); } }} />;
}
