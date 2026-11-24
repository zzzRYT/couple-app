import { useEffect } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { parseInvite, savePendingInvite } from '../../lib/inviteLink';
import { useSpace } from '../space/SpaceContext';
import { track } from '../../lib/analytics';
/** Both platform links and the development scheme enter through this route. */
export function InviteLinkRoute() {
  const { entry } = useSpace();
  const { code } = useLocalSearchParams<{ code?: string }>();
  useEffect(() => {
    const parsed = typeof code === 'string' ? parseInvite(code) : null;
    void (async () => {
      if (!parsed) { router.replace('/'); return; }
      await savePendingInvite(parsed);
      router.replace(entry === 'active' ? '/join-has-space' : '/join');
    })();
  }, [code, entry]);
  useEffect(() => { if (typeof code === 'string' && parseInvite(code)) track('invite_opened'); }, [code]);
  return null;
}
