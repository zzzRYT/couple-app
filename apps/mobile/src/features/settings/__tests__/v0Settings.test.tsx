import { fireEvent } from '@testing-library/react-native';
import { renderWithI18n } from '../../../test/render';
import { snapshotFixture } from '../../../test/fixtures';
import { V0SettingsScreen } from '../V0SettingsScreen';
it('V0-F12-AC-01 exposes V0 rows and hides room, cover and consent', async () => {
  const navigate = jest.fn();
  const screen = await renderWithI18n(<V0SettingsScreen snapshot={snapshotFixture()} offline={false} version="0.1" onLogout={jest.fn()} onZone={jest.fn()} navigate={navigate} />);
  expect(screen.getByText(screen.t('set.section.me'))).toBeTruthy();
  expect(screen.getByText(screen.t('set.section.us'))).toBeTruthy();
  expect(screen.getByText(screen.t('set.section.display'))).toBeTruthy();
  expect(screen.queryByText(screen.t('set.cover'))).toBeNull();
  expect(screen.queryByText(screen.t('set.ai.consent'))).toBeNull();
  await fireEvent.press(screen.getByRole('button', { name: /사귄 날/ }));
  expect(navigate).toHaveBeenCalledWith('start-date');
});
it('V0-F13-AC-03 disables shared edits while offline', async () => {
  const navigate = jest.fn();
  const screen = await renderWithI18n(<V0SettingsScreen snapshot={snapshotFixture()} offline version="0.1" onLogout={jest.fn()} onZone={jest.fn()} navigate={navigate} />);
  expect(screen.getByRole('button', { name: /사귄 날/ }).props.accessibilityState.disabled).toBe(true);
});
it('V0-NF-02 draws the time-zone row as the board does, not from the engine zone names', async () => {
  const screen = await renderWithI18n(<V0SettingsScreen snapshot={snapshotFixture()} offline={false} version="0.1" onLogout={jest.fn()} onZone={jest.fn()} navigate={jest.fn()} />);
  expect(screen.getByText('서울 (UTC+9)')).toBeTruthy();
});
