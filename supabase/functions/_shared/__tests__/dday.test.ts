import { assertEquals } from 'jsr:@std/assert@1';
import { dayCount, formatAnniversary } from '../dday.ts';
const fixture = JSON.parse(await Deno.readTextFile(new URL('../../../../apps/mobile/src/lib/__fixtures__/dday.json', import.meta.url)));
Deno.test('server day count matches the shared app fixture', () => {
  for (const c of fixture.cases) assertEquals(dayCount(c.anniversary, c.now, c.timeZone), c.expect, c.name);
});
Deno.test('server date formatting matches the shared app fixture', () => {
  for (const m of fixture.messages) assertEquals(formatAnniversary(m.anniversary, m.locale), m.date);
});
