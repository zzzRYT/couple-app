import { act, fireEvent } from '@testing-library/react-native';
import { renderWithI18n } from '../../test/render';
import { MascotRoam, ROAM_CYCLE_MS, poseAt } from '../MascotRoam';
import { mascotPoses } from '../catalog';
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
  expect(poseAt(39_000).pose).toBe('lookup');
  expect(poseAt(40_000).pose).toBe('wave_main');
  expect(Math.abs(poseAt(6_000).offsetX)).toBeLessThanOrEqual(0.27);
});

it('animates over time and cheers while pressed', async () => {
  jest.useFakeTimers();
  const screen = await renderWithI18n(<MascotRoam size={100} roamWidth={300} reducedMotion={false} />);
  const pose = () => screen.getByTestId('mascot-pose').props.source;
  expect(pose()).toBe(mascotPoses.wave_main);
  await act(() => { jest.advanceTimersByTime(3_000); });
  expect(pose()).toBe(mascotPoses.walk);
  await fireEvent(screen.getByTestId('mascot'), 'pressIn');
  expect(pose()).toBe(mascotPoses.cheer);
  await fireEvent(screen.getByTestId('mascot'), 'pressOut');
  expect(pose()).toBe(mascotPoses.walk);
});

it.each([[{ reducedMotion: true }], [{ reducedMotion: false, compact: true }], [{ reducedMotion: false, paused: true }]])('stands still in the waving pose for %o', async (props) => {
  jest.useFakeTimers();
  const still = await renderWithI18n(<MascotRoam size={100} roamWidth={300} {...props} />);
  await act(() => { jest.advanceTimersByTime(3_000); });
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
