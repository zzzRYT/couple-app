import { Alert } from 'react-native';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { ApiError } from '../../../lib/errors';
import { eventFixture, ME, PARTNER } from '../../../test/fixtures';
import { renderWithI18n } from '../../../test/render';
import { notificationPermission, requestNotificationPermission } from '../../notifications/permissions';
import { CalendarScreen } from '../CalendarScreen';
import { EventEdit } from '../EventEdit';

jest.mock('../../notifications/permissions', () => ({ notificationPermission: jest.fn(async () => 'granted'), requestNotificationPermission: jest.fn(async () => true) }));
const events = [
  eventFixture({ id: 'dinner', title: '저녁 데이트', time: '19:00', endTime: '21:00', createdBy: ME }),
  eventFixture({ id: 'ikea', title: '이케아 장보기', createdBy: PARTNER, updatedBy: ME }),
  eventFixture({ id: 'gym', title: '헬스장 등록', time: '08:00', createdBy: PARTNER, updatedBy: PARTNER }),
];
const screenProps = { events, me: ME, meName: '나리', partner: '도담', today: '2026-11-25', offline: false, onAdd: jest.fn(), onEvent: jest.fn() };

describe('CalendarScreen', () => {
  it('V0-F19-AC-01 V0-F03-AC-05 shows the month, today with its events, and moves between months', async () => {
    const screen = await renderWithI18n(<CalendarScreen {...screenProps} />);
    expect(screen.getByText('2026년 11월')).toBeTruthy();
    expect(screen.getByLabelText(screen.t('cal.a11y.day.by', { date: '11월 25일 수요일', n: 3, names: '나 1, 도담 2' })).props.accessibilityState).toEqual({ selected: true });
    expect(screen.getByLabelText(screen.t('cal.a11y.day', { date: '11월 24일 화요일', n: 0 }))).toBeTruthy();
    await fireEvent.press(screen.getByLabelText(screen.t('cal.next')));
    expect(screen.getByText('2026년 12월')).toBeTruthy();
    expect(screen.getByText(screen.t('cal.empty'))).toBeTruthy();
    await fireEvent.press(screen.getByText(screen.t('cal.today')));
    expect(screen.getByText('2026년 11월')).toBeTruthy();
  });
  it('V0-F19-AC-01 filters the grid and the day list to one writer', async () => {
    const screen = await renderWithI18n(<CalendarScreen {...screenProps} />);
    expect(screen.getByRole('button', { name: screen.t('cal.filter.all') }).props.accessibilityState).toEqual({ selected: true });
    await fireEvent.press(screen.getByRole('button', { name: '도담' }));
    expect(screen.getByRole('button', { name: '도담' }).props.accessibilityState).toEqual({ selected: true });
    expect(screen.getByLabelText(screen.t('cal.a11y.day.by', { date: '11월 25일 수요일', n: 2, names: '도담 2' }))).toBeTruthy();
    expect(screen.queryByText('저녁 데이트')).toBeNull();
    expect(screen.getByText('헬스장 등록')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: screen.t('cal.by.me') }));
    expect(screen.getByLabelText(screen.t('cal.a11y.day.by', { date: '11월 25일 수요일', n: 1, names: '나 1' }))).toBeTruthy();
    expect(screen.queryByText('헬스장 등록')).toBeNull();
    await fireEvent.press(screen.getByTestId('day-2026-11-24'));
    expect(screen.getByText(screen.t('cal.empty.me'))).toBeTruthy();
  });
  it('V0-F19-AC-02 V0-F19-AC-04 lists the chosen day all-day first, then by time, each with who added and who last edited it', async () => {
    const onEvent = jest.fn();
    const screen = await renderWithI18n(<CalendarScreen {...screenProps} onEvent={onEvent} />);
    const rows = screen.getAllByLabelText(/, (도담님이|내가) 추가/).map((row) => row.props.accessibilityLabel);
    expect(rows).toEqual([
      screen.t('cal.a11y.event', { time: screen.t('cal.allDay'), title: '이케아 장보기', name: `${screen.t('cal.added', { name: '도담' })}, ${screen.t('cal.edited.me')}` }),
      screen.t('cal.a11y.event', { time: '오전 8:00', title: '헬스장 등록', name: screen.t('cal.added', { name: '도담' }) }),
      screen.t('cal.a11y.event', { time: '오후 7:00 – 오후 9:00', title: '저녁 데이트', name: screen.t('cal.added.me') }),
    ]);
    expect(screen.getByText(`${screen.t('cal.allDay')} · 도담님이 추가 · 내가 수정`)).toBeTruthy();
    await fireEvent.press(screen.getByText('헬스장 등록'));
    expect(onEvent).toHaveBeenCalledWith(events[2]);
  });
  it('V0-F19-AC-07 keeps cached events visible offline and locks adding', async () => {
    const onAdd = jest.fn();
    const screen = await renderWithI18n(<CalendarScreen {...screenProps} offline onAdd={onAdd} />);
    expect(screen.getByText('저녁 데이트')).toBeTruthy();
    expect(screen.getByLabelText(screen.t('cal.add')).props.accessibilityState.disabled).toBe(true);
    await fireEvent.press(screen.getByTestId('day-2026-11-24'));
    await fireEvent.press(screen.getByText(screen.t('cal.add')));
    expect(onAdd).not.toHaveBeenCalled();
  });
});

