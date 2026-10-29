import { useCallback, useEffect, useRef, useState } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { PromptPanel } from '../../features/prompt/PromptPanel';
import { RoomScene } from '../../scene/RoomScene';
import { estimateLayout } from '../../scene/protectedZones';
import { LoadingScreen } from '../../ui/CycleLoader';
import { roomMode } from '../../scene/dayNight';
import { useNow } from '../../lib/useNow';
import { useApp } from '../../lib/AppContext';
import { useSpace } from '../../features/space/SpaceContext';
/** Modal sheet over the tab bar. Realtime hints bump the refresh token so both members read the same conversation. */
export default function PromptRoute() {
  const { t } = useTranslation();
  const { client, realtime } = useApp();
  const { state, spaceId, refresh } = useSpace();
  const [token, setToken] = useState(0);
  const opening = useRef(false);
  useFocusEffect(useCallback(() => { opening.current = false; return () => { opening.current = false; }; }, []));
  const openOnce = (path: string | { pathname: string; params: Record<string, string> }) => { if (opening.current) return; opening.current = true; router.push(path); };
  useEffect(() => (spaceId ? realtime.subscribe(spaceId, () => setToken((n) => n + 1), (status) => { if (status === 'SUBSCRIBED') setToken((n) => n + 1); }) : undefined), [realtime, spaceId]);
  const now = useNow();
  if (!state.snapshot) return <LoadingScreen label={t('common.loading')} />;
  const mini = estimateLayout(200, 280, 1, 'ios');
  const mode = roomMode(state.snapshot.roomThemeDocument, now);
  return <PromptPanel client={client} snapshot={state.snapshot} online={!state.offline} refreshToken={token}
    onOpenConsent={() => openOnce('/prompt/consent')} onReportMessage={(messageId) => openOnce({ pathname: '/settings/report', params: { messageId } })} onClose={() => router.back()} onApplied={() => { void refresh(); router.back(); }}
    renderScene={(scene) => <RoomScene scene={scene} mode={mode} layout={{ ...mini, safeTop: 0, safeBottom: 0, tabBarHeight: 0, toolbar: { x: 0, y: 0, width: 0, height: 0 } }} compact />} />;
}
