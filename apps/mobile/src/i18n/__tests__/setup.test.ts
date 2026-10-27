import { createI18n, setLocale } from '../index';

it('starts in device language then saves an explicit preference', async () => {
  const storage = { getItemAsync: jest.fn().mockResolvedValue(null), setItemAsync: jest.fn().mockResolvedValue(undefined) };
  const saveProfile = jest.fn().mockResolvedValue(undefined);
  const i18n = await createI18n({ deviceLocale: 'ja-JP', storage, profileLocale: null });
  expect(i18n.language).toBe('ja-JP');
  const before = i18n.t('common.done');
  await setLocale(i18n, 'ko-KR', storage, saveProfile);
  expect(i18n.language).toBe('ko-KR');
  expect(i18n.t('common.done')).not.toBe(before);
  expect(storage.setItemAsync).toHaveBeenCalledWith('locale', 'ko-KR');
  expect(saveProfile).toHaveBeenCalledWith('ko-KR');
});
