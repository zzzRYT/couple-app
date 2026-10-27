import { router } from 'expo-router';
import { ConsentScreen } from '../../features/consent/ConsentScreen';
import { useApp } from '../../lib/AppContext';
import { useSpace } from '../../features/space/SpaceContext';
export default function ConsentRoute() {
  const { client } = useApp();
  const { state, spaceId, refresh } = useSpace();
  const me = state.snapshot?.members.find((member) => member.userId === state.snapshot?.me.userId);
  return <ConsentScreen myState={me?.aiConsentState ?? 'not_given'} setConsent={async (next) => { await client.setConsent(spaceId ?? '', next); await refresh(); }} onDone={() => router.back()} />;
}
