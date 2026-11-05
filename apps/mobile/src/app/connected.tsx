import { router } from 'expo-router';
import { useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { useTranslation } from 'react-i18next';
import { useApp } from '../lib/AppContext';
import { readNotifyPrefs } from '../features/notifications/preferences';
import { useSpace } from '../features/space/SpaceContext';
import { AppText, Button, Screen } from '../ui/components';
import { Spot } from '../ui/Spot';
import { dayCount } from '../lib/dday';
import { useNow } from '../lib/useNow';
export default function ConnectedRoute() {
  const { t } = useTranslation(); const { userId } = useApp(); const { spaceId, state } = useSpace(); const now = useNow();
  useEffect(() => { if (spaceId && userId) void SecureStore.setItemAsync(`v0.connected.seen.${spaceId}.${userId}`, 'true'); }, [spaceId, userId]);
  const snapshot = state.snapshot;
  if (!snapshot) return null;
  const partner = snapshot.members.find((member) => member.userId !== userId)?.displayName ?? t('home.pending.partner');
  const count = dayCount(snapshot.space.anniversaryDate, now, snapshot.space.timeZone);
  const n = count.ok ? count.dayCount : 0;
  const start = async () => {
    const prefs = userId ? await readNotifyPrefs(userId) : null;
    if (prefs && !prefs.prePromptSeen) router.replace('/notify-intro'); else router.dismissTo('/home');
  };
  return <Screen center footer={<Button label={t('start.connected.cta')} onPress={() => void start()} />}><Spot kind="celebrate" /><AppText variant="title" align="center">{t('start.connected.title')}</AppText><AppText align="center">{snapshot.me.displayName} ♥ {partner}</AppText><AppText tone="text2" align="center">{t('start.connected.body', { name: partner, n })}</AppText><AppText variant="display" align="center">{t('dday.big', { n })}</AppText></Screen>;
}
