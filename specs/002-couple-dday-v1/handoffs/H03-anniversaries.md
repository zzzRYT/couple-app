# H03 — Anniversary model and screens: 150 days, birthdays, season days, custom CRUD with version conflicts (slice S3)

| | |
|---|---|
| Slice | S3 · tasks T301–T309 in `../tasks.md` |
| Requirements | V0-F04, V0-F05, V0-F06, V0-F07, V0-F08, V0-F09 (birthday/custom/season cards + priority), V0-F12-AC-02 (partner-wait hint), V0-DR-01…06, V0-EC-01/-04/-05/-06/-08/-12 |
| Depends on | **H02 merged** (snapshot fields `displayName`/`birthday`/`hasBirthday`/`anniversaries`, i18n overlay with all V0 keys, `src/lib/anniversaries.ts` v1 + fixture, 기념일 tab placeholder, V1 home, `V0-set-me`). Owner approval of S2 on TestFlight or simulator proof |
| Unblocks | H04 (widget data needs the full engine), H05 (notification plan needs occurrences) |
| Branch / PR | `v1/s3-anniversaries` → PR to `main`, non-draft, do not merge |
| Design source | artifact https://claude.ai/artifact/M2WFQCFnVzoWbHNhJPCz5X, version `1793598115-fafc`, boards V0-04 (list/detail), V0-05 (add/edit), V0-02 (home celebration variants) |

No design-tool access is needed: `./design/V0-04-anniv.md`, `./design/V0-05-anniv-edit.md`, `./design/V0-02-03-home-states.md`, `./design/foundations.md` and `./design/copy-v0.md` are part of this handoff and were verified against the boards. Never invent a missing value; use the extract's `verify against board <id>` note and report it.

## 1. Goal and why

Make the 기념일 tab real: one date-ordered list of day milestones (50·100·150·200·300), yearly anniversaries, both birthdays (shown only when both entered), Pepero Day and Christmas, and custom anniversaries both partners can add, edit and delete with a version check instead of last-write-wins. The same calculation drives the home card, the list, and (next slices) widgets and notifications, so it must be one pure module tested with one fixture on the app and the server.

## 2. Prerequisites and current code

- After H02: `src/lib/anniversaries.ts` (`computeMilestoneView`, `Occurrence` type), `src/lib/__fixtures__/anniversaries.json`, `src/app/(tabs)/anniversaries/index.tsx` placeholder, `features/home/V1HomeScreen.tsx` + `CelebrationCard.tsx`, `features/settings/V1SettingsScreen.tsx` + `src/app/settings/me.tsx`, overlay keys (`anniv.*`, `edit.*`, `home.*`, `date.*`) already in `src/i18n/locales/v1/*.json`. Re-read them before you start; if H02 deviated from its handoff, follow the merged code and note it.
- Server today: `supabase/functions/_shared/milestones.ts:4` `DAY_MILESTONES = [50, 100, 200, 300, 500, 1000]`; `computeMilestones` returns `{dayCount, today, celebration, upcoming (≤3), history}`; `functions/milestones/index.ts` records history via `record_milestones` with optimistic `VERSION_CONFLICT` retry. `supabase/migrations/20261102000700_milestones.sql:5` (`milestone_key` check `^(d(50|100|200|300|500|1000)|y[1-9][0-9]*)$`) and `:15` (`milestone_days in (50,100,200,300,500,1000)`) reject 150. The time zone in those RPCs is `coalesce(room_theme_document->>'timeZone', couple_space.time_zone)`.
- Parity tests: `supabase/functions/_shared/__tests__/parity.test.ts`, `dday.test.ts`, `milestones.test.ts`; app `src/lib/__tests__/{dday,milestones}.test.ts`, fixture `src/lib/__fixtures__/dday.json`.
- Idempotent mutations: `route()` in `_shared/http.ts` is idempotent by default (header `Idempotency-Key` or body `idempotencyKey`); client `api.json(..., { keyInBody: true })`.

## 3. Scope

In: T301–T309. Screens: `V0-anniv-list`, `-list-past`, `-list-today`, `-list-custom`, `-list-empty`, `-list-bwait`; `V0-anniv-detail-years`, `-detail-season`, `-detail-birthday`, `-detail-custom` (and the undrawn `days` / `my birthday` details by analogy, §4); `V0-edit-new`, `-filled`, `-picker`, `-once`, `-err-empty`, `-err-long`, `-edit`, `-delete`, `-discard`, `-conflict`, `-gone`, `-saveerr`, `-saved`; home `V0-home-today-season` and birthday/custom celebrations; `V0-set-me` partner-wait hint.

