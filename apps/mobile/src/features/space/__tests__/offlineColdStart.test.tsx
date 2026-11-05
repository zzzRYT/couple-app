import { renderHook, waitFor } from '@testing-library/react-native';
import { useSpaceSnapshot } from '../useSpaceSnapshot';
import { memoryRealtime } from '../../../lib/realtime';
import { snapshotFixture, ME } from '../../../test/fixtures';
import { readV0Cache } from '../v0Cache';
jest.mock('../v0Cache', () => ({
  readV0Cache: jest.fn(), writeV0Cache: jest.fn().mockResolvedValue(undefined),
  cachedSnapshot: (cache: { snapshotV0Part: unknown }) => cache.snapshotV0Part,
}));
it('V0-EC-02 seeds the last snapshot when the space lookup is offline', async () => {
  (readV0Cache as jest.Mock).mockResolvedValue({ savedAt: '2026-11-01T00:00:00Z', spaceId: 'space-1', snapshotV0Part: snapshotFixture() });
  const client = { mySpace: jest.fn().mockRejectedValue(new TypeError('offline')), snapshot: jest.fn().mockRejectedValue(new TypeError('offline')) };
  const realtime = memoryRealtime();
  const hook = await renderHook(() => useSpaceSnapshot({ client, realtime, userId: ME }));
  await waitFor(() => expect(hook.result.current.entry).toBe('active'));
  expect(hook.result.current.state.snapshot?.space.spaceId).toBe('space-1');
  expect(hook.result.current.state.offline).toBe(true);
});
it('V0-EC-03 and V0-F13-AC-04 open offline empty when no cache exists', async () => {
  (readV0Cache as jest.Mock).mockResolvedValue(null);
  const client = { mySpace: jest.fn().mockRejectedValue(new TypeError('offline')), snapshot: jest.fn() };
  const realtime = memoryRealtime();
  const hook = await renderHook(() => useSpaceSnapshot({ client, realtime, userId: ME }));
  await waitFor(() => expect(hook.result.current.entry).toBe('offlineEmpty'));
  expect(hook.result.current.state.snapshot).toBeNull();
});
