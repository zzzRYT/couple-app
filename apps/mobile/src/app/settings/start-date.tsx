import { useState } from 'react';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { AppText, Banner, Button, Screen } from '../../ui/components';
import { DateField, fromIsoDate, toIsoDate } from '../../ui/DateWheel';
import { dayCount, formatAnniversary, todayIn } from '../../lib/dday';
import { useNow } from '../../lib/useNow';
import { useApp } from '../../lib/AppContext';
import { useSpace } from '../../features/space/SpaceContext';
import { ApiError } from '../../lib/errors';
export default function StartDateRoute() {
  const { t, i18n } = useTranslation(); const { client } = useApp(); const { state, refresh } = useSpace(); const now = useNow(); const snapshot = state.snapshot;
  const [date, setDate] = useState(() => fromIsoDate(snapshot?.space.anniversaryDate ?? todayIn(now, 'UTC'))); const [error, setError] = useState(false);
  if (!snapshot) return null;
  const { space } = snapshot; const value = toIsoDate(date); const check = dayCount(value, now, space.timeZone);
  const save = () => Alert.alert(t('set.start.confirm.title'), t('set.start.confirm.body', { old: formatAnniversary(space.anniversaryDate, i18n.language), new: formatAnniversary(value, i18n.language), name: snapshot.members.find((m) => m.userId !== snapshot.me.userId)?.displayName ?? t('home.pending.partner') }), [
    { text: t('common.cancel'), style: 'cancel' }, { text: t('set.start.confirm.cta'), onPress: () => { void client.updateAnniversary(space.spaceId, value, space.updatedAt).then(async () => { await refresh(); router.back(); }).catch(async (err: unknown) => { await refresh(); if (err instanceof ApiError && err.code === 'VERSION_CONFLICT') setDate(fromIsoDate((await client.snapshot(space.spaceId)).space.anniversaryDate)); setError(true); }); } },
  ]);
  return <Screen onBack={() => router.back()} footer={<Button label={t('common.save')} disabled={!check.ok || state.offline} onPress={save} />}><AppText variant="title">{t('set.start.title')}</AppText><DateField value={date} onChange={setDate} maxYear={Number(todayIn(now, space.timeZone).slice(0, 4))} error={!check.ok} />{check.ok ? <AppText>{t('set.start.preview', { n: check.dayCount })}</AppText> : <AppText tone="danger">{t('start.date.err.future')}</AppText>}{error && <Banner kind="danger" text={t('state.error.title')} />}</Screen>;
}
