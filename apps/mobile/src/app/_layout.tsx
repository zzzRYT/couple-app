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
import { LoadingScreen } from '../ui/CycleLoader';
import { Screen, Button, Banner } from '../ui/components';
import { useTranslation } from 'react-i18next';

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
      <AppProvider>
        <SpaceProvider>
          <AppNavigator fontsLoaded={!!loaded || !!error} />
        </SpaceProvider>
      </AppProvider>
    </I18nextProvider>
  );
}

function AppNavigator({ fontsLoaded }: { fontsLoaded: boolean }) {
  const { t } = useTranslation();
  const { session, sessionLoaded, sessionExpired } = useApp();
  const { entry, spaceId, ended, reload, inviteAfterActivation, clearInviteAfterActivation } = useSpace();
  const [pending, setPending] = useState<string | null | undefined>(undefined);
  useEffect(() => { void peekPendingInvite().then(setPending); }, []);
  const gate = appGate({ fontsLoaded, sessionLoaded, hasSession: !!session, sessionExpired, entry, spaceId, ended, pendingInviteLoaded: pending !== undefined, pendingInvite: pending });
  useEffect(() => {
    if (gate.kind === 'active' && inviteAfterActivation) { clearInviteAfterActivation(); router.push('/invite'); }
  }, [gate.kind, inviteAfterActivation, clearInviteAfterActivation]);
  if (gate.kind === 'booting' && entry === 'error' && session) return <Screen center footer={<Button label={t('common.retry')} onPress={() => void reload()} />}><Banner kind="danger" text={t('sys.server.title')} body={t('sys.server.body')} /></Screen>;
  if (gate.kind === 'booting') return <LoadingScreen label={t('common.loading')} />;
  return <Stack screenOptions={{ headerShown: false }}>
    <Stack.Screen name="i/[code]" />
    <Stack.Screen name="invite/[code]" />
    <Stack.Protected guard={gate.kind === 'signedOut' || gate.kind === 'sessionExpired'}><Stack.Screen name="(auth)" /></Stack.Protected>
    <Stack.Protected guard={gate.kind === 'needsOnboardingChoice'}><Stack.Screen name="(onboarding)" /></Stack.Protected>
    <Stack.Protected guard={gate.kind === 'ended'}><Stack.Screen name="ended" /></Stack.Protected>
    <Stack.Protected guard={gate.kind === 'active'}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="invite" />
      <Stack.Screen name="join-has-space" />
      <Stack.Screen name="prompt/index" options={{ presentation: 'modal' }} />
      <Stack.Screen name="prompt/consent" options={{ presentation: 'modal' }} />
      <Stack.Screen name="settings/report" />
      <Stack.Screen name="settings/end-space" />
    </Stack.Protected>
  </Stack>;
}
