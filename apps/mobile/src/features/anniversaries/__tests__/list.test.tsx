import { fireEvent } from '@testing-library/react-native';
import { renderWithI18n } from '../../../test/render';
import { computeAnniversaries } from '../../../lib/anniversaries';
import { AnniversaryList } from '../AnniversaryList';
const view = computeAnniversaries({ startDate: '2025-01-01', timeZone: 'UTC', me: { birthday: null }, partner: null, customs: [{ id: 'x', title: 'Our day', date: '2026-11-11', repeat: 'yearly' }] }, '2026-11-11T12:00:00Z');
it('V0-F08 presents today, custom badge, past toggle and birthday prompt', async () => {
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
it('V0-F08 custom filter omits other kinds and custom badges', async () => {
  const screen = await renderWithI18n(<AnniversaryList view={view} filter="custom" pastOpen={false} offline={false} birthdayState="none" partner="Haru" onFilter={jest.fn()} onPast={jest.fn()} onAdd={jest.fn()} onItem={jest.fn()} onBirthday={jest.fn()} />);
  expect(screen.queryByText(screen.t('anniv.pepero'))).toBeNull();
  expect(screen.queryByText(screen.t('anniv.badge.custom'))).toBeNull();
});
