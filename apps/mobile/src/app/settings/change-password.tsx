import { router } from 'expo-router';
import { usePassword } from '../../features/auth/PasswordContext';
import { ChangePasswordScreen } from '../../features/settings/ChangePasswordScreen';
import { useApp } from '../../lib/AppContext';
export default function ChangePasswordRoute() {
  const { password } = useApp();
  const { state, apple } = usePassword();
  return <ChangePasswordScreen password={password} email={state?.email ?? ''} apple={apple} onBack={() => router.back()} onSaved={() => router.dismissTo({ pathname: '/settings/security', params: { saved: '1' } })}
    onForgot={() => { if (apple) router.back(); else router.push({ pathname: '/settings/reset-password', params: { email: state?.email ?? '' } }); }} />;
}
