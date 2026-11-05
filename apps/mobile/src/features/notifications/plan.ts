import { computeAnniversaries, type AnniversaryInput, type Occurrence } from '../../lib/anniversaries';
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
function zoneOffset(instant: number, timeZone: string): number {
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
    if (!prefs.kinds[KIND_PREF[item.kind]] || item.who === 'me' || (item.customId && prefs.offIds.includes(item.customId))) return;
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
