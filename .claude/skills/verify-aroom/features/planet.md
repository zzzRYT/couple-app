# Planet shell

A development build exposes a planet tab with the space D+Day and an accessible planet control. The real Aroomi GLB is pending.

## Sub-features

- The D+Day pill uses the space anniversary and time zone.
- The planet control offers rotation and zoom accessibility actions.

## How to get to it (user POV)

- Sign in to a space in a development build and select the 감자별 tab.
- Design reference: P01 and P02 in https://claude.ai/artifact/M2WFQCFnVzoWbHNhJPCz5X.

## Driving it with aroom.mjs

Preconditions:

- Run `node .claude/skills/verify-aroom/aroom.mjs launch --fresh` and `node .claude/skills/verify-aroom/aroom.mjs session --space 2025-06-29`.
- Run `node .claude/skills/verify-aroom/aroom.mjs drive planet` to complete the profile and open the tab. The planet accessibility label appears.
- When already signed in on home, run `node .claude/skills/verify-aroom/aroom.mjs drive planet-open` to open the same tab.
- Run `node .claude/skills/verify-aroom/aroom.mjs shot planet/01-day` to capture the current screen.

## Gotchas

- On the iOS 26.5 simulator used for S1, a GL synchronization workaround displays the planet and its temporary Aroomi; see the V1 rendering research for its limits.
- The layout and tab icon need Claude Design review. Verify drag, pinch, reduced motion, frame rate and first-show time on a physical device.
