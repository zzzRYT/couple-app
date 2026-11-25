import type { CalendarEvent, EventAlert } from '../../lib/client';

export type Author = 'me' | 'partner';
/** One square of the month grid; `null` is a blank before the 1st so the 1st sits under its weekday (Sunday first). */
export type DayCell = { date: string; day: number; today: boolean; dots: Author[] } | null;
export const MAX_DOTS = 3;
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
export const authorOf = (event: CalendarEvent, me: string): Author => event.createdBy === me ? 'me' : 'partner';
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
/** The grid of `month` (`YYYY-MM`) with today marked and up to three author dots a day. `today` is a date in the space time zone. */
export function monthGrid(month: string, today: string, byDate: ReadonlyMap<string, readonly CalendarEvent[]>, me: string): DayCell[] {
  const year = Number(month.slice(0, 4)), index = Number(month.slice(5, 7)) - 1;
  const blanks = new Date(Date.UTC(year, index, 1)).getUTCDay();
  const days = new Date(Date.UTC(year, index + 1, 0)).getUTCDate();
  return [
    ...Array.from({ length: blanks }, () => null),
    ...Array.from({ length: days }, (_, offset) => {
      const date = `${month}-${pad(offset + 1)}`;
      return { date, day: offset + 1, today: date === today, dots: (byDate.get(date) ?? []).slice(0, MAX_DOTS).map((event) => authorOf(event, me)) };
    }),
  ];
}
/** The alert an event keeps when it becomes all-day: one that only makes sense with a start time falls back to none. */
export const alertFor = (alert: EventAlert, allDay: boolean): EventAlert => !allDay || ALL_DAY_ALERTS.includes(alert) ? alert : 'none';
