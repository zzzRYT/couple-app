import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { leaveSpace } from '../../features/lifecycle/leave';
import { ReportScreen } from '../../features/report/ReportScreen';
import { useSpace } from '../../features/space/SpaceContext';
import { profilesOf } from '../../features/space/profiles';
import { useApp } from '../../lib/AppContext';

/** "Report or disconnect": reporting never ends the space; disconnecting is its own confirmed action. Opened with `messageId` from a chat message. */
export default function ReportRoute() {
  const { t } = useTranslation();
  const { client, userId } = useApp();
  const { state, spaceId, reset, reload } = useSpace();
  const { messageId } = useLocalSearchParams<{ messageId?: string }>();
  const onDisconnect = () => leaveSpace({ close: client.disconnect, releaseSession: client.release, snapshot: state.snapshot, userId, resetSpace: reset, reload });
  return (
    <ReportScreen partnerName={state.snapshot ? profilesOf(state.snapshot, t).partner.name : t('home.pending.partner')} {...(messageId ? { initialTarget: 'shared_text' as const, messageId } : {})}
        onSubmit={async (input) => { if (!spaceId) throw new Error('NO_SPACE'); await client.submitReport(spaceId, input); }}
        onDisconnect={onDisconnect} onDone={() => router.back()} />
  );
}
