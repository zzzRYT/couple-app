import { router } from 'expo-router';
import { usePassword } from '../../features/auth/PasswordContext';
import { ChangePasswordScreen } from '../../features/settings/ChangePasswordScreen';
import { useApp } from '../../lib/AppContext';
/** Back on Security with a fresh value each time: the toast after saving, or the V0-sec-forgot sheet for an Apple account. */
export default function ChangePasswordRoute() {
  const { password } = useApp();
  const { state, apple } = usePassword();
  const backToSecurity = (param: 'saved' | 'forgot') => router.dismissTo({ pathname: '/settings/security', params: { [param]: String(Date.now()) } });
  return <ChangePasswordScreen password={password} email={state?.email ?? ''} apple={apple} onBack={() => router.back()} onSaved={() => backToSecurity('saved')}
    onForgot={() => { if (apple) backToSecurity('forgot'); else router.push({ pathname: '/settings/reset-password', params: { email: state?.email ?? '' } }); }} />;
}
