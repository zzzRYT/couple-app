import { router } from 'expo-router';
import { SignupScreen } from '../../features/auth/SignupScreen';
import { useApp } from '../../lib/AppContext';
export default function SignupRoute() {
  const { auth, password } = useApp();
  return <SignupScreen password={password} onBack={() => router.back()} onApple={() => void auth.apple()} />;
}
