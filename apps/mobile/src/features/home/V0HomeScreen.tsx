import { Image, Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText, Banner, Card, Chip, ListRow, Skeleton, Toast, useTabBarClearance } from '../../ui/components';
import { mascotPoses } from '../../scene/catalog';
import { useAppColor } from '../../theme/useAppColor';
import { computeMilestoneView, type Occurrence } from '../../lib/anniversaries';
import { formatAnniversary, parseCalendarDate, todayIn } from '../../lib/dday';
import type { MilestoneCelebration } from '../../lib/client';
import type { SpaceState } from '../space/types';
import { CelebrationCard } from './CelebrationCard';
import { InvitePendingCard } from './InvitePendingCard';

export function V0HomeScreen({ state, now, onAnniversaries, onRefresh, onOpenInvite, celebration, onSeen, partnerEdited, onHidePartnerEdited }: { state: SpaceState; now: string; onAnniversaries: () => void; onRefresh: () => void; onOpenInvite: () => void; celebration: MilestoneCelebration | null; onSeen: () => void; partnerEdited?: string | null; onHidePartnerEdited?: () => void }) {
  const { t, i18n } = useTranslation();
  const color = useAppColor(); const insets = useSafeAreaInsets(); const clearance = useTabBarClearance();
  const snapshot = state.snapshot;
  if (!snapshot) return <View style={{ flex: 1, backgroundColor: color.bg, paddingTop: insets.top + 20, paddingHorizontal: 20 }}><Skeleton label={t('state.loading')} height={180} /></View>;
  const { space } = snapshot;
  const view = computeMilestoneView(space.anniversaryDate, space.timeZone, now);
  const partner = snapshot.members.find((member) => member.userId !== snapshot.me.userId)?.displayName ?? t('home.pending.partner');
  const name = snapshot.me.displayName ?? '';
  const showCelebration = celebration && /^(d(50|100|150|200|300)|y[1-9][0-9]*)$/.test(celebration.key) ? celebration : null;
  const title = (item: Occurrence) => item.kind === 'days' ? t('anniv.days', { n: item.n }) : t('anniv.years', { n: item.n });
  const left = (item: Occurrence) => Math.round((parseCalendarDate(item.date)! - parseCalendarDate(todayIn(now, space.timeZone))!) / 86400000);
  const row = (item: Occurrence) => <ListRow key={item.key} label={title(item)} value={t('dday.left', { n: left(item) })} onPress={onAnniversaries} />;
  return <ScrollView style={{ flex: 1, backgroundColor: color.bg }} refreshControl={<RefreshControl refreshing={false} onRefresh={onRefresh} />} contentContainerStyle={{ paddingTop: insets.top + 8, paddingHorizontal: 20, paddingBottom: clearance + 16, gap: 14 }}>
    <AppText>{t('app.name')}</AppText>
    {partnerEdited && <Toast text={partnerEdited} onHide={onHidePartnerEdited} />}
    {state.offline && <Banner kind="warn" text={t('state.offline.banner', { time: state.lastSyncedAt ? new Intl.DateTimeFormat(i18n.language, { hour: 'numeric', minute: '2-digit' }).format(new Date(state.lastSyncedAt)) : '' })} />}
    <View style={{ alignItems: 'center', gap: 4 }}>
      {!state.offline && !showCelebration && space.memberCount > 1 && <Image accessibilityLabel={t('mascot.alt.wave')} source={mascotPoses.wave_main} resizeMode="contain" style={{ width: 96, height: 96 }} />}
      <AppText accessibilityLabel={t('home.names.a11y', { me: name, partner })}>{name} ♥ {partner}</AppText>
      <AppText tone="text2">{t('dday.together')}</AppText>
      <AppText variant="display" accessibilityLabel={t('dday.a11y', { n: view.dayCount, date: formatAnniversary(space.anniversaryDate, i18n.language) })}>{t('dday.big', { n: view.dayCount })}</AppText>
      <AppText tone="text2">{t('dday.since', { date: formatAnniversary(space.anniversaryDate, i18n.language) })}</AppText>
      {space.memberCount < 2 && <Chip kind="warn" icon="clock" label={t('home.pending.chip')} />}
      {showCelebration && showCelebration.daysAgo === 0 && <Chip kind="primary" label={t('home.today.chip', { title: showCelebration.kind === 'day' ? t('anniv.days', { n: showCelebration.days }) : t('anniv.years', { n: showCelebration.anniversaryN }) })} />}
    </View>
    {space.memberCount < 2 ? <InvitePendingCard spaceId={space.spaceId} expiresAt={space.invitation?.expiresAt ?? null} offline={state.offline} onOpenInvite={onOpenInvite} /> : <>
      {showCelebration ? <CelebrationCard celebration={showCelebration} startDate={space.anniversaryDate} disabled={state.offline} onSeen={onSeen} /> : view.next && <Pressable accessibilityRole="button" onPress={onAnniversaries}><Card tone="line"><AppText tone="text2">{t('home.next.label')}</AppText><AppText variant="heading">{title(view.next)}</AppText><AppText>{formatAnniversary(view.next.date, i18n.language)} · {t('dday.left', { n: left(view.next) })}</AppText></Card></Pressable>}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}><AppText variant="heading">{t('home.upcoming.title')}</AppText><Pressable accessibilityRole="button" onPress={onAnniversaries}><AppText tone="primary">{t('home.upcoming.all')}</AppText></Pressable></View>
      <Card>{view.upcoming.map(row)}</Card>
    </>}
  </ScrollView>;
}
