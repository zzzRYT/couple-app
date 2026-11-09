import { useEffect, useMemo, useState } from 'react';
import { router } from 'expo-router';
import { DeleteAccountScreen } from '../../features/account/DeleteAccountScreen';
import { clearDeviceAfterDeletion, submitDeletion } from '../../features/account/deleteAccount';
import { cancelAllNotifications } from '../../features/notifications/scheduler';
import { lastUsedProvider } from '../../features/settings/logout';
import { useSpace } from '../../features/space/SpaceContext';
import { useApp } from '../../lib/AppContext';
import { usePassword } from '../../features/auth/PasswordContext';
import { clearPendingInvite } from '../../lib/inviteLink';
import { supabaseReauth } from '../../lib/reauth';
import { clearV0LocalData } from '../../features/space/v0LocalData';
import { clearWidgets } from '../../features/widgets/writer';

/** Pushed over the tabs (S13-delete-*). Once accepted the person is signed out and the entry gate shows the sign-in screen. */
export default function DeleteAccountRoute() {
  const { auth, client, password, supabase, session, userId, clearSessionExpired } = useApp();
  const { state: credentials, apple } = usePassword();
  const [mail, setMail] = useState(false);
  useEffect(() => { void password.mailConnected().then(setMail); }, [password]);
  const { reset, state } = useSpace();
  const reauth = useMemo(() => supabaseReauth(supabase), [supabase]);
  // Unknown credentials fall back to what the account must have: an email account can only have a password.
  const held = { hasPassword: credentials?.hasPassword ?? !apple, apple, email: credentials?.email ?? session?.user.email ?? null, mail, password };
  return <DeleteAccountScreen v0 reauth={reauth} provider={lastUsedProvider(session?.user.app_metadata?.provider)} credentials={held}
    onSubmit={(input) => submitDeletion(() => client.deleteAccount(input))}
    onFinished={async (outcome) => {
      if (userId) await clearV0LocalData(userId, state.snapshot?.space.spaceId).catch(() => undefined);
      await clearDeviceAfterDeletion(outcome, { signOut: auth.signOut, cancelNotifications: cancelAllNotifications, clearWidgets: () => clearWidgets('none'), clearPendingInvite, resetSpace: reset });
      clearSessionExpired();
    }}
    onCancel={() => router.back()} />;
}
