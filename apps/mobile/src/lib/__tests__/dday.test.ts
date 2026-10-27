import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createI18n } from '../../i18n';
import { dayCount, formatAnniversary, todayIn } from '../dday';
type Case = { name: string; anniversary: string; now: string; timeZone: string; expect: unknown };
const fixture = JSON.parse(readFileSync(resolve(__dirname, '../__fixtures__/dday.json'), 'utf8')) as { cases: Case[]; messages: { locale: 'ko-KR' | 'en-US' | 'ja-JP'; dayCount: number; anniversary: string; count: string; date: string }[] };
const storage = { getItemAsync: async () => null, setItemAsync: async () => {} };
it.each(fixture.cases.map((item): [string, Case] => [item.name, item]))('%s', (_name: string, item: Case) => {
  expect(dayCount(item.anniversary, item.now, item.timeZone)).toEqual(item.expect);
});
it('formats the D-day count and date per locale', async () => {
  for (const message of fixture.messages) {
    const i18n = await createI18n({ deviceLocale: message.locale, storage, profileLocale: null });
    expect(i18n.t('dday.count', { n: message.dayCount })).toBe(message.count);
    expect(formatAnniversary(message.anniversary, message.locale)).toBe(message.date);
  }
});
it('reads the local calendar date in the room time zone', () => {
  expect(todayIn('2026-10-27T15:00:00Z', 'Asia/Seoul')).toBe('2026-10-28');
  expect(todayIn('2026-10-27T15:00:00Z', 'America/Los_Angeles')).toBe('2026-10-27');
});
