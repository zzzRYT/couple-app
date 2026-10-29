import { useTranslation } from 'react-i18next';
import { useApp } from '../../lib/AppContext';
import { Welcome } from '../../features/auth/Welcome';
import { Screen, Button, Banner } from '../../ui/components';
import { useRouter } from 'expo-router';
import { useSpace } from '../../features/space/SpaceContext';

export default function AuthIndex() {
  const { t } = useTranslation();
  const { sessionExpired, clearSessionExpired, auth } = useApp();
  const { reset } = useSpace();
  const router = useRouter();
  if (!sessionExpired) return <Welcome onStart={() => router.push('/login')} onHasAccount={() => router.push({ pathname: '/login', params: { returning: '1' } })} />;
  return <Screen center footer={<Button label={t('sys.login.action')} onPress={() => { void auth.signOut().finally(() => { reset(); clearSessionExpired(); router.push('/login'); }); }} />}><Banner kind="warn" text={t('sys.login.title')} body={t('sys.login.body')} /></Screen>;
}
