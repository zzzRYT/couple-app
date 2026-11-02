import { router } from 'expo-router';
import { getCalendars } from 'expo-localization';
import { V0DateScreen } from '../../features/onboarding/V0DateScreen';
import { useCreateFlow } from '../../features/onboarding/CreateFlowContext';
import { useNow } from '../../lib/useNow';
export default function CreateSpaceRoute() {
  const { date, setDate } = useCreateFlow();
  const timeZone = getCalendars()[0]?.timeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
  return <V0DateScreen initial={date} now={useNow()} timeZone={timeZone} onBack={() => router.dismissTo('/choose-space')} onNext={(next) => { setDate(next); router.push('/profile'); }} />;
}
