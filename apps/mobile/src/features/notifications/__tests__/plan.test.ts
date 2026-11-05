import type { AnniversaryInput } from '../../../lib/anniversaries';
import { i18nFor } from '../../../test/render';
import { DEFAULT_NOTIFY_PREFS, type NotifyPrefs } from '../preferences';
import { planNotifications, zonedInstant } from '../plan';

const input = (overrides: Partial<AnniversaryInput> = {}): AnniversaryInput => ({
  startDate: '2025-06-29', timeZone: 'Asia/Seoul', me: { birthday: { month: 3, day: 14 } }, partner: { birthday: { month: 8, day: 2 }, displayName: '하루' }, customs: [], ...overrides,
});
const prefs = (overrides: Partial<NotifyPrefs> = {}): NotifyPrefs => ({ ...DEFAULT_NOTIFY_PREFS, enabled: true, ...overrides });
const NOW = '2026-11-05T00:00:00.000Z';
const translate = async (locale: Parameters<typeof i18nFor>[0] = 'ko-KR') => {
  const i18n = await i18nFor(locale);
  return i18n.t.bind(i18n) as (key: string, vars?: Record<string, unknown>) => string;
};
const iso = (ms: number) => new Date(ms).toISOString();

describe('zonedInstant', () => {
  it('V0-DR-05 turns 09:00 Asia/Seoul into 00:00Z', () => {
    expect(iso(zonedInstant('2026-11-11', '09:00', 'Asia/Seoul'))).toBe('2026-11-11T00:00:00.000Z');
  });
  it('V0-EC-05 ignores the device time zone', () => {
    const before = process.env.TZ;
    process.env.TZ = 'America/Los_Angeles';
    try { expect(iso(zonedInstant('2026-11-11', '09:00', 'Asia/Seoul'))).toBe('2026-11-11T00:00:00.000Z'); } finally { if (before === undefined) delete process.env.TZ; else process.env.TZ = before; }
  });
  it('uses the offset of the date itself on either side of daylight saving time', () => {
    expect(iso(zonedInstant('2026-03-07', '09:00', 'America/New_York'))).toBe('2026-03-07T14:00:00.000Z');
    expect(iso(zonedInstant('2026-03-08', '09:00', 'America/New_York'))).toBe('2026-03-08T13:00:00.000Z');
    expect(iso(zonedInstant('2026-11-01', '09:00', 'America/New_York'))).toBe('2026-11-01T14:00:00.000Z');
  });
  it('moves a time skipped by spring-forward to the first valid minute', () => {
    expect(iso(zonedInstant('2026-03-08', '02:30', 'America/New_York'))).toBe('2026-03-08T07:00:00.000Z');
    expect(iso(zonedInstant('2026-03-08', '02:00', 'America/New_York'))).toBe('2026-03-08T07:00:00.000Z');
  });
  it('uses the first of the two times repeated by fall-back', () => {
    expect(iso(zonedInstant('2026-11-01', '01:30', 'America/New_York'))).toBe('2026-11-01T05:30:00.000Z');
  });
  it('handles a half-hour daylight shift', () => {
    expect(iso(zonedInstant('2026-10-04', '02:15', 'Australia/Lord_Howe'))).toBe('2026-10-03T15:30:00.000Z');
  });
});

