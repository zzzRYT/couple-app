import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { NotificationSettingsScreen } from '../../features/settings/NotificationSettingsScreen';
import { useSpace } from '../../features/space/SpaceContext';
import { profilesOf } from '../../features/space/profiles';
import { useApp } from '../../lib/AppContext';
export default function NotificationSettingsRoute() {
  const { t } = useTranslation(); const { userId } = useApp(); const { state } = useSpace(); const snapshot = state.snapshot;
  if (!snapshot || !userId) return null;
  return <NotificationSettingsScreen userId={userId} partner={profilesOf(snapshot, t).partner.name} onBack={() => router.back()} />;
}
