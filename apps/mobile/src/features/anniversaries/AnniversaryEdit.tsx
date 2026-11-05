import { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';
import { randomUUID } from 'expo-crypto';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { AnniversaryFields, CustomAnniversary } from '../../lib/client';
import { ApiError } from '../../lib/errors';
import { computeAnniversaries } from '../../lib/anniversaries';
import { parseCalendarDate } from '../../lib/dday';
import { useAppColor } from '../../theme/useAppColor';
import { AppText, TextField } from '../../ui/components';
import { fromIsoDate, toIsoDate } from '../../ui/DateWheel';
import { Icon } from '../../ui/Icon';
import { AnniversaryDateField } from './AnniversaryDateField';
import { AnniversaryToast } from './AnniversaryToast';
import { formattedDate, relativeDate } from './format';

type Form = AnniversaryFields & { notify: 'default' | 'off' };
function length(value: string): number {
  const Segmenter = (Intl as unknown as { Segmenter?: new (locale?: string, options?: { granularity: 'grapheme' }) => { segment: (input: string) => Iterable<unknown> } }).Segmenter;
  return Segmenter ? Array.from(new Segmenter(undefined, { granularity: 'grapheme' }).segment(value)).length : Array.from(value).length;
}
export function AnniversaryEdit({ initial, today, partner, offline, initialNotify, notifyDefault, save, remove, reload, onClose, onSaved }: {
  initial?: CustomAnniversary; today: string; partner: string; offline: boolean; initialNotify: 'default' | 'off'; notifyDefault: string;
  save: (fields: AnniversaryFields, version: number | undefined, key: string, notify: Form['notify']) => Promise<void>;
  remove: (version: number, key: string) => Promise<void>; reload: () => Promise<CustomAnniversary | undefined>; onClose: () => void; onSaved: (toast: 'saved' | 'deleted') => void;
}) {
  const { t, i18n } = useTranslation(); const color = useAppColor(); const insets = useSafeAreaInsets();
  const defaults = (item?: CustomAnniversary, notify: Form['notify'] = initialNotify): Form => ({ title: item?.title ?? '', date: item?.date ?? today, repeat: item?.repeat ?? 'yearly', memo: item?.memo ?? '', notify });
  const [form, setForm] = useState<Form>(() => defaults(initial)); const [baseline, setBaseline] = useState<Form>(() => defaults(initial)); const [version, setVersion] = useState(initial?.version); const [saving, setSaving] = useState(false); const [error, setError] = useState(false); const [titleTouched, setTitleTouched] = useState(false); const key = useRef(randomUUID());
  useEffect(() => { setForm((f) => ({ ...f, notify: initialNotify })); setBaseline((f) => ({ ...f, notify: initialNotify })); }, [initialNotify]);
  const titleLength = length(form.title), memoLength = length(form.memo ?? ''); const valid = !!form.title.trim() && titleLength <= 20 && memoLength <= 100 && parseCalendarDate(form.date) !== null;
  const dirty = JSON.stringify(form) !== JSON.stringify(baseline);
  const close = () => dirty ? Alert.alert(t('edit.discard.title'), '', [{ text: t('edit.discard.cta'), style: 'destructive', onPress: onClose }, { text: t('edit.discard.keep'), style: 'cancel' }]) : onClose();
  const errorFlow = async (err: unknown) => {
    if (err instanceof ApiError && err.code === 'VERSION_CONFLICT') {
      let latest: CustomAnniversary | undefined;
      try { latest = await reload(); } catch { setError(true); return; }
      if (latest) { const next = defaults(latest, form.notify); setForm(next); setBaseline(next); setVersion(latest.version); key.current = randomUUID(); Alert.alert(t('edit.conflict.title', { name: partner }), t('edit.conflict.body')); return; }
      Alert.alert(t('edit.gone.title'), t('edit.gone.body', { name: partner }), [{ text: t('common.ok'), onPress: onClose }]); return;
    }
    if (err instanceof ApiError && err.code === 'NOT_FOUND' && err.details.gone === true) { Alert.alert(t('edit.gone.title'), t('edit.gone.body', { name: partner }), [{ text: t('common.ok'), onPress: onClose }]); return; }
    setError(true);
  };
  const submit = async () => {
    if (!valid || offline || saving) return;
    setSaving(true); setError(false);
    try { await save({ title: form.title.trim(), memo: form.memo || null, date: form.date, repeat: form.repeat }, version, key.current, form.notify); onSaved('saved'); } catch (err) { await errorFlow(err); } finally { setSaving(false); }
  };
  const deleteItem = () => Alert.alert(t('edit.delete.title'), t('edit.delete.body', { name: partner }), [{ text: t('common.cancel'), style: 'cancel' }, { text: t('common.delete'), style: 'destructive', onPress: () => { if (!version) return; void remove(version, randomUUID()).then(() => onSaved('deleted')).catch(errorFlow); } }]);
  const preview = computeAnniversaries({ startDate: '1900-01-01', timeZone: 'UTC', me: { birthday: null }, partner: null, customs: [{ id: 'preview', title: form.title, date: form.date, repeat: form.repeat }] }, `${today}T12:00:00Z`);
  const next = [...preview.todayItems, ...preview.upcoming].find((item) => item.customId === 'preview');
  const choose = <T extends string>(field: 'repeat' | 'notify', selected: T, values: readonly T[], labels: string[]) => <View style={{ flexDirection: 'row', gap: 4, backgroundColor: color.surface2, padding: 3, borderRadius: 13 }}>{values.map((value, index) => <Pressable key={value} accessibilityRole="button" accessibilityState={{ selected: selected === value }} onPress={() => setForm({ ...form, [field]: value })} style={{ flex: 1, minHeight: 42, justifyContent: 'center', alignItems: 'center', backgroundColor: selected === value ? color.surface : 'transparent', borderWidth: selected === value ? 1.5 : 0, borderColor: color.line, borderRadius: 10 }}><AppText align="center">{labels[index]}</AppText></Pressable>)}</View>;
  return <View style={{ flex: 1, backgroundColor: color.bg, paddingTop: insets.top }}><View style={{ minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20 }}><Pressable onPress={close} accessibilityRole="button"><AppText tone="primary">{t('common.cancel')}</AppText></Pressable><AppText style={{ fontWeight: '700' }}>{t(initial ? 'edit.edit.title' : 'edit.new.title')}</AppText><Pressable disabled={!valid || offline || saving} onPress={() => void submit()} accessibilityRole="button" accessibilityState={{ disabled: !valid || offline || saving }}><AppText tone={valid && !offline ? 'primary' : 'text2'}>{t('common.save')}</AppText></Pressable></View>
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 40, gap: 14 }}>
      <View><View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><AppText style={{ fontWeight: '700' }}>{t('edit.field.title')}</AppText><AppText tone={titleLength > 20 || (titleTouched && !form.title.trim()) ? 'danger' : 'text2'}>{t('edit.counter', { n: titleLength, max: 20 })}</AppText></View><TextField hideLabel label={t('edit.field.title')} placeholder={t('edit.field.title.ph')} value={form.title} onChangeText={(title) => setForm({ ...form, title })} onBlur={() => setTitleTouched(true)} error={titleLength > 20 ? t('edit.err.title.long') : titleTouched && !form.title.trim() ? t('edit.err.title.empty') : undefined} /></View>
      <AppText>{t('edit.field.date')}</AppText><AnniversaryDateField value={fromIsoDate(form.date)} onChange={(date) => setForm({ ...form, date: toIsoDate(date) })} maxYear={Number(today.slice(0, 4)) + 80} minYear={1900} />
      <AppText>{t('edit.field.repeat')}</AppText>{choose('repeat', form.repeat, ['yearly', 'once'], [t('anniv.repeat.yearly'), t('anniv.repeat.once')])}
      <View style={{ alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 11, paddingVertical: 4, borderRadius: 999, borderWidth: 1.5, borderColor: next ? color.info : color.text2, backgroundColor: next ? color.infoBg : color.surface2 }}><Icon name={next ? 'annivCalendar' : 'info'} size={15} color={next ? color.info : color.text2} /><AppText style={{ color: next ? color.info : color.text2, fontSize: 13, fontWeight: '700', flexShrink: 1 }}>{next ? t('edit.preview.next', { date: formattedDate(next.date, i18n.language, false), left: relativeDate(next.date, today, t) }) : t('edit.preview.past')}</AppText></View>
      <View><View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><AppText style={{ fontWeight: '700' }}>{t('edit.field.memo')}</AppText><AppText tone={memoLength > 100 ? 'danger' : 'text2'}>{t('edit.counter', { n: memoLength, max: 100 })}</AppText></View><TextField hideLabel multiline style={{ minHeight: 64, textAlignVertical: 'top' }} label={t('edit.field.memo')} placeholder={t('edit.field.memo.ph')} value={form.memo ?? ''} onChangeText={(memo) => setForm({ ...form, memo })} error={memoLength > 100 ? t('edit.err.memo.long') : undefined} /></View>
      <AppText>{t('edit.field.notify')}</AppText>{choose('notify', form.notify, ['default', 'off'], [notifyDefault, t('anniv.notify.off')])}
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}><Icon name="info" size={18} color={color.info} /><AppText tone="text2" variant="bodySm" style={{ flex: 1 }}>{t('edit.shared.hint', { name: partner })}</AppText></View>
    </ScrollView>{initial && <Pressable disabled={offline} onPress={deleteItem} accessibilityRole="button" style={{ minHeight: 48, paddingBottom: insets.bottom, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 }}><Icon name="trash" size={20} color={color.danger} /><AppText align="center" tone="danger">{t('edit.delete')}</AppText></Pressable>}{error && <View style={{ position: 'absolute', left: 20, right: 20, bottom: 110 }}><AnniversaryToast text={t('edit.save.err')} error onHide={() => setError(false)} /></View>}</View>;
}