describe('planNotifications', () => {
  it('V0-F10-AC-02 schedules day-of and early reminders at the chosen time', async () => {
    const plan = planNotifications(input(), prefs(), await translate(), NOW);
    const pepero = plan.filter((item) => item.data.key === 'season:pepero:2026');
    expect(pepero.map(({ id, fireAt }) => [id, fireAt])).toEqual([
      ['v0:season:season:pepero:2026:2026-11-11:1', '2026-11-10T00:00:00.000Z'],
      ['v0:season:season:pepero:2026:2026-11-11:0', '2026-11-11T00:00:00.000Z'],
    ]);
  });
  it.each<[NotifyPrefs['early'], string[]]>([['none', []], ['1d', ['2026-11-10T00:00:00.000Z']], ['3d', ['2026-11-08T00:00:00.000Z']], ['7d', ['2026-11-04T00:00:00.000Z']]])('V0-F10-AC-04 early %s', async (early, expected) => {
    const plan = planNotifications(input(), prefs({ early }), await translate(), '2026-11-01T00:00:00.000Z');
    const fires = plan.filter((item) => item.data.key === 'season:pepero:2026' && !item.id.endsWith(':0')).map((item) => item.fireAt);
    expect(fires).toEqual(expected);
  });
  it('V0-F10-AC-04 follows the chosen time in the space zone, not UTC', async () => {
    const plan = planNotifications(input(), prefs({ time: '21:30' }), await translate(), NOW);
    expect(plan.find((item) => item.id === 'v0:season:season:pepero:2026:2026-11-11:0')?.fireAt).toBe('2026-11-11T12:30:00.000Z');
  });
  it('V0-EC-09 keeps only the 50 nearest, sorted, even past the one-year engine window', async () => {
    const plan = planNotifications(input(), prefs(), await translate(), NOW);
    expect(plan).toHaveLength(50);
    expect(plan.map((item) => item.fireAt)).toEqual([...plan.map((item) => item.fireAt)].sort());
    expect(plan.at(-1)!.fireAt > '2028-01-01').toBe(true);
    expect(planNotifications(input(), prefs(), await translate(), NOW, 3)).toEqual(plan.slice(0, 3));
  });
  it('reaches 50 from one yearly anniversary alone', async () => {
    const only = prefs({ kinds: { milestone: false, birthday: false, season: false, custom: true } });
    const plan = planNotifications(input({ customs: [{ id: 'c', title: '첫 여행', date: '2024-05-01', repeat: 'yearly' }] }), only, await translate(), NOW);
    expect(plan).toHaveLength(50);
    expect(new Set(plan.map((item) => item.id)).size).toBe(50);
  });
  it('V0-F10-AC-02 gives every occurrence a unique id that stays the same on later runs', async () => {
    const t = await translate();
    const plan = planNotifications(input(), prefs(), t, NOW);
    expect(new Set(plan.map((item) => item.id)).size).toBe(plan.length);
    const later = planNotifications(input(), prefs(), t, '2026-11-20T00:00:00.000Z');
    const shared = later.filter((item) => plan.some((other) => other.id === item.id));
    expect(shared.length).toBeGreaterThan(40);
    expect(shared).toEqual(plan.filter((item) => later.some((other) => other.id === item.id)));
  });
  it('skips anything already past, but keeps today when the time has not come', async () => {
    const t = await translate();
    const morning = planNotifications(input(), prefs(), t, '2026-11-10T20:00:00.000Z');
    expect(morning[0]!.id).toBe('v0:season:season:pepero:2026:2026-11-11:0');
    const noon = planNotifications(input(), prefs(), t, '2026-11-11T03:00:00.000Z');
    expect(noon.some((item) => item.data.key === 'season:pepero:2026')).toBe(false);
  });
  it('V0-F10-AC-04 respects kind switches and per-anniversary off', async () => {
    const t = await translate();
    const customs = [{ id: 'a', title: '첫 여행', date: '2026-12-01', repeat: 'once' as const }, { id: 'b', title: '여행', date: '2026-12-02', repeat: 'once' as const }];
    const kinds = (prefsOverride: Partial<NotifyPrefs>) => new Set(planNotifications(input({ customs }), prefs(prefsOverride), t, NOW, 500).map((item) => item.id.split(':')[1]));
    expect(kinds({})).toEqual(new Set(['years', 'birthday', 'season', 'custom']));
    expect(kinds({ kinds: { ...DEFAULT_NOTIFY_PREFS.kinds, milestone: false } })).toEqual(new Set(['birthday', 'season', 'custom']));
    expect(kinds({ kinds: { ...DEFAULT_NOTIFY_PREFS.kinds, birthday: false } }).has('birthday')).toBe(false);
    expect(kinds({ kinds: { ...DEFAULT_NOTIFY_PREFS.kinds, season: false } }).has('season')).toBe(false);
    expect(kinds({ kinds: { ...DEFAULT_NOTIFY_PREFS.kinds, custom: false } }).has('custom')).toBe(false);
    expect(planNotifications(input({ customs }), prefs({ kinds: { milestone: false, birthday: false, season: false, custom: false } }), t, NOW)).toEqual([]);
    const off = planNotifications(input({ customs }), prefs({ offIds: ['a'] }), t, NOW, 500).filter((item) => item.id.startsWith('v0:custom'));
    expect(off.map((item) => item.data.key)).toEqual(['custom:b', 'custom:b']);
  });
  it('V0-F10-AC-03 writes each body, hiding custom titles and naming only the partner', async () => {
    const t = await translate();
    const body = (plan: ReturnType<typeof planNotifications>, id: string) => plan.find((item) => item.id === id)?.body;
    const plan = planNotifications(input({ startDate: '2026-07-01', customs: [{ id: 'c', title: '비밀 제목', date: '2026-12-01', repeat: 'yearly' }] }), prefs({ early: '3d' }), t, NOW, 500);
    expect(plan.every((item) => item.title === t('app.name'))).toBe(true);
    expect(body(plan, 'v0:season:season:pepero:2026:2026-11-11:0')).toBe('오늘은 빼빼로데이예요');
    expect(body(plan, 'v0:season:season:pepero:2026:2026-11-11:3')).toBe('빼빼로데이까지 3일 남았어요');
    expect(body(plan, 'v0:days:d150:2026-11-27:0')).toBe('오늘은 우리 150일이에요');
    expect(body(plan, 'v0:years:y1:2027-07-01:0')).toBe('오늘은 우리 1주년이에요');
    expect(body(plan, 'v0:birthday:bday:partner:2027:2027-08-02:0')).toBe('오늘은 하루님 생일이에요');
    expect(body(plan, 'v0:birthday:bday:partner:2027:2027-08-02:3')).toBe('하루 생일까지 3일 남았어요');
    expect(body(plan, 'v0:custom:custom:c:2026:2026-12-01:0')).toBe('오늘은 둘만의 기념일이 있어요');
    expect(body(plan, 'v0:custom:custom:c:2026:2026-12-01:3')).toBe('둘만의 기념일까지 3일 남았어요');
    expect(JSON.stringify(plan)).not.toContain('비밀 제목');
  });
  it('does not remind about my own birthday', async () => {
    const plan = planNotifications(input(), prefs(), await translate(), NOW, 500);
    expect(plan.some((item) => item.data.key.startsWith('bday:partner'))).toBe(true);
    expect(plan.some((item) => item.data.key.startsWith('bday:me'))).toBe(false);
  });
  it('V0-EC-11 writes the copy in the current language', async () => {
    const ids = 'v0:season:season:pepero:2026:2026-11-11:0';
    const en = planNotifications(input(), prefs(), await translate('en-US'), NOW).find((item) => item.id === ids);
    const ja = planNotifications(input(), prefs(), await translate('ja-JP'), NOW).find((item) => item.id === ids);
    expect(en?.body).toBe('Today is Pepero Day');
    expect(ja?.body).toContain('今日は');
  });
  it('V0-NF-04 never leaks a birth year', async () => {
    const birthday = { month: 8, day: 2, year: 1999 };
    const plan = planNotifications(input({ partner: { birthday, displayName: '하루' } }), prefs(), await translate(), NOW, 500);
    expect(JSON.stringify(plan.map((item) => item.body))).not.toContain('1999');
  });
});
