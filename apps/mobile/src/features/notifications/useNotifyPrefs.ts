import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { notificationPermission, requestNotificationPermission, type NotifyPermission } from './permissions';
import { DEFAULT_NOTIFY_PREFS, readNotifyPrefs, subscribeNotifyPrefs, updateNotifyPrefs, type NotifyPrefs } from './preferences';
import { cancelV0Notifications } from './scheduler';

/** This device's preferences for this user, kept current across screens. */
export function useNotifyPrefs(userId: string | null) {
  const [prefs, setPrefs] = useState(DEFAULT_NOTIFY_PREFS);
  useEffect(() => {
    if (!userId) return;
    let active = true;
    const load = () => { void readNotifyPrefs(userId).then((value) => { if (active) setPrefs(value); }); };
    load();
    const stop = subscribeNotifyPrefs(load);
    return () => { active = false; stop(); };
  }, [userId]);
  return prefs;
}
/** Preferences plus the OS permission, re-read on foreground because the person may have just come back from iOS Settings. */
export function useNotifySettings(userId: string | null) {
  const prefs = useNotifyPrefs(userId);
  const [permission, setPermission] = useState<NotifyPermission>('undetermined');
  useEffect(() => {
    let active = true;
    const check = () => { void notificationPermission().then((value) => { if (active) setPermission(value); }).catch(() => undefined); };
    check();
    const foreground = AppState.addEventListener('change', (status) => { if (status === 'active') check(); });
    return () => { active = false; foreground.remove(); };
  }, []);
  const update = useCallback((patch: Partial<NotifyPrefs>) => { if (userId) void updateNotifyPrefs(userId, patch).catch(() => undefined); }, [userId]);
  const setEnabled = useCallback(async (enabled: boolean) => {
    if (!userId) return;
    try {
      if (enabled && permission !== 'granted') {
        const granted = await requestNotificationPermission();
        setPermission(await notificationPermission());
        if (!granted) return;
      }
      await updateNotifyPrefs(userId, { enabled });
      if (!enabled) await cancelV0Notifications();
    } catch { /* The switch keeps showing what was stored. */ }
  }, [userId, permission]);
  return { prefs, permission, denied: permission === 'denied', update, setEnabled };
}
