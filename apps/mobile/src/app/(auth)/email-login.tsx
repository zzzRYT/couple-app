import { Redirect, router } from 'expo-router';
import { authOptions } from '../../config/auth';
import { EmailLoginScreen } from '../../features/auth/EmailLoginScreen';
import { useApp } from '../../lib/AppContext';
export default function EmailLoginRoute() {
  const { auth, password } = useApp();
  if (!authOptions.devEmail) return <Redirect href="/login" />;
  return <EmailLoginScreen password={password} onDone={() => {}} onBack={() => router.back()} onApple={() => void auth.apple()} onSignup={() => router.push('/signup')} onForgot={(email) => router.push({ pathname: '/reset', params: { email } })} />;
}
