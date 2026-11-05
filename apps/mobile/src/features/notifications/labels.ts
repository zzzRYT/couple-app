import type { Early, NotifyPrefs } from './preferences';

type Translate = (key: string, vars?: Record<string, unknown>) => string;
/** The time is a wall time in the space, not an instant, so it is formatted on a fixed UTC date. */
export function formatNotifyTime(time: string, locale: string): string {
  const instant = Date.UTC(2000, 0, 1, Number(time.slice(0, 2)), Number(time.slice(3, 5)));
  return new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'UTC' }).format(instant).replace(/\s/g, ' ');
}
export const earlyLabel = (early: Early, t: Translate) => t(`set.notify.early.${early}`);
export const notifyDefaultLabel = ({ time, early }: Pick<NotifyPrefs, 'time' | 'early'>, locale: string, t: Translate) => t('anniv.notify.default', { time: formatNotifyTime(time, locale), early: earlyLabel(early, t) });
