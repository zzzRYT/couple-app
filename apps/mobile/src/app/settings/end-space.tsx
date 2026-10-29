import { router } from 'expo-router';
import { EndSpaceScreen } from '../../features/lifecycle/EndSpaceScreen';
import { leaveSpace } from '../../features/lifecycle/leave';
import { useSpace } from '../../features/space/SpaceContext';
import { useApp } from '../../lib/AppContext';

/** Pushed over the tabs so the tab bar is hidden while the decision is made. The entry gate takes over once the space is gone. */
export default function EndSpaceRoute() {
  const { client, userId } = useApp();
  const { state, reset, reload } = useSpace();
  const onEnd = () => leaveSpace({ close: client.endSpace, releaseSession: client.release, snapshot: state.snapshot, userId, resetSpace: reset, reload });
  return <EndSpaceScreen onEnd={onEnd} onCancel={() => router.back()} />;
}
