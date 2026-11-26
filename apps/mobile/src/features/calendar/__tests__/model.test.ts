import { eventFixture } from '../../../test/fixtures';
import { alertFor, anniversariesByDate, editorOf, eventsByDate, filterEvents, monthGrid, ownerOf, shiftMonth } from '../model';

const calendarEvent = (overrides: Parameters<typeof eventFixture>[0]) => eventFixture({ date: '2026-12-03', ...overrides });

it('V0-F19-AC-01 lays out the month from its weekday with today marked and each owner\'s count, together first, then me', () => {
  const events = [
    calendarEvent({ id: 'a', time: '19:00', createdBy: 'me', ownerId: 'you' }), calendarEvent({ id: 'b', createdBy: 'you', ownerId: null }),
    calendarEvent({ id: 'c', time: '08:00', createdBy: 'you', ownerId: 'you' }), calendarEvent({ id: 'd', time: '21:00', createdBy: 'me', ownerId: 'me' }),
    calendarEvent({ id: 'e', createdBy: 'me', ownerId: null }),
  ];
  const grid = monthGrid('2026-12', '2026-12-03', eventsByDate(events), 'me');
  expect(grid.slice(0, 2)).toEqual([null, null]);
  expect(grid.filter(Boolean)).toHaveLength(31);
  expect(grid[2]).toMatchObject({ date: '2026-12-01', day: 1, today: false, owners: [] });
  expect(grid[4]).toEqual({ date: '2026-12-03', day: 3, today: true, owners: [{ owner: 'together', n: 2 }, { owner: 'me', n: 1 }, { owner: 'partner', n: 2 }] });
  const partnerOnly = monthGrid('2026-12', '2026-12-03', eventsByDate(filterEvents(events, 'me', 'partner')), 'me');
  expect(partnerOnly[4]).toMatchObject({ owners: [{ owner: 'partner', n: 2 }] });
  expect(filterEvents(events, 'me', 'together').map((event) => event.id)).toEqual(['b', 'e']);
});

it('V0-F19-AC-04 names the last editor only when it is the other partner, and keeps the owner apart from the author', () => {
  expect(editorOf(calendarEvent({ createdBy: 'you', updatedBy: 'me' }), 'me')).toBe('me');
  expect(editorOf(calendarEvent({ createdBy: 'me', updatedBy: 'you' }), 'me')).toBe('partner');
  expect(editorOf(calendarEvent({ createdBy: 'you', updatedBy: 'you' }), 'me')).toBeNull();
  expect(editorOf(calendarEvent({ createdBy: 'me', updatedBy: null }), 'me')).toBeNull();
  expect(editorOf(calendarEvent({ createdBy: null, updatedBy: 'me' }), 'me')).toBe('me');
  expect([ownerOf({ ownerId: null }, 'me'), ownerOf({ ownerId: 'me' }, 'me'), ownerOf({ ownerId: 'you' }, 'me'), ownerOf({ ownerId: 'gone' }, 'me')]).toEqual(['together', 'me', 'partner', 'partner']);
  expect(filterEvents([calendarEvent({ id: 'theirs', createdBy: 'me', ownerId: 'you' }), calendarEvent({ id: 'mine', createdBy: 'you', ownerId: 'me' })], 'me', 'partner').map((event) => event.id)).toEqual(['theirs']);
});

it('V0-F19-AC-02 sorts a day all-day first, then by start time, then by id', () => {
  const events = [calendarEvent({ id: 'late', time: '19:00' }), calendarEvent({ id: 'z' }), calendarEvent({ id: 'early', time: '08:00' }), calendarEvent({ id: 'a' }), calendarEvent({ id: 'other', date: '2026-12-04' })];
  expect(eventsByDate(events).get('2026-12-03')!.map((event) => event.id)).toEqual(['a', 'z', 'early', 'late']);
});

it('V0-F19-AC-08 places each anniversary on its day in any month, by the D-day rules', () => {
  const input = {
    startDate: '2024-02-29', timeZone: 'Asia/Seoul', me: { birthday: { month: 3, day: 1 } }, partner: { birthday: { month: 2, day: 29 } },
    customs: [{ id: 'met', title: 'Met', date: '2023-02-10', repeat: 'yearly' as const }, { id: 'trip', title: 'Trip', date: '2031-02-20', repeat: 'once' as const }],
  };
  const keys = (month: string) => Object.fromEntries([...anniversariesByDate(input, month)].map(([date, items]) => [date, items.map((item) => item.key)]));
  expect(keys('2031-02')).toEqual({
    '2031-02-10': ['custom:met:2031'], '2031-02-14': ['season:valentine:2031'], '2031-02-20': ['custom:trip'], '2031-02-28': ['y7', 'bday:partner:2031'],
  });
  expect(keys('2024-02')).toEqual({ '2024-02-10': ['custom:met:2024'], '2024-02-29': ['bday:partner:2024'] });
  expect(keys('2031-03')['2031-03-03']).toBeUndefined();
  expect(keys('2032-02')['2032-02-20']).toBeUndefined();
});

it('moves across years and resets an alert all-day events cannot use', () => {
  expect([shiftMonth('2026-12', 1), shiftMonth('2026-01', -1), shiftMonth('2026-11', 0)]).toEqual(['2027-01', '2025-12', '2026-11']);
  expect([alertFor('5m', true), alertFor('1d', true), alertFor('at', true), alertFor('5m', false)]).toEqual(['none', '1d', 'at', '5m']);
});
