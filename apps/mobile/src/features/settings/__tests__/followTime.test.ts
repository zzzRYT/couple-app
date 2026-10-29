import { roomVariant } from '../followTime';

it.each([
  ['2026-01-01T20:59:59Z', 'Asia/Seoul', 'night'],
  ['2026-01-01T21:00:00Z', 'Asia/Seoul', 'day'],
  ['2026-01-01T08:00:00Z', 'America/Los_Angeles', 'night'],
  ['2026-01-01T14:00:00Z', 'America/Los_Angeles', 'day'],
])('follows room-local time %s in %s', (now, timeZone, expected) => {
  expect(roomVariant('follow_time', now, timeZone)).toBe(expected);
});

it('keeps manual mode independent from time zone and daylight saving', () => {
  expect(roomVariant('day', '2026-03-08T09:30:00Z', 'America/Los_Angeles')).toBe('day');
  expect(roomVariant('night', '2026-11-01T08:30:00Z', 'America/Los_Angeles')).toBe('night');
});

it.each([
  ['2026-03-08T12:59:59Z', 'night'],
  ['2026-03-08T13:00:00Z', 'day'],
  ['2026-11-01T13:59:59Z', 'night'],
  ['2026-11-01T14:00:00Z', 'day'],
])('uses local wall-clock boundaries across Los Angeles DST: %s', (now, expected) => {
  expect(roomVariant('follow_time', now, 'America/Los_Angeles')).toBe(expected);
});

it('rejects invalid IANA zones instead of silently using the device zone', () => {
  expect(() => roomVariant('follow_time', '2026-01-01T12:00:00Z', 'Mars/Olympus')).toThrow(RangeError);
});
