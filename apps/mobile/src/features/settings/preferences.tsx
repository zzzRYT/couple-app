import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { AccessibilityInfo, AppState, Platform, useColorScheme } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { getLocales } from 'expo-localization';
import type { i18n } from 'i18next';
import type { Locale } from '../../i18n';

export type DisplayMode = 'system' | 'light' | 'dark';
type Storage = { getItemAsync(key: string): Promise<string | null>; setItemAsync(key: string, value: string): Promise<void>; deleteItemAsync(key: string): Promise<void> };
export type Preferences = { locale: Locale | null; displayMode: DisplayMode; highContrast: boolean; ready: boolean; setLocale(value: Locale | null): Promise<void>; setDisplayMode(value: DisplayMode): Promise<void> };
const PreferencesContext = createContext<Preferences | null>(null);
const fallbackPreferences: Preferences = { locale: null, displayMode: 'system', highContrast: false, ready: true, setLocale: async () => {}, setDisplayMode: async () => {} };
const storage: Storage = SecureStore;
const isLocale = (value: string | null): value is Locale => value === 'ko-KR' || value === 'en-US' || value === 'ja-JP';
const isDisplayMode = (value: string | null): value is DisplayMode => value === 'system' || value === 'light' || value === 'dark';

export function PreferencesProvider({ children, translator, store = storage }: { children: ReactNode; translator: i18n; store?: Storage }) {
  const [locale, setLocaleState] = useState<Locale | null>(null);
  const [displayMode, setDisplayModeState] = useState<DisplayMode>('system');
  const [highContrast, setHighContrast] = useState(false);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let active = true;
    void Promise.all([store.getItemAsync('locale'), store.getItemAsync('displayMode')]).then(async ([savedLocale, savedMode]) => {
      const nextLocale = isLocale(savedLocale) ? savedLocale : null;
      const nextMode = isDisplayMode(savedMode) ? savedMode : 'system';
      if (nextLocale) await translator.changeLanguage(nextLocale);
      else {
        const tag = getLocales()[0]?.languageTag ?? 'en-US';
        await translator.changeLanguage(tag.startsWith('ko') ? 'ko-KR' : tag.startsWith('ja') ? 'ja-JP' : 'en-US');
      }
      if (active) { setLocaleState(nextLocale); setDisplayModeState(nextMode); setReady(true); }
    }).catch(() => { if (active) setReady(true); });
    const refreshContrast = () => {
      const query = Platform.OS === 'ios' ? AccessibilityInfo.isDarkerSystemColorsEnabled() : Platform.OS === 'android' ? AccessibilityInfo.isHighTextContrastEnabled() : Promise.resolve(false);
      void query.then((value) => { if (active) setHighContrast(value); }).catch(() => { if (active) setHighContrast(false); });
    };
    refreshContrast();
    const subscription = AppState.addEventListener('change', (state) => { if (state === 'active') refreshContrast(); });
    const contrastEvent = Platform.OS === 'ios' ? 'darkerSystemColorsChanged' : 'highTextContrastChanged';
    const contrastSubscription = AccessibilityInfo.addEventListener(contrastEvent, (value) => setHighContrast(value));
    return () => { active = false; subscription.remove(); contrastSubscription.remove(); };
  }, [translator, store]);
  useEffect(() => {
    if (locale !== null) return;
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active') return;
      const tag = getLocales()[0]?.languageTag ?? 'en-US';
      void translator.changeLanguage(tag.startsWith('ko') ? 'ko-KR' : tag.startsWith('ja') ? 'ja-JP' : 'en-US');
    });
    return () => subscription.remove();
  }, [locale, translator]);
  const setLocale = useCallback(async (value: Locale | null) => {
    if (value) { await store.setItemAsync('locale', value); await translator.changeLanguage(value); }
    else { await store.deleteItemAsync('locale'); const tag = getLocales()[0]?.languageTag ?? 'en-US'; await translator.changeLanguage(tag.startsWith('ko') ? 'ko-KR' : tag.startsWith('ja') ? 'ja-JP' : 'en-US'); }
    setLocaleState(value);
  }, [store, translator]);
  const setDisplayMode = useCallback(async (value: DisplayMode) => { await store.setItemAsync('displayMode', value); setDisplayModeState(value); }, [store]);
  const value = useMemo(() => ({ locale, displayMode, highContrast, ready, setLocale, setDisplayMode }), [locale, displayMode, highContrast, ready, setLocale, setDisplayMode]);
  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}
export function usePreferences(): Preferences {
  return useContext(PreferencesContext) ?? fallbackPreferences;
}
export function useDisplayAppearance() {
  const preferences = useContext(PreferencesContext);
  const system = useColorScheme();
  const displayMode = preferences?.displayMode ?? 'system';
  const highContrast = preferences?.highContrast ?? false;
  return { scheme: displayMode === 'system' ? (system === 'dark' ? 'dark' : 'light') : displayMode, highContrast } as const;
}
