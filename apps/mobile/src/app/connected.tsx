import { router } from 'expo-router';
import { useEffect } from 'react';
import { View } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useTranslation } from 'react-i18next';
import { useApp } from '../lib/AppContext';
import { readNotifyPrefs } from '../features/notifications/preferences';
import { useSpace } from '../features/space/SpaceContext';
import { AppText, Button, Screen } from '../ui/components';
import { CheerMascot } from '../ui/CheerMascot';
import { Icon } from '../ui/Icon';
import { tokens } from '../theme/tokens';
import { useAppColor } from '../theme/useAppColor';
import { useType } from '../theme/typography';
import { dayCount } from '../lib/dday';
import { useNow } from '../lib/useNow';
import { track } from '../lib/analytics';
export default function ConnectedRoute() {
  const { t } = useTranslation(); const { userId } = useApp(); const { spaceId, state } = useSpace(); const now = useNow(); const color = useAppColor(); const { emphasis } = useType();
  useEffect(() => { if (spaceId && userId) { void SecureStore.setItemAsync(`v0.connected.seen.${spaceId}.${userId}`, 'true'); track('couple_connected'); } }, [spaceId, userId]);
  const snapshot = state.snapshot;
  if (!snapshot) return null;
  const partner = snapshot.members.find((member) => member.userId !== userId)?.displayName ?? t('home.pending.partner');
  const count = dayCount(snapshot.space.anniversaryDate, now, snapshot.space.timeZone);
  const n = count.ok ? count.dayCount : 0;
  const start = async () => {
    const prefs = userId ? await readNotifyPrefs(userId) : null;
    if (prefs && !prefs.prePromptSeen) router.replace('/notify-intro'); else router.dismissTo('/home');
  };
  return <Screen footer={<Button label={t('start.connected.cta')} onPress={() => void start()} />}>
    <View style={{ marginTop: tokens.spacing[6] }}><CheerMascot size={170} label={t('mascot.alt.cheer')} /></View>
    <AppText variant="title" align="center">{t('start.connected.title')}</AppText>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: tokens.spacing[1] }}>
      <AppText style={emphasis(18)}>{snapshot.me.displayName}</AppText><Icon name="heart" size={16} color={color.primary} fill={color.primary} /><AppText style={emphasis(18)}>{partner}</AppText>
    </View>
    <AppText tone="text2" align="center">{t('start.connected.body', { name: partner, n })}</AppText>
    <AppText variant="display" align="center">{t('dday.big', { n })}</AppText>
  </Screen>;
}
