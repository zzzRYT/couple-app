import { createClient } from '@supabase/supabase-js';
import { supabaseRealtime } from '../realtime';

it('keeps the shared channel alive until its last listener releases', async () => {
  const client = createClient('http://localhost:54321', 'test-key');
  const channel = client.channel('space:space-1', { config: { private: true } });
  expect(client.channel('space:space-1', { config: { private: true } })).toBe(channel);
  let receive: ((message: { event: string; payload: Record<string, string> }) => void) | undefined;
  jest.spyOn(channel, 'on').mockImplementation((type: string, filter: unknown, callback: (message: { event: string; payload: Record<string, string> }) => void) => {
    if (type === 'broadcast') receive = callback;
    return channel as never;
  });
  jest.spyOn(channel, 'subscribe').mockImplementation((callback) => { callback?.('SUBSCRIBED' as never); return channel; });
  const remove = jest.spyOn(client, 'removeChannel').mockResolvedValue('ok');
  const realtime = supabaseRealtime(client);
  const first = jest.fn();
  const second = jest.fn();
  const releaseFirst = realtime.subscribe('space-1', first);
  const releaseSecond = realtime.subscribe('space-1', second);
  receive?.({ event: 'room_version', payload: { versionNumber: '2' } });
  expect(first).toHaveBeenCalledTimes(1);
  expect(second).toHaveBeenCalledTimes(1);
  releaseFirst();
  expect(remove).not.toHaveBeenCalled();
  receive?.({ event: 'room_version', payload: { versionNumber: '3' } });
  expect(first).toHaveBeenCalledTimes(1);
  expect(second).toHaveBeenCalledTimes(2);
  releaseSecond();
  expect(remove).toHaveBeenCalledTimes(1);
});
