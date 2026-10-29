import { useEffect } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { parseInvite, savePendingInvite } from './inviteLink';
import { useSpace } from '../features/space/SpaceContext';
/** Both platform links and the development scheme enter through this route. */
export function InviteLinkRoute() {
  const { entry } = useSpace();
  const { code } = useLocalSearchParams<{ code?: string }>();
  useEffect(() => {
    const parsed = typeof code === 'string' ? parseInvite(code) : null;
    void (async () => { if (parsed) await savePendingInvite(parsed); router.replace(entry === 'active' ? '/join-has-space' : '/join'); })();
  }, [code, entry]);
  return null;
}
