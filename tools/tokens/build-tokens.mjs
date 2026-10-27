import { readFile, writeFile } from 'node:fs/promises';
const source = JSON.parse(await readFile('design/tokens.json', 'utf8'));
await writeFile('apps/mobile/src/theme/tokens.ts', `// Generated from design/tokens.json by tools/tokens/build-tokens.mjs.\nexport const tokens = ${JSON.stringify(source, null, 2)} as const;\n`);
