import { createContext, useCallback, useContext, useEffect, useRef, type ReactNode } from 'react';
import { BackHandler } from 'react-native';
import { useFocusEffect } from 'expo-router';

type Register = (action?: () => void) => void;
const BackContext = createContext<Register | null>(null);

/** One Android handler per flow: a missing action means the current step cannot go back. */
export function FlowBackProvider({ children }: { children: ReactNode }) {
  const action = useRef<(() => void) | undefined>(undefined);
  const register = useCallback<Register>((next) => { action.current = next; }, []);
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => { action.current?.(); return true; });
    return () => subscription.remove();
  }, []);
  return <BackContext.Provider value={register}>{children}</BackContext.Provider>;
}

function FocusedAction({ register, onBack }: { register: Register; onBack?: () => void }) {
  useFocusEffect(useCallback(() => {
    register(onBack);
    return () => register(undefined);
  }, [register, onBack]));
  return null;
}

/** Mirrors the visible Screen control while its route is focused. */
export function FlowBackAction({ onBack }: { onBack?: () => void }) {
  const register = useContext(BackContext);
  return register ? <FocusedAction register={register} onBack={onBack} /> : null;
}
