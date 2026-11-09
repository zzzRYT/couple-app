import { useState } from 'react';
import { Switch, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppText, Banner, Button, Screen, SwitchRow, TextField } from '../../ui/components';
import { InlineError } from '../../ui/InlineNote';
import { useAppColor } from '../../theme/useAppColor';
import { useType } from '../../theme/typography';
import type { Birthday } from '../../lib/client';
import { BirthdayField } from './BirthdayField';

type ProfileBirthday = Birthday & { year: number | null };
function graphemes(value: string): string[] {
  const Segmenter = (Intl as unknown as { Segmenter?: new (locale?: string, options?: { granularity: 'grapheme' }) => { segment: (value: string) => Iterable<{ segment: string }> } }).Segmenter;
  return Segmenter ? Array.from(new Segmenter(undefined, { granularity: 'grapheme' }).segment(value), (part) => part.segment) : Array.from(value);
}
/** V0-start-profile, and V0-set-me with `editing`: the settings frame has a nav bar with 저장 and the settings labels. Offline, 저장 waits. */
export function ProfileScreen({ onSave, onBack, initialName = '', initialBirthday = null, editing = false, offline = false, partnerWait }: { onSave: (name: string, birthday: ProfileBirthday | null) => Promise<void>; onBack?: () => void; initialName?: string; initialBirthday?: ProfileBirthday | null; editing?: boolean; offline?: boolean; partnerWait?: string }) {
  const { t } = useTranslation(); const color = useAppColor(); const { emphasis } = useType();
  const [name, setName] = useState(initialName);
  const [birthday, setBirthday] = useState<ProfileBirthday | null>(initialBirthday);
  const [includeYear, setIncludeYear] = useState(initialBirthday?.year != null);
  const [touched, setTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);
  const empty = !name.trim();
  // V0-start-profile-err: 다음 waits for a name from the start; the red state appears once the field has been used.
  const invalid = empty && touched;
  const submit = async (skip: boolean) => {
    const clean = name.trim();
    if (!clean) { setTouched(true); return; }
    const selected = skip ? null : birthday;
    setSaving(true); setFailed(false);
    try { await onSave(clean, selected); } catch { setFailed(true); } finally { setSaving(false); }
  };
  const nameLabel = t(editing ? 'set.me.name' : 'start.profile.name');
  const toggleYear = (value: boolean) => { setIncludeYear(value); if (!value && birthday) setBirthday({ ...birthday, year: null }); };
  return <Screen onBack={onBack} title={editing ? t('set.me.edit.title') : undefined} trailing={editing ? { label: t('common.save'), loading: saving, disabled: empty || offline, onPress: () => void submit(false) } : undefined}
    footer={editing ? undefined : <><Button label={t('common.next')} loading={saving} disabled={empty} onPress={() => void submit(false)} /><Button variant="ghost" label={t('start.profile.skip')} disabled={saving} onPress={() => void submit(true)} /></>}>
    {!editing && <AppText variant="title">{t('start.profile.title')}</AppText>}
    <View style={{ gap: 6 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}><AppText style={[emphasis(14), { flexShrink: 1 }]}>{nameLabel}</AppText><AppText variant="caption" tone={invalid ? 'danger' : 'text2'}>{t('edit.counter', { n: graphemes(name).length, max: 10 })}</AppText></View>
      <TextField hideLabel label={nameLabel} placeholder={editing ? undefined : t('start.profile.name.ph')} value={name} onChangeText={(value) => { setName(graphemes(value).slice(0, 10).join('')); setTouched(true); }} style={invalid ? { borderColor: color.danger } : undefined} />
      {invalid && <InlineError text={t('start.profile.err.name')} />}
    </View>
    <AppText style={emphasis(14)}>{t(editing ? 'set.me.birthday' : 'start.profile.birthday')}</AppText>
    <BirthdayField value={birthday} includeYear={includeYear} onChange={setBirthday} />
    {editing
      ? <SwitchRow label={t('start.profile.year')} value={includeYear} onValueChange={toggleYear} />
      : <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}><AppText>{t('start.profile.year')}</AppText><Switch accessibilityLabel={t('start.profile.year')} value={includeYear} onValueChange={toggleYear} /></View>}
    <AppText tone="text2" variant="bodySm">{t('start.profile.birthdayHint')}</AppText>
    {partnerWait && <Banner kind="warn" band icon="annivBirthday" text={partnerWait} />}
    {failed && <InlineError text={t('edit.save.err')} />}
  </Screen>;
}
