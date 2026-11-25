import { eventFixture } from '../../../test/fixtures';
import { alertFor, eventsByDate, monthGrid, shiftMonth } from '../model';

const calendarEvent = (overrides: Parameters<typeof eventFixture>[0]) => eventFixture({ date: '2026-12-03', ...overrides });

it('V0-F19-AC-01 lays out the month from its weekday with today marked and up to three author dots', () => {
  const events = [
    calendarEvent({ id: 'a', time: '19:00', createdBy: 'me' }), calendarEvent({ id: 'b', createdBy: 'you' }),
    calendarEvent({ id: 'c', time: '08:00', createdBy: 'you' }), calendarEvent({ id: 'd', time: '21:00', createdBy: 'me' }),
  ];
  const grid = monthGrid('2026-12', '2026-12-03', eventsByDate(events), 'me');
  expect(grid.slice(0, 2)).toEqual([null, null]);
  expect(grid.filter(Boolean)).toHaveLength(31);
  expect(grid[2]).toMatchObject({ date: '2026-12-01', day: 1, today: false, dots: [] });
  expect(grid[4]).toEqual({ date: '2026-12-03', day: 3, today: true, dots: ['partner', 'partner', 'me'] });
});

it('V0-F19-AC-02 sorts a day all-day first, then by start time, then by id', () => {
  const events = [calendarEvent({ id: 'late', time: '19:00' }), calendarEvent({ id: 'z' }), calendarEvent({ id: 'early', time: '08:00' }), calendarEvent({ id: 'a' }), calendarEvent({ id: 'other', date: '2026-12-04' })];
  expect(eventsByDate(events).get('2026-12-03')!.map((event) => event.id)).toEqual(['a', 'z', 'early', 'late']);
});

it('moves across years and resets an alert all-day events cannot use', () => {
  expect([shiftMonth('2026-12', 1), shiftMonth('2026-01', -1), shiftMonth('2026-11', 0)]).toEqual(['2027-01', '2025-12', '2026-11']);
  expect([alertFor('5m', true), alertFor('1d', true), alertFor('at', true), alertFor('5m', false)]).toEqual(['none', '1d', 'at', '5m']);
});
