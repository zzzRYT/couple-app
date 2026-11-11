import { fireEvent, waitFor } from '@testing-library/react-native';
import { renderWithI18n } from '../../test/render';
import { ME, snapshotFixture } from '../../test/fixtures';
import EndedRoute from '../ended';

const mockApp = { userId: ME, client: { ackEnded: jest.fn(async () => undefined) } };
const mockSpace = { ended: { kind: 'disconnect', by: 'me', at: '2026-11-01T00:00:00Z' }, reload: jest.fn(async () => undefined), state: { snapshot: snapshotFixture() } };
jest.mock('../../lib/AppContext', () => ({ useApp: () => mockApp }));
jest.mock('../../features/space/SpaceContext', () => ({ useSpace: () => mockSpace }));
jest.mock('../../features/space/v0Cache', () => ({ readV0Cache: async () => null }));
jest.mock('../../features/space/v0LocalData', () => ({ clearV0LocalData: async () => undefined }));
jest.mock('../../features/notifications/scheduler', () => ({ cancelV0Notifications: async () => undefined }));

it('V0-F13-AC-05 after I disconnect, the ended screen says the space ended, with the V0 body and start-over button', async () => {
  const screen = await renderWithI18n(<EndedRoute />);
  expect(screen.getByText(screen.t('end.done.title'))).toBeTruthy();
  expect(screen.getByText(screen.t('state.ended.body'))).toBeTruthy();
  expect(screen.getByRole('button', { name: screen.t('state.ended.cta') })).toBeTruthy();
  await screen.unmount();
});

it('V0-F13-AC-05 a failed start-over shows a danger banner above the button, and a retry that works moves on', async () => {
  mockApp.client.ackEnded.mockRejectedValueOnce(new Error('offline'));
  const screen = await renderWithI18n(<EndedRoute />);
  expect(screen.queryByRole('alert')).toBeNull();
  await fireEvent.press(screen.getByRole('button', { name: screen.t('state.ended.cta') }));
  const banner = await screen.findByRole('alert');
  expect(banner).toHaveTextContent(`${screen.t('state.error.title')}${screen.t('state.error.body')}`);
  expect(mockSpace.reload).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByRole('button', { name: screen.t('state.ended.cta') }));
  await waitFor(() => expect(mockSpace.reload).toHaveBeenCalledTimes(1));
  expect(screen.queryByRole('alert')).toBeNull();
  await screen.unmount();
});
