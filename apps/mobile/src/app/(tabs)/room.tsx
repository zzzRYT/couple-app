import { router } from 'expo-router';
import { RoomScreen } from '../../features/room/RoomScreen';
import { useRoom } from '../../features/room/useRoom';
import { useApp } from '../../lib/AppContext';
import { useSpace } from '../../features/space/SpaceContext';
import { useNow } from '../../lib/useNow';
export default function RoomRoute() {
  const { client, realtime } = useApp();
  const { spaceId } = useSpace();
  const room = useRoom(spaceId, { client, realtime });
  const now = useNow(1000);
  return <RoomScreen state={room.state} now={now} onDecorate={() => router.push('/prompt')} onRecall={room.recall} />;
}
