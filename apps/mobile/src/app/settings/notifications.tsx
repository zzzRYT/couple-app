import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { NotificationSettingsScreen } from '../../features/settings/NotificationSettingsScreen';
import { useSpace } from '../../features/space/SpaceContext';
import { useApp } from '../../lib/AppContext';
export default function NotificationSettingsRoute() {
  const { t } = useTranslation(); const { userId } = useApp(); const { state } = useSpace(); const snapshot = state.snapshot;
  if (!snapshot || !userId) return null;
  const partner = snapshot.members.find((member) => member.userId !== userId)?.displayName ?? t('home.pending.partner');
  return <NotificationSettingsScreen userId={userId} partner={partner} onBack={() => router.back()} />;
}
