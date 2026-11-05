import { Image, Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText, Banner, Card, Chip, ListRow, Skeleton, Toast, useTabBarClearance } from '../../ui/components';
import { mascotPoses } from '../../scene/catalog';
import { useAppColor } from '../../theme/useAppColor';
import { computeAnniversaries, type Occurrence } from '../../lib/anniversaries';
import { formatAnniversary } from '../../lib/dday';
import type { MilestoneCelebration } from '../../lib/client';
import type { SpaceState } from '../space/types';
import { CelebrationCard } from './CelebrationCard';
import { InvitePendingCard } from './InvitePendingCard';
import { occurrenceTitle, relativeDate } from '../anniversaries/format';
import { splitBigDay, useLargeText } from '../../ui/textScale';

export function V0HomeScreen({ state, now, onAnniversaries, onRefresh, onOpenInvite, celebration, onSeen, partnerEdited, onHidePartnerEdited, seenKeys = [], seenReady = true, onLocalSeen, onOccurrence }: { state: SpaceState; now: string; onAnniversaries: () => void; onRefresh: () => void; onOpenInvite: () => void; celebration: MilestoneCelebration | null; onSeen: () => void; partnerEdited?: string | null; onHidePartnerEdited?: () => void; seenKeys?: string[]; seenReady?: boolean; onLocalSeen?: (key: string) => void; onOccurrence?: (item: Occurrence) => void }) {
  const { t, i18n } = useTranslation();
  const color = useAppColor(); const insets = useSafeAreaInsets(); const clearance = useTabBarClearance(); const large = useLargeText();
  const snapshot = state.snapshot;
  if (!snapshot) return <View style={{ flex: 1, backgroundColor: color.bg, paddingTop: insets.top + 20, paddingHorizontal: 20 }}><Skeleton label={t('state.loading')} height={180} /></View>;
  const { space } = snapshot;
  const partnerMember = snapshot.members.find((member) => member.userId !== snapshot.me.userId);
  const view = computeAnniversaries({ startDate: space.anniversaryDate, timeZone: space.timeZone, me: snapshot.me, partner: partnerMember ?? null, customs: snapshot.anniversaries }, now);
  const partner = partnerMember?.displayName ?? t('home.pending.partner');
  const name = snapshot.me.displayName ?? '';
  const candidate = seenReady ? view.celebrationCandidates.find((item) => item.kind === 'days' || item.kind === 'years' ? celebration?.key === item.key : !seenKeys.includes(item.key)) : undefined;
  const showCelebration = candidate && (candidate.kind === 'days' || candidate.kind === 'years') ? celebration : null;
  const localCelebration = candidate && candidate.kind !== 'days' && candidate.kind !== 'years' ? candidate : null;
  const title = (item: Occurrence) => occurrenceTitle(item, partner, t);
  const next = view.upcoming[0];
  const row = (item: Occurrence) => <ListRow key={item.key} label={title(item)} value={relativeDate(item.date, view.today, t)} onPress={() => onOccurrence ? onOccurrence(item) : onAnniversaries()} />;
  return <ScrollView style={{ flex: 1, backgroundColor: color.bg }} refreshControl={<RefreshControl refreshing={false} onRefresh={onRefresh} />} contentContainerStyle={{ paddingTop: insets.top + 8, paddingHorizontal: 20, paddingBottom: clearance + 16, gap: 14 }}>
    <AppText>{t('app.name')}</AppText>
    {partnerEdited && <Toast text={partnerEdited} onHide={onHidePartnerEdited} />}
    {state.offline && <Banner kind="warn" text={t('state.offline.banner', { time: state.lastSyncedAt ? new Intl.DateTimeFormat(i18n.language, { hour: 'numeric', minute: '2-digit' }).format(new Date(state.lastSyncedAt)) : '' })} />}
    <View style={{ alignItems: 'center', gap: 4 }}>
      {!state.offline && !showCelebration && !localCelebration && space.memberCount > 1 && <Image accessibilityLabel={t('mascot.alt.wave')} source={mascotPoses.wave_main} resizeMode="contain" style={{ width: 96, height: 96 }} />}
      <AppText accessibilityLabel={t('home.names.a11y', { me: name, partner })}>{name} ♥ {partner}</AppText>
      <AppText tone="text2">{t('dday.together')}</AppText>
      <AppText variant="display" accessibilityLabel={t('dday.a11y', { n: view.dayCount, date: formatAnniversary(space.anniversaryDate, i18n.language) })}>{large ? splitBigDay(t('dday.big', { n: view.dayCount }), view.dayCount) : t('dday.big', { n: view.dayCount })}</AppText>
      <AppText tone="text2">{t('dday.since', { date: formatAnniversary(space.anniversaryDate, i18n.language) })}</AppText>
      {space.memberCount < 2 && <Chip kind="warn" icon="clock" label={t('home.pending.chip')} />}
      {showCelebration && showCelebration.daysAgo === 0 && <Chip kind="primary" label={t('home.today.chip', { title: showCelebration.kind === 'day' ? t('anniv.days', { n: showCelebration.days }) : t('anniv.years', { n: showCelebration.anniversaryN }) })} />}
    </View>
    {space.memberCount < 2 ? <InvitePendingCard spaceId={space.spaceId} expiresAt={space.invitation?.expiresAt ?? null} offline={state.offline} onOpenInvite={onOpenInvite} /> : <>
      {showCelebration ? <CelebrationCard celebration={showCelebration} startDate={space.anniversaryDate} disabled={state.offline} onSeen={onSeen} /> : localCelebration ? <Card tone="line" style={{ flexDirection: 'row', alignItems: 'center' }}><Image accessibilityLabel={t('mascot.alt.cheer')} source={mascotPoses.cheer} resizeMode="contain" style={{ width: 90, height: 90 }} /><View style={{ flex: 1 }}><AppText variant="heading">{localCelebration.kind === 'season' ? t('home.today.title.season', { title: title(localCelebration) }) : localCelebration.kind === 'birthday' ? t('home.today.title.birthday', { name: localCelebration.who === 'me' ? name : partner }) : t('home.today.title', { title: title(localCelebration) })}</AppText><AppText tone="text2">{t('home.today.body.season')}</AppText></View><Pressable accessibilityRole="button" accessibilityLabel={t('home.today.close')} onPress={() => onLocalSeen?.(localCelebration.key)}><AppText>×</AppText></Pressable></Card> : next && <Pressable accessibilityRole="button" onPress={() => onOccurrence ? onOccurrence(next) : onAnniversaries()}><Card tone="line"><AppText tone="text2">{t('home.next.label')}</AppText><AppText variant="heading">{title(next)}</AppText><AppText>{formatAnniversary(next.date, i18n.language)} · {relativeDate(next.date, view.today, t)}</AppText></Card></Pressable>}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}><AppText variant="heading">{t('home.upcoming.title')}</AppText><Pressable accessibilityRole="button" onPress={onAnniversaries} style={{ minHeight: 48, justifyContent: 'center' }}><AppText tone="primary">{t('home.upcoming.all')}</AppText></Pressable></View>
      <Card>{view.upcoming.slice(showCelebration || localCelebration ? 0 : 1, showCelebration || localCelebration ? 3 : 4).map(row)}</Card>
    </>}
  </ScrollView>;
}
