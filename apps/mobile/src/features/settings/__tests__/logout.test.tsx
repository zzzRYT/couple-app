import { fireEvent, waitFor } from '@testing-library/react-native';
import { renderWithI18n } from '../../../test/render';
import { snapshotFixture } from '../../../test/fixtures';
import { SettingsScreen } from '../SettingsScreen';
import { lastUsedProvider, logout } from '../logout';

const withLease = (ownerUserId: string) => ({ ...snapshotFixture(), promptSession: { sessionId: 'sess-1', ownerUserId, expiresAt: '2026-10-27T03:03:00Z', status: 'occupied' as const } });
const deps = (overrides = {}) => ({
  auth: { signOut: jest.fn().mockResolvedValue(undefined) },
  releaseSession: jest.fn().mockResolvedValue(undefined),
  clearPendingInvite: jest.fn().mockResolvedValue(undefined),
  resetSpace: jest.fn(),
  snapshot: snapshotFixture(),
  userId: 'me',
  ...overrides,
});

it('signs out, clears the pending invite and cached space state', async () => {
  const d = deps();
  await logout(d);
  expect(d.auth.signOut).toHaveBeenCalled();
  expect(d.clearPendingInvite).toHaveBeenCalled();
  expect(d.resetSpace).toHaveBeenCalled();
  expect(d.releaseSession).not.toHaveBeenCalled();
});

it('releases the prompt lease only when the user holds it, before signing out', async () => {
  const mine = deps({ snapshot: withLease('me') });
  await logout(mine);
  expect(mine.releaseSession).toHaveBeenCalledWith(mine.snapshot!.space.spaceId, 'sess-1');
  expect(mine.releaseSession.mock.invocationCallOrder[0]!).toBeLessThan(mine.auth.signOut.mock.invocationCallOrder[0]!);
  const partners = deps({ snapshot: withLease('partner') });
  await logout(partners);
  expect(partners.releaseSession).not.toHaveBeenCalled();
});

it('still signs out when the lease release fails', async () => {
  const d = deps({ snapshot: withLease('me'), releaseSession: jest.fn().mockRejectedValue(new Error('offline')) });
  await logout(d);
  expect(d.auth.signOut).toHaveBeenCalled();
  expect(d.resetSpace).toHaveBeenCalled();
});

it('keeps cached state when sign-out itself fails', async () => {
  const d = deps({ auth: { signOut: jest.fn().mockRejectedValue(new Error('boom')) } });
  await expect(logout(d)).rejects.toThrow('boom');
  expect(d.resetSpace).not.toHaveBeenCalled();
});

it('maps the session provider to a highlightable login method', () => {
  expect(lastUsedProvider('apple')).toBe('apple');
  expect(lastUsedProvider('kakao')).toBe('kakao');
  expect(lastUsedProvider('email')).toBe('email');
  expect(lastUsedProvider('github')).toBeUndefined();
  expect(lastUsedProvider(undefined)).toBeUndefined();
});

it('asks for confirmation before signing out', async () => {
  const onLogout = jest.fn().mockResolvedValue(undefined);
  const screen = await renderWithI18n(<SettingsScreen onLogout={onLogout} />);
  await fireEvent.press(screen.getByRole('button', { name: screen.t('set.logout') }));
  expect(screen.getByText(screen.t('set.logout.title'))).toBeTruthy();
  expect(onLogout).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByRole('button', { name: screen.t('common.cancel') }));
  expect(onLogout).not.toHaveBeenCalled();
});

it('signs out after confirming and shows an error when it fails', async () => {
  const onLogout = jest.fn().mockRejectedValueOnce(new Error('x')).mockResolvedValue(undefined);
  const screen = await renderWithI18n(<SettingsScreen onLogout={onLogout} />);
  await fireEvent.press(screen.getByRole('button', { name: screen.t('set.logout') }));
  const buttons = () => screen.getAllByRole('button', { name: screen.t('set.logout') });
  await fireEvent.press(buttons().at(-1)!);
  expect(await screen.findByText(screen.t('sys.server.title'))).toBeTruthy();
  await fireEvent.press(buttons().at(-1)!);
  await waitFor(() => expect(onLogout).toHaveBeenCalledTimes(2));
});
