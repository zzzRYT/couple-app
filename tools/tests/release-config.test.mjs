import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { EasJsonAccessor, EasJsonUtils } from '@expo/eas-json';

const root = new URL('../../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

test('V0-F14-AC-01 testflight profile is store signed and submits after a successful build', async () => {
  const accessor = EasJsonAccessor.fromProjectPath(new URL('apps/mobile/', root).pathname);
  const eas = await accessor.readAsync();
  await EasJsonUtils.getBuildProfileAsync(accessor, 'ios', 'testflight');
  assert.equal(eas.build.testflight.distribution, 'store');
  assert.equal(eas.build.testflight.channel, 'preview');
  assert.equal(eas.build.testflight.autoIncrement, true);
  assert.equal(eas.build.testflight.env.APP_VARIANT, 'preview');
  assert.equal(eas.build.production.channel, 'production');
  assert.equal(eas.submit.testflight.ios.appleTeamId, '43ZASDF2J7');
  assert.equal(eas.submit.testflight.ios.ascAppId, 'ASC_APP_ID_REQUIRED');
  const workflow = await read('.github/workflows/release-ios.yml');
  assert.match(workflow, /workflow_dispatch/);
  const buildStep = workflow.split('      - name: Build (and submit on success)')[1];
  assert.ok(buildStep);
  assert.match(buildStep, /--auto-submit-with-profile testflight/);
  assert.match(buildStep, /--wait/);
  assert.equal(workflow.match(/--auto-submit-with-profile testflight/g)?.length, 1);
});

test('V0-F14-AC-03 preview runtime uses fingerprint and preview OTA environment', async () => {
  const prior = process.env.APP_VARIANT;
  process.env.APP_VARIANT = 'preview';
  try {
    const { default: config } = await import('../../apps/mobile/app.config.ts?v=preview');
    assert.equal(config.expo.ios.bundleIdentifier, 'com.jinjinstar.aroom.dev');
    assert.equal(config.expo.runtimeVersion.policy, 'fingerprint');
    assert.match(config.expo.updates.url, /99310e9a-4aee-4116-b9da-b6a26460f7e3$/);
  } finally {
    if (prior === undefined) delete process.env.APP_VARIANT;
    else process.env.APP_VARIANT = prior;
  }
  const ota = await read('.github/workflows/ota.yml');
  assert.match(ota, /APP_VARIANT:\s*preview/);
  assert.match(ota, /EXPO_PUBLIC_APP_VARIANT:\s*preview/);
  assert.match(ota, /eas update --channel preview --environment preview --platform ios/);
});

test('V0-F14-AC-04 production OTA republishes the checked preview group', async () => {
  const ota = await read('.github/workflows/ota.yml');
  assert.match(ota, /eas update:republish --group .*--destination-channel production/);
});

test('V0-F14-AC-05 release workflows use only the Expo token and contain no signing key material', async () => {
  for (const path of ['.github/workflows/release-ios.yml', '.github/workflows/ota.yml']) {
    const workflow = await read(path);
    assert.match(workflow, /workflow_dispatch/);
    assert.doesNotMatch(workflow, /pull_request/);
    assert.doesNotMatch(workflow, /^\s*(push|schedule):/m);
    for (const match of workflow.matchAll(/secrets\.([A-Z0-9_]+)/g)) assert.equal(match[1], 'EXPO_TOKEN');
    assert.doesNotMatch(workflow, /-----BEGIN|AuthKey_|\.p8|p12/);
  }
});
