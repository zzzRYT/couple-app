Verified 2026-11-02: 98 claims checked, 4 corrected.
# Design extract · V0-02 홈 · D+Day and V0-03 시스템 상태

Source: artifact https://claude.ai/artifact/M2WFQCFnVzoWbHNhJPCz5X, version 1793598115-fafc, page "V0 · 홈·D+Day" (canvas page id `v0-home`).
Boards: `V0-02-home.dc.html` (canvas 1760x4873) and `V0-03-states.dc.html` (canvas 1760x3820), read from the local slim copies plus the full exports in `artifact/project/` (used only for icon path data and the sparkle symbol).
Units: board px = iOS pt (390x844 frame). "≈" marks a value derived from a hand-drawn (jittered) number. Colors are given as hex → app token (`apps/mobile/src/theme/tokens.ts`, `color.app.<mode>.normal.<name>` shortened to `L.x` light / `D.x` dark).
Copy keys come from `copy-v0.md`.

## 1. Board header facts

### V0-02
- Eyebrow "AROOM · V0 · D+DAY · 홈"; H1 "V0-02 홈 · D+Day"; board title in the page list "V0-02 홈 · D+Day".
- Description (verbatim): "S06 메인 D-day의 V0 변형이에요. 커버 사진과 방 입구를 빼고, D+N과 다음 기념일, 다가오는 기념일만 남겼어요. 상대가 아직 없으면 초대 코드가 홈에 그대로 보여요."
- Sample-data note: "오늘 = 2026년 11월 2일(월), 사귄 날 = 2025년 6월 29일 → D+492. 축하 프레임은 그날의 날짜로 그렸어요." (today frame = 2026-06-29, D+366; season frame = 2026-11-11, D+501; late frame = 2026-04-26, D+302).
- Sections: "iOS · 밝은 앱 · 한국어" (6 frames), "iOS · 어두운 앱 · 한국어" (3), "영어 · 일본어" (4), "규칙" (3 cards).
- Rules card "홈에 있는 것":
  - Order top→bottom: 앱 이름 · 모피(인사) · 두 사람 이름 · 함께한 지 · D+N(가장 큼) · 사귄 날 · 다음 기념일 카드 · 다가오는 기념일 3개 · 전체 보기.
  - Cover photo (S06), "우리 방" card/button and the room tab are hidden in V0. Tabs = 홈 · 기념일 · 설정 (3).
  - Editing the start date is NOT a home button; it moves to 설정 › 사귄 날 (applies to both people, so it goes through a confirmation).
- Rules card "축하 카드 (S28 단순화)":
  - On an anniversary day, opening the app shows the celebration card IN PLACE OF the next-anniversary card. No "기념 방 꾸미기 제안" button.
  - Late celebration: day-count (N일) and yearly (주년) milestones, if the app is first opened within 7 days counting the day itself, show once with the "조금 늦게 축하해요" copy (S28 rule). Birthdays, season days and custom days: only on the day.
  - Several on the same day: priority 주년 > 일수 > 생일 > 직접 추가 > 시즌; only one becomes the card, the rest appear under "오늘" in the list.
  - Closing it: that anniversary never shows again on that device. The partner's device is independent.
