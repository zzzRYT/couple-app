import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { takePendingInvite } from '../../lib/inviteLink';
import { JoinScreen } from '../../features/onboarding/JoinScreen';
import { useApp } from '../../lib/AppContext';
import { useSpace } from '../../features/space/SpaceContext';
export default function JoinRoute() {
  const { client, supabase, userId } = useApp();
  const { reload, entry } = useSpace();
  const [pending, setPending] = useState<string | null | undefined>(undefined);
  const [myName, setMyName] = useState<string | null>(null);
  useEffect(() => { void takePendingInvite().then(setPending); }, []);
  useEffect(() => {
    if (!userId) return;
    // RLS lets a person read only their own profile row; a failed read just leaves the names row out.
    void supabase.from('user_profile').select('display_name').eq('user_id', userId).maybeSingle().then(({ data }) => setMyName(data?.display_name ?? null), () => undefined);
  }, [supabase, userId]);
  if (pending === undefined) return null;
  return <JoinScreen myName={myName} initialCode={pending} alreadyInSpace={!!pending && entry === 'active'} readClipboard={Clipboard.getStringAsync} onBack={() => router.dismissTo('/choose-space')} previewInvitation={client.previewInvitation} acceptInvitation={client.acceptInvitation}
    onJoined={() => { void reload(); }} onOpenSpace={() => { void reload(); }} />;
}
