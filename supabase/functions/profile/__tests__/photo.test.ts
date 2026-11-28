import { assert, assertEquals, assertMatch } from 'jsr:@std/assert@1';
import { Image } from 'https://deno.land/x/imagescript@1.3.0/mod.ts';
import type { Deps } from '../../_shared/http.ts';
import type { IdempotencyStore } from '../../_shared/idempotency.ts';
import { profileHandler } from '../index.ts';

const user = '00000000-0000-4000-8000-000000000091';
const base64 = (bytes: Uint8Array) => btoa(Array.from(bytes, (byte) => String.fromCharCode(byte)).join(''));
const photo = base64(await new Image(700, 512).encodeJPEG(80));

// In-memory stand-ins for set_profile_photo and the profile-photo bucket.
function setup({ rpcFails = false } = {}) {
  const profile = { path: null as string | null };
  const objects = new Set<string>();
  const stored = new Map<string, unknown>();
  const idempotency: IdempotencyStore = { async get(key) { return stored.get(key); }, async put(key, value) { stored.set(key, value); } };
  const deps: Deps = {
    db: { async rpc<T>(name: string, args: Record<string, unknown>) {
      assertEquals([name, args.actor], ['set_profile_photo', user]);
      if (rpcFails) throw new Error('DB_ERROR');
      const previous = profile.path;
      profile.path = args.p_path as string | null;
      return { previous } as T;
    } },
    verifier: { async getUser() { return { user: { id: user }, error: null }; } },
    idempotency,
  };
  const uploads: Uint8Array[] = [];
  const handler = profileHandler(deps, {
    async upload(path, bytes) { objects.add(path); uploads.push(bytes); },
    async remove(paths) { for (const path of paths) objects.delete(path); },
  });
  const send = async (method: string, body: Record<string, unknown>) => {
    const response = await handler(new Request('http://local/functions/v1/profile/profile/photo', { method, headers: { Authorization: 'Bearer token', 'Content-Type': 'application/json' }, body: JSON.stringify({ idempotencyKey: crypto.randomUUID(), ...body }) }));
    const text = await response.text();
    return { status: response.status, body: text ? JSON.parse(text) : null };
  };
  return { send, profile, objects, uploads };
}

Deno.test('uploading stores a 512x512 JPEG under the person and points the profile at it', async () => {
  const s = setup();
  assertEquals(await s.send('PUT', { image: photo }), { status: 204, body: null });
  assertMatch(s.profile.path!, new RegExp(`^${user}/[0-9a-f-]{36}\\.jpg$`));
  assertEquals([...s.objects], [s.profile.path]);
  const stored = await Image.decode(s.uploads[0]!);
  assertEquals([stored.width, stored.height], [512, 512]);
});

Deno.test('replacing a photo removes the old object and deleting removes the current one', async () => {
  const s = setup();
  await s.send('PUT', { image: photo });
  const first = s.profile.path;
  assertEquals((await s.send('PUT', { image: photo })).status, 204);
  assert(s.profile.path !== first);
  assertEquals([...s.objects], [s.profile.path], 'only the new photo is left');
  assertEquals(await s.send('DELETE', {}), { status: 204, body: null });
  assertEquals([s.profile.path, s.objects.size], [null, 0]);
  assertEquals((await s.send('DELETE', {})).status, 204, 'removing with no photo is still a success');
});

Deno.test('bad base64, oversize and non-JPEG images are 400 and store nothing', async () => {
  const s = setup();
  const png = base64(await new Image(64, 64).encode());
  for (const image of ['not base64!', 'A'.repeat(1_400_001), png, '', 42]) {
    const { status, body } = await s.send('PUT', { image });
    assertEquals([status, body.error.code], [400, 'INVALID_REQUEST']);
  }
  assertEquals([s.objects.size, s.profile.path], [0, null]);
});

Deno.test('a refused profile update removes the object it just uploaded', async () => {
  const s = setup({ rpcFails: true });
  assertEquals((await s.send('PUT', { image: photo })).status, 503);
  assertEquals(s.objects.size, 0);
});
