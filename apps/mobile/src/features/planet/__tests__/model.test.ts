import { drag, inertia, initialCamera, pinch, themes } from '../model';
import { v1Features } from '../../../config/features';
import { roomVariant } from '../../settings/followTime';

it('V1-F01-AC-02 rotates and limits pitch on drag', () => {
  expect(drag(initialCamera, 100, 1000)).toEqual({ yaw: 1, pitch: 0.7, zoom: 1 });
});
it('V1-F01-AC-03 clamps pinch zoom', () => {
  expect(pinch(initialCamera, 5).zoom).toBe(2.2);
  expect(pinch(initialCamera, 0.1).zoom).toBe(1);
});
it('V1-F01-AC-04 stops inertia after 600ms and immediately with reduced motion', () => {
  expect(inertia(1, 300, false)).toBe(0.5);
  expect(inertia(1, 600, false)).toBe(0);
  expect(inertia(1, 0, true)).toBe(0);
});
it('V1-F01-AC-07 uses the space time zone for day and night', () => {
  expect(roomVariant('follow_time', '2026-11-26T00:00:00Z', 'Asia/Seoul')).toBe('day');
  expect(roomVariant('follow_time', '2026-11-26T00:00:00Z', 'America/New_York')).toBe('night');
});
it('provides all seven P02 theme token sets', () => {
  expect(Object.keys(themes)).toHaveLength(7);
  expect(themes.potato.detail).toBe('#C39772');
});

it('V1-NF-01 enables the planet only in development builds', () => {
  expect(v1Features('development').planet).toBe(true);
  for (const variant of ['production', 'preview', undefined]) expect(v1Features(variant).planet).toBe(false);
});
