import { useCallback, useEffect, useRef, useState } from 'react';
import { useColorScheme, View } from 'react-native';
import { router, Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import { I18nextProvider } from 'react-i18next';
import type { i18n } from 'i18next';
import { fontAssets } from '../theme/fonts';
import { createI18n } from '../i18n';
import { AppProvider } from '../lib/AppContext';
import { SpaceProvider } from '../features/space/SpaceContext';
import { appGate } from '../lib/appGate';
import { useApp } from '../lib/AppContext';
import { useSpace } from '../features/space/SpaceContext';
import { PasswordProvider, usePassword } from '../features/auth/PasswordContext';
import { peekPendingInvite } from '../lib/inviteLink';
import { PreferencesProvider, useDisplayAppearance } from '../features/settings/preferences';
import { V0_FEATURES } from '../config/features';
import { V0Error } from '../features/home/states';
import { useNotificationSync } from '../features/notifications/useNotificationSync';
import { installNativeWidgets } from '../features/widgets/nativeWidgets';
import { UpdateNotice } from '../features/update/UpdateNotice';
import { checkForOtaUpdate } from '../features/update/ota';
import { BrandSplash } from '../features/splash/BrandSplash';
import { useResumeSplash } from '../features/splash/useResumeSplash';

/** The native launch screen goes once the in-app splash has drawn over it, or after this long if the image never reports. */
const NATIVE_SPLASH_FALLBACK_MS = 1500;
type Scheme = 'light' | 'dark';

void SplashScreen.preventAutoHideAsync();
Notifications.setNotificationHandler({ handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }) });
export default function RootLayout() {
  const [loaded, error] = useFonts(fontAssets);
  const [translator, setTranslator] = useState<i18n | null>(null);
  const [booting, setBooting] = useState(true);
  const [appScheme, setAppScheme] = useState<Scheme | null>(null);
  const system = useColorScheme();
  const resumed = useResumeSplash();
  const nativeHidden = useRef(false);
  const hideNativeSplash = useCallback(() => {
    if (nativeHidden.current) return;
    nativeHidden.current = true;
    void SplashScreen.hideAsync();
  }, []);
  useEffect(() => { void createI18n().then((created) => { installNativeWidgets(created); setTranslator(created); }); }, []);
  useEffect(() => { void checkForOtaUpdate(); }, []);
  useEffect(() => {
    const timer = setTimeout(hideNativeSplash, NATIVE_SPLASH_FALLBACK_MS);
    return () => clearTimeout(timer);
  }, [hideNativeSplash]);
  const ready = (!!loaded || !!error) && !!translator;
  // V0-12: the splash replaces the boot skeleton. A cold start follows the system scheme like the launch screen before
  // it; once the app has read its own display setting, later showings (warm start, signing in) follow that.
  return (
    <View style={{ flex: 1 }}>
      {ready && <I18nextProvider i18n={translator}>
        <PreferencesProvider translator={translator}>
          <AppProvider>
            <SpaceProvider>
              <PasswordProvider>
                <AppNavigator fontsLoaded onBootingChange={setBooting} onSchemeChange={setAppScheme} />
              </PasswordProvider>
            </SpaceProvider>
          </AppProvider>
        </PreferencesProvider>
      </I18nextProvider>}
      <BrandSplash holding={!ready || booting} replay={resumed} scheme={appScheme ?? (system === 'dark' ? 'dark' : 'light')} label={translator?.t('state.loading')} onDrawn={hideNativeSplash} />
    </View>
  );
}

