import { useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { randomUUID } from 'expo-crypto';
import { router, useIsFocused, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { AnniversaryDetail } from '../../features/anniversaries/AnniversaryDetail';
import { notifyDefaultLabel } from '../../features/notifications/labels';
import { getAnniversaryNotify } from '../../features/notifications/preferences';
import { useNotifyPrefs } from '../../features/notifications/useNotifyPrefs';
import { useSpace } from '../../features/space/SpaceContext';
import { useApp } from '../../lib/AppContext';
import { computeAnniversaries } from '../../lib/anniversaries';
import { useNow } from '../../lib/useNow';
import { ApiError } from '../../lib/errors';
export default function AnniversaryDetailRoute() {
  const { key } = useLocalSearchParams<{ key: string }>(); const { t, i18n } = useTranslation(); const { state, refresh } = useSpace(); const { client, userId } = useApp(); const now = useNow(); const prefs = useNotifyPrefs(userId); const focused = useIsFocused();
  const [notify, setNotify] = useState<'default' | 'off'>('default'); const closing = useRef(false); const snapshot = state.snapshot;
  let decoded = key ?? ''; try { decoded = decodeURIComponent(decoded); } catch { /* invalid keys resolve to the list */ }
  const partner = snapshot?.members.find((m) => m.userId !== snapshot.me.userId);
  const view = snapshot ? computeAnniversaries({ startDate: snapshot.space.anniversaryDate, timeZone: snapshot.space.timeZone, me: snapshot.me, partner: partner ?? null, customs: snapshot.anniversaries }, now) : null;
  const item = view && [...view.todayItems, ...view.upcoming, ...view.past].find((entry) => entry.key === decoded);
  const custom = snapshot?.anniversaries.find((entry) => entry.id === item?.customId);
  // Under the edit sheet the item can vanish mid-flow; the sheet decides where to go, and this screen only leaves once it is on top again.
  useEffect(() => { if (focused && snapshot && !item && !closing.current) router.replace('/(tabs)/anniversaries'); }, [focused, snapshot, item]);
  useEffect(() => { if (snapshot && custom) void getAnniversaryNotify(snapshot.me.userId, custom.id).then(setNotify); }, [snapshot?.me.userId, custom?.id]);
  if (!snapshot || !item || !view) return null;
  const name = partner?.displayName ?? t('home.pending.partner');
  const remove = () => Alert.alert(t('edit.delete.title'), t('edit.delete.body', { name }), [ { text: t('common.cancel'), style: 'cancel' }, { text: t('common.delete'), style: 'destructive', onPress: () => {
    if (!custom) return;
    void client.deleteAnniversaryItem(snapshot.space.spaceId, custom.id, custom.version, randomUUID()).then(async () => {
      closing.current = true; await refresh(); router.replace({ pathname: '/(tabs)/anniversaries', params: { toast: 'deleted' } });
    }).catch((error: unknown) => {
      if (error instanceof ApiError && error.code === 'VERSION_CONFLICT') { void refresh(); Alert.alert(t('edit.conflict.title', { name }), t('edit.conflict.body'), [{ text: t('common.ok') }]); return; }
      if (error instanceof ApiError && error.code === 'NOT_FOUND' && error.details.gone === true) { closing.current = true; Alert.alert(t('edit.gone.title'), t('edit.gone.body', { name }), [{ text: t('common.ok'), onPress: () => { router.dismissTo('/(tabs)/anniversaries'); void refresh(); } }]); return; }
      Alert.alert(t('edit.save.err'));
    });
  } } ]);
  return <AnniversaryDetail item={item} custom={custom} today={view.today} startDate={snapshot.space.anniversaryDate} timeZone={snapshot.space.timeZone} partner={name} userId={snapshot.me.userId} notify={notify} notifyDefault={notifyDefaultLabel(prefs, i18n.language, t)} offline={state.offline} syncedAt={state.lastSyncedAt} onBack={() => router.back()} onEdit={() => router.push({ pathname: '/anniversary-edit', params: { id: custom?.id } })} onDelete={remove} onSettings={() => router.push('/settings/notifications')} onMe={() => router.push('/settings/me')} />;
}
