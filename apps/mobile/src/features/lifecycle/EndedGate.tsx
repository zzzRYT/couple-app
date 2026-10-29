import { useEffect, useRef } from 'react';
import { router } from 'expo-router';
import { useApp } from '../../lib/AppContext';
import { useSpace } from '../space/SpaceContext';

/** When the space that was open stops being active (the partner ended it, or this user did), go back through the entry screen once. */
export function EndedGate() {
  const { userId } = useApp();
  const { entry } = useSpace();
  const wasActive = useRef(false);
  useEffect(() => { wasActive.current = false; }, [userId]);
  useEffect(() => {
    if (entry === 'active') wasActive.current = true;
    else if (wasActive.current && (entry === 'ended' || entry === 'none')) { wasActive.current = false; router.replace('/'); }
  }, [entry]);
  return null;
}
