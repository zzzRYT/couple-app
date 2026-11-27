import { planetLevel } from '../level';
import { canPlace, type Placement } from '../placement';

it('uses the highest earned or entitled level, ignoring invalid entitlements', () => {
  expect(planetLevel(99).level).toBe(1);
  expect(planetLevel(100).level).toBe(2);
  expect(planetLevel(365, [4]).capacity).toBe(10);
  expect(planetLevel(730, [2]).scale).toBe(1.45);
  expect(planetLevel(0, [Infinity, 5, -1]).level).toBe(1);
});

it('refuses additions at capacity and overlapping the character or another object', () => {
  const first: Placement = { id: 'a', latitude: 0, longitude: 0, heading: 0, radius: 0.2 };
  expect(canPlace([], first, 1, 1)).toBe('ok');
  expect(canPlace([first], { ...first, id: 'b', longitude: 90 }, 1, 1)).toBe('capacity');
  expect(canPlace([first], { ...first, id: 'b' }, 2, 1)).toBe('overlap');
  expect(canPlace([], { ...first, latitude: 90 }, 1, 1)).toBe('overlap');
  expect(canPlace([], { ...first, radius: NaN }, 1, 1)).toBe('invalid');
});
