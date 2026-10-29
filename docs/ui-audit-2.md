# MVP UI audit, second pass

Second finishing pass over the MVP screens (S01-S05, S06/S23, S07/S24, S08-S10, S12, S13/S26, loader, S16 for those screens), compared with `design/screens.md`, `design/components.md`, `design/interaction-notes.md` §9-11, `design/tokens.json`, the canvas sources (`design/canvas/project/*.dc.html`) and `design/exports/*.png`. Out of scope: home cover photo (§12), end space/report/disconnect, milestones, generated decorations, account deletion.

## How it was checked

- Dedicated iOS 26.5 simulator, iPhone 12 mini (375 × 812pt), the existing Debug dev-client build, Metro from this branch.
- Each state was rendered through a temporary, uncommitted gallery route with fixture props (light and dark, ko; en and ja spot checks), and the signed-in tab screens through the real entry route against the local Supabase stack (one local test user) so the system tab bar and safe areas are real.
- Motion was checked on the simulator with timed frames (loader cycling plant → balloon → window → book; mascot walking, cheering and walking back).
- Before/after/design comparisons are in `docs/ui-audit-2/` (left: before, middle: after, right: design export, unless noted).
- Not exercised end to end: invitation create/accept against the local stack (the shared local functions server answers 503 for `invitations`, see open questions), Apple sign-in, keyboard on a physical device, VoiceOver, Dynamic Type beyond spot checks.

## Gap list

Status: **fixed** in this branch, **open** = needs the owner or a later phase.

### Shared components and tokens (fix once, applies everywhere)

| Area | Mismatch | Fix | Status |
| --- | --- | --- | --- |
| Typography | Most text used the system font; no language-aware faces, weights or line heights; Korean wrapped mid-word. | `theme/typography.ts` maps the token scale to the bundled faces per language (display Gaegu/Yomogi only for ≥20pt bold, emphasis Noto Sans KR Bold / Zen Maru Gothic Bold, body Gowun Dodum / Noto Sans JP) with token line heights; `AppText` applies it and `lineBreakStrategyIOS="hangul-word"` (keep-all). | fixed |
| Buttons | 48pt rectangles, 1px outline, plain font, ghost drawn in body colour, no loading state; loaders replaced buttons. | Pill, 52pt, 2px `line` outline, emphasis 16 label, optional icon; ghost uses `primary`; disabled = dashed outline + `surface2`; pressed state; `loading` keeps the label with a small spinner (components.md §2.1, interaction-notes §10.2). | fixed |
| Icons | No icon set (text-only back/close/send). | `ui/Icon.tsx`: 2px line icons on a 24 grid drawn with Skia (back, close, share, copy, sparkle, heart, clock, lock, eye, send, globe, …). `IconButton` 48pt. | fixed |
| Text field | 44pt, 1px border, no visible label, no error/focus state. | Label (bold 14) above, 52pt, radius 16, 2px border, focus colour, error icon + message. | fixed |
| Chips / occupancy | Plain grey pill. | Variants with icon + outline (neutral/info/success/warn/danger/primary); occupancy free/mine/partner as clock/pencil/lock. | fixed |
| Banner | Title only, no icon or outline, no action. | `*Bg` face + same-family outline, icon, bold title, body, underlined text action; `quiet` one-line note. | fixed |
| Toast | Rendered as a banner and never went away. | Dark brown / cream pill with icon, hides after 3 s. | fixed |
| Dialog / sheet | Square scrim card; sheet was a dialog. | Dialog: surface, 2px line, radius 28, optional icon circle, heading title, stacked buttons, warm scrim. Bottom sheet: rounded top, handle, keyboard-avoiding, covers the tab bar. | fixed |
| List rows / cards | Settings used a ghost button. | `ListRow` (≥56pt, icon, value, chevron) inside `Card` groups with `SectionLabel`. | fixed |
| Screen scaffold | Each screen hand-rolled padding; onboarding group layouts and screens both added safe areas (double top inset); no back/close bar; buttons not pinned. | `Screen`: safe areas, 20pt gutter, optional back/close bar, scrolling body, footer pinned above the home indicator, keyboard avoidance. Group layouts only paint the background. | fixed |
| Tab roots | Home/settings content scrolled under the iOS 26 floating tab bar. | `useTabBarClearance()` keeps the system tab bar height + home indicator clear. Tab icons now follow the design (house / room / sliders, filled when selected). | fixed |
| Loader | Plain `setInterval` frame swap every 1.2 s on the JS thread, no grow/shrink, label read twice, used inside buttons. | See Motion. | fixed |

