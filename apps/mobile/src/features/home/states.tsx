import { Image, ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText, Button, useTabBarClearance } from '../../ui/components';
import { mascotPoses } from '../../scene/catalog';
import { useAppColor } from '../../theme/useAppColor';
import { useType } from '../../theme/typography';
/** V0-state-error and V0-state-offline-empty. Inside a tab, `title` heads it and the tab bar stays reachable; without one it stands alone for a failure at boot. */
export function V0Error({ retry, offline = false, title }: { retry: () => void; offline?: boolean; title?: string }) {
  const { t } = useTranslation(); const { emphasis } = useType();
  const color = useAppColor(); const insets = useSafeAreaInsets(); const clearance = useTabBarClearance();
  const art = offline ? 150 : 140;
  return <View style={{ flex: 1, backgroundColor: color.bg, paddingTop: insets.top, paddingBottom: title ? clearance : insets.bottom }}>
    {title && <View style={{ minHeight: 48, justifyContent: 'center', paddingHorizontal: 20 }}><AppText accessibilityRole="header" style={emphasis(16)}>{title}</AppText></View>}
    <ScrollView contentContainerStyle={{ flexGrow: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 32, paddingVertical: 20 }}>
      <Image source={offline ? mascotPoses.lie : mascotPoses.lookup} accessibilityLabel={t('mascot.alt.lookup')} resizeMode="contain" style={{ width: art, height: art }} />
      <AppText variant="title" align="center" accessibilityRole="header" style={{ fontSize: offline ? 22 : 24, lineHeight: offline ? 28 : 30 }}>{t(offline ? 'state.offline.empty.title' : 'state.error.title')}</AppText>
      <AppText tone="text2" align="center">{t(offline ? 'state.offline.empty.body' : 'state.error.body')}</AppText>
      <View style={{ minWidth: 220, maxWidth: '100%', marginTop: 6 }}><Button label={t('common.retry')} icon="undo" variant={offline ? 'secondary' : 'primary'} onPress={retry} /></View>
    </ScrollView>
  </View>;
}
