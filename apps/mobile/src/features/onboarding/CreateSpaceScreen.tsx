import { useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppText, Banner, Button, Screen } from '../../ui/components';
import { LoadingScreen } from '../../ui/CycleLoader';
import { DateField, fromIsoDate, toIsoDate } from '../../ui/DateWheel';
import { Spot } from '../../ui/Spot';
import { dayCount, todayIn } from '../../lib/dday';
import { ApiError } from '../../lib/errors';
import { tokens } from '../../theme/tokens';
import { useType } from '../../theme/typography';

type State = { kind: 'edit'; problem: null | 'future' | 'invalid' } | { kind: 'creating' } | { kind: 'created'; spaceId: string } | { kind: 'hasSpace' } | { kind: 'error' };
/** S03: anniversary entry. The room time zone starts as the creator's IANA zone. */
export function CreateSpaceScreen({ createSpace, now, timeZone, onCreated, onOpenSpace, onBack }: {
  createSpace: (date: string, timeZone: string) => Promise<{ spaceId: string }>; now: string; timeZone: string; onCreated: (spaceId: string) => void; onOpenSpace: () => void; onBack?: () => void;
}) {
  const { t } = useTranslation();
  const { emphasis } = useType();
  const today = todayIn(now, timeZone);
  const [date, setDate] = useState(fromIsoDate(today));
  const [state, setState] = useState<State>({ kind: 'edit', problem: null });
  async function submit() {
    const iso = toIsoDate(date);
    const check = dayCount(iso, now, timeZone);
    if (!check.ok) { setState({ kind: 'edit', problem: check.code === 'FUTURE_DATE' ? 'future' : 'invalid' }); return; }
    setState({ kind: 'creating' });
    try {
      const { spaceId } = await createSpace(iso, timeZone);
      setState({ kind: 'created', spaceId });
    } catch (error) {
      setState(error instanceof ApiError && error.code === 'ALREADY_IN_SPACE' ? { kind: 'hasSpace' } : { kind: 'error' });
    }
  }
  if (state.kind === 'creating') return <LoadingScreen label={t('space.creating')} />;
  if (state.kind === 'created') {
    return (
      <Screen center footer={<Button label={t('space.ok.next')} onPress={() => onCreated(state.spaceId)} />}>
        <Spot kind="celebrate" />
        <AppText variant="title" accessibilityRole="header" align="center">{t('space.ok.title')}</AppText>
        <AppText tone="text2" align="center">{t('space.ok.body')}</AppText>
      </Screen>
    );
  }
  const problem = state.kind === 'edit' ? state.problem : null;
  return (
    <Screen onBack={onBack} footer={<Button label={t('space.create')} onPress={() => void submit()} />}>
      <AppText variant="title" accessibilityRole="header">{t('space.title')}</AppText>
      <AppText tone="text2">{t('space.body')}</AppText>
      <View style={{ gap: tokens.spacing[1] }}>
        <AppText style={emphasis(14)}>{t('space.date.label')}</AppText>
        <DateField value={date} maxYear={Number(today.slice(0, 4))} error={!!problem} onChange={(next) => { setDate(next); setState({ kind: 'edit', problem: null }); }} />
        {problem ? <AppText variant="bodySm" tone="danger">{t(problem === 'future' ? 'space.date.future' : 'space.date.invalid')}</AppText> : <AppText variant="caption" tone="text2">{t('space.date.hint')}</AppText>}
      </View>
      <Banner kind="info" icon="globe" quiet text={t('space.tz.note', { tz: timeZone })} />
      {state.kind === 'hasSpace' && <Banner kind="warn" text={t('join.hasSpace.title')} body={t('join.hasSpace.body')} action={{ label: t('join.hasSpace.action'), onPress: onOpenSpace }} />}
      {state.kind === 'error' && <Banner kind="danger" text={t('space.err.title')} body={t('space.err.body')} />}
    </Screen>
  );
}
