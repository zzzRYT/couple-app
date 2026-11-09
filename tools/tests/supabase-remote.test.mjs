import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { TARGETS, accessToken, cliArgs, cliEnv } from '../supabase/remote.mjs';

const script = new URL('../supabase/remote.mjs', import.meta.url).pathname;

test('each target pairs its own ref with its own token file', () => {
  assert.equal(TARGETS.dev.name, 'Aroom-dev');
  assert.equal(TARGETS.prod.name, 'Aroom-prod');
  assert.notEqual(TARGETS.dev.ref, TARGETS.prod.ref);
  assert.match(TARGETS.dev.envFile, /\.config\/aroom\/supabase-dev\.env$/);
  assert.match(TARGETS.prod.envFile, /\.config\/aroom\/supabase\.env$/);
});

test('every command carries the target ref and never the linked project', () => {
  assert.deepEqual(cliArgs('dev', ['db', 'push']).slice(-3), ['db', 'push', `--remote=${TARGETS.dev.ref}`]);
  assert.equal(cliArgs('prod', ['functions', 'deploy', 'account']).at(-1), `--remote=${TARGETS.prod.ref}`);
  for (const flag of ['--remote', `--remote=${TARGETS.prod.ref}`, '--linked', '--project-ref', '--db-url=postgres://x']) {
    assert.throws(() => cliArgs('dev', ['db', 'push', flag]), /adds --remote for the target/);
  }
});

test('only the access token reaches the CLI', () => {
  assert.equal(accessToken('SUPABASE_DB_PASSWORD=pw\nSUPABASE_ACCESS_TOKEN="sbp_abc"\n'), 'sbp_abc');
  assert.equal(accessToken('SUPABASE_DB_PASSWORD=pw\n'), null);
  const env = cliEnv({ PATH: '/bin', SUPABASE_ACCESS_TOKEN: 'other', SUPABASE_DB_PASSWORD: 'pw', SUPABASE_PROJECT_REF: 'x' }, 'sbp_abc');
  assert.deepEqual(env, { PATH: '/bin', SUPABASE_ACCESS_TOKEN: 'sbp_abc' });
});

test('an unknown target or a missing command runs nothing', () => {
  for (const args of [[], ['staging', 'db', 'push'], ['dev']]) {
    const run = spawnSync(process.execPath, [script, ...args], { encoding: 'utf8' });
    assert.equal(run.status, 2);
    assert.match(run.stderr, /usage: node tools\/supabase\/remote\.mjs dev\|prod/);
  }
});

test('prod runs only after its ref is typed, and a missing token stops first', async () => {
  const home = await mkdtemp(join(tmpdir(), 'aroom-remote-'));
  const run = (input) => spawnSync(process.execPath, [script, 'prod', 'migration', 'list'], { encoding: 'utf8', input, env: { ...process.env, HOME: home, AROOM_CONFIRM_PROD: '' } });
  try {
    let result = run('');
    assert.equal(result.status, 1);
    assert.match(result.stderr, /has no SUPABASE_ACCESS_TOKEN for Aroom-prod/);
    await mkdir(join(home, '.config/aroom'), { recursive: true });
    await writeFile(join(home, '.config/aroom/supabase.env'), 'SUPABASE_ACCESS_TOKEN=sbp_fake\n');
    result = run('Aroom-prod\n');
    assert.equal(result.status, 1);
    assert.match(result.stderr, new RegExp(`Type ${TARGETS.prod.ref} to continue`));
    assert.match(result.stderr, /Cancelled; nothing ran/);
  } finally {
    await rm(home, { recursive: true, force: true });
  }
});
