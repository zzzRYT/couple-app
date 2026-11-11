import { Alert } from 'react-native';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { renderWithI18n } from '../../../test/render';
import { ApiError } from '../../../lib/errors';
import { AnniversaryEdit } from '../AnniversaryEdit';
import { AnniversaryList } from '../AnniversaryList';
import { computeAnniversaries } from '../../../lib/anniversaries';
const item = { id: 'x', title: 'Old', memo: null, date: '2025-05-03', repeat: 'yearly' as const, createdBy: 'me', updatedBy: 'me', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z', version: 1 };
const base = { today: '2026-11-02', partner: 'Haru', offline: false, initialNotify: 'default' as const, notifyDefault: '기본 설정 (오후 8:30 · 3일 전)', remove: jest.fn(), reload: jest.fn(), onClose: jest.fn(), onGone: jest.fn(), onSaved: jest.fn() };
it('V0-F07-AC-02 V0-F07-AC-10 prevents overflow, keeps the input and the same key after a network error', async () => {
  const save = jest.fn().mockRejectedValueOnce(new TypeError('offline')).mockResolvedValueOnce(undefined);
  const screen = await renderWithI18n(<AnniversaryEdit {...base} save={save} />);
  const input = screen.getByLabelText(screen.t('edit.field.title'));
  await fireEvent.changeText(input, 'x'.repeat(21));
  expect(screen.getByText(screen.t('edit.err.title.long'))).toBeTruthy();
  await fireEvent.changeText(screen.getByLabelText(screen.t('edit.field.memo')), 'm'.repeat(101));
  expect(screen.getByText(screen.t('edit.err.memo.long'))).toBeTruthy();
  await fireEvent.changeText(screen.getByLabelText(screen.t('edit.field.memo')), '');
  await fireEvent.changeText(input, 'Together');
  await fireEvent.press(screen.getByText(screen.t('common.save')));
  await waitFor(() => expect(screen.getByText(screen.t('edit.save.err'))).toBeTruthy());
  expect(screen.getByDisplayValue('Together')).toBeTruthy();
  await fireEvent.press(screen.getByText(screen.t('common.save')));
  await waitFor(() => expect(save).toHaveBeenCalledTimes(2));
  expect(save.mock.calls[0][2]).toBe(save.mock.calls[1][2]);
});
it('V0-F07-AC-08 reloads latest values on a version conflict and lets the person save again', async () => {
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
  const screen = await renderWithI18n(<AnniversaryEdit {...base} initial={item} save={jest.fn().mockRejectedValue(new ApiError(409, 'VERSION_CONFLICT'))} reload={jest.fn().mockResolvedValue({ ...item, title: 'Latest', version: 2 })} />);
  await fireEvent.press(screen.getByText(screen.t('common.save')));
  await waitFor(() => expect(screen.getByDisplayValue('Latest')).toBeTruthy());
  expect(alert).toHaveBeenCalledWith(screen.t('edit.conflict.title', { name: 'Haru' }), screen.t('edit.conflict.body'), [{ text: screen.t('common.ok') }]);
  alert.mockRestore();
});
it('V0-F07-AC-07 warns before discarding changes and, offline, keeps saving locked', async () => {
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined); const save = jest.fn();
  const screen = await renderWithI18n(<AnniversaryEdit {...base} offline save={save} />);
  await fireEvent.changeText(screen.getByLabelText(screen.t('edit.field.title')), 'Our day');
  await fireEvent.press(screen.getByText(screen.t('common.save'))); expect(save).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByText(screen.t('common.cancel')));
  expect(alert).toHaveBeenCalledWith(screen.t('edit.discard.title'), '', [expect.objectContaining({ text: screen.t('edit.discard.cta'), style: 'destructive' }), { text: screen.t('edit.discard.keep'), isPreferred: true }]);
  alert.mockRestore();
});
it('V0-F07-AC-09 shows the gone alert when the partner deleted the item and its OK leaves for the list', async () => {
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined); const onGone = jest.fn(); const onClose = jest.fn();
  const screen = await renderWithI18n(<AnniversaryEdit {...base} initial={item} onGone={onGone} onClose={onClose} save={jest.fn().mockRejectedValue(new ApiError(404, 'NOT_FOUND', { gone: true }))} />);
  await fireEvent.press(screen.getByText(screen.t('common.save')));
  await waitFor(() => expect(alert).toHaveBeenCalledWith(screen.t('edit.gone.title'), screen.t('edit.gone.body', { name: 'Haru' }), [expect.objectContaining({ text: screen.t('common.ok') })]));
  (alert.mock.calls[0]![2] as { onPress?: () => void }[])[0]!.onPress!();
  expect(onGone).toHaveBeenCalled(); expect(onClose).not.toHaveBeenCalled();
  alert.mockRestore();
});
it('A-16 counts the title after trimming the spaces around it', async () => {
  const screen = await renderWithI18n(<AnniversaryEdit {...base} save={jest.fn()} />);
  await fireEvent.changeText(screen.getByLabelText(screen.t('edit.field.title')), `  ${'x'.repeat(20)} `);
  expect(screen.getByText(screen.t('edit.counter', { n: 20, max: 20 }))).toBeTruthy();
  expect(screen.queryByText(screen.t('edit.err.title.long'))).toBeNull();
  expect(screen.getByRole('button', { name: screen.t('common.save') }).props.accessibilityState.disabled).toBe(false);
});
it('V0-05 previews the next date and D-n even when it is more than a year ahead', async () => {
  const once = await renderWithI18n(<AnniversaryEdit {...base} initial={{ ...item, date: '2027-12-25', repeat: 'once' }} save={jest.fn()} />);
  expect(once.getByText(once.t('edit.preview.next', { date: '12월 25일 (토)', left: once.t('dday.left', { n: 418 }) }))).toBeTruthy();
  const yearly = await renderWithI18n(<AnniversaryEdit {...base} initial={{ ...item, date: '2028-03-01', repeat: 'yearly' }} save={jest.fn()} />);
  expect(yearly.getByText(yearly.t('edit.preview.next', { date: '3월 1일 (수)', left: yearly.t('dday.left', { n: 485 }) }))).toBeTruthy();
  const passed = await renderWithI18n(<AnniversaryEdit {...base} initial={{ ...item, date: '2025-05-03', repeat: 'yearly' }} save={jest.fn()} />);
  expect(passed.getByText(passed.t('edit.preview.next', { date: '5월 3일 (월)', left: passed.t('dday.left', { n: 182 }) }))).toBeTruthy();
});
it('V0-F07-AC-02 shows an empty title error after leaving the field', async () => {
  const screen = await renderWithI18n(<AnniversaryEdit {...base} save={jest.fn()} />);
  await fireEvent(screen.getByLabelText(screen.t('edit.field.title')), 'blur');
  expect(screen.getByText(screen.t('edit.err.title.empty'))).toBeTruthy();
});

