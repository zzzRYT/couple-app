import { useEffect } from 'react';
import { AppState } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { AnniversaryInput } from '../../lib/anniversaries';
import { useApp } from '../../lib/AppContext';
import { useSpace } from '../space/SpaceContext';
import { subscribeNotifyPrefs } from './preferences';
import { resyncNotifications } from './scheduler';

const DEBOUNCE_MS = 500;
/**
 * The one place that reacts to "the data changed": the dates in the snapshot, device preferences (including a newly granted
 * permission), language and the app coming back to the foreground. Nothing runs without an active space for this user.
 */
export function useNotificationSync() {
  const { userId } = useApp();
  const { entry, spaceId, state } = useSpace();
  const { i18n } = useTranslation();
  const snapshot = entry === 'active' && state.snapshot?.space.spaceId === spaceId && state.snapshot?.me.userId === userId ? state.snapshot : null;
  const partner = snapshot?.members.find((member) => member.userId !== snapshot.me.userId);
  const dates = snapshot && JSON.stringify({
    startDate: snapshot.space.anniversaryDate, timeZone: snapshot.space.timeZone, me: { birthday: snapshot.me.birthday },
    partner: partner ? { birthday: partner.birthday, displayName: partner.displayName } : null,
    customs: snapshot.anniversaries.map(({ id, title, date, repeat }) => ({ id, title, date, repeat })),
  });
  useEffect(() => {
    if (!userId || !dates) return;
    const input = JSON.parse(dates) as AnniversaryInput;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const sync = () => {
      clearTimeout(timer);
      timer = setTimeout(() => { void resyncNotifications(userId, input, (key, vars) => i18n.t(key, vars), new Date().toISOString()).catch(() => undefined); }, DEBOUNCE_MS);
    };
    sync();
    const stopPrefs = subscribeNotifyPrefs(sync);
    const foreground = AppState.addEventListener('change', (status) => { if (status === 'active') sync(); });
    i18n.on('languageChanged', sync);
    return () => { clearTimeout(timer); stopPrefs(); foreground.remove(); i18n.off('languageChanged', sync); };
  }, [userId, dates, i18n]);
}
