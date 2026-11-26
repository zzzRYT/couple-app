import { occurrencesBetween, type AnniversaryInput, type Occurrence } from '../../lib/anniversaries';
import type { CalendarEvent, EventAlert } from '../../lib/client';

/** One of the two partners, seen from this phone. */
export type Person = 'me' | 'partner';
/** Whose plan an event is: both of us (`ownerId` null) or one partner. Separate from who added it. */
export type Owner = 'together' | Person;
/** Whose events the month shows; screen state only. */
export type Filter = 'all' | Owner;
export const OWNERS: readonly Owner[] = ['together', 'me', 'partner'];
/** Each owner's color token: their face, row bar and chip. A person's writer text uses the same color. */
export const OWNER_COLOR = { together: 'together', me: 'primary', partner: 'info' } as const satisfies Record<Owner, 'together' | 'primary' | 'info'>;
/** One square of the month grid; `null` is a blank before the 1st so the 1st sits under its weekday (Sunday first). `owners` counts the day's events per owner, together first, then me. */
export type DayCell = { date: string; day: number; today: boolean; owners: { owner: Owner; n: number }[] } | null;
export const TIMED_ALERTS: readonly EventAlert[] = ['none', 'at', '5m', '15m', '30m', '1h', '1d'];
export const ALL_DAY_ALERTS: readonly EventAlert[] = ['none', 'at', '1d'];

const pad = (value: number) => String(value).padStart(2, '0');
/** `YYYY-MM` of a `YYYY-MM-DD` date. */
export const monthOf = (date: string) => date.slice(0, 7);
export function shiftMonth(month: string, delta: number): string {
  const value = new Date(Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5, 7)) - 1 + delta, 1));
  return `${value.getUTCFullYear()}-${pad(value.getUTCMonth() + 1)}`;
}
/** Unknown writers (an account deleted since) are not me. */
const personOf = (userId: string | null, me: string): Person => userId === me ? 'me' : 'partner';
export const authorOf = (event: CalendarEvent, me: string): Person => personOf(event.createdBy, me);
export const ownerOf = (event: Pick<CalendarEvent, 'ownerId'>, me: string): Owner => event.ownerId === null ? 'together' : personOf(event.ownerId, me);
/** Who last changed the event, only when that is not the person who added it. */
export function editorOf(event: CalendarEvent, me: string): Person | null {
  const editor = event.updatedBy === null ? null : personOf(event.updatedBy, me);
  return editor === authorOf(event, me) ? null : editor;
}
export const filterEvents = (events: readonly CalendarEvent[], me: string, filter: Filter): readonly CalendarEvent[] =>
  filter === 'all' ? events : events.filter((event) => ownerOf(event, me) === filter);
/** All-day first, then by start time, then by id so both phones show the same order. */
export function compareEvents(a: CalendarEvent, b: CalendarEvent): number {
  return (a.time === null ? 0 : 1) - (b.time === null ? 0 : 1) || (a.time ?? '').localeCompare(b.time ?? '') || a.id.localeCompare(b.id);
}
export function eventsByDate(events: readonly CalendarEvent[]): Map<string, CalendarEvent[]> {
  const byDate = new Map<string, CalendarEvent[]>();
  for (const event of [...events].sort(compareEvents)) {
    const day = byDate.get(event.date);
    if (day) day.push(event); else byDate.set(event.date, [event]);
  }
  return byDate;
}
/** The anniversaries that fall in `month` (`YYYY-MM`), by date, in the anniversary list's order. */
export function anniversariesByDate(input: AnniversaryInput, month: string): Map<string, Occurrence[]> {
  const byDate = new Map<string, Occurrence[]>();
  // `-31` bounds every month as a string, even short ones.
  for (const item of occurrencesBetween(input, `${month}-01`, `${month}-31`)) {
    const day = byDate.get(item.date);
    if (day) day.push(item); else byDate.set(item.date, [item]);
  }
  return byDate;
}
/** The grid of `month` (`YYYY-MM`) with today marked and each day's owners. `today` is a date in the space time zone. */
export function monthGrid(month: string, today: string, byDate: ReadonlyMap<string, readonly CalendarEvent[]>, me: string): DayCell[] {
  const year = Number(month.slice(0, 4)), index = Number(month.slice(5, 7)) - 1;
  const blanks = new Date(Date.UTC(year, index, 1)).getUTCDay();
  const days = new Date(Date.UTC(year, index + 1, 0)).getUTCDate();
  return [
    ...Array.from({ length: blanks }, () => null),
    ...Array.from({ length: days }, (_, offset) => {
      const date = `${month}-${pad(offset + 1)}`;
      const owners = (byDate.get(date) ?? []).map((event) => ownerOf(event, me));
      return { date, day: offset + 1, today: date === today, owners: OWNERS.map((owner) => ({ owner, n: owners.filter((each) => each === owner).length })).filter(({ n }) => n > 0) };
    }),
  ];
}
/** The alert an event keeps when it becomes all-day: one that only makes sense with a start time falls back to none. */
export const alertFor = (alert: EventAlert, allDay: boolean): EventAlert => !allDay || ALL_DAY_ALERTS.includes(alert) ? alert : 'none';
