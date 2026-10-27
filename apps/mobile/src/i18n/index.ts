import { createInstance, type i18n } from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';
import * as SecureStore from 'expo-secure-store';
import ko from './locales/ko-KR.json';
import en from './locales/en-US.json';
import ja from './locales/ja-JP.json';

export type Locale = 'ko-KR' | 'en-US' | 'ja-JP';
type Storage = { getItemAsync(key: string): Promise<string | null>; setItemAsync(key: string, value: string): Promise<void> };
function supported(value: string | null | undefined): Locale | null {
  if (value?.startsWith('ko')) return 'ko-KR';
  if (value?.startsWith('ja')) return 'ja-JP';
  if (value?.startsWith('en')) return 'en-US';
  return null;
}
export async function createI18n(options: { deviceLocale?: string; storage?: Storage; profileLocale?: Locale | null } = {}): Promise<i18n> {
  const storage = options.storage ?? SecureStore;
  const saved = await storage.getItemAsync('locale');
  const explicit = options.profileLocale === null ? null : supported(options.profileLocale) ?? supported(saved);
  const language = explicit ?? supported(options.deviceLocale ?? getLocales()[0]?.languageTag) ?? 'en-US';
  const instance = createInstance();
  await instance.use(initReactI18next).init({
    lng: language, fallbackLng: 'en-US', resources: { 'ko-KR': { translation: ko }, 'en-US': { translation: en }, 'ja-JP': { translation: ja } },
    keySeparator: false, interpolation: { prefix: '{', suffix: '}', escapeValue: false },
  });
  return instance;
}
export async function setLocale(instance: i18n, locale: Locale, storage: Storage, saveProfile: (value: Locale) => Promise<void>): Promise<void> {
  await saveProfile(locale);
  await storage.setItemAsync('locale', locale);
  await instance.changeLanguage(locale);
}
