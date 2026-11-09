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
  assert.equal(eas.build.testflight.autoIncrement, true);
  assert.equal(eas.build.testflight.env.APP_VARIANT, 'preview');
  assert.equal(eas.submit.testflight.ios.appleTeamId, '43ZASDF2J7');
  await EasJsonUtils.getSubmitProfileAsync(accessor, 'ios', 'testflight');
  assert.equal(eas.submit.testflight.ios.ascAppId, '6831056066');
  const workflow = await read('.github/workflows/release-ios.yml');
  assert.match(workflow, /workflow_dispatch/);
  const buildStep = workflow.split('      - name: Build (and submit on success)')[1];
  assert.ok(buildStep);
  assert.match(buildStep, /--auto-submit-with-profile \{0\}', inputs\.profile/);
  assert.match(buildStep, /--wait/);
  assert.equal(workflow.match(/--auto-submit-with-profile/g)?.length, 1);
});

test('V0-F14-AC-06 production submits to its own record and only from a manual run', async () => {
  const accessor = EasJsonAccessor.fromProjectPath(new URL('apps/mobile/', root).pathname);
  const eas = await accessor.readAsync();
  await EasJsonUtils.getSubmitProfileAsync(accessor, 'ios', 'production');
  assert.equal(eas.submit.production.ios.ascAppId, '6831581664');
  assert.equal(eas.submit.production.ios.appleTeamId, '43ZASDF2J7');
  assert.notEqual(eas.submit.production.ios.ascAppId, eas.submit.testflight.ios.ascAppId);
  const workflow = await read('.github/workflows/release-ios.yml');
  assert.match(workflow, /options: \[testflight, production\]/);
  assert.match(workflow, /default: testflight/);
});

const loadConfig = async (env, tag) => {
  const prior = Object.fromEntries(Object.keys(env).map((name) => [name, process.env[name]]));
  Object.assign(process.env, env);
  try {
    return (await import(`../../apps/mobile/app.config.ts?v=${tag}`)).default;
  } finally {
    for (const [name, value] of Object.entries(prior)) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  }
};
const devSupabase = { EXPO_PUBLIC_SUPABASE_URL: 'https://opwtvlqpkrwgbjbmkqcw.supabase.co', EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'dev' };
const prodSupabase = { EXPO_PUBLIC_SUPABASE_URL: 'https://mhyctlxweuwznenrdsrl.supabase.co', EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'prod' };
// The EAS preview environment: Aroom-dev for the TestFlight binary, Aroom-prod for when the bundle is promoted.
const previewSupabase = { ...devSupabase, EXPO_PUBLIC_SUPABASE_PROD_URL: prodSupabase.EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_PROD_PUBLISHABLE_KEY: 'prod' };
const otaChannel = (config) => config.expo.plugins.find((plugin) => plugin[0] === '@hot-updater/expo')?.[1].channel;

