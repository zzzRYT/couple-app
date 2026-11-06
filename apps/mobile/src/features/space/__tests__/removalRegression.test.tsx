import { act, renderHook, waitFor } from '@testing-library/react-native';
import * as Notifications from 'expo-notifications';
import type { i18n } from 'i18next';
import type { ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import EndedRoute from '../../../app/ended';
import DeleteAccountRoute from '../../../app/settings/delete-account';
import { ME, snapshotFixture } from '../../../test/fixtures';
import { i18nFor, renderWithI18n } from '../../../test/render';
import { leaveSpace } from '../../lifecycle/leave';
import { useNotificationSync } from '../../notifications/useNotificationSync';
import { logout } from '../../settings/logout';
import type { WidgetSnapshot } from '../../widgets/snapshot';
import { installWidgets, type WidgetPort } from '../../widgets/writer';
import { updateNotifyPrefs } from '../../notifications/preferences';
import { saveV0Invite } from '../v0LocalData';
import { writeV0Cache } from '../v0Cache';

// What a person can still find on the device after logout, disconnect, the partner ending the space, or account deletion (V0-F12-AC-07/-08/-10, V0-NF-04).
const mockSecure = new Map<string, string>();
const mockFiles = new Map<string, string>();
const mockScheduled = new Map<string, { identifier: string; content: Record<string, unknown> }>();
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async (key: string) => mockSecure.get(key) ?? null),
  setItemAsync: jest.fn(async (key: string, value: string) => { mockSecure.set(key, value); }),
  deleteItemAsync: jest.fn(async (key: string) => { mockSecure.delete(key); }),
}));
jest.mock('expo-file-system/legacy', () => ({
  documentDirectory: 'file://documents/',
  readAsStringAsync: jest.fn(async (path: string) => { const value = mockFiles.get(path); if (value === undefined) throw new Error('missing'); return value; }),
  writeAsStringAsync: jest.fn(async (path: string, value: string) => { mockFiles.set(path, value); }),
  deleteAsync: jest.fn(async (path: string) => { mockFiles.delete(path); }),
}));
jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn(async () => ({ granted: false, status: 'denied' })),
  getAllScheduledNotificationsAsync: jest.fn(async () => [...mockScheduled.values()]),
  scheduleNotificationAsync: jest.fn(async ({ identifier, content }: { identifier: string; content: Record<string, unknown> }) => { mockScheduled.set(identifier, { identifier, content }); return identifier; }),
  cancelScheduledNotificationAsync: jest.fn(async (identifier: string) => { mockScheduled.delete(identifier); }),
  cancelAllScheduledNotificationsAsync: jest.fn(async () => { mockScheduled.clear(); }),
}));
jest.mock('expo-router', () => ({ router: { back: jest.fn(), push: jest.fn() } }));
const mockApp = { userId: ME as string | null, sessionLoaded: true, password: { mailConnected: async () => false }, auth: { signOut: jest.fn(async () => undefined) }, client: { ackEnded: jest.fn(async () => undefined) }, supabase: {}, session: null, clearSessionExpired: jest.fn() };
const mockSpace: { entry: string; spaceId: string | null; ended: unknown; reload: jest.Mock; reset: jest.Mock; state: { snapshot: ReturnType<typeof snapshotFixture> | null } } = { entry: 'active', spaceId: 'space-1', ended: null, reload: jest.fn(async () => undefined), reset: jest.fn(), state: { snapshot: snapshotFixture() } };
jest.mock('../../../lib/AppContext', () => ({ useApp: () => mockApp }));
jest.mock('../../auth/PasswordContext', () => ({ usePassword: () => ({ state: null, apple: true }) }));
jest.mock('../SpaceContext', () => ({ useSpace: () => mockSpace }));
jest.mock('../../../lib/reauth', () => ({ supabaseReauth: () => ({}) }));
let mockDeleteScreenProps: { onFinished: (outcome: 'accepted' | 'signedOut') => Promise<void> } | null = null;
jest.mock('../../account/DeleteAccountScreen', () => ({ DeleteAccountScreen: (props: typeof mockDeleteScreenProps) => { mockDeleteScreenProps = props; return null; } }));

const SPACE = 'space-1';
const written: WidgetSnapshot[] = [];
const port: WidgetPort = { write: jest.fn(async (json: string) => { written.push(JSON.parse(json) as WidgetSnapshot); }), reload: jest.fn(async () => undefined) };
const lastWidget = () => written.at(-1)?.state;
let translator: i18n;

