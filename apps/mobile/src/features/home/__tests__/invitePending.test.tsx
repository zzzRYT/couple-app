import { fireEvent } from '@testing-library/react-native';
import * as Clipboard from 'expo-clipboard';
import { renderWithI18n } from '../../../test/render';
import { snapshotFixture } from '../../../test/fixtures';
import { V0HomeScreen } from '../V0HomeScreen';

jest.mock('expo-clipboard', () => ({ setStringAsync: jest.fn(async () => true) }));
jest.mock('../../space/v0LocalData', () => ({ readV0Invite: jest.fn(async () => ({ code: 'ABCD2345', expiresAt: '2026-11-01T00:00:00Z' })) }));

it('V0-EC-07 shows the expired state with a reissue action on the pending home', async () => {
  const snapshot = snapshotFixture({ memberCount: 1 });
  snapshot.space.invitation = { status: 'active', expiresAt: '2026-11-01T00:00:00Z' };
  const onOpenInvite = jest.fn();
  const screen = await renderWithI18n(<V0HomeScreen state={{ status: 'ready', snapshot, offline: false, lastSyncedAt: null }} now="2026-11-02T03:00:00Z" onAnniversaries={jest.fn()} onRefresh={jest.fn()} onOpenInvite={onOpenInvite} celebration={null} onSeen={jest.fn()} />);
  expect(await screen.findByText(screen.t('invite.expired.title'))).toBeTruthy();
  await fireEvent.press(screen.getByText(screen.t('invite.reissue')));
  expect(onOpenInvite).toHaveBeenCalledWith(true);
});

describe('V0-F02-AC-11 entering the partner code from Home (V0-10)', () => {
  const render = (memberCount: number, offline = false, onHaveCode = jest.fn()) => {
    const snapshot = snapshotFixture({ memberCount });
    snapshot.space.invitation = { status: 'active', expiresAt: '2026-11-01T00:00:00Z' };
    return renderWithI18n(<V0HomeScreen state={{ status: 'ready', snapshot, offline, lastSyncedAt: null }} now="2026-10-31T03:00:00Z" onAnniversaries={jest.fn()} onRefresh={jest.fn()} onOpenInvite={jest.fn()} onHaveCode={onHaveCode} celebration={null} onSeen={jest.fn()} />);
  };
  it('puts "상대에게 코드를 받았어요" under my code while waiting', async () => {
    const onHaveCode = jest.fn();
    const screen = await render(1, false, onHaveCode);
    await fireEvent.press(await screen.findByRole('button', { name: screen.t('home.pending.haveCode') }));
    expect(onHaveCode).toHaveBeenCalled();
  });
  it('shows the time left and confirms a copy with a notice (V0-F03-AC-03)', async () => {
    const screen = await render(1);
    expect(await screen.findByText(screen.t('invite.expires', { h: 21, m: 0 }))).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: screen.t('invite.copy') }));
    expect(Clipboard.setStringAsync).toHaveBeenCalledWith('ABCD2345');
    expect(await screen.findByText(screen.t('invite.copied'))).toBeTruthy();
    expect(screen.getByRole('button', { name: screen.t('invite.share') })).toBeTruthy();
  });
  it('is disabled offline and gone once connected', async () => {
    const offline = await render(1, true);
    expect((await offline.findByRole('button', { name: offline.t('home.pending.haveCode') })).props.accessibilityState.disabled).toBe(true);
    offline.unmount();
    const connected = await render(2);
    expect(connected.queryByRole('button', { name: connected.t('home.pending.haveCode') })).toBeNull();
  });
});
