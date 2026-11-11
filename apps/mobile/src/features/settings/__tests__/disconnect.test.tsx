import { renderWithI18n } from '../../../test/render';
import { snapshotFixture } from '../../../test/fixtures';
import DisconnectRoute from '../../../app/settings/disconnect';
const mockUseSpace = jest.fn();
const mockRedirect = jest.fn();
jest.mock('expo-router', () => ({ router: { back: jest.fn() }, Redirect: ({ href }: { href: string }) => { mockRedirect(href); return null; } }));
jest.mock('../../space/SpaceContext', () => ({ useSpace: () => mockUseSpace() }));
jest.mock('../../../lib/AppContext', () => ({ useApp: () => ({ client: { disconnect: jest.fn(), release: jest.fn() }, userId: 'me' }) }));
const open = (memberCount: number) => mockUseSpace.mockReturnValue({ state: { snapshot: snapshotFixture({ memberCount }), offline: false }, reset: jest.fn(), reload: jest.fn() });
beforeEach(() => jest.clearAllMocks());

it('goes back to Settings instead of ending a space nobody has joined', async () => {
  open(1);
  const screen = await renderWithI18n(<DisconnectRoute />);
  expect(mockRedirect).toHaveBeenCalledWith('/settings');
  expect(screen.queryByText(screen.t('set.disconnect.title'))).toBeNull();
});

it('asks a connected couple to confirm', async () => {
  open(2);
  const screen = await renderWithI18n(<DisconnectRoute />);
  expect(screen.getByText(screen.t('set.disconnect.title'))).toBeTruthy();
  expect(mockRedirect).not.toHaveBeenCalled();
});
