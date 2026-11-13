import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import Ajv2020 from 'ajv/dist/2020';
import addFormats from 'ajv-formats';
import { computeAnniversaries, type AnniversaryInput } from '../../../lib/anniversaries';
import { i18nFor } from '../../../test/render';
import type { Locale } from '../../../i18n';
import { buildWidgetSnapshot, type WidgetData, type WidgetSnapshot } from '../snapshot';

const schema = JSON.parse(readFileSync(resolve(__dirname, '../../../../../../specs/002-couple-dday-v0/contracts/widget-snapshot.schema.json'), 'utf8')) as object;
const ajv = new Ajv2020({ allErrors: true, allowUnionTypes: true });
addFormats(ajv);
const validate = ajv.compile(schema);
const SPACE = '11111111-1111-4111-8111-111111111111';
const CUSTOM = '22222222-2222-4222-8222-222222222222';
const NOW = '2026-11-02T03:00:00.000Z';
const dates = (overrides: Partial<AnniversaryInput> = {}): AnniversaryInput => ({
  startDate: '2025-06-29', timeZone: 'Asia/Seoul', me: { birthday: { month: 3, day: 14 } }, partner: { birthday: { month: 8, day: 2 }, displayName: '하루' }, customs: [], ...overrides,
});
const space = (overrides: Partial<AnniversaryInput> = {}, state: 'normal' | 'pending' = 'normal'): WidgetData => ({ state, spaceId: SPACE, names: { me: '도담', partner: state === 'normal' ? '하루' : null }, dates: dates(overrides) });
const build = async (data: WidgetData, now = NOW, locale: Locale = 'ko-KR') => {
  const i18n = await i18nFor(locale);
  return buildWidgetSnapshot({ ...data, locale }, now, (key, vars) => i18n.t(key, vars));
};
const valid = (snapshot: WidgetSnapshot) => { expect(validate(JSON.parse(JSON.stringify(snapshot))) ? [] : validate.errors).toEqual([]); };

