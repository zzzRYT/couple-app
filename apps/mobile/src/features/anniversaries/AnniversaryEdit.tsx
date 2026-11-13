import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';
import { randomUUID } from 'expo-crypto';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { AnniversaryFields, CustomAnniversary } from '../../lib/client';
import { ApiError } from '../../lib/errors';
import { nextCustomDate } from '../../lib/anniversaries';
import { ANNIVERSARY_PRESETS, nextPresetDate, presetAdded, presetOf, presetTitle, type AnniversaryPreset } from '../../lib/anniversaryPresets';
import { parseCalendarDate } from '../../lib/dday';
import { useType } from '../../theme/typography';
import { useAppColor } from '../../theme/useAppColor';
import { AppText, TextField, Toast } from '../../ui/components';
import { fromIsoDate, toIsoDate } from '../../ui/DateWheel';
import { Icon } from '../../ui/Icon';
import { useLargeText } from '../../ui/textScale';
import { AnniversaryDateField } from './AnniversaryDateField';
import { DeleteAction } from './DeleteAction';
import { formattedDate, formattedMonthDay, relativeDate } from './format';

type Form = AnniversaryFields & { notify: 'default' | 'off'; presetId: string | null };
const OPTIONAL_PRESETS = ANNIVERSARY_PRESETS.filter((preset) => !preset.builtIn);
function length(value: string): number {
  const Segmenter = (Intl as unknown as { Segmenter?: new (locale?: string, options?: { granularity: 'grapheme' }) => { segment: (input: string) => Iterable<unknown> } }).Segmenter;
  return Segmenter ? Array.from(new Segmenter(undefined, { granularity: 'grapheme' }).segment(value)).length : Array.from(value).length;
}
export function AnniversaryEdit({ initial, customs, today, partner, offline, initialNotify, notifyDefault, save, remove, reload, onClose, onGone, onSaved }: {
  initial?: CustomAnniversary; customs: readonly CustomAnniversary[]; today: string; partner: string | null; offline: boolean; initialNotify: 'default' | 'off'; notifyDefault: string;
  save: (fields: AnniversaryFields & { presetId?: string }, version: number | undefined, key: string, notify: Form['notify']) => Promise<void>;
  remove: (version: number, key: string) => Promise<void>; reload: () => Promise<CustomAnniversary | undefined>; onClose: () => void; onGone: () => void; onSaved: (toast: 'saved' | 'deleted') => void;
}) {
  const { t, i18n } = useTranslation(); const { emphasis } = useType(); const color = useAppColor(); const insets = useSafeAreaInsets(); const large = useLargeText();
  const name = partner ?? t('home.pending.partner');
  const defaults = (item?: CustomAnniversary, notify: Form['notify'] = initialNotify): Form => ({ title: item ? presetTitle(item, t) : '', date: item?.date ?? today, repeat: item?.repeat ?? 'yearly', memo: item?.memo ?? '', notify, presetId: null });
  const [form, setForm] = useState<Form>(() => defaults(initial)); const [baseline, setBaseline] = useState<Form>(() => defaults(initial)); const [version, setVersion] = useState(initial?.version); const [saving, setSaving] = useState(false); const [error, setError] = useState<'save' | 'delete' | null>(null); const [titleTouched, setTitleTouched] = useState(false); const key = useRef(randomUUID()); const source = useRef(initial);
  const hideError = useCallback(() => setError(null), []);
  useEffect(() => { setForm((f) => ({ ...f, notify: initialNotify })); setBaseline((f) => ({ ...f, notify: initialNotify })); }, [initialNotify]);
  const titleLength = length(form.title.trim()), memoLength = length(form.memo ?? ''); const valid = !!form.title.trim() && titleLength <= 20 && memoLength <= 100 && parseCalendarDate(form.date) !== null;
  const dirty = JSON.stringify(form) !== JSON.stringify(baseline);
  const close = () => dirty ? Alert.alert(t('edit.discard.title'), '', [{ text: t('edit.discard.cta'), style: 'destructive', onPress: onClose }, { text: t('edit.discard.keep'), isPreferred: true }]) : onClose();
  const errorFlow = (action: 'save' | 'delete') => async (err: unknown) => {
    if (err instanceof ApiError && err.code === 'VERSION_CONFLICT') {
      let latest: CustomAnniversary | undefined;
      try { latest = await reload(); } catch { setError(action); return; }
      if (latest) { source.current = latest; const next = defaults(latest, form.notify); setForm(next); setBaseline(next); setVersion(latest.version); key.current = randomUUID(); Alert.alert(t('edit.conflict.title', { name }), t('edit.conflict.body'), [{ text: t('common.ok') }]); return; }
      Alert.alert(t('edit.gone.title'), t('edit.gone.body', { name }), [{ text: t('common.ok'), onPress: onGone }]); return;
    }
    if (err instanceof ApiError && err.code === 'NOT_FOUND' && err.details.gone === true) { Alert.alert(t('edit.gone.title'), t('edit.gone.body', { name }), [{ text: t('common.ok'), onPress: onGone }]); return; }
    setError(action);
  };
  const submit = async () => {
    if (!valid || offline || saving) return;
    setSaving(true); setError(null);
    const preset = presetOf(form.presetId), title = form.title.trim();
    // A preset keeps its canonical Korean title so each reader sees it in their own language; an unchanged preset row keeps what it stored.
    const fields = { title: preset && title === t(`anniv.preset.${preset.id}`) ? preset.ko : source.current && title === presetTitle(source.current, t) ? source.current.title : title, memo: form.memo || null, date: form.date, repeat: form.repeat, ...(preset ? { presetId: preset.id } : {}) };
    try { await save(fields, version, key.current, form.notify); onSaved('saved'); } catch (err) { await errorFlow('save')(err); } finally { setSaving(false); }
  };
  const deleteItem = () => Alert.alert(t('edit.delete.title'), partner ? t('edit.delete.body', { name: partner }) : t('edit.delete.body.unpaired'), [{ text: t('common.cancel'), style: 'cancel' }, { text: t('common.delete'), style: 'destructive', onPress: () => { if (!version) return; void remove(version, randomUUID()).then(() => onSaved('deleted')).catch(errorFlow('delete')); } }]);
  const next = nextCustomDate(form, today);
  const ready = valid && !offline;
  const choose = <T extends string>(field: 'repeat' | 'notify', selected: T, values: readonly T[], labels: string[]) => <View style={{ flexDirection: 'row', gap: 4, backgroundColor: color.surface2, padding: 3, borderRadius: 13 }}>{values.map((value, index) => <Pressable key={value} accessibilityRole="button" accessibilityState={{ selected: selected === value }} onPress={() => setForm({ ...form, [field]: value })} style={{ flex: 1, minHeight: 42, justifyContent: 'center', alignItems: 'center', backgroundColor: selected === value ? color.surface : 'transparent', borderWidth: selected === value ? 1.5 : 0, borderColor: color.line, borderRadius: 10 }}><AppText align="center" tone={selected === value ? 'text' : 'text2'} style={selected === value ? emphasis(15) : { fontSize: 15, lineHeight: 23 }}>{labels[index]}</AppText></Pressable>)}</View>;
  const label = (field: string) => <AppText style={emphasis(14)}>{t(field)}</AppText>;
  const counter = (n: number, max: number, over: boolean) => <AppText tone={over ? 'danger' : 'text2'} style={{ fontSize: 13, lineHeight: 20 }}>{t('edit.counter', { n, max })}</AppText>;
  const cancel = <Pressable onPress={close} accessibilityRole="button" style={{ minHeight: 48, justifyContent: 'center' }}><AppText>{t('common.cancel')}</AppText></Pressable>;
  const saveButton = <Pressable disabled={!ready || saving} onPress={() => void submit()} style={{ minHeight: 48, justifyContent: 'center', opacity: ready ? 1 : 0.6 }} accessibilityRole="button" accessibilityState={{ disabled: !ready || saving }}><AppText tone={ready ? 'primary' : 'text2'} style={emphasis(16)}>{t('common.save')}</AppText></Pressable>;
  const heading = t(initial ? 'edit.edit.title' : 'edit.new.title');
  const titlesOf = (preset: AnniversaryPreset) => (['ko-KR', 'en-US', 'ja-JP'] as const).map((locale) => i18n.getFixedT(locale)(`anniv.preset.${preset.id}`));
  const pick = (preset: AnniversaryPreset) => { if (form.presetId !== preset.id) setForm({ ...form, title: t(`anniv.preset.${preset.id}`), date: nextPresetDate(preset, today), repeat: 'yearly', presetId: preset.id }); };
  const chip = (preset: AnniversaryPreset) => {
    const added = presetAdded(preset, customs, titlesOf), selected = !added && form.presetId === preset.id;
    return <Pressable key={preset.id} accessibilityRole="button" accessibilityState={added ? { disabled: true } : { selected }} disabled={added} onPress={() => pick(preset)} style={{ minHeight: 48, justifyContent: 'center', paddingHorizontal: 14, paddingVertical: 5, borderRadius: 999, backgroundColor: added ? color.surface2 : color.surface, borderWidth: selected ? 2 : 1.5, borderStyle: added ? 'dashed' : 'solid', borderColor: selected ? color.primary : color.border }}><AppText tone={added ? 'text2' : 'text'} style={emphasis(14)}>{t(`anniv.preset.${preset.id}`)}</AppText><View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>{added && <Icon name="check" size={13} color={color.text2} />}<AppText tone="text2" style={{ fontSize: 13, lineHeight: 20 }}>{added ? t('edit.presets.added') : `${formattedMonthDay(nextPresetDate(preset, today), i18n.language)}${preset.region ? ` · ${t(`anniv.preset.region.${preset.region}`)}` : ''}`}</AppText></View></Pressable>;
  };
  return <View style={{ flex: 1, backgroundColor: color.bg, paddingTop: insets.top }}><View style={{ minHeight: 48, paddingHorizontal: 20 }}>{large ? <><View style={{ minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>{cancel}{saveButton}</View><AppText style={[emphasis(17), { paddingBottom: 8 }]}>{heading}</AppText></> : <View style={{ minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>{cancel}<AppText style={emphasis(17)}>{heading}</AppText>{saveButton}</View>}</View>
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 40, gap: 14 }}>
      {!initial && <View style={{ gap: 6 }}>{label('edit.presets.title')}<ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" style={{ marginHorizontal: -20 }} contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}>{OPTIONAL_PRESETS.map(chip)}</ScrollView></View>}
      <View style={{ gap: 6 }}><View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>{label('edit.field.title')}{counter(titleLength, 20, titleLength > 20 || (titleTouched && !form.title.trim()))}</View><TextField hideLabel label={t('edit.field.title')} placeholder={t('edit.field.title.ph')} value={form.title} onChangeText={(title) => setForm({ ...form, title, presetId: title === form.title ? form.presetId : null })} onBlur={() => setTitleTouched(true)} error={titleLength > 20 ? t('edit.err.title.long') : titleTouched && !form.title.trim() ? t('edit.err.title.empty') : undefined} /></View>
      <View style={{ gap: 6 }}>{label('edit.field.date')}<AnniversaryDateField value={fromIsoDate(form.date)} onChange={(date) => setForm({ ...form, date: toIsoDate(date), presetId: toIsoDate(date) === form.date ? form.presetId : null })} maxYear={Number(today.slice(0, 4)) + 80} minYear={1900} /></View>
      <View style={{ gap: 6 }}>{label('edit.field.repeat')}{choose('repeat', form.repeat, ['yearly', 'once'], [t('anniv.repeat.yearly'), t('anniv.repeat.once')])}
        <View style={{ alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 11, paddingVertical: 4, borderRadius: 999, borderWidth: 1.5, borderColor: next ? color.info : color.text2, backgroundColor: next ? color.infoBg : color.surface2 }}><Icon name={next ? 'annivCalendar' : 'info'} size={15} color={next ? color.info : color.text2} /><AppText style={[emphasis(13), { color: next ? color.info : color.text2, flexShrink: 1 }]}>{next ? t('edit.preview.next', { date: formattedDate(next, i18n.language, false), left: relativeDate(next, today, t) }) : t('edit.preview.past')}</AppText></View></View>
      <View style={{ gap: 6 }}><View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>{label('edit.field.memo')}{counter(memoLength, 100, memoLength > 100)}</View><TextField hideLabel multiline style={{ minHeight: 64, textAlignVertical: 'top' }} label={t('edit.field.memo')} placeholder={t('edit.field.memo.ph')} value={form.memo ?? ''} onChangeText={(memo) => setForm({ ...form, memo })} error={memoLength > 100 ? t('edit.err.memo.long') : undefined} /></View>
      <View style={{ gap: 6 }}>{label('edit.field.notify')}{choose('notify', form.notify, ['default', 'off'], [notifyDefault, t('anniv.notify.off')])}</View>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}><Icon name="info" size={18} color={color.info} /><AppText tone="text2" variant="bodySm" style={{ flex: 1 }}>{partner ? t('edit.shared.hint', { name: partner }) : t('edit.shared.hint.unpaired')}</AppText></View>
    </ScrollView>{initial && <View style={{ paddingBottom: insets.bottom }}><DeleteAction label={t('edit.delete')} disabled={offline} onPress={deleteItem} /></View>}{error && <View style={{ position: 'absolute', left: 20, right: 20, bottom: 110 }}><Toast text={t(`edit.${error}.err`)} icon="warn" onHide={hideError} /></View>}</View>;
}
