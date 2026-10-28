import { render, waitFor } from '@testing-library/react-native';
import { InviteLinkRoute } from '../InviteLinkRoute';
import { savePendingInvite } from '../inviteLink';
import { router, useLocalSearchParams } from 'expo-router';
jest.mock('expo-router', () => ({ router: { replace: jest.fn() }, useLocalSearchParams: jest.fn() }));
jest.mock('../inviteLink', () => ({ ...jest.requireActual('../inviteLink'), savePendingInvite: jest.fn().mockResolvedValue(undefined) }));
it('stores a valid incoming route before returning to the authentication/space gate', async () => {
  jest.mocked(useLocalSearchParams).mockReturnValue({ code: 'TEST-CODE' });
  render(<InviteLinkRoute />);
  await waitFor(() => expect(router.replace).toHaveBeenCalledWith('/'));
  expect(savePendingInvite).toHaveBeenCalledWith('TESTCODE');
  expect(jest.mocked(savePendingInvite).mock.invocationCallOrder[0]!).toBeLessThan(jest.mocked(router.replace).mock.invocationCallOrder[0]!);
});
