// Boots every Edge Function in the local Edge Runtime (`supabase functions serve`) and fails when one cannot start.
// The Deno tests import handlers directly, so a module that only breaks inside the runtime (a native npm addon, an import
// cycle with top-level await) passes them. Here a booted function answers an unknown route with 4xx; a failed boot is 5xx.
import { spawn } from 'node:child_process';
import { readdir } from 'node:fs/promises';
const base = 'http://127.0.0.1:54321/functions/v1';
const names = (await readdir('supabase/functions', { withFileTypes: true }))
  .filter((entry) => entry.isDirectory() && !entry.name.startsWith('_')).map((entry) => entry.name);
const serve = spawn('supabase', ['functions', 'serve'], { stdio: ['ignore', 'pipe', 'pipe'] });
let log = '';
const ready = new Promise((resolve, reject) => {
  const read = (chunk) => { log += chunk; if (log.includes('Serving functions on')) resolve(); };
  serve.stdout.on('data', read);
  serve.stderr.on('data', read);
  serve.on('exit', (code) => reject(new Error(`supabase functions serve exited with ${code}\n${log}`)));
  setTimeout(() => reject(new Error(`supabase functions serve did not start\n${log}`)), 180_000).unref();
});
const failed = [];
try {
  await ready;
  for (const name of names) {
    const response = await fetch(`${base}/${name}/boot-check`, { signal: AbortSignal.timeout(120_000) });
    const body = await response.text();
    if (response.status >= 500) failed.push(`${name}: ${response.status} ${body.slice(0, 200)}`);
  }
} finally {
  serve.kill('SIGTERM');
}
if (failed.length) throw new Error(`Edge Functions failed to boot:\n${failed.join('\n')}\n${log.slice(-4000)}`);
console.log(`${names.length} Edge Functions booted`);
