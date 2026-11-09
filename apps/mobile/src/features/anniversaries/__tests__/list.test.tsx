import { fireEvent } from '@testing-library/react-native';
import { renderWithI18n } from '../../../test/render';
import { computeAnniversaries } from '../../../lib/anniversaries';
import { AnniversaryList } from '../AnniversaryList';
const view = computeAnniversaries({ startDate: '2025-01-01', timeZone: 'UTC', me: { birthday: null }, partner: null, customs: [{ id: 'x', title: 'Our day', date: '2026-11-11', repeat: 'yearly' }] }, '2026-11-11T12:00:00Z');
it('V0-F08-AC-01 V0-F08-AC-03 V0-F05-AC-04 presents today, custom badge, past toggle and own-birthday prompt', async () => {
  const onPast = jest.fn(), onBirthday = jest.fn(), onItem = jest.fn();
  const screen = await renderWithI18n(<AnniversaryList view={view} filter="all" pastOpen={false} offline={false} birthdayState="mine" partner="Haru" onFilter={jest.fn()} onPast={onPast} onAdd={jest.fn()} onItem={onItem} onBirthday={onBirthday} />);
  expect(screen.getAllByText(screen.t('anniv.section.today')).length).toBeGreaterThan(1);
  expect(screen.getAllByText(screen.t('anniv.badge.custom'))).toHaveLength(2);
  await fireEvent.press(screen.getByText(screen.t('anniv.past.show', { n: view.past.length })));
  expect(onPast).toHaveBeenCalled();
  await fireEvent.press(screen.getByText(/내 생일을 넣으면/)); expect(onBirthday).toHaveBeenCalled();
  const customRows = screen.getAllByText('Our day'); expect(customRows).toHaveLength(2);
  await fireEvent.press(customRows[0]!); expect(onItem).toHaveBeenCalledWith(expect.objectContaining({ customId: 'x' }));
});
it('V0-F08-AC-02 custom filter omits other kinds and custom badges', async () => {
  const screen = await renderWithI18n(<AnniversaryList view={view} filter="custom" pastOpen={false} offline={false} birthdayState="none" partner="Haru" onFilter={jest.fn()} onPast={jest.fn()} onAdd={jest.fn()} onItem={jest.fn()} onBirthday={jest.fn()} />);
  expect(screen.queryByText(screen.t('anniv.pepero'))).toBeNull();
  expect(screen.queryByText(screen.t('anniv.badge.custom'))).toBeNull();
});
const days = (input: Parameters<typeof computeAnniversaries>[0], now: string) => {
  const result = computeAnniversaries(input, now);
  return [...result.past, ...result.todayItems, ...result.upcoming];
};
const common = { me: { birthday: null }, partner: null, customs: [] };
it('V0-F04-AC-01 lists only 50, 100, 150, 200, 300 days once each and yearly anniversaries', async () => {
  const items = days({ ...common, startDate: '2025-06-29', timeZone: 'Asia/Seoul' }, '2025-12-15T03:00:00Z');
  expect(items.filter((item) => item.kind === 'days').map((item) => item.n).sort((a, b) => a! - b!)).toEqual([50, 100, 150, 200, 300]);
  expect(items.filter((item) => item.kind === 'years').map((item) => item.n)).toEqual([1]);
  const screen = await renderWithI18n(<AnniversaryList view={computeAnniversaries({ ...common, startDate: '2025-06-29', timeZone: 'Asia/Seoul' }, '2025-12-15T03:00:00Z')} filter="all" pastOpen offline={false} birthdayState="none" partner="Haru" onFilter={jest.fn()} onPast={jest.fn()} onAdd={jest.fn()} onItem={jest.fn()} onBirthday={jest.fn()} />);
  expect(screen.getByText(screen.t('anniv.days', { n: 300 }))).toBeTruthy();
  expect(screen.queryByText(screen.t('anniv.days', { n: 500 }))).toBeNull();
  expect(screen.queryByText(screen.t('anniv.days', { n: 1000 }))).toBeNull();
});
it('V0-F08-AC-01 orders today, upcoming ascending within a year, then past descending within a year', async () => {
  const input = { ...common, startDate: '2025-01-01', timeZone: 'UTC' };
  const result = computeAnniversaries(input, '2026-11-02T12:00:00Z');
  expect(result.upcoming.map((item) => item.date)).toEqual([...result.upcoming.map((item) => item.date)].sort());
  expect(result.upcoming.every((item) => item.date > '2026-11-02' && item.date <= '2027-11-02')).toBe(true);
  expect(result.past.map((item) => item.date)).toEqual([...result.past.map((item) => item.date)].sort().reverse());
  expect(result.past.every((item) => item.date < '2026-11-02' && item.date >= '2025-11-02')).toBe(true);
  const screen = await renderWithI18n(<AnniversaryList view={computeAnniversaries({ ...input, customs: [{ id: 'x', title: 'Our day', date: '2026-11-02', repeat: 'yearly' }] }, '2026-11-02T12:00:00Z')} filter="all" pastOpen={false} offline={false} birthdayState="none" partner="Haru" onFilter={jest.fn()} onPast={jest.fn()} onAdd={jest.fn()} onItem={jest.fn()} onBirthday={jest.fn()} />);
  const tree = JSON.stringify(screen.toJSON());
  expect(tree.indexOf(screen.t('anniv.section.today'))).toBeGreaterThan(-1);
  expect(tree.indexOf(screen.t('anniv.section.today'))).toBeLessThan(tree.indexOf(screen.t('anniv.section.upcoming')));
  expect(tree.indexOf(screen.t('anniv.section.upcoming'))).toBeLessThan(tree.indexOf(screen.t('anniv.past.show', { n: computeAnniversaries({ ...input, customs: [{ id: 'x', title: 'Our day', date: '2026-11-02', repeat: 'yearly' }] }, '2026-11-02T12:00:00Z').past.length })));
  expect(screen.queryByText(screen.t('anniv.section.past'))).toBeNull();
});
it('V0-F08-AC-02 shows the empty state when the custom filter has nothing', async () => {
  const onAdd = jest.fn();
  const screen = await renderWithI18n(<AnniversaryList view={computeAnniversaries({ ...common, startDate: '2025-01-01', timeZone: 'UTC' }, '2026-11-02T12:00:00Z')} filter="custom" pastOpen={false} offline={false} birthdayState="none" partner="Haru" onFilter={jest.fn()} onPast={jest.fn()} onAdd={onAdd} onItem={jest.fn()} onBirthday={jest.fn()} />);
  expect(screen.getByText(screen.t('anniv.empty.title'))).toBeTruthy();
  expect(screen.getByText(screen.t('anniv.empty.body'))).toBeTruthy();
  expect(screen.queryByText(screen.t('anniv.pepero'))).toBeNull();
});
it('V0-F08-AC-03 rows show title, date, D-n (D-1 tomorrow), the custom badge and a VoiceOver label', async () => {
  const tomorrow = computeAnniversaries({ ...common, startDate: '2025-01-01', timeZone: 'UTC', customs: [{ id: 'x', title: 'Our day', date: '2026-11-11', repeat: 'once' }] }, '2026-11-10T12:00:00Z');
  const screen = await renderWithI18n(<AnniversaryList view={tomorrow} filter="all" pastOpen={false} offline={false} birthdayState="none" partner="Haru" onFilter={jest.fn()} onPast={jest.fn()} onAdd={jest.fn()} onItem={jest.fn()} onBirthday={jest.fn()} />);
  expect(screen.getAllByText(screen.t('dday.left.one')).length).toBeGreaterThan(0);
  expect(screen.getAllByText(screen.t('anniv.badge.custom'))).toHaveLength(1);
  expect(screen.getByLabelText(screen.t('anniv.row.a11y', { title: 'Our day', date: '2026년 11월 11일 (수)', left: screen.t('dday.left.one') }))).toBeTruthy();
});
it('V0-F08-AC-04 leaves out seasons and birthdays that fall before the start date', () => {
  const items = days({ startDate: '2026-12-01', timeZone: 'UTC', me: { birthday: { month: 11, day: 20 } }, partner: { birthday: { month: 11, day: 25 } }, customs: [] }, '2026-12-05T12:00:00Z');
  expect(items.length).toBeGreaterThan(0);
  expect(items.every((item) => item.date >= '2026-12-01')).toBe(true);
  expect(items.some((item) => item.key === 'season:pepero:2026' || item.key === 'bday:me:2026')).toBe(false);
});
it('V0-F05-AC-01 shows my birthday with the wait row right after it and no partner birthday while only I entered one', async () => {
  const view = computeAnniversaries({ ...common, startDate: '2025-01-01', timeZone: 'UTC', me: { birthday: { month: 12, day: 1 } } }, '2026-11-02T12:00:00Z');
  const birthdays = [...view.past, ...view.upcoming].filter((item) => item.kind === 'birthday');
  expect(birthdays.length).toBeGreaterThan(0);
  expect(birthdays.every((item) => item.who === 'me')).toBe(true);
  const screen = await renderWithI18n(<AnniversaryList view={view} filter="all" pastOpen={false} offline={false} birthdayState="wait" partner="Haru" onFilter={jest.fn()} onPast={jest.fn()} onAdd={jest.fn()} onItem={jest.fn()} onBirthday={jest.fn()} />);
  const wait = screen.t('anniv.birthday.wait', { name: 'Haru' });
  expect(screen.getByText(screen.t('anniv.birthday.me'))).toBeTruthy();
  expect(screen.queryByText(screen.t('anniv.birthday', { name: 'Haru' }))).toBeNull();
  const tree = JSON.stringify(screen.toJSON());
  expect(tree.indexOf(screen.t('anniv.birthday.me'))).toBeLessThan(tree.indexOf(wait));
  expect(tree.indexOf(wait)).toBeLessThan(tree.indexOf(screen.t('anniv.christmas')));
});
it('V0-F05-AC-02 shows both birthdays yearly by month and day with no age or birth year', async () => {
  const view = computeAnniversaries({ ...common, startDate: '2025-01-01', timeZone: 'UTC', me: { birthday: { month: 3, day: 1 } }, partner: { birthday: { month: 2, day: 29 } } }, '2026-11-02T12:00:00Z');
  const birthdays = [...view.past, ...view.upcoming].filter((item) => item.kind === 'birthday');
  expect(birthdays.map((item) => item.date).sort()).toEqual(['2026-02-28', '2026-03-01', '2027-02-28', '2027-03-01']);
  const screen = await renderWithI18n(<AnniversaryList view={view} filter="all" pastOpen={false} offline={false} birthdayState="none" partner="Haru" onFilter={jest.fn()} onPast={jest.fn()} onAdd={jest.fn()} onItem={jest.fn()} onBirthday={jest.fn()} />);
  expect(screen.getByText(screen.t('anniv.birthday.me'))).toBeTruthy();
  expect(screen.getByText(screen.t('anniv.birthday', { name: 'Haru' }))).toBeTruthy();
  expect(JSON.stringify(screen.toJSON())).not.toMatch(/\b(19|20)\d\d\b(?!.*(?:수|월))/);
});
