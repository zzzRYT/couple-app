# Email sign-in

A returning user signs in with email and password from the start screen and lands on their home.

## Sub-features

- `email-entry` opens "이메일로 로그인" from the start screen.
- `email-submit` signs in through the `auth-password` function and goes home.

## How to get to it (user POV)

- Start screen, "이메일로 로그인", enter email and password, then "로그인".
- Design page: `design/pages/auth/login/page.md` and the V0-08 board.

## Driving it with aroom.mjs

Preconditions:

- A `session` user exists whose space has a profile (run the Home D+Day recipe first).
- The app is signed out: run `node .claude/skills/verify-aroom/aroom.mjs launch --fresh`.

- **Sign in.** Run `node .claude/skills/verify-aroom/aroom.mjs drive email-sign-in`. The flow types the last `session` user's email and password, submits, dismisses the iOS "암호를 저장하겠습니까?" sheet, and waits for "함께한 지 N일째, …부터".
- **Proof.** Run `node .claude/skills/verify-aroom/aroom.mjs shot email-sign-in/01-home`. The PNG shows the same space's home.

## Gotchas

- The field labels "이메일" and "비밀번호" are separate texts. Tap the email field by its placeholder `name@example.com` and the password field with `below: "비밀번호"`.
- The email field shows only the start of a long address ("verify-"); the full value is there, as `maestro hierarchy` shows.
- After signing in again, the home invite card shows "새 코드 만들기" instead of the code that the Invite code recipe copied, as seen on 2026-11-25. Do not assert the code here.
- Maestro writes evaluated variables, the test password included, to `~/.maestro/tests/*/maestro.log`. The account is deleted by `cleanup`, which makes that password useless.
