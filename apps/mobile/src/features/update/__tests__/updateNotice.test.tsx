import { Linking } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { act, fireEvent, waitFor } from '@testing-library/react-native';
import { renderWithI18n } from '../../../test/render';
import { APP_STORE } from '../../../config/identity';
import { isNewer, storeVersion } from '../storeVersion';
import { UpdateNotice } from '../UpdateNotice';

const mockSecure = new Map<string, string>();
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async (key: string) => mockSecure.get(key) ?? null),
  setItemAsync: jest.fn(async (key: string, value: string) => { mockSecure.set(key, value); }),
  deleteItemAsync: jest.fn(async (key: string) => { mockSecure.delete(key); }),
}));

describe('V0-F14-AC-07 store version check', () => {
  it('compares dotted versions numerically', () => {
    expect(isNewer('1.1.0', '1.0.0')).toBe(true);
    expect(isNewer('1.0.10', '1.0.9')).toBe(true);
    expect(isNewer('1.0', '1.0.0')).toBe(false);
    expect(isNewer('1.0.0', '1.0.1')).toBe(false);
    expect(isNewer('2', '1.9.9')).toBe(true);
  });

  it('reads the device region store first, falls back to the default store, and ignores junk', async () => {
    const fetchJson = jest.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ resultCount: 0, results: [] }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ resultCount: 1, results: [{ version: '1.1.0' }] }) });
    await expect(storeVersion(APP_STORE.id, 'KR', fetchJson)).resolves.toBe('1.1.0');
    expect(fetchJson.mock.calls.map(([url]) => url)).toEqual([`https://itunes.apple.com/lookup?id=${APP_STORE.id}&country=kr`, `https://itunes.apple.com/lookup?id=${APP_STORE.id}`]);
    const junk = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ results: [{ version: 'beta' }] }) });
    await expect(storeVersion(APP_STORE.id, null, junk)).resolves.toBeNull();
    expect(junk).toHaveBeenCalledTimes(1);
  });
});

describe('V0-update dialog', () => {
  const open = jest.spyOn(Linking, 'openURL');
  beforeEach(async () => { open.mockReset(); open.mockImplementation(async () => true as never); await SecureStore.deleteItemAsync('v0.update.dismissed'); });

  it('V0-F14-AC-07 shows when the installed version is older and opens the App Store page', async () => {
    const screen = await renderWithI18n(<UpdateNotice enabled installed="1.0.0" lookup={async () => '1.1.0'} />);
    expect(await screen.findByText(screen.t('update.title'))).toBeTruthy();
    expect(screen.getByText(screen.t('update.body', { version: '1.1.0' }))).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: screen.t('update.action') }));
    expect(open).toHaveBeenCalledWith(APP_STORE.url);
    await waitFor(() => expect(screen.queryByText(screen.t('update.title'))).toBeNull());
  });

  it('V0-F14-AC-07 stays hidden when up to date, when the lookup fails, and outside the App Store build', async () => {
    const same = await renderWithI18n(<UpdateNotice enabled installed="1.1.0" lookup={async () => '1.1.0'} />);
    const failed = await renderWithI18n(<UpdateNotice enabled installed="1.0.0" lookup={async () => { throw new TypeError('Network request failed'); }} />);
    const lookup = jest.fn(async () => '9.9.9');
    const preview = await renderWithI18n(<UpdateNotice enabled={false} installed="1.0.0" lookup={lookup} />);
    await act(async () => { await Promise.resolve(); });
    for (const screen of [same, failed, preview]) expect(screen.queryByText(screen.t('update.title'))).toBeNull();
    expect(lookup).not.toHaveBeenCalled();
  });

  it('V0-F14-AC-08 "나중에" closes it and remembers that version only', async () => {
    const first = await renderWithI18n(<UpdateNotice enabled installed="1.0.0" lookup={async () => '1.1.0'} />);
    await fireEvent.press(await first.findByRole('button', { name: first.t('common.later') }));
    await waitFor(() => expect(first.queryByText(first.t('update.title'))).toBeNull());
    expect(await SecureStore.getItemAsync('v0.update.dismissed')).toBe('1.1.0');
    first.unmount();
    const again = await renderWithI18n(<UpdateNotice enabled installed="1.0.0" lookup={async () => '1.1.0'} />);
    await act(async () => { await Promise.resolve(); });
    expect(again.queryByText(again.t('update.title'))).toBeNull();
    again.unmount();
    const newer = await renderWithI18n(<UpdateNotice enabled installed="1.0.0" lookup={async () => '1.2.0'} />);
    expect(await newer.findByText(newer.t('update.body', { version: '1.2.0' }))).toBeTruthy();
  });
});
