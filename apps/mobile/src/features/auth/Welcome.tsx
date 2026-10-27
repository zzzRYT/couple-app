import { useState } from 'react';
import { Image, Text, View, useWindowDimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button } from '../../ui/components';
import { mascotPoses } from '../../scene/catalog';
import { tokens } from '../../theme/tokens';
const color = tokens.color.app.light.normal;
const pages = ['onb.p1', 'onb.p2', 'onb.p3'] as const;
/** S01 intro. The third card is the only character hero in the app; no birth date is ever collected (FR-058). */
export function Welcome({ onStart, onHasAccount, fontScale }: { onStart: () => void; onHasAccount: () => void; fontScale?: number }) {
  const { t } = useTranslation();
  const window = useWindowDimensions();
  const [page, setPage] = useState(0);
  const scale = fontScale ?? window.fontScale;
  const last = page === pages.length - 1;
  const key = pages[page]!;
  return (
    <View style={{ flex: 1, padding: 24, backgroundColor: color.bg, justifyContent: 'space-between' }}>
      <View>
        <Text accessibilityRole="header" style={{ color: color.text, fontSize: 28 }}>{t('main.appName')}</Text>
        {scale < 1.3 && <Text style={{ color: color.text2 }}>{t('brand.tagline')}</Text>}
      </View>
      <View>
        {last && <Image testID="welcome-mascot" accessibilityLabel={t('a11y.mascot', { pose: t('a11y.pose.wave_main') })} source={mascotPoses.wave_main} style={{ width: 160, height: 160, alignSelf: 'center' }} />}
        <Text accessibilityRole="header" style={{ color: color.text, fontSize: 20 }}>{t(`${key}.title`)}</Text>
        <Text style={{ color: color.text2 }}>{t(`${key}.body`)}</Text>
        <Text style={{ color: color.text2 }}>{t('onb.pageOf', { n: page + 1, total: pages.length })}</Text>
      </View>
      <View style={{ gap: 8 }}>
        {!last && <Button label={t('common.next')} variant="secondary" onPress={() => setPage(page + 1)} />}
        <Button label={t('onb.start')} onPress={() => onStart()} />
        <Button label={t('onb.hasAccount')} variant="secondary" onPress={onHasAccount} />
        <Text style={{ color: color.text2, fontSize: 12 }}>{t('onb.legal.lead')}</Text>
        <Text style={{ color: color.text2, fontSize: 12 }}>{t('onb.legal.links')}</Text>
      </View>
    </View>
  );
}
