# H02 — V1 shell: hide room/cover/prompt, 3 tabs, sign-in and connect flow, D+Day home (slice S2)

| | |
|---|---|
| Slice | S2 · tasks T201–T216 in `../tasks.md` |
| Requirements | V0-F01, V0-F02, V0-F03, V0-F09 (day/year cards only), V0-F13, V0-F12 (all settings except notifications), V0-NF-01/02/03/06, V0-DR-01…03, -05 |
| Depends on | `main` at/after `1f29362`. Independent of H01 (run in parallel); the owner's TestFlight check of this slice needs H01 merged |
| Unblocks | H03 (snapshot types, overlay copy, anniversaries engine v1, tabs), H04, H05, H06 |
| Branch / PR | `v1/s2-shell-home` → PR to `main`, non-draft, do not merge |
| Design source | artifact https://claude.ai/artifact/M2WFQCFnVzoWbHNhJPCz5X, version `1793598115-fafc`, boards V0-00, V0-01, V0-02, V0-03, V0-07 |

The design tool is not available to you. The design extracts in `./design/` **are part of this handoff** and were verified claim-by-claim against the boards. Where a value could not be read, the extract says `verify against board <id>` — do not invent it; use the nearest existing token/component and list it in the PR.

## 1. Goal and why

Turn today's "prompt room" app into the V1 couple D+Day app shell: Apple-only sign-in, a connect flow that also collects each person's name and optional birthday, a 3-tab layout (홈 · 기념일 · 설정), a D+Day home wired to the existing backend, the system states, and the V1 settings — while hiding (not deleting) room, cover photo, prompt, AI consent and report/block. This is the base every later slice builds on, and it is the first thing the owner and partner will use on TestFlight.

## 2. Prerequisites and current code (verified 2026-11-02)

- Read `../spec.md` (User Stories 2, 3, 8; V0-DR; Decisions/Assumed defaults), `../plan.md` §1–§4, §7, §9–§10, `../data-model.md` §1.1–§1.3 and §2, `../contracts/v1-api.md`.
- Routing: `src/app/_layout.tsx` (`appGate()` from `src/lib/appGate.ts`: booting / signedOut / sessionExpired / needsOnboardingChoice / ended / active; `Stack.Protected` groups), `src/app/(auth)/*`, `src/app/(onboarding)/{index,choose-space,create-space,join}.tsx`, `src/app/(tabs)/{_layout,home,room,index}.tsx`, `src/app/(tabs)/settings/index.tsx`, `src/app/{invite,ended,join-has-space}.tsx`, `src/app/settings/{delete-account,end-space,report}.tsx`, `src/app/prompt/{index,consent}.tsx`.
- Tabs: `(tabs)/_layout.tsx` uses `NativeTabs` (expo-router/native-tabs) with triggers `home`, `room`, `settings/index`; tint `color.primary`, icon/label `color.text2`.
- Home: `features/home/HomeScreen.tsx` (cover picker, room card/thumbnail, "open room", date edit sheet, offline/sync banners, `MilestoneCard`), route `(tabs)/home.tsx` (cover load/upload, `useMilestone`).
- Onboarding: `features/onboarding/{SpaceChoiceScreen,CreateSpaceScreen,InviteScreen,JoinScreen}.tsx`; create route passes the device time zone `getCalendars()[0]?.timeZone`. PR #24 safe back navigation (`ui/FlowBack.tsx`), PR #26 keeps a freshly created invite visible after a snapshot refresh — keep both behaviours.
- Data: `features/space/{SpaceContext,useSnapshotSync,useSpaceSnapshot}.ts(x)`, `lib/client.ts` (`Snapshot` type), `lib/routes.ts`, `lib/api.ts` (`keyInBody` idempotency), `lib/dday.ts` (`dayCount`, `todayIn`, `formatAnniversary`).
- Backend: `supabase/functions/{profile,spaces,milestones}/index.ts`; migrations end at `20261102000900_account_deletion.sql`. **No member name or birthday exists anywhere** (`user_profile` has `locale`, `time_zone`, `ui_theme` only). `update_room_mode` is the only RPC that changes `couple_space.time_zone`, and it takes the prompt-session lock.
- i18n: `src/i18n/index.ts` (i18next, `{}` interpolation, `keySeparator: false`), locale JSON generated from `design/i18n-copy.md` by `tools/i18n/import-design-copy.mjs`. **Do not edit `design/` or run that generator.**
- Lint: `eslint.config.mjs` forbids literal display strings in `features/**` and `ui/**` (FR-019 selectors).
- Tests: Jest + jest-expo + RNTL (`src/test/render.tsx`, `src/test/fixtures.ts`), Deno tests under `supabase/functions/**/__tests__`, pgTAP under `supabase/tests`.

