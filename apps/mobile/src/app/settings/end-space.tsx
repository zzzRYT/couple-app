import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EndSpaceScreen } from '../../features/lifecycle/EndSpaceScreen';
import { leaveSpace } from '../../features/lifecycle/leave';
import { useSpace } from '../../features/space/SpaceContext';
import { useApp } from '../../lib/AppContext';
import { useAppColor } from '../../theme/useAppColor';

/** Pushed over the tabs so the tab bar is hidden while the decision is made. The entry gate takes over once the space is gone. */
export default function EndSpaceRoute() {
  const { client, userId } = useApp();
  const { state, reset, reload } = useSpace();
  const color = useAppColor();
  const onEnd = () => leaveSpace({ close: client.endSpace, releaseSession: client.release, snapshot: state.snapshot, userId, resetSpace: reset, reload });
  return <SafeAreaView style={{ flex: 1, backgroundColor: color.bg }}><EndSpaceScreen onEnd={onEnd} onCancel={() => router.back()} /></SafeAreaView>;
}
