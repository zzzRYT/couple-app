import { assertEquals } from 'jsr:@std/assert@1';
import { chooseCurrentMilestone, computeMilestones } from '../milestones.ts';

Deno.test('all configured day marks use day one as the start date', () => {
  for (const days of [50,100,200,300,500,1000]) {
    const date = new Date(Date.UTC(2024,0,1)); date.setUTCDate(date.getUTCDate()+days-1);
    assertEquals(computeMilestones('2024-01-01','Asia/Seoul',date.toISOString()).celebration?.key,`d${days}`);
  }
});
Deno.test('anniversaries use calendar dates, including Feb 29 to Feb 28 in common years', () => {
  assertEquals(computeMilestones('2024-02-29','Asia/Seoul','2025-02-28T03:00:00Z').celebration?.key,'y1');
  assertEquals(computeMilestones('2024-02-29','Asia/Seoul','2026-02-28T03:00:00Z').celebration?.key,'y2');
});
Deno.test('anniversary takes priority over a day mark on the same date', () => {
  assertEquals(chooseCurrentMilestone([
    { key: 'd100', kind: 'day', milestoneDate: '2025-01-01', daysAgo: 0, days: 100, anniversaryN: null },
    { key: 'y1', kind: 'anniversary', milestoneDate: '2025-01-01', daysAgo: 0, days: null, anniversaryN: 1 },
  ])?.key,'y1');
});
Deno.test('room midnight boundaries, catch-up, most recent, and upcoming are calendar based', () => {
  assertEquals(computeMilestones('2026-10-27','Asia/Seoul','2026-10-26T14:59:59Z').dayCount,null);
  assertEquals(computeMilestones('2026-10-27','Asia/Seoul','2026-10-26T15:00:00Z').dayCount,1);
  assertEquals(computeMilestones('2024-01-01','Asia/Seoul','2024-02-24T03:00:00Z').celebration?.key,'d50');
  assertEquals(computeMilestones('2024-01-01','Asia/Seoul','2024-02-26T03:00:00Z').celebration,null);
  assertEquals(computeMilestones('2025-01-01','Asia/Seoul','2025-01-01T00:00:00Z').upcoming.length,3);
});
Deno.test('LA and Seoul can have different day counts at the same instant', () => {
  const now = '2026-10-27T03:00:00Z';
  assertEquals(computeMilestones('2026-10-27','Asia/Seoul',now).dayCount,1);
  assertEquals(computeMilestones('2026-10-27','America/Los_Angeles',now).dayCount,null);
});
