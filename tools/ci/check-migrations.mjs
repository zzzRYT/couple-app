import { readdir, readFile } from 'node:fs/promises';
const dir = 'supabase/migrations';
for (const name of (await readdir(dir)).filter((name) => name.endsWith('.sql'))) {
  const file = await readFile(`${dir}/${name}`, 'utf8');
  const header = file.split('\n').slice(0, 10).join('\n');
  if (!/^-- (rollback|deletion-policy):\s*\S/im.test(header)) throw new Error(`${name} has no rollback or deletion policy in its header`);
}
