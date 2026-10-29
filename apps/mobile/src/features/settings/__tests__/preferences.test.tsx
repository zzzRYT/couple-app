import { useTranslation } from 'react-i18next';
import { Pressable, Text } from 'react-native';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { createI18n } from '../../../i18n';
import { I18nextProvider } from 'react-i18next';
import { PreferencesProvider, usePreferences } from '../preferences';
import { useAppColor } from '../../../theme/useAppColor';

function Probe() {
  const { t } = useTranslation();
  const preferences = usePreferences();
  const color = useAppColor();
  return <>
    <Text testID="locale">{preferences.locale ?? 'system'}</Text>
    <Text testID="translated">{t('common.done')}</Text>
    <Text testID="mode">{preferences.displayMode}</Text>
    <Text testID="background">{color.bg}</Text>
    <Pressable testID="set-ja" onPress={() => preferences.setLocale('ja-JP')} />
    <Pressable testID="follow-device" onPress={() => preferences.setLocale(null)} />
    <Pressable testID="set-dark" onPress={() => preferences.setDisplayMode('dark')} />
  </>;
}

it('keeps language override and this-device display mode local, and clears language to follow the device', async () => {
  const values = new Map<string, string>();
  const store = {
    getItemAsync: jest.fn(async (key: string) => values.get(key) ?? null),
    setItemAsync: jest.fn(async (key: string, value: string) => { values.set(key, value); }),
    deleteItemAsync: jest.fn(async (key: string) => { values.delete(key); }),
  };
  const translator = await createI18n({ deviceLocale: 'en-US', storage: store, profileLocale: null });
  const screen = await render(<I18nextProvider i18n={translator}><PreferencesProvider translator={translator} store={store}><Probe /></PreferencesProvider></I18nextProvider>);
  await waitFor(() => expect(screen.getByTestId('translated').props.children).toBe('Done'));
  await fireEvent.press(screen.getByTestId('set-ja'));
  await waitFor(() => expect(screen.getByTestId('locale').props.children).toBe('ja-JP'));
  await waitFor(() => expect(screen.getByTestId('translated').props.children).toBe('完了'));
  await fireEvent.press(screen.getByTestId('set-dark'));
  await waitFor(() => expect(screen.getByTestId('mode').props.children).toBe('dark'));
  await waitFor(() => expect(screen.getByTestId('background').props.children).toBe('#2B2320'));
  expect(values.get('locale')).toBe('ja-JP');
  expect(values.get('displayMode')).toBe('dark');
  await fireEvent.press(screen.getByTestId('follow-device'));
  await waitFor(() => expect(screen.getByTestId('locale').props.children).toBe('system'));
  await waitFor(() => expect(screen.getByTestId('translated').props.children).toBe('Done'));
  expect(values.has('locale')).toBe(false);
  expect(values.get('displayMode')).toBe('dark');
});
