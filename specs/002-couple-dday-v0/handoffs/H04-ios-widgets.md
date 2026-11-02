# H04 — iOS widgets: App Group PoC first, then home and lock screen widgets (slice S4)

| | |
|---|---|
| Slice | S4 · tasks T401–T405 in `../tasks.md` |
| Requirements | V0-F11 (V0-F11-AC-01 … -09), V0-NF-04, parts of V0-F12-AC-07/-08/-10 and V0-F13-AC-05 (clear widget data) |
| Depends on | **H01 merged** (EAS build/submit path — the PoC must run on a store-signed TestFlight build) and **H03 merged** (`computeAnniversaries`, custom anniversaries, birthdays in the snapshot). Owner approval of S3 |
| Unblocks | H05 (shares the "data changed" hook points), H06 |
| Branch / PR | `v0/s4-widgets` → PR to `main`, non-draft, do not merge. **Two checkpoints**: push the PoC (T401) first and report `needs-decision` with the PoC result before building all layouts |
| Design source | artifact https://claude.ai/artifact/M2WFQCFnVzoWbHNhJPCz5X, version `1793598115-fafc`, board V0-06 (widgets) + `copy-v0-widgets` |

`./design/V0-06-widgets.md` (verified: sizes, paddings, per-appearance colors, fonts, states, icon SVG paths, verbatim notes), `./design/foundations.md` and `./design/copy-v0.md` are part of this handoff. Do not invent missing values; the extract's §6 lists what the board leaves open.

## 1. Goal and why

The owner's core ask is "see our D+Day on the home screen and lock screen". Build the iOS widget extension: home `systemSmall`, `systemMedium`, `systemLarge` and lock `accessoryCircular`, `accessoryRectangular`, `accessoryInline`, in full color, dark, tinted (iOS 18), clear (iOS 26) and vibrant lock appearances, fed by an App Group snapshot the app writes. Signing/App Group is the biggest early risk, so prove it on a real TestFlight build before drawing everything.

## 2. Prerequisites and current code

