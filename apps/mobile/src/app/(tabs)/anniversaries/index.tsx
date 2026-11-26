import { useEffect, useState } from 'react';
import { readPlayfulPreference, writePlayfulPreference } from '../../../features/anniversaries/playfulPreference';
import { router, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AnniversaryList } from '../../../features/anniversaries/AnniversaryList';
import { V0Error } from '../../../features/home/states';
import { useSpace } from '../../../features/space/SpaceContext';
import { computeAnniversaries } from '../../../lib/anniversaries';
import { useNow } from '../../../lib/useNow';
import { Screen, Skeleton, Toast } from '../../../ui/components';
export default function AnniversariesRoute() {
  const { toast, at } = useLocalSearchParams<{ toast?: string; at?: string }>(); const [hiddenAt, setHiddenAt] = useState<string>();
  const { t } = useTranslation(); const { state, refresh } = useSpace(); const now = useNow();
  const [filter, setFilter] = useState<'all' | 'custom'>('all'); const [pastOpen, setPastOpen] = useState(false);
  const snapshot = state.snapshot;
  const spaceId = snapshot?.space.spaceId; const userId = snapshot?.me.userId;
  const [playful, setPlayful] = useState(false); const [playfulReady, setPlayfulReady] = useState(false);
  useEffect(() => {
    let active = true;
    setPlayful(false); setPlayfulReady(false);
    if (spaceId && userId) void readPlayfulPreference(spaceId, userId).then((value) => { if (active) setPlayful(value); }).catch(() => {}).finally(() => { if (active) setPlayfulReady(true); });
    return () => { active = false; };
  }, [spaceId, userId]);
  const changePlayful = (value: boolean) => { setPlayful(value); if (spaceId && userId) void writePlayfulPreference(spaceId, userId, value).catch(() => {}); };
  const failed = state.status === 'error' && !state.offline;
  if (failed || (state.offline && !snapshot)) return <V0Error offline={!failed} title={t('tab.anniv')} retry={() => void refresh()} />;
  if (!snapshot) return <Screen><Skeleton label={t('state.loading')} height={72} /></Screen>;
  const partner = snapshot.members.find((member) => member.userId !== snapshot.me.userId);
  const view = computeAnniversaries({ startDate: snapshot.space.anniversaryDate, timeZone: snapshot.space.timeZone, me: snapshot.me, partner: partner ?? null, customs: snapshot.anniversaries, includePlayful: playful }, now);
  return <View style={{ flex: 1 }}><AnniversaryList playful={playful} onPlayful={changePlayful} playfulReady={playfulReady} view={view} filter={filter} pastOpen={pastOpen} offline={state.offline} syncedAt={state.lastSyncedAt} hasCustoms={snapshot.anniversaries.length > 0} birthdayState={!snapshot.me.birthday ? 'mine' : !partner ? 'pending' : !partner.hasBirthday ? 'wait' : 'none'} partner={partner?.displayName ?? t('home.pending.partner')} onFilter={setFilter} onPast={() => setPastOpen(!pastOpen)} onAdd={() => router.push('/anniversary-edit')} onItem={(item) => router.push({ pathname: '/anniversary/[key]', params: { key: encodeURIComponent(item.key) } })} onBirthday={() => router.push('/settings/me')} />{at !== hiddenAt && (toast === 'saved' || toast === 'deleted') && <View key={at} style={{ position: 'absolute', left: 20, right: 20, bottom: 96 }}><Toast text={t(`edit.${toast}`)} onHide={() => setHiddenAt(at)} /></View>}</View>;
}
