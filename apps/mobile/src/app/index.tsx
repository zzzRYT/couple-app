import { Redirect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { CycleLoader } from '../ui/CycleLoader';
import { Banner, Button } from '../ui/components';
import { useApp } from '../lib/AppContext';
import { useSpace } from '../features/space/SpaceContext';

/** Entry: signed out → welcome; active space → home; otherwise create or join (ended notices arrive with US5). */
export default function Index() {
  const { t } = useTranslation();
  const { session } = useApp();
  const { entry, reload } = useSpace();
  if (!session) return <Redirect href="/welcome" />;
  if (entry === 'loading') return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><CycleLoader label={t('common.loading')} /></View>;
  if (entry === 'error') return <View style={{ flex: 1, justifyContent: 'center', padding: 24, gap: 12 }}><Banner kind="danger" text={t('sys.server.title')} /><Button label={t('common.retry')} onPress={() => void reload()} /></View>;
  if (entry === 'active') return <Redirect href="/home" />;
  return <Redirect href="/create-space" />;
}
