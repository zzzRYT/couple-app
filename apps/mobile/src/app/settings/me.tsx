import { router } from 'expo-router';
import { ProfileScreen } from '../../features/onboarding/ProfileScreen';
import { useApp } from '../../lib/AppContext';
import { useSpace } from '../../features/space/SpaceContext';
export default function MeRoute() {
  const { client } = useApp(); const { state, refresh } = useSpace(); const me = state.snapshot?.me;
  if (!me || state.offline) return null;
  return <ProfileScreen editing initialName={me.displayName ?? ''} initialBirthday={me.birthday} onBack={() => router.back()} onSave={async (name, birthday) => { await client.saveMemberProfile(name, birthday); await refresh(); router.back(); }} />;
}
