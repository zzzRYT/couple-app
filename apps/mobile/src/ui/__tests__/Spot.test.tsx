import { render } from '@testing-library/react-native';
import { Spot } from '../Spot';
jest.mock('../motion', () => ({ useReducedMotion: () => false, useLoopActive: () => true }));

it('floats only the letter of the waiting spot and keeps it out of the reading order', async () => {
  const screen = await render(<Spot kind="waiting" />);
  expect(screen.getAllByTestId('spot-floating', { includeHiddenElements: true })).toHaveLength(1);
  expect(screen.toJSON()).toMatchObject({ props: { accessibilityElementsHidden: true } });
});

it('draws the letter still with reduced motion', async () => {
  const screen = await render(<Spot kind="waiting" reducedMotion />);
  expect(screen.queryByTestId('spot-floating', { includeHiddenElements: true })).toBeNull();
  expect(screen.getByTestId('spot-still', { includeHiddenElements: true })).toBeTruthy();
});