const sheetProps = { date: '2026-11-25', me: ME, meName: '나리', partner: '도담', timeZone: 'Asia/Seoul', offline: false, remove: jest.fn(), reload: jest.fn(), onClose: jest.fn(), onGone: jest.fn(), onSaved: jest.fn() };
const saveButton = (screen: Awaited<ReturnType<typeof renderWithI18n>>) => screen.getByRole('button', { name: screen.t('common.save') });
describe('EventEdit', () => {
  it('V0-F19-AC-03 keeps save off without a title or with an end before the start, and sends a timed event', async () => {
    const save = jest.fn(async () => undefined); const onSaved = jest.fn();
    const screen = await renderWithI18n(<EventEdit {...sheetProps} save={save} onSaved={onSaved} />);
    expect(screen.getByText(screen.t('cal.new.title'))).toBeTruthy();
    expect(screen.queryByText(/추가한 일정/)).toBeNull();
    expect(saveButton(screen).props.accessibilityState.disabled).toBe(true);
    await fireEvent.changeText(screen.getByLabelText(screen.t('edit.field.title')), 'x'.repeat(21));
    expect(screen.getByText(screen.t('edit.err.title.long'))).toBeTruthy();
    await fireEvent.changeText(screen.getByLabelText(screen.t('edit.field.title')), ' 저녁 데이트 ');
    await fireEvent.press(saveButton(screen));
    await waitFor(() => expect(onSaved).toHaveBeenCalledWith('saved', '2026-11-25'));
    expect((save.mock.calls[0] as unknown[]).slice(0, 2)).toEqual([{ title: '저녁 데이트', date: '2026-11-25', time: '19:00', endTime: null, alert: 'none' }, undefined]);
    const late = await renderWithI18n(<EventEdit {...sheetProps} initial={eventFixture({ time: '19:00', endTime: '18:00' })} save={save} />);
    expect(late.getByText(late.t('cal.err.end'))).toBeTruthy();
    expect(saveButton(late).props.accessibilityState.disabled).toBe(true);
  });
  it('V0-F19-AC-03 offers only the all-day alerts once 종일 is on, and resets one that no longer fits', async () => {
    const save = jest.fn(async () => undefined);
    const screen = await renderWithI18n(<EventEdit {...sheetProps} initial={eventFixture({ time: '19:00', alert: '5m' })} save={save} />);
    await fireEvent.press(screen.getByRole('switch', { name: screen.t('cal.allDay') }));
    expect(screen.queryByText(screen.t('cal.field.start'))).toBeNull();
    await fireEvent.press(screen.getByLabelText(`${screen.t('edit.field.notify')}, ${screen.t('cal.alert.none')}`));
    expect(screen.getAllByRole('radio').map((row) => row.props.accessibilityLabel)).toEqual([screen.t('cal.alert.none'), screen.t('cal.alert.allDay.at'), screen.t('cal.alert.allDay.1d')]);
    await fireEvent.press(screen.getByRole('radio', { name: screen.t('cal.alert.allDay.1d') }));
    await fireEvent.press(saveButton(screen));
    await waitFor(() => expect(save).toHaveBeenCalled());
    expect((save.mock.calls[0] as unknown[]).slice(0, 2)).toEqual([{ title: '저녁 데이트', date: '2026-11-25', time: null, endTime: null, alert: '1d' }, 1]);
  });
  it('V0-F19-AC-05 asks for permission when an alert is chosen and says when this phone will stay silent', async () => {
    (notificationPermission as jest.Mock).mockResolvedValue('undetermined'); (requestNotificationPermission as jest.Mock).mockResolvedValue(false);
    const screen = await renderWithI18n(<EventEdit {...sheetProps} save={jest.fn()} />);
    expect(screen.getByText(screen.t('cal.alert.note'))).toBeTruthy();
    expect(screen.queryByText(screen.t('cal.alert.denied'))).toBeNull();
    await fireEvent.press(screen.getByLabelText(`${screen.t('edit.field.notify')}, ${screen.t('cal.alert.none')}`));
    await fireEvent.press(screen.getByRole('radio', { name: screen.t('cal.alert.30m') }));
    await waitFor(() => expect(screen.getByText(screen.t('cal.alert.denied'))).toBeTruthy());
    expect(requestNotificationPermission).toHaveBeenCalled();
    (notificationPermission as jest.Mock).mockResolvedValue('granted');
  });
  it('V0-F19-AC-04 lets me edit or delete the partner\'s event and shows who added it and who last edited it', async () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined); const remove = jest.fn(async () => undefined); const onSaved = jest.fn();
    const screen = await renderWithI18n(<EventEdit {...sheetProps} initial={eventFixture({ createdBy: PARTNER, updatedBy: ME, updatedAt: '2026-11-25T03:00:00Z', version: 3 })} remove={remove} onSaved={onSaved} save={jest.fn()} />);
    expect(screen.getByText(screen.t('cal.detail.added', { name: '도담', date: '11월 20일' }))).toBeTruthy();
    expect(screen.getByText(screen.t('cal.detail.edited.me', { date: '11월 25일' }))).toBeTruthy();
    await fireEvent.press(screen.getByText(screen.t('cal.delete')));
    expect(alert.mock.calls[0]![0]).toBe(screen.t('cal.delete.title'));
    (alert.mock.calls[0]![2] as { style?: string; onPress?: () => void }[]).find((button) => button.style === 'destructive')!.onPress!();
    await waitFor(() => expect(onSaved).toHaveBeenCalledWith('deleted', '2026-11-25'));
    expect((remove.mock.calls[0] as unknown[])[0]).toBe(3);
    const mine = await renderWithI18n(<EventEdit {...sheetProps} initial={eventFixture({})} save={jest.fn()} />);
    expect(mine.getByText(mine.t('cal.detail.added.me', { date: '11월 20일' }))).toBeTruthy();
    expect(mine.queryByText(/마지막 수정/)).toBeNull();
    alert.mockRestore();
  });
  it('V0-F19-AC-06 reloads on a stale edit and leaves when the partner deleted the event', async () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    const stale = await renderWithI18n(<EventEdit {...sheetProps} initial={eventFixture({})} save={jest.fn().mockRejectedValue(new ApiError(409, 'VERSION_CONFLICT'))} reload={jest.fn().mockResolvedValue(eventFixture({ title: '최신', version: 2 }))} />);
    await fireEvent.press(saveButton(stale));
    await waitFor(() => expect(stale.getByDisplayValue('최신')).toBeTruthy());
    expect(alert).toHaveBeenCalledWith(stale.t('edit.conflict.title', { name: '도담' }), stale.t('edit.conflict.body'), [{ text: stale.t('common.ok') }]);
    const onGone = jest.fn();
    const gone = await renderWithI18n(<EventEdit {...sheetProps} initial={eventFixture({})} onGone={onGone} save={jest.fn().mockRejectedValue(new ApiError(404, 'NOT_FOUND', { gone: true }))} />);
    await fireEvent.press(saveButton(gone));
    await waitFor(() => expect(alert).toHaveBeenCalledWith(gone.t('cal.gone.title'), gone.t('cal.gone.body', { name: '도담' }), [expect.objectContaining({ text: gone.t('common.ok') })]));
    (alert.mock.calls.at(-1)![2] as { onPress?: () => void }[])[0]!.onPress!();
    expect(onGone).toHaveBeenCalled();
    alert.mockRestore();
  });
  it('V0-F19-AC-07 locks saving and deleting offline', async () => {
    const save = jest.fn();
    const screen = await renderWithI18n(<EventEdit {...sheetProps} offline initial={eventFixture({})} save={save} />);
    expect(saveButton(screen).props.accessibilityState.disabled).toBe(true);
    expect(screen.getByRole('button', { name: screen.t('cal.delete') }).props.accessibilityState.disabled).toBe(true);
  });
});
