# Home D+Day

A user who signs in to a space they just created names themselves, sees the invite code for their partner, and lands on home with the D+Day count since the anniversary date.

## Sub-features

- `home-profile` asks for the display name ("나를 알려 주세요") before anything else.
- `home-invite-first` shows the invite code screen once, with "홈에서 기다릴게요" to move on.
- `home-count` shows D+N with "함께한 지 N일째, <date>부터" for the space's anniversary date.

## How to get to it (user POV)

- Create a space after the first sign-in, then finish the profile.
- Design pages: `design/pages/home/home/page.md`, `design/pages/space/invite-create/page.md`.

## Driving it with aroom.mjs

Preconditions:

- The app is signed out after `launch --fresh` (see the start screen recipe).

- **Signed-in user with a space.** Run `node .claude/skills/verify-aroom/aroom.mjs session --space 2025-01-01`. It prints the space id and the test user, then taps the system "열기" prompt. The app shows "나를 알려 주세요".
- **Profile.** Run `node .claude/skills/verify-aroom/aroom.mjs shot home-dday/01-profile` before driving, so the shot shows the empty profile.
- **Profile to home.** Run `node .claude/skills/verify-aroom/aroom.mjs drive home-dday`. It types the name "검증", submits it, waits for "상대를 초대해 주세요", taps "홈에서 기다릴게요", and waits for "함께한 지 N일째, 2025년 1월 1일부터".
- **Proof.** Run `node .claude/skills/verify-aroom/aroom.mjs shot home-dday/02-home`. The PNG shows "검증", D+N and "2025년 1월 1일부터". N counts the anniversary as day 1 in Asia/Seoul, so 2025-01-01 is D+693 on 2026-11-24.

## Gotchas

- The big D+N is drawn in the hand-lettered font and is not readable as text. Assert the accessibility label "함께한 지 N일째, …부터" instead.
- `session --space` creates the space through the same `spaces` Edge Function the app calls; it skips only the date-picker screens.
- The flow asserts the date "2025년 1월 1일부터", so keep `--space 2025-01-01` or change both.
