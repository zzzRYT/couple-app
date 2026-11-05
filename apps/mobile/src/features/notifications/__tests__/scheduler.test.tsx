import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { AppState } from 'react-native';
import { I18nextProvider } from 'react-i18next';
import * as Notifications from 'expo-notifications';
import { snapshotFixture } from '../../../test/fixtures';
import { i18nFor, renderWithI18n } from '../../../test/render';
import { leaveSpace } from '../../lifecycle/leave';
import { logout } from '../../settings/logout';
import EndedRoute from '../../../app/ended';
import { planNotifications, type PlannedNotification } from '../plan';
import { DEFAULT_NOTIFY_PREFS, readNotifyPrefs, updateNotifyPrefs } from '../preferences';
import { cancelAllNotifications, cancelV0Notifications, resyncNotifications, syncNotifications } from '../scheduler';
import { useNotificationSync } from '../useNotificationSync';

type Stored = { identifier: string; content: { title: string; body: string; data: Record<string, unknown> } };
let mockSchedule: Stored[] = [];
let mockPermission = { granted: true, status: 'granted' };
jest.mock('expo-notifications', () => ({
  SchedulableTriggerInputTypes: { DATE: 'date' },
  getPermissionsAsync: jest.fn(async () => mockPermission),
  getAllScheduledNotificationsAsync: jest.fn(async () => mockSchedule),
  cancelScheduledNotificationAsync: jest.fn(async (id: string) => { mockSchedule = mockSchedule.filter((item) => item.identifier !== id); }),
  cancelAllScheduledNotificationsAsync: jest.fn(async () => { mockSchedule = []; }),
  scheduleNotificationAsync: jest.fn(async (request: Stored) => { mockSchedule = [...mockSchedule, request]; return request.identifier; }),
}));
let mockFile: string | null = null;
jest.mock('expo-file-system/legacy', () => ({
  documentDirectory: 'file://documents/',
  readAsStringAsync: jest.fn(async () => { if (mockFile === null) throw new Error('missing'); return mockFile; }),
  writeAsStringAsync: jest.fn(async (_: string, value: string) => { mockFile = value; }),
  deleteAsync: jest.fn(async () => { mockFile = null; }),
}));
jest.mock('expo-secure-store', () => ({ getItemAsync: jest.fn(async () => null), setItemAsync: jest.fn(), deleteItemAsync: jest.fn() }));

const mocked = Notifications as jest.Mocked<typeof Notifications>;
const item = (id: string, fireAt = '2030-01-01T00:00:00.000Z', body = 'hello'): PlannedNotification => ({ id, fireAt, title: 'Mopiru', body, data: { v0: true, key: id } });
const stored = ({ id, fireAt, title, body }: PlannedNotification): Stored => ({ identifier: id, content: { title, body, data: { fireAt } } });
const ids = () => mockSchedule.map((entry) => entry.identifier).sort();
beforeEach(() => { mockSchedule = []; mockFile = null; mockPermission = { granted: true, status: 'granted' }; jest.clearAllMocks(); });

