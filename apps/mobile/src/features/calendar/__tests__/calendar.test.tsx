import { Alert } from 'react-native';
import { fireEvent, waitFor, within } from '@testing-library/react-native';
import { ApiError } from '../../../lib/errors';
import { commentFixture, eventFixture, ME, PARTNER } from '../../../test/fixtures';
import { renderWithI18n } from '../../../test/render';
import { notificationPermission, requestNotificationPermission } from '../../notifications/permissions';
import { CalendarScreen } from '../CalendarScreen';
import { EventEdit } from '../EventEdit';

jest.mock('../../notifications/permissions', () => ({ notificationPermission: jest.fn(async () => 'granted'), requestNotificationPermission: jest.fn(async () => true) }));
const events = [
  eventFixture({ id: 'dinner', title: '저녁 데이트', time: '19:00', endTime: '21:00', ownerId: null, createdBy: ME }),
  eventFixture({ id: 'ikea', title: '이케아 장보기', ownerId: null, createdBy: PARTNER, updatedBy: ME }),
  eventFixture({ id: 'gym', title: '헬스장 등록', time: '08:00', ownerId: PARTNER, createdBy: PARTNER, updatedBy: PARTNER }),
];
const screenProps = { events, eventComments: [], me: ME, meName: '나리', partner: '도담', today: '2026-11-25', offline: false, onAdd: jest.fn(), onEvent: jest.fn() };

describe('CalendarScreen', () => {
  it('V0-F19-AC-01 V0-F03-AC-05 shows the month, today with its events, and moves between months', async () => {
    const screen = await renderWithI18n(<CalendarScreen {...screenProps} />);
    expect(screen.getByText('2026년 11월')).toBeTruthy();
    expect(screen.getByLabelText(screen.t('cal.a11y.day.by', { date: '11월 25일 수요일', n: 3, names: '함께 2, 도담 1' })).props.accessibilityState).toEqual({ selected: true });
    expect(screen.getByLabelText(screen.t('cal.a11y.day', { date: '11월 24일 화요일', n: 0 }))).toBeTruthy();
    await fireEvent.press(screen.getByLabelText(screen.t('cal.next')));
    expect(screen.getByText('2026년 12월')).toBeTruthy();
    expect(screen.getByText(screen.t('cal.empty'))).toBeTruthy();
    await fireEvent.press(screen.getByText(screen.t('cal.today')));
    expect(screen.getByText('2026년 11월')).toBeTruthy();
  });
  it('V0-F19-AC-01 filters the grid and the day list to one owner, whoever added the event', async () => {
    const screen = await renderWithI18n(<CalendarScreen {...screenProps} />);
    expect(screen.getByRole('button', { name: screen.t('cal.filter.all') }).props.accessibilityState).toEqual({ selected: true });
    await fireEvent.press(screen.getByRole('button', { name: '도담' }));
    expect(screen.getByRole('button', { name: '도담' }).props.accessibilityState).toEqual({ selected: true });
    expect(screen.getByLabelText(screen.t('cal.a11y.day.by', { date: '11월 25일 수요일', n: 1, names: '도담 1' }))).toBeTruthy();
    expect(screen.queryByText('이케아 장보기')).toBeNull();
    expect(screen.getByText('헬스장 등록')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: screen.t('cal.owner.together') }));
    expect(screen.getByLabelText(screen.t('cal.a11y.day.by', { date: '11월 25일 수요일', n: 2, names: '함께 2' }))).toBeTruthy();
    expect(screen.getByText('이케아 장보기')).toBeTruthy();
    expect(screen.queryByText('헬스장 등록')).toBeNull();
    await fireEvent.press(screen.getByRole('button', { name: screen.t('cal.by.me') }));
    expect(screen.getByLabelText(screen.t('cal.a11y.day', { date: '11월 25일 수요일', n: 0 }))).toBeTruthy();
    expect(screen.getByText(screen.t('cal.empty.me'))).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: screen.t('cal.owner.together') }));
    await fireEvent.press(screen.getByTestId('day-2026-11-24'));
    expect(screen.getByText(screen.t('cal.empty.together'))).toBeTruthy();
  });
  it('V0-F19-AC-02 V0-F19-AC-04 lists the chosen day all-day first, then by time, each with whose plan it is next to who added and who last edited it', async () => {
    const onEvent = jest.fn();
    const screen = await renderWithI18n(<CalendarScreen {...screenProps} onEvent={onEvent} />);
    const rows = screen.getAllByLabelText(/, (도담님이|내가) 추가/).map((row) => row.props.accessibilityLabel);
    expect(rows).toEqual([
      screen.t('cal.a11y.event', { time: screen.t('cal.allDay'), title: '이케아 장보기', owner: screen.t('cal.owner.together.long'), name: `${screen.t('cal.added', { name: '도담' })}, ${screen.t('cal.edited.me')}` }),
      screen.t('cal.a11y.event', { time: '오전 8:00', title: '헬스장 등록', owner: screen.t('cal.owner.partner', { name: '도담' }), name: screen.t('cal.added', { name: '도담' }) }),
      screen.t('cal.a11y.event', { time: '오후 7:00 – 오후 9:00', title: '저녁 데이트', owner: screen.t('cal.owner.together.long'), name: screen.t('cal.added.me') }),
    ]);
    const ikea = within(screen.getByLabelText(rows[0]!));
    expect(ikea.getByText(screen.t('cal.owner.together'))).toBeTruthy();
    expect(ikea.getByText(`${screen.t('cal.allDay')} · 도담님이 추가 · 내가 수정`)).toBeTruthy();
    expect(within(screen.getByLabelText(rows[1]!)).getByText('도담')).toBeTruthy();
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
  it('V0-F19-AC-08 adds the comment count to the day row of an event that has comments', async () => {
    const screen = await renderWithI18n(<CalendarScreen {...screenProps} eventComments={[commentFixture({ id: 'c1', eventId: 'ikea' }), commentFixture({ id: 'c2', eventId: 'ikea', createdBy: ME })]} />);
    const count = screen.t('cal.comment.count', { n: 2 });
    const ikea = screen.getByLabelText(`${screen.t('cal.a11y.event', { time: screen.t('cal.allDay'), title: '이케아 장보기', owner: screen.t('cal.owner.together.long'), name: `${screen.t('cal.added', { name: '도담' })}, ${screen.t('cal.edited.me')}` })}, ${count}`);
    expect(within(ikea).getByText(`${screen.t('cal.allDay')} · 도담님이 추가 · 내가 수정 · ${count}`)).toBeTruthy();
    expect(screen.queryAllByText(new RegExp(count))).toHaveLength(1);
  });
});

