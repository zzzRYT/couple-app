import { Redirect, router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EndedScreen } from '../features/lifecycle/EndedScreen';
import { partnerLabel } from '../features/prompt/PromptPanel';
import { useSpace } from '../features/space/SpaceContext';
import { useApp } from '../lib/AppContext';
import { useAppColor } from '../theme/useAppColor';

/** Notice for an ended space. Acknowledging it clears it on the server, then the person starts over from the create-or-join choice. */
export default function EndedRoute() {
  const { t } = useTranslation();
  const { client } = useApp();
  const { ended, entry, reload } = useSpace();
  const color = useAppColor();
  if (!ended) return <Redirect href="/" />;
  const hasActiveSpace = entry === 'active';
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.bg }}>
      <EndedScreen ended={ended} hasActiveSpace={hasActiveSpace} partnerName={partnerLabel(t)}
        onContinue={async () => { await client.ackEnded(); await reload(); router.replace(hasActiveSpace ? '/' : '/choose-space'); }} />
    </SafeAreaView>
  );
}