## 3. Scope

In: T201–T216. Screens: `V0-start-intro`, `-choose`, `-date`, `-date-picker`, `-date-future`, `-profile`, `-profile-err`, `-invite`, `-enter`, `-found`, `-connected`; `V0-home`, `-pending`, `-partner-edited`, `-today` and `-late` for 일수/주년 only; `V0-state-loading`, `-error`, `-offline`, `-offline-empty`, `-ended`, `-ended-deleted`; `V0-set-main`, `-main-2`, `-me`, `-start`, `-start-confirm`, `-lang`, `-mode`, `-disconnect`, `-delete`. The 기념일 tab exists with a placeholder list (H03 fills it).

Out (later handoffs): `V0-start-notify`/`-notify-os` and `V0-set-notify*` (H05; after `V0-start-connected` go straight to home for now), anniversary list/detail/edit, birthdays/seasons/customs in home lists and celebration cards for them (H03), widgets (H04), help rows' final targets and store metadata (H06).

## 4. Design extract (what to read, per screen)

All values (sizes, fonts, colors → tokens, copy keys, a11y labels, dark/en/ja differences) are in the files below. Build each screen to its section; the summary here is only an index plus behaviour.

| Screen ID | Extract section | Behaviour summary |
|---|---|---|
| V0-start-intro | `design/V0-01-start.md` §3.1 | One page: mascot, `start.intro.title`, three feature lines (`start.intro.f1..f3`), Apple button (`auth.apple`, white in dark mode), terms line. No email/Kakao (email only when `V1_FEATURES.emailLogin`, development variant). S02 cancel/error states unchanged. |
| V0-start-choose | §3.2 | Two choice cards: new (`start.choose.new.*`) → date; join (`start.choose.join.*`) → enter. Back → intro (sign out not required; follow existing FlowBack behaviour). |
| V0-start-date / -picker / -future | §3.3–3.5 | Date box opens the wheel sheet; preview `start.date.preview` updates live (`dayCount` in the device zone for now; the space does not exist yet). Future date → `start.date.err.future`, Next disabled. |
| V0-start-profile / -err | §3.6–3.7 | Name (required, 1–10 graphemes, counter n/10), birthday optional: month/day; "태어난 해도 넣기" toggle off by default; `start.profile.skip`. Empty name → error state, no save. Creator: Next = `PUT /profile/member` **first** (it needs no space), then create the space (date + device zone), then invite — saving the profile first means the gate never sees an active space without a name mid-flow. Joiner: Next = save profile then connected. |
| V0-start-invite | §3.8 | Existing invite behaviour (S04: 24 h, one use, share, copy, reissue, expiry). Footer `start.invite.home` → home (pending). |
| V0-start-enter | §3.9 | Existing JoinScreen behaviour and S05 errors. |
| V0-start-found | §3.10 | `join.found.title` (note: the V0 value "이 공간에 참여할까요?" replaces the old one; the name line uses `join.found.who`), `start.join.found.body`. 참여하기 → accept → profile. 참여하지 않기 → enter. |
| V0-start-connected | §3.11 | Route `src/app/connected.tsx` (registered in the active `Stack.Protected`). Shown once per device per space (local flag). Joiner after profile; creator on the first open (or Realtime hint) after the partner joined (V0-00 flow 3). `start.connected.cta` → home (H05 inserts the notify prompt here). Cheer mascot hop/twinkle; still pose under Reduce Motion. |
| V0-home | `design/V0-02-03-home-states.md` §1, §2, §3.1 | Header `app.name`; hero (wave mascot 96, names "me ♥ partner", `dday.together`, `dday.big` Gaegu 60, `dday.since`); next-anniversary card; `home.upcoming.title` + `home.upcoming.all`; 3 rows. Rows/next card tap → 기념일 tab (H03 changes it to the detail). No cover, room card, open-room or edit-date button. |
| V0-home-today / -late | §3.2, §3.4 | Celebration card replaces the next card (day/year milestones from `GET …/milestones/current`), hero without mascot at 56, chip `home.today.chip` (days/years only). Close → `POST …/seen` (server records per member). Late copy `home.today.late`. No preset/suggest button. Until H03 changes the server list, **ignore any server celebration whose key is not `d50|d100|d150|d200|d300|y<n>`** (the server still returns `d500` — for a 2025-06-29 start that is 2026-11-10 — and D-04 drops it). |
| V0-home-pending | §3.5 | Partner pill "상대", pending chip, invite card with 8 code boxes, expiry, copy and share (S04 behaviour, PR 26), `home.pending.hint`. The server stores only a hash of the code (`20261101000400_invitation.sql:6`) and the snapshot has only `status`/`expiresAt`, so keep the plain code on the device: `expo-secure-store` key `v1.invite.<spaceId>` = `{code, expiresAt}` written when the code is created or reissued, read by the home card, deleted on partner join, ended, logout. No stored code (other device, reinstall) → show the expiry and the S04 reissue action instead of the boxes. |
| V0-home-partner-edited | §3.6 | Toast `home.partnerEdited` once when `space.anniversaryChangedBy` is the partner and `anniversaryChangedAt` is newer than the locally stored value. |
| V0-state-* | §3.7–3.12 | Loading skeleton; error = all-or-nothing (never partial) + retry; offline = last data + banner `state.offline.banner` + edit buttons disabled (dashed); offline-empty; ended / ended-deleted (no tab bar, `state.ended.cta` → choose; clear this device's notifications and local V1 data). |
| Tab bar | `V0-02-03-home-states.md` §2 "Tab bar" | 3 tabs, labels `tab.home`, `tab.anniv`, `tab.settings`, selected = primary, unselected = text2, a11y via `a11y.tab`. Icons: see §11 open decision. |
| V0-set-main / -main-2 | `design/V0-07-settings.md` §2, §3 (main, main-2), §5 | Groups: 내 정보 card (name, birthday), 우리 (start date, partner `set.us.connected`, time zone `set.us.tz` + note), 알림 (hidden until H05 via `V1_FEATURES.notifications=false`), 화면 (language, mode + note), 도움 (contact, privacy, terms, version — targets finalised in H06; keep existing disabled behaviour for missing URLs), 계정 (`set.account.apple`, logout, disconnect, delete). §5 lists rows to remove. |
| V0-set-me | V0-07 §3 (me) | Edit name + birthday (month/day, optional year). Save → `PUT /profile/member`. Partner-wait hint comes in H03. |
| V0-set-start / -start-confirm | V0-07 §3 (start, start-confirm) | Date wheel, preview `set.start.preview` (space zone), save → native iOS alert (`set.start.confirm.*`) → `PATCH …/anniversary` with `expectedUpdatedAt`; `VERSION_CONFLICT` → refresh and show the latest value, ask again. Future dates blocked. |
| Time zone | V0-07 §4 (S13 sheet reuse) | Extract the inline time-zone sheet from `SettingsScreen.tsx` (`:26,48-51,115-116`) into `features/settings/TimeZoneSheet.tsx` (old screen imports it; behaviour unchanged). Save → `PATCH …/time-zone`. `set.us.tz.value` is a literal sample ("서울 (UTC+9)"), not a template: display `new Intl.DateTimeFormat(locale, { timeZone, timeZoneName: 'longGeneric' })`'s zone name + a computed `(UTC±h[:mm])`, and list it as a design substitution. |
| V0-set-lang / -mode | V0-07 §3 | Pushed screens (not sheets) with checkmark rows; this device only (`set.display.note`). Reuse `features/settings/preferences.tsx`. |
| V0-set-disconnect / -delete | V0-07 §3 | Checkbox `set.confirm.check` (filled primary), bullets `set.disconnect.i1..i4` / `set.delete.i1..i3`; disconnect → existing `client.disconnect` (`block`); delete → single danger button "Apple로 다시 로그인해 확인" (`set.delete.reauth` with provider Apple) → existing `DeleteAccountScreen` flow (S13 progress/fail/done). |

Shared foundations (colors, type scale, fonts, components and their mismatches with `src/ui`, accessibility checklist): `design/foundations.md`. Copy for every key: `design/copy-v0.md`.

Login screen: today's `Welcome` shows an age notice and legal links (`features/auth/__tests__/agegate.test.tsx`); the V0 intro board drops them (`design/V0-01-start.md` §5). Default (§11): keep the existing age line (`onb.age`, 001 FR-058 still applies) under the terms line and update that test's expectations rather than deleting it.

Notable design-vs-code gaps the extracts list (fix only what your screens use, inside `src/ui` or locally, without breaking other screens' snapshots — update snapshots consciously): secondary button border (`border` token on boards), chip 1.5 px border and 12×5 padding, inline error 13/19.5 Noto Sans KR, list row label Noto Sans KR 500 (not bundled → use 700 or the body face and note it), banner title in kind colour and body in `text`, toast shape, dialog radius/padding, heading line-height ratios. Missing font weights (Noto Sans KR 500, Zen Maru Gothic 400/500): **do not add font files in this slice**; use the closest registered weight and list each substitution in the PR (owner decision in §11).

## 5. Data model and API contract

Implement exactly `../data-model.md` §1.1 (`user_profile` columns + `set_member_profile`), §1.2 (`couple_space.anniversary_changed_by/_at`, `update_anniversary` redefinition, `update_space_time_zone`), §1.3 (snapshot fields; in S2 `members[].birthday = null`, `hasBirthday = false`, `anniversaries = []`), and the routes `PUT /profile/member`, `PATCH /spaces/:spaceId/time-zone` in `../contracts/v1-api.md`.

Migrations (each with a `-- rollback:` line in the first 10 lines; `node tools/ci/check-migrations.mjs`):

- `supabase/migrations/20261103000100_v1_member_profile.sql` — also redefine `begin_account_deletion` (copy the latest body from `20261102000900_account_deletion.sql`) so its `user_profile` scrub (`:120`) also nulls `display_name` and `birth_*`; `set_member_profile` rejects a profile whose `status = 'deleting'` (`ACCOUNT_DELETING`). The birth-year upper bound (current year) is checked in the RPC, not in a CHECK constraint.
- `supabase/migrations/20261103000200_v1_space_time_zone.sql` — besides `update_space_time_zone` and the `update_anniversary` redefinition, redefine `milestone_context`, `record_milestones` and `mark_milestone_seen` to use only `couple_space.time_zone` (drop the `room_theme_document->>'timeZone'` coalesce, `20261102000700_milestones.sql:46,58-60,91-96`); otherwise a time-zone change in S2 leaves server celebrations on the old zone.
- `supabase/migrations/20261103000300_v1_snapshot.sql` (`create or replace function public.space_snapshot` — start from the latest definition in `20261102000100_prompt_lease_revive.sql:140-166` and only add fields)

Client (`src/lib/client.ts`): extend `Snapshot`:

```ts
type Birthday = { month: number; day: number };
members: { userId: string; aiConsentState: 'not_given' | 'granted' | 'revoked'; displayName: string | null; birthday: Birthday | null; hasBirthday: boolean }[];
me: { userId: string; displayName: string | null; birthday: (Birthday & { year: number | null }) | null };
anniversaries: CustomAnniversary[]; // [] until H03
space: { /* existing */ anniversaryChangedBy: string | null; anniversaryChangedAt: string | null };
```

Add `saveMemberProfile(displayName, birthday)` and `updateTimeZone(spaceId, timeZone, expectedUpdatedAt)` (both `keyInBody: true`) and their `routes.ts` entries (`profile/profile/member`, `spaces/spaces/${id}/time-zone`). Older clients ignore the new snapshot fields; the server must not drop old ones.

## 6. Copy (i18n overlay, brand keys)

- Copy `./design/copy-v0.md` to `apps/mobile/src/i18n/locales/v1/copy-v0.md` (verbatim).
- New script `tools/i18n/build-v1-overlay.mjs` (Node, no deps) parses the `| \`key\` | ko | en | ja | status |` rows and writes `apps/mobile/src/i18n/locales/v1/{ko-KR,en-US,ja-JP}.json` (all 278 rows plus `mascot.name` = 279 keys, so later slices need no copy work) and `apps/mobile/src/i18n/v1Keys.d.ts`. It must:
  - unescape `\|`, turn `⏎` into `\n`;
  - add `mascot.name` = 모피 / Mopi / モピ (the board name; spec A-01);
  - in every value except `app.name` and `mascot.name`, replace the brand words with nesting: 모피루/Mopiru/モピル → `$t(app.name)`, then 모피/Mopi/モピ → `$t(mascot.name)` (longest first);
  - fail on duplicate keys or a row count other than 278.
- The overlay has 279 keys (278 rows + `mascot.name`). `date.long`, `date.short`, `date.md` use `{M}` (month name) in English but `{m}` in ko/ja — callers pass both `m` and `M`; exempt these three keys from any placeholder-parity check.
- `src/i18n/index.ts`: merge `{ ...base, ...overlay }` per locale (overlay wins — only `join.found.title` changes meaning; check every screen that used it). Keep the existing interpolation config; i18next nesting (`$t(…)`) works with it — prove it in a test.
- Use V1 keys in new/changed screens; do not delete old keys (hidden screens still compile).
- Test `src/i18n/__tests__/v1Overlay.test.ts`: same key set in ko/en/ja; no value outside the two brand keys contains `모피루|Mopiru|モピル|모피|Mopi|モピ|아룸|Aroom|아루미`; `t('widget.none.title')` renders "모피루를 시작해요"; `t('dday.big', { n: 492 })` renders "D+492" / "Day 492" / "492日目". Name it `V0-NF-02 …`.
- Korean particles after the brand name (을/를, 이/가) depend on the final name; leave them as drawn (A-01).
- iOS display name stays `APP_IDENTITY.name` (`Aroom (preview)` for TestFlight). Do not change `identity.ts` names.

## 7. Implementation steps

1. Branch `v1/s2-shell-home`. Write the failing tests listed in §8 first (keep each test name prefixed with its scenario id).
2. **Flags (T201)**: `src/config/features.ts`:
   ```ts
   import { authOptions } from './auth';
   export const V1_FEATURES = { room: false, prompt: false, cover: false, reportBlock: false,
     kakaoLogin: authOptions.kakao, emailLogin: authOptions.devEmail, notifications: false } as const;
   ```
   Reuse the existing auth switches instead of a second source: `emailLogin: authOptions.devEmail`, `kakaoLogin: authOptions.kakao` (from `src/config/auth.ts`). Guard `prompt/index`, `prompt/consent`, `settings/report` in `_layout.tsx` with `Stack.Protected guard={gate.kind === 'active' && V1_FEATURES.<flag>}`; remove the `room` tab trigger; make `(tabs)/room.tsx` redirect to `/home` when `!V1_FEATURES.room`. Delete nothing.
3. **Overlay (T202)**: §6.
4. **Backend (T203, T204)**: migrations + pgTAP (`supabase/tests/v1_member_profile.test.sql`, `v1_space_time_zone.test.sql`; extend `rls_snapshot.test.sql` for the new fields: own year visible to self only, partner birthday `null` in S2). Routes in `functions/profile/index.ts` and `functions/spaces/index.ts` with input validation mirroring the SQL checks (name trim, month/day validity with Feb 29 allowed, year range, IANA zone via `Intl.DateTimeFormat` like `roomMode()` does) + Deno tests. `update_space_time_zone` must not call `lock_space_session`.
5. **Client (T205)**: §5.
6. **Engine v1 (T206)**: `src/lib/anniversaries.ts` with `computeMilestoneView(startDate, timeZone, nowIso)` → `{ today, dayCount, next, upcoming: Occurrence[] (3), }` for 일수 `[50,100,150,200,300]` and 주년 (calendar, Feb 29 → Feb 28, same-day 주년 wins). Use `parseCalendarDate`/`todayIn` from `lib/dday.ts`; never divide elapsed seconds by 86400. Fixture `src/lib/__fixtures__/anniversaries.json` (start with ≥30 cases: 100일 = start + 99, 2024-02-29 → 2025-02-28, DST zones `America/New_York`, `Europe/London`, zone ≠ device zone). H03 extends the same module and fixture with birthdays/seasons/customs — keep the `Occurrence` shape from `../plan.md` §4.
   Note: until H03 changes the server, `GET …/milestones/current` still returns 500/1000 and no 150 — the home only uses its `celebration` (for seen-state, filtered as in §4) and computes the lists locally. Deno side: create `supabase/functions/_shared/__tests__/anniversaries.test.ts` loading the fixture the way `_shared/__tests__/dday.test.ts:3` loads `dday.json`; in S2 compare only `dayCount`, today, years and day milestones in {50, 100, 200, 300} against `computeMilestones` (150 arrives in H03).
7. **Gate (T207)**: add `{ kind: 'needsProfile' }` when `entry === 'active'` and `me.displayName == null` (needs the snapshot, so decide in `SpaceContext`/`_layout` after the first snapshot; do not flash home). Change the `(onboarding)` guard to `gate.kind === 'needsOnboardingChoice' || gate.kind === 'needsProfile'` and make `needsProfile` open `/profile` directly (not the choose screen). Add a `(onboarding)/profile` route used by the creator (before space creation) and by `needsProfile` (joiner after accept, or anyone who quit mid-flow). Hold the creator's chosen date between the date and profile steps in a small flow context `features/onboarding/CreateFlowContext.tsx` mounted in `(onboarding)/_layout.tsx` (so going back keeps values). Connected-once flag: `expo-secure-store` key `v1.connected.seen.<spaceId>.<userId>`. Register every new root route in `_layout.tsx` inside the active `Stack.Protected`: `<Stack.Screen name="connected" />`, `settings/me`, `settings/start-date`, `settings/language`, `settings/appearance`, `settings/disconnect` (unregistered routes are not protected).
8. **Screens (T208–T214)** per §4. New components live in `features/onboarding/ProfileScreen.tsx`, `features/home/V1HomeScreen.tsx`, `features/home/CelebrationCard.tsx`, `features/home/InvitePendingCard.tsx`, `features/home/states.tsx`; keep `HomeScreen.tsx` untouched (no longer routed). `(tabs)/home.tsx` drops cover code and renders `V1HomeScreen`. `(tabs)/anniversaries/index.tsx` placeholder: title + skeleton/empty using `state.loading` only; the tab trigger name is `anniversaries/index` (H03 puts the detail at a root route, not inside the tab).
9. **Settings (T215)**: build a new `features/settings/V1SettingsScreen.tsx` from the board; route `(tabs)/settings/index.tsx` renders it and passes `appVersionLabel()` from `src/config/version.ts` (created by H01; if H01 is not merged yet, create the same file with the same function name — the later rebase is then trivial; expect a `pnpm-lock.yaml` rebase too); sub-screens as routes under `src/app/settings/` (`me.tsx`, `start-date.tsx`, `language.tsx`, `appearance.tsx`, `disconnect.tsx`; reuse `delete-account.tsx`, `end-space.tsx` logic). Keep `SettingsScreen.tsx` file (not routed). Logout keeps `features/settings/logout.ts` and also clears the V1 local keys (§2 of data-model).
10. **Offline cache (T216)**: `features/space/v1Cache.ts` — after each successful snapshot write `{ savedAt, userId, spaceId, snapshotV1Part }` (no tokens) to `v1-cache-<userId>.json` in the app document directory (`expo-file-system`, add with `npx expo install`). Today a failed `mySpace()` on cold start sets entry `'error'` → gate `booting` → the old server-error screen (`useSpaceSnapshot.ts:20-22`, `appGate.ts:28`, `_layout.tsx:52`). Change `resolveEntry`: on a **network** error with a cache for this `userId`, set entry `'active'`, the cached `spaceId`, and seed the snapshot state from the cache with `offline: true` → `V0-state-offline`; network error without cache → `V0-state-offline-empty`; non-network error → `V0-state-error` (all-or-nothing + retry; replaces the `_layout.tsx:52` banner). Clear the cache on logout/ended/delete.
11. Update existing tests that asserted room/cover/prompt navigation (`src/app/__tests__/navigationFlows.test.tsx`, `routes.test.tsx`, `features/home/__tests__/HomeScreen.test.tsx` can stay since the component stays). Never weaken a test to pass; replace it with the V1 expectation and say so in the PR.
12. Run §9. Take simulator screenshots (light/dark ko, one en, one ja) of every screen in §3 and attach them to the PR next to the board frame names.

## 8. Tests to write first

| Scenario ids | Test file (create/extend) | Assert |
|---|---|---|
| V0-NF-06, V0-F03-AC-05 | `src/config/__tests__/features.test.ts`, `src/app/__tests__/routes.test.tsx` | flags default; room/prompt/report/cover unreachable; 3 tab triggers in order |
| V0-F01-AC-01…03 | `features/auth/__tests__/login.test.tsx` | intro shows only Apple (+ terms); email only in development; cancel/error states; success → choose |
| V0-F02-AC-01…07, -09 | `features/onboarding/__tests__/{create-space,profile,invite,join}.test.tsx` | preview text, future error, name required/max 10, birthday optional, create → profile save → invite order, back keeps values, no back to date after creation |
| V0-F02-AC-08, -10 | `src/lib/__tests__/appGate.test.ts`, `features/home/__tests__/V1HomeScreen.test.tsx` | needsProfile gate; connected shown once for creator after partner joins |
| V0-F03-AC-01…04 | `features/home/__tests__/V1HomeScreen.test.tsx` | hero, next card, 3 upcoming, pending card with code, partner-edited toast once |
| V0-F09-AC-01, -03, -05 | same + `lib/__tests__/anniversaries.test.ts` | day/year card, late within 7 days, close calls seen |
| V0-F13-AC-01…05, V0-EC-02, V0-EC-03 | `features/home/__tests__/states.test.tsx`, `features/lifecycle/__tests__/lifecycle.test.tsx`, `features/space/__tests__/useSpaceSnapshot.test.tsx` | loading, all-or-nothing error, offline banner + disabled buttons, cold-start offline from cache, offline-empty, ended / ended-deleted clear local data (partner name not shown after deletion) |
| V0-EC-07 | `features/home/__tests__/V1HomeScreen.test.tsx` | pending card: expired code shows S04 expired state + reissue; no stored code → expiry + reissue |
| V0-EC-10, V0-NF-03 | `src/i18n/__tests__/v1Overlay.test.ts`, screen tests in light and dark | brand only via keys; colors only from theme tokens in both schemes |
| V0-F12-AC-01…08, -10 | `features/settings/__tests__/v1Settings.test.tsx` | rows/sections, hidden rows absent, me save, start date confirm + conflict, tz change, lang/mode device-only, disconnect/delete flows, logout |
| V0-DR-01…03, -05 | `src/lib/__tests__/anniversaries.test.ts` + Deno `supabase/functions/_shared/__tests__/parity.test.ts` (load the same fixture) | fixture-driven |
| V0-F02-AC-03, V0-F12-AC-02, -04, -05 | `supabase/tests/v1_member_profile.test.sql`, `v1_space_time_zone.test.sql`, Deno `profile/__tests__/profile.test.ts`, `spaces/__tests__/time_zone.test.ts` | validation, RLS (self-only), snapshot shape, conflict, no session lock |
| V0-NF-02 | `src/i18n/__tests__/v1Overlay.test.ts` | §6 (279 keys, date.* placeholder exemption) |
| V0-NF-01 | in each screen test | every icon button has an accessibilityLabel from a key; tab a11y labels |

## 9. Verification commands

```sh
pnpm install --frozen-lockfile
node tools/i18n/build-v1-overlay.mjs && git diff --exit-code apps/mobile/src/i18n/locales/v1 apps/mobile/src/i18n/v1Keys.d.ts   # generated files committed
pnpm lint && pnpm typecheck
pnpm --filter mobile test
supabase start -x studio,imgproxy,vector,logflare,supavisor
supabase test db
deno test -A supabase/functions
node tools/ci/check-migrations.mjs && node tools/ci/check-functions-boot.mjs && node tools/ci/check-schemas.mjs
```

Two-simulator check (optional but recommended): firstmate's `cpl-pairtest` scripts — `AROOM_LOCAL_REPO=<your worktree> /Users/jinjinstar/coding/toy-project/firstmate/data/cpl-pairtest/start-local.sh`, drive A (create) and B (join) as in `PairUITest.swift`, then `stop-local.sh`. The scripts refuse to run if a container/port/`.env.local` already exists and never delete data; if they refuse, skip and say so.

## 10. Owner-only steps

- After merge: the owner (or firstmate) runs H01's Release iOS workflow, installs on both phones, creates a space on one phone, joins on the other, and approves against the boards listed in §4. If H01 is not merged yet, approval is on simulator screenshots in the PR.
- No Apple/Expo console work in this slice. Production Supabase migration deploy is the owner's existing process (not in this PR).

## 11. Open decisions (defaults to use; report, do not block)

| Decision | Default for this slice |
|---|---|
| Tab bar icons: board draws custom line icons; `NativeTabs` takes SF Symbols or images | SF Symbols `house`/`house.fill`, `calendar`/`calendar` (closest to calendar-with-heart), `gearshape`/`gearshape.fill`; list as "verify against board V0-home" |
| Missing font weights (Noto Sans KR 500, Zen Maru Gothic 400/500) | closest bundled weight; owner decides whether to bundle (S6) |
| Tap target of next card / upcoming rows | 기념일 tab (H03 switches to detail) |
| Pull-to-refresh on home | keep the existing `RefreshControl` (not drawn, harmless) |
| `notify.os.*` copy | not used (iOS draws its own permission alert) |
| App/mascot name | brand keys only (A-01) |
| Age notice on the intro (board drops it; 001 FR-058 requires 14+) | keep the existing `onb.age` line under the terms line |
| Back in the connect flow | back button (`FlowBack`) only — swipe stays disabled as in PR #24 (`(onboarding)/_layout.tsx` `gestureEnabled: false`) |

Any other missing design fact → `needs-decision` with the board id.

## 12. Out of scope

Anniversary tab content, birthdays/seasons/customs in lists or cards, server 150-day change (H03); widgets (H04); notification prompt/settings/scheduling (H05); help-row targets, fonts bundling, store metadata (H06); deleting room/prompt/cover code or data; editing `design/` or `specs/001-*`.

## 13. PR rules and hand-back protocol

- Branch `v1/s2-shell-home`, base `main`, **non-draft**, title `S2: V1 shell — 3 tabs, connect flow with profile, D+Day home`. **Do not merge.**
- PR body: summary; scenario-id → test table with results; commands run; screenshots per screen id (light/dark ko + en + ja samples); list of design substitutions (§4 gaps, §11 defaults); migration list; anything not verified.
- Follow the status protocol in your launch brief; report `done` with the full PR URL; `needs-decision` for product/design questions.
