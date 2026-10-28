import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { RoomPresentation } from '../../lib/client';
import { dayCount, formatAnniversary } from '../../lib/dday';
import { tokens } from '../../theme/tokens';
import { emphasisStyle, typeStyle } from '../../theme/typography';
import { Icon } from '../../ui/Icon';
const presets = Object.fromEntries(tokens.color.widgetPresets.map((preset) => [preset.id, preset]));
const styleFill: Record<string, string> = { 'day.default': 'butter', 'day.card': 'cream', 'day.minimal': 'cream', 'day.accent': 'peach', 'night.default': 'sky', 'night.card': 'cream', 'night.minimal': 'sage', 'night.accent': 'pink' };
/** x/y are normalized centers, like scene nodes. Native D-day view (components.md §8): prompts may move, restyle, resize or hide it, but the date value and its spoken sentence are app-owned. */
export function DdayWidget({ presentation, anniversaryDate, timeZone, now, width, height }: { presentation: RoomPresentation; anniversaryDate: string; timeZone: string; now: string; width: number; height: number }) {
  const { t, i18n } = useTranslation();
  if (!presentation.visible) return null;
  const preset = presets[styleFill[presentation.styleToken] ?? 'butter'] ?? tokens.color.widgetPresets[0]!;
  const count = dayCount(anniversaryDate, now, timeZone);
  const n = count.ok ? count.dayCount : 0;
  const scale = presentation.textScale;
  const boxWidth = presentation.width * width;
  return (
    <View testID="dday-widget" accessible accessibilityRole="text" accessibilityLabel={`${t('dday.eyebrow')} ${t('dday.count', { n })}, ${formatAnniversary(anniversaryDate, i18n.language)}`}
      style={{ position: 'absolute', left: (presentation.x - presentation.width / 2) * width, top: (presentation.y - presentation.height / 2) * height, maxWidth: boxWidth, minHeight: Math.max(tokens.touch.minimum, presentation.height * height), flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, paddingHorizontal: 18, backgroundColor: preset.fill, borderWidth: tokens.color.widgetOutline.widthByMode.normal, borderColor: tokens.color.widgetOutline.ink, borderRadius: presentation.styleToken.endsWith('card') ? tokens.radius.card : 32, zIndex: 40 }}>
      <Icon name="heart" size={22 * scale} color={preset.text} />
      <View style={{ flexShrink: 1 }}>
        <Text style={[emphasisStyle(13 * scale, i18n.language), { color: preset.text }]}>{t('dday.eyebrow')}</Text>
        <Text style={[typeStyle('heading', i18n.language), { color: preset.text, fontSize: 24 * scale, lineHeight: 30 * scale }]}>{t('dday.count', { n })}</Text>
      </View>
    </View>
  );
}
