import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { useApp } from '../../lib/AppContext';
import { useSpaceSnapshot } from './useSpaceSnapshot';
type SpaceValue = ReturnType<typeof useSpaceSnapshot> & { inviteAfterActivation: boolean; queueInviteAfterActivation: () => void; clearInviteAfterActivation: () => void };
const SpaceContext = createContext<SpaceValue | null>(null);
export function SpaceProvider({ children }: { children: ReactNode }) {
  const { client, realtime, userId } = useApp();
  const value = useSpaceSnapshot({ client, realtime });
  const [inviteAfterActivation, setInviteAfterActivation] = useState(false);
  const { reload } = value;
  useEffect(() => { if (userId) void reload(); }, [userId, reload]);
  const queueInviteAfterActivation = useCallback(() => setInviteAfterActivation(true), []);
  const clearInviteAfterActivation = useCallback(() => setInviteAfterActivation(false), []);
  const reset = useCallback(() => { value.reset(); setInviteAfterActivation(false); }, [value.reset]);
  return <SpaceContext.Provider value={{ ...value, reset, inviteAfterActivation, queueInviteAfterActivation, clearInviteAfterActivation }}>{children}</SpaceContext.Provider>;
}
export function useSpace(): SpaceValue {
  const value = useContext(SpaceContext);
  if (!value) throw new Error('SpaceProvider missing');
  return value;
}
