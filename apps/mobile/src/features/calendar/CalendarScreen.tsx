import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { AnniversaryInput } from '../../lib/anniversaries';
import type { CalendarEvent } from '../../lib/client';
import { parseCalendarDate } from '../../lib/dday';
import { tokens } from '../../theme/tokens';
import { useType } from '../../theme/typography';
import { useAppColor } from '../../theme/useAppColor';
import { AppText, Button, IconButton, useTabBarClearance } from '../../ui/components';
import { AnniversaryRow } from '../anniversaries/AnniversaryRow';
import { occurrenceTitle } from '../anniversaries/format';
import { KindTile } from '../anniversaries/KindTile';
import { formatNotifyTime } from '../notifications/labels';
import { OfflineBand } from '../space/OfflineBand';
import { Avatar } from './Avatar';
import { OWNERS, OWNER_COLOR, anniversariesByDate, authorOf, editorOf, eventsByDate, filterEvents, monthGrid, monthOf, ownerOf, shiftMonth, type Filter, type Owner, type Person } from './model';

const WEEK = 7;
const utc = (date: string) => new Date(parseCalendarDate(date)!);
const eventTime = (event: Pick<CalendarEvent, 'time' | 'endTime'>, language: string, allDay: string) =>
  event.time === null ? allDay : event.endTime ? `${formatNotifyTime(event.time, language)} – ${formatNotifyTime(event.endTime, language)}` : formatNotifyTime(event.time, language);

