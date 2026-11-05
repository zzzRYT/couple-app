import * as FileSystem from 'expo-file-system/legacy';
import { clearAnniversaryNotify, getAnniversaryNotify, setAnniversaryNotify } from '../preferences';
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
