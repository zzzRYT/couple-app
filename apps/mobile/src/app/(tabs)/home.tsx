import { useCallback, useEffect, useState } from 'react';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { V0HomeScreen } from '../../features/home/V0HomeScreen';
import { useApp } from '../../lib/AppContext';
import { useSpace } from '../../features/space/SpaceContext';
import { useNow } from '../../lib/useNow';
import { useMilestone } from '../../features/milestone/useMilestone';
import { useTranslation } from 'react-i18next';
import { formatAnniversary } from '../../lib/dday';
export default function HomeRoute() {
  const { client, userId } = useApp();
  const { t, i18n } = useTranslation(); const [partnerEdited, setPartnerEdited] = useState<string | null>(null);
  const { state, refresh, spaceId, inviteAfterActivation } = useSpace();
  const milestone = useMilestone(spaceId, userId, !state.offline && state.status !== 'error', client, 'home', state.offline, state.snapshot?.space.updatedAt ?? '');
  const memberCount = state.snapshot?.space.memberCount;
  const snapshot = state.snapshot;
  const hidePartnerEdited = useCallback(() => setPartnerEdited(null), []);
  useEffect(() => {
    const space = snapshot?.space;
    if (!snapshot || !spaceId || !userId || !space?.anniversaryChangedAt || !space.anniversaryChangedBy || space.anniversaryChangedBy === userId) return;
    const key = `v0.partnerEdited.seen.${spaceId}.${userId}`; const changedAt = space.anniversaryChangedAt;
    let active = true;
    void SecureStore.getItemAsync(key).then(async (seen) => {
      if (seen && Date.parse(seen) >= Date.parse(changedAt)) return;
      await SecureStore.setItemAsync(key, changedAt);
      if (active) setPartnerEdited(t('home.partnerEdited', { name: snapshot.members.find((member) => member.userId === space.anniversaryChangedBy)?.displayName ?? t('home.pending.partner'), date: formatAnniversary(space.anniversaryDate, i18n.language) }));
    });
    return () => { active = false; };
  }, [snapshot, spaceId, userId, t, i18n.language]);
  useEffect(() => {
    if (!spaceId || !userId || memberCount !== 2 || state.offline || inviteAfterActivation) return;
    let active = true;
    void SecureStore.deleteItemAsync(`v0.invite.${spaceId}`).catch(() => undefined);
    void SecureStore.getItemAsync(`v0.connected.seen.${spaceId}.${userId}`).then((seen) => { if (active && !seen) router.push('/connected'); });
    return () => { active = false; };
  }, [spaceId, userId, memberCount, state.offline, inviteAfterActivation]);
  return <V0HomeScreen state={state} now={useNow()} onRefresh={() => void refresh()} onAnniversaries={() => router.navigate('/anniversaries')} onOpenInvite={() => router.push('/invite')} celebration={milestone.celebration} onSeen={() => { if (milestone.celebration) void milestone.seen(milestone.celebration); }} partnerEdited={partnerEdited} onHidePartnerEdited={hidePartnerEdited} />;
}
