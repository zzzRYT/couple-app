import { useState } from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Banner, Button } from '../../ui/components';
import { CycleLoader } from '../../ui/CycleLoader';
import { DateWheel, fromIsoDate, toIsoDate } from '../../ui/DateWheel';
import { dayCount, todayIn } from '../../lib/dday';
import { ApiError } from '../../lib/errors';
import { tokens } from '../../theme/tokens';
const color = tokens.color.app.light.normal;
type State = { kind: 'edit'; problem: null | 'future' | 'invalid' } | { kind: 'creating' } | { kind: 'created'; spaceId: string } | { kind: 'hasSpace' } | { kind: 'error' };
/** S03: anniversary entry. The room time zone starts as the creator's IANA zone. */
export function CreateSpaceScreen({ createSpace, now, timeZone, onCreated, onOpenSpace }: {
  createSpace: (date: string, timeZone: string) => Promise<{ spaceId: string }>; now: string; timeZone: string; onCreated: (spaceId: string) => void; onOpenSpace: () => void;
}) {
  const { t } = useTranslation();
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
  if (state.kind === 'creating') return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: color.bg }}><CycleLoader label={t('space.creating')} /><Text style={{ color: color.text }}>{t('space.creating')}</Text></View>;
  if (state.kind === 'created') {
    return <View style={{ flex: 1, padding: 24, gap: 12, backgroundColor: color.bg }}>
      <Text accessibilityRole="header" style={{ color: color.text, fontSize: 20 }}>{t('space.ok.title')}</Text>
      <Text style={{ color: color.text2 }}>{t('space.ok.body')}</Text>
      <Button label={t('space.ok.next')} onPress={() => onCreated(state.spaceId)} />
    </View>;
  }
  return (
    <View style={{ flex: 1, padding: 24, gap: 12, backgroundColor: color.bg }}>
      <Text accessibilityRole="header" style={{ color: color.text, fontSize: 20 }}>{t('space.title')}</Text>
      <Text style={{ color: color.text2 }}>{t('space.body')}</Text>
      <Text style={{ color: color.text }}>{t('space.date.label')}</Text>
      <DateWheel value={date} maxYear={Number(today.slice(0, 4))} onChange={(next) => { setDate(next); setState({ kind: 'edit', problem: null }); }} />
      {state.kind === 'edit' && state.problem && <Banner kind="warn" text={t(state.problem === 'future' ? 'space.date.future' : 'space.date.invalid')} />}
      <Text style={{ color: color.text2 }}>{t('space.tz.note', { tz: timeZone })}</Text>
      {state.kind === 'hasSpace' && <View style={{ gap: 8 }}>
        <Banner kind="warn" text={t('join.hasSpace.title')} />
        <Text style={{ color: color.text2 }}>{t('join.hasSpace.body')}</Text>
        <Button label={t('join.hasSpace.action')} variant="secondary" onPress={onOpenSpace} />
      </View>}
      {state.kind === 'error' && <View style={{ gap: 4 }}><Banner kind="danger" text={t('space.err.title')} /><Text style={{ color: color.text2 }}>{t('space.err.body')}</Text></View>}
      <Button label={t('space.create')} onPress={() => void submit()} />
    </View>
  );
}
