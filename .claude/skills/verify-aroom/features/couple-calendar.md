# Couple calendar

Both partners keep one shared calendar in the 달력 tab. Each event is 함께, mine or the partner's (its owner), colored and faced by owner, and always says who added it: a month grid with owner faces under each day, a 모두/함께/나/partner filter, the selected day's events, a sheet to add, edit or delete an event with an optional end time and an alert that rings on both partners' phones, and a comment thread on each event.

## Sub-features

- `calendar-month` shows the month, today filled, the selected day outlined, and under each day the owners' faces (함께 = heart in the together color, 나 = my initial in primary, partner = their initial in info); 모두 · 함께 · 나 · partner chips filter by owner.
- `calendar-day` lists the selected day's events, all-day first, each led by the owner's face and owner chip, with "<time> · 하루님이 추가" (and "· 내가 수정" when the other partner edited it); a day with none shows "이날은 일정이 없어요".
- `calendar-edit` opens "새 일정" or "일정 편집": title, "누구 일정이에요?" (함께 · 나 · partner, 함께 by default), 종일, 날짜, 시작, 종료 (optional), 알림; editing opens with a writer card ("하루님이 추가한 일정 · <date>", "마지막 수정: 나 · <date>") and ends with "이 일정 삭제".
- `calendar-comment` lists an event's comments at the bottom of its sheet ("댓글 N", each with the writer's face, name and time), sends one from "댓글 남기기", and deletes only my own after "댓글을 삭제할까요?"; a day row with comments adds "· 댓글 N".
- `calendar-alert` schedules a local notification for an event with an alert, on every partner device that has loaded it and allowed notifications.

## How to get to it (user POV)

- Open the 달력 tab (second of four). Tap a day, tap "+" (일정 추가), or tap an event.
- Design: board `V0-13 커플 달력` (`design/canvas/project/V0-13-calendar.dc.html`), copy `copy-v0-calendar.dc.html`; spec V0-F19.

## Driving it with aroom.mjs

Preconditions:

- The home recipe ran: `session --space 2025-01-01` and `drive home-dday` (see the Home D+Day recipe).

- **Partner with events.** Run `node .claude/skills/verify-aroom/aroom.mjs partner --name 하루 --event "이케아 장보기|<today>||1d|together" --event "헬스장 등록|<today>|08:00|30m|partner"`, with `<today>` as YYYY-MM-DD in Asia/Seoul. It prints each event and "Partner 하루 … joined space …". The app shows "연결됐어요".
- **Calendar and the add sheet.** Run `node .claude/skills/verify-aroom/aroom.mjs drive calendar`. It passes "연결됐어요" and the notification pre-prompt (allowing notifications), opens 달력, waits for the partner's events with "하루님이 추가", opens "새 일정", types "저녁 데이트", sets the end to 오후 8:00 and the alert to 30분 전. Then `shot calendar/04-add-sheet`.
- **Save.** Run `node .claude/skills/verify-aroom/aroom.mjs drive calendar-save`. It saves and waits for "저녁 데이트 … 내가 추가" next to "이케아 장보기 … 하루님이 추가". Then shoot the day: each row is led by its writer's face and today shows both faces.
- **Comments.** On a fresh session (the home recipe again), run `node .claude/skills/verify-aroom/aroom.mjs partner --name 하루 --event "헬스장 등록|<today>|08:00|none|partner" --comment "같이 갈래? 저녁 7시쯤"`. It prints "Partner comment on …". Then `drive calendar-comment` waits for the row "헬스장 등록 … 댓글 1" (`shot calendar-comment/01-day-row`); `drive calendar-comment-open` opens the sheet and scrolls to 하루's comment (`shot calendar-comment/02-partner-comment`); `drive calendar-comment-send` sends "좋아, 퇴근하고 바로 갈게" and waits for "댓글 2" with a "댓글 삭제" button on my comment only (`shot calendar-comment/03-my-reply`); `drive calendar-comment-delete` confirms the delete and waits for "댓글 1" with 하루's comment left (`shot calendar-comment/04-after-delete`).
- **Alert proof.** Have the partner write an event a few minutes ahead with the alert `at` (the same `--event` shape through the spaces events route), send the app to the home screen, and open Notification Center at that minute. It lists "<title> · 지금 시작해요" from the app.

## Gotchas

- Rows read as "<label>, <value>" for VoiceOver, so tap "알림, 없음" rather than "알림": a bare "알림.*" matches the note "알림은 두 사람의 …" first.
- The alert row sits below the fold on a 6.3-inch screen; scroll to it, and hide the keyboard first because the title field keeps focus.
- A partner who joins while the owner is in the app brings up "연결됐어요" and then the notification pre-prompt; the calendar flow taps through both as optional steps.
- `partner` makes a new user each time; a space holds two members, so run it once per session. `cleanup` deletes both users.
- `--comment` comments on the `--event` before it, as the partner.
- A banner shows for about five seconds; read Notification Center instead of racing the banner.
