import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../lib/AppContext';
import { Screen, Button, Banner } from '../../ui/components';
import { useRouter } from 'expo-router';
import { useSpace } from '../../features/space/SpaceContext';
import { LoginScreen } from '../../features/auth/LoginScreen';
import { usePassword } from '../../features/auth/PasswordContext';
import { farewell, useAccountDeleted } from '../../features/account/deleteAccount';

export default function AuthIndex() {
  const { t } = useTranslation();
  const { sessionExpired, clearSessionExpired, auth, supabase } = useApp();
  const { reset } = useSpace();
  const router = useRouter();
  const deleted = useAccountDeleted();
  const { pendingReset, setPendingReset } = usePassword();
  useEffect(() => {
    if (pendingReset === null) return;
    setPendingReset(null);
    router.push({ pathname: '/reset', params: { email: pendingReset } });
  }, [pendingReset, setPendingReset, router]);
  // S13-delete-done: the sign-in screen with "Your account was deleted", even if a late 401 marked the session expired.
  if (deleted) {
    const moveOn = () => { farewell.set(false); clearSessionExpired(); };
    return <LoginScreen auth={auth} notice={t('acct.delete.done')} onDone={moveOn} onEmailLogin={() => { moveOn(); router.push('/email-login'); }} onEmail={(email) => { moveOn(); router.push({ pathname: '/email-code', params: { email } }); }} />;
  }
  if (!sessionExpired) return <LoginScreen auth={auth} quickLoginClient={supabase} onDone={() => {}} onEmailLogin={() => router.push('/email-login')} onEmail={(email) => router.push({ pathname: '/email-code', params: { email } })} />;
  return <Screen center footer={<Button label={t('sys.login.action')} onPress={() => { void auth.signOut().finally(() => { reset(); clearSessionExpired(); router.replace('/login'); }); }} />}><Banner kind="warn" text={t('sys.login.title')} body={t('sys.login.body')} /></Screen>;
}
