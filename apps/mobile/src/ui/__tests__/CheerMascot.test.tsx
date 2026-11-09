import { render } from '@testing-library/react-native';
import { CheerMascot, HOP_MS, TWINKLE_MS, hopLift, twinkleDepth } from '../CheerMascot';

it('hops 16 then 8 and rests, and twinkles down and back, as the S29 keyframes', () => {
  expect(hopLift(0)).toBe(0);
  expect(hopLift(HOP_MS * 0.18)).toBeCloseTo(-16);
  expect(hopLift(HOP_MS * 0.36)).toBeCloseTo(0);
  expect(hopLift(HOP_MS * 0.52)).toBeCloseTo(-8);
  expect(hopLift(HOP_MS * 0.8)).toBe(0);
  expect(twinkleDepth(0)).toBe(0);
  expect(twinkleDepth(TWINKLE_MS / 2)).toBeCloseTo(1);
});

it('names the mascot for screen readers', async () => {
  const screen = await render(<CheerMascot size={170} label="Mopi is cheering" />);
  expect(screen.getByLabelText('Mopi is cheering')).toBeTruthy();
});
