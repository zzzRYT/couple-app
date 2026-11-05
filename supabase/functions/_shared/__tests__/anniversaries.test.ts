import { assertEquals } from 'jsr:@std/assert@1';
import { computeMilestones } from '../milestones.ts';
const fixture = JSON.parse(await Deno.readTextFile(new URL('../../../../apps/mobile/src/lib/__fixtures__/anniversaries.json', import.meta.url)));
Deno.test('V0-DR-01…03, V0-DR-05 server matches shared calendar cases', () => {
  for (const item of fixture.cases) {
    const result = computeMilestones(item.start, item.zone, item.now);
    assertEquals(result.dayCount, item.dayCount);
    if (item.today) assertEquals(result.celebration?.key, item.today.key);
  }
});
Deno.test('V0-DR shared 120 calendar cases agree on day counts and same-day milestones', () => {
  assertEquals(fixture.calendarCases.length >= 120, true);
  for (const item of fixture.calendarCases) {
    const result = computeMilestones(item.startDate, item.timeZone, item.now);
    assertEquals(result.today, item.today);
    assertEquals(result.dayCount, item.dayCount);
    const milestone = item.todayKeys.find((key: string) => /^(d\d+|y\d+)$/.test(key));
    if (milestone) assertEquals(result.celebration?.key, milestone);
  }
});
