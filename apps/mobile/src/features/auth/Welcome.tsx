import { useState } from 'react';
import { Image, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button } from '../../ui/components';
import { mascotPoses } from '../../scene/catalog';
import { catalogImages } from '../../scene/catalogImages';
import { tokens } from '../../theme/tokens';
import { useAppColor } from '../../theme/useAppColor';
const pages = ['onb.p1', 'onb.p2', 'onb.p3'] as const;
/** S01 intro. The third card is the only character hero in the app. */
export function Welcome({ onStart, onHasAccount, fontScale }: { onStart: () => void; onHasAccount: () => void; fontScale?: number }) {
  const color = useAppColor();
  const { t, i18n } = useTranslation();
  const window = useWindowDimensions();
  const [page, setPage] = useState(0);
  const scale = fontScale ?? window.fontScale;
  const last = page === pages.length - 1;
  const key = pages[page]!;
  const displayFont = i18n.language.startsWith('ja') ? 'Yomogi' : 'GaeguBold';
  const bodyFont = i18n.language.startsWith('ja') ? 'NotoSansJP' : 'GowunDodum';
  return <ScrollView style={{ flex: 1, backgroundColor: color.bg }} contentContainerStyle={{ flexGrow: 1, padding: tokens.spacing[5], gap: tokens.spacing[3] }}>
    <View style={{ alignItems: 'center', gap: tokens.spacing[0] }}>
      <Text accessibilityRole="header" style={{ color: color.text, fontSize: tokens.typography.scale.title.size, fontFamily: displayFont }}>{t('main.appName')}</Text>
      {scale < 1.3 && <Text style={{ color: color.text2, fontFamily: bodyFont }}>{t('brand.tagline')}</Text>}
    </View>
    <View style={{ flexGrow: 1, justifyContent: 'center', gap: tokens.spacing[3] }}>
      <View style={{ minHeight: 180, alignItems: 'center', justifyContent: 'center', backgroundColor: color.surface2, borderColor: color.line, borderWidth: tokens.border.outline.normal, borderRadius: tokens.radius.card }}>
        {last ? <Image testID="welcome-mascot" accessibilityLabel={t('a11y.mascot', { pose: t('a11y.pose.wave_main') })} source={mascotPoses.wave_main} style={{ width: 160, height: 160 }} /> : <Image accessibilityIgnoresInvertColors source={page === 0 ? catalogImages.obj_party_balloon : catalogImages.obj_plant_potted} style={{ width: 96, height: 96 }} />}
      </View>
      <Text accessibilityRole="header" style={{ color: color.text, fontSize: tokens.typography.scale.title.size, fontFamily: displayFont }}>{t(`${key}.title`)}</Text>
      <Text style={{ color: color.text2, fontSize: tokens.typography.scale.body.size, lineHeight: tokens.typography.scale.body.size * (i18n.language.startsWith('ja') ? tokens.typography.lineHeight.ja : tokens.typography.lineHeight.ko), fontFamily: bodyFont }}>{t(`${key}.body`)}</Text>
      <Text style={{ color: color.text2, textAlign: 'center', fontFamily: bodyFont }}>{t('onb.pageOf', { n: page + 1, total: pages.length })}</Text>
    </View>
    <View style={{ gap: tokens.spacing[1] }}>
      {!last && <Button label={t('common.next')} onPress={() => setPage(page + 1)} />}
      <Button label={t('onb.start')} variant={last ? 'primary' : 'secondary'} onPress={() => onStart()} />
      <Button label={t('onb.hasAccount')} variant="ghost" onPress={() => onHasAccount()} />
      <Text style={{ color: color.text2, fontSize: tokens.typography.scale.caption.size, fontFamily: bodyFont }}>{t('onb.legal.lead')}</Text>
      <Text style={{ color: color.text2, fontSize: tokens.typography.scale.caption.size, fontFamily: bodyFont }}>{t('onb.legal.links')}</Text>
    </View>
  </ScrollView>;
}
