import { act, renderHook, waitFor } from '@testing-library/react-native';
import { AppState } from 'react-native';
import { useRoom } from '../useRoom';
import { memoryRealtime } from '../../../lib/realtime';
import { snapshotFixture } from '../../../test/fixtures';
afterEach(() => jest.restoreAllMocks());
const version = (n: number) => ({ ...snapshotFixture(), versionNumber: n });

it('stays read-only offline, sends nothing, and shows the latest version after reconnecting', async () => {
  const listeners: ((state: string) => void)[] = [];
  jest.spyOn(AppState, 'addEventListener').mockImplementation((_type, listener) => { listeners.push(listener as (state: string) => void); return { remove: jest.fn() }; });
  const snapshot = jest.fn().mockResolvedValueOnce(version(1)).mockRejectedValueOnce(new TypeError('Network request failed')).mockResolvedValueOnce(version(3));
  const client = { snapshot, mascotRecall: jest.fn() };
  const realtime = memoryRealtime();
  const hook = await renderHook(() => useRoom('space-1', { client, realtime }));
  await waitFor(() => expect(hook.result.current.snapshot?.versionNumber).toBe(1));
  await act(async () => { for (const listener of listeners) listener('active'); });
  await waitFor(() => expect(hook.result.current.readOnly).toBe(true));
  expect(hook.result.current.snapshot?.versionNumber).toBe(1);
  await act(async () => { expect(await hook.result.current.recall()).toBe('offline'); });
  expect(client.mascotRecall).not.toHaveBeenCalled();
  await act(async () => { realtime.emit('space-1', { event: 'room_version', payload: { versionNumber: 3 } }); });
  await waitFor(() => expect(hook.result.current.snapshot?.versionNumber).toBe(3));
  expect(hook.result.current.readOnly).toBe(false);
  expect(client.mascotRecall).not.toHaveBeenCalled();
});

it('refetches after a Realtime room change from the partner', async () => {
  const snapshot = jest.fn().mockResolvedValueOnce(version(1)).mockResolvedValueOnce(version(2));
  const realtime = memoryRealtime();
  const client = { snapshot, mascotRecall: jest.fn() };
  const hook = await renderHook(() => useRoom('space-1', { client, realtime }));
  await waitFor(() => expect(hook.result.current.snapshot?.versionNumber).toBe(1));
  await act(async () => { realtime.emit('space-1', { event: 'room_version', payload: { versionNumber: 2 } }); });
  await waitFor(() => expect(hook.result.current.snapshot?.versionNumber).toBe(2));
});
