import { useState } from 'react';
import { Alert, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { AppText, Banner, Button, Chip, Screen } from '../../ui/components';
import { DateField, fromIsoDate, toIsoDate } from '../../ui/DateWheel';
import { InlineError, InlineHint } from '../../ui/InlineNote';
import { useType } from '../../theme/typography';
import { dayCount, todayIn } from '../../lib/dday';
import { useNow } from '../../lib/useNow';
import { useApp } from '../../lib/AppContext';
import { useSpace } from '../../features/space/SpaceContext';
import { ApiError } from '../../lib/errors';
/** V0-set-start: the change is spelled out under the date before saving, then confirmed once more (V0-set-start-confirm). */
export default function StartDateRoute() {
  const { t } = useTranslation(); const { emphasis } = useType(); const { client } = useApp(); const { state, refresh } = useSpace(); const now = useNow(); const snapshot = state.snapshot;
  const [date, setDate] = useState(() => fromIsoDate(snapshot?.space.anniversaryDate ?? todayIn(now, 'UTC'))); const [error, setError] = useState(false);
  if (!snapshot) return null;
  const { space } = snapshot; const value = toIsoDate(date); const check = dayCount(value, now, space.timeZone);
  const change = t('set.start.confirm.body', { old: space.anniversaryDate.replace(/-/g, '.'), new: value.replace(/-/g, '.'), name: snapshot.members.find((m) => m.userId !== snapshot.me.userId)?.displayName ?? t('home.pending.partner') });
  const save = () => Alert.alert(t('set.start.confirm.title'), change, [
    { text: t('common.cancel'), style: 'cancel' }, { text: t('set.start.confirm.cta'), isPreferred: true, onPress: () => { void client.updateAnniversary(space.spaceId, value, space.updatedAt).then(async () => { await refresh(); router.back(); }).catch(async (err: unknown) => { await refresh(); if (err instanceof ApiError && err.code === 'VERSION_CONFLICT') setDate(fromIsoDate((await client.snapshot(space.spaceId)).space.anniversaryDate)); setError(true); }); } },
  ]);
  return <Screen onBack={() => router.back()} title={t('set.start.title')} footer={<Button label={t('common.save')} disabled={!check.ok || state.offline} onPress={save} />}>
    <AppText tone="text2">{t('start.date.body')}</AppText>
    <View style={{ gap: 8 }}>
      <AppText style={emphasis(14)}>{t('set.us.start')}</AppText>
      <DateField value={date} onChange={setDate} maxYear={Number(todayIn(now, space.timeZone).slice(0, 4))} error={!check.ok} />
      {check.ok ? <Chip kind="info" icon="annivDays" label={t('set.start.preview', { n: check.dayCount })} /> : <InlineError text={t('start.date.err.future')} />}
    </View>
    {check.ok && value !== space.anniversaryDate && <InlineHint text={change} />}
    {error && <Banner kind="danger" text={t('set.save.err')} />}
  </Screen>;
}