/** V0-13 달력: owner chips, the month grid with each day's owners' faces and an anniversary tile, then the chosen day's anniversaries (read-only; editing stays on the anniversary screens) and events with whose plan and who added it. Color is never the only cue: each face sits beside a name. */
export function CalendarScreen({ events, anniversaries, me, meName, partner, today, offline, syncedAt = null, focusDate, onAdd, onEvent }: {
  events: readonly CalendarEvent[]; anniversaries: AnniversaryInput; me: string; meName: string; partner: string; today: string; offline: boolean; syncedAt?: string | null; focusDate?: string;
  onAdd: (date: string) => void; onEvent: (event: CalendarEvent) => void;
}) {
  const { t, i18n } = useTranslation(); const { emphasis } = useType(); const color = useAppColor(); const insets = useSafeAreaInsets(); const clearance = useTabBarClearance();
  const [filter, setFilter] = useState<Filter>('all');
  const [selected, setSelected] = useState(focusDate ?? today); const [month, setMonth] = useState(monthOf(focusDate ?? today));
  useEffect(() => { if (focusDate) { setSelected(focusDate); setMonth(monthOf(focusDate)); } }, [focusDate]);
  const byDate = useMemo(() => eventsByDate(filterEvents(events, me, filter)), [events, me, filter]);
  const cells = monthGrid(month, today, byDate, me);
  const dayEvents = byDate.get(selected) ?? [];
  const annivByDate = anniversariesByDate(anniversaries, month); const dayAnnivs = annivByDate.get(selected) ?? [];
  const language = i18n.language;
  const names: Record<Owner, string> = { together: t('cal.owner.together'), me: meName, partner };
  const label = (owner: Owner) => owner === 'together' ? t('cal.owner.together') : owner === 'me' ? t('cal.by.me') : partner;
  const ownerLong = (owner: Owner) => owner === 'together' ? t('cal.owner.together.long') : owner === 'me' ? t('cal.owner.mine') : t('cal.owner.partner', { name: partner });
  const added = (person: Person) => person === 'me' ? t('cal.added.me') : t('cal.added', { name: partner });
  const edited = (person: Person) => person === 'me' ? t('cal.edited.me') : t('cal.edited', { name: partner });
  const go = (next: string) => { setMonth(next); setSelected(next === monthOf(today) ? today : `${next}-01`); };
  const longDate = (date: string) => new Intl.DateTimeFormat(language, { timeZone: 'UTC', month: 'long', day: 'numeric', weekday: 'long' }).format(utc(date));
  const weekdays = Array.from({ length: WEEK }, (_, index) => new Intl.DateTimeFormat(language, { timeZone: 'UTC', weekday: 'narrow' }).format(Date.UTC(2023, 0, 1 + index)));
  const rows = Array.from({ length: Math.ceil(cells.length / WEEK) }, (_, row) => cells.slice(row * WEEK, row * WEEK + WEEK));
  const chip = (value: Filter) => <Pressable key={value} accessibilityRole="button" accessibilityLabel={value === 'all' ? t('cal.filter.all') : label(value)} accessibilityState={{ selected: filter === value }} hitSlop={4} onPress={() => setFilter(value)}
    style={{ minHeight: 36, flexDirection: 'row', alignItems: 'center', gap: 6, paddingLeft: value === 'all' ? 12 : 8, paddingRight: 12, borderRadius: tokens.radius.pill, borderWidth: tokens.border.outline.normal, borderColor: filter === value ? color.line : color.divider, backgroundColor: filter === value ? color.surface2 : color.surface }}>
    {value !== 'all' && <Avatar owner={value} name={names[value]} size={20} />}
    <AppText style={filter === value ? emphasis(14) : { fontSize: 14, lineHeight: 20 }}>{value === 'all' ? t('cal.filter.all') : label(value)}</AppText>
  </Pressable>;
  return <View style={{ flex: 1, backgroundColor: color.bg, paddingTop: insets.top }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, minHeight: 56, gap: 2 }}>
      <AppText variant="title" accessibilityRole="header" style={{ flex: 1 }}>{new Intl.DateTimeFormat(language, { timeZone: 'UTC', year: 'numeric', month: 'long' }).format(utc(`${month}-01`))}</AppText>
      <IconButton plain compact icon="back" label={t('cal.prev')} onPress={() => go(shiftMonth(month, -1))} />
      <IconButton plain compact icon="forward" label={t('cal.next')} onPress={() => go(shiftMonth(month, 1))} />
      <Pressable accessibilityRole="button" onPress={() => go(monthOf(today))} style={{ minHeight: 44, minWidth: 44, paddingHorizontal: 6, alignItems: 'center', justifyContent: 'center' }}><AppText tone="primary" style={emphasis(15)}>{t('cal.today')}</AppText></Pressable>
      <IconButton compact tone="primary" icon="plus" label={t('cal.add')} disabled={offline} onPress={() => onAdd(selected)} />
    </View>
    <View accessibilityRole="toolbar" accessibilityLabel={t('cal.filter.a11y')} style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 20, paddingBottom: 8 }}>{(['all', ...OWNERS] as const).map(chip)}</View>
    {offline && <View style={{ paddingHorizontal: 20, paddingBottom: 8 }}><OfflineBand syncedAt={syncedAt} /></View>}
    <ScrollView contentContainerStyle={{ paddingBottom: clearance + 16 }}>
      <View style={{ paddingHorizontal: 12 }}>
        <View style={{ flexDirection: 'row' }} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>{weekdays.map((day, index) => <AppText key={index} tone="text2" align="center" style={[emphasis(12), { flex: 1 }]}>{day}</AppText>)}</View>
        {rows.map((row, index) => <View key={index} style={{ flexDirection: 'row' }}>{Array.from({ length: WEEK }, (_, column) => {
          const cell = row[column];
          if (!cell) return <View key={column} style={{ flex: 1 }} />;
          const chosen = cell.date === selected; const annivs = annivByDate.get(cell.date) ?? [];
          const dayLabel = cell.owners.length ? t('cal.a11y.day.by', { date: longDate(cell.date), n: byDate.get(cell.date)!.length, names: cell.owners.map(({ owner, n }) => `${label(owner)} ${n}`).join(', ') }) : t('cal.a11y.day', { date: longDate(cell.date), n: 0 });
          return <Pressable key={cell.date} testID={`day-${cell.date}`} accessibilityRole="button" accessibilityState={{ selected: chosen }} accessibilityLabel={[dayLabel, ...annivs.map((item) => occurrenceTitle(item, partner, t))].join(', ')} onPress={() => setSelected(cell.date)} style={{ flex: 1, minHeight: 48, alignItems: 'center', paddingTop: 4, gap: 2 }}>
            <View style={{ width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: cell.today ? color.primary : 'transparent', borderWidth: chosen && !cell.today ? tokens.border.outline.normal : 0, borderColor: color.line }}>
              <AppText style={[cell.today || chosen ? emphasis(15) : { fontSize: 15, lineHeight: 20 }, { color: cell.today ? color.onPrimary : color.text }]}>{cell.day}</AppText>
              {annivs[0] && <View style={{ position: 'absolute', top: -3, right: -5 }}><KindTile item={annivs[0]} size={14} /></View>}
            </View>
            <View style={{ flexDirection: 'row', height: 16 }}>{cell.owners.map(({ owner }, index) => <Avatar key={owner} owner={owner} name={names[owner]} size={16} style={index ? { marginLeft: -4, borderWidth: 1, borderColor: color.bg } : undefined} />)}</View>
          </Pressable>;
        })}</View>)}
      </View>
      <View style={{ height: 1, backgroundColor: color.divider }} />
      <View style={{ padding: 20, gap: 10 }}>
        <AppText accessibilityRole="header" style={emphasis(16)}>{longDate(selected)}</AppText>
        {dayAnnivs.length > 0 && <View style={{ backgroundColor: color.surface, borderWidth: tokens.border.outline.normal, borderColor: color.divider, borderRadius: tokens.radius.card, overflow: 'hidden' }}>{dayAnnivs.map((item, index) => <View key={item.key} style={{ borderTopWidth: index ? 1 : 0, borderColor: color.divider }}><AnniversaryRow item={item} today={today} partner={partner} compact /></View>)}</View>}
        {dayEvents.length === 0 ? <View style={{ alignItems: 'center', gap: 10, paddingVertical: 20 }}><AppText tone="text2" align="center">{filter === 'all' ? t('cal.empty') : t(`cal.empty.${filter}`, { name: partner })}</AppText><Button compact variant="secondary" label={t('cal.add')} disabled={offline} onPress={() => onAdd(selected)} /></View>
          : <View style={{ backgroundColor: color.surface, borderWidth: tokens.border.outline.normal, borderColor: color.divider, borderRadius: tokens.radius.card, overflow: 'hidden' }}>{dayEvents.map((event, index) => {
            const owner = ownerOf(event, me), author = authorOf(event, me), editor = editorOf(event, me), time = eventTime(event, language, t('cal.allDay'));
            return <Pressable key={event.id} accessibilityRole="button" accessibilityLabel={t('cal.a11y.event', { time, title: event.title, owner: ownerLong(owner), name: editor ? `${added(author)}, ${edited(editor)}` : added(author) })} onPress={() => onEvent(event)} style={({ pressed }) => ({ minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, paddingLeft: 12, paddingRight: 14, borderTopWidth: index ? 1 : 0, borderColor: color.divider, opacity: pressed ? 0.7 : 1 })}>
              <View style={{ width: 4, alignSelf: 'stretch', borderRadius: 2, backgroundColor: color[OWNER_COLOR[owner]] }} />
              <Avatar owner={owner} name={names[owner]} size={34} />
              <View style={{ flex: 1, gap: 2 }}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
                  <AppText numberOfLines={2} style={[emphasis(16), { flex: 1 }]}>{event.title}</AppText>
                  <View style={{ paddingHorizontal: 8, borderRadius: tokens.radius.pill, borderWidth: tokens.border.outline.normal, borderColor: color[OWNER_COLOR[owner]] }}><AppText style={[emphasis(12), { color: color[OWNER_COLOR[owner]] }]}>{label(owner)}</AppText></View>
                </View>
                <AppText tone="text2" style={{ fontSize: 13, lineHeight: 19 }}>{`${time} · `}<AppText style={[emphasis(13), { color: color[OWNER_COLOR[author]] }]}>{added(author)}</AppText>{editor && ` · ${edited(editor)}`}</AppText>
              </View>
            </Pressable>;
          })}</View>}
      </View>
    </ScrollView>
  </View>;
}
