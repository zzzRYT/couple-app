import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { test } from 'node:test';
import { SUPABASE_PROJECTS } from '../../../apps/mobile/src/config/supabase.ts';
import { CHANNEL, DEV_URL, buildEnv, sessionLink } from './aroom.mjs';

const dir = new URL('./', import.meta.url);
const text = (path) => readFileSync(new URL(path, dir), 'utf8');

test('the build points at Aroom-dev and drops inherited Aroom-prod values', () => {
  const env = buildEnv({ PATH: '/bin', EXPO_PUBLIC_SUPABASE_URL: 'https://x.supabase.co', EXPO_PUBLIC_SUPABASE_PROD_URL: 'p', EXPO_PUBLIC_SUPABASE_PROD_PUBLISHABLE_KEY: 'k', EAS_BUILD: 'true' }, 'sb_publishable_dev');
  assert.equal(env.EXPO_PUBLIC_SUPABASE_URL, DEV_URL);
  assert.ok(DEV_URL.includes(SUPABASE_PROJECTS.dev.ref));
  assert.equal(env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY, 'sb_publishable_dev');
  assert.equal(env.EXPO_PUBLIC_SUPABASE_PROD_URL, undefined);
  assert.equal(env.EXPO_PUBLIC_SUPABASE_PROD_PUBLISHABLE_KEY, undefined);
  assert.equal(env.EAS_BUILD, undefined);
  assert.equal(env.APP_VARIANT, 'development');
  assert.equal(env.HOT_UPDATER_CHANNEL, CHANNEL);
  assert.equal(env.PATH, '/bin');
});

test('the session link carries both tokens in the fragment the auth-callback route reads', () => {
  const link = new URL(sessionLink({ access_token: 'a.b.c', refresh_token: 'r1', expires_in: 3600 }));
  assert.equal(`${link.protocol}//${link.host}`, 'aroom-dev://auth-callback');
  const fragment = new URLSearchParams(link.hash.slice(1));
  assert.equal(fragment.get('access_token'), 'a.b.c');
  assert.equal(fragment.get('refresh_token'), 'r1');
  assert.equal(fragment.get('type'), 'magiclink');
});

test('every flow drives the development app', () => {
  for (const file of readdirSync(new URL('flows/', dir))) {
    assert.match(text(`flows/${file}`), /^appId: com\.jinjinstar\.aroom\.dev\n---\n/, file);
  }
});

test('each feature file keeps the map contract, is indexed, and names only flows that exist', () => {
  const flows = new Set(readdirSync(new URL('flows/', dir)).map((file) => file.replace(/\.yaml$/, '')));
  const index = text('features/README.md');
  const features = readdirSync(new URL('features/', dir)).filter((file) => file !== 'README.md');
  assert.ok(features.length >= 3, 'seed at least three features');
  for (const file of features) {
    const body = text(`features/${file}`);
    assert.match(body, /^# \S/, `${file} starts with an H1`);
    const sections = [...body.matchAll(/^## (.+)$/gm)].map((match) => match[1]);
    assert.deepEqual(sections, ['Sub-features', 'How to get to it (user POV)', 'Driving it with aroom.mjs', 'Gotchas'], file);
    assert.ok(index.includes(`(./${file})`), `${file} is linked from features/README.md`);
    for (const [, flow] of body.matchAll(/aroom\.mjs drive ([\w-]+)/g)) assert.ok(flows.has(flow), `${file} drives missing flow ${flow}`);
  }
});
