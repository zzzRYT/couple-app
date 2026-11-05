import { useEffect, useState } from 'react';
import JoinRoute from './join';
import { peekPendingInvite } from '../../lib/inviteLink';
import { Redirect } from 'expo-router';
import { useSpace } from '../../features/space/SpaceContext';

export default function OnboardingIndex() {
  const [pending, setPending] = useState<string | null | undefined>(undefined);
  const { entry, state } = useSpace();
  useEffect(() => { void peekPendingInvite().then(setPending); }, []);
  if (pending === undefined) return null;
  if (entry === 'active' && state.snapshot?.me.displayName == null) return <Redirect href="/profile" />;
  if (pending) return <JoinRoute />;
  return <Redirect href="/choose-space" />;
}
