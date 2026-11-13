import { router } from 'expo-router';
import { getCalendars } from 'expo-localization';
import { ProfileScreen } from '../../features/onboarding/ProfileScreen';
import { useCreateFlow } from '../../features/onboarding/CreateFlowContext';
import { useApp } from '../../lib/AppContext';
import { useSpace } from '../../features/space/SpaceContext';
import { track } from '../../lib/analytics';
export default function ProfileRoute() {
  const { client } = useApp();
  const { date, setDate } = useCreateFlow();
  const { entry, refresh, reload, queueInviteAfterActivation } = useSpace();
  return <ProfileScreen onBack={entry === 'active' ? undefined : () => router.dismissTo('/create-space')} onSave={async (name, birthday) => {
    await client.saveMemberProfile(name, birthday);
    if (entry === 'active') { await refresh(); track('signup_completed', { path: 'joined_space' }); return; }
    if (!date) throw new Error('Missing start date');
    const zone = getCalendars()[0]?.timeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
    await client.createSpace(date, zone);
    setDate(null); queueInviteAfterActivation(); await reload(); track('signup_completed', { path: 'created_space' });
  }} />;
}