const sheetProps = { date: '2026-11-25', me: ME, meName: '나리', partner: '도담', partnerId: PARTNER, timeZone: 'Asia/Seoul', offline: false, comments: [], addComment: jest.fn(), removeComment: jest.fn(), remove: jest.fn(), reload: jest.fn(), onClose: jest.fn(), onGone: jest.fn(), onSaved: jest.fn() };
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
    expect((save.mock.calls[0] as unknown[]).slice(0, 2)).toEqual([{ title: '저녁 데이트', date: '2026-11-25', time: '19:00', endTime: null, alert: 'none', ownerId: null }, undefined]);
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
    expect(screen.getAllByRole('radio').map((row) => row.props.accessibilityLabel)).toEqual([screen.t('cal.owner.together'), screen.t('cal.by.me'), '도담', screen.t('cal.alert.none'), screen.t('cal.alert.allDay.at'), screen.t('cal.alert.allDay.1d')]);
    await fireEvent.press(screen.getByRole('radio', { name: screen.t('cal.alert.allDay.1d') }));
    await fireEvent.press(saveButton(screen));
    await waitFor(() => expect(save).toHaveBeenCalled());
    expect((save.mock.calls[0] as unknown[]).slice(0, 2)).toEqual([{ title: '저녁 데이트', date: '2026-11-25', time: null, endTime: null, alert: '1d', ownerId: null }, 1]);
  });
  it('V0-F19-AC-03 asks whose plan it is right under the title, starts at 함께, and sends the owner picked', async () => {
    const save = jest.fn(async () => undefined);
    const screen = await renderWithI18n(<EventEdit {...sheetProps} save={save} />);
    expect(screen.getByLabelText(screen.t('cal.owner')).props.accessibilityRole).toBe('radiogroup');
    expect(screen.getAllByRole('radio').map((radio) => [radio.props.accessibilityLabel, radio.props.accessibilityState.selected])).toEqual([[screen.t('cal.owner.together'), true], [screen.t('cal.by.me'), false], ['도담', false]]);
    await fireEvent.changeText(screen.getByLabelText(screen.t('edit.field.title')), '헬스장 등록');
    await fireEvent.press(screen.getByRole('radio', { name: '도담' }));
    expect(screen.getByRole('radio', { name: '도담' }).props.accessibilityState.selected).toBe(true);
    await fireEvent.press(saveButton(screen));
    await waitFor(() => expect(save).toHaveBeenCalled());
    expect((save.mock.calls[0] as unknown[])[0]).toMatchObject({ title: '헬스장 등록', ownerId: PARTNER });
    const unpaired = await renderWithI18n(<EventEdit {...sheetProps} partner={null} partnerId={null} save={jest.fn()} />);
    expect(unpaired.getAllByRole('radio').map((radio) => radio.props.accessibilityLabel)).toEqual([unpaired.t('cal.owner.together'), unpaired.t('cal.by.me')]);
  });
  it('V0-F19-AC-04 changing whose plan it is keeps who added it and counts as an unsaved change', async () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined); const save = jest.fn(async () => undefined);
    const screen = await renderWithI18n(<EventEdit {...sheetProps} initial={eventFixture({ ownerId: PARTNER, createdBy: PARTNER, updatedBy: PARTNER, version: 2 })} save={save} />);
    expect(screen.getByRole('radio', { name: '도담' }).props.accessibilityState.selected).toBe(true);
    await fireEvent.press(screen.getByRole('radio', { name: screen.t('cal.by.me') }));
    expect(screen.getByText(screen.t('cal.detail.added', { name: '도담', date: '11월 20일' }))).toBeTruthy();
    await fireEvent.press(screen.getByText(screen.t('common.cancel')));
    expect(alert.mock.calls[0]![0]).toBe(screen.t('edit.discard.title'));
    await fireEvent.press(saveButton(screen));
    await waitFor(() => expect(save).toHaveBeenCalled());
    expect((save.mock.calls[0] as unknown[]).slice(0, 2)).toEqual([expect.objectContaining({ ownerId: ME }), 2]);
    alert.mockRestore();
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

