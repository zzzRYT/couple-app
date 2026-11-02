# H05 — Local anniversary notifications: pre-permission prompt, scheduler, settings (slice S5)

| | |
|---|---|
| Slice | S5 · tasks T501–T506 in `../tasks.md` |
| Requirements | V0-F10 (V0-F10-AC-01 … -08), V0-F12 notification rows, V0-NF-04, V0-DR-05, V0-EC-05/-09/-11 |
| Depends on | **H03 merged** (`computeAnniversaries`, custom anniversaries, birthdays; `features/notifications/preferences.ts` with per-anniversary `offIds`). H04 merged is recommended (shares the "data changed" hook points in `SpaceContext`; if H04 is not merged, add the hooks yourself and keep them in one place). Owner approval of the previous slice |
| Unblocks | H06 |
| Branch / PR | `v0/s5-notifications` → PR to `main`, non-draft, do not merge |
| Design source | artifact https://claude.ai/artifact/M2WFQCFnVzoWbHNhJPCz5X, version `1793598115-fafc`, boards V0-01 (`V0-start-notify`, `-notify-os`), V0-07 (`V0-set-main`, `V0-set-notify`, `V0-set-notify-denied`), V0-04/05 (per-anniversary "알림" field) |

`./design/V0-01-start.md` §3.12–3.13, `./design/V0-07-settings.md` §1 (rules), §3.1, §3.6, §3.7, §3.12–3.13, `./design/V0-05-anniv-edit.md` §1 ("알림 선택" rules), `./design/foundations.md`, `./design/copy-v0.md` are part of this handoff.

## 1. Goal and why

Remind each partner on their own phone on anniversary days without any server push: right after connecting, ask once (in-app pre-prompt, then iOS permission only if they tap "알림 켜기"); schedule up to 50 nearest reminders at 09:00 in the **space** time zone plus one early reminder (default 1 day before); let each person change time, early reminder, kinds and per-anniversary on/off for their device only; keep the schedule in sync whenever the app sees new data; cancel everything on logout, disconnect, end, and deletion.

## 2. Prerequisites and current code

- `expo-notifications ~58.1.6` is installed; today the app only calls `cancelAllScheduledNotificationsAsync` in `src/app/settings/delete-account.tsx` (via `clearDeviceAfterDeletion` in `features/account/deleteAccount.ts`). No permission request, no handler, no scheduling exists.
- After H02/H03: `V0_FEATURES.notifications` flag (false) hides the 알림 rows in settings; `V0-start-connected` → home; `features/notifications/preferences.ts` stores `{ "offIds": [] }` (per-anniversary "끄기") in the JSON file `v0-notify-<userId>.json` in the app document directory (`expo-file-system`); edit/detail screens show the per-anniversary choice; `computeAnniversaries` returns occurrences with stable keys.
- Board rule (V0-05 "알림 선택", verbatim): "기본 설정"은 설정의 알림 시간·미리 알림을 따라요 … "끄기"는 이 기념일만 이 기기에서 알리지 않아요. 상대 기기의 알림은 상대가 정해요.
- Board rule (V0-07 "알림", verbatim summary in the extract §1): local only; default 09:00 space zone + 1 day before; one early reminder (none / 1d / 3d / 7d); per-kind switches (함께한 날 · 생일 · 시즌 · 직접 추가); up to ~50 scheduled, re-synced on open/edit/zone change; partner changes apply when I open the app; device-denied → banner + "기기 설정 열기" + switches disabled.
- Owner decisions: D-02 (default time and early reminder), D-03 (copy rules), D-06 (pre-prompt timing).

## 3. Scope

In: T501–T506; screens `V0-start-notify`, the iOS permission prompt (system, not built), `V0-set-notify`, `V0-set-notify-denied`, the 알림 section on `V0-set-main`; wiring of the per-anniversary field from H03. Out: server push, notification actions/categories, badges (no tab badges), Android channels beyond the default.

## 4. Design extract index

