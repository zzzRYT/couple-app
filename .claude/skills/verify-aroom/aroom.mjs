#!/usr/bin/env node
// Control CLI for the verify-aroom skill: Release simulator build on Aroom-dev, test sessions, Maestro drives,
// screenshots into design/evidence/verify-aroom, doctor and cleanup. Usage is in SKILL.md next to this file.
import { spawnSync } from 'node:child_process';
import { createHash, randomInt, randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { APP_IDENTITY } from '../../../apps/mobile/src/config/identity.ts';
import { projectUrl } from '../../../apps/mobile/src/config/supabase.ts';
import { TARGETS, accessToken } from '../../../tools/supabase/remote.mjs';

const SKILL = dirname(fileURLToPath(import.meta.url));
const ROOT = join(SKILL, '../../..');
const MOBILE = join(ROOT, 'apps/mobile');
const IOS = join(MOBILE, 'ios');
const DERIVED = join(IOS, 'build/verify');
export const EVIDENCE = join(ROOT, 'design/evidence/verify-aroom');
const TAG = createHash('sha256').update(ROOT).digest('hex').slice(0, 8);
const HOME = process.env.AROOM_VERIFY_HOME ?? join(tmpdir(), `aroom-verify-${TAG}`);
const STATE = join(HOME, 'state.json');
export const DEV_URL = projectUrl('dev');
const BUNDLE = APP_IDENTITY.devIosBundleId;
const SIM_NAME = basename(HOME);
const RUNTIME = 'com.apple.CoreSimulator.SimRuntime.iOS-26-5';
const DEVICE = `com.apple.CoreSimulator.SimDeviceType.${process.env.AROOM_VERIFY_DEVICE ?? 'iPhone-17-Pro'}`;
export const CHANNEL = 'verify-aroom';
export const EMAIL_PREFIX = 'verify-aroom-';

/** Build environment of the `development` EAS profile pointed at Aroom-dev; inherited Aroom-prod values are dropped. */
export function buildEnv(env, publishableKey) {
  const clean = Object.fromEntries(Object.entries(env).filter(([name]) => !/^EXPO_PUBLIC_SUPABASE_|^EAS_BUILD$/.test(name)));
  return { ...clean, APP_VARIANT: 'development', EXPO_PUBLIC_APP_VARIANT: 'development', EXPO_PUBLIC_DEV_EMAIL_LOGIN: 'true',
    EXPO_PUBLIC_SUPABASE_URL: DEV_URL, EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: publishableKey,
    // A channel with no bundles, so the Release build never swaps in an OTA bundle from the development channel.
    HOT_UPDATER_CHANNEL: CHANNEL };
}

/** The link a magic-link email returns with; the app's auth-callback route sets the session from it. */
export function sessionLink({ access_token, refresh_token, expires_in }) {
  const fragment = new URLSearchParams({ access_token, refresh_token, expires_in: String(expires_in), token_type: 'bearer', type: 'magiclink' });
  return `aroom-dev://auth-callback#${fragment}`;
}

function run(cmd, args, opts = {}) {
  const result = spawnSync(cmd, args, { stdio: 'inherit', ...opts });
  if (result.status !== 0) throw new Error(`${cmd} ${args[0]} exited with ${result.status ?? result.signal}`);
}
function read(cmd, args, opts = {}) {
  const result = spawnSync(cmd, args, { encoding: 'utf8', ...opts });
  return result.status === 0 ? result.stdout.trim() : null;
}
function state() {
  return existsSync(STATE) ? JSON.parse(readFileSync(STATE, 'utf8')) : { users: [] };
}
function save(next) {
  mkdirSync(HOME, { recursive: true, mode: 0o700 });
  writeFileSync(STATE, JSON.stringify(next, null, 1), { mode: 0o600 });
}

function devToken() {
  const token = existsSync(TARGETS.dev.envFile) ? accessToken(readFileSync(TARGETS.dev.envFile, 'utf8')) : null;
  if (!token) throw new Error(`${TARGETS.dev.envFile} has no SUPABASE_ACCESS_TOKEN for ${TARGETS.dev.name}`);
  return token;
}
async function management(path, init = {}) {
  const response = await fetch(`https://api.supabase.com/v1/projects/${TARGETS.dev.ref}${path}`, { ...init, headers: { Authorization: `Bearer ${devToken()}`, 'Content-Type': 'application/json' } });
  if (!response.ok) throw new Error(`Management API ${path} answered ${response.status}`);
  return response.json();
}
/** Keys stay in memory; only the publishable key is inlined into the build. */
async function devKeys() {
  const keys = await management('/api-keys?reveal=true');
  const pick = (type) => keys.find((key) => key.type === type)?.api_key;
  if (!pick('publishable') || !pick('secret')) throw new Error(`${TARGETS.dev.name} has no publishable or secret API key`);
  return { publishable: pick('publishable'), secret: pick('secret') };
}
async function devSql(query) {
  return management('/database/query', { method: 'POST', body: JSON.stringify({ query }) });
}
async function api(method, path, key, bearer, body) {
  const idempotencyKey = randomUUID();
  // Like the app (lib/api.ts keyInBody), Edge Function writes carry the key in the body as well as the header.
  const payload = body === undefined ? undefined : JSON.stringify(path.startsWith('/functions/') ? { ...body, idempotencyKey } : body);
  const response = await fetch(`${DEV_URL}${path}`, { method, headers: { apikey: key, Authorization: `Bearer ${bearer}`, 'Content-Type': 'application/json', 'Idempotency-Key': idempotencyKey }, body: payload });
  const text = await response.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch { json = text; }
  return { status: response.status, json };
}

function workspaceName() {
  const workspace = existsSync(IOS) && readdirSync(IOS).find((name) => name.endsWith('.xcworkspace'));
  return workspace ? workspace.replace(/\.xcworkspace$/, '') : null;
}
function appPath() {
  const products = join(DERIVED, 'Build/Products/Release-iphonesimulator');
  const app = existsSync(products) && readdirSync(products).find((name) => name.endsWith('.app'));
  return app ? join(products, app) : null;
}
function simulator(udid) {
  const devices = JSON.parse(read('xcrun', ['simctl', 'list', 'devices', '--json']) ?? '{"devices":{}}').devices;
  return Object.values(devices).flat().find((device) => device.udid === udid) ?? null;
}

async function build(args) {
  const { publishable } = await devKeys();
  const env = buildEnv(process.env, publishable);
  if (!args.includes('--js-only')) {
    run('npx', ['expo', 'prebuild', '--platform', 'ios', '--clean', '--no-install'], { cwd: MOBILE, env });
    const name = workspaceName() ?? readdirSync(IOS).find((entry) => entry.endsWith('.xcodeproj'))?.replace(/\.xcodeproj$/, '');
    // Without this group SecureStore fails with -34018 and the app sits on a blank screen before its first render.
    run('plutil', ['-replace', 'keychain-access-groups', '-json', JSON.stringify([`$(AppIdentifierPrefix)${BUNDLE}`]), join(IOS, name, `${name}.entitlements`)]);
    run('pod', ['install'], { cwd: IOS, env });
  }
  const name = workspaceName();
  if (!name) throw new Error(`No Xcode workspace in ${IOS}; run build without --js-only`);
  // Release: a Debug build stops at launch because HotUpdater's TurboModule is missing. CODE_SIGNING_ALLOWED=NO would drop the entitlements.
  run('xcodebuild', ['-workspace', `${name}.xcworkspace`, '-scheme', name, '-configuration', 'Release', '-sdk', 'iphonesimulator',
    '-destination', 'generic/platform=iOS Simulator', '-derivedDataPath', DERIVED, '-quiet', 'CODE_SIGN_IDENTITY=-', 'CODE_SIGNING_ALLOWED=YES', 'build'], { cwd: IOS, env });
  console.log(`Built ${appPath()}`);
}

function launch(args) {
  const app = appPath();
  if (!app) throw new Error('No Release build; run build first');
  const current = state();
  if (!current.udid || !simulator(current.udid)) {
    // The iOS 27.1 runtime accepts no iPhone device type with this Xcode, so proofs run on 26.5.
    const udid = read('xcrun', ['simctl', 'create', SIM_NAME, DEVICE, RUNTIME]);
    if (!udid) throw new Error(`Could not create ${SIM_NAME} on ${RUNTIME}; doctor lists what is missing`);
    run('xcrun', ['simctl', 'boot', udid]);
    run('xcrun', ['simctl', 'bootstatus', udid, '-b'], { stdio: 'ignore' });
    // Korean system language, so screens and the system "열기" prompt match the design evidence.
    run('xcrun', ['simctl', 'spawn', udid, 'defaults', 'write', '-g', 'AppleLanguages', '-array', 'ko-KR']);
    run('xcrun', ['simctl', 'spawn', udid, 'defaults', 'write', '-g', 'AppleLocale', 'ko_KR']);
    run('xcrun', ['simctl', 'shutdown', udid]);
    save({ ...current, udid });
  }
  const { udid } = state();
  if (simulator(udid).state !== 'Booted') run('xcrun', ['simctl', 'boot', udid]);
  run('xcrun', ['simctl', 'bootstatus', udid, '-b'], { stdio: 'ignore' });
  if (args.includes('--fresh')) {
    spawnSync('xcrun', ['simctl', 'uninstall', udid, BUNDLE]);
    // The session lives in the keychain (SecureStore), which survives an uninstall.
    run('xcrun', ['simctl', 'keychain', udid, 'reset']);
  }
  run('xcrun', ['simctl', 'install', udid, app]);
  run('xcrun', ['simctl', 'launch', '--terminate-running-process', udid, BUNDLE], { stdio: 'ignore' });
  console.log(`Launched ${BUNDLE} on ${SIM_NAME} (${udid})`);
}

function maestro(flow) {
  const { udid, users } = state();
  if (!udid) throw new Error('No verification simulator; run launch first');
  const user = users.findLast((candidate) => !candidate.partner);
  const file = join(SKILL, 'flows', `${flow}.yaml`);
  if (!existsSync(file)) throw new Error(`No flow ${file}`);
  // Maestro reads MAESTRO_* variables from its environment, which keeps the password off the command line.
  const vars = user ? { MAESTRO_EMAIL: user.email, MAESTRO_PASSWORD: user.password } : {};
  run('maestro', ['--device', udid, 'test', '--no-ansi', '--test-output-dir', join(HOME, 'maestro'), file], { env: { ...process.env, ...vars } });
}

async function signIn(publishable, { email, password }) {
  const tokens = await api('POST', '/auth/v1/token?grant_type=password', publishable, publishable, { email, password });
  if (tokens.status !== 200) throw new Error(`password grant: ${tokens.status}`);
  return tokens.json;
}
/** Records the user in state before anything else can fail, so cleanup always finds it. */
async function newUser(publishable, secret, extra = {}) {
  const email = `${EMAIL_PREFIX}${Date.now()}-${randomInt(1000, 9999)}@example.com`;
  const password = randomUUID();
  // Email sign-up is closed on Aroom-dev (guard_email_signup), so the user starts as a phone user and gets the email after.
  const created = await api('POST', '/auth/v1/admin/users', secret, secret, { phone: `1555${randomInt(1000000, 9999999)}`, password, phone_confirm: true });
  if (created.status !== 200) throw new Error(`create user: ${created.status} ${JSON.stringify(created.json)}`);
  const user = { id: created.json.id, email, password, ...extra };
  const current = state();
  save({ ...current, users: [...current.users, user] });
  const updated = await api('PUT', `/auth/v1/admin/users/${created.json.id}`, secret, secret, { email, email_confirm: true, app_metadata: { provider: 'email', providers: ['email'] } });
  if (updated.status !== 200) throw new Error(`set email: ${updated.status}`);
  return { user, tokens: await signIn(publishable, user) };
}
function remember(id, change) {
  const current = state();
  save({ ...current, users: current.users.map((user) => (user.id === id ? { ...user, ...change } : user)) });
}

async function session(args) {
  const { publishable, secret } = await devKeys();
  const { user, tokens } = await newUser(publishable, secret);
  const email = user.email;
  const space = args[args.indexOf('--space') + 1];
  if (args.includes('--space')) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(space ?? '')) throw new Error('--space needs an anniversary date, YYYY-MM-DD');
    const made = await api('POST', '/functions/v1/spaces/spaces', publishable, tokens.access_token, { anniversaryDate: space, timeZone: 'Asia/Seoul' });
    if (made.status !== 201) throw new Error(`create space: ${made.status} ${JSON.stringify(made.json)}`);
    remember(user.id, { spaceId: made.json.spaceId });
    console.log(`Space ${made.json.spaceId}, anniversary ${space}`);
  }
  console.log(`Test user ${email} on ${TARGETS.dev.name}`);
  if (args.includes('--no-open')) return;
  run('xcrun', ['simctl', 'openurl', state().udid, sessionLink(tokens)]);
  maestro('open-link');
}

