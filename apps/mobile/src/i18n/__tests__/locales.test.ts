import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

it('contains all design keys with matching variables and nonempty translations', () => {
  const locales = ['ko-KR', 'en-US', 'ja-JP'].map((locale) => JSON.parse(readFileSync(resolve(__dirname, '../locales', `${locale}.json`), 'utf8')) as Record<string, string>);
  const keys = Object.keys(locales[0]!).sort();
  const source = readFileSync(resolve(__dirname, '../../../../../design/i18n-copy.md'), 'utf8');
  expect(source).toMatch(/총 키 수:\s*\*\*640\*\*/);
  expect(keys).toHaveLength(640);
  const variables = (value: string) => [...value.matchAll(/\{([\w]+)\}/g)].map((m) => m[1]).sort();
  for (const locale of locales) {
    expect(Object.keys(locale).sort()).toEqual(keys);
    for (const key of keys) {
      expect(locale[key]?.trim()).toBeTruthy();
      expect(variables(locale[key]!)).toEqual(variables(locales[0]![key]!));
    }
  }
});