- After H01: `eas.json` `testflight` profile (store, channel `preview`), `release-ios.yml`, `runtimeVersion: fingerprint` (adding an extension changes the fingerprint → this slice ships as a **new build**, never OTA).
- After H02/H03: `src/lib/anniversaries.ts` (`computeAnniversaries`, `Occurrence`), snapshot fields (`me`, `members[]`, `anniversaries`), `features/space/v0Cache.ts`, logout/disconnect/ended/delete paths in `features/settings/logout.ts`, `features/lifecycle/*`, `features/account/deleteAccount.ts` (`clearDeviceAfterDeletion`).
- `apps/mobile/app.config.ts`: scheme `['aroom-dev', 'aroom']` for non-production variants; plugins list; `src/config/identity.ts` holds ids (add `appGroupId` and `widgetBundleIdSuffix` here as parameters, values for the `.dev` app: `group.com.jinjinstar.aroom.dev`, `com.jinjinstar.aroom.dev.widgets`; production values stay placeholders, A-02). `src/config/__tests__/identity.test.ts:17` fails on any other `.js`/`.ts` file under `apps/mobile` that spells `com.jinjinstar.aroom`, so every id in plugin config, target config or tests must be derived from `identity.ts`.
- Expo SDK 58 `expo-widgets` (docs: https://docs.expo.dev/versions/v58.0.0/sdk/widgets/): config plugin creates the extension + App Group; widgets are declared with families; the widget component runs in an isolated runtime with Expo UI SwiftUI components only (no hooks, no app state, no async); the app calls `updateSnapshot` / `updateTimeline` / `reload`. Fallback: `@bacons/apple-targets` (https://github.com/EvanBacon/expo-apple-targets) + Swift `TimelineProvider` reading the App Group JSON. Verify the exact package APIs and versions you install; record them in the PR.

## 3. Scope

In: T401–T405. Out: Android widgets, widget configuration/intents (no user-configurable options), notification scheduling (H05), pushing from the server.

## 4. Design extract index

| Topic | Extract section | Notes |
|---|---|---|
| Notes, sizes, tap targets, refresh, constraints, appearance, gallery names | `design/V0-06-widgets.md` §1.1–1.7 | Verbatim board notes. Two widget kinds: **D+Day** (small, medium, large, circular, rectangular, inline) and **다가오는 기념일** (medium, large). Gallery previews show the placeholder look, not sample data. |
| Fonts | §1.8 | Display Gaegu 700 (ko/en) / Yomogi (ja; only 400 exists — never fake-bold); emphasis Noto Sans KR / Zen Maru Gothic; body Gowun Dodum / Zen Maru; lock screen Noto Sans KR only; line height 1.25×. Bundle the font files in the extension; if impossible, numbers use SF Rounded (`.fontDesign(.rounded)`) — A-11, report which. |
| Colors per appearance | §1.9, §2.4, §2.8 | Light/dark hex → tokens; tinted/clear: only the D+N number and heart are `widgetAccentable`; colored tiles become bare line icons. Dark widget bg is `#2B2320` (dark `bg`, not `surface`). |
| systemSmall (3 variants: 기본 / 다음 / mascot — board name "모피", now 아루미) | §2.1 | 158×158 drawn, padding 14. Which variant ships by default: §8 decision. |
| systemMedium | §2.2 | 3 anniversaries, no dates. |
| systemLarge | §2.3 | 5 anniversaries with dates, mascot. |
| accessoryCircular (+gauge), Rectangular, Inline | §2.5–2.7 | No names; custom titles privacy-sensitive; gauge semantics not on the board (§8). |
| States: 보통, 오늘, 상대 연결 전, 공간 없음, 공간 끝남, 자리표시 | §3 | Drawn for small (all), medium (today, pending, placeholder), large (placeholder); infer the rest from the same elements and report. |
| Context and localisation (en/ja, shrink-to-fit sizes) | §4 | Long strings shrink numbers to fixed smaller sizes (e.g. "In 9 days" 40 → 26), not reflow. |
| Drawn data needs | §5 | Matches the snapshot schema below. |
| Icons | §6.1 (+ SVG paths in §2/§3) | Custom drawings, not SF Symbols: Pepero sticks, tree, cake, star, medal, heart (filled for names, outline for "공간 없음"), 4-point sparkle (today), clock (pending), broken link (ended). Export them as template PDF/SVG assets in the extension (or SwiftUI `Path`), never runtime `/_blob` images. |
| Open items | §6 | Mascot pose/PNG size, gauge meaning, deep-link routes not written as URLs, missing keys (loading text, "상대" placeholder in medium). |

Copy keys: `widget.gallery.dday.name/.desc`, `widget.gallery.list.name/.desc`, `widget.next`, `widget.today`, `widget.pending`, `widget.pending.body`, `widget.none.title` (contains `$t(app.name)`), `widget.none.body`, `widget.ended`, `widget.a11y`, `widget.lock.days`, plus common `dday.*`, `anniv.*`, `date.*` (see `design/copy-v0.md`). Gallery name/description strings are compile-time extension strings: add them to the extension's localized `InfoPlist`/`Localizable.strings` (ko, en, ja) generated from the overlay JSON by a small script so the copy has one source.

## 5. Data contract — App Group snapshot

Schema: `../contracts/widget-snapshot.schema.json` (`schemaVersion: 1`). Summary:

```jsonc
{
  "schemaVersion": 1, "writtenAt": "2026-11-02T03:00:00Z", "spaceId": "…",
  "state": "normal",            // normal | pending | none | ended
  "locale": "ko-KR", "timeZone": "Asia/Seoul", "startDate": "2025-06-29",
  "names": { "me": "도담", "partner": "하루" },          // home widgets only; never on lock layouts
  "strings": { "dday.together": "함께한 지", "widget.next": "다음", "…": "…" }, // pre-translated
  "entries": [                                            // one per space-zone midnight, ≥35 days when normal/pending
    { "date": "2026-11-02", "showAt": "2026-11-01T15:00:00Z", "dayCount": 492,
      "next": [ { "key": "season:pepero:2026", "kind": "season", "title": "빼빼로데이", "date": "2026-11-11", "daysLeft": 9, "privacySensitive": false } ] }
  ]
}
```

- Built by a pure function `buildWidgetSnapshot(input, nowIso, t)` in `apps/mobile/src/features/widgets/snapshot.ts` from the same inputs as `computeAnniversaries` + names + locale; `entries[i]` is computed by calling the engine with `nowIso` = that day's `showAt` (so D+N, today and D-n are exact per midnight in the **space** time zone, V0-DR-05).
- `next` holds up to 5 items (large shows 5, medium 3, small/lock 1). `today` uses the same priority rule as the home card (주년 > 일수 > 생일 > 직접 > 시즌).
- Privacy (V0-NF-04): no birth year, memo, user ids, tokens, email. `privacySensitive: true` for custom titles and for birthday titles containing a name. Lock layouts never render `names` and must wrap titles in `.privacySensitive()`.
- `state: 'none'` (signed out / no space) and `'ended'` carry a single entry and no names/titles.
- Omit `today` when there is no anniversary that day (the schema allows the item or `null`; prefer omitting).
- Validate the output against the JSON Schema in Jest with `ajv/dist/2020` (draft 2020-12) plus `ajv-formats` (for `date-time`/`uuid`) as devDependencies of `apps/mobile`.

Writer (`features/widgets/writer.ts`): serialise, write atomically (write temp + rename in the App Group container, or the single `updateTimeline` call if expo-widgets owns storage), then reload all timelines. Call it from: snapshot sync success (`useSnapshotSync` consumer in `SpaceContext`), app foreground, custom anniversary/profile/start-date/time-zone mutations (they refresh the snapshot anyway), language change, logout, disconnect, space ended (Realtime or open), account deletion (`clearDeviceAfterDeletion` gains a `clearWidgets` dep). Debounce to one write per 500 ms.

Timeline policy: entries at each `showAt`; `.atEnd` reload policy. When the last entry is in the past (app not opened for >35 days), show the last entry with D+N computed by the extension if Swift is used; with expo-widgets, show the last entry (stale) — record which in the PR.

Deep links (the board writes `mopiru://…`, drawn before the name decision D-08; the app is Aroom): use the configured scheme (`aroom-dev` for the TestFlight variant, from `app.config.ts`) with expo-router paths — small/accessory → `/home`; medium/large rows → `/anniversary/<encodeURIComponent(occurrence key)>` (H03 root route), rest → `/home`; today → `/home` (card is there); pending → `/home` (invite card); none → `/` (start). Build the scheme from config, never hard-code `mopiru`. Detail links use H03's root route: `/anniversary/<encodeURIComponent(key)>`.

## 6. Implementation steps

1. Branch `v0/s4-widgets`.
2. **T401 PoC (stop after it)**:
   - `npx expo install expo-widgets` (SDK 58). Add the plugin in `app.config.ts` with the extension bundle id `${iosBundleId}.widgets` and App Group from `identity.ts`; families as in §4; one trivial widget that renders a number read from the shared snapshot.
   - App side: a dev-only button is **not** allowed in shipped UI; instead write `{ schemaVersion: 1, state: 'normal', … minimal }` from `SpaceContext` after the first snapshot so the PoC shows the real D+N.
   - Run `npx expo prebuild -p ios --clean` locally to inspect the generated extension target, entitlements (`com.apple.security.application-groups` on both targets) and Info.plist; do not commit `ios/` (CNG; H01 adds `apps/mobile/ios/` to `.gitignore` — add it yourself if missing).
   - Push the branch; ask firstmate/owner (`needs-decision`) to run Release iOS on this branch (the workflow builds the default branch unless dispatched on the PR branch — dispatch on `v0/s4-widgets`) and to add the small + circular widgets on a phone. Owner steps §9.1–9.3 must be done first.
   - Decision rule: works → continue with expo-widgets. Signing/App Group/SDK failure that you cannot fix in two attempts → switch to `@bacons/apple-targets` + Swift (`targets/widget/` with `expo-target.config.js`, Swift `TimelineProvider` decoding the same JSON) and report why.
3. **T402** `snapshot.ts` + tests (§7) — pure, independent of the widget library.
4. **T403** `writer.ts` + hook points + tests with the native module mocked.
5. **T404** Layouts for every family × appearance × state per the extract. Keep each layout a small pure view of one entry. Accessibility: one sentence per widget from `widget.a11y` ("함께한 지 {n}일째. 다음 기념일 {title}, {left}"). Respect `widgetRenderingMode` (fullColor / accented / vibrant) and `showsWidgetContainerBackground` for clear/StandBy.
6. **T405** Gallery strings, deep links, device checklist (`../quickstart.md` §위젯) with photos/screenshots in the PR.

## 7. Tests to write first

| Scenario ids | Test | Assert |
|---|---|---|
| V0-F11-AC-05, -06, -07, -09, V0-NF-04 | `apps/mobile/src/features/widgets/__tests__/snapshot.test.ts` | schema-valid for normal/pending/none/ended; ≥35 entries; `showAt` = space-zone midnight (Asia/Seoul and America/New_York across DST); today item + priority; next ≤5 sorted; no year/memo/ids/tokens anywhere in the JSON (string search); custom titles flagged; names absent for none/ended; strings localized for ko/en/ja |
| V0-F11-AC-09, V0-F13-AC-05, V0-F12-AC-07, -08, -10 | `features/widgets/__tests__/writer.test.ts` | writes on each trigger; debounced; logout/disconnect/ended/delete write `none`/`ended`; reload called |
| V0-F11-AC-02 | `tools/tests/widget-strings.test.mjs` (add it to the `node --test` line in `.github/workflows/ci.yml`) | gallery strings in ko/en/ja match the overlay |
| V0-F11-AC-01, -03, -04, -08 | device checklist | photos per family/appearance; midnight rollover without opening the app; airplane mode; reboot; tap targets |

## 8. Open decisions (defaults; report via the PR, ask only if blocking)

| Decision | Default |
|---|---|
| Which small variant is the default (기본 / 다음 / mascot) | 기본; expose the others only if expo-widgets supports multiple small widgets cheaply — otherwise V0 ships 기본 only |
| Gauge meaning (drawn at ~70%) | progress toward the next anniversary: `1 − daysLeft / (days between previous and next occurrence)`; mark "verify against board" |
| Does "다가오는 기념일" reuse the D+Day medium/large layout | separate kind with the list-only layout (no hero) if drawn; else reuse and report |
| Mascot PNG size/pose | `mascot_wave_main` from the app assets at @2x/@3x; hidden in tinted/clear/lock |
| Font bundling impossible | numbers in SF Rounded (A-11) |
| Stale timeline beyond 35 days with expo-widgets | show the last entry; Swift fallback recomputes |

## 9. Owner-only steps (exact)

1. Apple Developer → Identifiers → App Groups → + → `group.com.jinjinstar.aroom.dev`.
2. Identifiers → `com.jinjinstar.aroom.dev` → enable **App Groups** → configure → select the group. Identifiers → + → App IDs → `com.jinjinstar.aroom.dev.widgets` (description "Aroom dev widgets") → enable **App Groups** with the same group. (EAS can create the extension identifier during credentials setup; App Groups assignment must still be checked here.)
3. `cd apps/mobile && npx eas-cli@latest credentials -p ios` → profile `testflight` → let EAS regenerate the provisioning profiles for **both** targets (app and `.widgets`) so they include the App Group. Then GitHub → Actions → Release iOS → Run workflow **on branch `v0/s4-widgets`**.
4. On both phones: install the TestFlight build → long-press home screen → + → search the app → add D+Day small and medium; lock screen → customise → add circular and rectangular. Report what you see (photo) for the PoC checkpoint, then later run the full checklist in `../quickstart.md` §위젯 (iOS 18 tinted: home screen edit → Customize → Tinted; iOS 26 clear: Clear).
5. Approve the slice against board V0-06 frames.

## 10. Out of scope

Android widgets, configurable widgets (AppIntent), Live Activities, StandBy-specific layouts beyond what the system derives, server push to refresh widgets, OTA updates of the widget layout (assume a new build for any widget change).

## 11. PR rules and hand-back protocol

- Branch `v0/s4-widgets`, base `main`, **non-draft**, title `S4: iOS widgets (home + lock screen) via App Group`. **Do not merge.**
- Checkpoint 1: after T401 push, append `needs-decision` (PoC ready for the owner's device run; options: continue with expo-widgets / switch to Swift) per your launch brief, wait for the answer, then continue.
- PR body: PoC result; library and versions; scenario → test table; device photos per family/appearance/state; §8 defaults used; list of design values that differ from the board and why.
- Report `done` with the full PR URL.
