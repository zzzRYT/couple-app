import { eventFixture } from '../../../test/fixtures';
import { i18nFor } from '../../../test/render';
import { planEventNotifications } from '../plan';

const NOW = '2026-11-20T00:00:00.000Z';
const translate = async () => { const i18n = await i18nFor(); return i18n.t.bind(i18n) as (key: string, vars?: Record<string, unknown>) => string; };

describe('V0-F19-AC-05 planEventNotifications', () => {
  it('fires a timed alert its offset before the start, in the space time zone', async () => {
    const t = await translate();
    const plan = planEventNotifications([eventFixture({ id: 'dinner', time: '19:00', alert: '30m' })], 'Asia/Seoul', t, NOW);
    expect(plan).toEqual([{ id: 'v0:event:dinner:2026-11-25:19:00:30m', fireAt: '2026-11-25T09:30:00.000Z', title: '저녁 데이트', body: t('cal.notify.min', { n: 30 }), data: { v0: true, key: 'event:dinner' } }]);
    // The day after New York leaves daylight saving time: 09:00 EST is 14:00Z.
    expect(planEventNotifications([eventFixture({ date: '2026-11-02', time: '09:00', alert: '1h' })], 'America/New_York', t, '2026-10-01T00:00:00.000Z')[0]).toMatchObject({ fireAt: '2026-11-02T13:00:00.000Z', body: t('cal.notify.hour') });
    expect(planEventNotifications([eventFixture({ time: '19:00', alert: 'at' }), eventFixture({ id: 'f', time: '19:00', alert: '1d' })], 'Asia/Seoul', t, NOW).map(({ fireAt, body }) => [fireAt, body])).toEqual([
      ['2026-11-25T10:00:00.000Z', t('cal.notify.now')], ['2026-11-24T10:00:00.000Z', t('cal.notify.tomorrow')],
    ]);
  });
  it('fires an all-day alert at 09:00 on the day or the day before', async () => {
    const t = await translate();
    const plan = planEventNotifications([eventFixture({ id: 'a', alert: 'at' }), eventFixture({ id: 'b', date: '2026-12-01', alert: '1d' })], 'Asia/Seoul', t, NOW);
    expect(plan.map(({ id, fireAt, body }) => [id, fireAt, body])).toEqual([
      ['v0:event:a:2026-11-25:day:at', '2026-11-25T00:00:00.000Z', t('cal.notify.today')],
      ['v0:event:b:2026-12-01:day:1d', '2026-11-30T00:00:00.000Z', t('cal.notify.tomorrow')],
    ]);
  });
  it('skips events without an alert and alerts whose time has passed', async () => {
    const t = await translate();
    expect(planEventNotifications([eventFixture({ time: '19:00' }), eventFixture({ date: '2026-11-19', time: '19:00', alert: 'at' }), eventFixture({ date: '2026-11-20', time: '09:05', alert: '5m' })], 'Asia/Seoul', t, NOW)).toEqual([]);
  });
});
