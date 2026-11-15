import { readPlayfulPreference, writePlayfulPreference } from '../playfulPreference';

it('defaults off and keeps each person and space separate on the device', async () => {
  const values = new Map<string, string>();
  const store = { getItemAsync: async (key: string) => values.get(key) ?? null, setItemAsync: async (key: string, value: string) => { values.set(key, value); } };
  expect(await readPlayfulPreference('space-a', 'person-a', store)).toBe(false);
  await writePlayfulPreference('space-a', 'person-a', true, store);
  expect(await readPlayfulPreference('space-a', 'person-a', store)).toBe(true);
  expect(await readPlayfulPreference('space-a', 'person-b', store)).toBe(false);
  expect(await readPlayfulPreference('space-b', 'person-a', store)).toBe(false);
  await writePlayfulPreference('space-a', 'person-a', false, store);
  expect(await readPlayfulPreference('space-a', 'person-a', store)).toBe(false);
});
