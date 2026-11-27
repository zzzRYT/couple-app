---
name: verify-aroom
description: Drive the Aroom iOS app (apps/mobile) on a simulator the way a user does, against the Aroom-dev backend, and capture screenshot evidence. Use to prove a mobile UI or flow change works in the real app, to reproduce a mobile bug, or to make design-review evidence. Also holds the local-stack HTTP scenarios for server changes.
---

# Verify Aroom

The surface is the iOS app. A Release simulator build talks to Aroom-dev, a test user is signed in through the same `aroom-dev://auth-callback` link a magic-link email returns, Maestro drives the screens, and `simctl` takes the screenshots. Everything runs through `aroom.mjs` next to this file. macOS only; CI (ubuntu) runs just `aroom.test.mjs` through `pnpm verify`.

```sh
node .claude/skills/verify-aroom/aroom.mjs <doctor|build|launch|session|partner|drive|shot|cleanup>
```

## Launch

1. `node .claude/skills/verify-aroom/aroom.mjs build` prebuilds `apps/mobile/ios` for the `development` variant, adds the keychain group, runs `pod install` and builds Release for the simulator into `apps/mobile/ios/build/verify`. The first build takes 15 to 25 minutes. After a JS-only change, `build --js-only` rebuilds in about 5 minutes. Ready when it prints `Built …/Aroom*.app`.
2. `node .claude/skills/verify-aroom/aroom.mjs launch --fresh` creates this checkout's simulator `aroom-verify-<hash>` (iPhone 17 Pro, iOS 26.5, Korean), boots it, installs the build with empty app data and an empty keychain (the session lives in the keychain and survives an uninstall), and starts the app. Ready when it prints `Launched com.jinjinstar.aroom.dev`. The app is then on its first screen, signed out.
3. `node .claude/skills/verify-aroom/aroom.mjs session [--space YYYY-MM-DD]` creates a test user `verify-aroom-…@example.com` on Aroom-dev (with a space when `--space` is given), opens the sign-in link and confirms the system "열기" prompt. Ready when the app leaves the sign-in screen.

For a feature that needs both partners, `node .claude/skills/verify-aroom/aroom.mjs partner [--name 하루] [--event "title|YYYY-MM-DD|HH:MM|alert|owner" [--comment TEXT]]` adds a second test user who joins the last session's space through the invitation and profile endpoints and can write calendar events (and comments on them) as that partner; the owner is together (default), me (the session user) or partner. `drive` keeps running as the session user, and `cleanup` deletes both.

Each checkout gets its own simulator and state folder (`$TMPDIR/aroom-verify-<hash>`), so two worktrees can verify side by side. Never drive a simulator this CLI did not create.

To check another screen size, set `AROOM_VERIFY_DEVICE` to a device type id suffix (`iPhone-SE-3rd-generation`, `iPhone-17-Pro-Max`) and `AROOM_VERIFY_HOME` to a state folder of its own on every command for that device. The simulator takes the folder's name, and each device keeps its own test users and `cleanup`.

## Doctor

`node .claude/skills/verify-aroom/aroom.mjs doctor` is read-only. It checks Xcode, the iOS 26.5 runtime, Maestro, CocoaPods, that the dev token reaches a healthy Aroom-dev, that the build exists, inlines Aroom-dev and never Aroom-prod, uses the `verify-aroom` OTA channel and carries `keychain-access-groups`, and that the simulator is booted with the app installed. Run it first whenever anything looks off. Exit code 1 means a `FAIL` line names what to fix.

## Drive

`node .claude/skills/verify-aroom/aroom.mjs drive <flow>` runs `flows/<flow>.yaml` with Maestro on this checkout's simulator. The last `session` user's email and password reach the flow as `${MAESTRO_EMAIL}` and `${MAESTRO_PASSWORD}` through the environment, never the command line. The feature map in `features/README.md` lists each feature, its flows and the end state that proves it. Read the matching feature file before driving.

- Tap and assert by visible Korean text from `apps/mobile/src/i18n/locales/ko-KR.json` (or its V0 overlay), not coordinates. Text fields take taps by their placeholder or label text.
- `maestro --device <udid> hierarchy` prints the labels on screen when a selector misses. `doctor` prints the udid in its state line.
- Hiding the keyboard can send the return key and submit a form. Make the following button tap `optional: true` and assert the next screen instead.
- iOS system prompts ("열기", "암호를 저장하겠습니까?") show in Korean on this simulator; match `열기|Open` style alternatives and tap them as optional.
- Write a new flow for a new feature, add it to the map, and keep `appId: com.jinjinstar.aroom.dev` as its first line.

## Evidence

`node .claude/skills/verify-aroom/aroom.mjs shot <feature>/<name>` saves `design/evidence/verify-aroom/<feature>/<name>.png`. That folder is the evidence a PR attaches for the design-review gate, and cleanup never touches it.

- Drive the real user path. A test session replaces only the Apple or email sign-in, which a simulator cannot complete.
- Capture the action and the resulting state, not only the last screen. Name shots in order, such as `01-profile` then `02-home`.
- Check side effects the screen implies. A space or invite the UI shows can be read back from Aroom-dev with `node tools/supabase/remote.mjs dev …` or the Management API's read-only SQL.

## Cleanup

`node .claude/skills/verify-aroom/aroom.mjs cleanup` deletes every test user this checkout created through the app's own operator deletion, which also purges their spaces, confirms none is left on Aroom-dev, deletes the simulator, and removes the state folder. It keeps `design/evidence/verify-aroom/` and the build in `apps/mobile/ios/build/verify`. Run it after every run, failed ones included. If it reports a user still present, the state folder stays so a rerun can retry.

## Rules

- Backend is Aroom-dev only. The CLI reads keys at run time with the dev token in `~/.config/aroom/supabase-dev.env`, keeps them in memory, and inlines only the publishable key into the build. That token cannot see Aroom-prod. Never put a key in the repo.
- A Debug build stops at launch (HotUpdater's TurboModule is missing). The build is always Release.
- Rebuild after any change to `apps/mobile`. The installed app runs the bundle from the last `build`.

## HTTP scenarios (local stack only)

`http/run.ts` holds 23 server scenarios (home cover, room settings, lease, milestones, account deletion) moved from the 2026-10-29 pre-deploy check (`docs/pre-deploy-verification.md`). They rewrite the database clock and read the Edge Runtime container, so they never run against Aroom-dev. Run them only on the local stack when a change touches those server paths:

```sh
supabase start -x studio,imgproxy,vector,logflare,supavisor
supabase functions serve &   # in another shell
deno run -A .claude/skills/verify-aroom/http/run.ts
supabase stop --no-backup
```

It prints `PASS`, `FAIL` or `N/A` per scenario and a tally. `pnpm verify` type-checks it.
