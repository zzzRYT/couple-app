import { fireEvent } from '@testing-library/react-native';
import { renderWithI18n } from '../../../test/render';
import { renderSweep } from '../../../test/a11y';
import { snapshotFixture } from '../../../test/fixtures';
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
it('V0-F09 season celebrations replace the card and preserve the first upcoming row', async () => {
  const onLocalSeen = jest.fn();
  const screen = await renderWithI18n(<V0HomeScreen state={{ status: 'ready', snapshot: snapshotFixture(), offline: false, lastSyncedAt: null }} now="2026-11-11T03:00:00Z" onAnniversaries={jest.fn()} onRefresh={jest.fn()} onOpenInvite={jest.fn()} celebration={null} onSeen={jest.fn()} onLocalSeen={onLocalSeen} />);
  expect(screen.getByText(screen.t('home.today.title.season', { title: screen.t('anniv.pepero') }))).toBeTruthy();
  expect(screen.getByText(screen.t('anniv.christmas'))).toBeTruthy();
  await fireEvent.press(screen.getByLabelText(screen.t('home.today.close')));
  expect(onLocalSeen).toHaveBeenCalledWith('season:pepero:2026');
});
it('V0-F09 milestone wins over a same-day custom and season celebration', async () => {
  const snapshot = snapshotFixture(); snapshot.space.anniversaryDate = '2025-11-11';
  snapshot.anniversaries = [{ id: 'custom', title: 'A', memo: null, date: '2025-11-11', repeat: 'yearly', createdBy: 'a', updatedBy: 'a', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z', version: 1 }];
  const screen = await renderWithI18n(<V0HomeScreen state={{ status: 'ready', snapshot, offline: false, lastSyncedAt: null }} now="2026-11-11T03:00:00Z" onAnniversaries={jest.fn()} onRefresh={jest.fn()} onOpenInvite={jest.fn()} celebration={{ id: 'id', key: 'y1', kind: 'anniversary', milestoneDate: '2026-11-11', daysAgo: 0, anniversaryN: 1, seenByMe: false, presetAvailable: false, presetId: 'milestone-anniversary' }} onSeen={jest.fn()} />);
  expect(screen.getByText(screen.t('home.today.title', { title: screen.t('anniv.years', { n: 1 }) }))).toBeTruthy();
  expect(screen.queryByText(screen.t('home.today.title.season', { title: screen.t('anniv.pepero') }))).toBeNull();
});
it('V0-F09 dismisses a season occurrence only for its stored occurrence key', async () => {
  const screen = await renderWithI18n(<V0HomeScreen state={{ status: 'ready', snapshot: snapshotFixture(), offline: false, lastSyncedAt: null }} now="2026-11-11T03:00:00Z" onAnniversaries={jest.fn()} onRefresh={jest.fn()} onOpenInvite={jest.fn()} celebration={null} onSeen={jest.fn()} seenKeys={['season:pepero:2026']} />);
  expect(screen.queryByText(screen.t('home.today.title.season', { title: screen.t('anniv.pepero') }))).toBeNull();
  expect(screen.getByText(screen.t('home.next.label'))).toBeTruthy();
});
it('V0-F09 birthday takes priority over a custom anniversary and season day', async () => {
  const snapshot = snapshotFixture();
  snapshot.me.birthday = { month: 11, day: 11, year: null };
  snapshot.members[1]!.birthday = { month: 11, day: 11 }; snapshot.members[1]!.hasBirthday = true;
  snapshot.anniversaries = [{ id: 'x', title: 'Custom day', date: '2025-11-11', memo: null, repeat: 'yearly', createdBy: 'a', updatedBy: 'a', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z', version: 1 }];
  const screen = await renderWithI18n(<V0HomeScreen state={{ status: 'ready', snapshot, offline: false, lastSyncedAt: null }} now="2026-11-11T03:00:00Z" onAnniversaries={jest.fn()} onRefresh={jest.fn()} onOpenInvite={jest.fn()} celebration={null} onSeen={jest.fn()} />);
  expect(screen.getByText(screen.t('home.today.title.birthday', { name: snapshot.me.displayName }))).toBeTruthy();
  expect(screen.queryByText(screen.t('home.today.title', { title: 'Custom day' }))).toBeNull();
});
