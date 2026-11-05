import { act, fireEvent, waitFor } from '@testing-library/react-native';
import { AppState, Linking } from 'react-native';
import * as Notifications from 'expo-notifications';
import { renderWithI18n } from '../../../test/render';
import { snapshotFixture } from '../../../test/fixtures';
import { formatNotifyTime, notifyDefaultLabel } from '../../notifications/labels';
import { DEFAULT_NOTIFY_PREFS, readNotifyPrefs, updateNotifyPrefs } from '../../notifications/preferences';
import { NotificationSettingsScreen } from '../NotificationSettingsScreen';
import { V0SettingsScreen } from '../V0SettingsScreen';

let mockPermission = { granted: true, status: 'granted' };
let mockSchedule: { identifier: string }[] = [];
jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn(async () => mockPermission),
  requestPermissionsAsync: jest.fn(async () => mockPermission),
  getAllScheduledNotificationsAsync: jest.fn(async () => mockSchedule),
  cancelScheduledNotificationAsync: jest.fn(async (id: string) => { mockSchedule = mockSchedule.filter((item) => item.identifier !== id); }),
}));
let mockFile: string | null = null;
jest.mock('expo-file-system/legacy', () => ({
  documentDirectory: 'file://documents/',
  readAsStringAsync: jest.fn(async () => { if (mockFile === null) throw new Error('missing'); return mockFile; }),
  writeAsStringAsync: jest.fn(async (_: string, value: string) => { mockFile = value; }),
  deleteAsync: jest.fn(async () => { mockFile = null; }),
}));
const requestPermission = Notifications.requestPermissionsAsync as jest.Mock;
const USER = 'me';
const on = () => updateNotifyPrefs(USER, { enabled: true });
const open = async () => {
  const screen = await renderWithI18n(<NotificationSettingsScreen userId={USER} partner="하루" onBack={jest.fn()} />);
  await act(async () => { await Promise.resolve(); });
  return screen;
};
beforeEach(() => { mockFile = null; mockSchedule = []; mockPermission = { granted: true, status: 'granted' }; requestPermission.mockClear(); });

describe('V0-set-main 알림 section', () => {
  const main = async () => {
    const navigate = jest.fn();
    const screen = await renderWithI18n(<V0SettingsScreen snapshot={snapshotFixture()} offline={false} version="0.1" onLogout={jest.fn()} onZone={jest.fn()} navigate={navigate} />);
    await act(async () => { await Promise.resolve(); });
    return { screen, navigate };
  };
  it('V0-F12-AC-01 shows the switch, time and early rows, and row taps open V0-set-notify', async () => {
    const { screen, navigate } = await main();
    expect(screen.getByText(screen.t('set.section.notify'))).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: `${screen.t('set.notify.time')}, ${formatNotifyTime('09:00', 'ko-KR')}` }));
    await fireEvent.press(screen.getByRole('button', { name: `${screen.t('set.notify.early')}, ${screen.t('set.notify.early.1d')}` }));
    await fireEvent.press(screen.getByRole('button', { name: screen.t('set.notify.toggle') }));
    expect(navigate.mock.calls).toEqual([['notifications'], ['notifications'], ['notifications']]);
  });
  it('V0-F10-AC-01 turns on from the inline switch through the permission request', async () => {
    mockPermission = { granted: false, status: 'undetermined' };
    const { screen } = await main();
    requestPermission.mockImplementationOnce(async () => { mockPermission = { granted: true, status: 'granted' }; return mockPermission; });
    await act(async () => { fireEvent.press(screen.getByRole('switch', { name: screen.t('set.notify.toggle') })); });
    await waitFor(async () => { expect((await readNotifyPrefs(USER)).enabled).toBe(true); });
  });
  it('reflects saved values', async () => {
    await updateNotifyPrefs(USER, { time: '20:30', early: '7d' });
    const { screen } = await main();
    await waitFor(() => { expect(screen.getByText(formatNotifyTime('20:30', 'ko-KR'))).toBeTruthy(); });
    expect(screen.getByText(screen.t('set.notify.early.7d'))).toBeTruthy();
  });
});