describe('syncNotifications', () => {
  it('V0-F10-AC-06 only cancels and adds the difference', async () => {
    const kept = item('v0:a'), moved = item('v0:b'), gone = item('v0:c');
    mockSchedule = [stored(kept), stored(moved), stored(gone)];
    await syncNotifications([kept, { ...moved, fireAt: '2030-02-01T00:00:00.000Z' }, item('v0:d')]);
    expect(ids()).toEqual(['v0:a', 'v0:b', 'v0:d']);
    expect(mocked.cancelScheduledNotificationAsync.mock.calls.map(([id]) => id).sort()).toEqual(['v0:b', 'v0:c']);
    expect(mocked.scheduleNotificationAsync.mock.calls.map(([request]) => request.identifier).sort()).toEqual(['v0:b', 'v0:d']);
  });
  it('schedules a one-shot date trigger with the fire time in the data', async () => {
    const planned = item('v0:a');
    await syncNotifications([planned]);
    expect(mocked.scheduleNotificationAsync).toHaveBeenCalledWith({
      identifier: 'v0:a', content: { title: 'Mopiru', body: 'hello', data: { v0: true, key: 'v0:a', fireAt: planned.fireAt }, sound: 'default' },
      trigger: { type: 'date', date: new Date(planned.fireAt) },
    });
  });
  it('V0-EC-11 rewrites the text when only the copy changed', async () => {
    const planned = item('v0:a');
    mockSchedule = [stored(planned)];
    await syncNotifications([{ ...planned, body: 'bonjour' }]);
    expect(mockSchedule).toHaveLength(1);
    expect(mockSchedule[0]!.content.body).toBe('bonjour');
  });
  it('never touches identifiers outside v0', async () => {
    const other = { identifier: 'other', content: { title: '', body: '', data: {} } };
    mockSchedule = [other, stored(item('v0:a'))];
    await syncNotifications([]);
    expect(mockSchedule).toEqual([other]);
    mockSchedule = [other, stored(item('v0:a'))];
    await cancelV0Notifications();
    expect(mockSchedule).toEqual([other]);
    await cancelAllNotifications();
    expect(mockSchedule).toEqual([]);
  });
  it('runs a cancel after a sync already in progress, so nothing survives it', async () => {
    const running = syncNotifications([item('v0:a'), item('v0:b')]);
    await cancelV0Notifications();
    await running;
    expect(mockSchedule).toEqual([]);
  });
  it('keeps going after a failed sync', async () => {
    mocked.getAllScheduledNotificationsAsync.mockRejectedValueOnce(new Error('native'));
    await expect(syncNotifications([item('v0:a')])).rejects.toThrow('native');
    await syncNotifications([item('v0:a')]);
    expect(ids()).toEqual(['v0:a']);
  });
});

const input = { startDate: '2025-06-29', timeZone: 'Asia/Seoul', me: { birthday: null }, partner: null, customs: [] };
const NOW = '2026-11-05T00:00:00.000Z';
describe('resyncNotifications', () => {
  const t = async () => { const i18n = await i18nFor(); return (key: string, vars?: Record<string, unknown>) => i18n.t(key, vars); };
  it('V0-F10-AC-02 schedules the plan when on and allowed', async () => {
    await updateNotifyPrefs('me', { enabled: true });
    await resyncNotifications('me', input, await t(), NOW);
    expect(ids()).toEqual(planNotifications(input, { ...DEFAULT_NOTIFY_PREFS, enabled: true }, await t(), NOW).map((entry) => entry.id).sort());
  });
  it('V0-F10-AC-05 schedules nothing while the device denies permission', async () => {
    await updateNotifyPrefs('me', { enabled: true });
    mockPermission = { granted: false, status: 'denied' };
    await resyncNotifications('me', input, await t(), NOW);
    expect(mockSchedule).toEqual([]);
  });
  it('cancels everything when the master switch is off', async () => {
    mockSchedule = [stored(item('v0:a'))];
    await updateNotifyPrefs('me', { enabled: false });
    await resyncNotifications('me', input, await t(), NOW);
    expect(mockSchedule).toEqual([]);
  });
});

