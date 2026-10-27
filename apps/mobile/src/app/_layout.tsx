import { useEffect, useState } from 'react';
import { Slot } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { I18nextProvider } from 'react-i18next';
import type { i18n } from 'i18next';
import { fontAssets } from '../theme/fonts';
import { createI18n } from '../i18n';

void SplashScreen.preventAutoHideAsync();
export default function RootLayout() {
  const [loaded, error] = useFonts(fontAssets);
  const [translator, setTranslator] = useState<i18n | null>(null);
  useEffect(() => { void createI18n().then(setTranslator); }, []);
  useEffect(() => {
    if ((loaded || error) && translator) void SplashScreen.hideAsync();
  }, [loaded, error, translator]);
  if ((!loaded && !error) || !translator) return null;
  return <I18nextProvider i18n={translator}><Slot /></I18nextProvider>;
}