describe('V0-set-notify', () => {
  it('V0-F10-AC-04 lists the early choices, four kinds and the note with the partner name', async () => {
    await on();
    const screen = await open();
    for (const key of ['none', '1d', '3d', '7d']) expect(screen.getByRole('radio', { name: screen.t(`set.notify.early.${key}`) })).toBeTruthy();
    expect(screen.getByRole('radio', { name: screen.t('set.notify.early.1d') }).props.accessibilityState.selected).toBe(true);
    for (const kind of ['milestone', 'birthday', 'season', 'custom']) expect(screen.getByRole('switch', { name: screen.t(`anniv.kind.${kind}`) })).toBeTruthy();
    expect(screen.getByText(screen.t('set.notify.note', { name: '하루' }))).toBeTruthy();
  });
  it('V0-F10-AC-04 saves the radio and kind choices on this device', async () => {
    await on();
    const screen = await open();
    await fireEvent.press(screen.getByRole('radio', { name: screen.t('set.notify.early.3d') }));
    await waitFor(async () => { expect((await readNotifyPrefs(USER)).early).toBe('3d'); });
    await waitFor(() => { expect(screen.getByRole('radio', { name: screen.t('set.notify.early.3d') }).props.accessibilityState.selected).toBe(true); });
    await fireEvent.press(screen.getByRole('switch', { name: screen.t('anniv.kind.season') }));
    await waitFor(async () => { expect((await readNotifyPrefs(USER)).kinds).toEqual({ ...DEFAULT_NOTIFY_PREFS.kinds, season: false }); });
  });
  it('picks a time on the wheel in one-minute steps', async () => {
    await on();
    const screen = await open();
    await fireEvent.press(screen.getByRole('button', { name: `${screen.t('set.notify.time')}, ${formatNotifyTime('09:00', 'ko-KR')}` }));
    await fireEvent.press(screen.getByTestId('wheel-hour-20'));
    await fireEvent.press(screen.getByTestId('wheel-minute-37'));
    await fireEvent.press(screen.getByRole('button', { name: screen.t('common.done') }));
    await waitFor(async () => { expect((await readNotifyPrefs(USER)).time).toBe('20:37'); });
  });
  it('master off keeps the groups visible but disabled, and cancels every v0 reminder', async () => {
    await on();
    mockSchedule = [{ identifier: 'v0:a' }, { identifier: 'other' }];
    const screen = await open();
    await fireEvent.press(screen.getByRole('switch', { name: screen.t('set.notify.toggle') }));
    await waitFor(() => { expect(screen.getByRole('radio', { name: screen.t('set.notify.early.1d') }).props.accessibilityState.disabled).toBe(true); });
    expect(screen.getByRole('switch', { name: screen.t('anniv.kind.season') }).props.accessibilityState.disabled).toBe(true);
    await waitFor(() => { expect(mockSchedule).toEqual([{ identifier: 'other' }]); });
    expect((await readNotifyPrefs(USER)).enabled).toBe(false);
  });
  it('stays off when the permission request is refused', async () => {
    mockPermission = { granted: false, status: 'undetermined' };
    const screen = await open();
    requestPermission.mockImplementationOnce(async () => { mockPermission = { granted: false, status: 'denied' }; return mockPermission; });
    await act(async () => { fireEvent.press(screen.getByRole('switch', { name: screen.t('set.notify.toggle') })); });
    await waitFor(() => { expect(screen.getByText(screen.t('set.notify.denied.title'))).toBeTruthy(); });
    expect((await readNotifyPrefs(USER)).enabled).toBe(false);
  });
});

describe('V0-set-notify-denied', () => {
  const denied = async () => { mockPermission = { granted: false, status: 'denied' }; await on(); return open(); };
  it('V0-F10-AC-05 shows the banner, hides the early group and disables the switches', async () => {
    const screen = await denied();
    await waitFor(() => { expect(screen.getByText(screen.t('set.notify.denied.title'))).toBeTruthy(); });
    expect(screen.getByText(screen.t('set.notify.denied.body'))).toBeTruthy();
    expect(screen.queryByRole('radio', { name: screen.t('set.notify.early.1d') })).toBeNull();
    for (const name of ['set.notify.toggle', 'anniv.kind.milestone', 'anniv.kind.custom']) {
      expect(screen.getByRole('switch', { name: screen.t(name) }).props.accessibilityState).toEqual({ checked: false, disabled: true });
    }
    expect(screen.getByText(screen.t('set.notify.note', { name: '하루' }))).toBeTruthy();
  });
  it('V0-F10-AC-05 opens the device settings', async () => {
    const openSettings = jest.spyOn(Linking, 'openSettings').mockResolvedValue();
    const screen = await denied();
    await waitFor(() => { expect(screen.getByText(screen.t('set.notify.denied.cta'))).toBeTruthy(); });
    await fireEvent.press(screen.getByRole('button', { name: screen.t('set.notify.denied.cta') }));
    expect(openSettings).toHaveBeenCalled();
  });
  it('re-checks permission when the app returns to the foreground', async () => {
    const spy = jest.spyOn(AppState, 'addEventListener');
    const screen = await denied();
    await waitFor(() => { expect(screen.getByText(screen.t('set.notify.denied.title'))).toBeTruthy(); });
    mockPermission = { granted: true, status: 'granted' };
    await act(async () => { spy.mock.calls.at(-1)![1]('active'); });
    await waitFor(() => { expect(screen.queryByText(screen.t('set.notify.denied.title'))).toBeNull(); });
    expect(screen.getByRole('radio', { name: screen.t('set.notify.early.1d') })).toBeTruthy();
  });
});

describe('labels', () => {
  it.each([['ko-KR', '오전 9:00'], ['en-US', '9:00 AM'], ['ja-JP', '午前9:00']])('formats the wall time for %s as the board draws it', (locale, expected) => {
    expect(formatNotifyTime('09:00', locale)).toBe(expected);
  });
  it('reads a wall time the same in any device zone', () => {
    expect(formatNotifyTime('23:59', 'en-US')).toBe('11:59 PM');
  });
  it('V0-F10-AC-04 fills the per-anniversary default from the current settings', async () => {
    const screen = await renderWithI18n(<></>);
    expect(notifyDefaultLabel({ time: '09:00', early: '1d' }, 'ko-KR', screen.t)).toBe('기본 설정 (오전 9:00 · 하루 전)');
    expect(notifyDefaultLabel({ time: '20:30', early: 'none' }, 'ko-KR', screen.t)).toBe('기본 설정 (오후 8:30 · 없음)');
  });
});
