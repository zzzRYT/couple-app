import { fireEvent, waitFor, within } from '@testing-library/react-native';
import { renderWithI18n } from '../../../test/render';
import { PARTNER, snapshotFixture } from '../../../test/fixtures';
import { lease } from '../../../test/promptClient';
import { RoomScreen } from '../RoomScreen';
import { HomeScreen } from '../../home/HomeScreen';
import { estimateLayout } from '../../../scene/protectedZones';
import { mascotPoses } from '../../../scene/catalog';
import type { SpaceState } from '../../space/types';
const now = '2026-10-27T03:00:00Z';
const layout = estimateLayout(390, 844, 1, 'ios');
const ready = (snapshot = snapshotFixture()): SpaceState => ({ status: 'ready', snapshot, offline: false, lastSyncedAt: now });
const room = (state: SpaceState, onRecall = jest.fn().mockResolvedValue(undefined), onDecorate = jest.fn()) => renderWithI18n(<RoomScreen state={state} now={now} layout={layout} reducedMotion onDecorate={onDecorate} onRecall={onRecall} />);

it('opens a new room with exactly one mascot and a toolbar holding only "decorate"', async () => {
  const onDecorate = jest.fn();
  const screen = await room(ready(), undefined, onDecorate);
  expect(screen.getAllByTestId('mascot')).toHaveLength(1);
  const toolbar = within(screen.getByTestId('room-toolbar'));
  expect(toolbar.getAllByRole('button')).toHaveLength(1);
  await fireEvent.press(toolbar.getByRole('button', { name: screen.t('a11y.decorate') }));
  expect(onDecorate).toHaveBeenCalled();
});

it('renders the D-day as a native widget whose position and style follow the presentation but never the date', async () => {
  const snapshot = snapshotFixture();
  snapshot.roomPresentation = { ...snapshot.roomPresentation, x: 0.5, y: 0.5, styleToken: 'night.accent', textScale: 1.5 };
  const screen = await room(ready(snapshot));
  const widget = screen.getByTestId('dday-widget');
  expect(widget.props.style.top).toBeCloseTo((0.5 - 0.07) * 844);
  expect(within(widget).getByText(screen.t('dday.count', { n: 486 }))).toBeTruthy();
  expect(widget.props.accessibilityLabel).toContain(screen.t('dday.count', { n: 486 }));
  expect(widget.props.accessibilityLabel).toContain('2025년 6월 29일');
});

it('hides the widget in the room', async () => {
  const snapshot = snapshotFixture();
  snapshot.roomPresentation = { ...snapshot.roomPresentation, visible: false };
  const screen = await room(ready(snapshot));
  expect(screen.queryByTestId('dday-widget')).toBeNull();
  expect(screen.getByText(screen.t('room.ddayHidden'))).toBeTruthy();
});

it('keeps the home D-day when the room hides its widget', async () => {
  const snapshot = snapshotFixture();
  snapshot.roomPresentation = { ...snapshot.roomPresentation, visible: false };
  const home = await renderWithI18n(<HomeScreen state={ready(snapshot)} now={now} onOpenRoom={jest.fn()} onOpenInvite={jest.fn()} onSaveDate={jest.fn()} />);
  expect(home.getByText(home.t('dday.count', { n: 486 }))).toBeTruthy();
});

it('shows the recall control when the mascot was removed and recalls once automatically', async () => {
  const onRecall = jest.fn().mockResolvedValue(undefined);
  const screen = await room(ready(snapshotFixture({ objects: [] })), onRecall);
  expect(screen.queryByTestId('mascot')).toBeNull();
  expect(screen.getByText(screen.t('room.mascot.missing'))).toBeTruthy();
  await waitFor(() => expect(onRecall).toHaveBeenCalledTimes(1));
  await fireEvent.press(screen.getByRole('button', { name: screen.t('room.mascot.recall') }));
  expect(onRecall).toHaveBeenCalledTimes(2);
});

it('disables recall with a reason while the partner holds the session', async () => {
  const onRecall = jest.fn().mockResolvedValue(undefined);
  const screen = await room(ready(snapshotFixture({ objects: [], promptSession: lease(PARTNER, '2026-10-27T03:02:00Z') })), onRecall);
  expect(screen.getByRole('button', { name: screen.t('room.mascot.recall') }).props.accessibilityState.disabled).toBe(true);
  expect(screen.getAllByText(screen.t('prompt.partner', { name: screen.t('report.target.partner') })).length).toBeGreaterThan(0);
  expect(onRecall).not.toHaveBeenCalled();
});

it('shows the standing wave pose with reduced motion', async () => {
  const screen = await room(ready());
  expect(screen.getByTestId('mascot-pose').props.source).toBe(mascotPoses.wave_main);
});

it('disables decorating offline with a read-only banner', async () => {
  const screen = await room({ ...ready(), offline: true });
  expect(screen.getByText(screen.t('room.offline'))).toBeTruthy();
  expect(screen.getByRole('button', { name: screen.t('a11y.decorate') }).props.accessibilityState.disabled).toBe(true);
});


it('keeps a stored widget below the toolbar when their frames overlap', async () => {
  const screen = await room(ready());
  const widget = screen.getByTestId('dday-widget');
  expect(widget.props.style.top).toBeGreaterThanOrEqual(layout.toolbar.y + layout.toolbar.height);
});

it('turns "decorate" into "watch" while the partner holds the session and toasts a partner change once', async () => {
  const onDecorate = jest.fn();
  const watching = snapshotFixture({ promptSession: lease(PARTNER, '2026-10-27T03:02:00Z') });
  const screen = await renderWithI18n(<RoomScreen state={ready(watching)} now={now} layout={layout} reducedMotion onDecorate={onDecorate} onRecall={jest.fn()} />);
  await fireEvent.press(within(screen.getByTestId('room-toolbar')).getByRole('button', { name: screen.t('room.watch') }));
  expect(onDecorate).toHaveBeenCalled();
  const changed = snapshotFixture();
  changed.versionNumber = watching.versionNumber + 1;
  await screen.rerender(<RoomScreen state={ready(changed)} now={now} layout={layout} reducedMotion onDecorate={onDecorate} onRecall={jest.fn()} />);
  expect(screen.getByText(screen.t('room.partnerChanged', { name: screen.t('report.target.partner') }))).toBeTruthy();
});
