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
  const future = occurrences.filter((item) => item.date > todayDate);
  return { today, dayCount: count.dayCount, next: future[0] ?? null, upcoming: future.slice(1, 4) };
}

export type AnniversaryInput = {
  startDate: string;
  timeZone: string;
  me: { birthday: { month: number; day: number } | null };
  partner: { birthday: { month: number; day: number } | null; displayName?: string | null } | null;
  customs: { id: string; title: string; date: string; repeat: 'yearly' | 'once' }[];
};

const DAY_MS = 86_400_000;
const priority: Record<Occurrence['kind'], number> = { years: 0, days: 1, birthday: 2, custom: 3, season: 4 };
const compareKind = (a: Occurrence, b: Occurrence) => priority[a.kind] - priority[b.kind] || (a.title ?? '').localeCompare(b.title ?? '') || a.key.localeCompare(b.key);
const compareDate = (a: Occurrence, b: Occurrence) => a.date.localeCompare(b.date) || compareKind(a, b);
function annualDate(year: number, month: number, day: number): string {
  const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  return month === 2 && day === 29 && parseCalendarDate(date) === null ? `${year}-02-28` : date;
}

/** Calculate list and celebration occurrences in the space's calendar time zone. */
export function computeAnniversaries(input: AnniversaryInput, nowIso: string) {
  const start = parseCalendarDate(input.startDate);
  if (start === null) throw new Error('Invalid start date');
  const today = todayIn(nowIso, input.timeZone);
  const current = parseCalendarDate(today)!;
  const count = dayCount(input.startDate, nowIso, input.timeZone);
  const year = Number(today.slice(0, 4));
  const month = Number(today.slice(5, 7));
  const day = Number(today.slice(8, 10));
  const first = annualDate(year - 1, month, day);
  const last = annualDate(year + 1, month, day);
  const items: Occurrence[] = [];
  const add = (item: Occurrence) => {
    if (item.date >= input.startDate && item.date >= first && item.date <= last) items.push(item);
  };
  for (const n of [50, 100, 150, 200, 300]) {
    add({ key: `d${n}`, kind: 'days', date: dateString(start + (n - 1) * DAY_MS), n });
  }
  const startYear = Number(input.startDate.slice(0, 4));
  // My birthday shows once I enter it; the partner's only once both of us have (V0-F05-AC-01).
  const birthdays = input.me.birthday ? [{ who: 'me' as const, ...input.me.birthday }, ...(input.partner?.birthday ? [{ who: 'partner' as const, ...input.partner.birthday }] : [])] : [];
  for (let y = year - 1; y <= year + 1; y++) {
    if (y > startYear) add({ key: `y${y - startYear}`, kind: 'years', date: annualDate(y, Number(input.startDate.slice(5, 7)), Number(input.startDate.slice(8, 10))), n: y - startYear });
    for (const { who, month, day } of birthdays) add({ key: `bday:${who}:${y}`, kind: 'birthday', date: annualDate(y, month, day), who });
    add({ key: `season:pepero:${y}`, kind: 'season', date: annualDate(y, 11, 11), seasonId: 'pepero' });
    add({ key: `season:christmas:${y}`, kind: 'season', date: annualDate(y, 12, 25), seasonId: 'christmas' });
    for (const custom of input.customs) {
      if (parseCalendarDate(custom.date) === null) continue;
      if (custom.repeat === 'once') {
        if (y === year) add({ key: `custom:${custom.id}`, kind: 'custom', date: custom.date, customId: custom.id, title: custom.title });
      } else if (y >= Number(custom.date.slice(0, 4))) {
        add({ key: `custom:${custom.id}:${y}`, kind: 'custom', date: annualDate(y, Number(custom.date.slice(5, 7)), Number(custom.date.slice(8, 10))), customId: custom.id, title: custom.title });
      }
    }
  }
  items.sort(compareDate);
  const todayItems = items.filter((item) => item.date === today);
  const upcoming = items.filter((item) => item.date > today);
  const past = items.filter((item) => item.date < today).sort((a, b) => b.date.localeCompare(a.date) || compareKind(a, b));
  const celebrationCandidates = items.filter((item) => item.date === today || ((item.kind === 'days' || item.kind === 'years') && parseCalendarDate(item.date)! >= current - 6 * DAY_MS && item.date < today)).sort(compareKind);
  return { today, dayCount: count.ok ? count.dayCount : null, todayItems, upcoming, past, celebrationCandidates };
}
