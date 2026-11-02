import { Stack } from 'expo-router';
import { FlowBackProvider } from '../../ui/FlowBack';
import { CreateFlowProvider } from '../../features/onboarding/CreateFlowContext';

/** The screen scaffold owns the safe area and the visible back control. */
export default function Layout() {
  return <CreateFlowProvider><FlowBackProvider><Stack screenOptions={{ headerShown: false, gestureEnabled: false }} /></FlowBackProvider></CreateFlowProvider>;
}