/**
 * A second test user joins the last session's space through the app's own invitation and profile endpoints, then
 * optionally writes calendar events (each `--comment` after an `--event` comments on it) as that partner, so a proof can show both partners' entries on one device.
 */
async function partner(args) {
  const owner = state().users.findLast((user) => user.spaceId);
  if (!owner) throw new Error('No session with a space; run session --space DATE first');
  const name = args.includes('--name') ? args[args.indexOf('--name') + 1] : '하루';
  const events = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--event') events.push({ event: args[++i], comments: [] });
    else if (args[i] === '--comment') {
      if (!events.length) throw new Error('--comment follows the --event it comments on');
      events.at(-1).comments.push(args[++i]);
    }
  }
  const { publishable, secret } = await devKeys();
  const ownerTokens = await signIn(publishable, owner);
  const invite = await api('POST', `/functions/v1/invitations/spaces/${owner.spaceId}/invitations`, publishable, ownerTokens.access_token, { expiresInSeconds: 86400 });
  if (invite.status !== 201 && invite.status !== 200) throw new Error(`create invitation: ${invite.status} ${JSON.stringify(invite.json)}`);
  const { user, tokens } = await newUser(publishable, secret, { partner: true });
  const joined = await api('POST', '/functions/v1/invitations/invitations/accept', publishable, tokens.access_token, { code: invite.json.code });
  if (joined.status !== 200) throw new Error(`accept invitation: ${joined.status} ${JSON.stringify(joined.json)}`);
  const profile = await api('PUT', '/functions/v1/profile/profile/member', publishable, tokens.access_token, { displayName: name, birthday: null });
  if (profile.status !== 200) throw new Error(`partner profile: ${profile.status} ${JSON.stringify(profile.json)}`);
  for (const { event, comments } of events) {
    const [title, date, time, alert, whose = 'together'] = (event ?? '').split('|');
    if (!title || !/^\d{4}-\d{2}-\d{2}$/.test(date ?? '')) throw new Error('--event needs "title|YYYY-MM-DD|HH:MM or empty|alert|together, me or partner"');
    // Whose plan, seen from the session user: me is the session user, partner is this joined user.
    const ownerId = { together: null, me: owner.id, partner: user.id }[whose];
    if (ownerId === undefined) throw new Error(`--event owner must be together, me or partner, not ${whose}`);
    const made = await api('POST', `/functions/v1/spaces/spaces/${owner.spaceId}/events`, publishable, tokens.access_token, { title, date, time: time || null, endTime: null, alert: alert || 'none', ownerId });
    if (made.status !== 201) throw new Error(`partner event: ${made.status} ${JSON.stringify(made.json)}`);
    console.log(`Partner event "${title}" on ${date}`);
    for (const body of comments) {
      const comment = await api('POST', `/functions/v1/spaces/spaces/${owner.spaceId}/events/${made.json.id}/comments`, publishable, tokens.access_token, { body });
      if (comment.status !== 201) throw new Error(`partner comment: ${comment.status} ${JSON.stringify(comment.json)}`);
      console.log(`Partner comment on "${title}": ${body}`);
    }
  }
  console.log(`Partner ${name} (${user.email}) joined space ${owner.spaceId}`);
}

