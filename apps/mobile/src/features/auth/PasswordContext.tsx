import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useApp } from '../../lib/AppContext';
import type { PasswordState } from './passwordPort';

type Value = {
  /** `undefined` while loading, `null` when it could not be read. */
  state: PasswordState | null | undefined;
  /** An Apple account with an email, no password and no earlier answer: V0-auth-setpw-prompt or the sheet on home. */
  shouldPrompt: boolean | undefined;
  /** A mail link opened a session that must set a new password first (V0-auth-newpw). */
  recovery: boolean;
  setRecovery: (value: boolean) => void;
  apple: boolean;
  reload: () => Promise<void>;
  markPromptSeen: () => Promise<void>;
};
const PasswordContext = createContext<Value | null>(null);
export function isAppleAccount(metadata: { provider?: unknown; providers?: unknown } | undefined): boolean {
  return metadata?.provider === 'apple' || (Array.isArray(metadata?.providers) && metadata.providers.includes('apple'));
}
/** Loads once per signed-in account. A failed read never blocks the app: the prompt simply does not appear. */
export function PasswordProvider({ children }: { children: ReactNode }) {
  const { password, userId, session } = useApp();
  const [state, setState] = useState<PasswordState | null | undefined>(undefined);
  const [recovery, setRecovery] = useState(false);
  const reload = useCallback(async () => {
    setState(await password.state().catch(() => null));
  }, [password]);
  useEffect(() => {
    setState(undefined);
    if (userId) void reload(); else setRecovery(false);
  }, [userId, reload]);
  const apple = isAppleAccount(session?.user.app_metadata);
  const value = useMemo<Value>(() => ({
    state, recovery, setRecovery, apple, reload,
    shouldPrompt: state === undefined ? undefined : !!state && apple && !state.hasPassword && !state.promptSeen && !!state.email,
    async markPromptSeen() {
      setState((current) => current && { ...current, promptSeen: true });
      await password.promptSeen().catch(() => undefined);
    },
  }), [state, recovery, apple, reload, password]);
  return <PasswordContext.Provider value={value}>{children}</PasswordContext.Provider>;
}
export function usePassword(): Value {
  const value = useContext(PasswordContext);
  if (!value) throw new Error('PasswordProvider missing');
  return value;
}
