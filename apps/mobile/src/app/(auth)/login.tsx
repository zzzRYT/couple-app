import { router, useLocalSearchParams } from 'expo-router';
import { LoginScreen } from '../../features/auth/LoginScreen';
import { useApp } from '../../lib/AppContext';
export default function LoginRoute() {
  const { auth } = useApp();
  const { lastUsed } = useLocalSearchParams<{ lastUsed?: 'kakao' | 'apple' | 'email' }>();
  return <LoginScreen auth={auth} lastUsed={lastUsed} onDone={() => router.replace('/')} onEmail={(email) => router.push({ pathname: '/email-code', params: { email } })} onBack={router.canGoBack() ? () => router.back() : undefined} />;
}
