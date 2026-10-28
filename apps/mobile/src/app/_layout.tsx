import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { I18nextProvider } from 'react-i18next';
import type { i18n } from 'i18next';
import { fontAssets } from '../theme/fonts';
import { createI18n } from '../i18n';
import { AppProvider } from '../lib/AppContext';
import { SpaceProvider } from '../features/space/SpaceContext';
import { EndedGate } from '../features/lifecycle/EndedGate';

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
          <EndedGate />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="prompt/index" options={{ presentation: 'modal' }} />
            <Stack.Screen name="prompt/consent" options={{ presentation: 'modal' }} />
          </Stack>
        </SpaceProvider>
      </AppProvider>
    </I18nextProvider>
  );
}
