import { useEffect } from 'react';
import { AppState } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { AnniversaryInput } from '../../lib/anniversaries';
import { useApp } from '../../lib/AppContext';
import { useSpace } from '../space/SpaceContext';
import type { WidgetData } from '../widgets/snapshot';
import { syncWidgets, widgetGeneration } from '../widgets/writer';
import { subscribeNotifyPrefs } from './preferences';
import { resyncNotifications } from './scheduler';

const DEBOUNCE_MS = 500;
/**
 * The one place that reacts to "the data changed": the dates in the snapshot, device preferences (including a newly granted
 * permission), language and the app coming back to the foreground. Reminders need an active space for this user; widgets also
 * follow the signed-out, no-space and ended states, and keep what they last showed while the entry is unknown (booting, offline).
 * Whoever ends the space sees no space at once; only the partner sees it ended, until they acknowledge the notice.
 */
export function useNotificationSync() {
  const { userId, sessionLoaded } = useApp();
  const { entry, ended, spaceId, state } = useSpace();
  const { i18n } = useTranslation();
  const snapshot = entry === 'active' && state.snapshot?.space.spaceId === spaceId && state.snapshot?.me.userId === userId ? state.snapshot : null;
  const partner = snapshot?.members.find((member) => member.userId !== snapshot.me.userId);
  const dates = snapshot && JSON.stringify({
    startDate: snapshot.space.anniversaryDate, timeZone: snapshot.space.timeZone, me: { birthday: snapshot.me.birthday },
    partner: partner ? { birthday: partner.birthday, displayName: partner.displayName } : null,
    customs: snapshot.anniversaries.map(({ id, title, date, repeat }) => ({ id, title, date, repeat })),
  });
  const closed = !userId ? (sessionLoaded ? 'none' : null) : entry === 'ended' ? (ended?.by === 'me' ? 'none' : 'ended') : entry === 'none' ? 'none' : null;
  const widget = snapshot ? JSON.stringify({
    state: snapshot.space.memberCount < 2 ? 'pending' : 'normal', spaceId: snapshot.space.spaceId, names: { me: snapshot.me.displayName, partner: partner?.displayName ?? null },
  }) : closed && JSON.stringify({ state: closed });
  useEffect(() => {
    if (!widget) return;
    const input = dates ? JSON.parse(dates) as AnniversaryInput : null;
    const data = { ...JSON.parse(widget), dates: input } as WidgetData;
    const opened = widgetGeneration();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const sync = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        if (userId && input) void resyncNotifications(userId, input, (key, vars) => i18n.t(key, vars), new Date().toISOString()).catch(() => undefined);
        void syncWidgets(data, opened).catch(() => undefined);
      }, DEBOUNCE_MS);
    };
    sync();
    const stopPrefs = subscribeNotifyPrefs(sync);
    const foreground = AppState.addEventListener('change', (status) => { if (status === 'active') sync(); });
    i18n.on('languageChanged', sync);
    return () => { clearTimeout(timer); stopPrefs(); foreground.remove(); i18n.off('languageChanged', sync); };
  }, [userId, dates, widget, i18n]);
}
