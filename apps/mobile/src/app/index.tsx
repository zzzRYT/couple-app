import { useEffect, useState } from 'react';
import { peekPendingInvite } from '../lib/inviteLink';
import { Redirect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { CycleLoader } from '../ui/CycleLoader';
import { Banner, Button } from '../ui/components';
import { useApp } from '../lib/AppContext';
import { useSpace } from '../features/space/SpaceContext';

/** Entry: signed out → welcome; an unread ended notice → notice; active space → home; otherwise create or join. */
export default function Index() {
  const { t } = useTranslation();
  const [pending, setPending] = useState<string | null | undefined>(undefined);
  useEffect(() => { void peekPendingInvite().then(setPending); }, []);
  const { session, sessionLoaded } = useApp();
  const { entry, ended, reload } = useSpace();
  if (!sessionLoaded) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><CycleLoader label={t('common.loading')} /></View>;
  if (!session) return <Redirect href="/welcome" />;
  if (pending === undefined || entry === 'loading') return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><CycleLoader label={t('common.loading')} /></View>;
  if (entry === 'error') return <View style={{ flex: 1, justifyContent: 'center', padding: 24, gap: 12 }}><Banner kind="danger" text={t('sys.server.title')} /><Button label={t('common.retry')} onPress={() => void reload()} /></View>;
  if (pending) return <Redirect href="/join" />;
  if (ended) return <Redirect href="/ended" />;
  if (entry === 'active') return <Redirect href="/home" />;
  return <Redirect href="/choose-space" />;
}