| Screen | Extract | Behaviour |
|---|---|---|
| V0-start-notify | `design/V0-01-start.md` §3.12 | Shown once per device after `V0-start-connected` → "시작하기" (both creator and joiner). Mock notification card (uses `app.name`, `notify.sample.body`, `notify.sample.when`), cheer mascot, `notify.pre.title`, `notify.pre.body`, primary + bell `notify.pre.allow`, ghost `notify.pre.later`. Allow → `requestPermissionsAsync()`; whatever the answer → home. Later → home; never shown again (`prePromptSeen`). |
| V0-start-notify-os | §3.13 | The native iOS alert. **Do not build it.** iOS does not take an app-supplied body for notification permission; the `notify.os.*` keys are board-only — leave them unused. |
| V0-set-main 알림 section | `design/V0-07-settings.md` §3.1 item 4 | Rows: `set.notify.toggle` (switch), `set.notify.time` (value), `set.notify.early` (value). Row taps open `V0-set-notify` (destination not drawn — assumed). |
| V0-set-notify | §3.6, dark §3.12, en/ja §3.13 | Group 1: master switch + time row. The time picker is not drawn: use an hour/minute wheel (1-minute steps) in a bottom sheet with the same look as the app's `DateWheel`, and report it as a design substitution (§10). Group 2 `set.notify.early` radio list (`.none/.1d/.3d/.7d`, check mark). Group 3 `set.notify.kinds` with four kind tiles + switches (`anniv.kind.milestone/birthday/season/custom`). Footer `set.notify.note` with the partner name. Master off (not drawn): disable groups 2–3 (keep visible) and cancel all. |
| V0-set-notify-denied | §3.7 | Warn banner (bell-off icon, `set.notify.denied.title/.body`, button `set.notify.denied.cta` → `Linking.openSettings()`); early-reminder group hidden; switches disabled; footer stays. Re-check permission on foreground. |
| Per-anniversary field | `design/V0-05-anniv-edit.md` §1, §2 segmented control; `V0-04-anniv.md` detail rows | `anniv.notify.default` "기본 설정 ({time} · {early})" shows the current device settings; `anniv.notify.off`. Already stored by H03; now feed it to the planner. |

## 5. Contracts

### 5.1 Device preferences (`features/notifications/preferences.ts`, extend H03's module)

```ts
export type Early = 'none' | '1d' | '3d' | '7d';
export type NotifyPrefs = {
  enabled: boolean;            // master; default false until permission granted via the pre-prompt or settings
  time: string;                // 'HH:mm', default '09:00' (space time zone)
  early: Early;                // default '1d'
  kinds: { milestone: boolean; birthday: boolean; season: boolean; custom: boolean }; // default all true
  offIds: string[];            // custom anniversary ids turned off on this device
  prePromptSeen: boolean;
};
```

Stored as one JSON object in `v0-notify-<userId>.json` in the app document directory (H03 created it with `offIds` only; fill missing fields with defaults on read). Deleted on logout/delete.

### 5.2 Planner (pure, `features/notifications/plan.ts`)

```ts
export type PlannedNotification = { id: string; fireAt: string /* ISO instant */; title: string; body: string; data: { v0: true; key: string } };
export function planNotifications(input: AnniversaryInput /* same as computeAnniversaries */, prefs: NotifyPrefs,
  t: (key: string, vars?: Record<string, unknown>) => string, nowIso: string, max = 50): PlannedNotification[];
```

