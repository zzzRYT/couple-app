import { act, renderHook } from '@testing-library/react-native';
import { useRoom } from '../useRoom';
import { snapshotFixture } from '../../../test/fixtures';
const version = (n: number) => ({ ...snapshotFixture(), versionNumber: n });
const state = (snapshot: ReturnType<typeof version>, offline = false) => ({ status: 'ready' as const, snapshot, offline, lastSyncedAt: snapshot.serverTime });

it('uses the shared snapshot and keeps offline rooms read-only', async () => {
  const client = { snapshot: jest.fn(), mascotRecall: jest.fn() };
  const refresh = jest.fn();
  const hook = await renderHook(() => useRoom('space-1', { client }, { state: state(version(3), true), refresh }));
  expect(hook.result.current.snapshot?.versionNumber).toBe(3);
  expect(hook.result.current.readOnly).toBe(true);
  await act(async () => { expect(await hook.result.current.recall()).toBe('offline'); });
  expect(client.mascotRecall).not.toHaveBeenCalled();
});

it('recalls using the shared version and refreshes the shared snapshot once', async () => {
  const client = { snapshot: jest.fn(), mascotRecall: jest.fn().mockResolvedValue({ versionNumber: 2 }) };
  const refresh = jest.fn();
  const hook = await renderHook(() => useRoom('space-1', { client }, { state: state(version(1)), refresh }));
  await act(async () => { expect(await hook.result.current.recall()).toBe('ok'); });
  expect(client.mascotRecall).toHaveBeenCalledWith('space-1', 1);
  expect(refresh).toHaveBeenCalledTimes(1);
});
