import { router, useFocusEffect } from 'expo-router';
import { useCallback, useRef } from 'react';
import { RoomScreen } from '../../features/room/RoomScreen';
import { useRoom } from '../../features/room/useRoom';
import { useApp } from '../../lib/AppContext';
import { useSpace } from '../../features/space/SpaceContext';
import { useNow } from '../../lib/useNow';
import { useMilestone } from '../../features/milestone/useMilestone';
export default function RoomRoute() {
  const { client, userId } = useApp();
  const { spaceId, state, refresh } = useSpace();
  const milestone = useMilestone(spaceId, userId, !state.offline && state.status !== 'error', client, 'room', state.offline,
    state.snapshot ? `${state.snapshot.space.updatedAt}:${state.snapshot.versionNumber}:${state.snapshot.space.timeZone}:${state.snapshot.space.anniversaryDate}` : '');
  const decorating = useRef(false);
  const focusedOnce = useRef(false);
  useFocusEffect(useCallback(() => { decorating.current = false; if (focusedOnce.current) void milestone.reload(); else focusedOnce.current = true; return () => { decorating.current = false; }; }, [milestone.reload]));
  const openPrompt = () => { if (decorating.current) return; decorating.current = true; router.push('/prompt'); };
  const room = useRoom(spaceId, { client }, { state, refresh });
  const now = useNow(1000);
  return <RoomScreen state={room.state} now={now} onDecorate={openPrompt} onRecall={room.recall} onRetry={room.refresh}
    milestone={milestone.celebration} milestonePreset={milestone.preset} onMilestoneSeen={() => { if (milestone.celebration) void milestone.seen(milestone.celebration); }}
    onMilestoneSuggest={() => { if (milestone.preset?.presetAvailable) router.push({ pathname: '/prompt', params: { milestone: milestone.preset.id, milestoneKey: milestone.preset.key } }); }} />;
}
