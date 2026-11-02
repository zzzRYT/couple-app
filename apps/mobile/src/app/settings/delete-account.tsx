import { useMemo } from 'react';
import { router } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { DeleteAccountScreen } from '../../features/account/DeleteAccountScreen';
import { clearDeviceAfterDeletion, submitDeletion } from '../../features/account/deleteAccount';
import { lastUsedProvider } from '../../features/settings/logout';
import { useSpace } from '../../features/space/SpaceContext';
import { useApp } from '../../lib/AppContext';
import { clearPendingInvite } from '../../lib/inviteLink';
import { supabaseReauth } from '../../lib/reauth';
import { clearV0LocalData } from '../../features/space/v0LocalData';

/** Pushed over the tabs (S13-delete-*). Once accepted the person is signed out and the entry gate shows the sign-in screen. */
export default function DeleteAccountRoute() {
  const { auth, client, supabase, session, userId, clearSessionExpired } = useApp();
  const { reset, state } = useSpace();
  const reauth = useMemo(() => supabaseReauth(supabase), [supabase]);
  return <DeleteAccountScreen v0 reauth={reauth} provider={lastUsedProvider(session?.user.app_metadata?.provider)}
    onSubmit={(input) => submitDeletion(() => client.deleteAccount(input))}
    onFinished={async (outcome) => {
      if (userId) await clearV0LocalData(userId, state.snapshot?.space.spaceId).catch(() => undefined);
      await clearDeviceAfterDeletion(outcome, { signOut: auth.signOut, cancelNotifications: Notifications.cancelAllScheduledNotificationsAsync, clearPendingInvite, resetSpace: reset });
      clearSessionExpired();
    }}
    onCancel={() => router.back()} />;
}
