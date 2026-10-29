import { StyleSheet } from 'react-native';
import { createInstance } from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import en from '../../../i18n/locales/en-US.json';
import { renderWithI18n, safeMetrics } from '../../../test/render';
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

/** Pseudo-localization: every string grows by 40% so layout assumptions about copy length surface. */
async function pseudoI18n() {
  const resources = Object.fromEntries(Object.entries(en as Record<string, string>).map(([key, value]) => [key, `${value}${'~'.repeat(Math.ceil(value.length * 0.4))}`]));
  const instance = createInstance();
  await instance.use(initReactI18next).init({ lng: 'en-US', resources: { 'en-US': { translation: resources } }, keySeparator: false, interpolation: { prefix: '{', suffix: '}', escapeValue: false } });
  return instance;
}

const fullSpace = { anniversary: 'June 29, 2025', consent: 'granted' as const, roomMode: 'follow_time' as const, timeZone: 'Asia/Seoul' };

it('keeps every control reachable and untruncated with 40% longer copy', async () => {
  const instance = await pseudoI18n();
  const screen = await render(
    <SafeAreaProvider initialMetrics={safeMetrics}><I18nextProvider i18n={instance}>
      <SettingsScreen onLogout={jest.fn().mockResolvedValue(undefined)} space={fullSpace} version="1.0.0" onRoomMode={jest.fn()} onTimeZone={jest.fn()} onOpenReport={jest.fn()} onOpenEndSpace={jest.fn()} />
    </I18nextProvider></SafeAreaProvider>,
  );
  expect(screen.getByText(instance.t('set.title'))).toBeTruthy();
  const labels = screen.getAllByRole('button').map((control) => String(control.props.accessibilityLabel));
  for (const key of ['set.lang', 'set.logout', 'set.about.licenses', 'set.support', 'set.end']) {
    expect(labels.some((label) => label.startsWith(instance.t(key)))).toBe(true);
  }
  // Layout engines are not available in Jest: guard the props that cause clipping instead.
  const texts = screen.getAllByText(/./);
  expect(texts.length).toBeGreaterThan(0);
  for (const text of texts) {
    expect(text.props.numberOfLines).toBeUndefined();
    expect(text.props.allowFontScaling).not.toBe(false);
  }
  // Touch targets stay at least 44pt even when labels wrap onto several lines.
  for (const control of screen.getAllByRole('button')) expect(StyleSheet.flatten(control.props.style).minHeight).toBeGreaterThanOrEqual(44);
});

it.each(['ko-KR', 'en-US', 'ja-JP'] as const)('shows the generic %s server error copy, never the raw server error code', async (locale) => {
  const onRoomMode = jest.fn().mockRejectedValue(Object.assign(new Error('VERSION_CONFLICT'), { code: 'VERSION_CONFLICT' }));
  const screen = await renderWithI18n(<SettingsScreen onLogout={jest.fn().mockResolvedValue(undefined)} space={fullSpace} onRoomMode={onRoomMode} onTimeZone={jest.fn()} />, locale);
  await fireEvent.press(screen.getByRole('button', { name: screen.t('set.room.mode.night') }));
  await waitFor(() => expect(screen.getByText(screen.t('sys.server.title'))).toBeTruthy());
  expect(screen.getByText(screen.t('sys.server.body'))).toBeTruthy();
  expect(screen.queryByText(/VERSION_CONFLICT/)).toBeNull();
});
