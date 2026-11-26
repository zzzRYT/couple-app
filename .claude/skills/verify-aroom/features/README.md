# Aroom verification map

This folder is the maintained source for verifying Aroom's user-facing behavior on the iOS simulator. Read this index, then use the matching feature file as the recipe. Each feature points back at its design page in `design/pages/`, which holds the full state list and copy keys.

## Baseline preconditions

- `node .claude/skills/verify-aroom/aroom.mjs doctor` passes every line.
- The build is current: rerun `build` (or `build --js-only`) after any change under `apps/mobile`.
- `launch --fresh` gives an empty app: no app data and an empty simulator keychain, so the app opens signed out.
- Test users come only from `session`. They live on Aroom-dev and `cleanup` deletes them.
- Never drive a simulator or an account this CLI did not create.

## Driving conventions

- Run every command from the repository root as `node .claude/skills/verify-aroom/aroom.mjs <command>`.
- Start each recipe from the state its `Preconditions:` names. Recipes that share a state chain in the order this index lists them.
- Select by visible Korean text or accessibility label from `apps/mobile/src/i18n/locales/ko-KR.json` and its `v0/` overlay. Maestro matches the whole label as a regex.
- Treat every command as literal.

## Proof and skip reporting

- Capture the user action and the resulting state with `shot <feature>/<NN-name>`, in order.
- A flow that ends in `COMPLETED` on every step plus the shots is the proof. A `FAILED` step is a failed journey, not a skip.
- Report an unreachable path with the command you ran and the unmet precondition. Do not report it as verified through another path.

## Feature entry contract

Each feature file starts with an H1 title and one paragraph on the user-visible behavior, then exactly four H2 sections in this order: `Sub-features`, `How to get to it (user POV)`, `Driving it with aroom.mjs` (starting with `Preconditions:` and pairing each action with its exact command and observable result), and `Gotchas`. `aroom.test.mjs` checks this shape, the links below, and that every `aroom.mjs drive <flow>` names a file in `flows/`.

## Features

- [Start screen](./sign-in-start.md) covers the signed-out first screen and its sign-in choices (S02, V0-start-intro).
- [Home D+Day](./home-dday.md) covers a new space's first sign-in: profile, invite code, then the D+Day count on home (V0-02).
- [Invite code](./invite-code.md) covers the waiting home card with the invite code and copying it (V0-10).
- [Email sign-in](./email-sign-in.md) covers signing in with email and password from the start screen (V0-08).
- [Couple calendar](./couple-calendar.md) covers the 달력 tab: both partners' events, the add sheet and an alert that rings (V0-13, V0-F19).
- [Planet shell](./planet.md) covers the development-only planet tab and its current simulator limitation.
