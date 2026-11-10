import { Alert, type AlertButton } from 'react-native';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { renderWithI18n } from '../../test/render';
import { snapshotFixture, ME } from '../../test/fixtures';
import { DEFAULT_NOTIFY_PREFS, type NotifyPrefs } from '../../features/notifications/preferences';
import { notifyDefaultLabel } from '../../features/notifications/labels';
import AnniversaryDetailRoute from '../anniversary/[key]';
import AnniversariesRoute from '../(tabs)/anniversaries/index';
import AnniversaryEditRoute from '../anniversary-edit';

let mockParams: Record<string, string | undefined> = {};
jest.mock('expo-router', () => ({ router: { push: jest.fn(), replace: jest.fn(), back: jest.fn(), dismissTo: jest.fn() }, useLocalSearchParams: () => mockParams, useIsFocused: () => true }));
const mockApp = { client: { deleteAnniversaryItem: jest.fn() }, userId: ME };
jest.mock('../../lib/AppContext', () => ({ useApp: () => mockApp }));
const mockSpace = { state: { status: 'ready', snapshot: snapshotFixture(), offline: false, lastSyncedAt: null }, refresh: jest.fn(async () => undefined) };
jest.mock('../../features/space/SpaceContext', () => ({ useSpace: () => mockSpace }));
jest.mock('../../lib/useNow', () => ({ useNow: () => '2026-11-10T03:00:00Z' }));
let mockPrefs: NotifyPrefs;
jest.mock('../../features/notifications/useNotifyPrefs', () => ({ useNotifyPrefs: () => mockPrefs }));
jest.mock('../../features/notifications/preferences', () => ({ ...jest.requireActual('../../features/notifications/preferences'), getAnniversaryNotify: jest.fn(async () => 'default'), setAnniversaryNotify: jest.fn(async () => undefined) }));

