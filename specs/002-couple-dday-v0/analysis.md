# Specification Analysis Report (speckit-analyze): 002-couple-dday-v0

**Date**: 2026-11-02 · **Artifacts**: spec.md, plan.md, data-model.md, contracts/, tasks.md, handoffs/ · **Constitution**: 1.0.0

## Findings (resolved in this PR)

| ID | Category | Severity | Location | Summary | Resolution |
|---|---|---|---|---|---|
| A1 | Inconsistency | MEDIUM | spec V0-F12-AC-09 vs H06 | AC said terms open a web page; `site/` has no terms page | AC now says hide/disable until the owner provides it (A-23) |
| A2 | Inconsistency | MEDIUM | tasks T307 vs H03 §6.6 | edit route path differed | tasks now use `app/anniversary-edit.tsx` full-screen modal |
| A3 | Inconsistency | LOW | plan §2 vs H02 §7.2 | `notifications` flag missing from plan | added to plan |
| A4 | Underspecification | MEDIUM | spec V0-F05, V0-F12-AC-02 | partner-wait hints need to know whether the partner entered a birthday without revealing it | `members[].hasBirthday` added to data-model and contract |
| A5 | Underspecification | LOW | spec V0-F10-AC-03 | own-birthday reminder copy not drawn | assumed default A-24 (not sent) |
| A6 | Underspecification | LOW | fonts | boards use weights the app does not bundle | assumed default A-25 |
| A7 | Coverage | LOW | plan §10 | `V0-DR-NN-AC-*` covered through parent `V0-DR-NN` rows | note added to plan §10 |
| A8 | Inconsistency | LOW | spec V0-F02-AC-08 vs V0-00 flow | creator also sees `V0-start-connected` once after the partner joins | AC rewritten |
| A9 | Inconsistency | LOW | spec V0-F10-AC-04/-05 vs V0-07 board | settings has no per-anniversary switch; denied hides early reminders | AC rewritten; per-anniversary off lives in the edit/detail field |

## Coverage

- Requirements V0-F01…F14: every one has ≥1 task and is assigned to exactly one primary handoff (README table).
- Acceptance scenarios: 90 `-AC-` ids in spec.md; scripted check found every id referenced in plan §10 (directly, by range, or by its `V0-DR-NN` parent), in tasks.md, and in the handoffs.
- No task references a requirement id that is not in spec.md.
- Device-layer scenarios (V0-F14-AC-02…04, V0-F11-AC-01/-03/-04/-08, V0-F10-AC-08) are tracked in quickstart.md and, from S6, in `device-checks.md` (H06 T605).

## Constitution alignment

No violations (plan "Constitution Check"). Principle V (reversible): hidden features stay in code and data; every migration needs a rollback header. Principle IV (verifiable): traceability test planned in S6.

## Remaining open items (owner)

A-02 production id, A-03 tester method, A-04 OTA provider, A-05 closed-phone sync, A-23 support email/terms, A-25 fonts — defaults are in place; none blocks H01 or H02.

## Second pass: code-grounded review of the handoffs (2026-11-02)

An independent read-only review checked every cited path, line, RPC and copy key against the code and found 43 issues (9 high). All were applied in this PR; the high ones:

- OTA preview updates now run with `APP_VARIANT=preview` and `--environment preview` (otherwise the fingerprint runtime and Supabase env differ from the TestFlight build).
- Offline cold start: `resolveEntry` must use the per-user V0 cache on network errors (today it falls into the old error screen).
- The plain invite code is kept on the device (`v0.invite.<spaceId>`), because the server stores only its hash.
- S2 home ignores server `d500`/`d1000` celebrations until S3 changes the server list (owner decision Q5).
- Creator saves the profile before creating the space (no mid-flow gate flip); `(onboarding)` guard covers `needsProfile`.
- Milestone RPCs move to `couple_space.time_zone` already in S2 (with the new time-zone RPC).
- Widget schema allows `today` to be null/omitted; one canonical `computeAnniversaries` shape (H03).
- Retry after a failed save reuses the same idempotency key (`api.ts` gains `idempotencyKey`); `gone` uses the existing `NOT_FOUND:{json}` error convention.

## Update: owner name decision (2026-11-02)

The owner decided the names: app 아룸 / Aroom / アルーム, mascot 아루미 / Aroomi / アルーミ (ja from the repo's existing i18n). A-01 moved from assumed defaults to decision D-08 in spec.md; plan §7, H02 §6 (overlay generator values, forbidden-literal list, particle fix), H01, H04, H06, README and `design/copy-v0.md`'s header follow it. Korean particle check: only `widget.none.title` needs a change (아룸 has a final consonant → "아룸을 시작해요"); 아루미 keeps "아루미가". Production bundle id, App Store visibility and the other release decisions stay open.

## Update: version naming (2026-11-02)

The owner named this release V0 (V1 = the later AI room-decorating version). The feature folder is now `specs/002-couple-dday-v0/` (also `handoffs/H02-v0-shell-home.md`, `contracts/v0-api.md`); every title, prose mention, identifier suggestion (`V0_FEATURES`, `locales/v0/`, `v0.*` device keys, `v0:` notification ids, `20261103…_v0_*` migrations) and handoff branch name (`v0/s1-…`) now says V0. Board page names drawn before the decision (e.g. `Later · V1 이후 (기록)`) stay verbatim. Decision D-09 in spec.md.
