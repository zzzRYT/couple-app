import { parseCalendarDate } from './dday.ts';

const DAY_MS = 86_400_000;
const DAY_MILESTONES = [50, 100, 200, 300, 500, 1000] as const;
export type MilestoneKind = 'day' | 'anniversary';
export type Milestone = {
  key: string; kind: MilestoneKind; milestoneDate: string; daysAgo: number;
  days: number | null; anniversaryN: number | null;
};
export type MilestoneCalculation = {
  dayCount: number | null; today: string; celebration: Milestone | null; upcoming: Omit<Milestone, 'daysAgo'>[];
  history: (Milestone & { status: 'active' | 'passed' })[];
};

function dateParts(value: string): { year: number; month: number; day: number } | null {
  const time = parseCalendarDate(value);
  if (time === null) return null;
  const date = new Date(time);
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1, day: date.getUTCDate() };
}
function isoDate(year: number, month: number, day: number): string {
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}
function zonedDate(now: string, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date(now));
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? '';
  return isoDate(Number(get('year')), Number(get('month')), Number(get('day')));
}
function anniversaryDate(start: { year: number; month: number; day: number }, n: number): string {
  const year = start.year + n;
  // Date validates leap years in UTC. Feb 29 anniversaries fall on Feb 28 in common years.
  const day = start.month === 2 && start.day === 29 && new Date(Date.UTC(year, 1, 29)).getUTCMonth() !== 1 ? 28 : start.day;
  return isoDate(year, start.month, day);
}
function dateDiff(from: string, to: string): number {
  return (parseCalendarDate(to)! - parseCalendarDate(from)!) / DAY_MS;
}
/** Selects only the newest active card; a same-day anniversary has priority over a day mark. */
export function chooseCurrentMilestone(milestones: Milestone[]): Milestone | null {
  return [...milestones].sort((a, b) => b.milestoneDate.localeCompare(a.milestoneDate) || Number(b.kind === 'anniversary') - Number(a.kind === 'anniversary'))[0] ?? null;
}

/** Pure calendar calculation. `nowIso` is a server timestamp; all day boundaries use the room IANA zone. */
export function computeMilestones(anniversary: string, timeZone: string, nowIso: string): MilestoneCalculation {
  const start = dateParts(anniversary);
  if (!start || !Number.isFinite(Date.parse(nowIso))) throw new TypeError('INVALID_MILESTONE_INPUT');
  const today = zonedDate(nowIso, timeZone);
  const todayTime = parseCalendarDate(today);
  const startTime = parseCalendarDate(anniversary)!;
  const dayCount = todayTime! < startTime ? null : dateDiff(anniversary, today) + 1;
  const milestones: Milestone[] = [];
  const history: MilestoneCalculation['history'] = [];
  for (const days of DAY_MILESTONES) {
    const time = startTime + (days - 1) * DAY_MS;
    const date = isoDate(new Date(time).getUTCFullYear(), new Date(time).getUTCMonth() + 1, new Date(time).getUTCDate());
    const delta = dateDiff(date, today);
    if (delta >= 0) {
      const item = { key: `d${days}`, kind: 'day' as const, milestoneDate: date, daysAgo: delta, days, anniversaryN: null };
      history.push({ ...item, status: delta < 7 ? 'active' : 'passed' });
      if (delta < 7) milestones.push(item);
    }
  }
  for (let n = 1; anniversaryDate(start, n) <= today; n++) {
    const date = anniversaryDate(start, n);
    const delta = dateDiff(date, today);
    const item = { key: `y${n}`, kind: 'anniversary' as const, milestoneDate: date, daysAgo: delta, days: null, anniversaryN: n };
    history.push({ ...item, status: delta < 7 ? 'active' : 'passed' });
    if (delta < 7) milestones.push(item);
  }
  // Only one card can be active. Newest milestone wins; an anniversary wins a same-day tie.
  history.sort((a, b) => a.milestoneDate.localeCompare(b.milestoneDate) || Number(b.kind === 'anniversary') - Number(a.kind === 'anniversary'));
  // A same-date anniversary and day mark is one celebration; keep only the anniversary record.
  const uniqueHistory = history.filter((item, index, all) => item.kind === 'anniversary' || !all.some((next, nextIndex) => nextIndex !== index && next.milestoneDate === item.milestoneDate && next.kind === 'anniversary'));
  const future: Omit<Milestone, 'daysAgo'>[] = [];
  for (const days of DAY_MILESTONES) {
    const time = startTime + (days - 1) * DAY_MS;
    const date = isoDate(new Date(time).getUTCFullYear(), new Date(time).getUTCMonth() + 1, new Date(time).getUTCDate());
    if (date > today) future.push({ key: `d${days}`, kind: 'day', milestoneDate: date, days, anniversaryN: null });
  }
  const startYear = start.year;
  let nextYear = Math.max(1, Number(today.slice(0, 4)) - startYear);
  while (anniversaryDate(start, nextYear) <= today) nextYear++;
  future.push({ key: `y${nextYear}`, kind: 'anniversary', milestoneDate: anniversaryDate(start, nextYear), days: null, anniversaryN: nextYear });
  future.sort((a, b) => a.milestoneDate.localeCompare(b.milestoneDate) || Number(b.kind === 'anniversary') - Number(a.kind === 'anniversary'));
  return { dayCount, today, celebration: chooseCurrentMilestone(milestones), upcoming: future.slice(0, 3), history: uniqueHistory };
}
