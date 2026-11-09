import { fireEvent } from '@testing-library/react-native';
import { renderWithI18n } from '../../../test/render';
import { computeAnniversaries } from '../../../lib/anniversaries';
import { AnniversaryDetail } from '../AnniversaryDetail';
it('V0-F04-AC-02 automatic details are read-only and show their calculation', async () => {
  const screen = await renderWithI18n(<AnniversaryDetail item={{ key: 'd150', kind: 'days', date: '2025-05-30', n: 150 }} today="2025-05-01" startDate="2025-01-01" timeZone="Asia/Seoul" partner="Haru" userId="me" notify="default" notifyDefault="기본 설정 (오후 8:30 · 3일 전)" offline={false} onBack={jest.fn()} onEdit={jest.fn()} onDelete={jest.fn()} onSettings={jest.fn()} onMe={jest.fn()} />);
  expect(screen.getByText(screen.t('anniv.rule.days', { start: '2025년 1월 1일', n: 150 }) + '\n' + screen.t('anniv.detail.auto'))).toBeTruthy();
  expect(screen.getByText('기본 설정 (오후 8:30 · 3일 전)')).toBeTruthy();
  expect(screen.queryByText(screen.t('edit.delete'))).toBeNull();
});
it('V0-F07-AC-05 custom details can be edited and deleted', async () => {
  const onDelete = jest.fn();
  const screen = await renderWithI18n(<AnniversaryDetail item={{ key: 'custom:x', kind: 'custom', date: '2025-05-30', title: 'Trip', customId: 'x' }} custom={{ id: 'x', title: 'Trip', date: '2025-05-30', memo: 'Together', repeat: 'once', createdBy: 'me', updatedBy: 'me', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z', version: 1 }} today="2025-05-01" startDate="2025-01-01" timeZone="Asia/Seoul" partner="Haru" userId="me" notify="off" notifyDefault="기본 설정 (오후 8:30 · 3일 전)" offline={false} onBack={jest.fn()} onEdit={jest.fn()} onDelete={onDelete} onSettings={jest.fn()} onMe={jest.fn()} />);
  expect(screen.getByText('Together')).toBeTruthy();
  expect(screen.getByText(screen.t('anniv.notify.off'))).toBeTruthy();
  await fireEvent.press(screen.getByText(screen.t('edit.delete'))); expect(onDelete).toHaveBeenCalled();
});
it('V0-DR-05 dates the custom by-line in the space time zone, not UTC', async () => {
  const custom = { id: 'x', title: 'Trip', date: '2025-05-30', memo: null, repeat: 'once' as const, createdBy: 'partner', updatedBy: 'partner', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-10-29T23:30:00Z', version: 2 };
  const screen = await renderWithI18n(<AnniversaryDetail item={{ key: 'custom:x', kind: 'custom', date: '2025-05-30', title: 'Trip', customId: 'x' }} custom={custom} {...detailProps} />);
  expect(screen.getByText(screen.t('anniv.detail.by', { name: 'Haru', date: '10월 30일' }))).toBeTruthy();
});
it('V0-03 shows the offline band over a saved detail and locks deleting', async () => {
  const onDelete = jest.fn();
  const screen = await renderWithI18n(<AnniversaryDetail item={{ key: 'custom:x', kind: 'custom', date: '2025-05-30', title: 'Trip', customId: 'x' }} custom={{ id: 'x', title: 'Trip', date: '2025-05-30', memo: null, repeat: 'once', createdBy: 'me', updatedBy: 'me', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z', version: 1 }} {...detailProps} offline syncedAt="2026-11-01T03:00:00Z" onDelete={onDelete} />);
  expect(screen.getByText(screen.t('state.offline.readonly'))).toBeTruthy();
  const remove = screen.getByRole('button', { name: screen.t('edit.delete') });
  expect(remove.props.accessibilityState.disabled).toBe(true);
  await fireEvent.press(remove); expect(onDelete).not.toHaveBeenCalled();
});
const seasonDetail = { key: 'season:pepero:2026', kind: 'season' as const, date: '2026-11-11', seasonId: 'pepero' as const };
const detailProps = { today: '2026-11-01', startDate: '2025-01-01', timeZone: 'Asia/Seoul', partner: 'Haru', userId: 'me', notify: 'default' as const, notifyDefault: 'default', offline: false, onBack: jest.fn(), onEdit: jest.fn(), onDelete: jest.fn(), onSettings: jest.fn(), onMe: jest.fn() };
it('V0-F06-AC-01 season detail shows the yearly date and cannot be edited or deleted', async () => {
  const screen = await renderWithI18n(<AnniversaryDetail item={seasonDetail} {...detailProps} />);
  expect(screen.getByText(screen.t('anniv.pepero'))).toBeTruthy();
  expect(screen.getByText(screen.t('anniv.rule.fixed', { md: '11월 11일' }) + '\n' + screen.t('anniv.detail.auto.fixed'))).toBeTruthy();
  expect(screen.queryByText(screen.t('edit.delete'))).toBeNull();
  expect(screen.queryByText(screen.t('common.edit'))).toBeNull();
});
it('V0-F06-AC-01 shows Pepero Day and Christmas every year in the list calculation', () => {
  const view = computeAnniversaries({ startDate: '2025-01-01', timeZone: 'UTC', me: { birthday: null }, partner: null, customs: [] }, '2026-11-02T12:00:00Z');
  const seasons = [...view.past, ...view.upcoming].filter((item) => item.kind === 'season').map((item) => item.date);
  expect(seasons).toEqual(expect.arrayContaining(['2025-12-25', '2026-11-11', '2026-12-25']));
});
it('V0-F05-AC-03 partner birthday detail says only the owner can edit it and offers no edit button', async () => {
  const screen = await renderWithI18n(<AnniversaryDetail item={{ key: 'bday:partner:2026', kind: 'birthday', date: '2026-03-01', who: 'partner' }} {...detailProps} />);
  expect(screen.getByText(screen.t('anniv.detail.birthday.note'))).toBeTruthy();
  expect(screen.queryByText(screen.t('set.me.edit.title'))).toBeNull();
  expect(screen.queryByText(screen.t('common.edit'))).toBeNull();
});
it('V0-F05-AC-03 own birthday detail routes editing to the my-info screen', async () => {
  const onMe = jest.fn();
  const screen = await renderWithI18n(<AnniversaryDetail item={{ key: 'bday:me:2026', kind: 'birthday', date: '2026-03-01', who: 'me' }} {...detailProps} onMe={onMe} />);
  await fireEvent.press(screen.getByText(screen.t('set.me.edit.title')));
  expect(onMe).toHaveBeenCalled();
});
