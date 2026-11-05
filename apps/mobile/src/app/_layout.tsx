import { useEffect, useState } from 'react';
import { router, Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { I18nextProvider } from 'react-i18next';
import type { i18n } from 'i18next';
import { fontAssets } from '../theme/fonts';
import { createI18n } from '../i18n';
import { AppProvider } from '../lib/AppContext';
import { SpaceProvider } from '../features/space/SpaceContext';
import { appGate } from '../lib/appGate';
import { useApp } from '../lib/AppContext';
import { useSpace } from '../features/space/SpaceContext';
import { peekPendingInvite } from '../lib/inviteLink';
import { PreferencesProvider } from '../features/settings/preferences';
import { V0_FEATURES } from '../config/features';
import { V0Error, V0Loading } from '../features/home/states';

void SplashScreen.preventAutoHideAsync();
export default function RootLayout() {
  const [loaded, error] = useFonts(fontAssets);
  const [translator, setTranslator] = useState<i18n | null>(null);
  useEffect(() => { void createI18n().then(setTranslator); }, []);
  useEffect(() => {
    if ((loaded || error) && translator) void SplashScreen.hideAsync();
  }, [loaded, error, translator]);
  if ((!loaded && !error) || !translator) return null;
  return (
    <I18nextProvider i18n={translator}>
      <PreferencesProvider translator={translator}>
        <AppProvider>
          <SpaceProvider>
            <AppNavigator fontsLoaded={!!loaded || !!error} />
          </SpaceProvider>
        </AppProvider>
      </PreferencesProvider>
    </I18nextProvider>
  );
}

function AppNavigator({ fontsLoaded }: { fontsLoaded: boolean }) {
  const { session, sessionLoaded, sessionExpired } = useApp();
  const { entry, spaceId, ended, state, reload, refresh, inviteAfterActivation, clearInviteAfterActivation } = useSpace();
  const [pending, setPending] = useState<string | null | undefined>(undefined);
  useEffect(() => { void peekPendingInvite().then(setPending); }, []);
  const gate = appGate({ fontsLoaded, sessionLoaded, hasSession: !!session, sessionExpired, entry, spaceId, ended, pendingInviteLoaded: pending !== undefined, pendingInvite: pending, snapshotProfile: state.snapshot ? state.snapshot.me.displayName : undefined });
  useEffect(() => {
    if (gate.kind === 'active' && inviteAfterActivation) { clearInviteAfterActivation(); router.push('/invite'); }
  }, [gate.kind, inviteAfterActivation, clearInviteAfterActivation]);
  if (gate.kind === 'offlineEmpty') return <V0Error offline retry={() => void reload()} />;
  if (entry === 'active' && state.status === 'error' && !state.offline) return <V0Error retry={() => void refresh()} />;
  if (gate.kind === 'booting' && session && (entry === 'error' || (entry === 'active' && state.status === 'error' && !state.snapshot))) return <V0Error offline={state.offline} retry={() => { void reload(); }} />;
  if (gate.kind === 'booting') return <V0Loading />;
  return <Stack screenOptions={{ headerShown: false }}>
    <Stack.Screen name="i/[code]" />
    <Stack.Screen name="invite/[code]" />
    <Stack.Protected guard={gate.kind === 'signedOut' || gate.kind === 'sessionExpired'}><Stack.Screen name="(auth)" options={{ gestureEnabled: false }} /></Stack.Protected>
    <Stack.Protected guard={gate.kind === 'needsOnboardingChoice' || gate.kind === 'needsProfile'}><Stack.Screen name="(onboarding)" options={{ gestureEnabled: false }} /></Stack.Protected>
    <Stack.Protected guard={gate.kind === 'ended'}><Stack.Screen name="ended" /></Stack.Protected>
    <Stack.Protected guard={gate.kind === 'active'}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="invite" />
      <Stack.Screen name="connected" />
      <Stack.Screen name="join-has-space" />
      <Stack.Screen name="settings/end-space" />
      <Stack.Screen name="settings/me" />
      <Stack.Screen name="settings/start-date" />
      <Stack.Screen name="settings/language" />
      <Stack.Screen name="settings/appearance" />
      <Stack.Screen name="settings/disconnect" />
    </Stack.Protected>
    <Stack.Protected guard={gate.kind === 'active' && V0_FEATURES.prompt}><Stack.Screen name="prompt/index" options={{ presentation: 'modal' }} /><Stack.Screen name="prompt/consent" options={{ presentation: 'modal' }} /></Stack.Protected>
    <Stack.Protected guard={gate.kind === 'active' && V0_FEATURES.reportBlock}><Stack.Screen name="settings/report" /></Stack.Protected>
    {/* Any signed-in state: the space may end (realtime) while the deletion is in flight, and the screen must stay mounted. */}
    <Stack.Protected guard={gate.kind === 'active' || gate.kind === 'needsOnboardingChoice' || gate.kind === 'ended'}><Stack.Screen name="settings/delete-account" /></Stack.Protected>
  </Stack>;
}
