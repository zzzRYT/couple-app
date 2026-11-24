// A raw `npx supabase` remote command resolves an unpinned CLI and may land on the local or the linked project (#35),
// and agents copy commands from docs. tools/supabase/remote.mjs pins the CLI and names the project on every call.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
const failures = [];
for (const file of execFileSync('git', ['ls-files', '*.md'], { encoding: 'utf8' }).split('\n').filter(Boolean)) {
  readFileSync(file, 'utf8').split('\n').forEach((line, index) => {
    if (/npx (-y )?supabase(@\S+)? (db push|functions deploy|secrets set|link)\b/.test(line)) failures.push(`${file}:${index + 1}: use node tools/supabase/remote.mjs <dev|prod> … instead of npx supabase`);
  });
}
if (failures.length) throw new Error(failures.join('\n'));
