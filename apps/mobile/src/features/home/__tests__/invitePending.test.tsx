import { fireEvent } from '@testing-library/react-native';
import { renderWithI18n } from '../../../test/render';
import { snapshotFixture } from '../../../test/fixtures';
import { V0HomeScreen } from '../V0HomeScreen';

jest.mock('expo-clipboard', () => ({ setStringAsync: jest.fn() }));
jest.mock('../../space/v0LocalData', () => ({ readV0Invite: jest.fn(async () => ({ code: 'ABCD2345', expiresAt: '2026-11-01T00:00:00Z' })) }));

it('V0-EC-07 shows the expired state with a reissue action on the pending home', async () => {
  const snapshot = snapshotFixture({ memberCount: 1 });
  snapshot.space.invitation = { status: 'active', expiresAt: '2026-11-01T00:00:00Z' };
  const onOpenInvite = jest.fn();
  const screen = await renderWithI18n(<V0HomeScreen state={{ status: 'ready', snapshot, offline: false, lastSyncedAt: null }} now="2026-11-02T03:00:00Z" onAnniversaries={jest.fn()} onRefresh={jest.fn()} onOpenInvite={onOpenInvite} celebration={null} onSeen={jest.fn()} />);
  expect(await screen.findByText(screen.t('invite.expired.title'))).toBeTruthy();
  await fireEvent.press(screen.getByText(screen.t('invite.reissue')));
  expect(onOpenInvite).toHaveBeenCalled();
});
