import { assert, assertEquals, assertNotEquals } from 'jsr:@std/assert@1';
import { ALPHABET, formatCode, generateCode, hashCode, normalizeCode } from '../inviteCode.ts';
Deno.test('codes are 8 characters from the unambiguous alphabet', () => {
  for (const ch of '0O1I') assert(!ALPHABET.includes(ch));
  for (let i = 0; i < 1000; i++) assert(/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{8}$/.test(generateCode()));
});
Deno.test('display uses 4-4 and input is normalized', () => {
  assertEquals(formatCode('K7M4Q9XP'), 'K7M4-Q9XP');
  assertEquals(normalizeCode(' k7m4-q9xp '), 'K7M4Q9XP');
  assertEquals(normalizeCode('k7m4 q9xp'), 'K7M4Q9XP');
  assertEquals(normalizeCode('K7M4-Q9X'), null);
  assertEquals(normalizeCode('K7M4-Q9X0'), null);
});
Deno.test('100,000 samples do not collide', () => {
  const seen = new Set<string>();
  for (let i = 0; i < 100_000; i++) seen.add(generateCode());
  assertEquals(seen.size, 100_000);
});
Deno.test('hash depends on the server pepper', async () => {
  const a = await hashCode('K7M4Q9XP', 'pepper-a'), b = await hashCode('K7M4Q9XP', 'pepper-b');
  assertEquals(a, await hashCode('K7M4Q9XP', 'pepper-a'));
  assertNotEquals(a, b);
  assert(!a.includes('K7M4'));
});
