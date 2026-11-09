import { Stack } from 'expo-router';
import { V0_FEATURES } from '../config/features';
import type { AppGate } from './appGate';

/**
 * Gates whose screen is not an index route. Without a target, a screen that became guarded falls back to the open route
 * with the shortest name, which for these gates is auth-callback: a mail-link loader that never ends without a link.
 */
function gateScreen(gate: AppGate['kind']): '/set-password-prompt' | '/new-password' | undefined {
  if (gate === 'needsPasswordPrompt') return '/set-password-prompt';
  if (gate === 'passwordRecovery') return '/new-password';
  return undefined;
}

/** The root stack: each gate opens only its own screens; invite links and the auth callback stay reachable in every state. */
export function AppStack({ gate }: { gate: AppGate['kind'] }) {
  const redirectTo = gateScreen(gate);
  return <Stack screenOptions={{ headerShown: false }}>
    <Stack.Screen name="i/[code]" />
    <Stack.Screen name="invite/[code]" />
    <Stack.Screen name="auth-callback" options={{ gestureEnabled: false }} />
    <Stack.Protected guard={gate === 'passwordRecovery'} redirectTo={redirectTo}><Stack.Screen name="new-password" options={{ gestureEnabled: false }} /></Stack.Protected>
    <Stack.Protected guard={gate === 'needsPasswordPrompt'} redirectTo={redirectTo}><Stack.Screen name="set-password-prompt" options={{ gestureEnabled: false }} /></Stack.Protected>
    <Stack.Protected guard={gate === 'signedOut' || gate === 'sessionExpired'} redirectTo={redirectTo}><Stack.Screen name="(auth)" options={{ gestureEnabled: false }} /></Stack.Protected>
    <Stack.Protected guard={gate === 'needsOnboardingChoice' || gate === 'needsProfile'} redirectTo={redirectTo}><Stack.Screen name="(onboarding)" options={{ gestureEnabled: false }} /></Stack.Protected>
    <Stack.Protected guard={gate === 'ended'} redirectTo={redirectTo}><Stack.Screen name="ended" /></Stack.Protected>
    <Stack.Protected guard={gate === 'active'} redirectTo={redirectTo}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="anniversary/[key]" />
      <Stack.Screen name="anniversary-edit" options={{ presentation: 'fullScreenModal', gestureEnabled: false }} />
      <Stack.Screen name="invite" />
      <Stack.Screen name="connected" />
      <Stack.Screen name="notify-intro" options={{ gestureEnabled: false }} />
      <Stack.Screen name="join-has-space" />
      <Stack.Screen name="connect-code" />
      <Stack.Screen name="settings/connect" />
      <Stack.Screen name="settings/end-space" />
      <Stack.Screen name="settings/me" />
      <Stack.Screen name="settings/start-date" />
      <Stack.Screen name="settings/notifications" />
      <Stack.Screen name="settings/language" />
      <Stack.Screen name="settings/appearance" />
      <Stack.Screen name="settings/disconnect" />
      <Stack.Screen name="settings/security" />
      <Stack.Screen name="settings/change-password" />
      <Stack.Screen name="settings/set-password" />
    </Stack.Protected>
    <Stack.Protected guard={gate === 'active' && V0_FEATURES.prompt} redirectTo={redirectTo}><Stack.Screen name="prompt/index" options={{ presentation: 'modal' }} /><Stack.Screen name="prompt/consent" options={{ presentation: 'modal' }} /></Stack.Protected>
    <Stack.Protected guard={gate === 'active' && V0_FEATURES.reportBlock} redirectTo={redirectTo}><Stack.Screen name="settings/report" /></Stack.Protected>
    {/* Any signed-in state: the space may end (realtime) while the deletion is in flight, and the screen must stay mounted. */}
    <Stack.Protected guard={gate === 'active' || gate === 'needsOnboardingChoice' || gate === 'ended'} redirectTo={redirectTo}><Stack.Screen name="settings/delete-account" /><Stack.Screen name="settings/reset-password" /></Stack.Protected>
  </Stack>;
}
