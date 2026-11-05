import { fireEvent } from '@testing-library/react-native';
import { renderWithI18n } from '../../../test/render';
import { AnniversaryDetail } from '../AnniversaryDetail';
it('V0-F04-AC-02 automatic details are read-only and show their calculation', async () => {
  const screen = await renderWithI18n(<AnniversaryDetail item={{ key: 'd150', kind: 'days', date: '2025-05-30', n: 150 }} today="2025-05-01" startDate="2025-01-01" partner="Haru" userId="me" notify="default" offline={false} onBack={jest.fn()} onEdit={jest.fn()} onDelete={jest.fn()} onSettings={jest.fn()} onMe={jest.fn()} />);
  expect(screen.getByText(/사귄 날로 자동 계산돼요/)).toBeTruthy();
  expect(screen.queryByText(screen.t('edit.delete'))).toBeNull();
});
it('V0-F07-AC-05 custom details can be edited and deleted', async () => {
  const onDelete = jest.fn();
  const screen = await renderWithI18n(<AnniversaryDetail item={{ key: 'custom:x', kind: 'custom', date: '2025-05-30', title: 'Trip', customId: 'x' }} custom={{ id: 'x', title: 'Trip', date: '2025-05-30', memo: 'Together', repeat: 'once', createdBy: 'me', updatedBy: 'me', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z', version: 1 }} today="2025-05-01" startDate="2025-01-01" partner="Haru" userId="me" notify="off" offline={false} onBack={jest.fn()} onEdit={jest.fn()} onDelete={onDelete} onSettings={jest.fn()} onMe={jest.fn()} />);
  expect(screen.getByText('Together')).toBeTruthy();
  expect(screen.getByText(screen.t('anniv.notify.off'))).toBeTruthy();
  await fireEvent.press(screen.getByText(screen.t('edit.delete'))); expect(onDelete).toHaveBeenCalled();
});
