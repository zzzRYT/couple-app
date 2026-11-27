# Profile photo

Each partner sets their own profile photo in 내 정보 고치기, and one app-wide profile source shows it wherever that person has a face: the 연결됐어요 screen, the settings profile card, and every calendar face (filter chips, day cells, event rows, the event sheet). A partner's change reaches the other phone through the same realtime 'member' hint a name change sends.

## Sub-features

- `profile-photo-set` opens 내 정보 고치기 from the settings card, taps the large face (프로필 사진 바꾸기), and offers 사진 고르기 and, once a photo exists, 사진 지우기. The pick is cropped square, sent as a 512px JPEG and applies at once, separate from 저장.
- `profile-photo-faces` shows the photo instead of the initial in the settings card (52pt), on the 연결됐어요 screen next to both names, and in every calendar Avatar; a person without a photo, or a photo that fails to load, keeps the initial.

## How to get to it (user POV)

- 설정 tab, tap the profile card ("<name>, 생일 · …"), then tap the face at the top.
- No design board yet; the copy keys are `set.me.photo.choose`, `set.me.photo.remove`, `set.me.photo.failed` and `a11y.me.photo`.

## Driving it with aroom.mjs

Preconditions:

- The home recipe ran: `session --space 2025-01-01` and `drive home-dday` (see the Home D+Day recipe).
- Two JPEGs outside the repo, for example from `/Library/User Pictures` with `sips -s format jpeg -Z 512 <heic> --out <jpg>`.

- **Partner with a photo.** Run `node .claude/skills/verify-aroom/aroom.mjs partner --name 하루 --photo <partner.jpg> --event "이케아 장보기|<today>||none|partner"`, with `<today>` as YYYY-MM-DD in Asia/Seoul. It prints "Partner 하루 … joined space …". The app shows "연결됐어요" with 하루's photo next to the name; `shot profile-photo/01-connected-partner-photo`.
- **Partner photo in the calendar.** Run `node .claude/skills/verify-aroom/aroom.mjs drive profile-photo-calendar`. It taps through "연결됐어요" and the notification pre-prompt, opens 달력 and waits for "이케아 장보기 … 하루님이 추가". The 하루 chip, the day cell and the row show the photo; `shot profile-photo/02-calendar-partner-photo`.
- **Set my photo.** Run `xcrun simctl addmedia <udid> <me.jpg>` (`doctor` prints the udid), then `node .claude/skills/verify-aroom/aroom.mjs drive profile-photo-set`. It opens 내 정보 고치기, 프로필 사진 바꾸기, 사진 고르기, taps the photo and Choose, and waits for the sheet to close. The face at the top shows the new photo; `shot profile-photo/04-edit-my-photo`. Back in 설정 the card shows it too, and the 나 chip in 달력 shows it next to 하루's.

## Gotchas

- The picker's cells carry only dates, and the grid order follows the photos' capture dates, not the order they were added; check where the added photo lands with a shot before trusting the tap point.
- The crop screen's button is English ("Choose") on this simulator even with a Korean locale; the flow matches "Choose|선택".
- `partner` makes a new user each time; a space holds two members, so run it once per session. `cleanup` deletes both users and their photos.
