import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { AppText, Card, RadioRow, Screen } from '../../ui/components';
import { AUTONYMS, usePreferences } from '../../features/settings/preferences';
import type { Locale } from '../../i18n';
export default function LanguageRoute() {
  const { t } = useTranslation(); const prefs = usePreferences();
  const choices: (Locale | null)[] = [null, 'ko-KR', 'en-US', 'ja-JP'];
  return <Screen onBack={() => router.back()} title={t('set.lang')}><Card>{choices.map((locale, index) => <RadioRow key={locale ?? 'system'} label={locale ? AUTONYMS[locale] : t('set.lang.system')} selected={prefs.locale === locale} last={index === choices.length - 1} onPress={() => { void prefs.setLocale(locale); }} />)}</Card><AppText variant="bodySm" tone="text2">{t('set.display.note')}</AppText></Screen>;
}
