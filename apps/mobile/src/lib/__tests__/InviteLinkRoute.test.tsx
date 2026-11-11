import { render, waitFor } from '@testing-library/react-native';
import { InviteLinkRoute } from '../InviteLinkRoute';
import { savePendingInvite } from '../inviteLink';
import { router, useLocalSearchParams } from 'expo-router';
import { track } from '../analytics';
jest.mock('expo-router', () => ({ router: { replace: jest.fn() }, useLocalSearchParams: jest.fn() }));
jest.mock('../../features/space/SpaceContext', () => ({ useSpace: () => ({ entry: 'none' }) }));
jest.mock('../analytics', () => ({ track: jest.fn() }));
jest.mock('../inviteLink', () => ({ ...jest.requireActual('../inviteLink'), savePendingInvite: jest.fn().mockResolvedValue(undefined) }));
beforeEach(() => jest.clearAllMocks());
it('counts an opened invite link without its code', async () => {
  jest.mocked(useLocalSearchParams).mockReturnValue({ code: 'TEST-CODE' });
  render(<InviteLinkRoute />);
  await waitFor(() => expect(router.replace).toHaveBeenCalled());
  expect(jest.mocked(track).mock.calls).toEqual([['invite_opened']]);
});

it('does not count a link whose code does not parse', async () => {
  jest.mocked(useLocalSearchParams).mockReturnValue({ code: '!!' });
  render(<InviteLinkRoute />);
  await waitFor(() => expect(router.replace).toHaveBeenCalled());
  expect(track).not.toHaveBeenCalled();
});

it('stores a valid incoming route before returning to the authentication/space gate', async () => {
  jest.mocked(useLocalSearchParams).mockReturnValue({ code: 'TEST-CODE' });
  render(<InviteLinkRoute />);
  await waitFor(() => expect(router.replace).toHaveBeenCalledWith('/join'));
  expect(savePendingInvite).toHaveBeenCalledWith('TESTCODE');
  expect(jest.mocked(savePendingInvite).mock.invocationCallOrder[0]!).toBeLessThan(jest.mocked(router.replace).mock.invocationCallOrder[0]!);
});
