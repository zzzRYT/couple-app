import { act, renderHook } from '@testing-library/react-native';
import type { i18n } from 'i18next';
import type { ReactNode } from 'react';
import { AppState } from 'react-native';
import { I18nextProvider } from 'react-i18next';
import { clearDeviceAfterDeletion } from '../../account/deleteAccount';
import { leaveSpace } from '../../lifecycle/leave';
import { useNotificationSync } from '../../notifications/useNotificationSync';
import { logout } from '../../settings/logout';
import { PARTNER, snapshotFixture } from '../../../test/fixtures';
import { i18nFor } from '../../../test/render';
import type { WidgetData, WidgetSnapshot } from '../snapshot';
import { clearWidgets, installWidgets, syncWidgets, widgetGeneration, type WidgetPort } from '../writer';

jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn(async () => ({ granted: false, status: 'denied' })),
  getAllScheduledNotificationsAsync: jest.fn(async () => []),
  cancelScheduledNotificationAsync: jest.fn(),
  cancelAllScheduledNotificationsAsync: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
}));
jest.mock('expo-file-system/legacy', () => ({
  documentDirectory: 'file://documents/',
  readAsStringAsync: jest.fn(async () => { throw new Error('missing'); }),
  writeAsStringAsync: jest.fn(),
  deleteAsync: jest.fn(),
}));
jest.mock('expo-secure-store', () => ({ getItemAsync: jest.fn(async () => null), setItemAsync: jest.fn(), deleteItemAsync: jest.fn() }));

const NOW = '2026-11-05T00:00:00.000Z';
const mockApp = { userId: snapshotFixture().me.userId as string | null, sessionLoaded: true };
const mockSpace = { entry: 'active', ended: null as { kind: 'ended' | 'disconnect'; by: 'me' | 'partner'; at: string } | null, spaceId: 'space-1' as string | null, state: { snapshot: snapshotFixture() as ReturnType<typeof snapshotFixture> | null } };
jest.mock('../../../lib/AppContext', () => ({ useApp: () => mockApp }));
jest.mock('../../space/SpaceContext', () => ({ useSpace: () => mockSpace }));

const calls: string[] = [];
const written: WidgetSnapshot[] = [];
const port: { [Key in keyof WidgetPort]: jest.MockedFunction<WidgetPort[Key]> } = {
  write: jest.fn(async (json: string) => { calls.push('write'); written.push(JSON.parse(json) as WidgetSnapshot); }),
  reload: jest.fn(async () => { calls.push('reload'); }),
};
const last = () => written.at(-1)!;
const normal = (overrides: Partial<Extract<WidgetData, { dates: unknown }>> = {}): WidgetData => ({
  state: 'normal', spaceId: 'space-1', names: { me: '하루', partner: '도담' },
  dates: { startDate: '2025-06-29', timeZone: 'Asia/Seoul', me: { birthday: null }, partner: { birthday: null, displayName: '도담' }, customs: [] }, ...overrides,
});
const invalid = normal({ dates: { startDate: 'not-a-date', timeZone: 'Asia/Seoul', me: { birthday: null }, partner: null, customs: [] } });
let translator: i18n;
beforeEach(async () => {
  calls.length = 0; written.length = 0;
  jest.clearAllMocks();
  translator = await i18nFor();
  installWidgets({ port, translator });
});
afterEach(() => { installWidgets(null); });

