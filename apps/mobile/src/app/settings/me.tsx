import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ProfileScreen } from '../../features/onboarding/ProfileScreen';
import { useApp } from '../../lib/AppContext';
import { useSpace } from '../../features/space/SpaceContext';
export default function MeRoute() {
  const { t } = useTranslation(); const { client } = useApp(); const { state, refresh } = useSpace(); const me = state.snapshot?.me;
  if (!me || state.offline) return null;
  const partner = state.snapshot?.members.find((member) => member.userId !== me.userId);
  return <ProfileScreen partnerWait={partner?.hasBirthday === false ? t('set.me.birthday.partnerWait', { name: partner.displayName ?? t('home.pending.partner') }) : undefined} editing initialName={me.displayName ?? ''} initialBirthday={me.birthday} onBack={() => router.back()} onSave={async (name, birthday) => { await client.saveMemberProfile(name, birthday); await refresh(); router.back(); }} />;
}
