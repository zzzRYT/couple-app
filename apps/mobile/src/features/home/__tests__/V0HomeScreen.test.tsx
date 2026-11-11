import { act, fireEvent } from '@testing-library/react-native';
import { renderWithI18n } from '../../../test/render';
import { renderSweep } from '../../../test/a11y';
import { snapshotFixture } from '../../../test/fixtures';
import type { MilestoneCelebration } from '../../../lib/client';
import { V0HomeScreen } from '../V0HomeScreen';

it('V0-F03-AC-01 renders the day count and three upcoming milestones', async () => {
  const onAnniversaries = jest.fn();
  const { screen, t, restore } = await renderSweep(<V0HomeScreen state={{ status: 'ready', snapshot: snapshotFixture(), offline: false, lastSyncedAt: null }} now="2026-11-02T03:00:00Z" onAnniversaries={onAnniversaries} onRefresh={jest.fn()} onOpenInvite={jest.fn()} celebration={null} onSeen={jest.fn()} />, 'ko-KR', 1);
  expect(screen.getByText('D+492')).toBeTruthy();
  expect(screen.getByText(t('home.upcoming.title'))).toBeTruthy();
  await fireEvent.press(screen.getByText(t('home.upcoming.all')));
  expect(onAnniversaries).toHaveBeenCalled();
  restore();
});
it('V0-F09-AC-02 season celebrations replace the card and preserve the first upcoming row', async () => {
  const onLocalSeen = jest.fn();
  const screen = await renderWithI18n(<V0HomeScreen state={{ status: 'ready', snapshot: snapshotFixture(), offline: false, lastSyncedAt: null }} now="2026-11-11T03:00:00Z" onAnniversaries={jest.fn()} onRefresh={jest.fn()} onOpenInvite={jest.fn()} celebration={null} onSeen={jest.fn()} onLocalSeen={onLocalSeen} />);
  expect(screen.getByText(screen.t('home.today.title.season', { title: screen.t('anniv.pepero') }))).toBeTruthy();
  expect(screen.getByText(screen.t('anniv.christmas'))).toBeTruthy();
  await fireEvent.press(screen.getByLabelText(screen.t('home.today.close')));
  expect(onLocalSeen).toHaveBeenCalledWith('season:pepero:2026');
});
it('V0-F09-AC-04 milestone wins over a same-day custom and season celebration', async () => {
  const snapshot = snapshotFixture(); snapshot.space.anniversaryDate = '2025-11-11';
  snapshot.anniversaries = [{ id: 'custom', title: 'A', memo: null, date: '2025-11-11', repeat: 'yearly', createdBy: 'a', updatedBy: 'a', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z', version: 1 }];
  const screen = await renderWithI18n(<V0HomeScreen state={{ status: 'ready', snapshot, offline: false, lastSyncedAt: null }} now="2026-11-11T03:00:00Z" onAnniversaries={jest.fn()} onRefresh={jest.fn()} onOpenInvite={jest.fn()} celebration={{ id: 'id', key: 'y1', kind: 'anniversary', milestoneDate: '2026-11-11', daysAgo: 0, anniversaryN: 1, seenByMe: false, presetAvailable: false, presetId: 'milestone-anniversary' }} onSeen={jest.fn()} />);
  expect(screen.getByText(screen.t('home.today.title', { title: screen.t('anniv.years', { n: 1 }) }))).toBeTruthy();
  expect(screen.queryByText(screen.t('home.today.title.season', { title: screen.t('anniv.pepero') }))).toBeNull();
});
it('V0-F09-AC-05 dismisses a season occurrence only for its stored occurrence key', async () => {
  const screen = await renderWithI18n(<V0HomeScreen state={{ status: 'ready', snapshot: snapshotFixture(), offline: false, lastSyncedAt: null }} now="2026-11-11T03:00:00Z" onAnniversaries={jest.fn()} onRefresh={jest.fn()} onOpenInvite={jest.fn()} celebration={null} onSeen={jest.fn()} seenKeys={['season:pepero:2026']} />);
  expect(screen.queryByText(screen.t('home.today.title.season', { title: screen.t('anniv.pepero') }))).toBeNull();
  expect(screen.getByText(screen.t('home.next.label'))).toBeTruthy();
});
it('V0-F09-AC-04 birthday takes priority over a custom anniversary and season day', async () => {
  const snapshot = snapshotFixture();
  snapshot.me.birthday = { month: 11, day: 11, year: null };
  snapshot.members[1]!.birthday = { month: 11, day: 11 }; snapshot.members[1]!.hasBirthday = true;
  snapshot.anniversaries = [{ id: 'x', title: 'Custom day', date: '2025-11-11', memo: null, repeat: 'yearly', createdBy: 'a', updatedBy: 'a', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z', version: 1 }];
  const screen = await renderWithI18n(<V0HomeScreen state={{ status: 'ready', snapshot, offline: false, lastSyncedAt: null }} now="2026-11-11T03:00:00Z" onAnniversaries={jest.fn()} onRefresh={jest.fn()} onOpenInvite={jest.fn()} celebration={null} onSeen={jest.fn()} />);
  expect(screen.getByText(screen.t('home.today.title.birthday', { name: snapshot.me.displayName }))).toBeTruthy();
  expect(screen.queryByText(screen.t('home.today.title', { title: 'Custom day' }))).toBeNull();
});

const day100: MilestoneCelebration = { id: 'e1', key: 'd100', kind: 'day', days: 100, anniversaryN: null, milestoneDate: '2025-10-06', daysAgo: 0, seenByMe: false, presetAvailable: false, presetId: 'milestone-day' } as MilestoneCelebration;
const homeAt = (now: string, props: Record<string, unknown> = {}, snapshot = snapshotFixture()) => <V0HomeScreen state={{ status: 'ready', snapshot, offline: false, lastSyncedAt: null }} now={now} onAnniversaries={jest.fn()} onRefresh={jest.fn()} onOpenInvite={jest.fn()} celebration={null} onSeen={jest.fn()} {...props} />;

it('V0-F03-AC-02 opens the list from "see all" and the tapped upcoming row', async () => {
  const onAnniversaries = jest.fn(); const onOccurrence = jest.fn();
  const screen = await renderWithI18n(homeAt('2026-11-02T03:00:00Z', { onAnniversaries, onOccurrence }));
  await fireEvent.press(screen.getByText(screen.t('home.upcoming.all')));
  expect(onAnniversaries).toHaveBeenCalledTimes(1);
  await fireEvent.press(screen.getAllByText(screen.t('anniv.christmas')).at(-1)!);
  expect(onOccurrence).toHaveBeenCalledWith(expect.objectContaining({ seasonId: 'christmas' }));
});

it('V0-F03-AC-03 shows the pending home with the empty partner slot, waiting chip, invite hint and the next anniversary', async () => {
  const screen = await renderWithI18n(homeAt('2026-11-02T03:00:00Z', {}, snapshotFixture({ memberCount: 1 })));
  expect(screen.getByText(screen.t('home.pending.chip'))).toBeTruthy();
  expect(screen.getByText(screen.t('home.pending.title'))).toBeTruthy();
  expect(screen.getByText(screen.t('home.pending.hint'))).toBeTruthy();
  expect(screen.getByLabelText(screen.t('home.names.a11y', { me: '하루', partner: screen.t('home.pending.partner') }))).toBeTruthy();
  expect(screen.getByText(screen.t('home.next.label'))).toBeTruthy();
  expect(screen.queryByText(screen.t('home.upcoming.title'))).toBeNull();
});

it('V0-F09-AC-01 shows the celebration card under the invite card on a pending milestone day, not the chip alone', async () => {
  const screen = await renderWithI18n(homeAt('2025-10-06T03:00:00Z', { celebration: day100 }, snapshotFixture({ memberCount: 1 })));
  expect(screen.getByText(screen.t('home.today.chip', { title: screen.t('anniv.days', { n: 100 }) }))).toBeTruthy();
  expect(screen.getByText(screen.t('home.today.title', { title: screen.t('anniv.days', { n: 100 }) }))).toBeTruthy();
});

it('V0-F03-AC-01 reads the next card as one element and draws upcoming rows like the anniversary list', async () => {
  const snapshot = snapshotFixture();
  snapshot.anniversaries = [{ id: 'c', title: '처음 만난 날', memo: null, date: '2025-12-01', repeat: 'yearly', createdBy: 'a', updatedBy: 'a', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z', version: 1 }];
  const screen = await renderWithI18n(homeAt('2026-11-02T03:00:00Z', {}, snapshot));
  const pepero = screen.t('anniv.row.a11y', { title: screen.t('anniv.pepero'), date: '2026년 11월 11일 (수)', left: screen.t('dday.left', { n: 9 }) });
  expect(screen.getByRole('button', { name: `${screen.t('home.next.label')}, ${pepero}` })).toBeTruthy();
  expect(screen.getByText('11월 11일 (수)')).toBeTruthy();
  expect(screen.getByRole('button', { name: screen.t('anniv.row.a11y', { title: '처음 만난 날', date: '2026년 12월 1일 (화)', left: screen.t('dday.left', { n: 29 }) }) })).toBeTruthy();
  expect(screen.getByText(screen.t('anniv.badge.custom'))).toBeTruthy();
});

it('V0-F03-AC-01 writes the start date with a short month in English and reads the day count once', async () => {
  const screen = await renderWithI18n(homeAt('2026-11-02T03:00:00Z'), 'en-US');
  expect(screen.getByText(screen.t('dday.since', { date: 'Jun 29, 2025' }))).toBeTruthy();
  expect(screen.getByLabelText(screen.t('dday.a11y', { n: 492, date: 'Jun 29, 2025' }))).toBeTruthy();
});

it('heads the home with the 아룸 wordmark in Korean and the Aroom wordmark in every other language, named in the reader\'s language', async () => {
  const header = async (locale: 'ko-KR' | 'en-US' | 'ja-JP') => {
    const screen = await renderWithI18n(homeAt('2026-11-02T03:00:00Z'), locale);
    const image = screen.getByRole('header', { name: screen.t('app.name') });
    return { name: screen.t('app.name'), source: image.props.source, width: image.props.style.width };
  };
  const [ko, en, ja] = [await header('ko-KR'), await header('en-US'), await header('ja-JP')];
  expect([ko.name, en.name, ja.name]).toEqual(['아룸', 'Aroom', 'アルーム']);
  expect(ja.source).toEqual(en.source);
  expect(ko.source).not.toEqual(en.source);
  expect(ko.width).toBeLessThan(en.width);
});

it('V0-F03-AC-04 shows the partner-edited notice and counts from the new start date', async () => {
  const snapshot = snapshotFixture(); snapshot.space.anniversaryDate = '2025-10-01';
  const notice = 'partner edited';
  const screen = await renderWithI18n(homeAt('2026-11-02T03:00:00Z', { partnerEdited: notice }, snapshot));
  expect(screen.getByText(notice)).toBeTruthy();
  expect(screen.getByLabelText(screen.t('dday.a11y', { n: 398, date: '2025년 10월 1일' }))).toBeTruthy();
  expect(screen.getByText(screen.t('dday.since', { date: '2025년 10월 1일' }))).toBeTruthy();
});

it('V0-F09-AC-01 shows the 100-day celebration card in place of the next card, with no room suggestion', async () => {
  const screen = await renderWithI18n(homeAt('2025-10-06T03:00:00Z', { celebration: day100 }));
  expect(screen.getByText(screen.t('home.today.title', { title: screen.t('anniv.days', { n: 100 }) }))).toBeTruthy();
  expect(screen.getByText(screen.t('home.today.body.milestone', { date: '2025년 6월 29일', n: 100 }))).toBeTruthy();
  expect(screen.queryByText(screen.t('home.next.label'))).toBeNull();
  expect(screen.queryByRole('button', { name: screen.t('milestone.action.suggest') })).toBeNull();
});

it('V0-F09-AC-03 shows a day milestone three days late, and a season day only on the day itself', async () => {
  const late = { ...day100, daysAgo: 3 };
  const screen = await renderWithI18n(homeAt('2025-10-09T03:00:00Z', { celebration: late }));
  expect(screen.getByText(screen.t('home.today.late', { date: '10월 6일', title: screen.t('anniv.days', { n: 100 }) }))).toBeTruthy();
  const after = await renderWithI18n(homeAt('2026-11-12T03:00:00Z'));
  expect(after.queryByText(after.t('home.today.title.season', { title: after.t('anniv.pepero') }))).toBeNull();
});

it('V0-F09-AC-05 closing a day or year card asks the server to record it for this member only', async () => {
  const onSeen = jest.fn();
  const screen = await renderWithI18n(homeAt('2025-10-06T03:00:00Z', { celebration: day100, onSeen }));
  await fireEvent.press(screen.getByLabelText(screen.t('home.today.close')));
  expect(onSeen).toHaveBeenCalledTimes(1);
});

it('V0-F09-AC-04 shows one celebration card a day: after one is closed the other occasions of today stay in the list', async () => {
  const snapshot = snapshotFixture(); snapshot.me.birthday = { month: 11, day: 11, year: null };
  const pepero = (screen: { t: (key: string, options?: Record<string, unknown>) => string }) => screen.t('home.today.title.season', { title: screen.t('anniv.pepero') });
  const closedBirthday = await renderWithI18n(homeAt('2026-11-11T03:00:00Z', { seenKeys: ['bday:me:2026'] }, snapshot));
  expect(closedBirthday.queryByText(pepero(closedBirthday))).toBeNull();
  expect(closedBirthday.queryByLabelText(closedBirthday.t('home.today.close'))).toBeNull();
  expect(closedBirthday.getByText(closedBirthday.t('home.next.label'))).toBeTruthy();
  await closedBirthday.unmount();
  const milestoneDay = snapshotFixture(); milestoneDay.space.anniversaryDate = '2025-11-11';
  const closedMilestone = await renderWithI18n(homeAt('2026-11-11T03:00:00Z', { closedMilestoneKey: 'y1' }, milestoneDay));
  expect(closedMilestone.queryByText(pepero(closedMilestone))).toBeNull();
  expect(closedMilestone.queryByLabelText(closedMilestone.t('home.today.close'))).toBeNull();
});

it('V0-F09-AC-03 a late milestone card still shows after the card of today is closed', async () => {
  const snapshot = snapshotFixture(); snapshot.space.anniversaryDate = '2025-07-31';
  const late = { ...day100, milestoneDate: '2025-11-07', daysAgo: 4 };
  const screen = await renderWithI18n(homeAt('2025-11-11T03:00:00Z', { celebration: late, seenKeys: ['season:pepero:2025'] }, snapshot));
  expect(screen.getByText(screen.t('home.today.late', { date: '11월 7일', title: screen.t('anniv.days', { n: 100 }) }))).toBeTruthy();
});

it('V0-F03-AC-04 keeps the partner-edited notice for 4.5 seconds and hides it on a tap', async () => {
  jest.useFakeTimers();
  try {
    const onHide = jest.fn();
    const screen = await renderWithI18n(homeAt('2026-11-02T03:00:00Z', { partnerEdited: 'partner edited', onHidePartnerEdited: onHide }));
    await act(() => { jest.advanceTimersByTime(4499); });
    expect(onHide).not.toHaveBeenCalled();
    await act(() => { jest.advanceTimersByTime(1); });
    expect(onHide).toHaveBeenCalledTimes(1);
    await fireEvent.press(screen.getByText('partner edited'));
    expect(onHide).toHaveBeenCalledTimes(2);
  } finally { jest.useRealTimers(); }
});
