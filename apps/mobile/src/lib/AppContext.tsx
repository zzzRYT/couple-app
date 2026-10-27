import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { createApi } from './api';
import { createClient, type Client } from './client';
import { createSupabase, functionsCaller } from './supabase';
import { supabaseAuth } from './auth';
import { supabaseRealtime, type RealtimePort } from './realtime';
import type { AuthPort } from '../features/auth/authPort';
type AppValue = { client: Client; auth: AuthPort; realtime: RealtimePort; supabase: ReturnType<typeof createSupabase>; session: Session | null; userId: string | null };
const AppContext = createContext<AppValue | null>(null);
/** Public values only: the Supabase URL and publishable key come from EXPO_PUBLIC_* build variables, never from source. */
export function AppProvider({ children }: { children: ReactNode }) {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL ?? 'http://127.0.0.1:54321';
  const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? '';
  const value = useMemo(() => {
    const supabase = createSupabase(url, key);
    return { supabase, client: createClient(createApi(functionsCaller(supabase, url, key))), auth: supabaseAuth(supabase), realtime: supabaseRealtime(supabase) };
  }, [url, key]);
  const [session, setSession] = useState<Session | null>(null);
  useEffect(() => {
    void value.supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = value.supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => data.subscription.unsubscribe();
  }, [value]);
  return <AppContext.Provider value={{ ...value, session, userId: session?.user.id ?? null }}>{children}</AppContext.Provider>;
}
export function useApp(): AppValue {
  const value = useContext(AppContext);
  if (!value) throw new Error('AppProvider missing');
  return value;
}
