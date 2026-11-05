import { fireEvent } from '@testing-library/react-native';
import { renderWithI18n } from '../../../test/render';
import { snapshotFixture } from '../../../test/fixtures';
import { V0HomeScreen } from '../V0HomeScreen';

it('V0-F03-AC-01 renders the day count and three upcoming milestones', async () => {
  const onAnniversaries = jest.fn();
  const screen = await renderWithI18n(<V0HomeScreen state={{ status: 'ready', snapshot: snapshotFixture(), offline: false, lastSyncedAt: null }} now="2026-11-02T03:00:00Z" onAnniversaries={onAnniversaries} onRefresh={jest.fn()} onOpenInvite={jest.fn()} celebration={null} onSeen={jest.fn()} />);
  expect(screen.getByText('D+492')).toBeTruthy();
  expect(screen.getByText(screen.t('home.upcoming.title'))).toBeTruthy();
  await fireEvent.press(screen.getByText(screen.t('home.upcoming.all')));
  expect(onAnniversaries).toHaveBeenCalled();
});
