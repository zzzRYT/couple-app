import { router, useLocalSearchParams } from 'expo-router';
import { ResetScreen } from '../../features/auth/ResetScreens';
import { useApp } from '../../lib/AppContext';
export default function ResetPasswordRoute() {
  const { password } = useApp();
  const { email } = useLocalSearchParams<{ email?: string }>();
  return <ResetScreen password={password} initialEmail={email ?? ''} onBack={() => router.back()} />;
}
