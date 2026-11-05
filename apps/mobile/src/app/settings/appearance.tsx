import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { AppText, Card, ListRow, Screen } from '../../ui/components';
import { usePreferences, type DisplayMode } from '../../features/settings/preferences';
export default function AppearanceRoute() {
  const { t } = useTranslation(); const prefs = usePreferences(); const modes: DisplayMode[] = ['system', 'light', 'dark'];
  return <Screen onBack={() => router.back()}><AppText variant="title">{t('set.mode')}</AppText><Card>{modes.map((mode) => <ListRow key={mode} label={t(`set.mode.${mode}`)} value={prefs.displayMode === mode ? '✓' : undefined} onPress={() => { void prefs.setDisplayMode(mode); }} />)}</Card><AppText tone="text2">{t('set.display.note')}</AppText></Screen>;
}
