import { useState } from 'react';
import { Image, Pressable, View, useWindowDimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppText, Button, Screen } from '../../ui/components';
import { Icon } from '../../ui/Icon';
import { catalogArt, mascotPoses } from '../../scene/catalog';
import { tokens } from '../../theme/tokens';
import { useAppColor } from '../../theme/useAppColor';
import { useType } from '../../theme/typography';
const pages = ['onb.p1', 'onb.p2', 'onb.p3'] as const;
const palette = tokens.color.illustration.palette;
/** Card faces per intro page (S01): pink with the day badge, sky with the room props, sky with the mascot hero. */
const tint = (hex: string, amount: number) => {
  const paper = [0xff, 0xf8, 0xec];
  const channel = (i: number) => Math.round(parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16) * amount + paper[i]! * (1 - amount)).toString(16).padStart(2, '0');
  return `#${channel(0)}${channel(1)}${channel(2)}`;
};
/** Pastel faces mixed over cream paper, the same in light and dark apps (the cards are illustrations). */
const cardFaces = [tint(palette.pink, 0.6), tint(palette.sky, 0.6), tint(palette.sky, 0.4)];
const SAMPLE_DAYS = 483;
function DayBadge() {
  const { t } = useTranslation();
  const { type, emphasis } = useType();
  const preset = tokens.color.widgetPresets[0];
  return (
    <View style={{ position: 'absolute', left: 14, top: 14, flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, paddingHorizontal: 14, backgroundColor: preset.fill, borderRadius: 22, borderWidth: 2, borderColor: tokens.color.widgetOutline.ink }}>
      <Icon name="heart" size={20} color={preset.text} />
      <View><AppText style={[emphasis(12), { color: preset.text }]}>{t('dday.eyebrow')}</AppText><AppText style={[type('heading'), { color: preset.text }]}>{t('dday.count', { n: SAMPLE_DAYS })}</AppText></View>
    </View>
  );
}
function IntroCard({ page }: { page: number }) {
  const { t } = useTranslation();
  const art = (source: number, left: number, top: number, size: number) => <Image source={source} resizeMode="contain" style={{ position: 'absolute', left, top, width: size, height: size }} />;
  return (
    <View accessibilityElementsHidden={page !== 2} importantForAccessibility={page === 2 ? 'auto' : 'no-hide-descendants'}
      style={{ height: 190, borderRadius: tokens.radius.card, borderWidth: tokens.border.outline.normal, borderColor: tokens.color.illustration.outline, backgroundColor: cardFaces[page], overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
      {page === 0 && <><DayBadge />{art(catalogArt('obj_party_balloon'), 168, 84, 64)}{art(catalogArt('obj_shape_sparkle'), 140, 108, 26)}{art(catalogArt('obj_party_ribbon'), 196, 132, 40)}</>}
      {page === 1 && <>{art(catalogArt('obj_decor_lamp'), 30, 70, 84)}{art(catalogArt('obj_decor_cushion'), 110, 104, 76)}{art(catalogArt('obj_plant_potted'), 190, 66, 84)}{art(catalogArt('obj_shape_sparkle'), 120, 30, 34)}</>}
      {page === 2 && <Image testID="welcome-mascot" accessibilityLabel={t('a11y.mascot', { pose: t('a11y.pose.wave_main') })} source={mascotPoses.wave_main} resizeMode="contain" style={{ width: 168, height: 168 }} />}
    </View>
  );
}
function Dots({ page, label }: { page: number; label: string }) {
  const color = useAppColor();
  return (
    <View accessible accessibilityLabel={label} style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, paddingVertical: tokens.spacing[1] }}>
      {pages.map((_, index) => <View key={index} style={{ width: index === page ? 22 : 8, height: 8, borderRadius: 4, backgroundColor: index === page ? color.primary : color.border }} />)}
    </View>
  );
}
/** S01 intro. The third card is the only character hero in the app. */
export function Welcome({ onStart, onHasAccount, fontScale }: { onStart: () => void; onHasAccount: () => void; fontScale?: number }) {
  const color = useAppColor();
  const { t } = useTranslation();
  const { emphasis } = useType();
  const window = useWindowDimensions();
  const [page, setPage] = useState(0);
  const scale = fontScale ?? window.fontScale;
  const last = page === pages.length - 1;
  const key = pages[page]!;
  return (
    <Screen footer={<>
      {last ? <Button label={t('onb.start')} onPress={() => onStart()} /> : <Button label={t('common.next')} onPress={() => setPage(page + 1)} />}
      {last && <Button label={t('onb.hasAccount')} variant="ghost" onPress={() => onHasAccount()} />}
      {last && <View style={{ alignItems: 'center', gap: 2, paddingTop: tokens.spacing[1] }}>
        <AppText variant="caption" tone="text2" align="center">{t('onb.legal.lead')}</AppText>
        <AppText style={[emphasis(12), { color: color.primary, textDecorationLine: 'underline' }]}>{t('onb.legal.links')}</AppText>
        <AppText variant="caption" tone="text2" align="center">{t('onb.age')}</AppText>
      </View>}
    </>}>
      <View style={{ minHeight: 24, alignItems: 'flex-end' }}>
        {!last && <Pressable accessibilityRole="button" accessibilityLabel={t('onb.skip')} hitSlop={12} onPress={() => setPage(pages.length - 1)}><AppText style={[emphasis(14), { color: color.text2 }]}>{t('onb.skip')}</AppText></Pressable>}
      </View>
      {page === 0 && scale < 1.3 && <View style={{ alignItems: 'center', gap: 2 }}>
        <AppText variant="heading" accessibilityRole="header" align="center">{t('main.appName')}</AppText>
        <AppText variant="caption" tone="text2" align="center">{t('brand.tagline')}</AppText>
      </View>}
      <IntroCard page={page} />
      <View style={{ gap: tokens.spacing[1] }}>
        <AppText variant="title" accessibilityRole="header">{t(`${key}.title`)}</AppText>
        <AppText tone="text2">{t(`${key}.body`)}</AppText>
      </View>
      <View style={{ flexGrow: 1 }} />
      <Dots page={page} label={t('onb.pageOf', { n: page + 1, total: pages.length })} />
    </Screen>
  );
}
