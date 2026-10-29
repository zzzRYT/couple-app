import { router, useFocusEffect } from 'expo-router';
import { useCallback, useRef } from 'react';
import { HomeScreen } from '../../features/home/HomeScreen';
import { useApp } from '../../lib/AppContext';
import { useSpace } from '../../features/space/SpaceContext';
import { useNow } from '../../lib/useNow';
export default function HomeRoute() {
  const { client } = useApp();
  const { state, refresh } = useSpace();
  const inviteOpening = useRef(false);
  useFocusEffect(useCallback(() => { inviteOpening.current = false; return () => { inviteOpening.current = false; }; }, []));
  const openInvite = () => { if (inviteOpening.current) return; inviteOpening.current = true; router.push('/invite'); };
  const now = useNow();
  const space = state.snapshot?.space;
  return <HomeScreen state={state} now={now} onOpenRoom={() => router.navigate('/room')} onOpenInvite={openInvite}
    onRefresh={refresh} onSaveDate={async (date) => { if (space) { await client.updateAnniversary(space.spaceId, date, space.updatedAt); await refresh(); } }} />;
}
