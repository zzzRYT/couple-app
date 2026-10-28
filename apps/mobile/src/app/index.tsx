import { useEffect, useState } from 'react';
import { peekPendingInvite } from '../lib/inviteLink';
import { Redirect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { LoadingScreen } from '../ui/CycleLoader';
import { Banner, Button, Screen } from '../ui/components';
import { useApp } from '../lib/AppContext';
import { useSpace } from '../features/space/SpaceContext';

/** Entry: signed out → welcome; active space → home; otherwise create or join (ended notices arrive with US5). */
export default function Index() {
  const { t } = useTranslation();
  const [pending, setPending] = useState<string | null | undefined>(undefined);
  useEffect(() => { void peekPendingInvite().then(setPending); }, []);
  const { session, sessionLoaded } = useApp();
  const { entry, reload } = useSpace();
  if (!sessionLoaded) return <LoadingScreen label={t('common.loading')} />;
  if (!session) return <Redirect href="/welcome" />;
  if (pending === undefined || entry === 'loading') return <LoadingScreen label={t('common.loading')} />;
  if (entry === 'error') return <Screen center footer={<Button label={t('common.retry')} onPress={() => void reload()} />}><Banner kind="danger" text={t('sys.server.title')} body={t('sys.server.body')} /></Screen>;
  if (pending) return <Redirect href="/join" />;
  if (entry === 'active') return <Redirect href="/home" />;
  return <Redirect href="/choose-space" />;
}
