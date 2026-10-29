import type { ReactElement, ReactNode } from 'react';
import { render } from '@testing-library/react-native';
import { I18nextProvider } from 'react-i18next';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import type { i18n } from 'i18next';
import { createI18n, type Locale } from '../i18n';
const storage = { getItemAsync: async () => null, setItemAsync: async () => {} };
let cached: Partial<Record<Locale, i18n>> = {};
export async function i18nFor(locale: Locale = 'ko-KR'): Promise<i18n> {
  cached[locale] ??= await createI18n({ deviceLocale: locale, storage, profileLocale: null });
  return cached[locale]!;
}
export function resetI18nCache() { cached = {}; }
export const safeMetrics = { frame: { x: 0, y: 0, width: 375, height: 812 }, insets: { top: 44, bottom: 34, left: 0, right: 0 } };
/** Renders inside a real i18n instance so assertions compare against translated resources, not hard-coded copy. */
export async function renderWithI18n(element: ReactElement, locale: Locale = 'ko-KR') {
  const instance = await i18nFor(locale);
  const wrapper = ({ children }: { children: ReactNode }) => <SafeAreaProvider initialMetrics={safeMetrics}><I18nextProvider i18n={instance}>{children}</I18nextProvider></SafeAreaProvider>;
  const screen = await render(element, { wrapper });
  return { ...screen, t: instance.t.bind(instance) as (key: string, options?: Record<string, unknown>) => string };
}
export function jsonResponse(status: number, body?: unknown): Response {
  return { status, json: async () => body ?? {} } as Response;
}
