import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { CalendarEvent } from '../../lib/client';
import { parseCalendarDate } from '../../lib/dday';
import { tokens } from '../../theme/tokens';
import { useType } from '../../theme/typography';
import { useAppColor } from '../../theme/useAppColor';
import { AppText, Button, IconButton, useTabBarClearance } from '../../ui/components';
import { formatNotifyTime } from '../notifications/labels';
import { OfflineBand } from '../space/OfflineBand';
import { authorOf, eventsByDate, monthGrid, monthOf, shiftMonth, type Author } from './model';

const WEEK = 7;
const utc = (date: string) => new Date(parseCalendarDate(date)!);
const eventTime = (event: Pick<CalendarEvent, 'time' | 'endTime'>, language: string, allDay: string) =>
  event.time === null ? allDay : event.endTime ? `${formatNotifyTime(event.time, language)} – ${formatNotifyTime(event.endTime, language)}` : formatNotifyTime(event.time, language);

/** V0-13 달력: the month grid with author dots, then the chosen day's events. Color is never the only cue: each row names its writer. */
export function CalendarScreen({ events, me, partner, today, offline, syncedAt = null, focusDate, onAdd, onEvent }: {
  events: readonly CalendarEvent[]; me: string; partner: string; today: string; offline: boolean; syncedAt?: string | null; focusDate?: string;
  onAdd: (date: string) => void; onEvent: (event: CalendarEvent) => void;
}) {
  const { t, i18n } = useTranslation(); const { emphasis } = useType(); const color = useAppColor(); const insets = useSafeAreaInsets(); const clearance = useTabBarClearance();
  const authorColor = (author: Author) => author === 'me' ? color.primary : color.info;
  const [selected, setSelected] = useState(focusDate ?? today); const [month, setMonth] = useState(monthOf(focusDate ?? today));
  useEffect(() => { if (focusDate) { setSelected(focusDate); setMonth(monthOf(focusDate)); } }, [focusDate]);
  const byDate = useMemo(() => eventsByDate(events), [events]);
  const cells = monthGrid(month, today, byDate, me);
  const dayEvents = byDate.get(selected) ?? [];
  const language = i18n.language;
  const nameOf = (author: Author) => author === 'me' ? t('cal.by.me') : partner;
  const go = (next: string) => { setMonth(next); setSelected(next === monthOf(today) ? today : `${next}-01`); };
  const longDate = (date: string) => new Intl.DateTimeFormat(language, { timeZone: 'UTC', month: 'long', day: 'numeric', weekday: 'long' }).format(utc(date));
  const weekdays = Array.from({ length: WEEK }, (_, index) => new Intl.DateTimeFormat(language, { timeZone: 'UTC', weekday: 'narrow' }).format(Date.UTC(2023, 0, 1 + index)));
  const rows = Array.from({ length: Math.ceil(cells.length / WEEK) }, (_, row) => cells.slice(row * WEEK, row * WEEK + WEEK));
  const dot = (author: Author, key: number | string) => <View key={key} style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: authorColor(author) }} />;
  return <View style={{ flex: 1, backgroundColor: color.bg, paddingTop: insets.top }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, minHeight: 56, gap: 2 }}>
      <AppText variant="title" accessibilityRole="header" style={{ flex: 1 }}>{new Intl.DateTimeFormat(language, { timeZone: 'UTC', year: 'numeric', month: 'long' }).format(utc(`${month}-01`))}</AppText>
      <IconButton plain compact icon="back" label={t('cal.prev')} onPress={() => go(shiftMonth(month, -1))} />
      <IconButton plain compact icon="forward" label={t('cal.next')} onPress={() => go(shiftMonth(month, 1))} />
      <Pressable accessibilityRole="button" onPress={() => go(monthOf(today))} style={{ minHeight: 44, minWidth: 44, paddingHorizontal: 6, alignItems: 'center', justifyContent: 'center' }}><AppText tone="primary" style={emphasis(15)}>{t('cal.today')}</AppText></Pressable>
      <IconButton compact tone="primary" icon="plus" label={t('cal.add')} disabled={offline} onPress={() => onAdd(selected)} />
    </View>
    {offline && <View style={{ paddingHorizontal: 20, paddingBottom: 8 }}><OfflineBand syncedAt={syncedAt} /></View>}
    <ScrollView contentContainerStyle={{ paddingBottom: clearance + 16 }}>
      <View style={{ paddingHorizontal: 12 }}>
        <View style={{ flexDirection: 'row' }} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>{weekdays.map((day, index) => <AppText key={index} tone="text2" align="center" style={[emphasis(12), { flex: 1 }]}>{day}</AppText>)}</View>
        {rows.map((row, index) => <View key={index} style={{ flexDirection: 'row' }}>{Array.from({ length: WEEK }, (_, column) => {
          const cell = row[column];
          if (!cell) return <View key={column} style={{ flex: 1 }} />;
          const chosen = cell.date === selected;
          return <Pressable key={cell.date} testID={`day-${cell.date}`} accessibilityRole="button" accessibilityState={{ selected: chosen }} accessibilityLabel={t('cal.a11y.day', { date: longDate(cell.date), n: byDate.get(cell.date)?.length ?? 0 })} onPress={() => setSelected(cell.date)} style={{ flex: 1, minHeight: 48, alignItems: 'center', paddingTop: 4, gap: 2 }}>
            <View style={{ width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: cell.today ? color.primary : 'transparent', borderWidth: chosen && !cell.today ? tokens.border.outline.normal : 0, borderColor: color.line }}>
              <AppText style={[cell.today || chosen ? emphasis(15) : { fontSize: 15, lineHeight: 20 }, { color: cell.today ? color.onPrimary : color.text }]}>{cell.day}</AppText>
            </View>
            <View style={{ flexDirection: 'row', gap: 2, height: 5 }}>{cell.dots.map(dot)}</View>
          </Pressable>;
        })}</View>)}
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 12, paddingHorizontal: 8, paddingVertical: 6 }}>{(['me', 'partner'] as const).map((author) => <View key={author} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>{dot(author, author)}<AppText tone="text2" style={{ fontSize: 12, lineHeight: 16 }}>{nameOf(author)}</AppText></View>)}</View>
      </View>
      <View style={{ height: 1, backgroundColor: color.divider }} />
      <View style={{ padding: 20, gap: 10 }}>
        <AppText accessibilityRole="header" style={emphasis(16)}>{longDate(selected)}</AppText>
        {dayEvents.length === 0 ? <View style={{ alignItems: 'center', gap: 10, paddingVertical: 20 }}><AppText tone="text2" align="center">{t('cal.empty')}</AppText><Button compact variant="secondary" label={t('cal.add')} disabled={offline} onPress={() => onAdd(selected)} /></View>
          : <View style={{ backgroundColor: color.surface, borderWidth: tokens.border.outline.normal, borderColor: color.divider, borderRadius: tokens.radius.card, overflow: 'hidden' }}>{dayEvents.map((event, index) => {
            const author = authorOf(event, me), time = eventTime(event, language, t('cal.allDay'));
            return <Pressable key={event.id} accessibilityRole="button" accessibilityLabel={t('cal.a11y.event', { time, title: event.title, name: nameOf(author) })} onPress={() => onEvent(event)} style={({ pressed }) => ({ minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, paddingLeft: 12, paddingRight: 14, borderTopWidth: index ? 1 : 0, borderColor: color.divider, opacity: pressed ? 0.7 : 1 })}>
              <View style={{ width: 3, alignSelf: 'stretch', borderRadius: 2, backgroundColor: authorColor(author) }} />
              <AppText tone="text2" style={{ width: 76, fontSize: 13, lineHeight: 18 }}>{time}</AppText>
              <AppText numberOfLines={2} style={[emphasis(15), { flex: 1 }]}>{event.title}</AppText>
              <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: tokens.radius.pill, borderWidth: 1.5, borderColor: authorColor(author) }}><AppText style={[emphasis(12), { color: authorColor(author) }]}>{nameOf(author)}</AppText></View>
            </Pressable>;
          })}</View>}
      </View>
    </ScrollView>
  </View>;
}
