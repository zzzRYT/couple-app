# MVP UI audit

Compared the MVP implementation with `design/tokens.json`, `screens.md`, `interaction-notes.md`, `i18n-copy.md`, and the corresponding canvas boards and exports. Photo, milestones and generated decorations are outside this MVP. The notes below identify gaps in the starting implementation; simulator verification is recorded separately when available.

| Screen | Mismatch | Fix |
| --- | --- | --- |
| S01 welcome | System fonts and left-aligned text replace the designed type and centered hero; fixed non-scrolling layout can overflow at large type. | Apply language-aware typography, center the hero and allow scrolling within safe areas. |
| S02 login | Plain top-aligned stack lacks designed hierarchy and safe-area handling; long/error states can overflow. | Use the shared screen spacing, typography and scrollable safe area. |
| S03 create | Fixed view with no inset or scrolling; headings and date controls lack the designed hierarchy. | Use safe, scrollable layout and token typography. |
| S04 invite | Code, waiting illustration and actions are all in a fixed vertical stack; small screens and translated copy can clip. | Scroll within safe areas, align the code and waiting content, and use token spacing. |
| S05 join | Input and confirmation states use fixed screen layout and do not account for keyboard. | Make the form scroll and avoid the keyboard. |
| S06 home | Square outlined D-day card and default fonts differ from the rounded, centered design; content lacks safe inset and dark palette. | Use the card radius, type scale and theme; retain pending invitation and offline states. |
| S07 room | Toolbar uses the light palette regardless of device appearance; scene layout estimates rather than reads actual safe insets. | Use theme colors and device safe insets while preserving scene protection zones and mascot. |
| S08 prompt | Full-screen stack omits the designed room context and sheet treatment; light colors are hard-coded, keyboard covers the composer, status blocks can consume all available height. Single-member consent check can incorrectly enable decorating. | Add keyboard-safe scrolling, themed sheet/composer, room context, and clearly gate on both members' consent. |
| S09 preview | Square container and two non-flexing buttons can overflow; confirmation is an unpositioned modal. | Use card tokens, wrapping controls and a usable modal. Preserve shared preview/apply semantics. |
| Shared components / tabs / loader | Buttons, chips, banners, dialogs and fields are square, use default typography and light colors; modal has no centered scrim; tab tint is always light. | Use tokens, language-aware type, dynamic colors, rounded controls and safe modal layout; retain system tabs and reduced-motion loader. |

The design exports include later-phase elements; these are intentionally excluded from this audit. English and Japanese design copy remains marked as awaiting native review in the handoff.

## Verification and remaining gaps

A local iOS simulator build was run on iPhone 12 mini and iPhone 11 with light and dark appearance. The initial onboarding screen was rendered through the normal entry route. A temporary, uncommitted fixture route rendered login, create, invite, join, home, room and the free prompt state with sample data; screenshots and side-by-side comparisons with the exports were kept outside the repository. English and Japanese invite-entry copy was spot checked on the mini. The fixture does not exercise the server, Apple authentication, the real system tab bar, keyboard, or the preview/apply interaction. The simulator used a placeholder Supabase key; real-device two-member verification remains necessary.

The changes in this branch address the missing create-or-join entry, clipboard actions, safe areas and scrolling in onboarding, dynamic light/dark colors, rounded shared controls, the home hierarchy and room thumbnail, prompt keyboard avoidance and close action, and both-member consent gating. The prompt preview undo now asks for confirmation. The design is not yet pixel-identical: S01's illustrated cards, the detailed S08/S09 sheet and preview presentation, full type styling across all screens, and the actual system tab bar on each simulator need further visual review. On small screens the visible D-day widget is shifted below the toolbar when their frames overlap; the stored presentation is unchanged. Verify this adjustment with a real saved room and large text. The day/night window is a simple native approximation of the canvas illustration. Verify keyboard avoidance, Dynamic Type, VoiceOver and the full two-device flow on physical iPhones before considering this complete.
