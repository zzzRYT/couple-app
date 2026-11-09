import { router } from 'expo-router';
import { ConnectScreen } from '../../features/onboarding/ConnectScreen';

/** V0-connect: Settings › 상대 while nobody has joined yet (V0-10). */
export default function ConnectRoute() {
  return <ConnectScreen onBack={() => router.back()} onSend={() => router.push('/invite')} onEnter={() => router.push('/connect-code')} />;
}