describe('EventEdit comments', () => {
  const thread = [commentFixture({ id: 'theirs', body: '좋아!', createdBy: PARTNER }), commentFixture({ id: 'mine', body: '7시에 보자', createdBy: ME, createdAt: '2026-11-21T11:30:00Z' })];
  it('V0-F19-AC-08 lists the thread with who wrote each comment and when, and sends a trimmed comment', async () => {
    const addComment = jest.fn(async () => undefined);
    const screen = await renderWithI18n(<EventEdit {...sheetProps} initial={eventFixture({})} comments={thread} addComment={addComment} save={jest.fn()} />);
    expect(screen.getByText(screen.t('cal.comment.title', { n: 2 }))).toBeTruthy();
    expect(screen.getByLabelText(screen.t('cal.comment.a11y', { name: '도담', time: '11월 21일 오후 7:05', body: '좋아!' }))).toBeTruthy();
    expect(screen.getByLabelText(screen.t('cal.comment.a11y', { name: '나리', time: '11월 21일 오후 8:30', body: '7시에 보자' }))).toBeTruthy();
    const send = screen.getByRole('button', { name: screen.t('cal.comment.send') });
    expect(send.props.accessibilityState.disabled).toBe(true);
    await fireEvent.changeText(screen.getByLabelText(screen.t('cal.comment.ph')), 'x'.repeat(201));
    expect(screen.getByText(screen.t('cal.comment.err.long'))).toBeTruthy();
    expect(screen.getByRole('button', { name: screen.t('cal.comment.send') }).props.accessibilityState.disabled).toBe(true);
    await fireEvent.changeText(screen.getByLabelText(screen.t('cal.comment.ph')), '  나도 좋아  ');
    await fireEvent.press(screen.getByRole('button', { name: screen.t('cal.comment.send') }));
    await waitFor(() => expect(screen.getByLabelText(screen.t('cal.comment.ph')).props.value).toBe(''));
    expect((addComment.mock.calls[0] as unknown[])[0]).toBe('나도 좋아');
    await fireEvent.press(screen.getByText(screen.t('common.cancel')));
    expect(sheetProps.onClose).toHaveBeenCalled();
  });
  it('V0-F19-AC-08 shows an empty thread, keeps sending off offline, and only on an existing event', async () => {
    const empty = await renderWithI18n(<EventEdit {...sheetProps} initial={eventFixture({})} save={jest.fn()} />);
    expect(empty.getByText(empty.t('cal.comment.empty'))).toBeTruthy();
    const offline = await renderWithI18n(<EventEdit {...sheetProps} offline initial={eventFixture({})} comments={thread} save={jest.fn()} />);
    await fireEvent.changeText(offline.getByLabelText(offline.t('cal.comment.ph')), '보내줘');
    expect(offline.getByRole('button', { name: offline.t('cal.comment.send') }).props.accessibilityState.disabled).toBe(true);
    expect(offline.getByRole('button', { name: offline.t('cal.comment.delete') }).props.accessibilityState.disabled).toBe(true);
    const created = await renderWithI18n(<EventEdit {...sheetProps} save={jest.fn()} />);
    expect(created.queryByText(created.t('cal.comment.empty'))).toBeNull();
  });
  it('V0-F19-AC-08 keeps the draft and says so when sending fails, and leaves when the event is gone', async () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    const failed = await renderWithI18n(<EventEdit {...sheetProps} initial={eventFixture({})} addComment={jest.fn().mockRejectedValue(new TypeError('network'))} save={jest.fn()} />);
    await fireEvent.changeText(failed.getByLabelText(failed.t('cal.comment.ph')), '좋아');
    await fireEvent.press(failed.getByRole('button', { name: failed.t('cal.comment.send') }));
    await waitFor(() => expect(failed.getByText(failed.t('cal.comment.err'))).toBeTruthy());
    expect(failed.getByLabelText(failed.t('cal.comment.ph')).props.value).toBe('좋아');
    const gone = await renderWithI18n(<EventEdit {...sheetProps} initial={eventFixture({})} addComment={jest.fn().mockRejectedValue(new ApiError(404, 'NOT_FOUND', { gone: true }))} save={jest.fn()} />);
    await fireEvent.changeText(gone.getByLabelText(gone.t('cal.comment.ph')), '좋아');
    await fireEvent.press(gone.getByRole('button', { name: gone.t('cal.comment.send') }));
    await waitFor(() => expect(alert).toHaveBeenCalledWith(gone.t('cal.gone.title'), gone.t('cal.gone.body', { name: '도담' }), [expect.objectContaining({ text: gone.t('common.ok') })]));
    alert.mockRestore();
  });
  it('V0-F19-AC-09 lets me delete only my own comment after a confirm, and treats an already deleted one as done', async () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    const confirm = () => (alert.mock.calls.at(-1)![2] as { style?: string; onPress?: () => void }[]).find((button) => button.style === 'destructive')!.onPress!();
    const removeComment = jest.fn().mockRejectedValueOnce(new ApiError(404, 'NOT_FOUND')).mockRejectedValueOnce(new ApiError(500, 'INTERNAL'));
    const screen = await renderWithI18n(<EventEdit {...sheetProps} initial={eventFixture({})} comments={thread} removeComment={removeComment} save={jest.fn()} />);
    expect(screen.getAllByRole('button', { name: screen.t('cal.comment.delete') })).toHaveLength(1);
    await fireEvent.press(screen.getByRole('button', { name: screen.t('cal.comment.delete') }));
    expect(alert.mock.calls.at(-1)![0]).toBe(screen.t('cal.comment.delete.title'));
    confirm();
    await waitFor(() => expect(removeComment).toHaveBeenCalledTimes(1));
    expect((removeComment.mock.calls[0] as unknown[])[0]).toBe('mine');
    expect(screen.queryByText(screen.t('edit.delete.err'))).toBeNull();
    await fireEvent.press(screen.getByRole('button', { name: screen.t('cal.comment.delete') }));
    confirm();
    await waitFor(() => expect(screen.getByText(screen.t('edit.delete.err'))).toBeTruthy());
    alert.mockRestore();
  });
});
