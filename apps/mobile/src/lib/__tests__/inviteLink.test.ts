import { parseInvite, peekPendingInvite, savePendingInvite, takePendingInvite } from '../inviteLink';

test('only accepts complete codes and trusted invite URLs', () => {
  expect(parseInvite('https://aroom.jinjinstar.com/i/ab12-cd34')).toBe('AB12CD34');
  expect(parseInvite('aroom://invite/AB12-CD34')).toBe('AB12CD34');
  expect(parseInvite('AB12CD34')).toBe('AB12CD34');
  expect(parseInvite('https://evil.example/i/AB12-CD34')).toBeNull();
  expect(parseInvite('https://aroom.jinjinstar.com/i/AB12-CD34?tracking=1')).toBeNull();
});
test('pending invitation survives reads until consumed', async () => {
  let value: string | null = null;
  const storage = { getItemAsync: jest.fn(async () => value), setItemAsync: jest.fn(async (_: string, v: string) => { value = v; }), deleteItemAsync: jest.fn(async () => { value = null; }) };
  await savePendingInvite('AB12-CD34', storage);
  expect(await peekPendingInvite(storage)).toBe('AB12CD34');
  expect(await takePendingInvite(storage)).toBe('AB12CD34');
  expect(await peekPendingInvite(storage)).toBeNull();
});
