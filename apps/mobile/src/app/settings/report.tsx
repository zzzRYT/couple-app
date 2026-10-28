import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { leaveSpace } from '../../features/lifecycle/leave';
import { partnerLabel } from '../../features/prompt/PromptPanel';
import { ReportScreen } from '../../features/report/ReportScreen';
import { useSpace } from '../../features/space/SpaceContext';
import { useApp } from '../../lib/AppContext';
import { useAppColor } from '../../theme/useAppColor';

/** "Report or disconnect": reporting never ends the space; disconnecting is its own confirmed action. Opened with `messageId` from a chat message. */
export default function ReportRoute() {
  const { t } = useTranslation();
  const { client, userId } = useApp();
  const { state, spaceId, reset, reload } = useSpace();
  const { messageId } = useLocalSearchParams<{ messageId?: string }>();
  const color = useAppColor();
  const onDisconnect = () => leaveSpace({ close: client.disconnect, releaseSession: client.release, snapshot: state.snapshot, userId, resetSpace: reset, reload });
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.bg }}>
      <ReportScreen partnerName={partnerLabel(t)} {...(messageId ? { initialTarget: 'shared_text' as const, messageId } : {})}
        onSubmit={async (input) => { if (!spaceId) throw new Error('NO_SPACE'); await client.submitReport(spaceId, input); }}
        onDisconnect={onDisconnect} onDone={() => router.back()} />
    </SafeAreaView>
  );
}
