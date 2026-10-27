import { router, useLocalSearchParams } from 'expo-router';
import { EmailCodeScreen } from '../../features/auth/EmailCodeScreen';
import { useApp } from '../../lib/AppContext';
export default function EmailCodeRoute() {
  const { auth } = useApp();
  const { email } = useLocalSearchParams<{ email: string }>();
  return <EmailCodeScreen auth={auth} email={email ?? ''} onDone={() => router.replace('/')} />;
}