### Screens

| Screen / state | Mismatch | Fix | Status |
| --- | --- | --- | --- |
| S01 intro | Start/legal on every page, square beige card, page "1 / 3" text, no skip. | Skip link, centred name + tagline (hidden ≥130%), pastel illustrated cards (day badge + balloon, room props, mascot hero), dots, single primary action; start / existing account / legal / age only on page 3. | fixed |
| S02 login / email / code | Content under the status bar, no back, loaders replaced buttons, plain errors. | Back bar, name + tagline, title, Apple button as 52pt pill, legal footer; email and code steps with labelled fields, inline errors, loading buttons, pinned actions. | fixed |
| S03 create / creating / ok / errors | Inline wheel with square borders; banners as plain text. | Three outlined date boxes that open the wheel in a sheet (S03-picker), hint/error line under the field, quiet time-zone note with globe icon, pinned create button; loader screen; success with spot illustration. English shows month names instead of "10 Month". | fixed |
| S04 code / soon / expired / reissue / waiting | One long stack mixing code and waiting; code as plain text. | Code card with 4+4 boxes and clock line (warn colour when expiring); share (primary) / copy (secondary) / new code (ghost) pinned; expired banner + one-tap new code; reissue confirm only while a code is live; sharing or copying moves to S04-waiting (floating letter spot, "Invite code" back, "Next" → home); toasts for copied/cancelled. | fixed |
| S05 enter / found / has-space / ok / errors | Single text field, errors as text, back as a text button. | Box-styled code input (system keyboard + paste, one accessible name), danger outline on errors, banner with body, paste link; confirm step with gift spot card; has-space footer "view current space" / close. | fixed |
| Create-or-join | Plain list. | Centred spot + title + body, two pinned actions. | fixed |
| S06 home | System font header, chip/banner stack, room card thumb showed the top-left of the room, no pull to refresh, buttons under the tab bar. | Bold app name, eyebrow / 56pt display count / date, warn chip "before invite", invite-pending banner with action, room card with a cropped floor-level thumbnail and chevron, sparkle primary + ghost edit, save toast, pull-to-refresh, skeleton loading, offline/sync banners with retry. | fixed |
| S07 room | Square ghost "decorate" box at the right, rectangular window, tiny mascot, square text plates, banners covering the D-day widget. | Full-width primary pill with sparkle in the toolbar (outline follows the room's day/night), "watch" (eye, secondary) while the partner decorates, arched wooden window with sun/cloud or moon/star, floor line, rounded cream text plates in the display face (≥20pt), mascot drawn at the 170pt scene box, D-day widget with heart + display count, banners and the recall card above the tab bar, partner-change toast (§9), loader and recover/retry states. | fixed |
| S08 prompt | Flat list, square message boxes, text "Send"/"Close" buttons, room preview drawn in day mode at night. | Framed room miniature (day/night follows the room), sheet with title + close icon, occupancy chips, banners with actions, bubbles (mine = primary, result = outlined card), locked composer reason, 52pt round send button, idle hint. | fixed |
| S09 preview / confirm | Toggle as two buttons, stacked apply/undo/cancel, plain modal. | "Preview · not applied yet" badge on the miniature, segmented current/preview control, apply + cancel side by side, undo as ghost with icon, partner read-only banner, confirm dialog with icon. | fixed |
| S10 undo | Plain modal. | Dialog with icon and body; progress on the undo button. | fixed |
| S12 consent | Text sections, buttons in the scroll. | Close bar, sections with icon tiles and dividers, status line, agree/later pinned (withdraw for granted), withdraw dialog. | fixed |
| S13 settings | Only a "Log out" text button under the status bar. | Title, grouped rows: together date (→ home), AI consent status (→ S12 to review/withdraw), log out, app version. | fixed (MVP rows only) |
| S16 entry error / loading | Unstyled. | Loader screen; server error banner + retry. | fixed |

### Motion (interaction-notes.md §10.1, §10.2, §11)

| Item | Before | Now | Status |
| --- | --- | --- | --- |
| Object-cycle loader | JS-thread frame swap, no scale/opacity, one object hard-cut to the next. | `ui/CycleLoader.tsx`: Reanimated on the UI thread, canvas `cpl-cycle` keyframes (pop in .6→1.05, settle, float 3pt, shrink out .7 with ±6°), 4.8 s round, objects 1.2 s apart, message below, art hidden from VoiceOver, reduced motion = still plant. Used for every full-screen loading state (boot, sign-in, creating space, invite code, room, decorate sheet, "making the preview"). Buttons keep their own small spinner and lists/cards keep skeletons, as §10.2 specifies. | fixed |
| Floating letter (S04-waiting) | `Animated` loop on a lone letter shown on every invite state. | `ui/Spot.tsx` waiting spot (sparkle + cloud still, letter floats 6pt, 3.2 s each way, ease-in-out), only in S04-waiting; still with reduced motion; hidden from VoiceOver. | fixed |
| Roaming mascot (S07/S24) | 50 ms `setInterval` re-rendering React 20×/s; pose shown only while the finger is down; ran off screen and in the background. | Pure `scene/roamCycle.ts` (40 s, 6 poses + mirrored walk, ±27% of the width, 4pt bob every second while walking) evaluated on the UI thread from a frame-callback clock; seven stacked pose layers switch by opacity (as the canvas does); tap = 1.2 s excited greeting where it stands, then the cycle resumes; still waving pose with reduced motion, in miniatures and when `paused`. | fixed |
| Pausing | None. | Loops run only while their screen is focused and the app is in the foreground (`useLoopActive`); the clock keeps its phase across pauses. | fixed |

## Real-use gaps found and handled

- Content hidden under the floating tab bar on home and settings → fixed (tab clearance).
- Double safe-area inset on all onboarding screens → fixed.
- Prompt room preview always drawn as day → follows the room's day/night.
- No way back from login, email, invite, join confirm → back bars added.
- No pull-to-refresh on home; partner room changes were silent while looking at the room → pull-to-refresh and a one-time toast.
- No settings entry to review/withdraw AI consent (S12-status) → settings row.
- Inviter had no "waiting" state separate from the code → S04-waiting after share/copy.
- English date boxes read "10 Month / 29 Day" → month name + number.

## Open questions for the owner

1. **Invite → waiting flow.** The design shows S04-code and S04-waiting but not the step between. This branch moves to waiting after a successful share or copy; "Invite code" returns to the code, "Next" goes home. OK?
2. **Mascot size in the room.** The stored default box is 0.2 × room width (scene contract), which draws a ~75pt mascot; the design draws it in a 170pt scene box. The app now scales the drawing (not the stored data) by 170 / (0.2 × 390). If the stored default should change instead, that is a contract change for the backend.
3. **Partner name.** There are no display names in the data model, so copy uses the generic "상대" ("상대님이 꾸미는 중"). The design's "하루님과 함께해요" chip stays hidden.
4. **Loader vs. button spinners.** The brief asked to replace spinners everywhere; §10.2 keeps a small spinner inside buttons and skeletons in cards. The branch follows §10.2. Say if buttons should show the object loader too.
5. **Local invitations 503.** The shared local functions server returns 503 for `invitations` (most likely `INVITE_CODE_PEPPER` is not set for `supabase functions serve`), so the two-device join flow was not walked locally. Worth a quick check on the remote project with two phones.
6. **Tab icons.** System SF Symbols that resemble the canvas glyphs (house, square.split.1x2, slider.horizontal.3). Custom tab images are possible if the exact canvas glyphs are wanted.
7. **iOS 26 tab bar.** The simulator shows the new floating glass tab bar; the canvas draws the classic bar. Both are the system's; nothing to change unless the owner wants the classic look forced.

## Still not pixel-identical / not verified

- Scene props in the room are drawn from stored sizes; the canvas sample rooms use hand-tuned sizes.
- High contrast (3px outlines, darker inks) is not wired: the app reads only light/dark.
- Dynamic Type was spot-checked only through the intro (tagline hide); 200% layouts need a device pass.
- VoiceOver order and announcements need a device pass.
