import { renderWithI18n } from '../../../test/render';
import { snapshotFixture } from '../../../test/fixtures';
import MeRoute from '../../../app/settings/me';
const mockUseSpace = jest.fn();
jest.mock('../../space/SpaceContext', () => ({ useSpace: () => mockUseSpace() }));
jest.mock('../../../lib/AppContext', () => ({ useApp: () => ({ client: { saveMemberProfile: jest.fn() } }) }));
it('V0-F12-AC-02 shows the partner birthday wait hint only while needed', async () => {
  const snapshot = snapshotFixture();
  mockUseSpace.mockReturnValue({ state: { snapshot, offline: false }, refresh: jest.fn() });
  const screen = await renderWithI18n(<MeRoute />);
  expect(screen.getByText(screen.t('set.me.birthday.partnerWait', { name: '도담' }))).toBeTruthy();
  snapshot.members[1]!.hasBirthday = true;
  await screen.rerender(<MeRoute />);
  expect(screen.queryByText(screen.t('set.me.birthday.partnerWait', { name: '도담' }))).toBeNull();
});
