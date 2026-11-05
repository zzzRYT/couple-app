import { assertEquals } from 'jsr:@std/assert@1';
import { computeMilestones } from '../milestones.ts';
const fixture = JSON.parse(await Deno.readTextFile(new URL('../../../../apps/mobile/src/lib/__fixtures__/anniversaries.json', import.meta.url)));
Deno.test('V0-DR-01…03, V0-DR-05 server matches shared calendar cases', () => {
  for (const item of fixture.cases) {
    const result = computeMilestones(item.start, item.zone, item.now);
    assertEquals(result.dayCount, item.dayCount);
    if (item.today && /^(d(50|100|200|300)|y[1-9][0-9]*)$/.test(item.today.key)) assertEquals(result.celebration?.key, item.today.key);
  }
});