it('V0-F10-AC-04 shows this device\'s default in the notification choice', async () => {
  const screen = await renderWithI18n(<AnniversaryEdit {...base} save={jest.fn()} />);
  expect(screen.getByText('기본 설정 (오후 8:30 · 3일 전)')).toBeTruthy();
});

it('V0-F07-AC-01 opens the new form with every field and keeps save disabled until there is a title', async () => {
  const screen = await renderWithI18n(<AnniversaryEdit {...base} save={jest.fn()} />);
  expect(screen.getByText(screen.t('edit.new.title'))).toBeTruthy();
  for (const key of ['edit.field.title', 'edit.field.date', 'edit.field.repeat', 'edit.field.memo', 'edit.field.notify']) expect(screen.getByText(screen.t(key))).toBeTruthy();
  expect(screen.getByText(screen.t('anniv.repeat.yearly'))).toBeTruthy();
  expect(screen.getByText(screen.t('anniv.repeat.once'))).toBeTruthy();
  expect(screen.getByText(screen.t('anniv.notify.off'))).toBeTruthy();
  const save = () => screen.getByRole('button', { name: screen.t('common.save') }).props.accessibilityState.disabled;
  expect(save()).toBe(true);
  await fireEvent.changeText(screen.getByLabelText(screen.t('edit.field.title')), 'Our day');
  expect(save()).toBe(false);
});
it('V0-F07-AC-03 saves a valid entry with trimmed fields and reports it saved', async () => {
  const save = jest.fn().mockResolvedValue(undefined); const onSaved = jest.fn();
  const screen = await renderWithI18n(<AnniversaryEdit {...base} save={save} onSaved={onSaved} />);
  await fireEvent.changeText(screen.getByLabelText(screen.t('edit.field.title')), '  Our day ');
  await fireEvent.press(screen.getByText(screen.t('common.save')));
  await waitFor(() => expect(onSaved).toHaveBeenCalledWith('saved'));
  expect(save.mock.calls[0]![0]).toEqual({ title: 'Our day', memo: null, date: '2026-11-02', repeat: 'yearly' });
  expect(save.mock.calls[0]![3]).toBe('default');
  expect(screen.getByText(screen.t('edit.shared.hint', { name: 'Haru' }))).toBeTruthy();
});
it('V0-F07-AC-04 previews a past one-time date as a past anniversary and still allows saving', async () => {
  const save = jest.fn().mockResolvedValue(undefined);
  const screen = await renderWithI18n(<AnniversaryEdit {...base} initial={{ ...item, repeat: 'once' }} save={save} />);
  expect(screen.getByText(screen.t('edit.preview.past'))).toBeTruthy();
  await fireEvent.press(screen.getByText(screen.t('common.save')));
  await waitFor(() => expect(save).toHaveBeenCalled());
});
it('V0-F07-AC-06 deletes after confirmation and reports it deleted', async () => {
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
  const remove = jest.fn().mockResolvedValue(undefined); const onSaved = jest.fn();
  const screen = await renderWithI18n(<AnniversaryEdit {...base} initial={item} save={jest.fn()} remove={remove} onSaved={onSaved} />);
  await fireEvent.press(screen.getByText(screen.t('edit.delete')));
  expect(alert).toHaveBeenCalledWith(screen.t('edit.delete.title'), screen.t('edit.delete.body', { name: 'Haru' }), expect.any(Array));
  expect(remove).not.toHaveBeenCalled();
  const confirm = (alert.mock.calls[0]![2] as { style?: string; onPress?: () => void }[]).find((button) => button.style === 'destructive')!;
  confirm.onPress!();
  await waitFor(() => expect(onSaved).toHaveBeenCalledWith('deleted'));
  expect(remove.mock.calls[0]![0]).toBe(1);
  alert.mockRestore();
});
it('V0-F07-AC-06 ND13 shows the delete-failure toast when deleting fails and keeps the sheet open', async () => {
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined); const onSaved = jest.fn();
  const screen = await renderWithI18n(<AnniversaryEdit {...base} initial={item} save={jest.fn()} remove={jest.fn().mockRejectedValue(new TypeError('offline'))} onSaved={onSaved} />);
  await fireEvent.press(screen.getByText(screen.t('edit.delete')));
  (alert.mock.calls[0]![2] as { style?: string; onPress?: () => void }[]).find((button) => button.style === 'destructive')!.onPress!();
  expect(await screen.findByText(screen.t('edit.delete.err'))).toBeTruthy();
  expect(screen.queryByText(screen.t('edit.save.err'))).toBeNull();
  expect(onSaved).not.toHaveBeenCalled();
  alert.mockRestore();
});
it('ND15 uses the unpaired hint and delete body while no partner has joined', async () => {
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
  const screen = await renderWithI18n(<AnniversaryEdit {...base} partner={null} initial={item} save={jest.fn()} />);
  expect(screen.getByText(screen.t('edit.shared.hint.unpaired'))).toBeTruthy();
  await fireEvent.press(screen.getByText(screen.t('edit.delete')));
  expect(alert).toHaveBeenCalledWith(screen.t('edit.delete.title'), screen.t('edit.delete.body.unpaired'), expect.any(Array));
  alert.mockRestore();
});
it('V0-F07-AC-07 closes at once when nothing was changed', async () => {
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined); const onClose = jest.fn();
  const screen = await renderWithI18n(<AnniversaryEdit {...base} initial={item} save={jest.fn()} onClose={onClose} />);
  await fireEvent.press(screen.getByText(screen.t('common.cancel')));
  expect(onClose).toHaveBeenCalled(); expect(alert).not.toHaveBeenCalled();
  alert.mockRestore();
});
it('V0-F07-AC-11 disables add, edit and delete while offline', async () => {
  const view = computeAnniversaries({ startDate: '2025-01-01', timeZone: 'UTC', me: { birthday: null }, partner: null, customs: [] }, '2026-11-02T12:00:00Z');
  const onAdd = jest.fn();
  const list = await renderWithI18n(<AnniversaryList view={view} filter="all" pastOpen={false} offline birthdayState="none" partner="Haru" onFilter={jest.fn()} onPast={jest.fn()} onAdd={onAdd} onItem={jest.fn()} onBirthday={jest.fn()} />);
  const add = list.getByRole('button', { name: list.t('anniv.add') });
  expect(add.props.accessibilityState.disabled).toBe(true);
  await fireEvent.press(add); expect(onAdd).not.toHaveBeenCalled();
  const edit = await renderWithI18n(<AnniversaryEdit {...base} offline initial={item} save={jest.fn()} />);
  await fireEvent.changeText(edit.getByLabelText(edit.t('edit.field.title')), 'Changed');
  expect(edit.getByRole('button', { name: edit.t('common.save') }).props.accessibilityState.disabled).toBe(true);
  expect(edit.getByRole('button', { name: edit.t('edit.delete') }).props.accessibilityState.disabled).toBe(true);
});
