import assert from 'node:assert/strict';
import test from 'node:test';
import { nextNumber, releaseEnv, releaseMessage } from './ota-release.mjs';

const SHA = '747e65e'.padEnd(40, '0');

test('the first OTA of a version is 1', () => {
  assert.equal(nextNumber(''), 1);
});

test('the next OTA follows the highest tag, ignoring peeled and unrelated refs', () => {
  const lsRemote = [
    `${SHA}\trefs/tags/v1.0.1-ota.1`,
    `${SHA}\trefs/tags/v1.0.1-ota.10`,
    `${SHA}\trefs/tags/v1.0.1-ota.10^{}`,
    `${SHA}\trefs/tags/v1.0.1-ota.2`,
    `${SHA}\trefs/tags/v1.0.1-ota.3-retry`,
  ].join('\n');
  assert.equal(nextNumber(lsRemote), 11);
});

test('a preview bundle message names the tag, title and commit of its production release', () => {
  const message = releaseMessage('1.0.1 (2)', SHA, '홈 문구 수정');
  assert.equal(releaseEnv({ id: 'b', message }), `OTA_TAG=v1.0.1-ota.2\nOTA_TITLE=1.0.1 (2)\nOTA_SHA=${SHA}\n`);
});

test('a bundle deployed without a release number cannot be promoted', () => {
  assert.throws(() => releaseEnv({ id: 'b', message: '홈 문구 수정' }), /carries no release number/);
  assert.throws(() => releaseEnv({ id: 'b', message: null }), /carries no release number/);
});

test('the rest of the message never reaches GITHUB_ENV', () => {
  assert.doesNotMatch(releaseEnv({ id: 'b', message: releaseMessage('1.0.1 (2)', SHA, 'x\nOTA_TAG=v9.9.9-ota.9') }), /9\.9\.9/);
});
