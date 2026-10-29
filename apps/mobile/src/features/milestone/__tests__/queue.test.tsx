import { act, renderHook, waitFor } from '@testing-library/react-native';
import { useMilestone } from '../useMilestone';
import type { MilestoneResponse } from '../../../lib/client';

const mockSecureStore = new Map<string, string>();
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async (key: string) => mockSecureStore.get(key) ?? null),
  setItemAsync: jest.fn(async (key: string, value: string) => { mockSecureStore.set(key, value); }),
  deleteItemAsync: jest.fn(async (key: string) => { mockSecureStore.delete(key); }),
}));

const celebration = { id: 'event-a', key: 'd100', kind: 'day' as const, days: 100, anniversaryN: null, milestoneDate: '2026-10-27', daysAgo: 0, seenByMe: false, presetAvailable: true, presetId: 'milestone-day' as const };
const response: MilestoneResponse = { dayCount: 100, timezone: 'Asia/Seoul', celebration, upcoming: [] };

beforeEach(() => { mockSecureStore.clear(); });

it('queues only the cached verified card offline and replays its close once on reconnect', async () => {
  const api = { milestones: jest.fn().mockResolvedValue(response), milestoneSeen: jest.fn().mockResolvedValue(undefined) };
  const { result, rerender } = await renderHook<ReturnType<typeof useMilestone>, { online: boolean }>(({ online }) => useMilestone('space-a', 'user-a', online, api as never, 'home', true), { initialProps: { online: true } });
  await waitFor(() => expect(result.current.celebration?.id).toBe('event-a'));
  await rerender({ online: false });
  await waitFor(() => expect(result.current.celebration?.id).toBe('event-a'));
  await act(async () => { await result.current.seen(celebration); });
  expect(result.current.celebration).toBeNull();
  expect(JSON.parse(mockSecureStore.get('milestone:space-a:user-a')!).pending).toEqual(['event-a']);
  await rerender({ online: true });
  await waitFor(() => expect(api.milestoneSeen).toHaveBeenCalledTimes(1));
  await waitFor(() => expect(result.current.preset?.seenByMe).toBe(true));
  expect(JSON.parse(mockSecureStore.get('milestone:space-a:user-a')!).pending).toEqual([]);
});

it('does not show stale cached cards for an online server error', async () => {
  mockSecureStore.set('milestone:space-a:user-a', JSON.stringify({ value: response, pending: [] }));
  const api = { milestones: jest.fn(), milestoneSeen: jest.fn() };
  const { result } = await renderHook(() => useMilestone('space-a', 'user-a', false, api as never, 'home', false));
  await waitFor(() => expect(result.current.value).toBeNull());
  expect(result.current.celebration).toBeNull();
});
