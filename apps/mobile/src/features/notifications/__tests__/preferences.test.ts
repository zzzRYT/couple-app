import * as FileSystem from 'expo-file-system/legacy';
import { clearAnniversaryNotify, DEFAULT_NOTIFY_PREFS, getAnniversaryNotify, readNotifyPrefs, setAnniversaryNotify, subscribeNotifyPrefs, updateNotifyPrefs } from '../preferences';
jest.mock('expo-file-system/legacy', () => ({ documentDirectory: 'file://documents/', writeAsStringAsync: jest.fn(), readAsStringAsync: jest.fn(), deleteAsync: jest.fn() }));
it('stores per-anniversary preferences as an object while preserving other settings', async () => {
  (FileSystem.readAsStringAsync as jest.Mock).mockResolvedValue(JSON.stringify({ enabled: true, offIds: ['other'] }));
  await setAnniversaryNotify('u', 'x', 'off');
  expect(FileSystem.writeAsStringAsync).toHaveBeenCalledWith('file://documents/v0-notify-u.json', JSON.stringify({ enabled: true, offIds: ['other', 'x'] }));
  (FileSystem.readAsStringAsync as jest.Mock).mockResolvedValue(JSON.stringify({ enabled: true, offIds: ['other', 'x'] }));
  expect(await getAnniversaryNotify('u', 'x')).toBe('off');
  await setAnniversaryNotify('u', 'x', 'default');
  expect(FileSystem.writeAsStringAsync).toHaveBeenLastCalledWith('file://documents/v0-notify-u.json', JSON.stringify({ enabled: true, offIds: ['other'] }));
  await clearAnniversaryNotify('u');
  expect(FileSystem.deleteAsync).toHaveBeenCalledWith('file://documents/v0-notify-u.json', { idempotent: true });
});

const stored = () => (FileSystem.readAsStringAsync as jest.Mock);
const missing = () => stored().mockRejectedValue(new Error('missing'));
it('T501 uses the decided defaults: off until permission, 09:00, one day before, every kind on', async () => {
  missing();
  expect(await readNotifyPrefs('u')).toEqual({ enabled: false, time: '09:00', early: '1d', kinds: { milestone: true, birthday: true, season: true, custom: true }, offIds: [], prePromptSeen: false });
});
it('T501 fills missing fields of an H03 file and replaces damaged ones', async () => {
  stored().mockResolvedValue(JSON.stringify({ offIds: ['a', 7] }));
  expect(await readNotifyPrefs('u')).toEqual({ ...DEFAULT_NOTIFY_PREFS, offIds: ['a'] });
  stored().mockResolvedValue(JSON.stringify({ enabled: 'yes', time: '25:00', early: '2d', kinds: { season: false, custom: 'no' }, offIds: 'x', prePromptSeen: true }));
  expect(await readNotifyPrefs('u')).toEqual({ ...DEFAULT_NOTIFY_PREFS, kinds: { ...DEFAULT_NOTIFY_PREFS.kinds, season: false }, prePromptSeen: true });
  stored().mockResolvedValue('not json');
  expect(await readNotifyPrefs('u')).toEqual(DEFAULT_NOTIFY_PREFS);
});
it('T501 applies quick updates in order and tells subscribers', async () => {
  let file = JSON.stringify({ offIds: ['a'] });
  stored().mockImplementation(async () => file);
  (FileSystem.writeAsStringAsync as jest.Mock).mockImplementation(async (_: string, value: string) => { file = value; });
  const listener = jest.fn();
  const unsubscribe = subscribeNotifyPrefs(listener);
  await Promise.all([updateNotifyPrefs('u', { enabled: true }), updateNotifyPrefs('u', { early: '3d' }), setAnniversaryNotify('u', 'b', 'off')]);
  unsubscribe();
  expect(JSON.parse(file)).toEqual({ ...DEFAULT_NOTIFY_PREFS, enabled: true, early: '3d', offIds: ['a', 'b'] });
  expect(listener).toHaveBeenCalledTimes(3);
});
it('T501 keeps working after a failed write', async () => {
  missing();
  (FileSystem.writeAsStringAsync as jest.Mock).mockRejectedValueOnce(new Error('disk full')).mockResolvedValue(undefined);
  await expect(updateNotifyPrefs('u', { enabled: true })).rejects.toThrow('disk full');
  await expect(updateNotifyPrefs('u', { enabled: true })).resolves.toMatchObject({ enabled: true });
});
