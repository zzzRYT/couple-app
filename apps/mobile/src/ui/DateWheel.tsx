import { useState } from 'react';
import { Pressable, ScrollView, Text, View, type ViewStyle } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAppColor } from '../theme/useAppColor';
import { useType } from '../theme/typography';
import { tokens } from '../theme/tokens';
import { BottomSheet, Button } from './components';

const ROW = 44;
export type DateParts = { year: number; month: number; day: number };
export const toIsoDate = ({ year, month, day }: DateParts) => `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
export function fromIsoDate(value: string): DateParts {
  const [year, month, day] = value.split('-').map(Number);
  return { year: year!, month: month!, day: day! };
}
type Field = keyof DateParts;
/** Field order per language (components.md §2.3): ko/ja year-month-day, en month-day-year. */
export const fieldOrder = (language: string): Field[] => (language.startsWith('en') ? ['month', 'day', 'year'] : ['year', 'month', 'day']);
const unitKey = { year: 'space.year', month: 'space.month', day: 'space.day' } as const;
/** ko/ja read "2025년 6월 29일" with unit suffixes; English shows the month name and bare numbers. */
export function fieldText(field: Field, value: number, language: string, unit: string): string {
  if (!language.startsWith('en')) return `${value}${unit}`;
  return field === 'month' ? new Intl.DateTimeFormat(language, { month: 'short', timeZone: 'UTC' }).format(new Date(Date.UTC(2000, value - 1, 1))) : String(value);
}
function Column({ field, values, selected, unit, onChange }: { field: Field; values: number[]; selected: number; unit: string; onChange: (value: number) => void }) {
  const { i18n } = useTranslation();
  return <WheelColumn id={field} values={values} selected={selected} unit={unit} label={(value) => fieldText(field, value, i18n.language, unit)} onChange={onChange} />;
}
/** One scrolling column of a wheel; `spoken` replaces the selected label for screen readers when the column alone says too little. */
export function WheelColumn({ id, values, selected, unit, label, spoken, onChange }: { id: string; values: number[]; selected: number; unit: string; label: (value: number) => string; spoken?: string; onChange: (value: number) => void }) {
  const color = useAppColor();
  const { type, emphasis } = useType();
  const index = values.indexOf(selected);
  const step = (delta: number) => { const next = values[index + delta]; if (next !== undefined) onChange(next); };
  return (
    <View accessible accessibilityRole="adjustable" accessibilityLabel={unit} accessibilityValue={{ text: spoken ?? label(selected) }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]} onAccessibilityAction={(event) => step(event.nativeEvent.actionName === 'increment' ? 1 : -1)}
      style={{ flex: 1, height: ROW * 5 }}>
      <ScrollView snapToInterval={ROW} showsVerticalScrollIndicator={false} contentOffset={{ x: 0, y: Math.max(0, index - 2) * ROW }}>
        {values.map((value) => (
          <Pressable key={value} testID={`wheel-${id}-${value}`} onPress={() => onChange(value)} style={{ height: ROW, justifyContent: 'center', alignItems: 'center', marginHorizontal: 4, borderRadius: tokens.radius.input, backgroundColor: value === selected ? color.surface2 : 'transparent' }}>
            <Text style={value === selected ? [emphasis(17), { color: color.text }] : [type('body'), { color: color.text2 }]}>{label(value)}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}
/** Three-column wheel (not a calendar). Days always list 1-31 so impossible dates are reported by validation instead of silently clamped. */
export function DateWheel({ value, onChange, maxYear, minYear = maxYear - 80, includeYear = true }: { value: DateParts; onChange: (value: DateParts) => void; maxYear: number; minYear?: number; includeYear?: boolean }) {
  const color = useAppColor();
  const { t, i18n } = useTranslation();
  const range = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => from + i);
  const values = { year: range(minYear, maxYear), month: range(1, 12), day: range(1, 31) };
  return (
    <View accessibilityLabel={t('a11y.dateField')} style={{ flexDirection: 'row', paddingVertical: 4, borderWidth: tokens.border.outline.normal, borderColor: color.line, borderRadius: tokens.radius.card, backgroundColor: color.surface }}>
      {fieldOrder(i18n.language).filter((field) => includeYear || field !== 'year').map((field) => <Column key={field} field={field} values={values[field]} selected={value[field]} unit={t(unitKey[field])} onChange={(next) => onChange({ ...value, [field]: next })} />)}
    </View>
  );
}
/** Segment widths as drawn: ko/ja year 1.5 : 1 : 1; English month 1.2, day 1, year 1.4. */
const segmentFlex = (field: Field, language: string) => (language.startsWith('en') ? { month: 1.2, day: 1, year: 1.4 } : { year: 1.5, month: 1, day: 1 })[field];
/** One outlined date box (V0-01 §2.5): the bold number with its small unit; English shows the month name and bare numbers. */
export function DateSegment({ field, value, error = false, label, testID, onPress }: { field: Field; value: number; error?: boolean; label?: string; testID?: string; onPress?: () => void }) {
  const color = useAppColor();
  const { t, i18n } = useTranslation();
  const { type, emphasis } = useType();
  const en = i18n.language.startsWith('en');
  const box: ViewStyle = { flex: segmentFlex(field, i18n.language), minHeight: tokens.touch.toolbarHeight, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: tokens.spacing[0], paddingHorizontal: tokens.spacing[2], borderRadius: tokens.radius.input, borderWidth: tokens.border.outline.normal, borderColor: error ? color.danger : color.border, backgroundColor: color.surface };
  const content = <>
    <Text style={[emphasis(20), { color: color.text }]}>{en ? fieldText(field, value, i18n.language, '') : value}</Text>
    {!en && <Text style={[type('bodySm'), { color: color.text2 }]}>{t(unitKey[field])}</Text>}
  </>;
  if (!onPress) return <View style={box}>{content}</View>;
  return <Pressable testID={testID} accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={({ pressed }) => [box, { opacity: pressed ? 0.8 : 1 }]}>{content}</Pressable>;
}
/** S03-form: three outlined boxes; tapping one opens the wheel in a sheet (S03-picker). */
export function DateField({ value, onChange, maxYear, error, renderPreview }: { value: DateParts; onChange: (value: DateParts) => void; maxYear: number; error?: boolean; renderPreview?: (draft: DateParts) => React.ReactNode }) {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);
  return (
    <>
      <View style={{ flexDirection: 'row', gap: tokens.spacing[1] }}>
        {fieldOrder(i18n.language).map((field) => (
          <DateSegment key={field} field={field} value={value[field]} error={error} testID={`date-${field}`} label={`${t('start.date.label')}, ${fieldText(field, value[field], i18n.language, t(unitKey[field]))}`} onPress={() => { setDraft(value); setOpen(true); }} />
        ))}
      </View>
      <BottomSheet visible={open} title={t('space.date.pick')} onClose={() => setOpen(false)}>
        <DateWheel value={draft} maxYear={maxYear} onChange={setDraft} />
        {renderPreview?.(draft)}
        <Button label={t('common.done')} onPress={() => { onChange(draft); setOpen(false); }} />
      </BottomSheet>
    </>
  );
}
