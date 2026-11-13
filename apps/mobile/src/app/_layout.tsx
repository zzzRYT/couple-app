import { useCallback, useEffect, useRef, useState } from 'react';
import { useColorScheme, View } from 'react-native';
import { router, usePathname } from 'expo-router';
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
import { AppStack } from '../lib/AppStack';
import { useApp } from '../lib/AppContext';
import { useSpace } from '../features/space/SpaceContext';
import { PasswordProvider, usePassword } from '../features/auth/PasswordContext';
import { peekPendingInvite } from '../lib/inviteLink';
import { PreferencesProvider, useDisplayAppearance } from '../features/settings/preferences';
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
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);
  pathnameRef.current = pathname;
  const [pending, setPending] = useState<string | null | undefined>(undefined);
  useNotificationSync();
  useEffect(() => { void peekPendingInvite().then(setPending); }, []);
  const gate = appGate({ fontsLoaded, sessionLoaded, hasSession: !!session, sessionExpired, entry, spaceId, ended, pendingInviteLoaded: pending !== undefined, pendingInvite: pending, snapshotProfile: state.snapshot ? state.snapshot.me.displayName : undefined, passwordRecovery: recovery, passwordPrompt: shouldPrompt });
  // A link received before sign-in is stored while the auth gate is shown. Once an existing
  // account reaches its space, deliver it there too; the link route itself handles warm starts.
  useEffect(() => {
    if (gate.kind !== 'active') return;
    let cancelled = false;
    void peekPendingInvite().then((code) => {
      if (code && !cancelled && !/^\/(?:i|invite)\//.test(pathnameRef.current) && pathnameRef.current !== '/join-has-space') router.push('/join-has-space');
    });
    return () => { cancelled = true; };
  }, [gate.kind]);
  useEffect(() => {
    if (gate.kind === 'active' && inviteAfterActivation) { clearInviteAfterActivation(); router.push('/invite'); }
  }, [gate.kind, inviteAfterActivation, clearInviteAfterActivation]);
  // Once a snapshot is on screen, a failed refresh shows inside the home and anniversaries tabs instead (V0-03), so Settings stays reachable.
  const failure = gate.kind === 'offlineEmpty' ? <V0Error offline retry={() => void reload()} />
    : entry === 'active' && state.status === 'error' && !state.offline && !state.snapshot ? <V0Error retry={() => void refresh()} />
    : gate.kind === 'booting' && session && (entry === 'error' || (entry === 'active' && state.status === 'error' && !state.snapshot)) ? <V0Error offline={state.offline} retry={() => { void reload(); }} />
    : null;
  const booting = !failure && gate.kind === 'booting';
  const { scheme } = useDisplayAppearance();
  useEffect(() => { onBootingChange(booting); }, [booting, onBootingChange]);
  useEffect(() => { onSchemeChange(scheme); }, [scheme, onSchemeChange]);
  if (failure) return <>{failure}<UpdateNotice /></>;
  // The root splash covers booting (V0-12), so nothing is drawn under it.
  if (booting) return null;
  return <><AppStack gate={gate.kind} /><UpdateNotice /></>;
}
