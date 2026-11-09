import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AnniversaryToast } from '../../../features/anniversaries/AnniversaryToast';
import { AnniversaryList } from '../../../features/anniversaries/AnniversaryList';
import { V0Error } from '../../../features/home/states';
import { useSpace } from '../../../features/space/SpaceContext';
import { computeAnniversaries } from '../../../lib/anniversaries';
import { useNow } from '../../../lib/useNow';
import { Screen, Skeleton } from '../../../ui/components';
export default function AnniversariesRoute() {
  const { toast } = useLocalSearchParams<{ toast?: string }>(); const [toastHidden, setToastHidden] = useState(false);
  const { t } = useTranslation(); const { state, refresh } = useSpace(); const now = useNow();
  const [filter, setFilter] = useState<'all' | 'custom'>('all'); const [pastOpen, setPastOpen] = useState(false);
  const snapshot = state.snapshot;
  const failed = state.status === 'error' && !state.offline;
  if (failed || (state.offline && !snapshot)) return <V0Error offline={!failed} title={t('tab.anniv')} retry={() => void refresh()} />;
  if (!snapshot) return <Screen><Skeleton label={t('state.loading')} height={72} /></Screen>;
  const partner = snapshot.members.find((member) => member.userId !== snapshot.me.userId);
  const view = computeAnniversaries({ startDate: snapshot.space.anniversaryDate, timeZone: snapshot.space.timeZone, me: snapshot.me, partner: partner ?? null, customs: snapshot.anniversaries }, now);
  return <View style={{ flex: 1 }}><AnniversaryList view={view} filter={filter} pastOpen={pastOpen} offline={state.offline} syncedAt={state.lastSyncedAt} birthdayState={!snapshot.me.birthday ? 'mine' : partner && !partner.hasBirthday ? 'wait' : 'none'} partner={partner?.displayName ?? t('home.pending.partner')} onFilter={setFilter} onPast={() => setPastOpen(!pastOpen)} onAdd={() => router.push('/anniversary-edit')} onItem={(item) => router.push({ pathname: '/anniversary/[key]', params: { key: encodeURIComponent(item.key) } })} onBirthday={() => router.push('/settings/me')} />{!toastHidden && (toast === 'saved' || toast === 'deleted') && <View style={{ position: 'absolute', left: 20, right: 20, bottom: 96 }}><AnniversaryToast text={t(`edit.${toast}`)} onHide={() => setToastHidden(true)} /></View>}</View>;
}