const trip = { id: 'x', title: 'Trip', date: '2026-12-01', memo: null, repeat: 'once' as const, createdBy: ME, updatedBy: ME, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z', version: 1 };
const withSnapshot = (memberCount: number, edit: (snapshot: ReturnType<typeof snapshotFixture>) => void = () => undefined) => { const snapshot = snapshotFixture({ memberCount }); edit(snapshot); mockSpace.state = { ...mockSpace.state, snapshot }; };
const pressDelete = (alert: jest.SpyInstance) => { const buttons = alert.mock.calls.at(-1)![2] as AlertButton[]; buttons.find((button) => button.style === 'destructive')!.onPress!(); };
beforeEach(() => { mockPrefs = DEFAULT_NOTIFY_PREFS; mockParams = {}; });

describe('anniversary detail route', () => {
  it('V0-F07-AC-06 ND13 shows the delete-failure toast, not the save failure, when deleting fails', async () => {
    withSnapshot(2, (snapshot) => { snapshot.anniversaries = [trip]; });
    mockParams = { key: encodeURIComponent('custom:x') };
    mockApp.client.deleteAnniversaryItem.mockRejectedValueOnce(new TypeError('offline'));
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    const screen = await renderWithI18n(<AnniversaryDetailRoute />);
    await fireEvent.press(screen.getByText(screen.t('edit.delete')));
    expect(alert).toHaveBeenCalledWith(screen.t('edit.delete.title'), screen.t('edit.delete.body', { name: '도담' }), expect.any(Array));
    pressDelete(alert);
    expect(await screen.findByText(screen.t('edit.delete.err'))).toBeTruthy();
    expect(screen.queryByText(screen.t('edit.save.err'))).toBeNull();
    expect(alert).toHaveBeenCalledTimes(1);
    alert.mockRestore();
  });
  it('ND15 says only that deleting cannot be undone while no partner has joined', async () => {
    withSnapshot(1, (snapshot) => { snapshot.anniversaries = [trip]; });
    mockParams = { key: encodeURIComponent('custom:x') };
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    const screen = await renderWithI18n(<AnniversaryDetailRoute />);
    await fireEvent.press(screen.getByText(screen.t('edit.delete')));
    expect(alert).toHaveBeenCalledWith(screen.t('edit.delete.title'), screen.t('edit.delete.body.unpaired'), expect.any(Array));
    alert.mockRestore();
  });
  it.each([
    ['notifications are off on this device', { enabled: false }, true],
    ['the season kind is off', { enabled: true, kinds: { ...DEFAULT_NOTIFY_PREFS.kinds, season: false } }, true],
    ['notifications and the kind are on', { enabled: true }, false],
  ])('V0-F10-AC-04 ND14 automatic detail notify value when %s', async (_, patch, off) => {
    withSnapshot(2);
    mockPrefs = { ...DEFAULT_NOTIFY_PREFS, ...patch };
    mockParams = { key: encodeURIComponent('season:pepero:2026') };
    const screen = await renderWithI18n(<AnniversaryDetailRoute />);
    const label = notifyDefaultLabel(mockPrefs, 'ko-KR', screen.t);
    expect(screen.queryByText(screen.t('anniv.notify.off')) !== null).toBe(off);
    expect(screen.queryByText(label) !== null).toBe(!off);
  });
});

describe('anniversaries tab route', () => {
  it('ND15 shows my birthday and the connect hint in the partner slot before a partner joins', async () => {
    withSnapshot(1, (snapshot) => { snapshot.me.birthday = { month: 12, day: 1, year: null }; });
    const screen = await renderWithI18n(<AnniversariesRoute />);
    expect(screen.getByText(screen.t('anniv.birthday.me'))).toBeTruthy();
    const tree = JSON.stringify(screen.toJSON());
    expect(tree.indexOf(screen.t('anniv.birthday.me'))).toBeLessThan(tree.indexOf(screen.t('home.pending.hint')));
    expect(tree).not.toContain(screen.t('anniv.birthday.wait', { name: screen.t('home.pending.partner') }));
  });
  it('ND15 asks for my own birthday first while I have none and no partner joined', async () => {
    withSnapshot(1);
    const screen = await renderWithI18n(<AnniversariesRoute />);
    expect(screen.getByText(/내 생일을 넣으면/)).toBeTruthy();
    expect(screen.queryByText(screen.t('home.pending.hint'))).toBeNull();
  });
  it('V0-F05-AC-01 keeps the partner wait row once paired', async () => {
    withSnapshot(2, (snapshot) => { snapshot.me.birthday = { month: 12, day: 1, year: null }; });
    const screen = await renderWithI18n(<AnniversariesRoute />);
    expect(screen.getByText(screen.t('anniv.birthday.wait', { name: '도담' }))).toBeTruthy();
    expect(screen.queryByText(screen.t('home.pending.hint'))).toBeNull();
  });
  it('V0-F08-AC-02 ND12 keeps the empty state away from the custom filter while customs exist outside the window', async () => {
    withSnapshot(2, (snapshot) => { snapshot.anniversaries = [{ ...trip, date: '2024-05-01' }]; });
    const screen = await renderWithI18n(<AnniversariesRoute />);
    await fireEvent.press(screen.getByText(screen.t('anniv.filter.custom')));
    expect(screen.queryByText(screen.t('anniv.empty.title'))).toBeNull();
  });
  it('V0-F07-AC-04 ND12 lists a one-time custom dated before the start date under the custom filter', async () => {
    withSnapshot(2, (snapshot) => { snapshot.space.anniversaryDate = '2026-03-01'; snapshot.anniversaries = [{ ...trip, date: '2026-01-15' }]; });
    const screen = await renderWithI18n(<AnniversariesRoute />);
    await fireEvent.press(screen.getByText(screen.t('anniv.filter.custom')));
    expect(screen.getByText('Trip')).toBeTruthy();
  });
});

describe('anniversary edit route', () => {
  it('ND15 shows the unpaired sharing hint before a partner joins and the named hint after', async () => {
    withSnapshot(1);
    const alone = await renderWithI18n(<AnniversaryEditRoute />);
    await waitFor(() => expect(alone.getByText(alone.t('edit.shared.hint.unpaired'))).toBeTruthy());
    await alone.unmount();
    withSnapshot(2);
    const paired = await renderWithI18n(<AnniversaryEditRoute />);
    expect(paired.getByText(paired.t('edit.shared.hint', { name: '도담' }))).toBeTruthy();
  });
});
