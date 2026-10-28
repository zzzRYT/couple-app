import { useEffect } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { parseInvite, savePendingInvite } from './inviteLink';
/** Both platform links and the development scheme enter through this route. */
export function InviteLinkRoute() {
  const { code } = useLocalSearchParams<{ code?: string }>();
  useEffect(() => {
    const parsed = typeof code === 'string' ? parseInvite(code) : null;
    void (async () => { if (parsed) await savePendingInvite(parsed); router.replace('/'); })();
  }, [code]);
  return null;
}
