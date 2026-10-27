import { createContext, useContext, useEffect, type ReactNode } from 'react';
import { useApp } from '../../lib/AppContext';
import { useSpaceSnapshot } from './useSpaceSnapshot';
type SpaceValue = ReturnType<typeof useSpaceSnapshot>;
const SpaceContext = createContext<SpaceValue | null>(null);
export function SpaceProvider({ children }: { children: ReactNode }) {
  const { client, realtime, userId } = useApp();
  const value = useSpaceSnapshot({ client, realtime });
  const { reload } = value;
  useEffect(() => { if (userId) void reload(); }, [userId, reload]);
  return <SpaceContext.Provider value={value}>{children}</SpaceContext.Provider>;
}
export function useSpace(): SpaceValue {
  const value = useContext(SpaceContext);
  if (!value) throw new Error('SpaceProvider missing');
  return value;
}
