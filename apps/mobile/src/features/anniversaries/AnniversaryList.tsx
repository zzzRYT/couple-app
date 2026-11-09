import { Fragment, type ReactNode } from 'react';
import { Image, Pressable, ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppColor } from '../../theme/useAppColor';
import { AppText, Button, useTabBarClearance } from '../../ui/components';
import { Icon } from '../../ui/Icon';
import { mascotPoses } from '../../scene/catalog';
import type { Occurrence, computeAnniversaries } from '../../lib/anniversaries';
import { AnniversaryRow } from './AnniversaryRow';

type ViewModel = ReturnType<typeof computeAnniversaries>;
export function AnniversaryList({ view, filter, pastOpen, offline, birthdayState, partner, onFilter, onPast, onAdd, onItem, onBirthday }: {
  view: ViewModel; filter: 'all' | 'custom'; pastOpen: boolean; offline: boolean; birthdayState: 'mine' | 'wait' | 'none'; partner: string;
  onFilter: (filter: 'all' | 'custom') => void; onPast: () => void; onAdd: () => void; onItem: (item: Occurrence) => void; onBirthday: () => void;
}) {
  const { t } = useTranslation(); const color = useAppColor(); const insets = useSafeAreaInsets(); const clearance = useTabBarClearance();
  const select = (items: Occurrence[]) => filter === 'custom' ? items.filter((item) => item.kind === 'custom') : items;
  const today = select(view.todayItems), upcoming = select(view.upcoming), past = select(view.past);
  const row = (item: Occurrence) => <AnniversaryRow key={item.key} item={item} today={view.today} partner={partner} badge={filter === 'all'} onPress={() => onItem(item)} />;
  const showBirthday = filter === 'all' && birthdayState !== 'none';
  const birthdayRow = showBirthday ? <Pressable disabled={birthdayState === 'wait'} onPress={onBirthday} accessibilityRole={birthdayState === 'mine' ? 'button' : undefined} style={{ minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 6, backgroundColor: color.surface }}><View style={{ width: 40, height: 40, borderWidth: 1.5, borderStyle: 'dashed', borderColor: color.border, borderRadius: 13, alignItems: 'center', justifyContent: 'center' }}><Icon name="annivBirthday" size={22} color={color.text2} /></View><AppText tone="text2" style={{ flexShrink: 1 }}>{birthdayState === 'mine' ? `${t('anniv.birthday.mine')} · ${t('anniv.birthday.add')}` : t('anniv.birthday.wait', { name: partner })}</AppText></Pressable> : null;
  const rows = (items: Occurrence[]) => items.map((item) => ({ key: item.key, node: row(item) }));
  const upcomingRows = rows(upcoming);
  if (birthdayRow) {
    const mine = birthdayState === 'wait' ? upcoming.findIndex((item) => item.kind === 'birthday' && item.who === 'me') : -1;
    upcomingRows.splice(mine < 0 ? upcomingRows.length : mine + 1, 0, { key: 'birthday', node: birthdayRow });
  }
  const section = (key: string, entries: { key: string; node: ReactNode }[]) => entries.length ? <View style={{ gap: 8 }}><AppText tone="text2" style={{ fontWeight: '700', fontSize: 14, paddingHorizontal: 4 }}>{t(key)}</AppText><View style={{ borderWidth: 2, borderColor: color.divider, borderRadius: 20, overflow: 'hidden' }}>{entries.map((entry, index) => <Fragment key={entry.key}>{index > 0 && <View style={{ height: 1, marginLeft: 66, backgroundColor: color.divider }} />}{entry.node}</Fragment>)}</View></View> : null;
  return <View style={{ flex: 1, backgroundColor: color.bg, paddingTop: insets.top }}>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20 }}><AppText variant="title" accessibilityRole="header">{t('tab.anniv')}</AppText><Pressable accessibilityRole="button" accessibilityLabel={t('anniv.add')} accessibilityState={{ disabled: offline }} disabled={offline} onPress={onAdd} style={{ width: 48, height: 48, borderRadius: 24, borderWidth: 2, borderStyle: offline ? 'dashed' : 'solid', borderColor: color.line, backgroundColor: offline ? color.surface2 : color.primary, alignItems: 'center', justifyContent: 'center' }}><Icon name="plus" color={offline ? color.text2 : color.onPrimary} /></Pressable></View>
    <View style={{ flexDirection: 'row', marginHorizontal: 20, marginTop: 10, padding: 3, gap: 3, backgroundColor: color.surface2, borderRadius: 13 }}>{(['all', 'custom'] as const).map((value) => <Pressable key={value} accessibilityRole="button" accessibilityState={{ selected: filter === value }} onPress={() => onFilter(value)} style={{ flex: 1, minHeight: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 10, borderWidth: filter === value ? 1.5 : 0, borderColor: color.line, backgroundColor: filter === value ? color.surface : 'transparent' }}><AppText tone={filter === value ? 'text' : 'text2'}>{t(`anniv.filter.${value}`)}</AppText></Pressable>)}</View>
    {filter === 'custom' && !today.length && !upcoming.length && !past.length ? <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 36, paddingBottom: clearance }}><Image source={mascotPoses.lookup} accessibilityLabel={t('mascot.alt.lookup')} style={{ width: 140, height: 140 }} resizeMode="contain" /><AppText variant="heading" align="center">{t('anniv.empty.title')}</AppText><AppText tone="text2" align="center">{t('anniv.empty.body')}</AppText><Button label={t('anniv.add')} disabled={offline} onPress={onAdd} /></View> : <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: clearance + 16, gap: 14 }}>
      {section('anniv.section.today', rows(today))}{section('anniv.section.upcoming', upcomingRows)}
      {past.length > 0 && (pastOpen || filter === 'custom' ? <View style={{ gap: 8 }}>{filter === 'all' && <Button variant="ghost" label={t('anniv.past.hide')} onPress={onPast} />}{section('anniv.section.past', rows(past))}</View> : <Button variant="secondary" label={t('anniv.past.show', { n: past.length })} onPress={onPast} />)}
    </ScrollView>}
  </View>;
}
