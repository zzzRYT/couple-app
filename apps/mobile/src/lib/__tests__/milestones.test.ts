import { chooseCurrentMilestone, computeMilestones } from '../../../../../supabase/functions/_shared/milestones';

describe('computeMilestones', () => {
  it.each([50, 100, 200, 300, 500, 1000])('finds day %i with the anniversary as day one', (days) => {
    const start = new Date(Date.UTC(2024, 0, 1));
    start.setUTCDate(start.getUTCDate() + days - 1);
    const result = computeMilestones('2024-01-01', 'Asia/Seoul', start.toISOString());
    expect(result.celebration?.key).toBe(`d${days}`);
    expect(result.celebration?.daysAgo).toBe(0);
  });

  it('uses the same calendar day for anniversaries and Feb 28 for non-leap years', () => {
    expect(computeMilestones('2024-02-29', 'Asia/Seoul', '2025-02-28T03:00:00Z').celebration).toMatchObject({ key: 'y1', milestoneDate: '2025-02-28' });
    expect(computeMilestones('2024-02-29', 'Asia/Seoul', '2026-02-28T03:00:00Z').celebration).toMatchObject({ key: 'y2', milestoneDate: '2026-02-28' });
  });

  it('prefers anniversaries on a same-day overlap and includes day seven but not day eight', () => {
    expect(chooseCurrentMilestone([
      { key: 'd100', kind: 'day', milestoneDate: '2025-01-01', daysAgo: 0, days: 100, anniversaryN: null },
      { key: 'y1', kind: 'anniversary', milestoneDate: '2025-01-01', daysAgo: 0, days: null, anniversaryN: 1 },
    ])?.key).toBe('y1');
    expect(computeMilestones('2024-02-29', 'Asia/Seoul', '2025-02-28T03:00:00Z').celebration?.kind).toBe('anniversary');
    expect(computeMilestones('2024-01-01', 'Asia/Seoul', '2024-02-24T03:00:00Z').celebration?.key).toBe('d50');
    expect(computeMilestones('2024-01-01', 'Asia/Seoul', '2024-02-26T03:00:00Z').celebration).toBeNull();
  });

  it('uses the room calendar date and returns at most three upcoming entries', () => {
    expect(computeMilestones('2026-10-27', 'Asia/Seoul', '2026-10-26T15:00:00Z').dayCount).toBe(1);
    expect(computeMilestones('2026-10-27', 'America/Los_Angeles', '2026-10-26T15:00:00Z').dayCount).toBeNull();
    expect(computeMilestones('2025-01-01', 'Asia/Seoul', '2025-01-01T00:00:00Z').upcoming).toHaveLength(3);
  });
});
