import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import * as Application from 'expo-application';
import { supabaseTarget } from '../config/supabase';
import { createApi } from './api';
import { createClient, type Client } from './client';
import { createSupabase, functionsCaller } from './supabase';
import { supabaseAuth } from './auth';
import { supabaseRealtime, type RealtimePort } from './realtime';
import type { AuthPort } from '../features/auth/authPort';
import { passwordPort, type PasswordPort } from '../features/auth/passwordPort';
import { posthog } from '../config/posthog';
type AppValue = { client: Client; auth: AuthPort; password: PasswordPort; realtime: RealtimePort; supabase: ReturnType<typeof createSupabase>; session: Session | null; sessionLoaded: boolean; sessionExpired: boolean; clearSessionExpired: () => void; userId: string | null };
const AppContext = createContext<AppValue | null>(null);
/** Public values only: the Supabase URL and publishable key come from EXPO_PUBLIC_* build variables, never from source; the native bundle id picks which. */
export function AppProvider({ children }: { children: ReactNode }) {
  const { url, key } = supabaseTarget(Application.applicationId, {
    url: process.env.EXPO_PUBLIC_SUPABASE_URL,
    key: process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    prodUrl: process.env.EXPO_PUBLIC_SUPABASE_PROD_URL,
    prodKey: process.env.EXPO_PUBLIC_SUPABASE_PROD_PUBLISHABLE_KEY,
  });
  const [sessionLoaded, setSessionLoaded] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [sessionExpired, setSessionExpired] = useState(false);
  const identifiedUserId = useRef<string | null | undefined>(undefined);
  const syncPostHogIdentity = (nextSession: Session | null) => {
    const nextUserId = nextSession?.user.id ?? null;
    if (nextUserId === identifiedUserId.current) return;

    if (!nextUserId) {
      if (identifiedUserId.current) posthog?.reset();
      identifiedUserId.current = null;
      return;
    }

    if (identifiedUserId.current) posthog?.reset();
    posthog?.identify(nextUserId, nextSession?.user.email ? { email: nextSession.user.email } : undefined);
    identifiedUserId.current = nextUserId;
  };
  const value = useMemo(() => {
    const supabase = createSupabase(url, key);
    const caller = functionsCaller(supabase, url, key, () => setSessionExpired(true));
    const client = createClient(createApi(caller));
    const auth = supabaseAuth(supabase, (code) => void client.storeAppleToken(code).catch(() => undefined));
    return { supabase, client, auth, password: passwordPort(supabase, client), realtime: supabaseRealtime(supabase) };
  }, [url, key]);
  useEffect(() => {
    void value.supabase.auth.getSession().then(({ data }) => {
      syncPostHogIdentity(data.session);
      setSession(data.session);
    }).finally(() => setSessionLoaded(true));
    const { data } = value.supabase.auth.onAuthStateChange((event, next) => {
      syncPostHogIdentity(next);
      setSession(next);
      if (event === 'SIGNED_IN') setSessionExpired(false);
    });
    return () => data.subscription.unsubscribe();
  }, [value]);
  return <AppContext.Provider value={{ ...value, session, sessionLoaded, sessionExpired, clearSessionExpired: () => setSessionExpired(false), userId: session?.user.id ?? null }}>{children}</AppContext.Provider>;
}
export function useApp(): AppValue {
  const value = useContext(AppContext);
  if (!value) throw new Error('AppProvider missing');
  return value;
}
