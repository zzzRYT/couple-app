import { Stack } from 'expo-router';
import { V0_FEATURES } from '../config/features';
import type { AppGate } from './appGate';

/** The root stack: each gate opens only its own screens; invite links and the auth callback stay reachable in every state. */
export function AppStack({ gate }: { gate: AppGate['kind'] }) {
  return <Stack screenOptions={{ headerShown: false }}>
    <Stack.Screen name="i/[code]" />
    <Stack.Screen name="invite/[code]" />
    <Stack.Screen name="auth-callback" options={{ gestureEnabled: false }} />
    <Stack.Protected guard={gate === 'passwordRecovery'}><Stack.Screen name="new-password" options={{ gestureEnabled: false }} /></Stack.Protected>
    <Stack.Protected guard={gate === 'needsPasswordPrompt'}><Stack.Screen name="set-password-prompt" options={{ gestureEnabled: false }} /></Stack.Protected>
    <Stack.Protected guard={gate === 'signedOut' || gate === 'sessionExpired'}><Stack.Screen name="(auth)" options={{ gestureEnabled: false }} /></Stack.Protected>
    <Stack.Protected guard={gate === 'needsOnboardingChoice' || gate === 'needsProfile'}><Stack.Screen name="(onboarding)" options={{ gestureEnabled: false }} /></Stack.Protected>
    <Stack.Protected guard={gate === 'ended'}><Stack.Screen name="ended" /></Stack.Protected>
    <Stack.Protected guard={gate === 'active'}>
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
    <Stack.Protected guard={gate === 'active' && V0_FEATURES.prompt}><Stack.Screen name="prompt/index" options={{ presentation: 'modal' }} /><Stack.Screen name="prompt/consent" options={{ presentation: 'modal' }} /></Stack.Protected>
    <Stack.Protected guard={gate === 'active' && V0_FEATURES.reportBlock}><Stack.Screen name="settings/report" /></Stack.Protected>
    {/* Any signed-in state: the space may end (realtime) while the deletion is in flight, and the screen must stay mounted. */}
    <Stack.Protected guard={gate === 'active' || gate === 'needsOnboardingChoice' || gate === 'ended'}><Stack.Screen name="settings/delete-account" /><Stack.Screen name="settings/reset-password" /></Stack.Protected>
  </Stack>;
}
