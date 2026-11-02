import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { AppText, Card, ListRow, Screen } from '../../ui/components';
import { usePreferences } from '../../features/settings/preferences';
import type { Locale } from '../../i18n';
export default function LanguageRoute() {
  const { t } = useTranslation(); const prefs = usePreferences();
  const choices: { locale: Locale | null; label: string }[] = [{ locale: null, label: t('set.lang.system') }, { locale: 'ko-KR', label: '한국어' }, { locale: 'en-US', label: 'English' }, { locale: 'ja-JP', label: '日本語' }];
  return <Screen onBack={() => router.back()}><AppText variant="title">{t('set.lang')}</AppText><Card>{choices.map(({ locale, label }) => <ListRow key={locale ?? 'system'} label={label} value={prefs.locale === locale ? '✓' : undefined} onPress={() => { void prefs.setLocale(locale); }} />)}</Card><AppText tone="text2">{t('set.display.note')}</AppText></Screen>;
}
