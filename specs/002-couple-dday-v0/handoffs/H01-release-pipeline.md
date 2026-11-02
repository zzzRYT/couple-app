# H01 — Release pipeline and a blank TestFlight build (slice S1)

| | |
|---|---|
| Slice | S1 · tasks T101–T109 in `../tasks.md` |
| Requirements | V0-F14 (V0-F14-AC-01 … -06), part of V0-F12-AC-09 (version row) |
| Depends on | nothing; can run in parallel with H02 |
| Unblocks | every later TestFlight check; H04's App Group PoC needs this build path |
| Branch / PR | `v0/s1-release-pipeline` → PR to `main`, non-draft, do not merge |
| Design source | artifact https://claude.ai/artifact/M2WFQCFnVzoWbHNhJPCz5X, version `1793598115-fafc`, board `V0-00` "출시 메모" (no screens in this slice) |

You do not need (and cannot use) the design tool. Everything you need is in this file and the spec folder `specs/002-couple-dday-v0/`.

## 1. Goal and why

Give the owner a one-click GitHub path from `main` to TestFlight for the iOS app, and an over-the-air (OTA) path for JS/copy/asset fixes. The owner and their partner test every later slice on real iPhones through TestFlight, and the widget slice (H04) needs a store-signed build to prove the App Group early. This slice changes no product behaviour: the app that ships is today's app.

## 2. Prerequisites

