import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { RoomPresentation } from '../../lib/client';
import { dayCount, formatAnniversary } from '../../lib/dday';
import { tokens } from '../../theme/tokens';
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
  return (
    <View testID="dday-widget" accessible accessibilityRole="text" accessibilityLabel={`${t('dday.eyebrow')} ${t('dday.count', { n })}, ${formatAnniversary(anniversaryDate, i18n.language)}`}
      style={{ position: 'absolute', left: (presentation.x - presentation.width / 2) * width, top: (presentation.y - presentation.height / 2) * height, width: presentation.width * width, minHeight: Math.max(44, presentation.height * height), padding: 8, backgroundColor: preset.fill, borderWidth: tokens.color.widgetOutline.widthByMode.normal, borderColor: tokens.color.widgetOutline.ink, borderRadius: presentation.styleToken.endsWith('card') ? 12 : 24, zIndex: 40 }}>
      <Text style={{ color: preset.text, fontSize: 12 * scale }}>{t('dday.eyebrow')}</Text>
      <Text style={{ color: preset.text, fontSize: 24 * scale }}>{t('dday.count', { n })}</Text>
    </View>
  );
}
