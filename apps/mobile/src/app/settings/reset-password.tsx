import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { authOptions } from '../../config/auth';
import { ResetScreen } from '../../features/auth/ResetScreens';
import { useApp } from '../../lib/AppContext';
export default function ResetPasswordRoute() {
  const { password } = useApp();
  const { email } = useLocalSearchParams<{ email?: string }>();
  if (!authOptions.devEmail) return <Redirect href="/settings/security" />;
  return <ResetScreen password={password} initialEmail={email ?? ''} onBack={() => router.back()} />;
}
