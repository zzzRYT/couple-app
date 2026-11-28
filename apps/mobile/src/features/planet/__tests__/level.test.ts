import { fitObject, planetLevel } from '../level';
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

it('scales an oversized object down to the level maximum and never scales one up', () => {
  expect(planetLevel(0).maxObject).toBe(0.3);
  expect(planetLevel(730).maxObject).toBe(0.42);
  expect(fitObject(0.6, 0.3)).toEqual({ scale: 0.5, radius: 0.3 });
  expect(fitObject(1000, 0.3)!.radius).toBeCloseTo(0.3);
  expect(fitObject(0.3, 0.3)).toEqual({ scale: 1, radius: 0.3 });
  expect(fitObject(0.1, 0.3)).toEqual({ scale: 1, radius: 0.1 });
});

it('refuses a size that is not a positive finite number', () => {
  for (const size of [0, -1, NaN, Infinity]) expect(fitObject(size, 0.3)).toBeNull();
});

it('leaves room for a full planet of maximum-size objects at every level', () => {
  const spots = [...Array.from({ length: 6 }, (_, i) => ({ latitude: 0, longitude: i * 60 - 180 })), ...Array.from({ length: 4 }, (_, i) => ({ latitude: -55, longitude: i * 90 - 180 }))];
  for (const days of [0, 100, 365, 730]) {
    const { capacity, scale, maxObject } = planetLevel(days);
    const placed: Placement[] = [];
    for (const spot of spots) { const item = { ...spot, id: `${placed.length}`, heading: 0, radius: maxObject }; if (canPlace(placed, item, capacity, scale) === 'ok') placed.push(item); }
    expect(placed).toHaveLength(capacity);
  }
});
