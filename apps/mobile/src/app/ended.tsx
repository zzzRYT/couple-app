import { useTranslation } from 'react-i18next';
import { EndedScreen } from '../features/lifecycle/EndedScreen';
import { partnerLabel } from '../features/prompt/PromptPanel';
import { useSpace } from '../features/space/SpaceContext';
import { useApp } from '../lib/AppContext';

/** Notice for an ended space. Acknowledging it clears it on the server, then the person starts over from the create-or-join choice. */
export default function EndedRoute() {
  const { t } = useTranslation();
  const { client } = useApp();
  const { ended, entry, reload } = useSpace();
  const hasActiveSpace = entry === 'active';
  if (!ended) return null;
  return (
    <EndedScreen ended={ended} hasActiveSpace={hasActiveSpace} partnerName={partnerLabel(t)}
        onContinue={async () => { await client.ackEnded(); await reload(); }} />
  );
}
