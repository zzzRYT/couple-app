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
it('V0-NF-05 V0-DR-01…03, V0-DR-05 matches the shared calendar fixtures across time zones', () => {
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
  it('V0-EC-01 uses February 28 for leap-day anniversaries, and orders collisions by priority', () => {
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

it('V0-DR-01-AC-01 counts Seoul midnight as day two for a 2025-06-29 start', () => {
  expect(computeMilestoneView('2025-06-29', 'Asia/Seoul', '2025-06-29T14:59:00Z').dayCount).toBe(1);
  expect(computeMilestoneView('2025-06-29', 'Asia/Seoul', '2025-06-29T15:00:00Z').dayCount).toBe(2);
});
it('V0-DR-01-AC-02 never skips or repeats a day across the New York DST start', () => {
  const counts = [];
  for (let hour = 0; hour <= 72; hour++) {
    const now = new Date(Date.UTC(2024, 2, 8, 12) + hour * 3_600_000).toISOString();
    counts.push(computeMilestoneView('2024-01-01', 'America/New_York', now).dayCount);
  }
  const distinct = [...new Set(counts)];
  expect(distinct.map((n, i) => (i === 0 ? 1 : n - distinct[i - 1]!)).every((step) => step === 1)).toBe(true);
  expect(distinct).toEqual([68, 69, 70, 71]);
});
it('V0-DR-02 V0-DR-02-AC-01 places 50/100/150/200/300 days at start + (N - 1) once each', () => {
  const result = computeAnniversaries({ startDate: '2025-06-29', timeZone: 'Asia/Seoul', me: { birthday: null }, partner: null, customs: [] }, '2025-12-01T03:00:00Z');
  const days = Object.fromEntries([...result.past, ...result.todayItems, ...result.upcoming].filter((item) => item.kind === 'days').map((item) => [item.key, item.date]));
  expect(days).toEqual({ d50: '2025-08-17', d100: '2025-10-06', d150: '2025-11-25', d200: '2026-01-14', d300: '2026-04-24' });
  expect(computeMilestoneView('2025-06-29', 'Asia/Seoul', '2025-07-01T03:00:00Z').next).toEqual(expect.objectContaining({ key: 'd50', date: '2025-08-17' }));
});
it('V0-DR-03 V0-DR-03-AC-01 uses calendar anniversaries, February 28 in common years, and year before day on the same date', () => {
  const input = { startDate: '2024-02-29', timeZone: 'Asia/Seoul', me: { birthday: null }, partner: null, customs: [] };
  const first = computeAnniversaries(input, '2025-02-28T03:00:00Z');
  expect(first.todayItems.map((item) => item.key)).toEqual(['y1']);
  expect(first.todayItems[0]!.date).toBe('2025-02-28');
  expect(first.dayCount).toBe(366);
  const fourth = computeAnniversaries(input, '2028-02-29T03:00:00Z');
  expect(fourth.todayItems.map((item) => item.key)).toEqual(['y4']);
  expect(computeAnniversaries({ ...input, startDate: '2023-06-29' }, '2024-06-29T03:00:00Z').dayCount).toBe(367);
  expect(computeAnniversaries({ ...input, startDate: '2025-06-29' }, '2026-06-29T03:00:00Z').dayCount).toBe(366);
});
it('V0-DR-04 keeps birthdays and yearly customs on the same month and day, February 28 in common years, fixed seasons and one-time dates', () => {
  const input = {
    startDate: '2020-01-01', timeZone: 'Asia/Seoul',
    me: { birthday: { month: 2, day: 29 } }, partner: { birthday: { month: 3, day: 1 } },
    customs: [{ id: 'y', title: 'Y', date: '2024-02-29', repeat: 'yearly' as const }, { id: 'o', title: 'O', date: '2025-05-05', repeat: 'once' as const }],
  };
  const common = computeAnniversaries(input, '2025-02-28T03:00:00Z');
  expect(common.todayItems.map((item) => item.key)).toEqual(['bday:me:2025', 'custom:y:2025']);
  const leap = computeAnniversaries(input, '2028-02-29T03:00:00Z');
  expect(leap.todayItems.map((item) => item.key)).toEqual(['bday:me:2028', 'custom:y:2028']);
  const dates = Object.fromEntries([...common.past, ...common.upcoming].map((item) => [item.key, item.date]));
  expect(dates).toEqual(expect.objectContaining({ 'season:pepero:2025': '2025-11-11', 'season:christmas:2025': '2025-12-25', 'custom:o': '2025-05-05' }));
});
it('V0-DR-05-AC-01 follows the space time zone, not the device, when Seoul midnight passes', () => {
  const input = { startDate: '2025-06-29', timeZone: 'Asia/Seoul', me: { birthday: null }, partner: null, customs: [] };
  // 2025-06-29T15:00Z is still 06-29 08:00 in Los Angeles but already 06-30 00:00 in Seoul.
  const before = computeAnniversaries(input, '2025-06-29T14:59:00Z');
  const after = computeAnniversaries(input, '2025-06-29T15:00:00Z');
  expect([before.today, after.today]).toEqual(['2025-06-29', '2025-06-30']);
  expect(after.dayCount! - before.dayCount!).toBe(1);
});
it('V0-DR-06-AC-01 leaves a Pepero Day before the start date out of the past list', () => {
  const input = { startDate: '2026-12-01', timeZone: 'Asia/Seoul', me: { birthday: null }, partner: null, customs: [] };
  const result = computeAnniversaries(input, '2026-12-05T03:00:00Z');
  expect([...result.past, ...result.todayItems, ...result.upcoming].some((item) => item.date === '2026-11-11')).toBe(false);
});
it('V0-EC-12 shows my birthday alone and the partner birthday only after both added theirs', () => {
  const base = { startDate: '2025-06-29', timeZone: 'Asia/Seoul', me: { birthday: { month: 3, day: 1 } }, customs: [] };
  const keys = (partner: { birthday: { month: number; day: number } | null }) => {
    const result = computeAnniversaries({ ...base, partner }, '2026-02-01T03:00:00Z');
    return [...result.todayItems, ...result.upcoming].filter((item) => item.kind === 'birthday').map((item) => item.key);
  };
  expect(keys({ birthday: null })).toEqual(['bday:me:2026']);
  expect(keys({ birthday: { month: 4, day: 2 } }).sort()).toEqual(['bday:me:2026', 'bday:partner:2026']);
  const partnerOnly = computeAnniversaries({ ...base, me: { birthday: null }, partner: { birthday: { month: 4, day: 2 } } }, '2026-02-01T03:00:00Z');
  expect([...partnerOnly.todayItems, ...partnerOnly.upcoming].some((item) => item.kind === 'birthday')).toBe(false);
});
