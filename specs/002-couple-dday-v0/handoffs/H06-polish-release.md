# H06 — Polish: i18n, accessibility, account deletion regression, store metadata and privacy, full regression (slice S6)

| | |
|---|---|
| Slice | S6 · tasks T601–T606 in `../tasks.md` |
| Requirements | V0-NF-01, V0-NF-02, V0-NF-04, V0-F12-AC-07/-08/-09/-10, V0-F14-AC-06, SC-004, SC-006, SC-007 |
| Depends on | **H02–H05 merged** (H04 and H05 at least in the build under test). Owner approval of S5 |
| Unblocks | the V0 TestFlight "release candidate" the owner and partner use day to day |
| Branch / PR | `v0/s6-polish` → PR to `main`, non-draft, do not merge |
| Design source | artifact https://claude.ai/artifact/M2WFQCFnVzoWbHNhJPCz5X, version `1793598115-fafc`; all V0 boards; en/ja frames; S19/S20/S22 foundations |

`./design/*.md` (all extracts) and `./design/copy-v0.md` are part of this handoff. This slice adds no new screens; it makes every V0 screen match its board in all three languages, both themes, large text and VoiceOver, and closes data-removal and store-readiness gaps.

## 1. Goal and why

Before the owner hands the app to their partner for daily use: no clipped Japanese/English text, no unlabeled buttons, Reduce Motion respected, account deletion/disconnect/logout leave nothing behind (server, widgets, notifications, local keys), legal/help rows point somewhere real, App Store Connect privacy answers match what V0 collects, and a traceability check proves every spec scenario has a test.

## 2. Prerequisites and current code

- After H02–H05: V0 screens, overlay copy, `V0_FEATURES`, widget writer, notification scheduler.
- Fonts bundled today (`apps/mobile/assets/fonts`): `Gaegu_700Bold`, `GowunDodum_400Regular`, `Inter_400Regular` (unused per S19), `NotoSansKR_400Regular`, `NotoSansKR_700Bold`, `NotoSansJP_400Regular`, `NotoSansJP_700Bold`, `Yomogi_400Regular`, `ZenMaruGothic_700Bold`; `src/theme/fonts.ts`, `typography.ts`. Boards also use Noto Sans KR 500, Zen Maru Gothic 400/500 (see `design/foundations.md` §3). `tools/tests/font-glyphs.test.mjs` checks glyph coverage.
- Public site (`site/`): `/privacy/`, `/support/`, `/delete-account/` (+ `/en/`, `/ja/`), draft copy that still describes the room/AI features (the Korean privacy page still mentions the room and AI); `site/contact.js` `supportEmail = ''`; **no terms page exists**. `src/config/identity.ts` `supportEmail: null`, `supportDomain: 'aroom.jinjinstar.com'`.
- Settings help rows (H02) currently disabled where no URL exists.
- Account deletion: `supabase/functions/account/runner.ts` state machine, `tools/tests/account-deletion.test.mjs`, `supabase/tests/account_deletion*.test.sql`; new V0 data is covered by cascades (`user_profile` → `auth.users`; `space_anniversary` → `couple_space`; `created_by/updated_by` set null) — prove it.

## 3. Scope

In: T601–T606. Out: new features, the production bundle id / App Store listing / public release (G2, A-02), legal approval of policy text (owner), moving copy into `design/` (PR 25 follow-up only, T606).

## 4. Design extract index (what "matches the board" means here)

| Check | Source |
|---|---|
| en/ja layouts and line-height ratios (ko 1.5, en 1.4, ja 1.6), Japanese faces (Zen Maru Gothic body, Yomogi display at 400 only) | `design/foundations.md` §3; each extract's en/ja section (V0-01 §3, V0-02-03 §3.1–3.2, V0-04 §3.13, V0-05 EN/JA, V0-06 §4, V0-07 §3.13) |
| Accessibility checklist (48 pt targets, safe areas, 200% text, Reduce Motion, VoiceOver names, focus order, colour not the only signal) | `design/foundations.md` §6; per-screen a11y notes in each extract |
| Component mismatches between boards and `src/ui` (buttons, fields, chips, banner, list row, dialog, toast) still open after H02–H05 | `design/foundations.md` §5 |
| Help rows | `design/V0-07-settings.md` §1 (help rows), §3.2 (`V0-set-main-2`): 문의하기, 개인정보 처리방침, 이용약관 (external), 버전 `1.0.0 (12)` static |

