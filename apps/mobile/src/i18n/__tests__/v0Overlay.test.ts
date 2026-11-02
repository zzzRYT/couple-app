import { createI18n } from '../index';
import ko from '../locales/v0/ko-KR.json';
import en from '../locales/v0/en-US.json';
import ja from '../locales/v0/ja-JP.json';

it('V0-NF-02 shares keys and nests decided brand names', async () => {
  expect(Object.keys(ko)).toHaveLength(279);
  expect(Object.keys(en).sort()).toEqual(Object.keys(ko).sort());
  expect(Object.keys(ja).sort()).toEqual(Object.keys(ko).sort());
  const placeholders = (value: string) => [...new Set(value.match(/\{[^{}]+\}/g) ?? [])].sort();
  for (const key of Object.keys(ko) as (keyof typeof ko)[]) {
    if (['date.long', 'date.short', 'date.md'].includes(key)) continue;
    expect(placeholders(en[key])).toEqual(placeholders(ko[key]));
    expect(placeholders(ja[key])).toEqual(placeholders(ko[key]));
  }
  for (const locale of [ko, en, ja]) {
    for (const [key, value] of Object.entries(locale)) {
      if (key !== 'app.name' && key !== 'mascot.name') {
        expect(value).not.toMatch(/아룸|Aroom|アルーム|아루미|Aroomi|アルーミ|모피루|Mopiru|モピル|모피|Mopi|モピ/);
      }
    }
  }
  const storage = { getItemAsync: async () => null, setItemAsync: async () => {} };
  for (const [locale, title, count] of [
    ['ko-KR', '아룸을 시작해요', 'D+492'],
    ['en-US', 'Start Aroom', 'Day 492'],
    ['ja-JP', 'アルームをはじめよう', '492日目'],
  ] as const) {
    const i18n = await createI18n({ deviceLocale: locale, storage });
    expect(i18n.t('widget.none.title')).toBe(title);
    expect(i18n.t('dday.big', { n: 492 })).toBe(count);
    if (locale === 'ko-KR') expect(i18n.t('home.today.body.season')).toBe('아루미가 둘의 오늘을 함께 축하해요.');
  }
});
