import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { EmailCodeScreen } from '../../features/auth/EmailCodeScreen';
import { authOptions } from '../../config/auth';
import { useApp } from '../../lib/AppContext';
/** Development-only test login; production builds redirect to the OAuth screen. */
export default function EmailCodeRoute() {
  const { auth } = useApp();
  const { email } = useLocalSearchParams<{ email: string }>();
  if (!authOptions.devEmail) return <Redirect href="/login" />;
  return <EmailCodeScreen auth={auth} email={email ?? ''} onDone={() => router.replace('/')} />;
}
