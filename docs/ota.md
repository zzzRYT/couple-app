# OTA updates

Builds from 1.0.1 on get JS and asset updates from [Hot Updater](https://hot-updater.dev) on Cloudflare. Aroom 1.0.0 (build 1) shipped with the EAS Update client and keeps asking EAS until people install a newer App Store version, so EAS stays for it (see [1.0.0 installs](#100-installs-eas-update)).

## How it works

- Server: Cloudflare Worker `aroom-hot-updater` at `https://aroom-hot-updater.jinjinstar3.workers.dev`, D1 database `aroom-hot-updater`, private R2 bucket `aroom-hot-updater` (APAC), in the Cloudflare account that hosts `aroom-site`. The free plan covers it (Workers 100,000 requests a day, D1 5 million rows read a day, R2 10 GB). The account's older `hot-updater` Worker belongs to another project; Aroom does not use it.
- Packages: `@hot-updater/react-native` in the app, `hot-updater`, `@hot-updater/expo` and `@hot-updater/cloudflare` for the CLI, all pinned to the same version (1.1.8). Upgrade them together.
- Client: `src/features/update/ota.ts` checks once per cold start, downloads in the background, and the new bundle runs from the next launch, like the expo-updates default it replaces. A bundle deployed with `--force-update` reloads as soon as it downloads. The app sends no Insights reports.
- Channel: each build carries a native default channel from its variant: `production` (production profile), `preview` (testflight and preview profiles), `development`. Changing it takes a new build.
- Fingerprint: `hot-updater.config.ts` uses the `fingerprint` strategy and `apps/mobile/fingerprint.json` (committed) holds the iOS and Android hashes. A bundle reaches only builds with the same hash. The hash covers the React Native version, every autolinked native package and its version (Expo modules included), codegen specs, patches and `fingerprint.nativeVersion`. It does not cover the app config or config plugins: when a config-plugin change alters what JS can call (a new permission, an extension the JS writes to), bump `fingerprint.nativeVersion` in `hot-updater.config.ts`.
- `deploy` stops when `fingerprint.json` no longer matches the project. Run `npx hot-updater fingerprint create`, commit the file, and ship a new App Store build before deploying for it.

Expo constraints: Hot Updater and `expo-updates` both own the release bundle URL, so builds carry only Hot Updater. Hot Updater supports Expo SDK 58 from 1.0.0-rc.23; its config plugin replaces `Bundle.main.url(forResource: "main", …)` with `HotUpdater.bundleURL()` in the generated `AppDelegate.swift` and writes `HOT_UPDATER_CHANNEL` into `Info.plist` at prebuild. EAS Build runs prebuild, so nothing native is committed. Debug builds keep loading from Metro.

## Publish an update (1.0.1 and later)

1. **Actions → OTA**, `channel=preview`, a `message`. It runs `hot-updater deploy --platform ios --channel preview` under `eas env:exec preview`, which supplies the Cloudflare credentials, the client key and the Supabase values. Copy the bundle ID it prints.
2. On a TestFlight build, open the app, close it, and open it again: the change shows.
3. **Actions → OTA**, `channel=production`, `bundle=<ID from step 1>`. It runs `hot-updater bundle promote <ID> --target production --action copy`, so production gets the exact bundle checked on preview.

Roll back with `hot-updater bundle disable <ID>`, which re-resolves delivery to the previous bundle. Run CLI commands from `apps/mobile` through the EAS environment, for example `eas env:exec preview 'npx hot-updater bundle list --channel production'`; no local secret file is needed. `npx hot-updater console` opens the web console the same way.

`deploy` defaults to the production channel. `hot-updater.config.ts` refuses a production deploy unless `HOT_UPDATER_PRODUCTION_DEPLOY=true`, refuses any bundle without `EXPO_PUBLIC_HOT_UPDATER_API_KEY`, and refuses a preview or production bundle built for another variant: a bundle inlines `EXPO_PUBLIC_*` values, and one without the key would stop later updates on that device.

## 1.0.0 installs (EAS Update)

The production 1.0.0 build came from commit `b932faaac0776716efa433c10203b6ce6329c010`; its EAS runtime is `43596c365ca500cc0b696c82a4ddff0c1fac1caa`, channel `production`. Only an update built from that native code reaches it.

- **Actions → OTA (EAS, 1.0.0)**, `mode=publish`: checks out `ref` (the 1.0.0 commit, or a branch made from it with the fix), confirms that the resolved runtime equals `runtime`, and runs `eas update --channel production --environment production`. Code from `main` cannot be used: it has no `expo-updates`.
- `mode=republish` with a `group` republishes an earlier production group (rollback).
- Keep the EAS project and its production channel while 1.0.0 installs remain. The update notice (V0-11) asks them to install the new App Store version.

## Test a build against a test channel

`HOT_UPDATER_CHANNEL` overrides the channel of a local build (EAS builds refuse it). The proof for this setup used a production Release build on a simulator:

```sh
cd apps/mobile
APP_VARIANT=production EXPO_PUBLIC_APP_VARIANT=production HOT_UPDATER_CHANNEL=ota-test \
  eas env:exec production 'npx expo prebuild --platform ios --clean && npx expo run:ios --configuration Release --device <simulator>'
APP_VARIANT=production EXPO_PUBLIC_APP_VARIANT=production \
  eas env:exec preview 'npx hot-updater deploy --platform ios --channel ota-test --message "ota test"'
```

Disable the test bundle afterwards with `hot-updater bundle disable <ID>`.

## Server operations

- Credentials, all in the EAS `preview` environment as sensitive variables (see [secrets](secrets.md#ota-updates)): `HOT_UPDATER_CLOUDFLARE_API_TOKEN` (account API token `aroom-hot-updater-d1`, D1 Edit), `HOT_UPDATER_CLOUDFLARE_R2_ACCESS_KEY_ID` and `HOT_UPDATER_CLOUDFLARE_R2_SECRET_ACCESS_KEY` (R2 token `aroom-hot-updater-r2`, object read and write on `aroom-hot-updater` only). The Worker keeps the same R2 pair as its secrets `R2_ACCESS_KEY_ID` and `R2_SECRET_ACCESS_KEY` to presign downloads.
- Health: `npx hot-updater doctor --server-base-url https://aroom-hot-updater.jinjinstar3.workers.dev` from `apps/mobile`; `/version` is public.
- Upgrade: bump the four packages together, then run `npx hot-updater agent infra upgrade` and follow its instructions with `wrangler` logged in to the account. Upgrade the server before shipping a client that needs it.
- Worker configuration is generated by `npx hot-updater agent infra setup --provider cloudflare --build expo` and filled with the ids in `hot-updater.config.ts`; the scaffold is not committed.
