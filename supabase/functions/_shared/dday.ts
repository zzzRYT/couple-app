// Mirrors apps/mobile/src/lib/dday.ts; both read apps/mobile/src/lib/__fixtures__/dday.json in tests.
export type DdayResult = { ok: true; dayCount: number } | { ok: false; code: 'FUTURE_DATE' | 'INVALID_DATE' };
const DAY_MS = 86_400_000;
export function parseCalendarDate(value: string): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const time = Date.UTC(year, month - 1, day);
  const date = new Date(time);
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day ? time : null;
}
export function todayIn(nowIso: string, timeZone: string): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(nowIso));
}
/** The anniversary itself is day 1; days roll over at midnight in the room time zone. */
export function dayCount(anniversary: string, nowIso: string, timeZone: string): DdayResult {
  const start = parseCalendarDate(anniversary);
  if (start === null) return { ok: false, code: 'INVALID_DATE' };
  const today = parseCalendarDate(todayIn(nowIso, timeZone))!;
  if (start > today) return { ok: false, code: 'FUTURE_DATE' };
  return { ok: true, dayCount: Math.round((today - start) / DAY_MS) + 1 };
}
export function formatAnniversary(anniversary: string, locale: string): string {
  const time = parseCalendarDate(anniversary);
  return time === null ? '' : new Intl.DateTimeFormat(locale, { timeZone: 'UTC', year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(time));
}