test('V0-F14-AC-03 builds carry Hot Updater on their variant channel and the fingerprint strategy', async () => {
  const preview = await loadConfig({ APP_VARIANT: 'preview' }, 'preview');
  assert.equal(preview.expo.ios.bundleIdentifier, 'com.jinjinstar.aroom.dev');
  assert.equal(otaChannel(preview), 'preview');
  assert.equal(otaChannel(await loadConfig({ APP_VARIANT: 'production' }, 'ota-production')), 'production');
  assert.equal(otaChannel(await loadConfig({ APP_VARIANT: 'production', HOT_UPDATER_CHANNEL: 'ota-test' }, 'ota-test')), 'ota-test');
  // expo-updates and Hot Updater both own the bundle URL, so builds from 1.0.1 on carry only Hot Updater.
  assert.equal(preview.expo.updates, undefined);
  assert.equal(preview.expo.runtimeVersion, undefined);
  const mobile = JSON.parse(await read('apps/mobile/package.json'));
  assert.equal(mobile.dependencies['expo-updates'], undefined);
  assert.equal(mobile.dependencies['@hot-updater/react-native'], mobile.devDependencies['hot-updater']);
  assert.match(await read('apps/mobile/hot-updater.config.ts'), /updateStrategy: 'fingerprint'/);
  const fingerprint = JSON.parse(await read('apps/mobile/fingerprint.json'));
  assert.match(fingerprint.ios.hash, /^[0-9a-f]{64}$/);
  const ota = await read('.github/workflows/ota.yml');
  assert.match(ota, /APP_VARIANT:\s*preview/);
  assert.match(ota, /EXPO_PUBLIC_APP_VARIANT:\s*preview/);
  assert.match(ota, /eas env:exec preview 'npx hot-updater deploy --platform ios --channel preview /);
});

test('V0-F14-AC-03 EAS builds refuse a test channel and a missing client key', async () => {
  await assert.rejects(loadConfig({ EAS_BUILD: 'true', APP_VARIANT: 'production', EXPO_PUBLIC_HOT_UPDATER_API_KEY: 'k', HOT_UPDATER_CHANNEL: 'ota-test' }, 'eas-channel'), /HOT_UPDATER_CHANNEL is for local test builds/);
  await assert.rejects(loadConfig({ EAS_BUILD: 'true', APP_VARIANT: 'preview', EXPO_PUBLIC_HOT_UPDATER_API_KEY: '' }, 'eas-no-key'), /EXPO_PUBLIC_HOT_UPDATER_API_KEY must be set/);
  const config = await loadConfig({ EAS_BUILD: 'true', APP_VARIANT: 'production', EXPO_PUBLIC_HOT_UPDATER_API_KEY: 'k', ...prodSupabase }, 'eas-ok');
  assert.equal(otaChannel(config), 'production');
});

test('EAS production builds refuse any Supabase project but Aroom-prod', async () => {
  const base = { EAS_BUILD: 'true', APP_VARIANT: 'production', EXPO_PUBLIC_HOT_UPDATER_API_KEY: 'k' };
  await assert.rejects(loadConfig({ ...base, ...devSupabase }, 'eas-prod-on-dev'), /must be Aroom-prod's/);
  await assert.rejects(loadConfig({ ...base, EXPO_PUBLIC_SUPABASE_URL: '', EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: '' }, 'eas-prod-unset'), /must be Aroom-prod's/);
  // Preview builds (TestFlight included) use Aroom-dev; their binary never runs a production bundle.
  const preview = await loadConfig({ ...base, APP_VARIANT: 'preview', ...devSupabase }, 'eas-preview-dev');
  assert.equal(otaChannel(preview), 'preview');
});

test('V0-F14-AC-03 OTA bundles need the client key and their channel variant', async () => {
  const { checkBundleEnv } = await import('../../apps/mobile/hot-updater.config.ts');
  const key = { EXPO_PUBLIC_HOT_UPDATER_API_KEY: 'k' };
  const preview = { ...key, ...previewSupabase, EXPO_PUBLIC_APP_VARIANT: 'preview' };
  assert.throws(() => checkBundleEnv('preview', { ...previewSupabase, EXPO_PUBLIC_APP_VARIANT: 'preview' }), /EXPO_PUBLIC_HOT_UPDATER_API_KEY must be set/);
  assert.throws(() => checkBundleEnv('preview', { ...preview, EXPO_PUBLIC_APP_VARIANT: 'production' }), /APP_VARIANT and EXPO_PUBLIC_APP_VARIANT=preview/);
  assert.doesNotThrow(() => checkBundleEnv('preview', preview));
  assert.doesNotThrow(() => checkBundleEnv('ota-test', key));
  // deploy defaults to production; production normally gets a promoted preview bundle.
  assert.throws(() => checkBundleEnv('production', { ...key, ...prodSupabase, EXPO_PUBLIC_APP_VARIANT: 'production' }), /bundle promote/);
  assert.doesNotThrow(() => checkBundleEnv('production', { ...key, ...prodSupabase, EXPO_PUBLIC_APP_VARIANT: 'production', HOT_UPDATER_PRODUCTION_DEPLOY: 'true' }));
});

test('a preview bundle can be promoted only when it also carries Aroom-prod values', async () => {
  const { checkBundleEnv } = await import('../../apps/mobile/hot-updater.config.ts');
  const { supabaseBuildValues, supabaseTarget } = await import('../../apps/mobile/src/config/supabase.ts');
  const { APP_IDENTITY } = await import('../../apps/mobile/src/config/identity.ts');
  const env = { EXPO_PUBLIC_HOT_UPDATER_API_KEY: 'k', EXPO_PUBLIC_APP_VARIANT: 'preview' };
  assert.throws(() => checkBundleEnv('preview', { ...env, ...devSupabase }), /must carry Aroom-prod's public values/);
  assert.throws(() => checkBundleEnv('preview', { ...env, ...devSupabase, EXPO_PUBLIC_SUPABASE_PROD_URL: devSupabase.EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_PROD_PUBLISHABLE_KEY: 'dev' }), /must carry Aroom-prod's public values/);
  assert.throws(() => checkBundleEnv('production', { ...env, ...devSupabase, EXPO_PUBLIC_APP_VARIANT: 'production', HOT_UPDATER_PRODUCTION_DEPLOY: 'true' }), /must carry Aroom-prod's public values/);
  // The bundle that passes runs on Aroom-dev in the TestFlight binary and on Aroom-prod once promoted to the App Store binary.
  checkBundleEnv('preview', { ...env, ...previewSupabase });
  const inlined = supabaseBuildValues(previewSupabase);
  assert.equal(supabaseTarget(APP_IDENTITY.devIosBundleId, inlined).url, devSupabase.EXPO_PUBLIC_SUPABASE_URL);
  assert.equal(supabaseTarget(APP_IDENTITY.iosBundleId, inlined).url, prodSupabase.EXPO_PUBLIC_SUPABASE_URL);
});

test('store builds leave the widget extension out until its signing exists', async () => {
  const prior = process.env.IOS_WIDGETS;
  delete process.env.IOS_WIDGETS;
  try {
    const { default: config } = await import('../../apps/mobile/app.config.ts?v=store');
    const { IOS_WIDGETS_SIGNED } = await import('../../apps/mobile/src/config/identity.ts');
    assert.equal(config.expo.plugins.some((plugin) => plugin[0] === 'expo-widgets'), IOS_WIDGETS_SIGNED);
  } finally {
    if (prior !== undefined) process.env.IOS_WIDGETS = prior;
  }
  const eas = JSON.parse(await read('apps/mobile/eas.json'));
  assert.equal(eas.build['development-simulator'].env.IOS_WIDGETS, 'true');
  assert.equal(eas.build.testflight.env.IOS_WIDGETS, undefined);
});

test('V0-F14-AC-06 no build profile above development can carry a test login', async () => {
  const eas = JSON.parse(await read('apps/mobile/eas.json'));
  for (const name of ['preview', 'testflight', 'production']) {
    assert.deepEqual(Object.keys(eas.build[name].env).filter((key) => /LOGIN|DEMO|REVIEW/.test(key)), []);
  }
  const load = async (variant, flag, tag) => {
    const prior = { variant: process.env.APP_VARIANT, flag: process.env[flag] };
    process.env.APP_VARIANT = variant;
    process.env[flag] = 'true';
    try {
      return await import(`../../apps/mobile/app.config.ts?v=${tag}`);
    } finally {
      for (const [name, value] of [['APP_VARIANT', prior.variant], [flag, prior.flag]]) {
        if (value === undefined) delete process.env[name];
        else process.env[name] = value;
      }
    }
  };
  await assert.rejects(load('production', 'EXPO_PUBLIC_DEV_EMAIL_LOGIN', 'prod-email'), /must not be set for production/);
  await assert.rejects(load('production', 'EXPO_PUBLIC_DEV_QUICK_LOGIN', 'prod-quick'), /must not be set for preview or production/);
  await assert.rejects(load('preview', 'EXPO_PUBLIC_DEV_QUICK_LOGIN', 'preview-quick'), /must not be set for preview or production/);
});

test('production builds the store identity, iPhone only and portrait', async () => {
  const prior = process.env.APP_VARIANT;
  process.env.APP_VARIANT = 'production';
  try {
    const { default: config } = await import('../../apps/mobile/app.config.ts?v=production');
    assert.equal(config.expo.ios.bundleIdentifier, 'com.jinjinstar.aroom');
    assert.equal(config.expo.name, 'Aroom');
    assert.equal(config.expo.scheme, 'aroom');
    assert.equal(config.expo.orientation, 'portrait');
    assert.equal(config.expo.ios.supportsTablet, undefined);
    assert.equal(config.expo.ios.infoPlist.ITSAppUsesNonExemptEncryption, false);
  } finally {
    if (prior === undefined) delete process.env.APP_VARIANT;
    else process.env.APP_VARIANT = prior;
  }
  const eas = JSON.parse(await read('apps/mobile/eas.json'));
  assert.equal(eas.build.production.env.APP_VARIANT, 'production');
  assert.equal(eas.build.production.env.EXPO_PUBLIC_APP_VARIANT, 'production');
  assert.equal(eas.build.production.environment, 'production');
  assert.equal(eas.build.production.distribution, undefined);
});

test('V0-F11-AC-01 the extension and the app share the App Group of their variant', async () => {
  const prior = { widgets: process.env.IOS_WIDGETS, variant: process.env.APP_VARIANT };
  process.env.IOS_WIDGETS = 'true';
  process.env.APP_VARIANT = 'preview';
  try {
    const { default: config } = await import('../../apps/mobile/app.config.ts?v=widgets');
    const [, options] = config.expo.plugins.find((plugin) => plugin[0] === 'expo-widgets');
    assert.equal(options.bundleIdentifier, `${config.expo.ios.bundleIdentifier}.widgets`);
    assert.equal(options.groupIdentifier, `group.${config.expo.ios.bundleIdentifier}`);
    assert.deepEqual(options.widgets.map((widget) => widget.name), ['DDayWidget', 'ListWidget']);
  } finally {
    for (const [name, value] of [['IOS_WIDGETS', prior.widgets], ['APP_VARIANT', prior.variant]]) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  }
});

test('V0-F14-AC-04 production OTA promotes the checked preview bundle', async () => {
  const ota = await read('.github/workflows/ota.yml');
  assert.match(ota, /npx hot-updater bundle promote "\$BUNDLE" --target production --action copy/);
  assert.doesNotMatch(ota, /hot-updater deploy[^\n]*--channel production/);
});

test('V0-F14-AC-04 1.0.0 installs still get EAS updates built from the 1.0.0 native code', async () => {
  const legacy = await read('.github/workflows/ota-eas-legacy.yml');
  assert.match(legacy, /ref: \$\{\{ inputs\.ref \}\}/);
  assert.match(legacy, /default: b932faaac0776716efa433c10203b6ce6329c010/);
  assert.match(legacy, /default: 43596c365ca500cc0b696c82a4ddff0c1fac1caa/);
  assert.match(legacy, /npx expo-updates runtimeversion:resolve --platform ios/);
  assert.match(legacy, /eas update --channel production --environment production --platform ios/);
  assert.match(legacy, /eas update:republish --group "\$GROUP" --destination-channel production/);
});

test('V0-F14-AC-05 release workflows use only the Expo token and contain no signing key material', async () => {
  for (const path of ['.github/workflows/release-ios.yml', '.github/workflows/ota.yml', '.github/workflows/ota-eas-legacy.yml']) {
    const workflow = await read(path);
    assert.match(workflow, /workflow_dispatch/);
    assert.doesNotMatch(workflow, /pull_request/);
    assert.doesNotMatch(workflow, /^\s*(push|schedule):/m);
    for (const match of workflow.matchAll(/secrets\.([A-Z0-9_]+)/g)) assert.equal(match[1], 'EXPO_TOKEN');
    assert.doesNotMatch(workflow, /-----BEGIN|AuthKey_|\.p8|p12/);
  }
});