function shot(name) {
  const { udid } = state();
  if (!udid || !/^[\w-]+\/[\w-]+$/.test(name ?? '')) throw new Error('usage: shot <feature>/<name> after launch');
  const file = join(EVIDENCE, `${name}.png`);
  mkdirSync(dirname(file), { recursive: true });
  run('xcrun', ['simctl', 'io', udid, 'screenshot', file], { stdio: 'ignore' });
  console.log(file);
}

async function doctor() {
  const checks = [];
  const check = (label, ok, fix = '') => checks.push({ label, ok: !!ok, fix });
  check('Xcode', read('xcodebuild', ['-version']), 'install Xcode');
  check(`iOS 26.5 simulator runtime`, read('xcrun', ['simctl', 'list', 'runtimes'])?.includes(RUNTIME), 'Xcode > Settings > Components');
  check('Maestro CLI', read('maestro', ['--version']), 'curl -fsSL https://get.maestro.mobile.dev | bash (needs Java)');
  check('CocoaPods', read('pod', ['--version']), 'brew install cocoapods');
  let project = null;
  try { project = await fetch(`https://api.supabase.com/v1/projects/${TARGETS.dev.ref}`, { headers: { Authorization: `Bearer ${devToken()}` } }).then((r) => r.ok ? r.json() : null); } catch { /* reported below */ }
  check(`${TARGETS.dev.name} reachable with the dev token`, project?.status === 'ACTIVE_HEALTHY', `${TARGETS.dev.envFile} needs a token scoped to ${TARGETS.dev.ref}`);
  const app = appPath();
  check('Release simulator build', app, 'run build');
  if (app) {
    const bundle = join(app, 'main.jsbundle');
    const js = existsSync(bundle) ? readFileSync(bundle, 'utf8') : '';
    check('bundle inlines Aroom-dev, not Aroom-prod', js.includes(DEV_URL) && !js.includes(projectUrl('prod')), 'run build; never build with Aroom-prod values');
    check(`OTA channel is ${CHANNEL}`, read('/usr/libexec/PlistBuddy', ['-c', 'Print', join(app, 'Info.plist')])?.includes(CHANNEL), 'run build (prebuild sets HOT_UPDATER_CHANNEL)');
    // Simulator builds carry their entitlements in the binary's __entitlements section, not in the code signature.
    const binary = join(app, basename(app, '.app'));
    check('keychain-access-groups in the simulated entitlements', existsSync(binary) && readFileSync(binary).includes('keychain-access-groups'), 'run build without --js-only');
  }
  const { udid, users } = state();
  const device = udid && simulator(udid);
  check(`verification simulator ${SIM_NAME}`, device?.state === 'Booted', 'run launch');
  if (device) check('app installed on it', read('xcrun', ['simctl', 'get_app_container', udid, BUNDLE]), 'run launch');
  for (const { label, ok, fix } of checks) console.log(`${ok ? 'ok  ' : 'FAIL'} ${label}${ok || !fix ? '' : ` (${fix})`}`);
  console.log(`state ${HOME}; ${users.length} test user(s) to clean up; evidence ${EVIDENCE}`);
  return checks.every((c) => c.ok) ? 0 : 1;
}