- `main` at or after commit `1f29362` (PR #26). No other slice needs to be merged.
- Read: `../spec.md` (User Story 1, Decisions table rows A-02, A-03, A-04), `../plan.md` §8 (release pipeline) and §9 (tests).
- Current facts you build on (verified 2026-11-02):
  - `apps/mobile/eas.json`: `cli.appVersionSource: "remote"`; build profiles `development` (dev client, internal, `EXPO_PUBLIC_DEV_EMAIL_LOGIN=true`), `development-simulator`, `preview` (`distribution: internal` = ad hoc, not TestFlight), `production`. No `submit` section, no channels.
  - `apps/mobile/app.config.ts`: name/slug/owner/scheme from `src/config/identity.ts`; `APP_VARIANT` chooses the bundle id — any variant except `production` uses `com.jinjinstar.aroom.dev`; an unset `APP_VARIANT` means **production**. Guards throw if `EXPO_PUBLIC_DEV_EMAIL_LOGIN` reaches production or `EXPO_PUBLIC_DEV_QUICK_LOGIN` reaches preview/production. `src/lib/AppContext.tsx:13-14` reads `EXPO_PUBLIC_SUPABASE_URL`/`EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, which builds get from the EAS environment (`"environment": "preview"`); without them the app falls back to the local stack. No `version`, no `runtimeVersion`, no `updates`, plugins `['expo-router', 'expo-apple-authentication']`.
  - `src/config/identity.ts`: `TODO(G2 …)` — production ids are placeholders and must not be registered. `EAS_PROJECT = { owner: 'zzzryt', projectId: '99310e9a-4aee-4116-b9da-b6a26460f7e3' }` (public, not a secret).
  - `apps/mobile/package.json`: Expo `~58.0.19`; no `expo-updates`, no `expo-application`.
  - `.github/workflows/ci.yml` (lint, typecheck, tests, pgTAP, deno, `node --test …`), `.github/workflows/secret-scan.yml`.
  - `app/(tabs)/settings/index.tsx` passes `Constants.expoConfig?.version` to `SettingsScreen` as `version`.

## 3. Scope

In: T101–T109. Out: any screen redesign (H02+), widgets (H04), notification code (H05), production bundle id or store listing, Android release.

## 4. Design extract (board V0-00 "출시 메모", verbatim, marked `OWNER DECISION PENDING` on the board)

- V0은 TestFlight로 오너와 여자친구에게 먼저: GitHub workflow_dispatch → EAS Build → EAS Submit → TestFlight.
- JS·문구·자산은 EAS Update(OTA) preview 채널에서 확인 후 production으로. 위젯 extension·권한·네이티브 변경은 새 빌드.
- 첫 빌드는 .dev 테스트 bundle id(com.jinjinstar.aroom.dev, 위젯 extension은 별도 id)로. 이름 확정 전 production 등록은 하지 않아요.

The spec turns "pending" into assumed defaults A-02 (`.dev` id), A-03 (internal testers), A-04 (EAS Update). Treat them as decided for this slice.

Settings "버전" row (board `V0-set-main-2`, key `set.help.version` "버전" / "Version" / "バージョン"): non-interactive row in the 도움 group, value drawn as `1.0.0 (12)` = `marketingVersion (buildNumber)`, no chevron. H02 rebuilds the settings screen; in this slice only make the value available (T108) and show it in the existing version row.

## 5. Configuration contract

### 5.1 `apps/mobile/eas.json` (target shape; keep existing profiles unchanged)

```jsonc
{
  "cli": { "version": ">= 16.0.0", "appVersionSource": "remote" },
  "build": {
    "development": { /* unchanged */ },
    "development-simulator": { /* unchanged */ },
    "preview": { /* unchanged: ad hoc internal */ },
    "testflight": {
      "distribution": "store",
      "channel": "preview",
      "autoIncrement": true,
      "env": { "APP_VARIANT": "preview", "EXPO_PUBLIC_APP_VARIANT": "preview" },
      "environment": "preview",
      "ios": { "resourceClass": "default" }
    },
    "production": { /* existing env */ "channel": "production", "autoIncrement": true }
  },
  "submit": {
    "testflight": { "ios": { "ascAppId": "<OWNER: numeric Apple ID of the .dev ASC app>", "appleTeamId": "43ZASDF2J7" } }
  }
}
```

- `APP_VARIANT=preview` makes `app.config.ts` pick `com.jinjinstar.aroom.dev` and the display name `Aroom (preview)`. Do not change that logic.
- `ascAppId` is not a secret. Until the owner provides it, commit the literal placeholder string `"ASC_APP_ID_REQUIRED"`; the release workflow must fail fast with a readable message when it sees that value and `submit=true` (T105).
- Remove `"ios": { "resourceClass": … }` if the current EAS schema rejects it (`@expo/eas-json` is a root devDependency — validate with it in T101).

### 5.2 `apps/mobile/app.config.ts`

Add to the returned `expo` object: `version: '1.0.0'`, `runtimeVersion: { policy: 'fingerprint' }`, `updates: { url: \`https://u.expo.dev/${EAS_PROJECT.projectId}\` }`, and `ios.infoPlist: { ITSAppUsesNonExemptEncryption: false }` (the app only uses standard HTTPS; the owner confirms this in App Store Connect — see §10). Do not add `ios.buildNumber` (remote version source owns it).

### 5.3 Workflows

`.github/workflows/release-ios.yml`:

```yaml
name: Release iOS
on:
  workflow_dispatch:
    inputs:
      profile: { description: EAS build profile, type: choice, options: [testflight], default: testflight }
      submit: { description: Submit to TestFlight after a successful build, type: boolean, default: true }
concurrency: { group: release-ios, cancel-in-progress: false }
jobs:
  build:
    runs-on: ubuntu-latest
    timeout-minutes: 120
    defaults: { run: { working-directory: apps/mobile } }
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: pnpm }
      - run: pnpm install --frozen-lockfile
        working-directory: .
      - uses: expo/expo-github-action@v8
        with: { eas-version: latest, token: '${{ secrets.EXPO_TOKEN }}' }
      - name: Check submit configuration
        if: inputs.submit
        run: node -e "const j=require('./eas.json');if(j.submit.testflight.ios.ascAppId==='ASC_APP_ID_REQUIRED'){console.error('Set submit.testflight.ios.ascAppId in apps/mobile/eas.json (owner step)');process.exit(1)}"
      - name: Build (and submit on success)
        run: eas build --platform ios --profile ${{ inputs.profile }} --non-interactive --wait ${{ inputs.submit && '--auto-submit-with-profile testflight' || '' }}
```

`.github/workflows/ota.yml`: `workflow_dispatch` with inputs `channel` (choice `preview` | `production`), `message` (string, required for preview), `group` (string, required for production). Same setup steps. Preview job env: `APP_VARIANT: preview`, `EXPO_PUBLIC_APP_VARIANT: preview` (otherwise `app.config.ts` resolves the production variant and the update's fingerprint runtime and bundle id do not match the TestFlight build). Preview: `eas update --channel preview --environment preview --platform ios --message "${{ inputs.message }}" --non-interactive` (`--environment` pulls the same EAS env vars the build used, e.g. the Supabase URL/key). Production: `eas update:republish --group "${{ inputs.group }}" --destination-channel production --non-interactive` (promotes the exact update the owner checked on preview; rollback = republish an older group). Fail with a readable message when the required input for the chosen channel is empty. Verify the exact CLI flags with `npx eas-cli@latest update --help` and `update:republish --help` and adjust; record the versions you checked in the PR.

Pin action versions (`@v4`, `@v8`), no `secrets.*` other than `EXPO_TOKEN`, no `pull_request` trigger.

## 6. Implementation steps

1. Branch `v0/s1-release-pipeline` from `main`.
2. Write T101 first: `tools/tests/release-config.test.mjs` (Node `node:test`, no new deps). It must assert:
   - `apps/mobile/eas.json` parses and validates with `@expo/eas-json` (`EasJsonAccessor`/`EasJsonUtils` — check the installed API), has `build.testflight` with `distribution: "store"`, `channel: "preview"`, `autoIncrement: true`, `env.APP_VARIANT === "preview"`; `build.production.channel === "production"`; `submit.testflight.ios.appleTeamId === "43ZASDF2J7"`.
   - Evaluating the app config for `APP_VARIANT=preview` gives bundle id `com.jinjinstar.aroom.dev`, `runtimeVersion.policy === 'fingerprint'`, `updates.url` ending with the project id. Load it with `process.env.APP_VARIANT = 'preview'; const { default: config } = await import('../../apps/mobile/app.config.ts?v=preview');` — Node 22 strips TypeScript types natively (on by default from 22.18; `.nvmrc` and CI use 22) and `app.config.ts` already imports `./src/config/identity.ts` with its extension. If your Node lacks type stripping, run the test with `--experimental-strip-types` in the CI line.
   - `ota.yml`'s preview path sets `APP_VARIANT=preview` and passes `--environment preview`.
   - Both workflow files exist, trigger only on `workflow_dispatch`, reference no secret except `EXPO_TOKEN`, and contain no string matching `/-----BEGIN|AuthKey_|\.p8|p12/`.
   - Name every test with its scenario id, e.g. `test('V0-F14-AC-01 testflight profile is store-signed and submits only after build', …)`.
   Run it and see it fail.
3. Add the test file to the last `node --test` line of `.github/workflows/ci.yml`.
4. `pnpm --filter mobile exec npx expo install expo-updates expo-application` (SDK-58-compatible versions; commit `pnpm-lock.yaml`). If `expo install` cannot run offline, add the versions the Expo SDK 58 bundledNativeModules list gives and say so in the PR.
5. Edit `app.config.ts` (§5.2) and `eas.json` (§5.1).
6. Add the two workflows (§5.3).
7. T108: create `src/config/version.ts` exporting `appVersionLabel(): string` = `` `${Application.nativeApplicationVersion ?? Constants.expoConfig?.version} (${Application.nativeBuildVersion ?? '-'})` `` (import `* as Application from 'expo-application'`), and pass `version={appVersionLabel()}` in `app/(tabs)/settings/index.tsx`. H02 rebuilds the settings screen and reuses `appVersionLabel()`, so keep the function name. Keep `SettingsScreen` untouched otherwise. Mock `expo-application` in Jest if the existing settings tests need it (`apps/mobile/package.json` `jest.moduleNameMapper` pattern).
8. Add `apps/mobile/ios/` and `apps/mobile/android/` to the root `.gitignore` (the project uses CNG; a committed native folder would make EAS ignore `app.config.ts`).
9. T107: rewrite the first paragraph of `apps/mobile/README.md` (the sentence "no store submission is configured" becomes false) and add a "Release" section: profiles, channels, runtime policy, the two workflows, and a link to this handoff's §10 owner steps.
10. Run the verification commands (§8). Open the PR.

## 7. Tests to write first

| Scenario | Test |
|---|---|
| V0-F14-AC-01 | release-config: testflight profile, submit profile, workflow builds before submit (`--auto-submit-with-profile` only on the build step, `--wait`) |
| V0-F14-AC-03 | release-config: `runtimeVersion` fingerprint + `updates.url`; `ota.yml` preview command |
| V0-F14-AC-04 | release-config: `ota.yml` production path uses `update:republish … --destination-channel production` |
| V0-F14-AC-05 | release-config: only `EXPO_TOKEN`, no key material; existing `secret-scan.yml` still passes |
| V0-F14-AC-06 | existing `apps/mobile/src/config/__tests__/identity.test.ts` still passes; add one assertion that no eas.json profile sets `APP_VARIANT=production` together with `distribution: store` and a `submit` profile pointing at it |
| V0-F12-AC-09 (part) | settings route test: version text renders `1.0.0 (N)` from the mocked `expo-application` |

AC-02 (build number grows, testers can install) and the live OTA check are device checks in `../quickstart.md` §TestFlight / §OTA; the owner runs them.

## 8. Verification commands

```sh
pnpm install --frozen-lockfile
pnpm lint && pnpm typecheck
pnpm --filter mobile test
node --test tools/tests/release-config.test.mjs
APP_VARIANT=preview pnpm --filter mobile exec npx expo config --type public | grep -E 'bundleIdentifier|runtimeVersion|updates'
```

Optional, needs network and an Expo login you do not have: `eas build:inspect`. Do not try to log in to Expo or Apple.

## 9. Definition of done

- T101–T108 done, T109 left for the owner and listed in the PR body as pending.
- All tests above pass locally; CI green on the PR.
- `pnpm-lock.yaml` updated only for the two new packages.
- No change under `design/`, `specs/001-*`, `supabase/`, or any screen besides the version string.

## 10. Owner-only steps (exact)

Do these once, in this order. Codex cannot do them (Apple/Expo accounts).

1. **Expo token** — expo.dev → Account settings → Access tokens → Create token "github-release". GitHub → `zzzRYT/couple-app` → Settings → Secrets and variables → Actions → New repository secret `EXPO_TOKEN` = that token.
2. **App Store Connect app record for the .dev id** — Apple Developer → Certificates, Identifiers & Profiles → Identifiers: confirm or create `com.jinjinstar.aroom.dev` (capabilities: Sign in with Apple, Associated Domains; App Groups is added in H04). App Store Connect → Apps → + → New App: platform iOS, name = "Aroom" if available, otherwise a unique variant such as "Aroom D+Day" (the app name is decided, D-08; the App Store listing and its visibility stay open), primary language Korean, bundle id `com.jinjinstar.aroom.dev`, SKU `aroom-dev`. Open App Information → copy **Apple ID** (a number) → put it in `apps/mobile/eas.json` `submit.testflight.ios.ascAppId` (edit on the PR branch or a follow-up commit; it is not a secret).
3. **App Store Connect API key for EAS Submit** — App Store Connect → Users and Access → Integrations → App Store Connect API → Team Keys → generate a key with the App Manager role → download the `.p8` once (keep it out of the repo; `*.p8` is already git-ignored). Then on your Mac: `cd apps/mobile && npx eas-cli@latest login && npx eas-cli@latest credentials -p ios` → choose the `testflight` build profile → App Store Connect: Manage your API Key → add it (key id, issuer id, the `.p8` path).
4. **Distribution certificate and provisioning profile** — still in `eas credentials -p ios` (profile `testflight`): let EAS generate/reuse a distribution certificate and an App Store provisioning profile for `com.jinjinstar.aroom.dev` with your Apple login (team `43ZASDF2J7`). Alternative: run one interactive build `npx eas-cli@latest build -p ios --profile testflight` locally, which offers the same setup.
5. **First release** — GitHub → Actions → Release iOS → Run workflow (`profile=testflight`, `submit=true`). Wait for the EAS build and submission. In App Store Connect → TestFlight, wait for "Processing" to finish; answer the export-compliance question if asked (the app declares `ITSAppUsesNonExemptEncryption=false` = standard HTTPS only).
6. **Internal testers (A-03)** — App Store Connect → Users and Access → + → invite your partner's Apple ID email with the least-privileged role that can be an internal tester, and limit app access to this app (check the role list on the page; roles change). After they accept: TestFlight → Internal Testing → + group "couple" → add both of you → enable automatic distribution. Each of you installs the TestFlight app and accepts the email invite. Builds expire after 90 days.
7. **OTA check** — after the PR's first build is installed: Actions → OTA → `channel=preview`, `message=ota smoke test` with a harmless JS change on a branch you build from (or the next slice's merged JS change). Reopen the app twice; the change shows. Promote with `channel=production` and the group id printed by the preview run when a production build exists.
8. Record in the PR (or tell firstmate): build number, TestFlight install OK on both phones, OTA OK.

## 11. Out of scope

Production bundle id/App Store listing (G2/A-02), external testers and Beta App Review, Android release, Hot Updater, widget extension (H04), any UI change beyond the version string.

## 12. Open decisions (do not decide; ask via `needs-decision`)

- None block this slice. If EAS rejects `distribution: store` for a non-production bundle id, or the ASC app name collides, stop and report.

## 13. PR rules and hand-back protocol

- One PR, branch `v0/s1-release-pipeline`, base `main`, **non-draft**, title `S1: release pipeline (EAS Build/Submit/Update, TestFlight)`. **Do not merge.**
- PR body: summary; table `scenario id → test file → result`; commands run with pass/fail; "Owner-only steps pending: §10 1–8"; anything you could not verify.
- Follow the status protocol in your own launch brief (append `working`/`done`/`needs-decision`/`blocked` lines). Report `done` with the full PR URL. Use `needs-decision` for anything in §12 or any product/design question; never guess a design fact.
