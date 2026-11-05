import { useState } from 'react';
import { Switch, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppText, Button, Screen, TextField } from '../../ui/components';
import type { Birthday } from '../../lib/client';
import { BirthdayField } from './BirthdayField';

type ProfileBirthday = Birthday & { year: number | null };
function graphemes(value: string): string[] {
  const Segmenter = (Intl as unknown as { Segmenter?: new (locale?: string, options?: { granularity: 'grapheme' }) => { segment: (value: string) => Iterable<{ segment: string }> } }).Segmenter;
  return Segmenter ? Array.from(new Segmenter(undefined, { granularity: 'grapheme' }).segment(value), (part) => part.segment) : Array.from(value);
}
export function ProfileScreen({ onSave, onBack, initialName = '', initialBirthday = null, editing = false, partnerWait }: { onSave: (name: string, birthday: ProfileBirthday | null) => Promise<void>; onBack?: () => void; initialName?: string; initialBirthday?: ProfileBirthday | null; editing?: boolean; partnerWait?: string }) {
  const { t } = useTranslation();
  const [name, setName] = useState(initialName);
  const [birthday, setBirthday] = useState<ProfileBirthday | null>(initialBirthday);
  const [includeYear, setIncludeYear] = useState(initialBirthday?.year != null);
  const [invalid, setInvalid] = useState(false);
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);
  const submit = async (skip: boolean) => {
    const clean = name.trim();
    if (!clean) { setInvalid(true); return; }
    const selected = skip ? null : birthday;
    setSaving(true); setFailed(false);
    try { await onSave(clean, selected); } catch { setFailed(true); } finally { setSaving(false); }
  };
  return <Screen onBack={onBack} footer={<><Button label={t(editing ? 'common.save' : 'common.next')} loading={saving} onPress={() => void submit(false)} />{!editing && <Button variant="ghost" label={t('start.profile.skip')} disabled={saving} onPress={() => void submit(true)} />}</>}>
    <AppText variant="title">{t(editing ? 'set.me.edit.title' : 'start.profile.title')}</AppText>
    <View><TextField label={t('start.profile.name')} placeholder={t('start.profile.name.ph')} value={name} onChangeText={(value) => { setName(graphemes(value).slice(0, 10).join('')); setInvalid(false); }} error={invalid ? t('start.profile.err.name') : undefined} /><AppText align="right" variant="caption">{graphemes(name).length}/10</AppText></View>
    <AppText>{t('start.profile.birthday')}</AppText>
    <BirthdayField value={birthday} includeYear={includeYear} onChange={setBirthday} />
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}><AppText>{t('start.profile.year')}</AppText><Switch accessibilityLabel={t('start.profile.year')} value={includeYear} onValueChange={(value) => { setIncludeYear(value); if (!value && birthday) setBirthday({ ...birthday, year: null }); }} /></View>
    <AppText tone="text2" variant="bodySm">{t('start.profile.birthdayHint')}</AppText>
    {partnerWait && <AppText tone="text2" variant="bodySm">{partnerWait}</AppText>}

    {failed && <AppText tone="danger">{t('state.error.title')}</AppText>}
  </Screen>;
}
