# Start screen

A signed-out user opening Aroom sees the mascot, the title "우리 둘의 날을 세어요", three feature lines, and the sign-in choices: Apple first, then email and password, then the development-only email code entry.

## Sub-features

- `start-boot` reaches the start screen from an empty install.
- `start-choices` shows "Apple로 계속하기", "이메일로 로그인" and, in development builds, "이메일로 계속하기".
- `start-no-quick-login` shows no test-account quick login (removed with devQuickLogin).

## How to get to it (user POV)

- Open the app for the first time, or after signing out.
- Design page: `design/pages/auth/login/page.md` (S02-select).

## Driving it with aroom.mjs

Preconditions:

- `doctor` passes and the build is current.

- **Empty install.** Run `node .claude/skills/verify-aroom/aroom.mjs launch --fresh`. It prints `Launched com.jinjinstar.aroom.dev`.
- **Start screen.** Run `node .claude/skills/verify-aroom/aroom.mjs drive sign-in-start`. Every step ends `COMPLETED`: the title, "Apple로 계속하기" and "이메일로 로그인" are visible and the quick login title is not.
- **Proof.** Run `node .claude/skills/verify-aroom/aroom.mjs shot sign-in-start/01-start`. The PNG shows the start screen in Korean.

## Gotchas

- A plain reinstall keeps the session: SecureStore lives in the keychain, which survives an uninstall. Always use `launch --fresh`.
- Tapping "Apple로 계속하기" opens the system Apple sheet, which a simulator without an Apple ID cannot finish. Use `session` for signed-in states.
