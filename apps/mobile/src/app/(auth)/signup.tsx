import { Redirect, router } from 'expo-router';
import { authOptions } from '../../config/auth';
import { SignupScreen } from '../../features/auth/SignupScreen';
import { useApp } from '../../lib/AppContext';
export default function SignupRoute() {
  const { auth, password } = useApp();
  if (!authOptions.devEmail) return <Redirect href="/login" />;
  return <SignupScreen password={password} onBack={() => router.back()} onApple={() => void auth.apple()} />;
}
