import { act, fireEvent } from '@testing-library/react-native';
import { renderWithI18n } from '../../test/render';
import { MascotRoam } from '../MascotRoam';
import { ROAM_CYCLE_MS, ROAM_RANGE, STEP_HEIGHT, TAP_CHEER_MS, poseAt } from '../roamCycle';
import { mascotPoses } from '../catalog';
jest.mock('../../ui/motion', () => ({ useReducedMotion: () => false, useLoopActive: () => true }));
afterEach(() => jest.useRealTimers());

it('follows the 40 second pose cycle with flipped walking', () => {
  expect(ROAM_CYCLE_MS).toBe(40_000);
  expect(poseAt(0).pose).toBe('wave_main');
  expect(poseAt(3_000)).toMatchObject({ pose: 'walk', flipX: true });
  expect(poseAt(7_000).pose).toBe('cheer');
  expect(poseAt(10_000)).toMatchObject({ pose: 'walk', flipX: false });
  expect(poseAt(16_000).pose).toBe('lookup');
  expect(poseAt(18_500).pose).toBe('lie');
  expect(poseAt(22_000).pose).toBe('sleep');
  expect(poseAt(30_000)).toMatchObject({ pose: 'walk', flipX: true });
  expect(poseAt(33_000).pose).toBe('wave_main');
  expect(poseAt(39_000).pose).toBe('lookup');
  expect(poseAt(40_000)).toEqual(poseAt(0));
});

it('stays inside ±27% of the room and bobs only while walking', () => {
  for (let t = 0; t < ROAM_CYCLE_MS; t += 250) {
    const frame = poseAt(t);
    expect(Math.abs(frame.offsetX)).toBeLessThanOrEqual(ROAM_RANGE + 1e-9);
    if (frame.pose !== 'walk') expect(frame.bob).toBe(0);
    else expect(frame.bob).toBeGreaterThanOrEqual(-STEP_HEIGHT);
  }
  expect(poseAt(6_000).offsetX).toBeCloseTo(ROAM_RANGE);
  expect(poseAt(14_800).offsetX).toBeCloseTo(-ROAM_RANGE);
  expect(poseAt(2_500).bob).toBeCloseTo(-STEP_HEIGHT);
});

it('roams on the UI thread and cheers for 1.2 seconds when tapped', async () => {
  jest.useFakeTimers();
  const screen = await renderWithI18n(<MascotRoam size={100} roamWidth={300} reducedMotion={false} />);
  expect(screen.getByTestId('mascot-roaming')).toBeTruthy();
  expect(screen.queryByTestId('mascot-pose')).toBeNull();
  await fireEvent.press(screen.getByTestId('mascot'));
  expect(screen.getByTestId('mascot-pose').props.source).toBe(mascotPoses.cheer);
  await act(() => { jest.advanceTimersByTime(TAP_CHEER_MS - 100); });
  expect(screen.getByTestId('mascot-pose').props.source).toBe(mascotPoses.cheer);
  await act(() => { jest.advanceTimersByTime(200); });
  expect(screen.queryByTestId('mascot-pose')).toBeNull();
  expect(screen.getByTestId('mascot-roaming')).toBeTruthy();
});

it.each([[{ reducedMotion: true }], [{ reducedMotion: false, compact: true }], [{ reducedMotion: false, paused: true }]])('stands still in the waving pose for %o', async (props) => {
  const still = await renderWithI18n(<MascotRoam size={100} roamWidth={300} {...props} />);
  expect(still.queryByTestId('mascot-roaming')).toBeNull();
  expect(still.getByTestId('mascot-pose').props.source).toBe(mascotPoses.wave_main);
});

it('announces the pose once with a fixed label', async () => {
  jest.useFakeTimers();
  const screen = await renderWithI18n(<MascotRoam size={100} roamWidth={300} reducedMotion={false} />);
  const label = screen.getByTestId('mascot').props.accessibilityLabel;
  expect(label).toBe(screen.t('a11y.mascot', { pose: screen.t('a11y.pose.wave_main') }));
  await act(() => { jest.advanceTimersByTime(10_000); });
  expect(screen.getByTestId('mascot').props.accessibilityLabel).toBe(label);
});
