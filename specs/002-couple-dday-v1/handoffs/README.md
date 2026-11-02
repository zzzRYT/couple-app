# V1 Codex handoffs (couple D+Day)

Six self-contained handoffs, one per slice of `../tasks.md`. Each handoff plus the files in `./design/` it names is everything a Codex worker needs: Codex cannot open the Claude Design artifact, so all design facts were extracted from the canonical boards (artifact https://claude.ai/artifact/M2WFQCFnVzoWbHNhJPCz5X, version `1793598115-fafc`) and verified claim by claim (each extract starts with its verification line). Where a board does not show a value, the extract says `verify against board <id>` and the handoff gives a default to use and report.

## Order, dependencies, dispatch

| # | Handoff | Slice | Tasks | Scenario ids | Depends on | Suggested harness · model · effort |
|---|---|---|---|---|---|---|
| 1 | [H01-release-pipeline.md](./H01-release-pipeline.md) | S1 release pipeline, blank TestFlight build | T101–T109 | V0-F14-AC-01…06, V0-F12-AC-09 (part) | — | Codex · gpt-6-luna · medium (mechanical config + static tests) |
| 2 | [H02-v1-shell-home.md](./H02-v1-shell-home.md) | S2 V1 shell, connect flow, D+Day home, settings | T201–T216 | V0-F01-AC-*, V0-F02-AC-*, V0-F03-AC-*, V0-F09-AC-01/-03/-05, V0-F12-AC-01…08/-10, V0-F13-AC-*, V0-DR-01…03/-05, V0-EC-02/-03/-07/-10, V0-NF-01/02/03/06 | — (parallel with H01) | Codex · gpt-6.1-terra · high |
| 3 | [H03-anniversaries.md](./H03-anniversaries.md) | S3 anniversary model and screens | T301–T309 | V0-F04-AC-*, V0-F05-AC-*, V0-F06-AC-*, V0-F07-AC-*, V0-F08-AC-*, V0-F09-AC-02/-04/-05, V0-F12-AC-02, V0-DR-01…06, V0-EC-01/-04/-05/-06/-08/-12, V0-NF-05 | H02 | Codex · gpt-6.1-terra · xhigh (concurrency, RLS, date engine) |
| 4 | [H04-ios-widgets.md](./H04-ios-widgets.md) | S4 widgets (App Group PoC first) | T401–T405 | V0-F11-AC-01…09, V0-NF-04 | H01, H03 | Codex · gpt-6.1-terra · xhigh (native extension, signing) |
| 5 | [H05-local-notifications.md](./H05-local-notifications.md) | S5 local notifications | T501–T506 | V0-F10-AC-01…08 | H03 (H04 recommended) | Codex · gpt-6.1-terra · high |
| 6 | [H06-polish-release.md](./H06-polish-release.md) | S6 i18n, a11y, deletion, store metadata, regression | T601–T606 | V0-NF-01/02/04, V0-F12-AC-07…10, V0-F14-AC-06, SC-004/006/007 | H02–H05 | Codex · gpt-6-luna · high for the sweep; escalate to gpt-6.1-terra if the traceability gaps need new tests |

```text
H01 ─┐
     ├─► (owner gate) ─► H03 ─► (gate) ─► H04 ─► (gate) ─► H05 ─► (gate) ─► H06
H02 ─┘
```

H01 and H02 are ready to run now and overlap only slightly: both touch `apps/mobile/package.json`/`pnpm-lock.yaml` (H01 adds `expo-updates`, `expo-application`; H02 adds `expo-file-system`) and the settings route, where H01 creates `src/config/version.ts` (`appVersionLabel()`) and H02 reuses it (H02 creates the same file with the same function if H01 is not merged yet). Merge H01 first; H02 rebases with a lockfile regeneration.

### How a firstmate dispatches a handoff

1. Launch a Codex worker in a fresh worktree of `zzzRYT/couple-app` from the latest `main`, with a direct-PR brief whose task text is: "Implement `specs/002-couple-dday-v1/handoffs/H0N-….md` exactly. The handoff and the files in `specs/002-couple-dday-v1/handoffs/design/` it names are the full spec; read `specs/002-couple-dday-v1/{spec,plan,data-model}.md` and `contracts/` as referenced. Open a non-draft PR to `main`, do not merge."
2. Ship branch = the branch named in the handoff header (`v1/s1-release-pipeline`, `v1/s2-shell-home`, `v1/s3-anniversaries`, `v1/s4-widgets`, `v1/s5-notifications`, `v1/s6-polish`).
3. Forward the handoff's "owner-only steps" to the owner when the PR is up; H04 has a mid-slice `needs-decision` checkpoint after the App Group PoC.
4. On `done`, read the PR's scenario → test table and screenshots, then run the gate below before dispatching the next handoff.

### Verification gate between slices

A slice is accepted only when all of these hold; then the next handoff is dispatched:

- CI green on the PR; every scenario id listed for the slice appears in a passing test (or, for device-layer ids, in the PR's device evidence).
- The owner approves on **a TestFlight build** (after H01 is merged; JS-only slices may reach the phones through an OTA update to the `preview` channel) **or, before H01 lands, on simulator proof** (screenshots per screen id in light/dark and one en/ja sample, attached to the PR) against the board frames named in the handoff.
- The PR is merged by the configured merge authority (workers never merge).
- Native changes (H04 widget extension, any new native module or config-plugin change) always go through Release iOS, never OTA (`runtimeVersion` is `fingerprint`).

## Owner decisions still open (assumed defaults in use)

Full table: `../spec.md` → "Decisions and Assumed Defaults". The ones that change what a worker builds:

| ID | Open decision | Assumed default used by the handoffs | Affects |
|---|---|---|---|
| A-01 | App and mascot name (boards: 모피루/Mopiru · 모피/Mopi; repo: Aroom/아루미) | i18n brand keys `app.name`, `mascot.name` with the board values; every other string nests them; iOS display name stays `APP_IDENTITY.name`; Korean particles revisited when the name is final | H02, H04, H06 |
| A-02 | Production bundle id | not registered; TestFlight uses `com.jinjinstar.aroom.dev`, widgets `com.jinjinstar.aroom.dev.widgets`, group `group.com.jinjinstar.aroom.dev` | H01, H04 |
| A-03 | TestFlight tester method | internal testers (ASC users, least privilege) | H01 owner steps |
| A-04 | OTA provider | EAS Update, channels `preview`/`production`, runtime `fingerprint` | H01 |
| A-05 | Partner's closed phone | changes apply at next app open (no server push) | H04, H05 |
| A-11 | Widget handwriting fonts | bundle Gaegu/Yomogi in the extension; else numbers in SF Rounded | H04 |
| A-18 | Notification cap | 50 nearest per device | H05 |
| A-19 | Per-anniversary notification off | this device only | H03, H05 |
| A-21 | Widget technology | `expo-widgets` PoC first, Swift via `@bacons/apple-targets` as fallback | H04 |
| A-23 | Support email / terms page | none yet → contact row hidden, terms row disabled | H06 |
| — | Missing font weights (Noto Sans KR 500, Zen Maru Gothic 400/500) | not bundled; nearest weight; listed per PR | H02–H06 |

## Files in `./design/`

| File | Boards | Used by |
|---|---|---|
| `foundations.md` | V0-00 flow (verbatim rules, release memo), S19 tokens/type, S20 accessibility, S22 components, code mismatches | all |
| `V0-01-start.md` | V0-01 sign-in and connect (13 light + dark + en/ja frames) | H02, H05 (notify) |
| `V0-02-03-home-states.md` | V0-02 home, V0-03 system states | H02, H03 |
| `V0-04-anniv.md` | V0-04 list and detail | H03 |
| `V0-05-anniv-edit.md` | V0-05 add/edit (13 frames) | H03, H05 |
| `V0-06-widgets.md` | V0-06 widgets (all families, appearances, states) | H04 |
| `V0-07-settings.md` | V0-07 settings (11 frames) | H02, H05, H06 |
| `copy-v0.md` | all `copy-v0-*` boards: 278 keys, ko/en/ja + status | H02 (generates the overlay), all |
