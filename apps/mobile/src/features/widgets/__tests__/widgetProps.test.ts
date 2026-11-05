import { i18nFor } from '../../../test/render';
import type { Locale } from '../../../i18n';
import { buildWidgetSnapshot, type WidgetData } from '../snapshot';
import { appScheme, timelineOf, widgetPort } from '../nativeWidgets';
import { widgetLinks, widgetProps, type WidgetProps } from '../widgetProps';

const SPACE = '11111111-1111-4111-8111-111111111111';
const CUSTOM = '22222222-2222-4222-8222-222222222222';
const NOW = '2026-11-02T03:00:00.000Z';
const dates = { startDate: '2025-06-29', timeZone: 'Asia/Seoul', me: { birthday: { month: 3, day: 14 } }, partner: { birthday: { month: 8, day: 2 }, displayName: '하루' }, customs: [] };
const normal: WidgetData = { state: 'normal', spaceId: SPACE, names: { me: '도담', partner: '하루' }, dates };
const pending: WidgetData = { state: 'pending', spaceId: SPACE, names: { me: '도담', partner: null }, dates: { ...dates, partner: null } };
const snapshotOf = async (data: WidgetData, locale: Locale = 'ko-KR', now = NOW) => {
  const i18n = await i18nFor(locale);
  return buildWidgetSnapshot({ ...data, locale }, now, (key, vars) => i18n.t(key, vars));
};
type Space = Extract<WidgetProps, { state: 'normal' | 'pending' }>;
const first = async (data: WidgetData, locale?: Locale, now?: string) => {
  const snapshot = await snapshotOf(data, locale, now);
  return widgetProps(snapshot, snapshot.entries[0]!, 'aroom-dev') as Space;
};

describe('widgetProps', () => {
  it.each<[Locale, string, string, string, string, string]>([
    ['ko-KR', 'D+492', 'D-9', '2025.06.29부터', '2025년 6월 29일부터', '11월 11일 (수)'],
    ['en-US', 'Day 492', 'In 9 days', 'Since 2025.06.29', 'Since Jun 29, 2025', 'Wed, Nov 11'],
    ['ja-JP', '492日目', 'あと9日', '2025.06.29から', '2025年6月29日から', '11月11日(水)'],
  ])('V0-F11-AC-03 fills the %s board strings', async (locale, day, left, since, sinceLong, date) => {
    const props = await first(normal, locale);
    expect(props).toMatchObject({ day, since, sinceLong, ja: locale === 'ja-JP' });
    expect(props.rows[0]).toMatchObject({ left, date });
  });
  it('V0-F11-AC-03 reads the widget as one sentence', async () => {
    expect((await first(normal)).a11y).toBe('함께한 지 492일째. 다음 기념일 빼빼로데이, D-9');
    expect((await first(normal, 'en-US')).a11y).toBe('Day 492 together. Next: Pepero Day, In 9 days');
  });
  it('V0-F11-AC-05 marks the day itself with the today line and the home link', async () => {
    const props = await first(normal, 'ko-KR', '2026-11-11T03:00:00.000Z');
    expect(props.today).toMatchObject({ title: '빼빼로데이', line: '오늘은 빼빼로데이', prefix: '오늘은 ', icon: 'pepero', tile: '#AACBE2' });
    expect(props.a11y).toBe('함께한 지 501일째. 다음 기념일 빼빼로데이, 오늘');
    expect(props.url).toBe('aroom-dev://home');
  });
  it('V0-F11-AC-06 names the missing partner with the placeholder', async () => {
    const props = await first(pending);
    expect(props).toMatchObject({ state: 'pending', names: '도담 · 상대', pending: '상대 연결 전' });
  });
  it.each(['none', 'ended'] as const)('V0-F11-AC-06 %s carries only its own copy and the start link', async (state) => {
    const snapshot = await snapshotOf({ state });
    const props = widgetProps(snapshot, snapshot.entries[0]!, 'aroom-dev');
    expect(Object.keys(props).sort()).toEqual(['a11y', 'body', 'ja', 'state', 'title', 'url']);
    expect(props).toMatchObject({ state, url: 'aroom-dev://' });
  });
  it('V0-F11-AC-07 flags custom titles and partner birthdays, not built-in ones', async () => {
    const custom = { id: CUSTOM, title: '우리만의 날', date: '2026-11-05', repeat: 'none', version: 1 };
    const props = await first({ ...normal, dates: { ...dates, customs: [custom] } } as WidgetData);
    expect(props.rows[0]).toMatchObject({ title: '우리만의 날', hideWhenLocked: true, icon: 'star' });
    expect(props.rows.find((row) => row.title === '빼빼로데이')).toMatchObject({ hideWhenLocked: false });
  });
});

describe('V0-F11-AC-08 deep links', () => {
  it('builds routes from the configured scheme', () => {
    const links = widgetLinks('aroom-dev');
    expect(links.home).toBe('aroom-dev://home');
    expect(links.start).toBe('aroom-dev://');
    expect(links.anniversary('season:pepero:2026')).toBe('aroom-dev://anniversary/season%3Apepero%3A2026');
  });
  it('takes the first scheme of a variant that has several', () => {
    expect(appScheme(['aroom-dev', 'aroom'])).toBe('aroom-dev');
    expect(appScheme('aroom')).toBe('aroom');
  });
  it('links each row to its own anniversary', async () => {
    expect((await first(normal)).rows[0]!.url).toBe('aroom-dev://anniversary/season%3Apepero%3A2026');
  });
});

describe('V0-F11-AC-04, -09 timeline', () => {
  it('shows each entry at its own midnight', async () => {
    const snapshot = await snapshotOf(normal);
    const timeline = timelineOf(snapshot, 'aroom-dev');
    expect(timeline).toHaveLength(36);
    expect(timeline[1]!.date.toISOString()).toBe('2026-11-02T15:00:00.000Z');
    expect(timeline[1]!.props).toMatchObject({ day: 'D+493' });
  });
  it('replaces the whole timeline of every widget, then reloads them', async () => {
    const widgets = [{ updateTimeline: jest.fn(), reload: jest.fn() }, { updateTimeline: jest.fn(), reload: jest.fn() }];
    const port = widgetPort(widgets, 'aroom-dev');
    await port.write(JSON.stringify(await snapshotOf(normal)));
    await port.reload();
    for (const widget of widgets) {
      expect(widget.updateTimeline).toHaveBeenCalledTimes(1);
      expect(widget.updateTimeline.mock.calls[0][0]).toHaveLength(36);
      expect(widget.reload).toHaveBeenCalledTimes(1);
    }
  });
});
