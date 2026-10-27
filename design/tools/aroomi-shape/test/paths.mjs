// Shared locations for the tests (not a test file).
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync, readdirSync, existsSync } from 'node:fs';

const here = dirname(fileURLToPath(import.meta.url));
export const repoRoot = resolve(here, '../../../..');
export const SAMPLES = join(repoRoot, 'specs/001-couple-prompt-todo/contracts/samples/generated-object');
export const SCHEMA_FILE = join(repoRoot, 'specs/001-couple-prompt-todo/contracts/generated-object.schema.json');
export const LIBRARY = join(repoRoot, 'design/reference-library');
export const TOKENS = join(repoRoot, 'design/tokens.json');
export const SKETCHES = join(repoRoot, 'design/assets-sketch');

export const jsonFiles = dir => (existsSync(dir) ? readdirSync(dir).filter(f => f.endsWith('.json') && !f.startsWith('_')).sort() : []);
export const readText = p => readFileSync(p, 'utf8');
export const readJson = p => JSON.parse(readText(p));
export const libraryIndex = () => readJson(join(LIBRARY, 'reference-library.json'));

// seeded PRNG (mulberry32) so the fuzz test is reproducible
export function rng(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
