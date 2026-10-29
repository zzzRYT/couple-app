import { useEffect, useState } from 'react';
import { SpaceChoiceScreen } from '../../features/onboarding/SpaceChoiceScreen';
import JoinRoute from './join';
import { peekPendingInvite } from '../../lib/inviteLink';
import { router } from 'expo-router';

export default function OnboardingIndex() {
  const [pending, setPending] = useState<string | null | undefined>(undefined);
  useEffect(() => { void peekPendingInvite().then(setPending); }, []);
  if (pending === undefined) return null;
  if (pending) return <JoinRoute />;
  return <SpaceChoiceScreen onCreate={() => router.push('/create-space')} onJoin={() => router.push('/join')} />;
}
