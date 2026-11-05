import type { Locale } from '../../i18n';
import { computeAnniversaries, type AnniversaryInput, type Occurrence } from '../../lib/anniversaries';
import { parseCalendarDate, todayIn } from '../../lib/dday';
import { occurrenceTitle } from '../anniversaries/format';
import { zonedInstant } from '../notifications/plan';

type Translate = (key: string, vars?: Record<string, unknown>) => string;
export type WidgetItem = Pick<Occurrence, 'key' | 'kind' | 'date'> & { title: string; daysLeft: number; privacySensitive: boolean };
export type WidgetEntry = { date: string; showAt: string; dayCount?: number | null; today?: WidgetItem; next?: WidgetItem[] };
/** One document of `specs/002-couple-dday-v0/contracts/widget-snapshot.schema.json`. */
export type WidgetSnapshot = {
  schemaVersion: 1; writtenAt: string; spaceId?: string; state: 'normal' | 'pending' | 'none' | 'ended'; locale: Locale; timeZone?: string; startDate?: string;
  names?: { me?: string; partner: string | null }; strings: Record<string, string>; entries: WidgetEntry[];
};
/** `none` and `ended` carry nothing about the space: a widget must not keep showing the data that was just cleared. */
export type WidgetData = { state: 'none' | 'ended' } | SpaceData;
type SpaceData = { state: 'normal' | 'pending'; spaceId: string; names: { me: string | null; partner: string | null }; dates: AnniversaryInput };

const hasSpace = (data: WidgetData): data is SpaceData => data.state === 'normal' || data.state === 'pending';
const DAY_MS = 86_400_000;
/** Today plus the 35 days ahead the contract asks for. */
const ENTRY_DAYS = 36;
const MAX_NEXT = 5;
/** The extension has no i18n, so it gets every string its layouts use; the ones with placeholders stay templates it fills in. */
const STRING_KEYS = ['app.name', 'dday.big', 'dday.left', 'dday.left.one', 'dday.since', 'dday.today', 'dday.together', 'home.pending.partner', 'widget.a11y', 'widget.ended', 'widget.lock.days', 'widget.next', 'widget.none.body', 'widget.none.title', 'widget.pending', 'widget.pending.body', 'widget.today'];
const PLACEHOLDERS = { n: '{n}', title: '{title}', left: '{left}', date: '{date}' };

function widgetItem(item: Occurrence, today: string, partner: string, t: Translate): WidgetItem {
  return {
    key: item.key, kind: item.kind, title: occurrenceTitle(item, partner, t), date: item.date,
    daysLeft: Math.round((parseCalendarDate(item.date)! - parseCalendarDate(today)!) / DAY_MS),
    privacySensitive: item.kind === 'custom' || (item.kind === 'birthday' && item.who === 'partner'),
  };
}
/** Asks the engine as of that day's midnight in the space, so D+N, today and D-n roll over there and not on the phone's clock. */
function widgetEntry(date: string, dates: AnniversaryInput, partner: string, t: Translate): WidgetEntry {
  const showAt = new Date(zonedInstant(date, '00:00', dates.timeZone)).toISOString();
  const view = computeAnniversaries(dates, showAt);
  const today = view.todayItems[0];
  return { date, showAt, dayCount: view.dayCount, ...(today ? { today: widgetItem(today, date, partner, t) } : {}), next: view.upcoming.slice(0, MAX_NEXT).map((item) => widgetItem(item, date, partner, t)) };
}
/** The JSON the widget extension reads. Pure: everything comes from the arguments and nothing about the device is read. */
export function buildWidgetSnapshot(data: WidgetData & { locale: Locale }, nowIso: string, t: Translate): WidgetSnapshot {
  const writtenAt = new Date(nowIso).toISOString();
  const strings = Object.fromEntries(STRING_KEYS.map((key) => [key, t(key, PLACEHOLDERS)]));
  const common = { schemaVersion: 1 as const, writtenAt, locale: data.locale, strings };
  if (!hasSpace(data)) return { ...common, state: data.state, entries: [{ date: writtenAt.slice(0, 10), showAt: writtenAt }] };
  const { dates, names } = data;
  const partner = names.partner ?? t('home.pending.partner');
  const first = parseCalendarDate(todayIn(writtenAt, dates.timeZone))!;
  const entries = Array.from({ length: ENTRY_DAYS }, (_, day) => widgetEntry(new Date(first + day * DAY_MS).toISOString().slice(0, 10), dates, partner, t));
  return { ...common, state: data.state, spaceId: data.spaceId, timeZone: dates.timeZone, startDate: dates.startDate, names: { ...(names.me ? { me: names.me } : {}), partner: names.partner }, entries };
}
