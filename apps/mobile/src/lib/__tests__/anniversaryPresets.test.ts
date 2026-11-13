import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import ko from '../../i18n/locales/v0/ko-KR.json';
import { i18nFor } from '../../test/render';
import { occurrenceTitle } from '../../features/anniversaries/format';
import { computeAnniversaries } from '../anniversaries';
import { ANNIVERSARY_PRESETS, nextPresetDate, presetAdded, presetOf, presetTitle, type AnniversaryPreset } from '../anniversaryPresets';
import { todayIn } from '../dday';

const preset = (id: string) => presetOf(id)!;
const titles = (p: AnniversaryPreset) => ['ko-KR', 'en-US', 'ja-JP'].map((locale) => (JSON.parse(readFileSync(resolve(__dirname, '../../i18n/locales/v0', `${locale}.json`), 'utf8')) as Record<string, string>)[`anniv.preset.${p.id}`]!);

it('matches the server table and the Korean copy', () => {
  const sql = readFileSync(resolve(__dirname, '../../../../../supabase/migrations/20261111000100_v0_anniversary_preset.sql'), 'utf8');
  const rows = [...sql.matchAll(/^ \('(\w+)',(\d+),(\d+),(true|false),'((?:[^']|'')*)'/gm)].map(([, id, month, day, auto, title]) => ({ id, month: Number(month), day: Number(day), auto: auto === 'true', ko: title!.replace(/''/g, "'") }));
  expect(rows).toEqual(ANNIVERSARY_PRESETS.map(({ id, month, day, builtIn, ko: title }) => ({ id, month, day, auto: builtIn, ko: title })));
  for (const p of ANNIVERSARY_PRESETS) expect((ko as Record<string, string>)[`anniv.preset.${p.id}`]).toBe(p.ko);
});

it('adds only the days that are for lovers by definition on its own', () => {
  expect(ANNIVERSARY_PRESETS.filter((p) => p.builtIn).map((p) => p.id).sort()).toEqual(['valentine', 'white']);
  expect(ANNIVERSARY_PRESETS.map((p) => p.month * 100 + p.day)).toEqual([...ANNIVERSARY_PRESETS.map((p) => p.month * 100 + p.day)].sort((a, b) => a - b));
});

it('finds the next occurrence on or after today, across the year end and in the space time zone', () => {
  expect(nextPresetDate(preset('valentine'), '2026-11-11')).toBe('2027-02-14');
  expect(nextPresetDate(preset('xmasEve'), '2026-12-24')).toBe('2026-12-24');
  expect(nextPresetDate(preset('xmasEve'), '2026-12-25')).toBe('2027-12-24');
  expect(nextPresetDate(preset('white'), todayIn('2026-03-14T15:30:00Z', 'UTC'))).toBe('2026-03-14');
  expect(nextPresetDate(preset('white'), todayIn('2026-03-14T15:30:00Z', 'Asia/Seoul'))).toBe('2027-03-14');
});

it('shows a preset row in the reader\'s language until the couple renames it', async () => {
  const customs = [{ id: 'v', title: '발렌타인데이', date: '2027-02-14', repeat: 'yearly' as const, presetId: 'valentine' }, { id: 'r', title: '우리 키스데이', date: '2026-06-14', repeat: 'yearly' as const, presetId: 'kiss' }];
  const view = computeAnniversaries({ startDate: '2025-01-01', timeZone: 'Asia/Seoul', me: { birthday: null }, partner: null, customs }, '2027-02-01T00:00:00Z');
  const valentine = view.upcoming.find((item) => item.customId === 'v')!;
  for (const [locale, title] of [['ko-KR', '발렌타인데이'], ['en-US', "Valentine's Day"], ['ja-JP', 'バレンタインデー']] as const) {
    const t = (await i18nFor(locale)).t as (key: string) => string;
    expect(occurrenceTitle(valentine, 'Haru', t)).toBe(title);
    expect(presetTitle(customs[1]!, t)).toBe('우리 키스데이');
    expect(presetTitle({ title: '발렌타인데이' }, t)).toBe('발렌타인데이');
  }
});

it('counts a preset as added by its row or by a hand-made yearly row under any of its names', () => {
  const kiss = preset('kiss');
  const row = (title: string, date: string, extra: { presetId?: string; repeat?: 'yearly' | 'once' } = {}) => ({ title, date, repeat: 'yearly' as const, ...extra });
  expect(presetAdded(kiss, [row('Renamed', '2026-07-01', { presetId: 'kiss' })], titles)).toBe(true);
  expect(presetAdded(kiss, [row('キスデー', '2020-06-14')], titles)).toBe(true);
  expect(presetAdded(kiss, [row(' Kiss Day ', '2026-06-14')], titles)).toBe(true);
  expect(presetAdded(kiss, [row('Kiss Day', '2026-06-15')], titles)).toBe(false);
  expect(presetAdded(kiss, [row('Kiss Day', '2026-06-14', { repeat: 'once' })], titles)).toBe(false);
  expect(presetAdded(kiss, [row('Our day', '2026-06-14')], titles)).toBe(false);
});


it.each([['valentine', '2027-02-14'], ['white', '2027-03-14']] as const)('localizes the built-in %s season day', async (id, date) => {
  const view = computeAnniversaries({ startDate: '2025-01-01', timeZone: 'UTC', me: { birthday: null }, partner: null, customs: [] }, `${date}T12:00:00Z`);
  const item = view.todayItems.find((entry) => entry.seasonId === id)!;
  for (const locale of ['ko-KR', 'en-US', 'ja-JP'] as const) {
    const t = (await i18nFor(locale)).t as (key: string) => string;
    expect(occurrenceTitle(item, 'Haru', t)).toBe(t(`anniv.preset.${id}`));
    expect(item.kind).toBe('season');
  }
});
