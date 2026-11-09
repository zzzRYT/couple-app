import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { AppText, Card, RadioRow, Screen } from '../../ui/components';
import { usePreferences, type DisplayMode } from '../../features/settings/preferences';
export default function AppearanceRoute() {
  const { t } = useTranslation(); const prefs = usePreferences(); const modes: DisplayMode[] = ['system', 'light', 'dark'];
  return <Screen onBack={() => router.back()} title={t('set.mode')}><Card>{modes.map((mode, index) => <RadioRow key={mode} label={t(`set.mode.${mode}`)} selected={prefs.displayMode === mode} last={index === modes.length - 1} onPress={() => { void prefs.setDisplayMode(mode); }} />)}</Card><AppText variant="bodySm" tone="text2">{t('set.display.note')}</AppText></Screen>;
}
