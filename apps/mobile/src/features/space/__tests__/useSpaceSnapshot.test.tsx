import { act, renderHook, waitFor } from '@testing-library/react-native';
import { AppState } from 'react-native';
import { useSpaceSnapshot } from '../useSpaceSnapshot';
import { memoryRealtime } from '../../../lib/realtime';
import { snapshotFixture } from '../../../test/fixtures';

function fakeServer() {
  let memberCount = 1;
  const realtime = memoryRealtime();
  const clientFor = () => ({
    mySpace: jest.fn(async () => ({ active: { spaceId: 'space-1' }, ended: null })),
    snapshot: jest.fn(async () => snapshotFixture({ memberCount })),
  });
  return { realtime, clientFor, accept() { memberCount = 2; realtime.emit('space-1', { event: 'member', payload: { memberCount: 2 } }); } };
}

it('updates the inviter after the partner accepts on another device', async () => {
  const server = fakeServer();
  const client = server.clientFor();
  const inviter = await renderHook(() => useSpaceSnapshot({ client, realtime: server.realtime }));
  await waitFor(() => expect(inviter.result.current.state.snapshot?.space.memberCount).toBe(1));
  expect(inviter.result.current.entry).toBe('active');
  await act(async () => { server.accept(); });
  await waitFor(() => expect(inviter.result.current.state.snapshot?.space.memberCount).toBe(2));
});

it('routes to the ended notice or to space creation when there is no active space', async () => {
  const realtime = memoryRealtime();
  const ended = await renderHook(() => useSpaceSnapshot({ client: { mySpace: async () => ({ active: null, ended: { kind: 'ended', by: 'partner', at: '2026-10-27T00:00:00Z' } }), snapshot: jest.fn() }, realtime }));
  await waitFor(() => expect(ended.result.current.entry).toBe('ended'));
  const none = await renderHook(() => useSpaceSnapshot({ client: { mySpace: async () => ({ active: null, ended: null }), snapshot: jest.fn() }, realtime }));
  await waitFor(() => expect(none.result.current.entry).toBe('none'));
});

it('refetches on foreground and keeps the last snapshot read-only when offline', async () => {
  const listeners: ((state: string) => void)[] = [];
  jest.spyOn(AppState, 'addEventListener').mockImplementation((_type, listener) => { listeners.push(listener as (state: string) => void); return { remove: jest.fn() }; });
  const snapshot = jest.fn().mockResolvedValueOnce(snapshotFixture()).mockRejectedValueOnce(new TypeError('Network request failed'));
  const client = { mySpace: async () => ({ active: { spaceId: 'space-1' }, ended: null }), snapshot };
  const realtime = memoryRealtime();
  const hook = await renderHook(() => useSpaceSnapshot({ client, realtime }));
  await waitFor(() => expect(hook.result.current.state.status).toBe('ready'));
  await act(async () => { for (const listener of listeners) listener('active'); });
  await waitFor(() => expect(hook.result.current.state.offline).toBe(true));
  expect(snapshot).toHaveBeenCalledTimes(2);
  expect(hook.result.current.state.snapshot?.space.spaceId).toBe('space-1');
});