describe('writer', () => {
  it('V0-F11-AC-09 writes the whole snapshot, then reloads the timelines', async () => {
    await syncWidgets(normal(), widgetGeneration());
    expect(calls).toEqual(['write', 'reload']);
    expect(last()).toMatchObject({ schemaVersion: 1, state: 'normal', spaceId: 'space-1', locale: 'ko-KR' });
  });
  it('does not compute or touch anything on a build without the extension', async () => {
    installWidgets(null);
    await expect(syncWidgets(invalid, widgetGeneration())).resolves.toBeUndefined();
    await expect(clearWidgets('none')).resolves.toBeUndefined();
    expect(calls).toEqual([]);
  });
  it('does not reload after a failed write, and the next write still runs', async () => {
    port.write.mockRejectedValueOnce(new Error('disk'));
    await expect(syncWidgets(normal(), widgetGeneration())).rejects.toThrow('disk');
    expect(port.reload).not.toHaveBeenCalled();
    await syncWidgets(normal(), widgetGeneration());
    expect(calls).toEqual(['write', 'reload']);
  });
  it('survives data the engine rejects', async () => {
    await expect(syncWidgets(invalid, widgetGeneration())).rejects.toThrow();
    expect(calls).toEqual([]);
  });
  it('V0-F11-AC-06 a clear lands after a write already running', async () => {
    const running = syncWidgets(normal(), widgetGeneration());
    await clearWidgets('none');
    await running;
    expect(written.map((snapshot) => snapshot.state)).toEqual(['none']);
  });
  it('V0-F11-AC-06 drops a sync read before the clear, so the old space cannot come back', async () => {
    const opened = widgetGeneration();
    await clearWidgets('ended');
    await syncWidgets(normal(), opened);
    expect(written.map((snapshot) => snapshot.state)).toEqual(['ended']);
  });
  it.each(['none', 'ended'] as const)('V0-F11-AC-06 %s writes nothing of the space', async (state) => {
    await clearWidgets(state);
    expect(calls).toEqual(['write', 'reload']);
    expect(last()).toMatchObject({ state, locale: 'ko-KR' });
    expect(last()).not.toHaveProperty('spaceId');
    expect(last()).not.toHaveProperty('names');
    expect(last().entries).toHaveLength(1);
  });
});

describe('V0-F12-AC-07 V0-F12-AC-08 V0-F12-AC-10 V0-F13-AC-05 leaving', () => {
  it('V0-F12-AC-10 logout leaves the no-space state', async () => {
    await logout({ auth: { signOut: jest.fn() }, releaseSession: jest.fn(), clearPendingInvite: jest.fn(async () => undefined), resetSpace: jest.fn(), snapshot: snapshotFixture(), userId: 'me' });
    expect(last().state).toBe('none');
  });
  it('V0-F12-AC-07 disconnect and end leave the no-space state before the space is reset', async () => {
    const resetSpace = jest.fn(() => { calls.push('reset'); });
    await leaveSpace({ close: jest.fn(async () => undefined), releaseSession: jest.fn(), snapshot: snapshotFixture(), userId: 'me', resetSpace, reload: jest.fn(async () => undefined) });
    expect(last().state).toBe('none');
    expect(calls).toEqual(['write', 'reload', 'reset']);
  });
  it('keeps the widget when leaving fails', async () => {
    await expect(leaveSpace({ close: jest.fn().mockRejectedValue(new Error('offline')), releaseSession: jest.fn(), snapshot: snapshotFixture(), userId: 'me', resetSpace: jest.fn(), reload: jest.fn() })).rejects.toThrow();
    expect(calls).toEqual([]);
  });
  it('V0-F12-AC-08 account deletion leaves the no-space state', async () => {
    await clearDeviceAfterDeletion('signedOut', { signOut: jest.fn(async () => undefined), cancelNotifications: jest.fn(async () => undefined), clearWidgets: () => clearWidgets('none'), clearPendingInvite: jest.fn(async () => undefined), resetSpace: jest.fn() });
    expect(last().state).toBe('none');
  });
  it('a failing native write does not stop logout', async () => {
    port.write.mockRejectedValueOnce(new Error('disk'));
    const resetSpace = jest.fn();
    await logout({ auth: { signOut: jest.fn() }, releaseSession: jest.fn(), clearPendingInvite: jest.fn(async () => undefined), resetSpace, snapshot: snapshotFixture(), userId: 'me' });
    expect(resetSpace).toHaveBeenCalled();
  });
});

