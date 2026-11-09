import { Alert } from 'react-native';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { renderWithI18n } from '../../../test/render';
import { snapshotFixture } from '../../../test/fixtures';
import { ApiError } from '../../../lib/errors';
import StartDateRoute from '../../../app/settings/start-date';
const mockUseSpace = jest.fn();
const mockNow = jest.fn();
const mockBack = jest.fn();
const mockClient = { updateAnniversary: jest.fn(), snapshot: jest.fn() };
jest.mock('expo-router', () => ({ router: { back: () => mockBack() } }));
jest.mock('../../space/SpaceContext', () => ({ useSpace: () => mockUseSpace() }));
jest.mock('../../../lib/useNow', () => ({ useNow: () => mockNow() }));
jest.mock('../../../lib/AppContext', () => ({ useApp: () => ({ client: mockClient }) }));
const alert = jest.spyOn(Alert, 'alert');
beforeEach(() => {
  jest.clearAllMocks();
  alert.mockImplementation(() => undefined);
  mockNow.mockReturnValue('2025-07-01T03:00:00Z');
});
const open = (snapshot = snapshotFixture(), refresh = jest.fn().mockResolvedValue(undefined)) => {
  mockUseSpace.mockReturnValue({ state: { snapshot, offline: false }, refresh });
  return { snapshot, refresh };
};
const confirm = () => (alert.mock.calls[0]![2] as { text: string; isPreferred?: boolean; onPress?: () => void }[])[1]!;

it('V0-F12-AC-03 previews the day count, asks for confirmation and applies the date to both people', async () => {
  const { snapshot, refresh } = open();
  mockClient.updateAnniversary.mockResolvedValue(undefined);
  const screen = await renderWithI18n(<StartDateRoute />);
  expect(screen.getByText(screen.t('set.start.preview', { n: 3 }))).toBeTruthy();
  expect(screen.getByText(screen.t('start.date.body'))).toBeTruthy();
  await fireEvent.press(screen.getByText(screen.t('common.save')));
  expect(alert).toHaveBeenCalledWith(screen.t('set.start.confirm.title'), expect.stringContaining('도담님'), expect.any(Array));
  // V0-set-start-confirm: the dates as 2025.06.29, and 바꾸기 is the preferred button.
  expect(alert.mock.calls[0]![1]).toContain('2025.06.29 → 2025.06.29');
  expect(confirm()).toMatchObject({ text: screen.t('set.start.confirm.cta'), isPreferred: true });
  expect(mockClient.updateAnniversary).not.toHaveBeenCalled();
  confirm().onPress!();
  await waitFor(() => expect(mockBack).toHaveBeenCalled());
  expect(mockClient.updateAnniversary).toHaveBeenCalledWith('space-1', '2025-06-29', snapshot.space.updatedAt);
  expect(refresh).toHaveBeenCalled();
});

it('V0-F12-AC-03 picks a new start date in the wheel sheet and applies it on 완료', async () => {
  open();
  const screen = await renderWithI18n(<StartDateRoute />);
  await fireEvent.press(screen.getByRole('button', { name: `${screen.t('start.date.label')}, 29${screen.t('space.day')}` }));
  await fireEvent.press(screen.getByTestId('wheel-day-30'));
  expect(screen.getByText(screen.t('set.start.preview', { n: 3 }))).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: screen.t('common.done') }));
  expect(screen.getByText(screen.t('set.start.preview', { n: 2 }))).toBeTruthy();
});

it('V0-F12-AC-03 refuses a start date after today', async () => {
  open();
  mockNow.mockReturnValue('2025-01-01T03:00:00Z');
  const screen = await renderWithI18n(<StartDateRoute />);
  expect(screen.getByText(screen.t('start.date.err.future'))).toBeTruthy();
  expect(screen.getByRole('button', { name: screen.t('common.save') }).props.accessibilityState.disabled).toBe(true);
});

it('V0-F12-AC-04 shows the latest start date again after a version conflict', async () => {
  const { refresh } = open();
  mockClient.updateAnniversary.mockRejectedValue(new ApiError(409, 'VERSION_CONFLICT'));
  mockClient.snapshot.mockResolvedValue({ ...snapshotFixture(), space: { ...snapshotFixture().space, anniversaryDate: '2025-06-30' } });
  const screen = await renderWithI18n(<StartDateRoute />);
  await fireEvent.press(screen.getByText(screen.t('common.save')));
  confirm().onPress!();
  await waitFor(() => expect(screen.getByText(screen.t('state.error.title'))).toBeTruthy());
  expect(refresh).toHaveBeenCalled();
  expect(mockClient.snapshot).toHaveBeenCalledWith('space-1');
  expect(mockBack).not.toHaveBeenCalled();
  expect(screen.getByText(screen.t('set.start.preview', { n: 2 }))).toBeTruthy();
  // The date on screen now differs from the saved one, so the change is spelled out before saving again.
  expect(screen.getByText(screen.t('set.start.confirm.body', { old: '2025.06.29', new: '2025.06.30', name: '도담' }))).toBeTruthy();
});
