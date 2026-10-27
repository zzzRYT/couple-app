import { Pressable, ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { tokens } from '../theme/tokens';
const color = tokens.color.app.light.normal;
const ROW = 44;
export type DateParts = { year: number; month: number; day: number };
export const toIsoDate = ({ year, month, day }: DateParts) => `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
export function fromIsoDate(value: string): DateParts {
  const [year, month, day] = value.split('-').map(Number);
  return { year: year!, month: month!, day: day! };
}
function Column({ field, values, selected, unit, onChange }: { field: keyof DateParts; values: number[]; selected: number; unit: string; onChange: (value: number) => void }) {
  const index = values.indexOf(selected);
  const step = (delta: number) => { const next = values[index + delta]; if (next !== undefined) onChange(next); };
  return (
    <View accessible accessibilityRole="adjustable" accessibilityLabel={unit} accessibilityValue={{ text: `${selected}${unit}` }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]} onAccessibilityAction={(event) => step(event.nativeEvent.actionName === 'increment' ? 1 : -1)}
      style={{ flex: 1, height: ROW * 3 }}>
      <ScrollView snapToInterval={ROW} showsVerticalScrollIndicator={false} contentOffset={{ x: 0, y: Math.max(0, index - 1) * ROW }}>
        {values.map((value) => (
          <Pressable key={value} testID={`wheel-${field}-${value}`} onPress={() => onChange(value)} style={{ height: ROW, justifyContent: 'center', alignItems: 'center', backgroundColor: value === selected ? color.surface2 : 'transparent' }}>
            <Text style={{ color: value === selected ? color.text : color.text2 }}>{`${value}${unit}`}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}
/** Three-column wheel (not a calendar). Days always list 1-31 so impossible dates are reported by validation instead of silently clamped. */
export function DateWheel({ value, onChange, maxYear }: { value: DateParts; onChange: (value: DateParts) => void; maxYear: number }) {
  const { t } = useTranslation();
  const range = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => from + i);
  return (
    <View accessibilityLabel={t('a11y.dateField')} style={{ flexDirection: 'row', borderWidth: 2, borderColor: color.line }}>
      <Column field="year" values={range(maxYear - 80, maxYear)} selected={value.year} unit={t('space.year')} onChange={(year) => onChange({ ...value, year })} />
      <Column field="month" values={range(1, 12)} selected={value.month} unit={t('space.month')} onChange={(month) => onChange({ ...value, month })} />
      <Column field="day" values={range(1, 31)} selected={value.day} unit={t('space.day')} onChange={(day) => onChange({ ...value, day })} />
    </View>
  );
}
