import { router, useFocusEffect } from 'expo-router';
import { useCallback, useRef } from 'react';
import { HomeScreen } from '../../features/home/HomeScreen';
import { useApp } from '../../lib/AppContext';
import { useSpace } from '../../features/space/SpaceContext';
import { useNow } from '../../lib/useNow';
import { useMilestone } from '../../features/milestone/useMilestone';
export default function HomeRoute() {
  const { client, userId } = useApp();
  const { state, refresh, spaceId } = useSpace();
  const milestone = useMilestone(spaceId, userId, !state.offline && state.status !== 'error', client, 'home', state.offline,
    state.snapshot ? `${state.snapshot.space.updatedAt}:${state.snapshot.versionNumber}:${state.snapshot.space.timeZone}:${state.snapshot.space.anniversaryDate}` : '');
  const inviteOpening = useRef(false);
  const focusedOnce = useRef(false);
  useFocusEffect(useCallback(() => { inviteOpening.current = false; if (focusedOnce.current) void milestone.reload(); else focusedOnce.current = true; return () => { inviteOpening.current = false; }; }, [milestone.reload]));
  const openInvite = () => { if (inviteOpening.current) return; inviteOpening.current = true; router.push('/invite'); };
  const now = useNow();
  const space = state.snapshot?.space;
  return <HomeScreen state={state} now={now} onOpenRoom={() => router.navigate('/room')} onOpenInvite={openInvite}
    milestone={milestone.celebration} milestonePreset={milestone.preset} onMilestoneSeen={() => { if (milestone.celebration) void milestone.seen(milestone.celebration); }}
    onMilestoneSuggest={() => { if (milestone.preset?.presetAvailable) router.push({ pathname: '/prompt', params: { milestone: milestone.preset.id, milestoneKey: milestone.preset.key } }); }}
    onRefresh={refresh} onSaveDate={async (date) => { if (space) { await client.updateAnniversary(space.spaceId, date, space.updatedAt); await refresh(); } }} />;
}