describe('buildWidgetSnapshot', () => {
  it.each<[string, WidgetData]>([['normal', space()], ['pending', space({ partner: null }, 'pending')], ['none', { state: 'none' }], ['ended', { state: 'ended' }]])('V0-F11-AC-06 %s matches the contract', async (_, data) => {
    const snapshot = await build(data);
    valid(snapshot);
    expect(snapshot.state).toBe(data.state);
    expect(snapshot.schemaVersion).toBe(1);
    expect(snapshot.writtenAt).toBe(NOW);
  });
  it.each(['normal', 'pending'] as const)('V0-F11-AC-09 %s reaches at least 35 days past today, one entry a day', async (state) => {
    const { entries } = await build(space(state === 'pending' ? { partner: null } : {}, state));
    expect(entries).toHaveLength(36);
    expect(entries[0]!.date).toBe('2026-11-02');
    expect(entries[35]!.date).toBe('2026-12-07');
    expect(entries.map((entry) => entry.dayCount)).toEqual(entries.map((_, day) => 492 + day));
  });
  it('V0-DR-05 rolls over at midnight in Asia/Seoul', async () => {
    const { entries } = await build(space());
    expect(entries.slice(0, 2).map(({ date, showAt }) => [date, showAt])).toEqual([['2026-11-02', '2026-11-01T15:00:00.000Z'], ['2026-11-03', '2026-11-02T15:00:00.000Z']]);
  });
  it('V0-DR-05 picks today in the space zone, not UTC', async () => {
    expect((await build(space(), '2026-11-02T15:00:00.000Z')).entries[0]!.date).toBe('2026-11-03');
    expect((await build(space({ timeZone: 'America/New_York' }), '2026-11-02T03:00:00.000Z')).entries[0]!.date).toBe('2026-11-01');
  });
  it('V0-DR-05 follows America/New_York across both daylight saving changes', async () => {
    const zone = { timeZone: 'America/New_York' };
    const spring = (await build(space(zone), '2026-03-07T12:00:00.000Z')).entries;
    expect(spring.slice(0, 3).map((entry) => entry.showAt)).toEqual(['2026-03-07T05:00:00.000Z', '2026-03-08T05:00:00.000Z', '2026-03-09T04:00:00.000Z']);
    const autumn = (await build(space(zone), '2026-10-31T12:00:00.000Z')).entries;
    expect(autumn.slice(0, 3).map((entry) => entry.showAt)).toEqual(['2026-10-31T04:00:00.000Z', '2026-11-01T04:00:00.000Z', '2026-11-02T05:00:00.000Z']);
  });
  it('V0-DR-05 starts the day at the first valid minute when daylight saving skips midnight', async () => {
    const { entries } = await build(space({ timeZone: 'America/Havana' }), '2026-03-07T12:00:00.000Z');
    expect(entries.slice(0, 2).map(({ date, showAt }) => [date, showAt])).toEqual([['2026-03-07', '2026-03-07T05:00:00.000Z'], ['2026-03-08', '2026-03-08T05:00:00.000Z']]);
    expect(entries[1]!.dayCount).toBe(entries[0]!.dayCount! + 1);
  });
  it('V0-F11-AC-05 fills today only on the day and counts down to it', async () => {
    const { entries } = await build(space());
    const before = entries.find((entry) => entry.date === '2026-11-10')!, day = entries.find((entry) => entry.date === '2026-11-11')!;
    expect(before).not.toHaveProperty('today');
    expect(before.next![0]).toMatchObject({ key: 'season:pepero:2026', daysLeft: 1 });
    expect(day.today).toEqual({ key: 'season:pepero:2026', kind: 'season', title: '빼빼로데이', date: '2026-11-11', daysLeft: 0, privacySensitive: false });
    expect(day.next!.map((item) => item.key)).not.toContain('season:pepero:2026');
  });
  it('V0-EC-08 shows one anniversary as today by the home card priority', async () => {
    const custom = { id: CUSTOM, title: '처음 만난 날', date: '2026-11-11', repeat: 'once' as const };
    const season = await build(space({ customs: [custom] }));
    expect(season.entries.find((entry) => entry.date === '2026-11-11')!.today!.kind).toBe('custom');
    const years = await build(space({ startDate: '2025-11-11', customs: [custom] }));
    expect(years.entries.find((entry) => entry.date === '2026-11-11')!.today).toMatchObject({ key: 'y1', kind: 'years', title: '1주년' });
    const birthday = await build(space({ partner: { birthday: { month: 11, day: 11 }, displayName: '하루' }, customs: [custom] }));
    expect(birthday.entries.find((entry) => entry.date === '2026-11-11')!.today).toMatchObject({ key: 'bday:partner:2026', title: '하루 생일' });
  });
  it('holds at most 6 next items in date order, the same ones the engine gives that day', async () => {
    const customs = [1, 2, 3, 4, 5, 6, 7].map((day) => ({ id: `${CUSTOM.slice(0, -1)}${day}`, title: `날 ${day}`, date: `2026-12-0${day}`, repeat: 'once' as const }));
    const { entries } = await build(space({ customs }));
    for (const entry of entries) {
      const expected = computeAnniversaries(dates({ customs }), entry.showAt).upcoming.slice(0, 6);
      expect(entry.next!.map(({ key, date }) => [key, date])).toEqual(expected.map(({ key, date }) => [key, date]));
      expect(entry.next!.length).toBeLessThanOrEqual(6);
      expect(entry.next!.map((item) => item.daysLeft)).toEqual([...entry.next!.map((item) => item.daysLeft)].sort((a, b) => a - b));
    }
  });
  it('marks the latest anniversary before each day, or the start date before the first one', async () => {
    const { entries } = await build(space());
    expect(entries.find((entry) => entry.date === '2026-11-11')!.previous).toBe('2026-08-02');
    expect(entries.find((entry) => entry.date === '2026-11-12')!.previous).toBe('2026-11-11');
    const fresh = await build(space({ startDate: '2026-10-01' }));
    expect(fresh.entries[0]!.previous).toBe('2026-10-01');
  });
  it('V0-NF-04 flags custom titles and the partner birthday, and nothing else', async () => {
    const { entries } = await build(space({ customs: [{ id: CUSTOM, title: '비밀 여행', date: '2026-11-03', repeat: 'yearly' }], partner: { birthday: { month: 11, day: 4 }, displayName: '하루' }, me: { birthday: { month: 11, day: 5 } } }));
    const flags = Object.fromEntries(entries[0]!.next!.map((item) => [item.title, item.privacySensitive]));
    expect(flags).toEqual({ '비밀 여행': true, '하루 생일': true, '내 생일': false, '빼빼로데이': false, '크리스마스': false, '발렌타인데이': false });
  });
  it('V0-F11-AC-07 V0-NF-04 carries no memo, user id, email, token or birth year', async () => {
    const custom = { id: CUSTOM, title: '여행', date: '2026-11-20', repeat: 'once' as const, memo: 'secret-memo', createdBy: 'user-id-a' };
    const partner = { birthday: { month: 8, day: 2 }, displayName: '하루', userId: 'user-id-b', email: 'partner@example.com', birthYear: 1994 };
    const json = JSON.stringify(await build(space({ customs: [custom], partner, me: { birthday: { month: 3, day: 14 } } })));
    for (const value of ['secret-memo', 'user-id', 'example.com', '1994', 'token', 'memo', 'email', 'birthYear']) expect(json).not.toContain(value);
  });
  it.each(['none', 'ended'] as const)('V0-F11-AC-06 %s leaves nothing of the space behind', async (state) => {
    const snapshot = await build({ state });
    expect(Object.keys(snapshot).sort()).toEqual(['entries', 'locale', 'schemaVersion', 'state', 'strings', 'writtenAt']);
    expect(snapshot.entries).toEqual([{ date: '2026-11-02', showAt: NOW }]);
  });
  it('pending has a D+N and no partner, so no partner birthday', async () => {
    const snapshot = await build(space({ partner: null }, 'pending'));
    expect(snapshot.names).toEqual({ me: '도담', partner: null });
    expect(snapshot.entries[0]!.dayCount).toBe(492);
    expect(snapshot.entries.flatMap((entry) => entry.next!).some((item) => item.key.startsWith('bday:partner'))).toBe(false);
  });
  it('leaves a name that is not set yet out of the names', async () => {
    const snapshot = await build({ ...space(), names: { me: null, partner: '하루' } } as WidgetData);
    valid(snapshot);
    expect(snapshot.names).toEqual({ partner: '하루' });
  });
  it('keeps the space zone, start date and id beside the entries', async () => {
    expect(await build(space())).toMatchObject({ spaceId: SPACE, timeZone: 'Asia/Seoul', startDate: '2025-06-29', names: { me: '도담', partner: '하루' }, locale: 'ko-KR' });
  });
  it('still validates before the start date, when there is no day count yet', async () => {
    const snapshot = await build(space({ startDate: '2026-11-03' }));
    valid(snapshot);
    expect(snapshot.entries[0]!.dayCount).toBeNull();
    expect(snapshot.entries[1]!.dayCount).toBe(1);
  });
  it.each<[Locale, Record<string, string>, string]>([
    ['ko-KR', { 'widget.none.title': '아룸을 시작해요', 'widget.today': '오늘은 {title}', 'dday.left': 'D-{n}', 'dday.big': 'D+{n}', 'widget.a11y': '함께한 지 {n}일째. 다음 기념일 {title}, {left}', 'dday.since': '{date}부터' }, '빼빼로데이'],
    ['en-US', { 'widget.none.title': 'Start Aroom', 'widget.today': 'Today: {title}', 'dday.left': 'In {n} days', 'dday.big': 'Day {n}', 'widget.a11y': 'Day {n} together. Next: {title}, {left}', 'dday.since': 'Since {date}' }, 'Pepero Day'],
    ['ja-JP', { 'widget.none.title': 'アルームをはじめよう', 'widget.today': '今日は{title}', 'dday.left': 'あと{n}日', 'dday.big': '{n}日目', 'widget.a11y': '一緒に{n}日目。次の記念日は{title}、{left}', 'dday.since': '{date}から' }, 'ペペロデー'],
  ])('V0-EC-11 writes %s strings and titles, keeping templates for the extension', async (locale, strings, pepero) => {
    const snapshot = await build(space(), NOW, locale);
    valid(snapshot);
    expect(snapshot.locale).toBe(locale);
    expect(snapshot.strings).toMatchObject(strings);
    expect(snapshot.entries[0]!.next![0]!.title).toBe(pepero);
    const i18n = await i18nFor(locale);
    for (const value of Object.values(snapshot.strings)) expect(value).not.toMatch(/\$t\(|widget\.|dday\./);
    expect(snapshot.strings['home.pending.partner']).toBe(i18n.t('home.pending.partner'));
  });
});
