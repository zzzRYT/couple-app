import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useType } from '../../theme/typography';
import { useAppColor } from '../../theme/useAppColor';
import { AppText } from '../../ui/components';
import { useLargeText } from '../../ui/textScale';
import { parseCalendarDate } from '../../lib/dday';
import type { Occurrence } from '../../lib/anniversaries';
import { KindTile } from './KindTile';
import { formattedDate, occurrenceTitle, relativeDate } from './format';

/** One anniversary as the V0-04 list draws it; home's "다가오는 기념일" card uses the same row, `compact` (34pt tile, 56pt row). */
export function AnniversaryRow({ item, today, partner, badge = true, compact = false, onPress }: { item: Occurrence; today: string; partner: string; badge?: boolean; compact?: boolean; onPress: () => void }) {
  const { t, i18n } = useTranslation(); const { emphasis } = useType(); const color = useAppColor(); const large = useLargeText();
  const title = occurrenceTitle(item, partner, t), left = relativeDate(item.date, today, t);
  const delta = (parseCalendarDate(item.date)! - parseCalendarDate(today)!) / 86_400_000;
  const dday = <AppText tone={delta === 0 ? 'onPrimary' : delta < 0 ? 'text2' : delta <= 14 ? 'primary' : 'text'} style={[emphasis(15), { flexShrink: 0 }, large && { alignSelf: 'flex-start' }, delta === 0 && { backgroundColor: color.primary, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 2 }]}>{left}</AppText>;
  return <Pressable accessibilityRole="button" accessibilityLabel={t('anniv.row.a11y', { title, date: formattedDate(item.date, i18n.language, true), left })} onPress={onPress} style={{ minHeight: compact ? 56 : 64, paddingHorizontal: 14, paddingVertical: 6, gap: 12, flexDirection: 'row', alignItems: 'center', backgroundColor: delta === 0 ? color.surface2 : color.surface }}>
    <KindTile item={item} size={compact ? 34 : 40} /><View style={{ flex: 1 }}><View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 }}><AppText numberOfLines={large ? undefined : 1} style={[emphasis(16), { flexShrink: 1 }]}>{title}</AppText>{item.kind === 'custom' && badge && <AppText tone="text2" style={[emphasis(11), { lineHeight: 16, borderWidth: 1.2, borderColor: color.border, borderRadius: 999, paddingHorizontal: 6 }]}>{t('anniv.badge.custom')}</AppText>}</View><AppText tone="text2" style={{ fontSize: 13 }}>{formattedDate(item.date, i18n.language, false)}</AppText>{large && dday}</View>
    {!large && dday}
  </Pressable>;
}
