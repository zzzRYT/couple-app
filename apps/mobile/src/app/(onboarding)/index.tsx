import { useEffect, useState } from 'react';
import JoinRoute from './join';
import { peekPendingInvite } from '../../lib/inviteLink';
import { Redirect } from 'expo-router';

export default function OnboardingIndex() {
  const [pending, setPending] = useState<string | null | undefined>(undefined);
  useEffect(() => { void peekPendingInvite().then(setPending); }, []);
  if (pending === undefined) return null;
  if (pending) return <JoinRoute />;
  return <Redirect href="/choose-space" />;
}
