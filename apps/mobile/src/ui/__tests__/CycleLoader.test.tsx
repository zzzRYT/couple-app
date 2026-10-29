import { render } from '@testing-library/react-native';
import { CycleLoader, LOADER_CYCLE_MS, LOADER_STEP_MS, loaderPose } from '../CycleLoader';
jest.mock('../motion', () => ({ useReducedMotion: () => false, useLoopActive: () => true }));

it('never shows more than one object at a time, 1.2 s apart, over a 4.8 s round', () => {
  expect(LOADER_CYCLE_MS).toBe(4 * LOADER_STEP_MS);
  for (let t = 0; t < LOADER_CYCLE_MS; t += 100) {
    const visible = [0, 1, 2, 3].filter((index) => loaderPose(t, index).opacity > 0.5);
    expect(visible.length).toBeLessThanOrEqual(1);
  }
  expect(loaderPose(600, 0)).toMatchObject({ opacity: 1, scale: 1 });
  expect(loaderPose(600 + LOADER_STEP_MS, 1)).toMatchObject({ opacity: 1, scale: 1 });
  expect(loaderPose(0, 0)).toMatchObject({ opacity: 0, scale: 0.6, rotate: -6 });
  expect(loaderPose(LOADER_CYCLE_MS * 3 + 600, 0)).toEqual(loaderPose(600, 0));
});

it('announces the message once and keeps the art out of the reading order', async () => {
  const screen = await render(<CycleLoader label="Creating your space" />);
  expect(screen.getByRole('progressbar', { name: 'Creating your space' })).toBeTruthy();
  expect(screen.getByText('Creating your space')).toBeTruthy();
  expect(screen.queryByTestId('loader-frame', { includeHiddenElements: true })).toBeNull();
});

it('stays on the plant with reduced motion', async () => {
  const screen = await render(<CycleLoader label="Loading" reducedMotion />);
  expect(screen.getByTestId('loader-frame', { includeHiddenElements: true })).toBeTruthy();
});