## 5. Implementation steps

1. Branch `v0/s6-polish`.
2. **T601 i18n + a11y sweep**
   - Render every V0 screen test in `ko-KR`, `en-US`, `ja-JP` (parameterise existing RNTL tests) and assert no missing-key fallbacks (i18next `saveMissing` handler or a `missingKeyHandler` that throws in tests).
   - Large text: in RNTL, render with `fontScale: 2` (pass a `fontScale` the way `features/auth/__tests__/agegate.test.tsx:31` does) and assert that no `numberOfLines` truncation hides required text on: home hero, celebration card, list rows, edit form, settings rows. Fix by wrapping, not shrinking (S20 rule; big D+N may split "Day" and the number onto two lines).
   - VoiceOver: every `Pressable`/icon button has `accessibilityRole` + label from a key; D+N reads `dday.a11y`; rows read `anniv.row.a11y`; tabs read `a11y.tab`. Add a test helper that walks the rendered tree and fails on unlabeled touchables.
   - Reduce Motion: mascot hop/twinkle and toasts use the still pose / no transition (`AccessibilityInfo.isReduceMotionEnabled`, existing `ui/motion.ts`).
   - Fonts (owner decision §9): if approved, add `NotoSansKR_500Medium`, `ZenMaruGothic_400Regular`, `ZenMaruGothic_500Medium` (OFL, from the same Google Fonts sources as the existing files, with licence files under `assets/fonts/licenses`) and map them in `fonts.ts`/`typography.ts`; remove the unused `Inter` registration only if `font-glyphs.test.mjs` and the licences screen do not depend on it. Without approval: leave fonts as they are and list the substitutions.
3. **T602 help rows**
   - 문의하기: `mailto:` with `APP_IDENTITY.supportEmail`; when `null`, hide the row (A-23).
   - 개인정보 처리방침: `https://${supportDomain}/privacy/` (`/en/privacy/`, `/ja/privacy/` by app language) via `WebBrowser.openBrowserAsync` (`expo-web-browser`; add with `npx expo install` if missing) or `Linking.openURL`.
   - 이용약관: no page exists → keep the row disabled and list it as an owner decision (§9); do not invent a URL.
   - 버전: `nativeApplicationVersion (nativeBuildVersion)` from H01.
4. **T603 removal regression** — tests that after logout, disconnect, ended (both partner-disconnect and partner-deleted) and account deletion: `getAllScheduledNotificationsAsync()` has no `v0:` ids; the widget writer wrote `state: 'none'` or `'ended'`; secure-store keys `v0.invite.*`, `v0.celebration.seen.*`, `v0.connected.seen.*`, `v0.partnerEdited.seen.*` and the files `v0-notify-<userId>.json`, `v0-cache-<userId>.json` are gone; the profile scrub (`begin_account_deletion`) nulls `display_name` and `birth_*`. Server: pgTAP proving `user_profile` row and the member's `space_anniversary` authorship become null/removed after `auth.users` deletion and that purge removes `space_anniversary` rows with the space; extend `tools/tests/account-deletion.test.mjs` only if it enumerates tables.
5. **T604 store metadata and privacy (docs only, in `apps/mobile/README.md` → "TestFlight and App Store Connect")**
   - App Privacy answers for V0 (data linked to the user, not used for tracking): Contact Info → Name (display name); User Content → Other user content (custom anniversaries, birthday month/day); Identifiers → User ID (account id); Diagnostics → none unless a crash SDK exists (none today). No location, no contacts, no ads.
   - Export compliance: `ITSAppUsesNonExemptEncryption = false` (H01).
   - TestFlight "What to Test" text (ko + en), beta description, feedback email = `supportEmail` when set.
   - Note the `site/` privacy pages still describe room/AI processing; propose the V0 wording changes as a checklist for the owner (do not publish policy text yourself).
