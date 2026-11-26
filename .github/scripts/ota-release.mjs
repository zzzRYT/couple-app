import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

// Release numbers for Hot Updater bundles (docs/ota.md#release-numbers). A preview bundle is built as "<version> (<N>)"
// with that string and its commit at the start of its message; promoting it to production tags the commit v<version>-ota.<N>.

/** The next OTA number from `git ls-remote --tags origin 'refs/tags/v<version>-ota.*'` output. */
export const nextNumber = (lsRemote) =>
  Math.max(0, ...[...lsRemote.matchAll(/-ota\.(\d+)$/gm)].map((match) => Number(match[1]))) + 1;

export const releaseMessage = (release, sha, message) => `${release} · ${sha} · ${message}`;

const MESSAGE = /^(\d+\.\d+\.\d+) \((\d+)\) · ([0-9a-f]{40}) · /;

/** GITHUB_ENV lines naming the release of a bundle, from `hot-updater bundle show --json`. */
export function releaseEnv(bundle) {
  const match = MESSAGE.exec(bundle.message ?? '');
  if (!match) throw new Error(`Bundle ${bundle.id} carries no release number in its message; deploy a preview bundle with the OTA workflow`);
  const [, version, number, sha] = match;
  return `OTA_TAG=v${version}-ota.${number}\nOTA_TITLE=${version} (${number})\nOTA_SHA=${sha}\n`;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [command, ...args] = process.argv.slice(2);
  if (command === 'next') process.stdout.write(`${nextNumber(readFileSync(0, 'utf8'))}\n`);
  else if (command === 'message') process.stdout.write(releaseMessage(...args));
  else if (command === 'env') process.stdout.write(releaseEnv(JSON.parse(readFileSync(args[0], 'utf8'))));
  else throw new Error('usage: ota-release.mjs next < ls-remote | message <release> <sha> <message> | env <bundle.json>');
}
