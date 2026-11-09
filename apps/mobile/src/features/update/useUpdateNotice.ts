import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Linking } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { isNewer } from './storeVersion';

const CHECK_EVERY_MS = 6 * 60 * 60 * 1000;
const DISMISSED_KEY = 'v0.update.dismissed';
type Deps = { enabled: boolean; installed: string | null; lookup: () => Promise<string | null>; storeUrl: string };
/**
 * V0-11: offers the App Store update when the installed native version is older than the store's. Checks on open and on
 * return to the app, at most every six hours. "나중에" is remembered per store version, so a newer release asks again.
 * An OTA update never changes the native version, so it neither shows nor clears this notice.
 */
export function useUpdateNotice({ enabled, installed, lookup, storeUrl }: Deps) {
  const [latest, setLatest] = useState<string | null>(null);
  const checkedAt = useRef(-Infinity);
  const check = useCallback(async () => {
    if (!enabled || !installed || Date.now() - checkedAt.current < CHECK_EVERY_MS) return;
    checkedAt.current = Date.now();
    const version = await lookup().catch(() => null);
    if (!version || !isNewer(version, installed)) return;
    const dismissed = await SecureStore.getItemAsync(DISMISSED_KEY).catch(() => null);
    if (dismissed !== version) setLatest(version);
  }, [enabled, installed, lookup]);
  useEffect(() => {
    void check();
    const subscription = AppState.addEventListener('change', (next) => { if (next === 'active') void check(); });
    return () => subscription.remove();
  }, [check]);
  const later = useCallback(() => {
    if (latest) void SecureStore.setItemAsync(DISMISSED_KEY, latest).catch(() => undefined);
    setLatest(null);
  }, [latest]);
  // Opening the store is not a dismissal: if the person comes back without updating, a later check asks again.
  const update = useCallback(() => { setLatest(null); void Linking.openURL(storeUrl).catch(() => undefined); }, [storeUrl]);
  return { latest, later, update };
}