async function cleanup() {
  const current = state();
  if (current.users.length) {
    const { secret } = await devKeys();
    for (const user of current.users) {
      // The app's operator deletion purges the user's spaces too; a plain admin delete leaves the space row behind.
      const deleted = await api('POST', '/functions/v1/account/account/operator-deletion', secret, secret, { userId: user.id });
      const gone = (await api('GET', `/auth/v1/admin/users/${user.id}`, secret, secret)).status === 404;
      if (!gone) throw new Error(`${user.email} is still on ${TARGETS.dev.name} (operator deletion ${deleted.status}); state kept in ${HOME}`);
      console.log(`Deleted ${user.email}`);
    }
    const [left] = await devSql(`select count(*)::int as n from auth.users where id in (${current.users.map((u) => `'${u.id}'`).join(',')})`);
    if (left.n !== 0) throw new Error(`${left.n} test user(s) remain on ${TARGETS.dev.name}`);
  }
  if (current.udid && simulator(current.udid)) {
    spawnSync('xcrun', ['simctl', 'shutdown', current.udid], { stdio: 'ignore' });
    run('xcrun', ['simctl', 'delete', current.udid]);
    console.log(`Deleted simulator ${SIM_NAME}`);
  }
  rmSync(HOME, { recursive: true, force: true });
  console.log(`Evidence kept in ${EVIDENCE}`);
}