- Walk occurrences from today forward (the engine's `upcoming`, extended beyond 1 year if needed to reach `max`), for each kind enabled and custom id not in `offIds`:
  - day-of reminder at `time` on the occurrence date **in the space time zone**;
  - early reminder (if `early !== 'none'`) at `time` on `date − 1/3/7` days.
  - Skip any `fireAt <= now`. Sort by `fireAt`, cut at `max`.
- `fireAt` conversion: local wall time in `timeZone` → UTC instant (implement with `Intl.DateTimeFormat(...).formatToParts` offset search; no new date library unless already present). Nonexistent local times (DST spring-forward) move forward to the first valid minute; ambiguous times (fall-back) use the first occurrence.
- Identifier: `v0:<kind>:<occurrenceKey>:<occurrenceDate>:<offsetDays>` (offset 0 for day-of), matching spec V0-F10-AC-02 (kind · key · occurrence date · offset); `d150`/`y2` keys carry no date, so the date part is required. Also put `fireAt` in `content.data`.
- Copy (D-03): title = `t('notify.title')` (resolves to the app name). Body:
  - days/years: `notify.body.milestone` with `{title}` = `anniv.days`/`anniv.years` label;
  - season: `notify.body.season` with the season title;
  - birthday: `notify.body.birthday` with `{name}` (partner name, or the user's own for "my birthday" — board copy says "{name}님 생일"; for self use `anniv.birthday.me` as title in `notify.body.milestone`? Not drawn → use `notify.body.birthday` with the partner name only and **skip notifications for my own birthday**; report);
  - custom: `notify.body.custom` (title hidden);
  - early: `notify.body.early` `{title}`, `{n}`; custom early: `notify.body.early.custom` `{n}`.
- No names on custom; birthday name is allowed (D-03).

### 5.3 Scheduler (`features/notifications/scheduler.ts`)

- `syncNotifications(plan)`: read `getAllScheduledNotificationsAsync()`, keep those whose identifier is in the plan with the same `content.data.fireAt` (do not compare the returned trigger object — its shape differs by platform), cancel other `v0:` ones, schedule missing ones with `scheduleNotificationAsync({ identifier, content: { title, body, data, sound: 'default' }, trigger: { type: SchedulableTriggerInputTypes.DATE, date } })`. Never touch non-`v0:` identifiers (there are none today, but keep the rule).
- `cancelV0Notifications()` for logout/disconnect/ended/delete/master off.
- Set `Notifications.setNotificationHandler` once in `_layout.tsx` to show banners in the foreground; in SDK 58 return `shouldShowBanner` and `shouldShowList` (`shouldShowAlert` is deprecated). Verify on a device that a DATE trigger fires at the absolute instant even after the phone's time zone changes (spec V0-DR-05); report the result.
- Call points (one hook `useNotificationSync` mounted under `SpaceProvider`): snapshot changes that affect dates (start date, time zone, members' birthdays, anniversaries), prefs changes, language change (`i18n.on('languageChanged')`), app foreground, permission granted. Debounce 500 ms; skip when permission is not granted or `enabled` is false.

## 6. Implementation steps

1. Branch `v0/s5-notifications`; write failing tests (§7).
2. T501 prefs; T502 planner; T503 scheduler + hook; mock `expo-notifications` in Jest (`jest.mock('expo-notifications', …)` with in-memory schedule).
3. T504 `features/notifications/PrePromptScreen.tsx` + route `src/app/notify-intro.tsx`; insert it after `V0-start-connected`'s CTA when `prePromptSeen` is false (both roles). Turning on via the pre-prompt sets `enabled = true` only if permission is granted.
4. T505 settings: flip `V0_FEATURES.notifications` to `true`; main-screen rows; `src/app/settings/notifications.tsx` (`V0-set-notify` / `-denied`); time picker per §4; per-anniversary `anniv.notify.default` text shows current `time` + `early` labels (`set.notify.time.value`-style formatting with `Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit', timeZone: 'UTC' })` on a fixed date — the time is a wall time, not an instant).
5. Wire `cancelV0Notifications()` into `features/settings/logout.ts`, disconnect, `EndedScreen` (ended/ended-deleted), and keep `clearDeviceAfterDeletion`'s existing cancel-all.
6. T506 device checklist (`../quickstart.md` §알림) on TestFlight; screenshots of received notifications (lock screen) in the PR.

## 7. Tests to write first

| Scenario ids | Test | Assert |
|---|---|---|
| V0-F10-AC-02, -03, V0-NF-04, V0-DR-05, V0-EC-05, -09 | `features/notifications/__tests__/plan.test.ts` | 09:00 Asia/Seoul → `00:00Z`; device zone irrelevant; DST gap/overlap in America/New_York; early 1/3/7 days; max 50 nearest; ids unique and stable; custom body hides title; birthday body has the partner name; kinds/offIds respected; past skipped |
| V0-F10-AC-04, -06, -07, V0-EC-11 | `features/notifications/__tests__/scheduler.test.ts` | diff (keep/cancel/add), only `v0:` ids touched, resync on data/prefs/language/foreground, cancel on logout/disconnect/ended |
| V0-F10-AC-01 | `features/notifications/__tests__/prePrompt.test.tsx` | shown once after connected; allow → permission request; later → never again; both roles |
| V0-F10-AC-04, -05 | `features/settings/__tests__/notifications.test.tsx` | rows, radio, kind switches, master off disables groups, denied banner + open settings + hidden early group + disabled switches |
| V0-F10-AC-08 | device | stale reminder on a closed partner phone, fixed on next open |

## 8. Verification commands

```sh
pnpm lint && pnpm typecheck && pnpm --filter mobile test
```

Simulator check: `xcrun simctl push` is for remote pushes — not needed. Use a dev build, set the simulator clock (or a space time zone a few minutes ahead) and confirm a scheduled `v0:` notification fires; list with a temporary debug log, removed before the PR.

## 9. Owner-only steps

- No console work. Do **not** add the `expo-notifications` config plugin: it adds the `aps-environment` (push) entitlement, which local notifications do not need and which would require the Push capability and a new build. Without native changes this slice ships by OTA to `preview`; if the fingerprint changed anyway, ship via Release iOS.
- On both phones: connect flow shows the pre-prompt once → allow; then run `../quickstart.md` §알림 (set the phone date to the day before an anniversary at 08:59 space time, wait for the 09:00 early reminder; repeat for the day itself; log out → no scheduled reminders).
- Approve against boards V0-01 (notify) and V0-07 (notify, denied).

## 10. Open decisions (defaults; report)

| Decision | Default |
|---|---|
| Time picker UI (not drawn) | wheel in a bottom sheet, 1-minute steps |
| Row taps on main's 알림 section | open `V0-set-notify` |
| Master off look (not drawn) | groups visible but disabled; all `v0:` cancelled |
| Reminder for my own birthday (copy not drawn) | not scheduled |
| Pre-prompt placement when the creator's partner joins while the app is closed | on the next open, after `V0-start-connected` |

## 11. Out of scope

Server push or silent push, guaranteed delivery to a closed partner phone (A-05), notification categories/actions, Android-specific UI, widgets (H04).

## 12. PR rules and hand-back protocol

- Branch `v0/s5-notifications`, base `main`, **non-draft**, title `S5: local anniversary notifications`. **Do not merge.**
- PR body: summary; scenario → test table; device evidence; §10 defaults used; whether a new build is needed (fingerprint changed?).
- Follow your launch brief's status protocol; `done` with the full PR URL; `needs-decision` for product/design questions.
