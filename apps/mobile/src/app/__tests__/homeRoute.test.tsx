import * as SecureStore from 'expo-secure-store';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { renderWithI18n } from '../../test/render';
import { snapshotFixture, ME, PARTNER } from '../../test/fixtures';
import HomeRoute from '../(tabs)/home';

const mockSecure = new Map<string, string>();
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async (key: string) => mockSecure.get(key) ?? null),
  setItemAsync: jest.fn(async (key: string, value: string) => { mockSecure.set(key, value); }),
  deleteItemAsync: jest.fn(async (key: string) => { mockSecure.delete(key); }),
}));
jest.mock('expo-router', () => ({ router: { push: jest.fn(), navigate: jest.fn() } }));
const mockApp = { client: {}, userId: '00000000-0000-0000-0000-00000000000a' };
jest.mock('../../lib/AppContext', () => ({ useApp: () => mockApp }));
jest.mock('../../features/auth/PasswordContext', () => ({ usePassword: () => ({ shouldPrompt: false, markPromptSeen: jest.fn() }) }));
const mockSpace = { state: { status: 'ready', snapshot: null as ReturnType<typeof snapshotFixture> | null, offline: false, lastSyncedAt: null }, refresh: jest.fn(), spaceId: 'space-1', inviteAfterActivation: false };
jest.mock('../../features/space/SpaceContext', () => ({ useSpace: () => mockSpace }));
jest.mock('../../features/milestone/useMilestone', () => ({ useMilestone: () => ({ celebration: null, seen: jest.fn() }) }));

it('V0-F03-AC-04 shows the partner-edited notice once per change, and the new start date drives D+N', async () => {
  const snapshot = snapshotFixture();
  snapshot.space.anniversaryDate = '2025-10-01';
  snapshot.space.anniversaryChangedBy = PARTNER;
  snapshot.space.anniversaryChangedAt = '2026-11-01T00:00:00Z';
  mockSpace.state.snapshot = snapshot;
  mockSecure.set(`v0.connected.seen.space-1.${ME}`, 'true');
  const first = await renderWithI18n(<HomeRoute />);
  const notice = first.t('home.partnerEdited', { name: '도담', date: '10월 1일' });
  expect(await first.findByText(notice)).toBeTruthy();
  expect(mockSecure.get(`v0.partnerEdited.seen.space-1.${ME}`)).toBe('2026-11-01T00:00:00Z');
  await first.unmount();
  const second = await renderWithI18n(<HomeRoute />);
  const seenReads = () => (SecureStore.getItemAsync as jest.Mock).mock.calls.filter(([key]) => String(key).startsWith('v0.partnerEdited.seen')).length;
  await waitFor(() => expect(seenReads()).toBe(2));
  expect(second.queryByText(notice)).toBeNull();
  await second.unmount();
});

it('V0-F13-AC-02 shows a failed refresh inside the home tab under the app header, and retries from there', async () => {
  const ready = mockSpace.state;
  mockSpace.state = { ...ready, status: 'error', snapshot: snapshotFixture() };
  const screen = await renderWithI18n(<HomeRoute />);
  expect(screen.getByText(screen.t('state.error.title'))).toBeTruthy();
  expect(screen.getByText(screen.t('app.name'))).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: screen.t('common.retry') }));
  expect(mockSpace.refresh).toHaveBeenCalled();
  await screen.unmount();
  mockSpace.state = ready;
});
