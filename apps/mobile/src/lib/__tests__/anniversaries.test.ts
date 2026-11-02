import { computeMilestoneView } from '../anniversaries';

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
