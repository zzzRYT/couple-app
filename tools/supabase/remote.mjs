// Runs one Supabase CLI command on one hosted project, with that project's own access token (docs/remote-supabase-setup.md).
//   node tools/supabase/remote.mjs dev db push
//   node tools/supabase/remote.mjs prod functions deploy account
// Each token is scoped to its own project, so a token paired with the wrong ref fails instead of changing the other project.
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { createInterface } from 'node:readline/promises';
import { fileURLToPath } from 'node:url';
import { SUPABASE_PROJECTS } from '../../apps/mobile/src/config/supabase.ts';

export const CLI = 'supabase@3.0.0';
export const TARGETS = {
  dev: { ...SUPABASE_PROJECTS.dev, envFile: join(homedir(), '.config/aroom/supabase-dev.env') },
  prod: { ...SUPABASE_PROJECTS.prod, envFile: join(homedir(), '.config/aroom/supabase.env') },
};

/** Only the access token leaves the file; a database password or ref in it never reaches the CLI. */
export function accessToken(text) {
  return text.match(/^SUPABASE_ACCESS_TOKEN=["']?([^"'\s]+)["']?\s*$/m)?.[1] ?? null;
}

/** The ref goes on every command, so the linked project (supabase/.temp) never decides where a change lands. */
export function cliArgs(target, args) {
  if (args.some((arg) => arg === '--remote' || arg.startsWith('--remote=') || arg === '--linked' || arg === '--project-ref' || arg.startsWith('--project-ref=') || arg === '--db-url' || arg.startsWith('--db-url='))) {
    throw new Error('Pass the command only; this script adds --remote for the target');
  }
  return ['--yes', CLI, ...args, `--remote=${TARGETS[target].ref}`];
}

/** CLI environment: inherited Supabase credentials are dropped so they cannot override the target's token. */
export function cliEnv(env, token) {
  const clean = Object.fromEntries(Object.entries(env).filter(([name]) => !/^SUPABASE_(ACCESS_TOKEN|DB_PASSWORD|PROJECT_ID|PROJECT_REF)$/.test(name)));
  return { ...clean, SUPABASE_ACCESS_TOKEN: token };
}

async function main([target, ...args]) {
  if (!(target in TARGETS) || args.length === 0) {
    console.error('usage: node tools/supabase/remote.mjs dev|prod <supabase command…>');
    return 2;
  }
  const { name, ref, envFile } = TARGETS[target];
  let token;
  try {
    token = accessToken(readFileSync(envFile, 'utf8'));
  } catch {
    token = null;
  }
  if (!token) {
    console.error(`${envFile} has no SUPABASE_ACCESS_TOKEN for ${name} (docs/remote-supabase-setup.md)`);
    return 1;
  }
  if (target === 'prod' && process.env.AROOM_CONFIRM_PROD !== ref) {
    const prompt = createInterface({ input: process.stdin, output: process.stderr });
    const answer = await prompt.question(`Run "supabase ${args.join(' ')}" on ${name}. Type ${ref} to continue: `);
    prompt.close();
    if (answer.trim() !== ref) {
      console.error('Cancelled; nothing ran.');
      return 1;
    }
  }
  console.error(`${name} (${ref}): supabase ${args.join(' ')}`);
  const root = fileURLToPath(new URL('../../', import.meta.url));
  return spawnSync('npx', cliArgs(target, args), { cwd: root, env: cliEnv(process.env, token), stdio: 'inherit' }).status ?? 1;
}

if (fileURLToPath(import.meta.url) === process.argv[1]) process.exitCode = await main(process.argv.slice(2));