- Rules card "D+N 표시" (info-blue card, bg #E1EDF5 = L.infoBg, border #2D5E86 = L.info):
  - D+N and "N일째" are the same number; the start date itself is D+1 (1일째).
  - EN "Day N", JA "N日目": word order differs, so it is a template key (`dday.big`).
  - Screen reader reads it once as "함께한 지 492일째, 2025년 6월 29일부터".

### V0-03
- Eyebrow "AROOM · V0 · D+DAY · 상태"; H1 "V0-03 시스템 상태 (로딩 · 실패 · 오프라인 · 상대 없음)".
- Description: "로딩, 불러오기 실패(전부 아니면 없음), 오프라인에서 마지막 데이터로 읽기만, 상대가 연결을 끊은 경우예요."
- Section note: "S16 공통 상태를 V0 홈에 맞춘 것이에요. 나머지 공통 상태(로그인 만료·앱 업데이트 필요·권한 없음)는 S16 그대로예요."
- Sections: "iOS · 밝은 앱 · 한국어" (6 frames), "어두운 앱 · 영어 · 일본어" (4), "규칙" (3 cards).
- Rule "불러오기 실패는 전부 아니면 없음 (2026-11-01 오너 규칙)":
  - Home and anniversary list fetch space + anniversaries + birthdays at once. If any part fails, show nothing partial: only V0-state-error.
  - 다시 시도 repeats the same request from the start. Widgets keep showing the last successful data.
- Rule "오프라인":
  - If last-successful data exists on device, show home/list/detail from it with an "오프라인 · 마지막 확인 시각" strip on top.
  - Offline: add/edit/delete/change-start-date buttons are disabled (dashed outline) and tapping does NOT queue anything (V0 kept simple).
  - When the date rolls over, D+N and D-n are recomputed on device (space time zone). Partner changes made meanwhile apply after reconnecting.
  - No stored data → V0-state-offline-empty.
- Rule "상대가 없을 때" (info-blue card):
  - Before partner joins: V0-home-pending (home board). Widget shows "상대 연결 전".
  - Partner disconnected or deleted account → V0-state-ended on next app open. Clear this device's scheduled notifications and widget data; "새로 시작하기" goes to V0-start-choose.
  - If it happens while the app is open, switch to this screen immediately on the Realtime hint.

### Related global rules (V0-00 흐름 board, same artifact)
- Tabs: 홈 · 기념일 · 설정 (system UITabBar). Old "방" tab hidden; "기념일" takes its place. Tab a11y names use existing `a11y.tab` template (total 3).
- Touch targets ≥ 48pt; iOS safe area top 47 / bottom 34 (S19 tokens). Text up to 200% (S20). Only moving source is S29; the V0 celebration card's Mopi hop/twinkle are drawn as the reduced-motion still.
- Day count: start date = D+1; calendar-day difference + 1 at midnight in the space IANA time zone (default Asia/Seoul). N-day milestone = start + (N−1). 주년 = same calendar date (1주년 = 366일째). Feb 29 start → Feb 28 in common years. Same day: 주년 wins.
- Local notification 09:00 on the day → V0-home-today. Realtime hint while open → reload.
- Start date change by partner → "하루님이 사귄 날을 바꿨어요" strip on the other home.

## 2. Global frame facts

### Device frame (board chrome, not app UI)
- 390x844, outer radius 44, ring `0 0 0 6px` #E3CDB0 (light) / #4A3D36 (dark). Dynamic island 124x36 at top 11, #000. Home indicator 134x5 at bottom 8, radius 3, #3F2D22 (light) / #F7EBDD (dark), opacity .85.
- Screen background: #FBF1E3 = L.bg; dark #2B2320 = D.bg. Default text #3F2D22 = L.text / #F7EBDD = D.text.
- Board canvas bg #F6ECDD: no token (board only).

### Safe areas / scaffold
- Header row: padding 55 top (47 safe + 8), 20 sides, min-height 48; holds app name only (`app.name` "모피루"), NSKR 700 16/24, L.text. No back, no buttons.
- Home body: padding 6 top, 20 sides; vertical stack gap 14. States body (loading/error/empty/ended): padding 8 top, 20 sides, gap 16. Offline body uses home values (6 / gap 14).
- Bottom: 91px spacer (83 tab bar + 8) keeps content clear of the tab bar. Content box is `overflow:hidden` in the board (real app: scroll; see §5).
- Ended screens: no tab bar, no app name; top 47px blank; footer padding 12/20/42 (42 = 34 safe + 8).

### Tab bar (all tabbed frames)
- role=tablist, aria-label `a11y.tabbar` "탭 막대". Absolute bottom, height 83 (49 + 34), padding-top 7, 3 equal items, column, gap 2.
- Light bg rgba(249,249,249,.94), top hairline 0.5 rgba(60,60,67,.29). Dark bg rgba(30,26,24,.94), hairline rgba(84,84,88,.6). System material: no app token (S20: OS owns bar material).
- Items (icons 25x25, viewBox 24, stroke round caps/joins):
  | tab | label key | ko/en/ja | icon (board path) | a11y label (ko) |
  |---|---|---|---|---|
  | 1 | `tab.home` | 홈 / Home / ホーム | house: `M4 11l8-7 8 7v9a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z` | 홈 탭, 3개 중 1번째, 선택됨 |
  | 2 | `tab.anniv` | 기념일 / Anniversaries / 記念日 | calendar with heart: rect 3.5,5 17x15.5 rx2.5 + `M3.5 9.5h17M8 3v4M16 3v4` + heart `M12 18s-3-1.9-3-3.8a1.5 1.5 0 0 1 3-.6 1.5 1.5 0 0 1 3 .6c0 1.9-3 3.8-3 3.8z` | 기념일 탭, 3개 중 2번째 |
  | 3 | `tab.settings` | 설정 / Settings / 設定 | gear/sun: circle r3.2 + 8 rays `M12 2.8v2.6M12 18.6v2.6M4.6 5.6l1.9 1.9M17.5 16.5l1.9 1.9M2.8 12h2.6M18.6 12h2.6M4.6 18.4l1.9-1.9M17.5 7.5l1.9-1.9` | 설정 탭, 3개 중 3번째 |
- Selected: icon stroke 2.2 + label 600 10/12, color #B24A24 = L.primary (dark #F0A67F = D.primary). Unselected: stroke 2 + label 500 10/12, #6B5444 = L.text2 (dark #CDB8A5 = D.text2). Label font -apple-system / SF Pro Text (system).
- a11y template `a11y.tab` "{name} 탭, {total}개 중 {n}번째{sel}", `a11y.tab.sel` ", 선택됨". EN "Home tab, 1 of 3, selected", tablist "Tab bar"; JA "ホームタブ、3件中1件目、選択中", tablist "タブバー".
- Tokens: `systemTabBar` says selected tint = app.primary, unselected = app.text2 (always set; iOS default gray fails 4.5:1). Current code `(tabs)/_layout.tsx` uses NativeTabs with SF symbols house / square.split.1x2 (room) / slider.horizontal.3 and a "room" trigger: board needs room → 기념일 (calendar-heart) tab. Board icons are custom line drawings; whether SF symbols may substitute is not stated (§5).

### Fonts (ko & en; ja in §3.x)
| role | family | weight | size/line-height | color |
|---|---|---|---|---|
| app name, names, card titles, section title, row title, D-n in rows, button labels | Noto Sans KR | 700 | 16/24, 19/28.5, 17/25.5, 15/22.5 | text |
| eyebrow "함께한 지", "다음 기념일" label, invite expiry, loading caption | Noto Sans KR | 500 | 15/22.5, 13/19.5, 14/21 | text2 |
| D+N | Gaegu | 700 | 60/69 (plain home) or 56/64.4 (when chip/card/banner present); tabular-nums; letter-spacing −0.01em | text |
| D-n on next card | Gaegu | 700 | 30/45, nowrap | primary |
| celebration title | Gaegu | 700 | 20/30 | text |
| state titles | Gaegu | 700 | 24/36 (error, ended), 22/33 (offline-empty) | text |
| since-date, dates, bodies, hints | Gowun Dodum | 400 | 15/22.5, 14/21, 13/19.5 | text2 |
| badge "직접" | Noto Sans KR | 700 | 11/16 | text2 |
- ko line-height 1.5 (tokens.typography.lineHeight.ko); en 1.4; ja 1.6. Display lines: 1.15 (60/69, 56/64.4) — tokens say display 1.1 and `typeStyle()` uses 1.25: neither matches the board.
- Token fits: D+N 56 = `display`; celebration title 20 = `heading` (but lh 30 not 25); body 14 = `bodySm`; button 16/700 ≈ `label` (600). 60, 30, 24, 22, 19, 17, 15, 13, 11 have no scale token → use `emphasis(size)`/explicit styles.
- Bundled fonts (`assets/fonts`): NotoSansKR 400/700, GowunDodum 400, Gaegu 700, Yomogi 400, ZenMaruGothic 700, NotoSansJP 400/700, Inter 400. Board uses Noto Sans KR 500 and Zen Maru Gothic 400/500 and Yomogi "700" which are not bundled.
- Korean `word-break: keep-all` everywhere (code: `WORD_BREAK` lineBreakStrategyIOS hangul-word). ja `line-break: strict`.

### Color map (every hex on both boards)
| hex | light/dark token | used for |
|---|---|---|
| #FBF1E3 | L.bg (= room.day.wall) | screen bg |
| #FFF8EC | L.surface | cards, code boxes, secondary button face; also toast ink |
| #F3E0C4 | L.surface2 | skeleton blocks, copy-button face |
| #3F2D22 | L.text | text; toast bg |
| #6B5444 | L.text2 | secondary text, unselected tab, close icon |
| #B24A24 | L.primary | D-n big, links, heart, selected tab, primary buttons, today chip |
| #FFFFFF | L.onPrimary | text/icon on primary; today-chip border (light) |
| #4A3426 | L.line (= illustration.outline) | strong card borders, icon-tile borders (both modes), icons on tiles |
| #8A6B55 | L.border | badge border, code dash, dashed partner pill, copy/secondary button border |
| #E3CDB0 | L.divider | upcoming list card border + row dividers; light frame ring |
| #7A4F00 / #FFEFC4 | L.warn / L.warnBg | offline banner, pending chip |
| #2D5E86 / #E1EDF5 | L.info / L.infoBg | board rule cards only |
| #2B2320 | D.bg | dark screen bg |
| #352B26 | D.surface | dark cards, code boxes |
| #40342E | D.surface2 | dark copy-button face |
| #F7EBDD | D.text | dark text; dark home indicator |
| #CDB8A5 | D.text2 | dark secondary text, unselected tab |
| #F0A67F | D.primary | dark accent |
| #2B1A12 | D.onPrimary | text/icon on dark primary; dark today-chip border |
| #E8D3BC | D.line | dark strong borders, dark share/primary button border |
| #A58E7B | D.border | dark badge border, dashed pill, copy button border, code dash |
| #4A3D36 | D.divider | dark list border/dividers; dark frame ring |
| #F7D98B / #40361A | D.warn / D.warnBg (#F7D98B is also illustration.palette.butter) | dark offline banner / pending chip; birthday tile |
| #AACBE2 | illustration.palette.sky | Pepero Day (season) tile |
| #A8C6A0 | illustration.palette.sage | Christmas (season) tile |
| #C9B8E8 | illustration.palette.lav | custom day tile |
| #F2A7B4 | illustration.palette.pink | 1주년 (milestone) tile |
| #FFF4DF | illustration.rim | sparkle symbol rim |
| #000, rgba(...) tab bar, rgba(0,0,0,.18) | no token | device island, system tab bar, toast shadow |
| #F6ECDD | no token | board canvas |

### Radii, borders, shadows
- Hand-drawn jittered radii (CSS elliptical per-corner). Approximate uniform equivalents: next card ≈22 (`23.8px 24.2px 20.7px 23.3px / 22.0px 22.0px 24.6px 20.7px`); upcoming list card ≈20 = radius.card (`18.8 21.6 22.0 18.8 / 21.2 20.0 20.0 22.4`); celebration card ≈24 (`26.9 22.6 25.9 26.4 / 22.6 25.4 24.0 24.0`); pending code card ≈20 (`20.0 22.4 18.8 21.6 / 22.0 18.8 21.2 20.0`); offline banner ≈16 = radius.input (`17.9 15.0 17.3 17.6 / 15.0 17.0 16.0 16.0`); toast ≈18 (`20.2 16.9 19.4 19.8 / 16.9 19.1 18.0 18.0`); 52pt buttons ≈26 = pill (`29.1 24.4 28.1 28.6 / 24.4 27.6 26.0 26.0`); 48 tile ≈16 (`14.4 16.6 16.9 14.4 / 16.3 15.4 15.4 17.2`); 34 tile ≈11 (`10.2 11.8 12.0 10.2 / 11.5 10.9 10.9 12.2`). Code boxes 10 exact; chips/pills 999. tokens.radius.cornerJitter ±12%.
- Borders: cards/primary controls 2px (tokens.border.outline.normal); icon tiles, chips, banner, small round buttons 1.5px; badge 1.2px; dividers 1px.
- Shadows: none, except the partner-edited toast `0 6px 18px rgba(0,0,0,.18)` — conflicts with tokens.elevation "none (flat; no shadows anywhere)".

### Recurring components (exact)
- **Names row** (role=text, a11y `home.names.a11y` "{me}님과 {partner}님" → "도담님과 하루님"): row centered, gap 8; name NSKR 700 16/24 text; heart icon 16 filled+stroked primary (`M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z`, stroke 2).
- **Hero block**: column centered, gap 4, text-align center: [mascot 96] → names row → "함께한 지" (`dday.together`, NSKR 500 15/22.5 text2, +4 margin-top) → D+N (`dday.big` "D+{n}", Gaegu; role=text a11y `dday.a11y` "함께한 지 {n}일째, {date}부터" → "함께한 지 492일째, 2025년 6월 29일부터") → since (`dday.since` "{date}부터", GD 400 15/22.5 text2) → [chip, margin-top 8].
- **Hero mascot**: box 96x96; image `mascot_wave_main` (ratio match 1.135) drawn 102.4x90.2 at left −3.2, bottom 3.8 (overflows the box). alt `mascot.alt.wave` "모피, 인사하고 있어요", role=img. Shown only in the plain home and partner-edited frames (with D+N 60); absent when a chip/celebration/pending card/offline banner is shown (D+N 56).
- **Next-anniversary card** (button, a11y "{`home.next.label`}, {title}, {`date.long`}, {`dday.left`}" → "다음 기념일, 빼빼로데이, 2026년 11월 11일 (수), D-9"): full width, row, align center, gap 14, padding 14/16, bg surface, border 2 line, radius ≈22. Left tile 48x48, radius ≈16, bg kind color, border 1.5 #4A3426, icon 26 stroke #4A3426 w2. Middle (flex 1): label `home.next.label` "다음 기념일" NSKR 500 13/19.5 text2; title NSKR 700 19/28.5 text; date `date.short` "11월 11일 (수)" GD 14/21 text2. Right: `dday.left` "D-9" Gaegu 700 30/45 primary nowrap. Height ≈101.
- **Upcoming header**: row space-between, align center, min-height 32. Title `home.upcoming.title` "다가오는 기념일" NSKR 700 17/25.5 text. Link `home.upcoming.all` "전체 보기" NSKR 700 15 primary + chevron 16 (`M9 5l7 7-7 7`, stroke 2.4 primary), gap 2, min-height 44; href = V0-04-anniv board (anniversary list).
- **Upcoming list card**: bg surface, border 2 divider (#E3CDB0 / dark #4A3D36), radius ≈20, overflow hidden. Rows are buttons: min-height 56, padding 6/14, row gap 12, transparent. Tile 34x34 radius ≈11, kind color, border 1.5 #4A3426, icon 19 stroke #4A3426 w2. Title NSKR 700 15/22.5 text, single line ellipsis; optional badge `anniv.badge.custom` "직접" (NSKR 700 11/16 text2, border 1.2 L.border, pill, padding 0 6, margin-left 6). Date `date.short` GD 13/19.5 text2. Right `dday.left` NSKR 700 15/22.5 text nowrap. Divider between rows: 1px, margin-left 66, divider color. Row a11y "{title}, {`date.long`}, {`dday.left`}" e.g. "크리스마스, 2026년 12월 25일 (금), D-53". Excludes the item already in the next card.
- **Anniversary kind → tile color / icon** (only kinds drawn):
  | kind (example) | tile | icon path |
  |---|---|---|
  | season 빼빼로데이 (`anniv.pepero`) | #AACBE2 sky | two sticks `M6.5 21L14 4M11 21l7.5-17` + `M10.6 13.2L14 5.5M15.1 13.2l3.4-7.7` (stroke-width 4) |
  | season 크리스마스 (`anniv.christmas`) | #A8C6A0 sage | tree `M12 3l5 6h-3l4 5h-3l4 5H5l4-5H6l4-5H7zM12 19v2.5` |
  | birthday 내 생일 / 하루 생일 (`anniv.birthday.me` / `anniv.birthday`) | #F7D98B butter | cake `M4 20.5h16M5.5 20.5v-7h13v7M5.5 15.8c2 1.2 3.4 1.2 4.6 0s3.6-1.2 4.8 0 2.6 1.2 3.6 0M12 13.5V10M12 7.5c.9-.9.9-1.9 0-3-.9 1.1-.9 2.1 0 3z` |
  | custom 처음 만난 날 (+ "직접" badge) | #C9B8E8 lav | star `M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8L3.5 9.7l5.9-.9z` |
  | milestone 1주년 (`anniv.years`) | #F2A7B4 pink | medal: circle cx12 cy9 r5 + `M9 13.2L7 21l5-2.6 5 2.6-2-7.8` |
  Tiles keep the pastel face and brown #4A3426 outline in dark mode. None of these icons exist in `ui/Icon.tsx` (it has heart, sparkle, close, copy, share, info, offline, clock, forward...; path data differs from the board's).
- **Chips** (pill, padding 4/11, gap 6, border 1.5, NSKR 700 13/19, icon 15 stroke 2.2; height ≈30):
  - Today chip `home.today.chip` "오늘 {title}" → "오늘 1주년": light bg L.primary, border #FFFFFF (L.onPrimary), ink #FFFFFF; dark bg #F0A67F, border/ink #2B1A12 (D.onPrimary). Icon 4-point sparkle `M12 3l2.2 6.8L21 12l-6.8 2.2L12 21l-2.2-6.8L3 12l6.8-2.2z`.
  - Pending chip `home.pending.chip` "상대를 기다리는 중": light bg #FFEFC4 warnBg, border/ink #7A4F00 warn; dark #40361A / #F7D98B. Icon clock (circle r9 + `M12 7v5l3 2`).
  - Code `Chip` differs: border 2, minHeight 32, icon 16, padding 4/16, primary kind edge = primary.
- **Celebration card** (role=region, a11y = title): row, align center, gap 10, padding 12 14 12 8, bg surface, border 2 line, radius ≈24, position relative. Close button absolute right 2/top 2, 44x44 circle transparent, X icon 20 (`M6 6l12 12M18 6L6 18`) stroke text2 2.2, a11y `home.today.close` "축하 카드 닫기". Art box 96x92: inner 90x90 with `mascot_cheer` (ratio 1.106) drawn 93.6x84.6 at left −1.8, bottom 3.6, alt `mascot.alt.cheer` "모피, 신나 있어요"; two sparkle symbols `#obj_shape_sparkle` (viewBox 64; big star fill butter #F7D98B, small star fill #FFF4DF; both with #FFF4DF rim and #4A3426 outline), 22px rotated −8° at left −4/top 2 and 18px rotated 10° at right −2/top −4, aria-hidden. Text column flex 1, gap 4, padding-right 30: title Gaegu 700 20/30 text; body GD 14/21 text2. Static (reduced-motion pose); live motion = S29 hop/twinkle (not in local export).
- **Primary button (states)**: width 220 (error/empty) or full width (ended), min-height 52, padding 8/20, gap 8, radius ≈26, border 2; label NSKR 700 16/24; optional refresh icon 20 stroke 2.1 (`M20 12a8 8 0 1 1-2.3-5.7M20 4v5h-5`). Primary: bg L.primary, border L.line, ink #FFFFFF; dark bg #F0A67F, border #E8D3BC, ink #2B1A12. Secondary (offline-empty): bg L.surface, border #8A6B55 (L.border, not line), ink L.text. Code `Button` uses pill radius, 2px edge = line for secondary.
- **Offline banner** (role=status): row, align center, gap 10, padding 10/14, radius ≈16, bg warnBg, border 1.5 warn; icon wifi-off 20 stroke 2.2 warn (`M2.5 8.5a15 15 0 0 1 19 0M5.8 12a10 10 0 0 1 12.4 0M9.2 15.4a5 5 0 0 1 5.6 0M12 19h.01M3 3l18 18`); title `state.offline.banner` NSKR 700 14/21 warn; body `state.offline.readonly` GD 13/19.5 warn. Code `Banner kind="offline"` uses surface2/text2, 2px border, text color = text: does not match.

## 3. Screen frames

### 3.1 V0-home · 보통 (다음 기념일 · 다가오는 3개) — light ko
Top→bottom (body padding 6/20, gap 14):
1. Header: "모피루" (`app.name`).
2. Hero: wave mascot 96 → names "도담 ♥ 하루" → "함께한 지" → "D+492" Gaegu **60/69** → "2025년 6월 29일부터".
3. Next card: Pepero tile, "다음 기념일" / "빼빼로데이" / "11월 11일 (수)" / "D-9".
4. Upcoming header "다가오는 기념일" + "전체 보기 ›".
5. List (3 rows): 크리스마스 · 12월 25일 (금) · D-53 (sage/tree); 내 생일 · 3월 14일 (일) · D-132 (butter/cake); 처음 만난 날 [직접] · 5월 17일 (월) · D-196 (lav/star).
6. Tab bar, 홈 selected.
- Interactions: next card → button (destination not drawn; flow: V0-anniv-detail-*); rows → buttons (same); "전체 보기" → V0-04 anniversary list (기념일 tab); tabs. No pull-to-refresh drawn. No date-edit button (moved to settings).
- Dark (V0-home · 보통, 어두운 앱): same layout; bg #2B2320; text #F7EBDD; text2 #CDB8A5; heart #F0A67F; next card bg #352B26 border #E8D3BC; D-9 #F0A67F; link + chevron #F0A67F; list card bg #352B26 border/dividers #4A3D36; badge text #CDB8A5 border #A58E7B; tiles unchanged; dark tab bar (§2).
- EN (light): "Mopiru"; mascot alt "Mopi, waving"; names "Dodam ♥ Haru" (a11y "Dodam and Haru"); "Together"; "Day 492" (Gaegu 60/69; a11y "Day 492 together, since Jun 29, 2025"); "Since Jun 29, 2025"; next card "Next up" / "Pepero Day" / "Wed, Nov 11" / "In 9 days" (Gaegu 30/42; a11y "Next up, Pepero Day, Wed, Nov 11, 2026, In 9 days"); "Coming up" / "See all"; rows "Christmas · Fri, Dec 25 · In 53 days", "My birthday · Sun, Mar 14 · In 132 days", "The day we met [Custom] · Mon, May 17 · In 196 days"; tabs Home / Anniversaries / Settings. Same fonts as ko, lh 1.4 (16/22.4, 15/21, 13/18.2, 19/26.6, 17/23.8, 14/19.6).
- JA (light): all text Zen Maru Gothic (bold 700 / 500 / 400), display Yomogi; lh 1.6 (16/25.6, 15/24, 13/20.8, 19/30.4, 17/27.2, 14/22.4); "モピル"; alt "モピ、手を振っています"; "ドダム ♥ ハル" (a11y "ドダムさんとハルさん"); "一緒に過ごして"; "492日目" Yomogi 60/69 (a11y "一緒に492日目、2025年6月29日から"); "2025年6月29日から"; "次の記念日" / "ペペロデー" / "11月11日(水)" / "あと9日" (Yomogi 30/48; a11y "次の記念日, ペペロデー、2026年11月11日(水)、あと9日"); "もうすぐの記念日" / "すべて見る"; rows クリスマス 12月25日(金) あと53日; 私の誕生日 3月14日(日) あと132日; 初めて会った日 [追加] 5月17日(月) あと196日; tabs ホーム / 記念日 / 設定 (system font).

### 3.2 V0-home-today · 오늘 1주년 (축하 카드) — light ko (date 2026-06-29)
1. Header "모피루".
2. Hero WITHOUT mascot: names → "함께한 지" → "D+366" Gaegu **56/64.4** (a11y "함께한 지 366일째, 2025년 6월 29일부터") → "2025년 6월 29일부터" → today chip "오늘 1주년" (`home.today.chip`, title = `anniv.years` n=1).
3. Celebration card (replaces next card): region "오늘은 우리 1주년"; title `home.today.title` "오늘은 우리 {title}" → "오늘은 우리 1주년"; body `home.today.body.milestone` "{date}부터 {n}일째 함께했어요." → "2025년 6월 29일부터 366일째 함께했어요."; close X.
4. Upcoming header + list (2 rows drawn): 하루 생일 · 8월 21일 (금) · D-53 (butter/cake; a11y "하루 생일, 2026년 8월 21일 (금), D-53"); 빼빼로데이 · 11월 11일 (수) · D-135.
5. Tab bar.
- Close → card disappears on this device for this anniversary (rule). Card shows instead of the next card; the next upcoming item moves into the list.
- Dark: card bg #352B26 border #E8D3BC, close icon #CDB8A5; chip #F0A67F/#2B1A12; rest as 3.1 dark.
- EN (drawn DARK): "Day 366" Gaegu 56/64.4; chip "Today: 1-year anniversary"; region/title "Today is our 1-year anniversary" (Gaegu 20/28); body "You've spent 366 days together since Jun 29, 2025." (GD 14/19.6); close a11y "Close the celebration card"; mascot alt "Mopi, cheering"; rows "Haru's birthday · Fri, Aug 21 · In 53 days", "Pepero Day · Wed, Nov 11 · In 135 days".
- JA (light): "366日目" Yomogi 56/64.4; chip "今日は1周年" (Zen Maru, white on primary); title "今日はふたりの1周年" Yomogi 20/32; body "2025年6月29日から一緒に366日目です。" 14/22.4; close a11y "お祝いカードを閉じる"; alt "モピ、はしゃいでいます"; rows ハルの誕生日 8月21日(金) あと53日; ペペロデー 11月11日(水) あと135日.

### 3.3 V0-home-today-season · 오늘 빼빼로데이 — light ko (2026-11-11)
- Hero without mascot, "D+501" 56/64.4, NO chip (season days have no chip in the board).
- Celebration card: region/title `home.today.title.season` "오늘은 {title}" → "오늘은 빼빼로데이"; body `home.today.body.season` "모피가 둘의 오늘을 함께 축하해요."; same cheer mascot + sparkles + close.
- List (2 rows): 크리스마스 · 12월 25일 (금) · D-44; 내 생일 · 3월 14일 (일) · D-123.
- No dark/en/ja variant drawn.

### 3.4 V0-home-late · 이틀 늦게 연 300일 (7일 안 · 늦은 축하) — light ko (2026-04-26)
- Hero without mascot, "D+302" 56/64.4, no chip.
- Celebration card: region/title "오늘은 우리 300일" (`home.today.title`, title = `anniv.days` n=300 — board keeps "오늘은" wording on a late day); body `home.today.late` "{date}이 {title}이었어요. 모피가 조금 늦게 축하해요." → "4월 24일이 300일이었어요. 모피가 조금 늦게 축하해요." ({date} = `date.md`).
- List (2 rows): 처음 만난 날 [직접] · 5월 17일 (일) · D-21 (lav/star; a11y "처음 만난 날, 2026년 5월 17일 (일), D-21"); 1주년 · 6월 29일 (월) · D-64 (pink/medal; a11y "1주년, 2026년 6월 29일 (월), D-64").
- Rule: only day/year milestones, first open within 7 days incl. the day, shown once. No dark/en/ja drawn.

### 3.5 V0-home-pending · 상대 연결 전 (초대 코드가 계속 보임) — light ko
1. Header "모피루".
2. Hero without mascot: names row "도담 ♥ [상대]" — partner shown as dashed pill: `home.pending.partner` "상대", NSKR 700 16/24 text2, border 1.5 dashed L.border, radius 999, padding 0 10; row a11y "도담님과 상대님". "D+492" 56/64.4; since; pending chip "상대를 기다리는 중" (clock).
3. Invite card: padding 14/16, radius ≈20, bg surface, border 2 line; column gap 10:
   - Title `home.pending.title` "상대가 코드를 넣으면 연결돼요" NSKR 700 16/24 text.
   - Code row (role=text, a11y "K7M4Q9XP"): centered, gap 5; 8 boxes 28x38, radius 10, bg surface, border 2 line, char NSKR 700 17 text; between box 4 and 5 an aria-hidden dash 8x2 L.border. (Code `CodeBoxes` is 30x44, 2px L.border, heading font, 4+4 groups gap 12: differs.)
   - Row space-between, gap 8: expiry `invite.expires` "{h}시간 {m}분 뒤에 만료돼요" → "23시간 41분 뒤에 만료돼요" NSKR 500 13/19.5 text2; buttons gap 6: copy 44x44 circle, bg L.surface2, border 1.5 L.border, copy icon 20 stroke L.text (rect 8.5,8.5 11.5x11.5 rx2 + `M15.5 8.5V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v9.5a1 1 0 0 0 1 1h3.5`), a11y `invite.copy` "코드 복사"; share 44x44 circle, bg L.primary, border 1.5 L.line, share icon 20 stroke #FFFFFF (`M12 3.5v11M7.5 8l4.5-4.5L16.5 8M5 13v6a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-6`), a11y `invite.share` "코드 공유하기".
   - Hint `home.pending.hint` "연결되면 상대의 생일과 직접 추가한 기념일도 함께 보여요." GD 13/19.5 text2.
4. Next card (빼빼로데이 D-9). No upcoming header/list in this frame.
5. Tab bar.
- Behaviour: copy/share/expiry-soon/expired/reissue/toast/network error = S04 as-is (V0-01 rule). Partner joins (Realtime or app open) → V0-start-connected once → V0-start-notify → V0-home. Code stays visible on home (PR 26).
- Dark: pill text #CDB8A5 dashed #A58E7B; chip bg #40361A border/ink #F7D98B; invite card bg #352B26 border #E8D3BC; boxes #352B26 / #E8D3BC, chars #F7EBDD; dash #A58E7B; copy btn bg #40342E border #A58E7B icon #F7EBDD; share btn bg #F0A67F border #E8D3BC icon #2B1A12; next card dark.
- No en/ja drawn.

### 3.6 V0-home-partner-edited · 상대가 사귄 날을 바꿈 (알림 띠) — light ko
- Same as 3.1 but list shows 2 rows (크리스마스 D-53, 내 생일 D-132) and hero has mascot + D+492 at 60.
- Overlay toast (role=status): absolute left 20 / right 20 / bottom 96 (13 above tab bar), z above content; row gap 10, padding 12/16, radius ≈18, bg #3F2D22 (L.text), shadow 0 6 18 rgba(0,0,0,.18); info icon 20 stroke #FFF8EC w2.3 (circle r9 + `M12 11v5M12 8h.01`); text `home.partnerEdited` "{name}님이 사귄 날을 {date}로 바꿨어요" → "하루님이 사귄 날을 6월 29일로 바꿨어요" NSKR 700 15/22.5 #FFF8EC (L.surface). Code `Toast`: same colors, pill radius, icon 18, auto-hides after 3 s, no shadow.
- Dismissal/duration, dark/en/ja: not drawn.

### 3.7 V0-state-loading · 불러오는 중 (스켈레톤) — light ko only
- Header "모피루"; body padding 8/20, gap 16.
- Skeleton group: margin-top 40, column centered gap 12: 120x18 r10, 220x64 r14, 170x16 r10 (all L.surface2 #F3E0C4).
- Caption `state.loading` "불러오는 중이에요" NSKR 500 14/21 text2, centered.
- Block 100%x86 r20 (wrapped with margin-top 12), then block 100%x210 r20.
- Tab bar visible (홈 selected). No mascot, no motion specified, no a11y label on board (code `Skeleton` supports one label per region).

### 3.8 V0-state-error · 불러오기 실패 · 전부 아니면 없음 — light ko
- Header "모피루"; body padding 8/20, gap 16; centered column (flex 1, justify center, gap 12, padding 0 12):
  - `mascot_lookup` (ratio 1.010) in 140x140 box, drawn 132.9x131.6 at left 3.5, bottom 5.6; alt `mascot.alt.lookup` "모피, 기다리고 있어요".
  - Title `state.error.title` "화면을 불러오지 못했어요" Gaegu 700 24/36 text.
  - Body `state.error.body` "인터넷 연결을 확인하고 다시 시도해 주세요." GD 15/22.5 text2.
  - Primary button 220 wide, margin-top 6, refresh icon + `common.retry` "다시 시도" (no aria-label → visible text).
- Tab bar visible. Retry = same full request from scratch; widget keeps last good data. Replaces the whole home (no partial content).
- Dark: title #F7EBDD, body #CDB8A5, button bg #F0A67F border #E8D3BC ink/icon #2B1A12, dark tab bar.
- EN (light): "Couldn't load" (Gaegu 24/33.6), "Check your internet connection and try again." (15/21), "Try again", alt "Mopi, waiting".
- JA: not drawn (copy: 読み込めませんでした / インターネット接続を確認して、もう一度お試しください。 / もう一度試す).

### 3.9 V0-state-offline · 오프라인 · 마지막 데이터로 읽기만 — light ko
- Header; body padding 6/20, gap 14.
- Offline banner: "오프라인이에요 · 마지막 확인 오후 9:12" (`state.offline.banner`, {time} = `time.sample` style, locale time) + "연결되면 다시 고칠 수 있어요" (`state.offline.readonly`).
- Hero without mascot (D+492 56/64.4), next card, upcoming header + list (2 rows visible: 크리스마스 D-53, 내 생일 D-132).
- Tab bar. Read-only: any add/edit/delete/date-change control disabled with dashed outline (none on home).
- Dark: banner bg #40361A, border/icon/text #F7D98B; rest dark.
- JA (light): banner "オフライン・最終確認 21:12" / "オンラインになると編集できます" (Zen Maru 14/22.4 and 13/20.8); hero 492日目 Yomogi 56; rest as 3.1 JA.
- EN: not drawn ("Offline · Last updated 9:12 PM" / "You can edit again once you are online").

### 3.10 V0-state-offline-empty · 오프라인 · 저장된 데이터 없음 — light ko only
- Header; centered column (as error): `mascot_lie` (ratio 1.798) in 150x150 box, drawn 180x100.1 at left −15, bottom 6; alt "모피, 기다리고 있어요" (same text as `mascot.alt.lookup`; no dedicated key).
- Title `state.offline.empty.title` "아직 불러온 내용이 없어요" Gaegu 700 **22/33**; body `state.offline.empty.body` "인터넷에 연결하면 바로 보여 드릴게요." GD 15/22.5 text2.
- SECONDARY button 220 wide: surface face, border 2 #8A6B55, ink text, refresh icon, "다시 시도".
- Tab bar visible.

### 3.11 V0-state-ended · 상대가 연결을 끊음 — light ko only
- No header text (47 blank), NO tab bar.
- Centered column: `mascot_sleep` (ratio 1.806) in 160x160 box, drawn 192x106.3 at left −16, bottom 6.4, decorative (alt="", aria-hidden).
- Title `end.byPartnerDisconnect` "{name}님이 연결을 끊었어요" → "하루님이 연결을 끊었어요" Gaegu 700 24/36 text.
- Body `state.ended.body` "두 사람의 공간이 끝났어요. 날짜와 기념일은 더 이상 볼 수 없어요." GD 15/22.5 text2.
- Footer (padding 12/20/42, gap 6): full-width primary button `state.ended.cta` "새로 시작하기" (no icon).
- Tap → V0-start-choose; on showing, clear this device's scheduled notifications and widget data. Shown on next open, or immediately on Realtime hint. No back.
- Code `EndedScreen`: Spot "waiting", title variant `title` (28) with the same `end.byPartnerDisconnect`/`end.byPartnerDeleted` keys (passes {name}), but body `end.done.body` and button `end.newSpace`/`common.confirm` differ from the board's `state.ended.body`/`state.ended.cta`; its doc comment says partner names are never shown, while the board shows the name.

### 3.12 V0-state-ended-deleted · 상대가 계정을 삭제함 — light ko only
- Identical to 3.11, title `end.byPartnerDeleted` "상대가 계정을 삭제했어요" (no name).

### Frame inventory (all drawn frames)
| board | light ko | dark ko | en | ja |
|---|---|---|---|---|
| V0-02 | home, home-today, home-today-season, home-late, home-pending, home-partner-edited | home, home-today, home-pending | home (light), home-today (DARK) | home (light), home-today (light) |
| V0-03 | state-loading, state-error, state-offline, state-offline-empty, state-ended, state-ended-deleted | state-error, state-offline | state-error (light) | state-offline (light) |

## 4. References to older screens (what the V0 boards say)
- **S06 메인 D-day**: V0-home is "S06 메인 D-day의 V0 변형"; S06 cover photo, "우리 방" card/button and room tab are hidden in V0; date-counting rules are "기존 S06 · 스펙 규칙 그대로". Existing `HomeScreen.tsx` is S06 (cover picker, room card, open-room and edit-date buttons, edit-date sheet): all of those leave the V0 home.
- **S16 공통 오류·빈·로딩·오프라인**: V0-03 adapts S16 to the V0 home; 로그인 만료 · 앱 업데이트 필요 · 권한 없음 stay exactly as S16.
- **S28 마일스톤 축하**: celebration card is "S28 단순화"; the 7-day late rule is "S28 규칙"; S28's "기념 방 꾸미기 제안" button is dropped (code: remove `milestone.action.suggest`, `PresetEntry`, `MilestoneBubble` preset path from home). Copy keys renamed: `milestone.body.today` → `home.today.body.season`, `milestone.body.late` → `home.today.late`, `a11y.milestone.close` → `home.today.close`.
- **S29 공통 모션**: only moving source; V0 celebration card hop/twinkle (`cpl-hop`, `cpl-twinkle` per V0-01) are drawn in the reduced-motion still pose.
- **S20 접근성**: text up to 200% (content scrolls, bottom buttons stay pinned); iOS system tab bar keeps its size; must set the unselected tint (system gray 2.8–3.3:1 fails); D-day read with a language template.
- **S22 컴포넌트**: component sheet (buttons, chips, banners incl. offline, lists, system tab bar iOS/Android); no V0-specific statement about it on these two boards.
- **S19 토큰**: safe areas 47/34, contrast tokens (via V0-00).
- **S04 / S05** (via V0-01): invite expiry-soon / expired / reissue / share sheet / copy toast / network error = S04 as-is; code-entry errors = S05.
- **S14**: disconnect = S14 space-end result (V0-00).
- **PR 26** (V0-01): "만든 초대 코드는 홈에서도 계속 보여요(PR 26)" → V0-home-pending invite card. Repo commit 1f29362 "Keep newly created invite visible after snapshot refresh (#26)".
- **PR 24** (V0-01): shared "<" back control, 48pt (not used on these home/state frames).
- S06, S16, S28, S29 boards are listed in `canvas.json` but their HTML is not in the local export, so their own content could not be read.

## 5. Facts NOT determinable from the boards
- Next-card and list-row tap destinations (no href; V0-00 flow implies V0-anniv-detail-*): verify against board V0-home.
- Pull-to-refresh on home/states: not drawn or written (current code has RefreshControl). Verify against board V0-home.
- Scrolling: frames are overflow-hidden; real scroll container and 200% layout not drawn for these frames (S20 rule only).
- Upcoming row count: rule says 3; V0-home-today, -season, -late, -partner-edited, -offline show 2. Whether 2 is a data/space artifact or a rule: verify against board V0-home-today.
- V0-home-pending shows no upcoming section: verify against board V0-home-pending.
- Hero mascot / D+N 60 vs 56 rule is inferred from frames (mascot only when no chip/card/banner).
- Celebration for birthday (`home.today.title.birthday` exists) and custom days: no frame; body copy for birthday/custom unspecified. Chip for season/late/birthday: not drawn (only milestone-day chip).
- Day-milestone (e.g. 100일) tile color/icon; partner-birthday vs my-birthday icon differences; any other season icon: verify against board V0-04-anniv.
- Toast (partner-edited) duration, dismissal, stacking with celebration card, dark/en/ja look: verify against board V0-home-partner-edited.
- Loading: dark/en/ja, a11y label, shimmer/motion: verify against board V0-state-loading.
- Offline-empty, ended, ended-deleted dark/en/ja; high-contrast variants of every frame: not drawn.
- Invite expired / expiring state on the home pending card: deferred to S04 (not drawn on home).
- Whether the tab bar uses SF Symbols or the board's custom line icons: verify against board V0-home.
- Date format without weekday ("2025년 6월 29일", "Jun 29, 2025", "2025年6月29日") used in since-line and milestone body has no key in copy tables (`date.long` includes weekday).
- Offline-empty mascot alt has no dedicated key (reuses "기다리고 있어요" text on the lie pose).
- Font weights not bundled: Noto Sans KR 500, Zen Maru Gothic 400/500, Yomogi 700 (only Yomogi 400). Decide fallback.
- Toast shadow contradicts tokens.elevation "none".
- Mascot pose ids are inferred by image aspect-ratio match to `design/mascot/harmonized/*` (wave_main 1.135, cheer 1.106, lookup 1.010, lie 1.799, sleep 1.807); board names images only by blob hash.
- App-name header role (heading or not): not specified on board.
