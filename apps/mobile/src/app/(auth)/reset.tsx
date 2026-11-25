import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { authOptions } from '../../config/auth';
import { ResetScreen } from '../../features/auth/ResetScreens';
import { useApp } from '../../lib/AppContext';
export default function ResetRoute() {
  const { auth, password } = useApp();
  const { email } = useLocalSearchParams<{ email?: string }>();
  if (!authOptions.devEmail) return <Redirect href="/login" />;
  return <ResetScreen password={password} initialEmail={email ?? ''} onBack={() => router.back()} onApple={() => void auth.apple()} />;
}
