import { router } from 'expo-router';
import { V0SettingsScreen } from '../../../features/settings/V0SettingsScreen';
import { logout } from '../../../features/settings/logout';
import { appVersionLabel } from '../../../config/version';
import { useSpace } from '../../../features/space/SpaceContext';
import { useApp } from '../../../lib/AppContext';
import { clearPendingInvite } from '../../../lib/inviteLink';
export default function SettingsRoute() {
  const { auth, client, userId } = useApp(); const { state, reset, refresh } = useSpace(); const snapshot = state.snapshot;
  if (!snapshot) return null;
  return <V0SettingsScreen snapshot={snapshot} offline={state.offline} version={appVersionLabel()} navigate={(route) => router.push(`/settings/${route}`)}
    onLogout={() => logout({ auth, releaseSession: client.release, clearPendingInvite, resetSpace: reset, snapshot, userId })}
    onZone={async (zone) => { try { await client.updateTimeZone(snapshot.space.spaceId, zone, snapshot.space.updatedAt); } finally { await refresh(); } }} />;
}
