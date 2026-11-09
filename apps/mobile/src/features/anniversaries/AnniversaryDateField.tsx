import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useType } from '../../theme/typography';
import { useAppColor } from '../../theme/useAppColor';
import { AppText } from '../../ui/components';
import { DateWheelSheet, fieldOrder, fieldText, type DateParts } from '../../ui/DateWheel';

const units = { year: 'space.year', month: 'space.month', day: 'space.day' } as const;
export function AnniversaryDateField({ value, onChange, minYear = 1900, maxYear }: { value: DateParts; onChange: (value: DateParts) => void; minYear?: number; maxYear: number }) {
  const { t, i18n } = useTranslation(); const { emphasis } = useType(); const color = useAppColor();
  const [open, setOpen] = useState(false); const [draft, setDraft] = useState(value);
  return <>
    <Pressable accessibilityRole="button" accessibilityLabel={t('edit.field.date')} onPress={() => { setDraft(value); setOpen(true); }} style={{ flexDirection: 'row', gap: 8 }}>
      {fieldOrder(i18n.language).map((field) => <View key={field} style={{ flex: field === 'year' ? 1.5 : 1, minHeight: 52, backgroundColor: color.surface, borderColor: color.border, borderWidth: 2, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 4 }}><AppText style={emphasis(20)}>{i18n.language.startsWith('en') ? fieldText(field, value[field], i18n.language, '') : value[field]}</AppText>{!i18n.language.startsWith('en') && <AppText tone="text2" style={{ fontSize: 14 }}>{t(units[field])}</AppText>}</View>)}
    </Pressable>
    <DateWheelSheet visible={open} value={draft} onChange={setDraft} minYear={minYear} maxYear={maxYear} onDone={() => { onChange(draft); setOpen(false); }} onClose={() => setOpen(false)} />
  </>;
}
