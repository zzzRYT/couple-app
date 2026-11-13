import type { Occurrence } from '../../lib/anniversaries';
import { presetTitle } from '../../lib/anniversaryPresets';
import { parseCalendarDate } from '../../lib/dday';
type TFunction = (key: string, vars?: Record<string, unknown>) => string;
export function occurrenceTitle(item: Occurrence, partner: string, t: TFunction): string {
  switch (item.kind) {
    case 'days': return t('anniv.days', { n: item.n });
    case 'years': return t('anniv.years', { n: item.n });
    case 'birthday': return item.who === 'me' ? t('anniv.birthday.me') : t('anniv.birthday', { name: partner });
    case 'season': return t(item.seasonId === 'valentine' || item.seasonId === 'white' ? `anniv.preset.${item.seasonId}` : item.seasonId === 'pepero' ? 'anniv.pepero' : 'anniv.christmas');
    case 'custom': return presetTitle({ presetId: item.presetId, title: item.title ?? '' }, t);
  }
}
export function formattedDate(date: string, language: string, long: boolean): string {
  const value = new Date(parseCalendarDate(date)!);
  const year = value.getUTCFullYear(), month = value.getUTCMonth() + 1, day = value.getUTCDate();
  const weekday = new Intl.DateTimeFormat(language, { timeZone: 'UTC', weekday: 'short' }).format(value);
  if (language.startsWith('ko')) return `${long ? `${year}년 ` : ''}${month}월 ${day}일 (${weekday})`;
  if (language.startsWith('ja')) return `${long ? `${year}年` : ''}${month}月${day}日(${weekday})`;
  const name = new Intl.DateTimeFormat(language, { timeZone: 'UTC', month: 'short' }).format(value);
  return `${weekday}, ${name} ${day}${long ? `, ${year}` : ''}`;
}
export function formattedMonthDay(date: string, language: string): string {
  const value = new Date(parseCalendarDate(date)!);
  const month = value.getUTCMonth() + 1, day = value.getUTCDate();
  if (language.startsWith('ko')) return `${month}월 ${day}일`;
  if (language.startsWith('ja')) return `${month}月${day}日`;
  return `${new Intl.DateTimeFormat(language, { timeZone: 'UTC', month: 'short' }).format(value)} ${day}`;
}
export function formattedYearMonthDay(date: string, language: string): string {
  const year = date.slice(0, 4), monthDay = formattedMonthDay(date, language);
  if (language.startsWith('ko')) return `${year}년 ${monthDay}`;
  return language.startsWith('ja') ? `${year}年${monthDay}` : `${monthDay}, ${year}`;
}
export function relativeDate(date: string, today: string, t: TFunction): string {
  const delta = (parseCalendarDate(date)! - parseCalendarDate(today)!) / 86_400_000;
  return delta === 0 ? t('dday.today') : delta < 0 ? t('dday.ago', { n: -delta }) : delta === 1 ? t('dday.left.one') : t('dday.left', { n: delta });
}
