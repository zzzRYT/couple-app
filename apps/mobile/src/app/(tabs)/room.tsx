import { router, useFocusEffect } from 'expo-router';
import { useCallback, useRef } from 'react';
import { RoomScreen } from '../../features/room/RoomScreen';
import { useRoom } from '../../features/room/useRoom';
import { useApp } from '../../lib/AppContext';
import { useSpace } from '../../features/space/SpaceContext';
import { useNow } from '../../lib/useNow';
export default function RoomRoute() {
  const { client } = useApp();
  const { spaceId, state, refresh } = useSpace();
  const decorating = useRef(false);
  useFocusEffect(useCallback(() => { decorating.current = false; return () => { decorating.current = false; }; }, []));
  const openPrompt = () => { if (decorating.current) return; decorating.current = true; router.push('/prompt'); };
  const room = useRoom(spaceId, { client }, { state, refresh });
  const now = useNow(1000);
  return <RoomScreen state={room.state} now={now} onDecorate={openPrompt} onRecall={room.recall} onRetry={room.refresh} />;
}