const USAGE = `usage: aroom.mjs <command>
  doctor                     read-only: is this instance worth driving?
  build [--js-only]          Release simulator build on Aroom-dev (--js-only skips prebuild and pods)
  launch [--fresh]           create/boot the verification simulator, install and start the app (--fresh: empty app data)
  session [--space DATE] [--no-open]
                             new test user on Aroom-dev (optionally with a space), signed in through the auth-callback link
  partner [--name NAME] [--event "title|YYYY-MM-DD|HH:MM|alert|together|me|partner" [--comment TEXT]...]...
                             second test user joins the last session's space (invitation + profile), optionally writing events
  drive <flow>               run flows/<flow>.yaml with Maestro as the last session user (MAESTRO_EMAIL, MAESTRO_PASSWORD)
  shot <feature>/<name>      screenshot to design/evidence/verify-aroom/<feature>/<name>.png
  cleanup                    delete test users, spaces and the simulator; evidence stays`;

async function main([command, ...args]) {
  switch (command) {
    case 'doctor': return doctor();
    case 'build': return build(args);
    case 'launch': return launch(args);
    case 'session': return session(args);
    case 'partner': return partner(args);
    case 'drive': return maestro(args[0]);
    case 'shot': return shot(args[0]);
    case 'cleanup': return cleanup();
    default: console.error(USAGE); return 2;
  }
}

if (fileURLToPath(import.meta.url) === process.argv[1]) {
  try { process.exitCode = (await main(process.argv.slice(2))) ?? 0; } catch (error) { console.error(error.message); process.exitCode = 1; }
}