6. **T605 regression and traceability**
   - `tools/tests/traceability.test.mjs` (Node): parse every scenario id (`V0-F\d\d-AC-\d\d`, `V0-DR-\d\d(-AC-\d\d)?`, `V0-EC-\d\d`, `V0-NF-\d\d`) from `specs/002-couple-dday-v0/spec.md`; grep test files (`apps/mobile/src/**/__tests__/**`, `supabase/functions/**/__tests__/**`, `supabase/tests/**`, `tools/tests/**`) for each id; ids whose layer in `plan.md` §10 is "기기"/device must instead appear in `specs/002-couple-dday-v0/device-checks.md` (create it: id → date → device → result, filled from the owner's runs). Fail listing the missing ids. Add to CI's `node --test` line.
   - Run the full verification set (§6) and the two-simulator flow; run `../quickstart.md` end to end on TestFlight with the owner.
7. **T606** if PR https://github.com/zzzRYT/couple-app/pull/25 (design-sync) is merged, open a GitHub issue "Move V0 overlay copy into the design-sync copy source" describing the mapping (`apps/mobile/src/i18n/locales/v0/copy-v0.md` → design copy files) — do not move it in this PR.

## 6. Verification commands

```sh
pnpm install --frozen-lockfile
node tools/i18n/build-v0-overlay.mjs && git diff --exit-code apps/mobile/src/i18n/locales/v0
pnpm lint && pnpm typecheck && pnpm --filter mobile test
supabase start -x studio,imgproxy,vector,logflare,supavisor && supabase test db && deno test -A supabase/functions
node --test tools/tests/release-config.test.mjs tools/tests/traceability.test.mjs tools/tests/account-deletion.test.mjs tools/tests/font-glyphs.test.mjs   # quota-concurrency.test.mjs needs LOCAL_DATABASE_URL as in ci.yml
node tools/ci/check-migrations.mjs && node tools/ci/check-functions-boot.mjs && node tools/ci/check-schemas.mjs
```

## 7. Tests to write first

| Scenario ids | Test |
|---|---|
| V0-NF-02 | locale-parameterised screen tests + missing-key handler |
| V0-NF-01 | large-text and unlabeled-touchable helpers over every V0 screen test |
| V0-F12-AC-07, -08, -10, SC-006 | `features/account/__tests__/delete.test.tsx`, `features/lifecycle/__tests__/lifecycle.test.tsx`, `features/settings/__tests__/logout.test.tsx` extended; pgTAP `v0_account_deletion.test.sql` |
| V0-F12-AC-09 | settings help rows test (mailto hidden when null, privacy URL per language, terms disabled, version text) |
| SC-004 | `tools/tests/traceability.test.mjs` |

## 8. Owner-only steps

1. App Store Connect → the `.dev` app → App Privacy: answer per T604 (or tell Codex where answers differ). TestFlight → Test Information: paste the "What to Test" text.
2. Decide the support email (A-23) → set `APP_IDENTITY.supportEmail` and `site/contact.js` (separate small PR or comment on this one).
3. Decide on terms of use (page content and URL) and the V0 privacy-page update; until then the 이용약관 row stays disabled.
4. Run `../quickstart.md` on both phones (TestFlight build from Release iOS after merge), fill `specs/002-couple-dday-v0/device-checks.md`, and approve.

## 9. Open decisions (defaults; report)

| Decision | Default |
|---|---|
| Bundle missing font weights (Noto Sans KR 500, Zen Maru Gothic 400/500; +~10 MB) | do not bundle; list substitutions |
| Terms of use page | none; row disabled |
| Licences row (not on the V0 board, but OFL fonts are bundled) | leave it out as drawn and flag it as a legal question for the owner; the existing licences screen code stays |
| Privacy-page V0 rewrite | owner (legal) |

## 10. Out of scope

New features, production identifiers, public App Store submission, Android, server push, editing `design/` or `specs/001-*`, publishing legal text.

## 11. PR rules and hand-back protocol

- Branch `v0/s6-polish`, base `main`, **non-draft**, title `S6: polish — i18n, a11y, deletion regression, store readiness`. **Do not merge.**
- PR body: summary; scenario → test table; traceability output; screenshots (ko/en/ja × light/dark × 200% for home, list, edit, settings); owner checklist (§8) with status.
- Follow your launch brief's status protocol; `done` with the full PR URL; `needs-decision` for product/legal questions.