const mockApp = { userId: snapshotFixture().me.userId as string | null };
const mockSpace = { entry: 'active', spaceId: 'space-1' as string | null, state: { snapshot: snapshotFixture() as ReturnType<typeof snapshotFixture> | null } };
jest.mock('../../../lib/AppContext', () => ({ useApp: () => ({ ...mockApp, client: { ackEnded: jest.fn() } }) }));
jest.mock('../../space/SpaceContext', () => ({ useSpace: () => ({ ...mockSpace, ended: { kind: 'ended', by: 'partner', at: 'now' }, reload: jest.fn() }) }));
describe('useNotificationSync', () => {
  const mount = async () => {
    const i18n = await i18nFor();
    const wrapper = ({ children }: { children: ReactNode }) => <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
    return { i18n, ...(await renderHook(() => useNotificationSync(), { wrapper })) };
  };
  const settled = async () => { await act(async () => { await jest.advanceTimersByTimeAsync(500); }); };
  beforeEach(async () => {
    mockApp.userId = snapshotFixture().me.userId; mockSpace.entry = 'active'; mockSpace.spaceId = 'space-1'; mockSpace.state = { snapshot: snapshotFixture() };
    await updateNotifyPrefs(mockApp.userId, { enabled: true });
    jest.clearAllMocks();
    jest.useFakeTimers({ now: new Date(NOW), doNotFake: ['setImmediate', 'nextTick', 'queueMicrotask'] });
  });
  afterEach(() => { jest.useRealTimers(); });
  const scheduledCalls = () => mocked.getAllScheduledNotificationsAsync.mock.calls.length;
  it('V0-F10-AC-06 waits 500 ms and collapses bursts into one sync', async () => {
    const screen = await mount();
    await act(async () => { await jest.advanceTimersByTimeAsync(499); });
    expect(scheduledCalls()).toBe(0);
    await settled();
    expect(scheduledCalls()).toBe(1);
    expect(mockSchedule.length).toBeGreaterThan(0);
    await screen.unmount();
  });
  it('V0-F10-AC-06 resyncs on date, time zone, preference and foreground changes', async () => {
    const spy = jest.spyOn(AppState, 'addEventListener');
    const screen = await mount();
    await settled();
    const before = scheduledCalls();
    const zone = snapshotFixture(); zone.space.timeZone = 'America/New_York'; mockSpace.state = { snapshot: zone };
    await screen.rerender({});
    await settled();
    expect(scheduledCalls()).toBe(before + 1);
    await act(async () => { await updateNotifyPrefs(mockApp.userId!, { early: '3d' }); });
    await settled();
    expect(scheduledCalls()).toBe(before + 2);
    await act(async () => { spy.mock.calls.at(-1)![1]('active'); });
    await settled();
    expect(scheduledCalls()).toBe(before + 3);
    await screen.unmount();
  });
  it('V0-EC-11 rewrites reminders in the new language', async () => {
    const screen = await mount();
    await settled();
    await act(async () => { await screen.i18n.changeLanguage('en-US'); });
    await settled();
    expect(mockSchedule.some((entry) => entry.content.body.startsWith('Today is') || entry.content.body.includes('days until'))).toBe(true);
    await act(async () => { await screen.i18n.changeLanguage('ko-KR'); });
    await screen.unmount();
  });
  it('does not resync without an active space, and a pending sync dies with it', async () => {
    const screen = await mount();
    mockSpace.entry = 'ended';
    await screen.rerender({});
    await settled();
    expect(scheduledCalls()).toBe(0);
    await screen.unmount();
  });
});

describe('V0-F10-AC-07 cancelling', () => {
  const planned = () => { mockSchedule = [stored(item('v0:a'))]; };
  it('on logout', async () => {
    planned();
    await logout({ auth: { signOut: jest.fn() }, releaseSession: jest.fn(), clearPendingInvite: jest.fn(async () => undefined), resetSpace: jest.fn(), snapshot: snapshotFixture(), userId: 'me' });
    expect(mockSchedule).toEqual([]);
  });
  it('on disconnect and end', async () => {
    planned();
    await leaveSpace({ close: jest.fn(async () => undefined), releaseSession: jest.fn(), snapshot: snapshotFixture(), userId: 'me', resetSpace: jest.fn(), reload: jest.fn(async () => undefined) });
    expect(mockSchedule).toEqual([]);
  });
  it('when the partner ended the space, and clears the preferences with it', async () => {
    planned();
    await updateNotifyPrefs(mockApp.userId!, { enabled: true });
    await renderWithI18n(<EndedRoute />);
    await waitFor(() => { expect(mockSchedule).toEqual([]); });
    expect(await readNotifyPrefs(mockApp.userId!)).toEqual(DEFAULT_NOTIFY_PREFS);
  });
});
