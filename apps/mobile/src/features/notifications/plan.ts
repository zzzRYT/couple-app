import { computeAnniversaries, type AnniversaryInput, type Occurrence } from '../../lib/anniversaries';
import type { CalendarEvent, EventAlert } from '../../lib/client';
import { parseCalendarDate } from '../../lib/dday';
import { occurrenceTitle } from '../anniversaries/format';
import type { Early, NotifyPrefs } from './preferences';

export type PlannedNotification = { id: string; fireAt: string; title: string; body: string; data: { v0: true; key: string } };
type Translate = (key: string, vars?: Record<string, unknown>) => string;
const DAY_MS = 86_400_000;
/** A single enabled yearly anniversary with an early reminder yields two a year, so this always reaches 50 when anything repeats. */
const MAX_YEARS = 25;
const EARLY_DAYS: Record<Early, number> = { none: 0, '1d': 1, '3d': 3, '7d': 7 };
const KIND_PREF: Record<Occurrence['kind'], keyof NotifyPrefs['kinds']> = { days: 'milestone', years: 'milestone', birthday: 'birthday', season: 'season', custom: 'custom' };

const zoneFormats = new Map<string, Intl.DateTimeFormat>();
function zoneFormat(timeZone: string) {
  let format = zoneFormats.get(timeZone);
  if (!format) {
    format = new Intl.DateTimeFormat('en-US', { timeZone, hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' });
    zoneFormats.set(timeZone, format);
  }
  return format;
}
/** Milliseconds the zone's wall clock is ahead of UTC at this instant. */
export function zoneOffset(instant: number, timeZone: string): number {
  const part: Record<string, number> = {};
  for (const { type, value } of zoneFormat(timeZone).formatToParts(new Date(instant))) part[type] = Number(value);
  return Date.UTC(part.year!, part.month! - 1, part.day!, part.hour! % 24, part.minute, part.second) - Math.floor(instant / 1000) * 1000;
}
/**
 * The instant a wall time happens in a zone, so a reminder follows the space and not the phone. A time skipped by a
 * spring-forward moves to the first valid minute; a time repeated by a fall-back uses the first one.
 */
export function zonedInstant(date: string, time: string, timeZone: string): number {
  const wall = parseCalendarDate(date)! + (Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5))) * 60_000;
  const before = zoneOffset(wall - DAY_MS, timeZone), after = zoneOffset(wall + DAY_MS, timeZone);
  const found = [wall - before, wall - after].filter((instant) => instant + zoneOffset(instant, timeZone) === wall);
  if (found.length > 0) return Math.min(...found);
  let low = wall - after, high = wall - before;
  while (high - low > 60_000) {
    const middle = Math.floor((low + high) / 2 / 60_000) * 60_000;
    if (zoneOffset(middle, timeZone) === before) low = middle; else high = middle;
  }
  return high;
}
function bodyFor(item: Occurrence, partner: string, days: number, t: Translate): string {
  if (item.kind === 'custom') return days > 0 ? t('notify.body.early.custom', { n: days }) : t('notify.body.custom');
  const title = occurrenceTitle(item, partner, t);
  if (days > 0) return t('notify.body.early', { title, n: days });
  if (item.kind === 'birthday') return t('notify.body.birthday', { name: partner });
  return t(item.kind === 'season' ? 'notify.body.season' : 'notify.body.milestone', { title });
}
/** Occurrences from today on, walking the engine a year at a time because it only looks one year ahead. */
function occurrencesFor(input: AnniversaryInput, nowIso: string, year: number): Occurrence[] {
  const anchor = new Date(Date.parse(nowIso) + year * 365 * DAY_MS).toISOString();
  const view = computeAnniversaries(input, anchor);
  return [...view.todayItems, ...view.upcoming];
}
/** The nearest reminders for this device: day-of and early, in the space time zone. My own birthday is not reminded. */
export function planNotifications(input: AnniversaryInput, prefs: NotifyPrefs, t: Translate, nowIso: string, max = 50): PlannedNotification[] {
  if (!Object.values(prefs.kinds).some(Boolean)) return [];
  const now = Date.parse(nowIso);
  const partner = input.partner?.displayName ?? t('home.pending.partner');
  const offsets = prefs.early === 'none' ? [0] : [0, EARLY_DAYS[prefs.early]];
  const planned = new Map<string, PlannedNotification>();
  const add = (item: Occurrence) => {
    if (item.playful || !prefs.kinds[KIND_PREF[item.kind]] || item.who === 'me' || (item.customId && prefs.offIds.includes(item.customId))) return;
    for (const days of offsets) {
      const id = `v0:${item.kind}:${item.key}:${item.date}:${days}`;
      if (planned.has(id)) continue;
      const fireDate = new Date(parseCalendarDate(item.date)! - days * DAY_MS).toISOString().slice(0, 10);
      const fireAt = zonedInstant(fireDate, prefs.time, input.timeZone);
      if (fireAt > now) planned.set(id, { id, fireAt: new Date(fireAt).toISOString(), title: t('notify.title'), body: bodyFor(item, partner, days, t), data: { v0: true, key: item.key } });
    }
  };
  // One more year after reaching max: a later occurrence's early reminder can land before the last one found.
  let extra = false;
  for (let year = 0; year < MAX_YEARS; year++) {
    occurrencesFor(input, nowIso, year).forEach(add);
    if (extra) break;
    extra = planned.size >= max;
  }
  return [...planned.values()].sort((a, b) => a.fireAt.localeCompare(b.fireAt) || a.id.localeCompare(b.id)).slice(0, max);
}

/** What an alert depends on; the sync key carries exactly these. */
export type EventAlertInput = Pick<CalendarEvent, 'id' | 'title' | 'date' | 'time' | 'alert'>;
const ALERT_MINUTES: Record<Exclude<EventAlert, 'none'>, number> = { at: 0, '5m': 5, '15m': 15, '30m': 30, '1h': 60, '1d': 1440 };
/** An all-day event has no start, so its alert rings at this wall time on the day or the day before. */
export const ALL_DAY_ALERT_TIME = '09:00';
function eventBody({ time, alert }: EventAlertInput, t: Translate): string {
  if (alert === '1d') return t('cal.notify.tomorrow');
  if (time === null) return t('cal.notify.today');
  return alert === 'at' ? t('cal.notify.now') : alert === '1h' ? t('cal.notify.hour') : t('cal.notify.min', { n: ALERT_MINUTES[alert as '5m' | '15m' | '30m'] });
}
/**
 * Calendar alerts for this device, in the space time zone. The id carries everything that moves the alert, so editing an event
 * replaces its notification and deleting it cancels it through the same diff as the anniversary reminders.
 */
export function planEventNotifications(events: readonly EventAlertInput[], timeZone: string, t: Translate, nowIso: string): PlannedNotification[] {
  const now = Date.parse(nowIso);
  return events.flatMap((event) => {
    if (event.alert === 'none') return [];
    const fireAt = event.time === null
      ? zonedInstant(event.alert === '1d' ? new Date(parseCalendarDate(event.date)! - DAY_MS).toISOString().slice(0, 10) : event.date, ALL_DAY_ALERT_TIME, timeZone)
      : zonedInstant(event.date, event.time, timeZone) - ALERT_MINUTES[event.alert] * 60_000;
    if (fireAt <= now) return [];
    const id = `v0:event:${event.id}:${event.date}:${event.time ?? 'day'}:${event.alert}`;
    return [{ id, fireAt: new Date(fireAt).toISOString(), title: event.title, body: eventBody(event, t), data: { v0: true as const, key: `event:${event.id}` } }];
  });
}
