import { formattedDate, formattedMonthDay, formattedYearMonthDay } from '../anniversaries/format';
import type { WidgetEntry, WidgetItem, WidgetSnapshot } from './snapshot';

type Icon = 'heart' | 'medal' | 'cake' | 'pepero' | 'tree' | 'star';
type NoSpace<State> = { state: State; title: string; body: string; url: string; a11y: string; ja: boolean };
export type WidgetRow = { title: string; left: string; date: string; dateMd: string; url: string; icon: Icon; tile: string; hideWhenLocked: boolean };
/** Everything one layout draws for one timeline entry: the layout runs in the extension's bare JS runtime, so all text is ready here. */
export type WidgetProps =
  | { state: 'placeholder' }
  | NoSpace<'none'> | NoSpace<'ended'>
  | {
    state: 'normal' | 'pending'; ja: boolean; url: string; a11y: string; names: string; together: string; day: string; dayCount: number; lockDays: string; since: string; sinceLong: string;
    listTitle: string; pending: string; pendingBody: string; todayWord: string; rows: WidgetRow[];
    today?: { title: string; line: string; prefix: string; icon: Icon; tile: string; hideWhenLocked: boolean };
  };
export const WIDGET_PLACEHOLDER: WidgetProps = { state: 'placeholder' };

const fill = (template: string, vars: Record<string, string | number>) => template.replace(/\{(\w+)\}/g, (match, key: string) => String(vars[key] ?? match));
/** Same pairing as the app's `KindTile`. */
function tileOf(item: WidgetItem): { icon: Icon; tile: string } {
  switch (item.kind) {
    case 'days': return { icon: 'heart', tile: '#F4B79B' };
    case 'years': return { icon: 'medal', tile: '#F2A7B4' };
    case 'birthday': return { icon: 'cake', tile: '#F7D98B' };
    case 'season': return item.key.startsWith('season:pepero') ? { icon: 'pepero', tile: '#AACBE2' } : { icon: 'tree', tile: '#A8C6A0' };
    case 'custom': return { icon: 'star', tile: '#C9B8E8' };
  }
}
function leftOf(daysLeft: number, strings: Record<string, string>) {
  if (daysLeft === 0) return strings['dday.today']!;
  return daysLeft === 1 ? strings['dday.left.one']! : fill(strings['dday.left']!, { n: daysLeft });
}
/** The app's routes as URLs of its own scheme. A key holds `:`, so it travels encoded and the route decodes it. */
export const widgetLinks = (scheme: string) => ({
  home: `${scheme}://home`,
  start: `${scheme}://`,
  anniversary: (key: string) => `${scheme}://anniversary/${encodeURIComponent(key)}`,
});
function spaceProps(snapshot: WidgetSnapshot, entry: WidgetEntry, scheme: string): WidgetProps {
  const { strings, locale } = snapshot;
  const links = widgetLinks(scheme);
  const ja = locale === 'ja-JP';
  const dayCount = entry.dayCount ?? 1;
  const day = fill(strings['dday.big']!, { n: dayCount });
  const startDate = snapshot.startDate!;
  const rows = (entry.next ?? []).map((item) => ({
    title: item.title, left: leftOf(item.daysLeft, strings), date: formattedDate(item.date, locale, false), dateMd: formattedMonthDay(item.date, locale), url: links.anniversary(item.key), hideWhenLocked: item.privacySensitive, ...tileOf(item),
  }));
  const [prefix = ''] = strings['widget.today']!.split('{title}');
  const today = entry.today ? { title: entry.today.title, line: fill(strings['widget.today']!, { title: entry.today.title }), prefix, hideWhenLocked: entry.today.privacySensitive, ...tileOf(entry.today) } : undefined;
  const first = today ? { title: today.title, left: strings['dday.today']! } : rows[0];
  const partner = snapshot.names?.partner ?? strings['home.pending.partner']!;
  return {
    state: snapshot.state === 'pending' ? 'pending' : 'normal', ja, url: links.home, day, dayCount, rows, ...(today ? { today } : {}),
    a11y: first ? fill(strings['widget.a11y']!, { n: dayCount, title: first.title, left: first.left }) : `${strings['dday.together']} ${day}`,
    names: [snapshot.names?.me, partner].filter(Boolean).join(' · '), together: strings['dday.together']!, lockDays: strings['widget.lock.days']!,
    since: fill(strings['dday.since']!, { date: startDate.replaceAll('-', '.') }), sinceLong: fill(strings['dday.since']!, { date: formattedYearMonthDay(startDate, locale) }),
    listTitle: strings['widget.gallery.list.name']!, pending: strings['widget.pending']!, pendingBody: strings['widget.pending.body']!, todayWord: strings['dday.today']!,
  };
}
export function widgetProps(snapshot: WidgetSnapshot, entry: WidgetEntry, scheme: string): WidgetProps {
  const { strings, locale, state } = snapshot;
  const ja = locale === 'ja-JP';
  const url = widgetLinks(scheme).start;
  if (state === 'none') return { state, ja, url, title: strings['widget.none.title']!, body: strings['widget.none.body']!, a11y: strings['widget.none.title']! };
  if (state === 'ended') return { state, ja, url, title: strings['widget.ended']!, body: strings['app.name']!, a11y: strings['widget.ended']! };
  return spaceProps(snapshot, entry, scheme);
}
