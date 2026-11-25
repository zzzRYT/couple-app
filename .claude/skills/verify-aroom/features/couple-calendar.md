# Couple calendar

Both partners keep one shared calendar in the 달력 tab: a month grid with author-colored dots, the selected day's events with who wrote each one, and a sheet to add, edit or delete an event with an optional end time and an alert that rings on both partners' phones.

## Sub-features

- `calendar-month` shows the month, today filled, the selected day outlined, and up to three dots a day in the writer's color (나 = primary, partner = info) with a 나 / partner legend.
- `calendar-day` lists the selected day's events, all-day first, each with its time, title and a writer chip; a day with none shows "이날은 일정이 없어요".
- `calendar-edit` opens "새 일정" or "일정 편집": title, 종일, 날짜, 시작, 종료 (optional), 알림; editing shows "<name> 작성" and "이 일정 삭제".
- `calendar-alert` schedules a local notification for an event with an alert, on every partner device that has loaded it and allowed notifications.

## How to get to it (user POV)

- Open the 달력 tab (second of four). Tap a day, tap "+" (일정 추가), or tap an event.
- Design: board `V0-13 커플 달력` (`design/canvas/project/V0-13-calendar.dc.html`), copy `copy-v0-calendar.dc.html`; spec V0-F19.

## Driving it with aroom.mjs

Preconditions:

- The home recipe ran: `session --space 2025-01-01` and `drive home-dday` (see the Home D+Day recipe).

- **Partner with events.** Run `node .claude/skills/verify-aroom/aroom.mjs partner --name 하루 --event "이케아 장보기|<today>||1d" --event "헬스장 등록|<today>|08:00|30m"`, with `<today>` as YYYY-MM-DD in Asia/Seoul. It prints each event and "Partner 하루 … joined space …". The app shows "연결됐어요".
- **Calendar and the add sheet.** Run `node .claude/skills/verify-aroom/aroom.mjs drive calendar`. It passes "연결됐어요" and the notification pre-prompt (allowing notifications), opens 달력, waits for the partner's events with "하루 작성", opens "새 일정", types "저녁 데이트", sets the end to 오후 8:00 and the alert to 30분 전. Then `shot calendar/04-add-sheet`.
- **Save.** Run `node .claude/skills/verify-aroom/aroom.mjs drive calendar-save`. It saves and waits for "저녁 데이트 … 나 작성" next to "이케아 장보기 … 하루 작성". Then `shot calendar/05-day-both-partners`: the list shows both writers' chips and today's dots in both colors.
- **Alert proof.** Have the partner write an event a few minutes ahead with the alert `at` (the same `--event` shape through the spaces events route), send the app to the home screen, and open Notification Center at that minute. It lists "<title> · 지금 시작해요" from the app.

## Gotchas

- Rows read as "<label>, <value>" for VoiceOver, so tap "알림, 없음" rather than "알림": a bare "알림.*" matches the note "알림은 두 사람의 …" first.
- The alert row sits below the fold on a 6.3-inch screen; scroll to it, and hide the keyboard first because the title field keeps focus.
- A partner who joins while the owner is in the app brings up "연결됐어요" and then the notification pre-prompt; the calendar flow taps through both as optional steps.
- `partner` makes a new user each time; a space holds two members, so run it once per session. `cleanup` deletes both users.
- A banner shows for about five seconds; read Notification Center instead of racing the banner.
