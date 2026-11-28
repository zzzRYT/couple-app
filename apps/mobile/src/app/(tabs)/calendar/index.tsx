import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { CalendarScreen } from '../../../features/calendar/CalendarScreen';
import { V0Error } from '../../../features/home/states';
import { useSpace } from '../../../features/space/SpaceContext';
import { profilesOf } from '../../../features/space/profiles';
import { todayIn } from '../../../lib/dday';
import { useNow } from '../../../lib/useNow';
import { Screen, Skeleton, Toast } from '../../../ui/components';
/** The edit sheet comes back here with `toast`, the saved day and a new `at` per visit: the tabs stay mounted, so `at` shows the toast again and refocuses the month. */
export default function CalendarRoute() {
  const { toast, date, at } = useLocalSearchParams<{ toast?: string; date?: string; at?: string }>(); const [hiddenAt, setHiddenAt] = useState<string>();
  const { t } = useTranslation(); const { state, refresh } = useSpace(); const now = useNow();
  const snapshot = state.snapshot;
  const failed = state.status === 'error' && !state.offline;
  if (failed || (state.offline && !snapshot)) return <V0Error offline={!failed} title={t('tab.cal')} retry={() => void refresh()} />;
  if (!snapshot) return <Screen><Skeleton label={t('state.loading')} height={72} /></Screen>;
  const profiles = profilesOf(snapshot, t); const partner = snapshot.members.find((member) => member.userId !== snapshot.me.userId);
  return <View style={{ flex: 1 }}><CalendarScreen key={at} events={snapshot.events} anniversaries={{ startDate: snapshot.space.anniversaryDate, timeZone: snapshot.space.timeZone, me: snapshot.me, partner: partner ?? null, customs: snapshot.anniversaries }} me={snapshot.me.userId} meName={profiles.me.name || t('cal.by.me')} partner={profiles.partner.name} today={todayIn(now, snapshot.space.timeZone)} offline={state.offline} syncedAt={state.lastSyncedAt} focusDate={date}
    onAdd={(day) => router.push({ pathname: '/event-edit', params: { date: day } })} onEvent={(event) => router.push({ pathname: '/event-edit', params: { id: event.id } })} />
    {at !== hiddenAt && (toast === 'saved' || toast === 'deleted') && <View key={at} style={{ position: 'absolute', left: 20, right: 20, bottom: 96 }}><Toast text={t(`edit.${toast}`)} onHide={() => setHiddenAt(at)} /></View>}</View>;
}