describe('V0-F11-AC-09 data changed', () => {
  const mount = async () => {
    const wrapper = ({ children }: { children: ReactNode }) => <I18nextProvider i18n={translator}>{children}</I18nextProvider>;
    return renderHook(() => useNotificationSync(), { wrapper });
  };
  const settled = async () => { await act(async () => { await jest.advanceTimersByTimeAsync(500); }); };
  const change = async (screen: Awaited<ReturnType<typeof mount>>, edit: (snapshot: ReturnType<typeof snapshotFixture>) => void) => {
    const snapshot = snapshotFixture();
    edit(snapshot);
    mockSpace.state = { snapshot };
    await screen.rerender({});
    await settled();
  };
  beforeEach(() => {
    mockApp.userId = snapshotFixture().me.userId; mockApp.sessionLoaded = true;
    mockSpace.entry = 'active'; mockSpace.ended = null; mockSpace.spaceId = 'space-1'; mockSpace.state = { snapshot: snapshotFixture() };
    jest.useFakeTimers({ now: new Date(NOW), doNotFake: ['setImmediate', 'nextTick', 'queueMicrotask'] });
  });
  afterEach(() => { jest.useRealTimers(); });

  it('writes the first snapshot once, 500 ms after the last change', async () => {
    const screen = await mount();
    await act(async () => { await jest.advanceTimersByTimeAsync(499); });
    expect(written).toHaveLength(0);
    await settled();
    expect(written).toHaveLength(1);
    expect(last()).toMatchObject({ state: 'normal', names: { me: '하루', partner: '도담' }, timeZone: 'Asia/Seoul', startDate: '2025-06-29' });
    await screen.unmount();
  });
  it('collapses a burst of changes into one write', async () => {
    const screen = await mount();
    await act(async () => { await jest.advanceTimersByTimeAsync(300); });
    const zone = snapshotFixture(); zone.space.timeZone = 'America/New_York'; mockSpace.state = { snapshot: zone };
    await screen.rerender({});
    await act(async () => { await jest.advanceTimersByTimeAsync(300); });
    expect(written).toHaveLength(0);
    await settled();
    expect(written).toHaveLength(1);
    expect(last().timeZone).toBe('America/New_York');
    await screen.unmount();
  });
  it.each<[string, (snapshot: ReturnType<typeof snapshotFixture>) => void, (written: WidgetSnapshot) => unknown, unknown]>([
    ['the start date', (snapshot) => { snapshot.space.anniversaryDate = '2025-07-01'; }, (result) => result.startDate, '2025-07-01'],
    ['the time zone', (snapshot) => { snapshot.space.timeZone = 'America/New_York'; }, (result) => result.timeZone, 'America/New_York'],
    ['my name', (snapshot) => { snapshot.me.displayName = '새이름'; }, (result) => result.names?.me, '새이름'],
    ['a partner joining or leaving', (snapshot) => { snapshot.space.memberCount = 1; snapshot.members = snapshot.members.slice(0, 1); }, (result) => [result.state, result.names?.partner], ['pending', null]],
    ['a custom anniversary', (snapshot) => { snapshot.anniversaries = [{ id: 'c1', title: '여행', date: '2026-11-20', repeat: 'once' }] as typeof snapshot.anniversaries; }, (result) => result.entries[0]!.next!.some((item) => item.key === 'custom:c1'), true],
  ])('rewrites on %s', async (_, edit, read, expected) => {
    const screen = await mount();
    await settled();
    await change(screen, edit);
    expect(written).toHaveLength(2);
    expect(read(last())).toEqual(expected);
    expect(port.reload).toHaveBeenCalledTimes(2);
    await screen.unmount();
  });
  it('rewrites when the app comes back to the foreground', async () => {
    const spy = jest.spyOn(AppState, 'addEventListener');
    const screen = await mount();
    await settled();
    await act(async () => { spy.mock.calls.at(-1)![1]('active'); });
    await settled();
    expect(written).toHaveLength(2);
    await screen.unmount();
  });
  it('V0-EC-11 rewrites in the new language', async () => {
    const screen = await mount();
    await settled();
    await act(async () => { await translator.changeLanguage('en-US'); });
    await settled();
    expect(last()).toMatchObject({ locale: 'en-US' });
    expect(last().strings['widget.next']).toBe('Next');
    await act(async () => { await translator.changeLanguage('ko-KR'); });
    await screen.unmount();
  });
  it('V0-F13-AC-05 turns ended when the partner ends the space while open', async () => {
    const screen = await mount();
    await settled();
    mockSpace.entry = 'ended'; mockSpace.ended = { kind: 'disconnect', by: 'partner', at: NOW };
    await screen.rerender({});
    await settled();
    expect(last().state).toBe('ended');
    expect(last()).not.toHaveProperty('spaceId');
    await screen.unmount();
  });
  it.each(['disconnect', 'ended'] as const)('V0-F11-AC-06 shows no space at once to the one who chose %s, before the notice is acknowledged', async (kind) => {
    mockSpace.entry = 'ended'; mockSpace.ended = { kind, by: 'me', at: NOW }; mockSpace.spaceId = null; mockSpace.state = { snapshot: null };
    const screen = await mount();
    await settled();
    expect(written.map((snapshot) => snapshot.state)).toEqual(['none']);
    await screen.unmount();
  });
  it('V0-F11-AC-06 turns none once the ended notice is acknowledged', async () => {
    mockSpace.entry = 'none'; mockSpace.spaceId = null; mockSpace.state = { snapshot: null };
    const screen = await mount();
    await settled();
    expect(last().state).toBe('none');
    await screen.unmount();
  });
  it('V0-F11-AC-06 turns none when the session is gone', async () => {
    mockApp.userId = null;
    const screen = await mount();
    await settled();
    expect(last().state).toBe('none');
    await screen.unmount();
  });
  it.each<[string, () => void]>([
    ['the session is still loading', () => { mockApp.userId = null; mockApp.sessionLoaded = false; }],
    ['the entry is loading', () => { mockSpace.entry = 'loading'; mockSpace.state = { snapshot: null }; }],
    ['V0-EC-03 the first load failed offline', () => { mockSpace.entry = 'offlineEmpty'; mockSpace.state = { snapshot: null }; }],
    ['the snapshot belongs to another space', () => { mockSpace.spaceId = 'space-2'; }],
  ])('keeps what the widget shows while %s', async (_, arrange) => {
    arrange();
    const screen = await mount();
    await settled();
    expect(written).toHaveLength(0);
    await screen.unmount();
  });
  it('V0-F11-AC-07 V0-NF-04 keeps private snapshot fields out of the shared JSON', async () => {
    const snapshot = snapshotFixture();
    snapshot.anniversaries = [{ id: 'c1', title: '여행', date: '2026-11-20', repeat: 'once', memo: 'secret-memo' }] as typeof snapshot.anniversaries;
    snapshot.me.birthday = { year: 1994, month: 3, day: 14 };
    snapshot.members[1]!.birthday = { month: 8, day: 2 };
    mockSpace.state = { snapshot };
    const screen = await mount();
    await settled();
    const json = JSON.stringify(last());
    for (const value of ['secret-memo', '1994', snapshot.me.userId, PARTNER]) expect(json).not.toContain(value);
    expect(last().entries[0]!.next!.find((item) => item.key === 'custom:c1')).toMatchObject({ privacySensitive: true });
    await screen.unmount();
  });
  it('a write waiting on the debounce dies with a logout', async () => {
    const screen = await mount();
    await act(async () => { await clearWidgets('none'); });
    await settled();
    expect(written.map((snapshot) => snapshot.state)).toEqual(['none']);
    await screen.unmount();
  });
  it('never fails the app when the native write fails', async () => {
    port.write.mockRejectedValueOnce(new Error('disk'));
    const screen = await mount();
    await settled();
    expect(port.write).toHaveBeenCalledTimes(1);
    expect(port.reload).not.toHaveBeenCalled();
    await screen.unmount();
  });
});
