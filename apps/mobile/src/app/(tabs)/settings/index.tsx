import { router } from 'expo-router';
import { SettingsScreen } from '../../../features/settings/SettingsScreen';
import { lastUsedProvider, logout } from '../../../features/settings/logout';
import { useSpace } from '../../../features/space/SpaceContext';
import { useApp } from '../../../lib/AppContext';
import { clearPendingInvite } from '../../../lib/inviteLink';

export default function SettingsRoute() {
  const { auth, client, session, userId } = useApp();
  const { state, reset } = useSpace();
  const onLogout = async () => {
    const lastUsed = lastUsedProvider(session?.user.app_metadata?.provider);
    await logout({ auth, releaseSession: client.release, clearPendingInvite, resetSpace: reset, snapshot: state.snapshot, userId });
    router.replace({ pathname: '/login', params: lastUsed ? { lastUsed } : {} });
  };
  return <SettingsScreen onLogout={onLogout} />;
}
