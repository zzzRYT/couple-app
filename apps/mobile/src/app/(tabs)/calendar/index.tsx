import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { CalendarScreen } from '../../../features/calendar/CalendarScreen';
import { V0Error } from '../../../features/home/states';
import { useSpace } from '../../../features/space/SpaceContext';
import { todayIn } from '../../../lib/dday';
import { useNow } from '../../../lib/useNow';
import { Screen, Skeleton, Toast } from '../../../ui/components';
export default function CalendarRoute() {
  const { toast, date } = useLocalSearchParams<{ toast?: string; date?: string }>(); const [toastHidden, setToastHidden] = useState(false);
  const { t } = useTranslation(); const { state, refresh } = useSpace(); const now = useNow();
  const snapshot = state.snapshot;
  const failed = state.status === 'error' && !state.offline;
  if (failed || (state.offline && !snapshot)) return <V0Error offline={!failed} title={t('tab.cal')} retry={() => void refresh()} />;
  if (!snapshot) return <Screen><Skeleton label={t('state.loading')} height={72} /></Screen>;
  const partner = snapshot.members.find((member) => member.userId !== snapshot.me.userId);
  return <View style={{ flex: 1 }}><CalendarScreen events={snapshot.events} eventComments={snapshot.eventComments} me={snapshot.me.userId} meName={snapshot.me.displayName ?? t('cal.by.me')} partner={partner?.displayName ?? t('home.pending.partner')} today={todayIn(now, snapshot.space.timeZone)} offline={state.offline} syncedAt={state.lastSyncedAt} focusDate={date}
    onAdd={(day) => router.push({ pathname: '/event-edit', params: { date: day } })} onEvent={(event) => router.push({ pathname: '/event-edit', params: { id: event.id } })} />
    {!toastHidden && (toast === 'saved' || toast === 'deleted') && <View style={{ position: 'absolute', left: 20, right: 20, bottom: 96 }}><Toast text={t(`edit.${toast}`)} onHide={() => setToastHidden(true)} /></View>}</View>;
}
