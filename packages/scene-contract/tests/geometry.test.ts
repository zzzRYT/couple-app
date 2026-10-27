import { describe, expect, it } from 'vitest';
import { rotatedBounds } from '../src/geometry';
import { protectedZones, findIntrusions } from '../src/protectedZones';

describe('room geometry', () => {
  it('computes the bounding box of a rotated rectangle', () => {
    const bounds = rotatedBounds({ x: 0.5, y: 0.5, width: 0.4, height: 0.2, rotationDeg: 90 });
    expect(bounds.width).toBeCloseTo(0.2);
    expect(bounds.height).toBeCloseTo(0.4);
    expect(bounds.x).toBeCloseTo(0.4);
    expect(bounds.y).toBeCloseTo(0.3);
  });
  it.each([[320, 800, 47, 34], [600, 1000, 32, 24]])('reports canvas and measured protected area intrusions on %sx%s', (width, height, top, bottom) => {
    const zones = protectedZones({ width, height, safeTop: top, safeBottom: bottom, controls: [{ x: 0.2, y: 0.2, width: 0.6, height: 0.15 }] });
    const nodes = [
      { x: 0.5, y: 0.02, width: 0.05, height: 0.05, rotationDeg: 0 },
      { x: 0.5, y: 0.25, width: 0.05, height: 0.05, rotationDeg: 0 },
      { x: 0.5, y: 0.5, width: 0.05, height: 0.05, rotationDeg: 0 },
      { x: 0.99, y: 0.5, width: 0.1, height: 0.1, rotationDeg: 45 },
      { x: 0.5, y: 0.99, width: 0.05, height: 0.05, rotationDeg: 0 },
    ];
    expect(findIntrusions(nodes, zones)).toEqual([0, 1, 3, 4]);
  });
});
