import { router } from 'expo-router';
import Constants from 'expo-constants';
import { useTranslation } from 'react-i18next';
import { formatAnniversary } from '../../../lib/dday';
import { SettingsScreen } from '../../../features/settings/SettingsScreen';
import { logout } from '../../../features/settings/logout';
import { useSpace } from '../../../features/space/SpaceContext';
import { useApp } from '../../../lib/AppContext';
import { clearPendingInvite } from '../../../lib/inviteLink';

export default function SettingsRoute() {
  const { auth, client, userId } = useApp();
  const { state, reset } = useSpace();
  const { i18n } = useTranslation();
  const snapshot = state.snapshot;
  const me = snapshot?.members.find((member) => member.userId === snapshot.me.userId);
  const onLogout = async () => {
    await logout({ auth, releaseSession: client.release, clearPendingInvite, resetSpace: reset, snapshot: state.snapshot, userId });
  };
  return <SettingsScreen onLogout={onLogout} version={Constants.expoConfig?.version}
    space={snapshot ? { anniversary: formatAnniversary(snapshot.space.anniversaryDate, i18n.language), consent: me?.aiConsentState ?? 'not_given' } : null}
    onOpenDate={() => router.navigate('/home')} onOpenConsent={() => router.push('/prompt/consent')}
    onOpenReport={() => router.push('/settings/report')} onOpenEndSpace={() => router.push('/settings/end-space')} />;
}
