import { computeAnniversaries, computeMilestoneView } from '../anniversaries';

describe('V0-DR-01…03, V0-DR-05 milestone dates', () => {
  it('counts the start date as day one and orders same-day years first', () => {
    const view = computeMilestoneView('2024-02-29', 'Asia/Seoul', '2025-02-28T03:00:00Z');
    expect(view.dayCount).toBe(366);
    expect(view.today).toEqual(expect.objectContaining({ key: 'y1', date: '2025-02-28' }));
  });
  it('uses the space calendar date at a DST boundary', () => {
    const view = computeMilestoneView('2024-01-01', 'America/New_York', '2024-04-09T03:00:00Z');
    expect(view.dayCount).toBe(99);
    expect(view.next).toEqual(expect.objectContaining({ key: 'd100', date: '2024-04-09' }));
  });
});

import fixtures from '../__fixtures__/anniversaries.json';
it('V0-DR-01…03, V0-DR-05 matches calendar fixtures across time zones', () => {
  for (const item of fixtures.cases) {
    const actual = computeMilestoneView(item.start, item.zone, item.now);
    expect(actual).toEqual({ dayCount: item.dayCount, today: item.today, next: item.next, upcoming: item.upcoming });
  }
});

describe('V0-DR-01…06 complete anniversary calendar', () => {
  const input = {
    startDate: '2024-02-29', timeZone: 'Asia/Seoul',
    me: { birthday: { month: 2, day: 29 } },
    partner: { birthday: { month: 2, day: 29 } },
    customs: [{ id: 'one', title: 'A', date: '2024-02-29', repeat: 'yearly' as const }],
  };
  it('uses February 28 for leap-day anniversaries, and orders collisions by priority', () => {
    const result = computeAnniversaries(input, '2025-02-28T03:00:00Z');
    expect(result.todayItems.map((item) => item.key)).toEqual(['y1', 'bday:me:2025', 'bday:partner:2025', 'custom:one:2025']);
    expect(result.celebrationCandidates.map((item) => item.key)).toEqual(result.todayItems.map((item) => item.key));
  });
  it('includes both one-year window endpoints, and excludes dates before start', () => {
    const result = computeAnniversaries({ ...input, startDate: '2025-03-01', customs: [
      { id: 'past', title: 'Past', date: '2024-03-02', repeat: 'once' },
      { id: 'future', title: 'Future', date: '2027-03-02', repeat: 'once' },
    ] }, '2026-03-02T03:00:00Z');
    expect(result.past.some((item) => item.key === 'custom:past')).toBe(false);
    expect(result.upcoming.some((item) => item.key === 'custom:future')).toBe(true);
  });
  it('shows 150 days, excludes 500 and 1000, and respects the room timezone', () => {
    const result = computeAnniversaries({ ...input, me: { birthday: null }, partner: null, customs: [] }, '2024-07-26T15:00:00Z');
    expect(result.today).toBe('2024-07-27');
    expect(result.todayItems.map((item) => item.key)).toContain('d150');
    expect([...result.past, ...result.upcoming].map((item) => item.key)).not.toEqual(expect.arrayContaining(['d500', 'd1000']));
  });
});
it('V0-DR-01…06 covers 120 independent calendar cases, leap days, zone rollovers and collisions', () => {
  expect(fixtures.calendarCases.length).toBeGreaterThanOrEqual(120);
  for (const item of fixtures.calendarCases) {
    const view = computeAnniversaries({ ...item, customs: item.customs as { id: string; title: string; date: string; repeat: 'yearly' | 'once' }[] }, item.now);
    expect({ today: view.today, dayCount: view.dayCount, todayKeys: view.todayItems.map((entry) => entry.key) }).toEqual({ today: item.today, dayCount: item.dayCount, todayKeys: item.todayKeys });
  }
});
it('V0-DR-06 excludes season days before the relationship and handles DST rollover', () => {
  const input = { startDate: '2025-12-01', timeZone: 'America/New_York', me: { birthday: null }, partner: null, customs: [] };
  const before = computeAnniversaries(input, '2026-03-08T04:59:00Z');
  const after = computeAnniversaries(input, '2026-03-08T05:00:00Z');
  expect(before.today).toBe('2026-03-07'); expect(after.today).toBe('2026-03-08');
  expect(after.dayCount! - before.dayCount!).toBe(1);
  expect(after.past.some((item) => item.key === 'season:pepero:2025')).toBe(false);
  expect(after.past.some((item) => item.key === 'season:christmas:2025')).toBe(true);
});
