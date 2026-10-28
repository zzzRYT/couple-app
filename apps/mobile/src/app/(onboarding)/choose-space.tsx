import { router } from 'expo-router';
import { SpaceChoiceScreen } from '../../features/onboarding/SpaceChoiceScreen';

export default function SpaceChoiceRoute() {
  return <SpaceChoiceScreen onCreate={() => router.push('/create-space')} onJoin={() => router.push('/join')} />;
}
