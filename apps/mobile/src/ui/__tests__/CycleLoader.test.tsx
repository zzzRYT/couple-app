import { act, render } from '@testing-library/react-native';
import { CycleLoader } from '../CycleLoader';
jest.mock('../motion', () => ({ useReducedMotion: () => false }));
it('cycles four frames in 4.8 seconds and stays still with reduced motion', async () => {
  jest.useFakeTimers();
  const screen = await render(<CycleLoader label="Loading" />);
  const image = () => screen.getByTestId('loader-frame').props.source;
  const first = image();
  await act(() => { jest.advanceTimersByTime(1200); });
  expect(image()).not.toEqual(first);
  await act(() => { jest.advanceTimersByTime(3600); });
  expect(image()).toEqual(first);
  await screen.rerender(<CycleLoader label="Loading" reducedMotion />);
  await act(() => { jest.advanceTimersByTime(2400); });
  expect(image()).toEqual(first);
  jest.useRealTimers();
});
