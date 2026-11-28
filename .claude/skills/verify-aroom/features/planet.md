# Planet shell

A development build exposes a planet tab with the space D+Day and an accessible planet control. The real Aroomi GLB is pending.

## Sub-features

- The D+Day pill uses the space anniversary and time zone.
- The planet control offers rotation and zoom accessibility actions.
- A development toggle and a test-object button exercise the proposed level, capacity and local placements in `specs/003-ai-couple-planet-v1/planet-level.md`.
- The 산책하기 button zooms into a close view behind Aroomi. A held drag steers Aroomi across the planet, which rolls under it, and 별 전체 보기 zooms back out. The speed, the reach and the close camera are proposals.
- 오브젝트 만들기 opens a create panel. A text description or the cropped part of a photo goes to a fake generator, and the sample object is previewed at the level's maximum size and saved as a placement. Nothing leaves the device.

## How to get to it (user POV)

- Sign in to a space in a development build and select the 감자별 tab.
- Design reference: P01 and P02 in https://claude.ai/artifact/M2WFQCFnVzoWbHNhJPCz5X.

## Driving it with aroom.mjs

Preconditions:

- Run `node .claude/skills/verify-aroom/aroom.mjs launch --fresh` and `node .claude/skills/verify-aroom/aroom.mjs session --space 2025-06-29`.
- Run `node .claude/skills/verify-aroom/aroom.mjs drive planet` to complete the profile and open the tab. The planet accessibility label appears.
- When already signed in on home, run `node .claude/skills/verify-aroom/aroom.mjs drive planet-open` to open the same tab.
- Run `node .claude/skills/verify-aroom/aroom.mjs shot planet/01-day` to capture the current screen.
- Run `node .claude/skills/verify-aroom/aroom.mjs drive planet-walk` to enter the walk view. The 별 전체 보기 button appears.
- Run `node .claude/skills/verify-aroom/aroom.mjs drive planet-walk-step` to hold a twelve-second drag up and to the right. Aroomi stands further along the planet and faces that way.
- Run `node .claude/skills/verify-aroom/aroom.mjs drive planet-overview` to zoom back out. The 산책하기 button appears and Aroomi stays where it walked.
- Text: run `node .claude/skills/verify-aroom/aroom.mjs drive planet-create-text`, which stops at the preview, then `node .claude/skills/verify-aroom/aroom.mjs drive planet-create-place`. The planet accessibility label then counts one more object.
- Photo: run `node .claude/skills/verify-aroom/aroom.mjs drive planet-create-photo`, which picks the first library photo and stops in the system crop editor. `node .claude/skills/verify-aroom/aroom.mjs drive planet-create-photo-crop` confirms the crop and shows the cropped part in the panel. Then run `node .claude/skills/verify-aroom/aroom.mjs drive planet-create-photo-send` and `node .claude/skills/verify-aroom/aroom.mjs drive planet-create-place`.

## Gotchas

- 사진 찍기 cannot be driven on a simulator. A simulator has no camera, so the button shows 사진을 가져오지 못했어요. Verify the camera on a physical device.
- The system photo picker and crop editor are driven by their own labels: library cells read `사진, <date>` and the crop editor's confirm button reads `Choose`.
- The create panel's text field shares its words with its label, so the flow taps the second match.
- The test space from `session --space 2025-06-29` is past 365 days, so the planet starts at level 3.
- The test-object button is disabled while a save runs and drops taps during that time, so wait for the object count in the planet accessibility label between taps.
- On the iOS 26.5 simulator used for S1, a GL synchronization workaround displays the planet and its temporary Aroomi; see the V1 rendering research for its limits.
- The simulator draws the scene on the CPU and shows a new frame only every few seconds. Wait about fifteen seconds before a shot. A drag walks only on the frames drawn while it is held, which is why the step flow holds for twelve seconds; a short drag can end before any frame and leave Aroomi in place. The zoom and the walking motion cannot be judged there.
- The layout and tab icon need Claude Design review. Verify drag, pinch, walking, reduced motion, frame rate and first-show time on a physical device.
