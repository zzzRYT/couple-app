import { useEffect, useRef, useState, type ComponentRef } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDisplayAppearance } from '../settings/preferences';
import { useType } from '../../theme/typography';
import { useAppColor } from '../../theme/useAppColor';
import { AppText } from '../../ui/components';
import { SheetModal } from '../../ui/SheetModal';
import { fieldOrder, fieldText, type DateParts } from '../../ui/DateWheel';

type Field = keyof DateParts;
const ROW = 40;
const units = { year: 'space.year', month: 'space.month', day: 'space.day' } as const;
const daysIn = (year: number, month: number) => new Date(Date.UTC(year, month, 0)).getUTCDate();
function Column({ values, value, label, onChange }: { values: number[]; value: number; label: string; onChange: (value: number) => void }) {
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null); const color = useAppColor(); const { emphasis } = useType();
  const index = Math.max(0, values.indexOf(value));
  // The day column shrinks when the month changes; keep the clamped day in the band.
  useEffect(() => { scroll.current?.scrollTo({ y: index * ROW, animated: false }); }, [values.length]);
  const select = (position: number) => { const next = values[Math.max(0, Math.min(values.length - 1, position))]; if (next !== undefined) onChange(next); };
  return <View accessible accessibilityRole="adjustable" accessibilityLabel={label} accessibilityValue={{ text: String(value) }} accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]} onAccessibilityAction={(event) => { const next = index + (event.nativeEvent.actionName === 'increment' ? 1 : -1); select(next); scroll.current?.scrollTo({ y: Math.max(0, Math.min(values.length - 1, next)) * ROW, animated: true }); }} style={{ flex: 1, height: ROW * 5 }}>
    <ScrollView ref={scroll} snapToInterval={ROW} decelerationRate="fast" showsVerticalScrollIndicator={false} contentOffset={{ x: 0, y: index * ROW }} contentContainerStyle={{ paddingVertical: ROW * 2 }} onMomentumScrollEnd={(event) => select(Math.round(event.nativeEvent.contentOffset.y / ROW))}>
      {values.map((entry, position) => <Pressable key={entry} onPress={() => { select(position); scroll.current?.scrollTo({ y: position * ROW, animated: true }); }} style={{ height: ROW, alignItems: 'center', justifyContent: 'center' }}><AppText style={[position === index ? emphasis(21) : { fontSize: Math.abs(position - index) === 1 ? 19 : 17 }, { opacity: position === index ? 1 : Math.abs(position - index) === 1 ? 0.55 : 0.3, color: color.text }]}>{entry}</AppText></Pressable>)}
    </ScrollView>
  </View>;
}
export function AnniversaryDateField({ value, onChange, minYear = 1900, maxYear }: { value: DateParts; onChange: (value: DateParts) => void; minYear?: number; maxYear: number }) {
  const { t, i18n } = useTranslation(); const { emphasis } = useType(); const color = useAppColor(); const { scheme } = useDisplayAppearance(); const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false); const [draft, setDraft] = useState(value);
  const range = (start: number, end: number) => Array.from({ length: end - start + 1 }, (_, index) => start + index);
  const values: Record<Field, number[]> = { year: range(minYear, maxYear), month: range(1, 12), day: range(1, daysIn(draft.year, draft.month)) };
  const pick = (field: Field, next: number) => setDraft((current) => { const picked = { ...current, [field]: next }; return { ...picked, day: Math.min(picked.day, daysIn(picked.year, picked.month)) }; });
  const order = fieldOrder(i18n.language);
  return <>
    <Pressable accessibilityRole="button" accessibilityLabel={t('edit.field.date')} onPress={() => { setDraft(value); setOpen(true); }} style={{ flexDirection: 'row', gap: 8 }}>
      {order.map((field) => <View key={field} style={{ flex: field === 'year' ? 1.5 : 1, minHeight: 52, backgroundColor: color.surface, borderColor: color.border, borderWidth: 2, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 4 }}><AppText style={emphasis(20)}>{i18n.language.startsWith('en') ? fieldText(field, value[field], i18n.language, '') : value[field]}</AppText>{!i18n.language.startsWith('en') && <AppText tone="text2" style={{ fontSize: 14 }}>{t(units[field])}</AppText>}</View>)}
    </Pressable>
    <SheetModal visible={open} onClose={() => setOpen(false)} dismissLabel={t('common.cancel')} scrim={scheme === 'dark' ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.35)'}><View accessibilityViewIsModal style={{ height: 330 + Math.max(0, insets.bottom - 34), backgroundColor: color.surface, borderTopWidth: 2, borderColor: color.line, borderTopLeftRadius: 28, borderTopRightRadius: 30, paddingTop: 10, paddingHorizontal: 20, paddingBottom: Math.max(insets.bottom, 34), gap: 14 }}>
      <View style={{ width: 40, height: 5, borderRadius: 3, backgroundColor: color.border, opacity: 0.6, alignSelf: 'center' }} />
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}><AppText style={emphasis(18)}>{t('space.date.pick')}</AppText><Pressable accessibilityRole="button" onPress={() => { onChange(draft); setOpen(false); }} style={{ minHeight: 48, justifyContent: 'center' }}><AppText tone="primary" style={emphasis(16)}>{t('common.done')}</AppText></Pressable></View>
      <View accessibilityLabel={t('space.date.pick')} style={{ height: ROW * 5, flexDirection: 'row', paddingHorizontal: 8 }}><View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: ROW * 2, height: ROW, backgroundColor: color.surface2, borderColor: color.border, borderWidth: 1.5, borderRadius: 12 }} />{order.map((field) => <Column key={field} values={values[field]} value={draft[field]} label={t(units[field])} onChange={(next) => pick(field, next)} />)}</View>
    </View></SheetModal>
  </>;
}
