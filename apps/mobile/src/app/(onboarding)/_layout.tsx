import { Stack } from 'expo-router';
import { FlowBackProvider } from '../../ui/FlowBack';

/** The screen scaffold owns the safe area and the visible back control. */
export default function Layout() {
  return <FlowBackProvider><Stack screenOptions={{ headerShown: false, gestureEnabled: false }} /></FlowBackProvider>;
}
