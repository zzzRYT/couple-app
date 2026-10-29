import { useTranslation } from 'react-i18next';
import { useApp } from '../../lib/AppContext';
import { Welcome } from '../../features/auth/Welcome';
import { Screen, Button, Banner } from '../../ui/components';
import { useRouter } from 'expo-router';
import { useSpace } from '../../features/space/SpaceContext';
import { LoginScreen } from '../../features/auth/LoginScreen';
import { farewell, useAccountDeleted } from '../../features/account/deleteAccount';

export default function AuthIndex() {
  const { t } = useTranslation();
  const { sessionExpired, clearSessionExpired, auth } = useApp();
  const { reset } = useSpace();
  const router = useRouter();
  const deleted = useAccountDeleted();
  // S13-delete-done: the sign-in screen with "Your account was deleted", even if a late 401 marked the session expired.
  if (deleted) {
    const moveOn = () => { farewell.set(false); clearSessionExpired(); };
    return <LoginScreen auth={auth} notice={t('acct.delete.done')} onDone={moveOn} onEmail={(email) => { moveOn(); router.push({ pathname: '/email-code', params: { email } }); }} />;
  }
  if (!sessionExpired) return <Welcome onStart={() => router.push('/login')} onHasAccount={() => router.push({ pathname: '/login', params: { returning: '1' } })} />;
  return <Screen center footer={<Button label={t('sys.login.action')} onPress={() => { void auth.signOut().finally(() => { reset(); clearSessionExpired(); router.push('/login'); }); }} />}><Banner kind="warn" text={t('sys.login.title')} body={t('sys.login.body')} /></Screen>;
}
