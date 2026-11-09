import { Image, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppText, IconButton } from '../../ui/components';
import { catalogArt, mascotPoses } from '../../scene/catalog';
import { tokens } from '../../theme/tokens';
import { useAppColor } from '../../theme/useAppColor';
import type { MilestoneCelebration } from '../../lib/client';
import { useLargeText } from '../../ui/textScale';
import { parseCalendarDate } from '../../lib/dday';
import { formattedMonthDay, formattedYearMonthDay } from '../anniversaries/format';

const sparkle = catalogArt('obj_shape_sparkle');
/** V0-home-today card for every celebration (day and year milestones, season, birthday, custom): cheering mascot with two sparkles, title, body and a 44pt close in the corner. At large text the text gets its own full-width line. */
export function TodayCard({ title, body, disabled = false, onClose }: { title: string; body: string; disabled?: boolean; onClose: () => void }) {
  const { t } = useTranslation(); const color = useAppColor(); const large = useLargeText();
  const mascot = <View style={{ width: 96, height: 92, justifyContent: 'center' }}>
    <Image accessibilityLabel={t('mascot.alt.cheer')} source={mascotPoses.cheer} resizeMode="contain" style={{ width: 90, height: 90 }} />
    <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}>
      <Image source={sparkle} resizeMode="contain" style={{ position: 'absolute', left: -4, top: 2, width: 22, height: 22, transform: [{ rotate: '-8deg' }] }} />
      <Image source={sparkle} resizeMode="contain" style={{ position: 'absolute', right: -2, top: -4, width: 18, height: 18, transform: [{ rotate: '10deg' }] }} />
    </View>
  </View>;
  const close = <IconButton plain compact icon="close" label={t('home.today.close')} disabled={disabled} onPress={onClose} />;
  const text = <View style={{ flex: large ? undefined : 1, gap: 4, paddingRight: large ? 0 : 30 }}><AppText variant="heading">{title}</AppText><AppText tone="text2" variant="bodySm">{body}</AppText></View>;
  const card = { backgroundColor: color.surface, borderWidth: tokens.border.outline.normal, borderColor: color.line, borderRadius: 24 };
  if (large) return <View style={[card, { gap: 8, padding: 14 }]}><View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>{mascot}{close}</View>{text}</View>;
  return <View style={[card, { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, paddingRight: 14, paddingLeft: 8 }]}>
    {mascot}{text}
    <View style={{ position: 'absolute', right: 2, top: 2 }}>{close}</View>
  </View>;
}
/** The server-recorded day or year milestone; a late one names its date without the year (V0-home-late). */
export function CelebrationCard({ celebration, startDate, disabled, onSeen }: { celebration: MilestoneCelebration; startDate: string; disabled: boolean; onSeen: () => void }) {
  const { t, i18n } = useTranslation();
  const title = celebration.kind === 'day' ? t('anniv.days', { n: celebration.days }) : t('anniv.years', { n: celebration.anniversaryN });
  const n = Math.round((parseCalendarDate(celebration.milestoneDate)! - parseCalendarDate(startDate)!) / 86_400_000) + 1;
  const body = celebration.daysAgo > 0 ? t('home.today.late', { date: formattedMonthDay(celebration.milestoneDate, i18n.language), title }) : t('home.today.body.milestone', { date: formattedYearMonthDay(startDate, i18n.language), n });
  return <TodayCard title={t('home.today.title', { title })} body={body} disabled={disabled} onClose={onSeen} />;
}
