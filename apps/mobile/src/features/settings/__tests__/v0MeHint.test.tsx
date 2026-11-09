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

it('V0-set-me stays on screen offline with the nav-bar 저장 waiting', async () => {
  mockUseSpace.mockReturnValue({ state: { snapshot: snapshotFixture(), offline: true }, refresh: jest.fn() });
  const screen = await renderWithI18n(<MeRoute />);
  expect(screen.getByRole('header', { name: screen.t('set.me.edit.title') })).toBeTruthy();
  expect(screen.getByLabelText(screen.t('set.me.name')).props.value).toBe('하루');
  expect(screen.getByRole('button', { name: screen.t('common.save') }).props.accessibilityState.disabled).toBe(true);
});
