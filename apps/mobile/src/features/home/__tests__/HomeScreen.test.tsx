import { fireEvent } from '@testing-library/react-native';
import { renderWithI18n } from '../../../test/render';
import { HomeScreen } from '../HomeScreen';
import { snapshotFixture } from '../../../test/fixtures';
import type { SpaceState } from '../../space/types';
const now = '2026-10-27T03:00:00Z';
const ready = (overrides: Partial<SpaceState> = {}, memberCount = 2): SpaceState => ({ status: 'ready', offline: false, lastSyncedAt: now, snapshot: snapshotFixture({ memberCount }), ...overrides });
const handlers = () => ({ onOpenRoom: jest.fn(), onOpenInvite: jest.fn(), onSaveDate: jest.fn().mockResolvedValue(undefined) });

it('shows a loader before the first snapshot', async () => {
  const screen = await renderWithI18n(<HomeScreen state={{ status: 'loading', snapshot: null, offline: false, lastSyncedAt: null }} now={now} {...handlers()} />);
  expect(screen.getByLabelText(screen.t('main.loading'))).toBeTruthy();
});

it('shows the shared day count and opens the room', async () => {
  const h = handlers();
  const screen = await renderWithI18n(<HomeScreen state={ready()} now={now} {...h} />);
  expect(screen.getByText(screen.t('dday.count', { n: 486 }))).toBeTruthy();
  expect(screen.queryByText(screen.t('main.invitePending.title'))).toBeNull();
  await fireEvent.press(screen.getByRole('button', { name: screen.t('main.openRoom') }));
  expect(h.onOpenRoom).toHaveBeenCalled();
});

it('shows the pending invite state with the hours left', async () => {
  const h = handlers();
  const state = ready({}, 1);
  state.snapshot!.space.invitation = { status: 'active', expiresAt: '2026-10-27T13:00:00Z' };
  const screen = await renderWithI18n(<HomeScreen state={state} now={now} {...h} />);
  expect(screen.getByText(screen.t('main.invitePending.title'))).toBeTruthy();
  expect(screen.getByText(screen.t('main.invitePending.body', { h: 10 }))).toBeTruthy();
  expect(screen.getByText(screen.t('main.chip.waiting'))).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: screen.t('main.invitePending.action') }));
  expect(h.onOpenInvite).toHaveBeenCalled();
});

it('stays readable but read-only offline and after a sync error', async () => {
  const offline = await renderWithI18n(<HomeScreen state={ready({ offline: true })} now={now} {...handlers()} />);
  expect(offline.getByText(offline.t('main.offline.title'))).toBeTruthy();
  expect(offline.getByText(offline.t('dday.count', { n: 486 }))).toBeTruthy();
  expect(offline.getByRole('button', { name: offline.t('main.editDate') }).props.accessibilityState.disabled).toBe(true);
  const failed = await renderWithI18n(<HomeScreen state={ready({ status: 'error' })} now={now} {...handlers()} />);
  expect(failed.getByText(failed.t('main.sync.title'))).toBeTruthy();
  expect(failed.getByText(failed.t('dday.count', { n: 486 }))).toBeTruthy();
});

it('edits the anniversary with the wheel and validates future dates', async () => {
  const h = handlers();
  const screen = await renderWithI18n(<HomeScreen state={ready()} now={now} {...h} />);
  await fireEvent.press(screen.getByRole('button', { name: screen.t('main.editDate') }));
  expect(screen.getByText(screen.t('main.editSheet.body'))).toBeTruthy();
  await fireEvent.press(screen.getByTestId('wheel-year-2026'));
  await fireEvent.press(screen.getByTestId('wheel-month-12'));
  await fireEvent.press(screen.getByRole('button', { name: screen.t('common.save') }));
  expect(screen.getByText(screen.t('space.date.future'))).toBeTruthy();
  await fireEvent.press(screen.getByTestId('wheel-year-2025'));
  await fireEvent.press(screen.getByTestId('wheel-month-7'));
  await fireEvent.press(screen.getByTestId('wheel-day-1'));
  await fireEvent.press(screen.getByRole('button', { name: screen.t('common.save') }));
  expect(h.onSaveDate).toHaveBeenCalledWith('2025-07-01');
  expect(await screen.findByText(screen.t('main.editSheet.saved'))).toBeTruthy();
});
