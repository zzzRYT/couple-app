import { useEffect, useRef, useState, type ComponentRef, type ReactNode } from 'react';
import { Pressable, ScrollView, Text, View, type ViewStyle } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDisplayAppearance } from '../features/settings/preferences';
import { useAppColor } from '../theme/useAppColor';
import { useType } from '../theme/typography';
import { tokens } from '../theme/tokens';
import { AppText } from './components';
import { SheetModal } from './SheetModal';

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
const BAND_ROW = 40;
const daysIn = (year: number, month: number) => new Date(Date.UTC(year, month, 0)).getUTCDate();
function BandColumn({ field, values, value, label, onChange }: { field: Field; values: number[]; value: number; label: string; onChange: (value: number) => void }) {
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null); const color = useAppColor(); const { emphasis } = useType();
  const index = Math.max(0, values.indexOf(value));
  // The day column shrinks when the month changes; keep the clamped day in the band.
  useEffect(() => { scroll.current?.scrollTo({ y: index * BAND_ROW, animated: false }); }, [values.length]);
  const select = (position: number) => { const next = values[Math.max(0, Math.min(values.length - 1, position))]; if (next !== undefined) onChange(next); };
  return <View accessible accessibilityRole="adjustable" accessibilityLabel={label} accessibilityValue={{ text: String(value) }} accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]} onAccessibilityAction={(event) => { const next = index + (event.nativeEvent.actionName === 'increment' ? 1 : -1); select(next); scroll.current?.scrollTo({ y: Math.max(0, Math.min(values.length - 1, next)) * BAND_ROW, animated: true }); }} style={{ flex: 1, height: BAND_ROW * 5 }}>
    <ScrollView ref={scroll} snapToInterval={BAND_ROW} decelerationRate="fast" showsVerticalScrollIndicator={false} contentOffset={{ x: 0, y: index * BAND_ROW }} contentContainerStyle={{ paddingVertical: BAND_ROW * 2 }} onMomentumScrollEnd={(event) => select(Math.round(event.nativeEvent.contentOffset.y / BAND_ROW))}>
      {values.map((entry, position) => <Pressable key={entry} testID={`wheel-${field}-${entry}`} onPress={() => { select(position); scroll.current?.scrollTo({ y: position * BAND_ROW, animated: true }); }} style={{ height: BAND_ROW, alignItems: 'center', justifyContent: 'center' }}><AppText style={[position === index ? emphasis(21) : { fontSize: Math.abs(position - index) === 1 ? 19 : 17 }, { opacity: position === index ? 1 : Math.abs(position - index) === 1 ? 0.55 : 0.3, color: color.text }]}>{entry}</AppText></Pressable>)}
    </ScrollView>
  </View>;
}
/**
 * The date wheel sheet (V0-start-date-picker, V0-edit-picker): title with 완료 at the top right, three plain columns over the
 * selection band, then `children` such as the live day-count chip. Days follow the chosen month. The scrim closes without committing.
 */
export function DateWheelSheet({ visible, value, onChange, onDone, onClose, minYear, maxYear, children }: { visible: boolean; value: DateParts; onChange: (update: (current: DateParts) => DateParts) => void; onDone: () => void; onClose: () => void; minYear: number; maxYear: number; children?: ReactNode }) {
  const { t, i18n } = useTranslation(); const { emphasis } = useType(); const color = useAppColor(); const { scheme } = useDisplayAppearance(); const insets = useSafeAreaInsets();
  const range = (start: number, end: number) => Array.from({ length: end - start + 1 }, (_, index) => start + index);
  const values: Record<Field, number[]> = { year: range(minYear, maxYear), month: range(1, 12), day: range(1, daysIn(value.year, value.month)) };
  const pick = (field: Field, next: number) => onChange((current) => { const picked = { ...current, [field]: next }; return { ...picked, day: Math.min(picked.day, daysIn(picked.year, picked.month)) }; });
  // Drawn 330 tall, 380 with the chip.
  return <SheetModal visible={visible} onClose={onClose} dismissLabel={t('common.cancel')} scrim={scheme === 'dark' ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.35)'}><View accessibilityViewIsModal style={{ minHeight: (children ? 380 : 330) + Math.max(0, insets.bottom - 34), backgroundColor: color.surface, borderTopWidth: 2, borderColor: color.line, borderTopLeftRadius: 28, borderTopRightRadius: 30, paddingTop: 10, paddingHorizontal: 20, paddingBottom: Math.max(insets.bottom, 34), gap: 14 }}>
    <View style={{ width: 40, height: 5, borderRadius: 3, backgroundColor: color.border, opacity: 0.6, alignSelf: 'center' }} />
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}><AppText style={emphasis(18)}>{t('space.date.pick')}</AppText><Pressable accessibilityRole="button" onPress={onDone} style={{ minHeight: 48, justifyContent: 'center' }}><AppText tone="primary" style={emphasis(16)}>{t('common.done')}</AppText></Pressable></View>
    <View accessibilityLabel={t('space.date.pick')} style={{ height: BAND_ROW * 5, flexDirection: 'row', paddingHorizontal: 8 }}><View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: BAND_ROW * 2, height: BAND_ROW, backgroundColor: color.surface2, borderColor: color.border, borderWidth: 1.5, borderRadius: 12 }} />{fieldOrder(i18n.language).map((field) => <BandColumn key={field} field={field} values={values[field]} value={value[field]} label={t(unitKey[field])} onChange={(next) => pick(field, next)} />)}</View>
    {children}
  </View></SheetModal>;
}
/** V0-start-date: three outlined boxes; tapping one opens the date wheel sheet with the live preview under the wheel. */
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
      <DateWheelSheet visible={open} value={draft} onChange={setDraft} minYear={maxYear - 80} maxYear={maxYear} onDone={() => { onChange(draft); setOpen(false); }} onClose={() => setOpen(false)}>{renderPreview?.(draft)}</DateWheelSheet>
    </>
  );
}
