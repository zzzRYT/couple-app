import { assertEquals } from 'jsr:@std/assert@1';
import type { Deps } from '../../_shared/http.ts';
import { spacesHandler } from '../index.ts';

const space = '10000000-0000-4000-8000-000000000092';
const me = '00000000-0000-4000-8000-000000000092';
const partner = '00000000-0000-4000-8000-000000000093';

function snapshotWith(photoPaths: Record<string, string>, sign: (paths: string[], seconds: number) => Promise<Record<string, string>>) {
  const deps: Deps = {
    db: { async rpc<T>(name: string, args: Record<string, unknown>) {
      assertEquals([args.actor, args.target], [me, space]);
      if (name === 'space_snapshot') return { space: { spaceId: space }, members: [{ userId: me, displayName: '하루' }, { userId: partner, displayName: '보리' }], me: { userId: me, displayName: '하루' } } as T;
      if (name === 'space_member_photos') return photoPaths as T;
      throw new Error(`unexpected rpc ${name}`);
    } },
    verifier: { async getUser() { return { user: { id: me }, error: null }; } },
    idempotency: { async get() { return undefined; }, async put() {} },
  };
  return spacesHandler(deps, { sign })(new Request(`http://local/functions/v1/spaces/spaces/${space}/snapshot`, { headers: { Authorization: 'Bearer token' } })).then((response) => response.json());
}

Deno.test('the snapshot carries a six-hour signed photo URL for me and my partner, signed in one call', async () => {
  const calls: [string[], number][] = [];
  const body = await snapshotWith({ [me]: `${me}/a.jpg`, [partner]: `${partner}/b.jpg` }, async (paths, seconds) => {
    calls.push([paths, seconds]);
    return Object.fromEntries(paths.map((path) => [path, `https://signed.example/${path}`]));
  });
  assertEquals(body.members.map((m: { photo: string | null }) => m.photo), [`https://signed.example/${me}/a.jpg`, `https://signed.example/${partner}/b.jpg`]);
  assertEquals(body.me.photo, `https://signed.example/${me}/a.jpg`);
  assertEquals(calls, [[[`${me}/a.jpg`, `${partner}/b.jpg`], 21600]]);
});

Deno.test('a member without a photo, or a signing failure, gives photo null without failing the snapshot', async () => {
  const partial = await snapshotWith({ [partner]: `${partner}/b.jpg` }, async (paths) => Object.fromEntries(paths.map((path) => [path, 'https://signed.example/b'])));
  assertEquals([partial.me.photo, partial.members[1].photo], [null, 'https://signed.example/b']);
  const failed = await snapshotWith({ [partner]: `${partner}/b.jpg` }, () => Promise.reject(new Error('STORAGE_ERROR')));
  assertEquals([failed.space.spaceId, failed.me.photo, failed.members.map((m: { photo: string | null }) => m.photo)], [space, null, [null, null]]);
});
