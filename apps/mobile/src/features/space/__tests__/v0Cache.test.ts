import * as FileSystem from 'expo-file-system/legacy';
import { snapshotFixture, ME } from '../../../test/fixtures';
import { writeV0Cache, readV0Cache, cachedSnapshot, clearV0Cache } from '../v0Cache';
jest.mock('expo-file-system/legacy', () => ({ documentDirectory: 'file://documents/', writeAsStringAsync: jest.fn(), readAsStringAsync: jest.fn(), deleteAsync: jest.fn() }));
it('V0-EC-02 stores only the V0 snapshot for this account and can clear it', async () => {
  const snapshot = snapshotFixture(); snapshot.me.birthday = { month: 2, day: 29, year: 2000 };
  await writeV0Cache(ME, snapshot);
  const serialized = (FileSystem.writeAsStringAsync as jest.Mock).mock.calls[0][1] as string;
  expect(serialized).not.toContain('sceneDocument'); expect(serialized).not.toContain('promptSession'); expect(serialized).not.toContain('2000');
  (FileSystem.readAsStringAsync as jest.Mock).mockResolvedValue(serialized);
  const cached = await readV0Cache(ME);
  expect(cachedSnapshot(cached!).space).toEqual(snapshot.space);
  expect(await readV0Cache('other')).toBeNull();
  await clearV0Cache(ME);
  expect(FileSystem.deleteAsync).toHaveBeenCalledWith(expect.stringContaining(ME), { idempotent: true });
});
