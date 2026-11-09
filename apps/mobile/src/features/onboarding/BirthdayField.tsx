import { useState } from 'react';
import { Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppText, BottomSheet, Button } from '../../ui/components';
import { DateSegment, DateWheel, fieldOrder, type DateParts } from '../../ui/DateWheel';
import { tokens } from '../../theme/tokens';
import { useAppColor } from '../../theme/useAppColor';
import type { Birthday } from '../../lib/client';
export function BirthdayField({ value, includeYear, onChange }: { value: (Birthday & { year: number | null }) | null; includeYear: boolean; onChange: (value: Birthday & { year: number | null }) => void }) {
  const { t, i18n } = useTranslation(); const color = useAppColor(); const currentYear = new Date().getFullYear();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<DateParts>({ year: value?.year ?? 2000, month: value?.month ?? 1, day: value?.day ?? 1 });
  const valid = new Date(Date.UTC(includeYear ? draft.year : 2000, draft.month - 1, draft.day)).getUTCMonth() === draft.month - 1;
  const fields = fieldOrder(i18n.language).filter((field) => field !== 'year' || (includeYear && value?.year != null));
  return <><Pressable accessibilityRole="button" accessibilityLabel={t('start.profile.birthday')} onPress={() => { setDraft({ year: value?.year ?? 2000, month: value?.month ?? 1, day: value?.day ?? 1 }); setOpen(true); }}
    style={value ? { flexDirection: 'row', gap: tokens.spacing[1] } : { minHeight: 52, borderWidth: 2, borderColor: color.border, borderRadius: 16, backgroundColor: color.surface, justifyContent: 'center', paddingHorizontal: 16 }}>
    {value ? fields.map((field) => <DateSegment key={field} field={field} value={value[field]!} />) : <AppText>{t('set.me.birthday.none')}</AppText>}
  </Pressable>
    <BottomSheet visible={open} title={t('start.profile.birthday')} onClose={() => setOpen(false)}><DateWheel value={draft} onChange={setDraft} maxYear={currentYear} minYear={1900} includeYear={includeYear} /><Button label={t('common.done')} disabled={!valid} onPress={() => { onChange({ month: draft.month, day: draft.day, year: includeYear ? draft.year : null }); setOpen(false); }} /></BottomSheet>
  </>;
}
