import { useCallback, useEffect, useState } from 'react';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { V0HomeScreen } from '../../features/home/V0HomeScreen';
import { V0Error } from '../../features/home/states';
import { useApp } from '../../lib/AppContext';
import { useSpace } from '../../features/space/SpaceContext';
import { useNow } from '../../lib/useNow';
import { useMilestone } from '../../features/milestone/useMilestone';
import { useTranslation } from 'react-i18next';
import { formattedMonthDay } from '../../features/anniversaries/format';
import { usePassword } from '../../features/auth/PasswordContext';
import { SetPasswordSheet } from '../../features/auth/SetPasswordFlow';
export default function HomeRoute() {
  const { client, userId } = useApp();
  const { shouldPrompt, markPromptSeen } = usePassword();
  const { t, i18n } = useTranslation(); const [partnerEdited, setPartnerEdited] = useState<string | null>(null);
  const { state, refresh, spaceId, inviteAfterActivation } = useSpace();
  const milestone = useMilestone(spaceId, userId, !state.offline && state.status !== 'error', client, 'home', state.offline, state.snapshot?.space.updatedAt ?? '');
  const [seenKeys, setSeenKeys] = useState<string[]>([]); const [seenReady, setSeenReady] = useState(false);
  const seenKey = spaceId && userId ? `v0.celebration.seen.${spaceId}.${userId}` : null;
  useEffect(() => { let active = true; setSeenReady(false); setSeenKeys([]); if (!seenKey) return; void SecureStore.getItemAsync(seenKey).then((value) => { if (!active) return; try { const parsed: unknown = JSON.parse(value ?? '[]'); setSeenKeys(Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : []); } catch { setSeenKeys([]); } }).finally(() => { if (active) setSeenReady(true); }); return () => { active = false; }; }, [seenKey]);
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
      if (active) setPartnerEdited(t('home.partnerEdited', { name: snapshot.members.find((member) => member.userId === space.anniversaryChangedBy)?.displayName ?? t('home.pending.partner'), date: formattedMonthDay(space.anniversaryDate, i18n.language) }));
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
  const now = useNow();
  const failed = state.status === 'error' && !state.offline;
  return <>
    {failed || (state.offline && !snapshot) ? <V0Error offline={!failed} title={t('app.name')} retry={() => void refresh()} /> : <V0HomeScreen state={state} now={now} onRefresh={() => void refresh()} onAnniversaries={() => router.navigate('/anniversaries')} onOpenInvite={(reissue) => router.push(reissue ? { pathname: '/invite', params: { reissue: '1' } } : '/invite')} onHaveCode={() => router.push('/connect-code')} celebration={milestone.celebration} onSeen={() => { if (milestone.celebration) void milestone.seen(milestone.celebration); }} partnerEdited={partnerEdited} onHidePartnerEdited={hidePartnerEdited} seenKeys={seenKeys} seenReady={seenReady} onLocalSeen={(key) => { if (!seenKey) return; const next = [...seenKeys.filter((entry) => entry !== key), key].slice(-50); setSeenKeys(next); void SecureStore.setItemAsync(seenKey, JSON.stringify(next)); }} onOccurrence={(item) => router.push({ pathname: '/anniversary/[key]', params: { key: encodeURIComponent(item.key) } })} />}
    <SetPasswordSheet visible={!!shouldPrompt} onLater={() => void markPromptSeen()} onCreate={() => { void markPromptSeen(); router.push('/settings/set-password'); }} />
  </>;
}