const SECURE_KEYS = [`v0.invite.${SPACE}`, `v0.celebration.seen.${SPACE}.${ME}`, `v0.connected.seen.${SPACE}.${ME}`, `v0.partnerEdited.seen.${SPACE}.${ME}`];
/** Everything V0 puts on a device for one signed-in member of one space. */
async function seedDevice() {
  await writeV0Cache(ME, snapshotFixture());
  await updateNotifyPrefs(ME, { enabled: true });
  await saveV0Invite(SPACE, { code: 'ABCDEFGH', expiresAt: '2026-12-01T00:00:00Z' });
  for (const key of SECURE_KEYS.slice(1)) mockSecure.set(key, 'true');
  for (const id of ['v0:milestone:100', 'v0:birthday:me:2027']) await Notifications.scheduleNotificationAsync({ identifier: id, content: { title: 't', body: 'b' }, trigger: null });
}
const v0Files = () => [...mockFiles.keys()].filter((path) => /v0-(notify|cache)-/.test(path));
const v0SecureKeys = () => [...mockSecure.keys()].filter((key) => /^v0\.(invite|celebration\.seen|connected\.seen|partnerEdited\.seen)\./.test(key));
const v0Notifications = async () => (await Notifications.getAllScheduledNotificationsAsync()).filter(({ identifier }) => identifier.startsWith('v0:'));
function expectSeeded() {
  expect(v0Files().map((path) => path.split('/').at(-1)!).sort()).toEqual([`v0-cache-${ME}.json`, `v0-notify-${ME}.json`]);
  expect(v0SecureKeys().sort()).toEqual([...SECURE_KEYS].sort());
}
async function expectNothingLeft() {
  expect(await v0Notifications()).toEqual([]);
  expect(v0SecureKeys()).toEqual([]);
  expect(v0Files()).toEqual([]);
}

beforeEach(async () => {
  mockSecure.clear(); mockFiles.clear(); mockScheduled.clear(); written.length = 0; jest.clearAllMocks();
  mockApp.userId = ME; mockSpace.entry = 'active'; mockSpace.spaceId = SPACE; mockSpace.ended = null; mockSpace.state = { snapshot: snapshotFixture() }; mockDeleteScreenProps = null;
  translator = await i18nFor();
  installWidgets({ port, translator });
  await seedDevice();
  expectSeeded();
});
afterEach(() => { installWidgets(null); jest.useRealTimers(); });

describe('V0-F12-AC-10 logout', () => {
  it('removes reminders, cache, preferences, seen markers and the invite, and leaves the widget on none', async () => {
    await logout({ auth: { signOut: jest.fn(async () => undefined) }, releaseSession: jest.fn(), clearPendingInvite: jest.fn(async () => undefined), resetSpace: jest.fn(), snapshot: snapshotFixture(), userId: ME });
    await expectNothingLeft();
    expect(lastWidget()).toBe('none');
  });
});

describe('V0-F12-AC-07 disconnect and end', () => {
  it('removes the same things and leaves the widget on ended', async () => {
    await leaveSpace({ close: jest.fn(async () => undefined), releaseSession: jest.fn(), snapshot: snapshotFixture(), userId: ME, resetSpace: jest.fn(), reload: jest.fn(async () => undefined) });
    await expectNothingLeft();
    expect(lastWidget()).toBe('ended');
  });
});

describe('V0-F13-AC-05 the partner ended the space', () => {
  const settled = async () => { await act(async () => { await jest.advanceTimersByTimeAsync(500); }); };
  it.each([['disconnect'], ['account_deleted']])('%s: the ended screen clears the device and the widget turns ended', async (kind) => {
    mockSpace.entry = 'ended'; mockSpace.ended = { kind, by: 'partner', at: '2026-11-05T00:00:00Z' };
    await renderWithI18n(<EndedRoute />);
    await waitFor(async () => { expect(await v0Notifications()).toEqual([]); expect(v0SecureKeys()).toEqual([]); expect(v0Files()).toEqual([]); });
    jest.useFakeTimers({ doNotFake: ['setImmediate', 'nextTick', 'queueMicrotask'] });
    const wrapper = ({ children }: { children: ReactNode }) => <I18nextProvider i18n={translator}>{children}</I18nextProvider>;
    const hook = await renderHook(() => useNotificationSync(), { wrapper });
    await settled();
    expect(lastWidget()).toBe('ended');
    expect(written.at(-1)).not.toHaveProperty('spaceId');
    await hook.unmount();
  });
});

describe('V0-F12-AC-08 account deletion', () => {
  it.each(['accepted', 'signedOut'] as const)('%s: removes every scheduled reminder, local data and the widget content', async (outcome) => {
    await renderWithI18n(<DeleteAccountRoute />);
    await act(async () => { await mockDeleteScreenProps!.onFinished(outcome); });
    await expectNothingLeft();
    expect(Notifications.cancelAllScheduledNotificationsAsync).toHaveBeenCalled();
    expect(lastWidget()).toBe('none');
    expect(mockApp.auth.signOut).toHaveBeenCalled();
    expect(mockSpace.reset).toHaveBeenCalled();
  });
});