function AppNavigator({ fontsLoaded, onBootingChange, onSchemeChange }: { fontsLoaded: boolean; onBootingChange: (booting: boolean) => void; onSchemeChange: (scheme: Scheme) => void }) {
  const { session, sessionLoaded, sessionExpired } = useApp();
  const { entry, spaceId, ended, state, reload, refresh, inviteAfterActivation, clearInviteAfterActivation } = useSpace();
  const { shouldPrompt, recovery } = usePassword();
  const [pending, setPending] = useState<string | null | undefined>(undefined);
  useNotificationSync();
  useEffect(() => { void peekPendingInvite().then(setPending); }, []);
  const gate = appGate({ fontsLoaded, sessionLoaded, hasSession: !!session, sessionExpired, entry, spaceId, ended, pendingInviteLoaded: pending !== undefined, pendingInvite: pending, snapshotProfile: state.snapshot ? state.snapshot.me.displayName : undefined, passwordRecovery: recovery, passwordPrompt: shouldPrompt });
  useEffect(() => {
    if (gate.kind === 'active' && inviteAfterActivation) { clearInviteAfterActivation(); router.push('/invite'); }
  }, [gate.kind, inviteAfterActivation, clearInviteAfterActivation]);
  const failure = gate.kind === 'offlineEmpty' ? <V0Error offline retry={() => void reload()} />
    : entry === 'active' && state.status === 'error' && !state.offline ? <V0Error retry={() => void refresh()} />
    : gate.kind === 'booting' && session && (entry === 'error' || (entry === 'active' && state.status === 'error' && !state.snapshot)) ? <V0Error offline={state.offline} retry={() => { void reload(); }} />
    : null;
  const booting = !failure && gate.kind === 'booting';
  const { scheme } = useDisplayAppearance();
  useEffect(() => { onBootingChange(booting); }, [booting, onBootingChange]);
  useEffect(() => { onSchemeChange(scheme); }, [scheme, onSchemeChange]);
  if (failure) return failure;
  // The root splash covers booting (V0-12), so nothing is drawn under it.
  if (booting) return null;
  return <><Stack screenOptions={{ headerShown: false }}>
    <Stack.Screen name="i/[code]" />
    <Stack.Screen name="invite/[code]" />
    <Stack.Screen name="auth-callback" options={{ gestureEnabled: false }} />
    <Stack.Protected guard={gate.kind === 'passwordRecovery'}><Stack.Screen name="new-password" options={{ gestureEnabled: false }} /></Stack.Protected>
    <Stack.Protected guard={gate.kind === 'needsPasswordPrompt'}><Stack.Screen name="set-password-prompt" options={{ gestureEnabled: false }} /></Stack.Protected>
    <Stack.Protected guard={gate.kind === 'signedOut' || gate.kind === 'sessionExpired'}><Stack.Screen name="(auth)" options={{ gestureEnabled: false }} /></Stack.Protected>
    <Stack.Protected guard={gate.kind === 'needsOnboardingChoice' || gate.kind === 'needsProfile'}><Stack.Screen name="(onboarding)" options={{ gestureEnabled: false }} /></Stack.Protected>
    <Stack.Protected guard={gate.kind === 'ended'}><Stack.Screen name="ended" /></Stack.Protected>
    <Stack.Protected guard={gate.kind === 'active'}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="anniversary/[key]" />
      <Stack.Screen name="anniversary-edit" options={{ presentation: 'fullScreenModal', gestureEnabled: false }} />
      <Stack.Screen name="invite" />
      <Stack.Screen name="connected" />
      <Stack.Screen name="notify-intro" options={{ gestureEnabled: false }} />
      <Stack.Screen name="join-has-space" />
      <Stack.Screen name="connect-code" />
      <Stack.Screen name="settings/connect" />
      <Stack.Screen name="settings/end-space" />
      <Stack.Screen name="settings/me" />
      <Stack.Screen name="settings/start-date" />
      <Stack.Screen name="settings/notifications" />
      <Stack.Screen name="settings/language" />
      <Stack.Screen name="settings/appearance" />
      <Stack.Screen name="settings/disconnect" />
      <Stack.Screen name="settings/security" />
      <Stack.Screen name="settings/change-password" />
      <Stack.Screen name="settings/set-password" />
    </Stack.Protected>
    <Stack.Protected guard={gate.kind === 'active' && V0_FEATURES.prompt}><Stack.Screen name="prompt/index" options={{ presentation: 'modal' }} /><Stack.Screen name="prompt/consent" options={{ presentation: 'modal' }} /></Stack.Protected>
    <Stack.Protected guard={gate.kind === 'active' && V0_FEATURES.reportBlock}><Stack.Screen name="settings/report" /></Stack.Protected>
    {/* Any signed-in state: the space may end (realtime) while the deletion is in flight, and the screen must stay mounted. */}
    <Stack.Protected guard={gate.kind === 'active' || gate.kind === 'needsOnboardingChoice' || gate.kind === 'ended'}><Stack.Screen name="settings/delete-account" /><Stack.Screen name="settings/reset-password" /></Stack.Protected>
  </Stack><UpdateNotice /></>;
}
