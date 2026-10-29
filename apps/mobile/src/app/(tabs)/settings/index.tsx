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
  const { state, reset, refresh } = useSpace();
  const { i18n } = useTranslation();
  const snapshot = state.snapshot;
  const me = snapshot?.members.find((member) => member.userId === snapshot.me.userId);
  const onLogout = async () => {
    await logout({ auth, releaseSession: client.release, clearPendingInvite, resetSpace: reset, snapshot: state.snapshot, userId });
  };
  const updateRoomMode = async (mode: 'day' | 'night' | 'follow_time') => {
    if (!snapshot) return;
    try { await client.updateRoomMode(snapshot.space.spaceId, mode, snapshot.space.timeZone, snapshot.versionNumber); }
    finally { await refresh(); }
  };
  const updateTimeZone = async (timeZone: string) => {
    if (!snapshot) return;
    try { await client.updateRoomMode(snapshot.space.spaceId, snapshot.roomThemeDocument.mode, timeZone, snapshot.versionNumber); }
    finally { await refresh(); }
  };
  return <SettingsScreen onLogout={onLogout} version={Constants.expoConfig?.version} offline={state.offline}
    space={snapshot ? { anniversary: formatAnniversary(snapshot.space.anniversaryDate, i18n.language), consent: me?.aiConsentState ?? 'not_given', roomMode: snapshot.roomThemeDocument.mode, timeZone: snapshot.space.timeZone } : null}
    onRoomMode={updateRoomMode} onTimeZone={updateTimeZone}
    onOpenDate={() => router.navigate('/home')} onOpenCover={() => router.navigate({ pathname: '/home', params: { cover: '1' } })} onOpenConsent={() => router.push('/prompt/consent')}
    onOpenReport={() => router.push('/settings/report')} onOpenEndSpace={() => router.push('/settings/end-space')} />;
}