Out: notification scheduling and settings (H05 — but store the per-anniversary "알림" choice now, §6.4), widgets (H04), polish/fonts (H06).

## 4. Design extract index

| Screen ID | Extract | Behaviour summary |
|---|---|---|
| V0-anniv-list | `design/V0-04-anniv.md` §1 (rules, verbatim), §2 (row anatomy, kind icons with SVG paths, controls, tokens), §3.1 | Header with + (add); filter segmented `anniv.filter.all` / `anniv.filter.custom` (aria-pressed); sections: today (if any) → `anniv.section.upcoming` (today+1 … +1 year, ascending) → `anniv.past.show` "지난 기념일 {n}개 보기" (collapsed). Right column: D-n (≤14 days → primary, else text), today → filled pill `dday.today`, past `dday.ago` in text2. Custom rows have the `anniv.badge.custom` badge. Row a11y `anniv.row.a11y`. |
| -list-past | §3.2 | Expanded past section (most recent first, back to 1 year), `anniv.past.hide`. The board's count (10 vs 9) is unresolved — compute it from the data. |
| -list-today | §3.3 | Today's items in a "오늘" section (`anniv.section.today`). |
| -list-custom / -list-empty | §3.4, §3.5 | Filter = custom; empty → mascot + `anniv.empty.title` / `anniv.empty.body` + add CTA (`anniv.add`). |
| -list-bwait | §3.6 | Placeholder row (not a button) `anniv.birthday.wait` when I entered mine and the partner has not (`hasBirthday=false`). If I have not entered mine: `anniv.birthday.mine` + `anniv.birthday.add` → `V0-set-me` (no frame drawn; use the bwait row style). |
| detail (years/season/birthday) | §3.7–3.10 | Back ←; kind icon; title; date (`date.long`); big D-number (always primary on the board); rows 날짜 / 계산 (`anniv.rule.years` / `anniv.rule.fixed` / `anniv.rule.birthday`) / 알림; note `anniv.detail.system.note` or `anniv.detail.birthday.note`; `anniv.detail.openSettings` → settings notifications (until H05: settings root). No edit/delete. For 일수: same layout with `anniv.rule.days` and `anniv.detail.auto` (no frame; by analogy). My own birthday detail: same as partner's with a link to `V0-set-me` (not drawn — report). |
| -detail-custom | §3.11 | Adds memo, repeat (`anniv.repeat.*`), notify (`anniv.notify.default` / `anniv.notify.off`), `anniv.detail.by` / `anniv.detail.byMe` with last edit date, "편집" → edit, pinned bottom "이 기념일 삭제" (`edit.delete`) → iOS alert → delete. No tab bar on detail. |
| V0-edit-* | `design/V0-05-anniv-edit.md` §1 (rules verbatim), §2 (nav bar, fields, segmented control, preview chip, hint, delete footer, picker sheet, iOS alerts, toast), §3 per frame | Full-screen modal with 취소 / title / 저장. Title counter counts every character incl. spaces; >20 still accepted but counter+field turn danger and save locks. Memo 0–100 (mirror for overflow, `edit.err.memo.long`). Repeat default 매년; preview chip `edit.preview.next` (yearly) or `edit.preview.past` (once + past). Notify default 기본 설정. Hint `edit.shared.hint`. Delete/discard/conflict/gone use **native iOS alerts** (`Alert.alert`), not the app Dialog. Save error and saved use the toast. |
| V0-home-today-season + birthday/custom cards | `design/V0-02-03-home-states.md` §1 (priority rule), §3.3 | Card for season (`home.today.title.season` + `home.today.body.season`), birthday (`home.today.title.birthday`, body: not drawn — reuse `home.today.body.season`'s mascot line and report), custom (`home.today.title` with the custom title; body not drawn — same). Only on the day. Priority 주년 > 일수 > 생일 > 직접 > 시즌; the rest stay in the list's today section. Closing stores the occurrence key on this device. |

Kind → icon/tile (from V0-04 §2 "Kind icons"; exact SVG paths are in the extract; none exist in `src/ui/Icon.tsx` — add them there as new names): 일수 = heart on peach `#F4B79B`, 주년 = ribbon/medal on pink `#F2A7B4`, 생일 = cake on butter `#F7D98B`, 빼빼로데이 = sticks on sky `#AACBE2`, 크리스마스 = tree on sage `#A8C6A0`, 직접 추가 = star on lav `#C9B8E8` (all `tokens.color.illustration.palette.*`). Tile 40×40, icon 22, stroke `#4A3426` width 2 in both modes.

## 5. Data model and API contract

Exactly `../data-model.md` §1.4 and §1.5 and `../contracts/v1-api.md` (snapshot `members[].birthday` + `hasBirthday` + `anniversaries`, `POST/PATCH/DELETE /spaces/:spaceId/anniversaries…`, milestone list change).

Migrations:
- `supabase/migrations/20261103000400_v1_milestones.sql` — widen both check constraints to include 150 (keep 500/1000 so old rows stay valid). They are unnamed in `20261102000700_milestones.sql:5,15`; Postgres names them `milestone_celebration_milestone_key_check` and `milestone_celebration_check` — confirm with `select conname, pg_get_constraintdef(oid) from pg_constraint where conrelid = 'public.milestone_celebration'::regclass` before writing `alter table public.milestone_celebration drop constraint …, add constraint milestone_celebration_milestone_key_check check (milestone_key ~ '^(d(50|100|150|200|300|500|1000)|y[1-9][0-9]*)$'), add constraint milestone_celebration_check check (…same shape with 150…)`, and assert the new definitions in pgTAP. The time-zone unification of the milestone RPCs already happened in H02's `…200` migration — do not redo it.
- `supabase/migrations/20261103000500_v1_custom_anniversary.sql` — `space_anniversary` table, RLS (member select of non-deleted rows; no direct writes), RPCs `create_custom_anniversary`, `update_custom_anniversary`, `delete_custom_anniversary` (security definer, `require_member`, version check, soft delete, `notify_space(target,'anniversary',…)`), `space_snapshot` redefinition (start from H02's `20261103000300_v1_snapshot.sql`, not the older definitions) adding `anniversaries` and the birthday disclosure rule (partner `{month, day}` only when both have one; `hasBirthday` always; never the partner's year).

Server code:
- `_shared/milestones.ts`: `DAY_MILESTONES = [50, 100, 150, 200, 300] as const`. Keep `computeMilestones` signature; keep the 7-day celebration window and the same-day anniversary priority.
- `functions/spaces/index.ts`: three routes. Validation mirrors SQL: title trimmed 1..20 graphemes (`Intl.Segmenter('ko', {granularity: 'grapheme'})` is available in Deno) — server rejects >20 graphemes; memo null or ≤100 graphemes; `date` via `calendarDate()`; `repeat` in `yearly|once`; `expectedVersion` positive integer. For a soft-deleted row the RPC raises `raise exception 'NOT_FOUND:{"gone":true}'`: `_shared/db.ts:20-21` splits the message at the first `:` and parses the rest as JSON extra (same convention as `occupied_error`, `20261101000500_prompt_session.sql:35`), so the response becomes `{ error: { code: 'NOT_FOUND', retryable: false, gone: true } }` with no extra handler code.

App:
- `api.ts`: `request()` creates a new idempotency key per call (`api.ts:12`), so a retry after the save-error toast would create a duplicate. Add `idempotencyKey?: string` to `RequestOptions`, used instead of `makeId()` when given, with an `api.test.ts` case.
- `client.ts`: `CustomAnniversary` type (`{ id, title, memo, date, repeat, createdBy, createdAt, updatedBy, updatedAt, version }`), `createAnniversary`, `updateAnniversaryItem`, `deleteAnniversaryItem` (`keyInBody: true`, pass the form's `idempotencyKey`; DELETE with body like `removeHomeCover`).
- `lib/realtime.ts:4`: add `'anniversary'` to the `RealtimeEvent['event']` union (the refresh path already handles any non-`session` event). Error mapping: `VERSION_CONFLICT` → conflict flow; `NOT_FOUND` + `gone` → gone flow.
- After any successful mutation call `refresh()` from `useSpace()` (snapshot is the single source; Realtime makes the partner refresh).

## 6. Implementation steps

1. Branch `v1/s3-anniversaries`; write failing tests (§7).
2. **Engine (T304)** — extend `src/lib/anniversaries.ts`. This shape is canonical (plan §4 points here; H04 and H05 reuse its input type as `AnniversaryInput`):
   ```ts
   export type Occurrence = { key: string; kind: 'days' | 'years' | 'birthday' | 'season' | 'custom'; date: string; n?: number;
     who?: 'me' | 'partner'; seasonId?: 'pepero' | 'christmas'; customId?: string; title?: string };
   export function computeAnniversaries(input: {
     startDate: string; timeZone: string;
     me: { birthday: { month: number; day: number } | null };
     partner: { birthday: { month: number; day: number } | null } | null; // null = not joined
     customs: { id: string; title: string; date: string; repeat: 'yearly' | 'once' }[];
   }, nowIso: string): { today: string; dayCount: number | null; todayItems: Occurrence[]; upcoming: Occurrence[]; past: Occurrence[]; celebrationCandidates: Occurrence[] };
   ```
   Rules (spec V0-DR): day N date = start + (N−1); years = same month/day each year (Feb 29 → Feb 28 in common years); birthdays and yearly customs = same month/day (Feb 29 rule); once = that date; seasons 11-11 and 12-25 yearly; window: past back to today−1 year (inclusive), upcoming to today+1 year (inclusive — state the inclusive/exclusive choice in a test); nothing before the start date (V0-DR-06); same-date order in lists: 주년 > 일수 > 생일 > 직접 > 시즌, then title; keys `d150`, `y2`, `bday:me:2026`, `bday:partner:2026`, `season:pepero:2026`, `custom:<id>:2026` (once: `custom:<id>`). `celebrationCandidates` = today's items for all kinds + days/years whose date is within the last 6 days (7-day window incl. today), sorted by the priority rule.
   Fixture: grow `src/lib/__fixtures__/anniversaries.json` to ≥120 cases (Feb 29 start/birthday/custom across 2025–2029, DST zones, zone ≠ device, date rollover at 23:59/00:00 in the space zone, start date after season dates, partner null, same-day collisions). The Deno test `supabase/functions/_shared/__tests__/anniversaries.test.ts` (created in H02, pattern of `dday.test.ts:3`) now also compares day 150 and drops the S2 subset restriction.
3. **Server (T301–T303)** per §5 with pgTAP + Deno tests.
4. **List (T305)** — `features/anniversaries/AnniversaryList.tsx` (pure props: `view`, `filter`, `pastOpen`, callbacks) + route `src/app/(tabs)/anniversaries/index.tsx` (uses `useSpace()` snapshot, `useNow()`, offline state: + button disabled with dashed style, no queue).
5. **Detail (T306)** — `features/anniversaries/AnniversaryDetail.tsx` + **root** route `src/app/anniversary/[key].tsx`, registered as `<Stack.Screen name="anniversary/[key]" />` in the active `Stack.Protected` (a sibling inside `(tabs)` would have no trigger, no back stack, and would keep the tab bar the board omits). Param = `encodeURIComponent(occurrence key)` (keys contain `:`); resolve via the engine; for custom also look up by `customId`. Unknown key (e.g. deleted while open) → back to list.
6. **Edit (T307)** — `features/anniversaries/AnniversaryEdit.tsx` + route `src/app/anniversary-edit.tsx` registered as `presentation: 'fullScreenModal'` (or `modal` — the extract says full-screen sheet; verify against board V0-edit-new) inside the active `Stack.Protected` in `_layout.tsx`. Form state: title, date, repeat, memo, notify. Dirty check excludes nothing (treat notify change as dirty; report as assumed). Save: create or update with `expectedVersion`; conflict → `Alert.alert(t('edit.conflict.title',{name}), t('edit.conflict.body'))`, then replace form values with the refreshed snapshot row and keep the screen open; gone → alert `edit.gone.*` then close to list; network error → toast `edit.save.err`, keep input, a retry reuses the same idempotency key (generate once per form session). Success → close, toast `edit.saved` on the list. Delete (edit mode footer and custom detail) → alert `edit.delete.title` / `edit.delete.body` with destructive `common.delete` → toast `edit.deleted`.
7. **Per-anniversary notify value (A-19)** — store locally now so H05 only reads it: `features/notifications/preferences.ts` with `getAnniversaryNotify(userId, customId): 'default' | 'off'` and `setAnniversaryNotify(...)`, persisted as a JSON **object** `{ "offIds": [] }` in the file `v1-notify-<userId>.json` in the app document directory (`expo-file-system`; not secure-store, whose values should stay small). H05 adds the other `NotifyPrefs` fields to the same object — never store a bare array.
8. **Home (T308)** — feed `V1HomeScreen` from `computeAnniversaries`: the next card shows the first upcoming occurrence; the celebration card replaces it when a candidate exists and is not dismissed (days/years: server `celebration` + `seenByMe`; others: local key `v1.celebration.seen.<spaceId>.<userId>`). Upcoming list = next 3 after the card item. Rows/card tap → detail route.
9. **Settings (T309)** — `V0-set-me` shows `set.me.birthday.partnerWait` when the partner `hasBirthday === false`; list's "내 생일 넣기" navigates there.
10. Run §8; attach simulator screenshots for every screen id in §3 (light/dark ko; en+ja for the list and edit-filled).

## 7. Tests to write first

| Scenario ids | Test | Assert |
|---|---|---|
| V0-DR-01…06, V0-F04-AC-01, V0-F06-AC-01, V0-F08-AC-04, V0-EC-01/-05/-08, V0-NF-05 | `src/lib/__tests__/anniversaries.test.ts` (fixture-driven) + Deno `_shared/__tests__/anniversaries.test.ts` (same fixture) | dates, windows, ordering, priority, no pre-start items, 150 present, 500/1000 absent, app = server |
| V0-F04-AC-01, V0-EC-06 | Deno `_shared/__tests__/milestones.test.ts`, pgTAP `supabase/tests/milestone.test.sql` | d150 recorded; old d500 row still valid; tz from `couple_space`; start-date change resets future milestones only |
| V0-F05-AC-01, -02, V0-EC-12 | pgTAP `supabase/tests/v1_custom_anniversary.test.sql` (snapshot part) | partner birthday hidden until both set; never a year; `hasBirthday` |
| V0-F07-AC-03, -08, -09, -10, -12, V0-EC-04 | Deno `functions/spaces/__tests__/anniversaries.test.ts`, pgTAP same file, `src/lib/__tests__/api.test.ts` | create/replay idempotent (same key on retry), update conflict, gone on deleted, validation limits, non-member NOT_FOUND, RLS blocks direct writes; profile updates stay last-write-wins |
| V0-F08-AC-01…03, V0-F05-AC-01, -04, V0-F06-AC-01 | `features/anniversaries/__tests__/list.test.tsx` | sections, filter, badge, D-n colors (≤14 primary), today pill, past toggle text with count, bwait/mine rows, a11y label |
| V0-F04-AC-02, V0-F05-AC-03, V0-F07-AC-05 | `features/anniversaries/__tests__/detail.test.tsx` | read-only auto/birthday, rule text per kind, by/byMe line, delete alert |
| V0-F07-AC-01…11 | `features/anniversaries/__tests__/edit.test.tsx` | save lock, counters, once/past chip, discard alert on dirty, conflict → latest values, gone → close, save error keeps input + same key, offline disabled |
| V0-F09-AC-02, -04, -05 | `features/home/__tests__/V1HomeScreen.test.tsx` | season/birthday/custom card on the day only, priority, local dismissal |
| V0-F12-AC-02 | `features/settings/__tests__/v1Settings.test.tsx` | partner-wait hint |

## 8. Verification commands

```sh
pnpm lint && pnpm typecheck && pnpm --filter mobile test
supabase start -x studio,imgproxy,vector,logflare,supavisor && supabase test db && deno test -A supabase/functions
node tools/ci/check-migrations.mjs && node tools/ci/check-functions-boot.mjs
```

Two accounts end-to-end (recommended): firstmate `cpl-pairtest` scripts as in H02 §9; A adds "처음 만난 날", B edits it while A's edit screen is open, A saves → conflict; B deletes, A saves → gone.

## 9. Owner-only steps

- Approve S3 on TestFlight (OTA to preview is fine if no native change; this slice adds none) or on PR screenshots: compare list/detail/edit with boards V0-04/V0-05.
- Deploying the two migrations to the production Supabase project follows the owner's existing process; not part of this PR.

## 10. Open decisions (defaults; report, do not block)

| Decision | Default |
|---|---|
| Past-count rule (board shows 10 where data gives 9) | count what the engine returns |
| Celebration body copy for birthday/custom (not drawn) | reuse `home.today.body.season` |
| My-birthday detail and 일수 detail (not drawn) | same layout as partner birthday / years detail |
| Upcoming window inclusive of today+1 year | inclusive; asserted in a test |
| Edit presentation (full-screen vs page sheet) | full-screen modal |

## 11. Out of scope

Notification scheduling and the settings notification screens (H05); widgets (H04); bundling fonts (H06); report/block; offline edit queue; Android.

## 12. PR rules and hand-back protocol

- Branch `v1/s3-anniversaries`, base `main`, **non-draft**, title `S3: anniversaries — 150 days, birthdays, season days, custom CRUD`. **Do not merge.**
- PR body: summary; scenario → test table with results; commands; screenshots per screen id; migrations; design substitutions and §10 defaults used; anything unverified.
- Follow the status protocol in your launch brief; `done` with the full PR URL; `needs-decision` for any product/design question.
