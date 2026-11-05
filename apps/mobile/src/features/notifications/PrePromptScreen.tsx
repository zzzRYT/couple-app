import { useEffect, useState } from 'react';
import { Image, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { mascotPoses } from '../../scene/catalog';
import { tokens } from '../../theme/tokens';
import { useAppColor } from '../../theme/useAppColor';
import { AppText, Button, Screen } from '../../ui/components';
import { useDisplayAppearance } from '../settings/preferences';
import { requestNotificationPermission } from './permissions';
import { updateNotifyPrefs } from './preferences';

/** The drawn iOS notification, not a real one: these are the system's colors, so they sit outside the app palette. */
const MOCK = {
  light: { bubble: 'rgba(255,255,255,0.86)', text: '#1C1C1E', time: '#6C6C70' },
  dark: { bubble: 'rgba(58,52,48,0.92)', text: '#F2F2F7', time: '#AEAEB2' },
};
function NotificationMock() {
  const { t } = useTranslation();
  const { scheme } = useDisplayAppearance();
  const mock = MOCK[scheme];
  return <View accessible accessibilityRole="image" accessibilityLabel={`${t('app.name')}, ${t('notify.sample.body')}`} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 20, alignSelf: 'stretch', backgroundColor: mock.bubble, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 14, shadowOffset: { width: 0, height: 4 } }}>
    <View style={{ width: 38, height: 38, borderRadius: 9, borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)', backgroundColor: '#FBF1E3', alignItems: 'center', justifyContent: 'center' }}><Image source={mascotPoses.wave_main} resizeMode="contain" style={{ width: 34, height: 34 }} /></View>
    <View style={{ flex: 1 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}><Text style={{ color: mock.text, fontSize: 15, lineHeight: 20, fontWeight: '600' }}>{t('app.name')}</Text><Text style={{ color: mock.time, fontSize: 13, lineHeight: 18 }}>{t('notify.sample.when')}</Text></View>
      <Text style={{ color: mock.text, fontSize: 15, lineHeight: 20 }}>{t('notify.sample.body')}</Text>
    </View>
  </View>;
}
/** V0-start-notify: asked once on this device, right after connecting. iOS shows its own prompt only after "turn on". */
export function PrePromptScreen({ userId, onDone }: { userId: string | null; onDone: () => void }) {
  const { t } = useTranslation();
  const color = useAppColor();
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (userId) void updateNotifyPrefs(userId, { prePromptSeen: true }).catch(() => undefined); }, [userId]);
  const allow = async () => {
    setBusy(true);
    try {
      if (userId && await requestNotificationPermission()) await updateNotifyPrefs(userId, { enabled: true });
    } catch { /* Either answer leads home; settings can turn this on later. */ }
    onDone();
  };
  return <Screen footer={<><Button icon="bell" label={t('notify.pre.allow')} loading={busy} onPress={() => void allow()} /><Button variant="ghost" label={t('notify.pre.later')} disabled={busy} onPress={onDone} /></>}>
    <View style={{ marginTop: 12, paddingTop: 26, paddingHorizontal: 14, paddingBottom: 20, gap: 14, alignItems: 'center', backgroundColor: color.surface2, borderWidth: tokens.border.outline.normal, borderColor: color.divider, borderRadius: tokens.radius.card }}>
      <NotificationMock />
      <Image accessible accessibilityLabel={t('mascot.alt.cheer')} source={mascotPoses.cheer} resizeMode="contain" style={{ width: 110, height: 110 }} />
    </View>
    <AppText variant="title" align="center" style={{ fontSize: 24, lineHeight: 36 }}>{t('notify.pre.title')}</AppText>
    <AppText tone="text2" align="center" style={{ fontSize: 15, lineHeight: 22.5 }}>{t('notify.pre.body')}</AppText>
  </Screen>;
}
