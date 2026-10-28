import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { PromptPanel } from '../../features/prompt/PromptPanel';
import { RoomScene } from '../../scene/RoomScene';
import { estimateLayout } from '../../scene/protectedZones';
import { CycleLoader } from '../../ui/CycleLoader';
import { useApp } from '../../lib/AppContext';
import { useSpace } from '../../features/space/SpaceContext';
/** Modal sheet over the tab bar. Realtime hints bump the refresh token so both members read the same conversation. */
export default function PromptRoute() {
  const { t } = useTranslation();
  const { client, realtime } = useApp();
  const { state, spaceId, refresh } = useSpace();
  const [token, setToken] = useState(0);
  useEffect(() => (spaceId ? realtime.subscribe(spaceId, () => setToken((n) => n + 1)) : undefined), [realtime, spaceId]);
  if (!state.snapshot) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><CycleLoader label={t('common.loading')} /></View>;
  const mini = estimateLayout(180, 260, 1, 'ios');
  return <PromptPanel client={client} snapshot={state.snapshot} online={!state.offline} refreshToken={token}
    onOpenConsent={() => router.push('/prompt/consent')} onClose={() => router.back()} onApplied={() => { void refresh(); router.back(); }}
    renderScene={(scene) => <RoomScene scene={scene} mode="day" layout={{ ...mini, safeTop: 0, safeBottom: 0, tabBarHeight: 0, toolbar: { x: 0, y: 0, width: 0, height: 0 } }} compact />} />;
}
