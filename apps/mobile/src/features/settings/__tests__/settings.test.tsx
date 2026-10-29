import { fireEvent } from '@testing-library/react-native';
import { renderWithI18n } from '../../../test/render';
import { SettingsScreen } from '../SettingsScreen';

it('locks shared room settings offline while keeping this-device appearance controls available', async () => {
  const onRoomMode = jest.fn().mockResolvedValue(undefined);
  const onTimeZone = jest.fn().mockResolvedValue(undefined);
  const screen = await renderWithI18n(<SettingsScreen onLogout={jest.fn().mockResolvedValue(undefined)} offline onRoomMode={onRoomMode} onTimeZone={onTimeZone}
    space={{ anniversary: 'June 29, 2025', consent: 'not_given', roomMode: 'follow_time', timeZone: 'Asia/Seoul' }} />);
  const day = screen.getByRole('button', { name: screen.t('set.room.mode.day') });
  const dark = screen.getByRole('button', { name: screen.t('set.theme.dark') });
  expect(day.props.accessibilityState.disabled).toBe(true);
  expect(dark.props.accessibilityState.disabled).toBe(false);
  expect(screen.getByRole('button', { name: `${screen.t('set.room.tz')}, Asia/Seoul` }).props.accessibilityState.disabled).toBe(true);
  expect(screen.getByText(screen.t('set.offline.body'))).toBeTruthy();
  await fireEvent.press(day);
  expect(onRoomMode).not.toHaveBeenCalled();
  expect(onTimeZone).not.toHaveBeenCalled();
});
