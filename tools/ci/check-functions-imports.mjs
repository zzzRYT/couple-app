// Each Edge Function deploys as its own bundle, and importing another function's module has broken boots before
// (a top-level await cycle through account left lifecycle-sweep unable to start, #20). So a function imports only its
// own folder and _shared, and every function has an import_map in config.toml (milestones deployed without one, #21).
import { readdir, readFile } from 'node:fs/promises';
import { dirname, join, relative } from 'node:path';
const root = 'supabase/functions';
const config = await readFile('supabase/config.toml', 'utf8');
const failures = [];
for (const entry of await readdir(root, { withFileTypes: true, recursive: true })) {
  const file = join(entry.parentPath, entry.name);
  if (!entry.isFile() || !file.endsWith('.ts') || file.includes('/__tests__/')) continue;
  const owner = relative(root, file).split('/')[0];
  for (const [, specifier] of (await readFile(file, 'utf8')).matchAll(/(?:from|import)\s*\(?\s*['"](\.{1,2}\/[^'"]+)['"]/g)) {
    const target = relative(root, join(dirname(file), specifier)).split('/')[0];
    if (target !== owner && target !== '_shared' && target !== '..') failures.push(`${file} imports ${specifier}: move the shared code to ${root}/_shared/`);
  }
}
for (const entry of await readdir(root, { withFileTypes: true })) {
  if (entry.isDirectory() && !entry.name.startsWith('_') && !new RegExp(`^\\[functions\\.${entry.name}\\]\\nimport_map = `, 'm').test(config)) {
    failures.push(`supabase/config.toml has no [functions.${entry.name}] with import_map = "./functions/deno.json"`);
  }
}
if (failures.length) throw new Error(failures.join('\n'));
