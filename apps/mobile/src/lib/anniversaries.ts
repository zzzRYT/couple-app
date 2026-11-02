import { dayCount, parseCalendarDate, todayIn } from './dday';

export type Occurrence = { key: string; kind: 'days' | 'years' | 'birthday' | 'season' | 'custom'; date: string; n?: number; who?: 'me' | 'partner'; seasonId?: 'pepero' | 'christmas'; customId?: string; title?: string };
const dateString = (timestamp: number) => new Date(timestamp).toISOString().slice(0, 10);

export function computeMilestoneView(startDate: string, timeZone: string, nowIso: string) {
  const start = parseCalendarDate(startDate);
  const count = dayCount(startDate, nowIso, timeZone);
  if (start === null || !count.ok) throw new Error('Invalid or future start date');
  const todayDate = todayIn(nowIso, timeZone);
  const startYear = Number(startDate.slice(0, 4));
  const currentYear = Number(todayDate.slice(0, 4));
  const monthDay = startDate.slice(5);
  const occurrences: Occurrence[] = [50, 100, 150, 200, 300].map((n) => ({ key: `d${n}`, kind: 'days', n, date: dateString(start + (n - 1) * 86_400_000) }));
  for (let year = Math.max(startYear + 1, currentYear - 1); year <= currentYear + 4; year++) {
    let date = `${year}-${monthDay}`;
    if (parseCalendarDate(date) === null && monthDay === '02-29') date = `${year}-02-28`;
    occurrences.push({ key: `y${year - startYear}`, kind: 'years', n: year - startYear, date });
  }
  occurrences.sort((a, b) => a.date.localeCompare(b.date) || (a.kind === 'years' ? -1 : b.kind === 'years' ? 1 : 0));
  const today = occurrences.find((item) => item.date === todayDate) ?? null;
  const upcoming = occurrences.filter((item) => item.date > todayDate).slice(0, 3);
  return { today, dayCount: count.dayCount, next: upcoming[0] ?? null, upcoming };
}
