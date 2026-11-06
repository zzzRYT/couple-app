import { router } from 'expo-router';
import { EmailLoginScreen } from '../../features/auth/EmailLoginScreen';
import { useApp } from '../../lib/AppContext';
export default function EmailLoginRoute() {
  const { auth, password } = useApp();
  return <EmailLoginScreen password={password} onDone={() => {}} onBack={() => router.back()} onApple={() => void auth.apple()} onSignup={() => router.push('/signup')} onForgot={(email) => router.push({ pathname: '/reset', params: { email } })} />;
}
