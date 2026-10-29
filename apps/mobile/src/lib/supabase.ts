import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
const secureStorage = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};
export function createSupabase(url: string, publishableKey: string) {
  return createClient(url, publishableKey, { auth: { storage: secureStorage, autoRefreshToken: true, persistSession: true, detectSessionInUrl: false } });
}

/** Invoke local or owner-configured Functions without embedding credentials in source. */
export function functionsCaller(client: ReturnType<typeof createSupabase>, url: string, publishableKey: string, onUnauthorized?: () => void) {
  return async (path: string, request: RequestInit): Promise<Response> => {
    const { data: { session } } = await client.auth.getSession();
    const headers = new Headers(request.headers);
    headers.set('apikey', publishableKey);
    if (session?.access_token) headers.set('Authorization', `Bearer ${session.access_token}`);
    const response = await fetch(`${url.replace(/\/$/, '')}/functions/v1/${path.replace(/^\//, '')}`, { ...request, headers });
    if (response.status === 401 && session) onUnauthorized?.();
    return response;
  };
}
