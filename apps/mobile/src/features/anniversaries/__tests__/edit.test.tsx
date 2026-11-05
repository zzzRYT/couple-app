import { Alert } from 'react-native';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { renderWithI18n } from '../../../test/render';
import { ApiError } from '../../../lib/errors';
import { AnniversaryEdit } from '../AnniversaryEdit';
const base = { today: '2026-11-02', partner: 'Haru', offline: false, initialNotify: 'default' as const, notifyDefault: '기본 설정 (오후 8:30 · 3일 전)', remove: jest.fn(), reload: jest.fn(), onClose: jest.fn(), onSaved: jest.fn() };
it('V0-F07 prevents overflow and keeps the same key after a network error', async () => {
  const save = jest.fn().mockRejectedValueOnce(new TypeError('offline')).mockResolvedValueOnce(undefined);
  const screen = await renderWithI18n(<AnniversaryEdit {...base} save={save} />);
  const input = screen.getByLabelText(screen.t('edit.field.title'));
  await fireEvent.changeText(input, 'x'.repeat(21));
  expect(screen.getByText(screen.t('edit.err.title.long'))).toBeTruthy();
  await fireEvent.changeText(input, 'Together');
  await fireEvent.press(screen.getByText(screen.t('common.save')));
  await waitFor(() => expect(screen.getByText(screen.t('edit.save.err'))).toBeTruthy());
  await fireEvent.press(screen.getByText(screen.t('common.save')));
  await waitFor(() => expect(save).toHaveBeenCalledTimes(2));
  expect(save.mock.calls[0][2]).toBe(save.mock.calls[1][2]);
});
it('V0-F07 reloads latest values on a version conflict', async () => {
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
  const item = { id: 'x', title: 'Old', memo: null, date: '2025-05-03', repeat: 'yearly' as const, createdBy: 'me', updatedBy: 'me', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z', version: 1 };
  const screen = await renderWithI18n(<AnniversaryEdit {...base} initial={item} save={jest.fn().mockRejectedValue(new ApiError(409, 'VERSION_CONFLICT'))} reload={jest.fn().mockResolvedValue({ ...item, title: 'Latest', version: 2 })} />);
  await fireEvent.press(screen.getByText(screen.t('common.save')));
  await waitFor(() => expect(screen.getByDisplayValue('Latest')).toBeTruthy());
  expect(alert).toHaveBeenCalledWith(screen.t('edit.conflict.title', { name: 'Haru' }), screen.t('edit.conflict.body'));
  alert.mockRestore();
});
it('V0-F07 warns before discarding changes and locks saving while offline', async () => {
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined); const save = jest.fn();
  const screen = await renderWithI18n(<AnniversaryEdit {...base} offline save={save} />);
  await fireEvent.changeText(screen.getByLabelText(screen.t('edit.field.title')), 'Our day');
  await fireEvent.press(screen.getByText(screen.t('common.save'))); expect(save).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByText(screen.t('common.cancel')));
  expect(alert).toHaveBeenCalledWith(screen.t('edit.discard.title'), '', expect.arrayContaining([expect.objectContaining({ style: 'destructive' })]));
  alert.mockRestore();
});
it('V0-F07 shows the gone alert when the partner deleted the item', async () => {
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
  const item = { id: 'x', title: 'Old', memo: null, date: '2025-05-03', repeat: 'yearly' as const, createdBy: 'me', updatedBy: 'me', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z', version: 1 };
  const screen = await renderWithI18n(<AnniversaryEdit {...base} initial={item} save={jest.fn().mockRejectedValue(new ApiError(404, 'NOT_FOUND', { gone: true }))} />);
  await fireEvent.press(screen.getByText(screen.t('common.save')));
  await waitFor(() => expect(alert).toHaveBeenCalledWith(screen.t('edit.gone.title'), screen.t('edit.gone.body', { name: 'Haru' }), expect.any(Array)));
  alert.mockRestore();
});
it('V0-F07 shows an empty title error after leaving the field', async () => {
  const screen = await renderWithI18n(<AnniversaryEdit {...base} save={jest.fn()} />);
  await fireEvent(screen.getByLabelText(screen.t('edit.field.title')), 'blur');
  expect(screen.getByText(screen.t('edit.err.title.empty'))).toBeTruthy();
});

it('V0-F10-AC-04 shows this device\'s default in the notification choice', async () => {
  const screen = await renderWithI18n(<AnniversaryEdit {...base} save={jest.fn()} />);
  expect(screen.getByText('기본 설정 (오후 8:30 · 3일 전)')).toBeTruthy();
});
