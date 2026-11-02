# V0-04 기념일 목록 · 상세 — design extract
Verified 2026-11-02: 120 claims checked, 3 corrected.

Source: board `V0-04-anniv.dc.html` (page "V0 · 기념일", artifact M2WFQCFnVzoWbHNhJPCz5X ver 1793598115-fafc). Read from slim copy + full local copy (`artifact/project/V0-04-anniv.dc.html`, only for SVG path data). Copy keys from `copy-v0-anniv`, `copy-v0-common`, plus `copy-v0-edit` / `copy-v0-settings` where noted.
Token names = `tokens.color.app.<light|dark>.normal.*` unless prefixed (`palette.*` = `tokens.color.illustration.palette.*`).

## 1. Board header facts

- Eyebrow: `AROOM · V0 · D+DAY · 기념일`. H1: `V0-04 기념일 목록 · 상세`. Board preview 1760×4836.
- Description (verbatim): "50·100·150·200·300일, 매년 주년, 두 사람의 생일, 빼빼로데이(11/11), 크리스마스(12/25), 그리고 둘이 직접 추가한 기념일이 한 목록에 날짜순으로 있어요."
- Section 1 "iOS · 밝은 앱 · 한국어", note (verbatim): "오늘 = 2026년 11월 2일. 다가오는 기념일: 빼빼로데이 D-9 · 크리스마스 D-53 · 도담 생일 D-132 · 처음 만난 날 D-196 · 2주년 D-239 · 하루 생일 D-292."
  - Viewer = 도담 (rows say "내 생일"); partner = 하루. Implied start date (사귄 날) = 2025-06-29 (1주년 2026-06-29, 200일 2026-01-14, 300일 2026-04-24 all consistent with the N−1 rule).
- Section 2 "어두운 앱 · 영어 · 일본어" (no note text).
- Section 3 "규칙" — three cards, quoted verbatim:

**목록 규칙**
- "한 목록에 날짜순으로 섞어요: 다가오는 기념일(오늘 포함) 위, 지난 기념일은 접어 두고 최근 것부터."
- "필터는 "전체 / 직접 추가" 두 개만. 종류는 그림(하트·리본·케이크·빼빼로·트리·별)과 "직접" 표시로 구분해요(색만으로 구분하지 않음)."
- "다가오는 기념일은 오늘부터 1년 뒤까지, 지난 기념일은 1년 전까지 보여요. 일수 기념일은 한 번뿐이라 지나면 지난 기념일에만 남아요."
- "오른쪽 D-n은 14일 안이면 강조색, 오늘이면 채운 알약 "오늘"."

**누가 무엇을 바꾸나**
- "자동 기념일(일수·주년·시즌)은 고치거나 지울 수 없어요. 알림만 설정에서 종류별로 꺼요."
- "생일은 본인만 고쳐요. 상대 생일은 두 사람 모두 넣은 뒤에 서로 보여요. 그 전에는 내 목록에 "하루님이 생일을 넣으면 함께 보여요" 자리 행이 있어요."
- "직접 추가한 기념일은 두 사람 모두 만들고 고치고 지울 수 있어요. 상세에 누가 만들었는지와 마지막 수정일을 보여요."

**날짜 계산 (기존 S06·스펙 규칙)** (card styled infoBg #E1EDF5 / info #2D5E86 border = "existing rule")
- "사귄 날 당일 = 1일째 = D+1. N일 기념일 = 사귄 날 + (N − 1)일."
- "주년은 365일 단위가 아니라 사귄 날과 같은 달력 날짜(매년). 그래서 1주년은 366일째(윤년이 끼면 367일째)로 보여요."
- "2월 29일에 사귀기 시작했거나 태어났다면 평년에는 2월 28일로 봐요."
- "생일·시즌·직접 추가(매년)는 양력 같은 월·일, "한 번만"은 그 날짜 하루."
- "모든 계산은 공간 시간대(서울)의 자정 기준, 달력 날짜 차 + 1이에요(초를 86400으로 나누지 않음)."

Derived (from frames, not stated as rules):
- Kinds on board: 일수 (50·100·150·200·300일, one-time), 주년 (yearly), 생일 ×2, 시즌 (빼빼로데이 11/11, 크리스마스 12/25), 직접 추가.
- Sort: upcoming ascending by date; past descending (most recent first: 73일 전 → 126 → 169 → 192 → 233 → 292).
- Past count in show-past button: 10 (default list), 9 (today, bwait); only 6 rows visible in the expanded frame. Board items in the 1-year window from 2026-11-02 count 9 (8/21 하루 생일, 6/29 1주년, 5/17, 4/24 300일, 3/14, 1/14 200일, 12/25, 11/25 150일, 11/11), not 10 — counting rule: verify against board V0-anniv-list-past.
- Right column: upcoming `D-n` (≤14 days → primary color, else text), today → filled pill "오늘", past `n일 전` in text2.

## 2. Global frame facts

### Device / chrome
| Item | Value |
|---|---|
| Frame | 390×844, radius 44, bg `#FBF1E3` (light.bg); board ring `0 0 0 6px #E3CDB0` (board chrome only) |
| Dynamic island | 124×36, top 11, radius 18, #000 (device chrome) |
| Home indicator | 134×5, bottom 8, radius 3, color = text (`#3F2D22` light / `#F7EBDD` dark), opacity .85 |
| Default font | `'Gowun Dodum','Noto Sans KR'` (ko/en); ja frame `'Zen Maru Gothic','Noto Sans JP'` |
| Tab-root header (list) | padding `55 16 4 20`, min-h 48, flex row, align flex-end, space-between, gap 8 |
| Pushed-screen nav (detail) | padding `51 8 4`, min-h 48, gap 4; left 48 slot (back), center title (empty on all details), right 48 slot |
| Content (list) | flex 1, overflow hidden, padding `10 20 0`, column gap 14 between sections |
| Content (detail) | padding `8 20 0`, column gap 14 |
| Bottom spacer | 91px (tab bar 83 + 8) on every tab-bar frame |

### Tab bar (system UITabBar look)
- Absolute bottom, height 83, padding-top 7; bg `rgba(249,249,249,.94)` light / `rgba(30,26,24,.94)` dark; top border 0.5px `rgba(60,60,67,.29)` light / `rgba(84,84,88,.6)` dark. No token (tokens.systemTabBar: system-owned; selected tint = primary, unselected = text2).
- 3 tabs, each column gap 2: icon 25×25; label `500 10px/12px -apple-system,'SF Pro Text'` (selected 600).
- Unselected: stroke 2, color text2 (`#6B5444` / dark `#CDB8A5`). Selected (기념일): stroke 2.2, primary (`#B24A24` / dark `#F0A67F`).
- Labels: 홈/기념일/설정 (`tab.home`, `tab.anniv`, `tab.settings`); en Home/Anniversaries/Settings; ja ホーム/記念日/設定.
- a11y: tablist `aria-label="탭 막대"` (`a11y.tabbar`); tab labels "홈 탭, 3개 중 1번째", "기념일 탭, 3개 중 2번째, 선택됨", "설정 탭, 3개 중 3번째" (`a11y.tab` + `a11y.tab.sel`).
- Tab icons (24 grid): home `M4 11l8-7 8 7v9a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z`; anniv = `rect x3.5 y5 w17 h15.5 rx2.5` + `M3.5 9.5h17M8 3v4M16 3v4` + heart `M12 18s-3-1.9-3-3.8a1.5 1.5 0 0 1 3-.6 1.5 1.5 0 0 1 3 .6c0 1.9-3 3.8-3 3.8z`; settings = `circle 12,12 r3.2` + rays `M12 2.8v2.6M12 18.6v2.6M4.6 5.6l1.9 1.9M17.5 16.5l1.9 1.9M2.8 12h2.6M18.6 12h2.6M4.6 18.4l1.9-1.9M17.5 7.5l1.9-1.9`. App `Icon.tsx` has none of these three as-is (`calendarHeart` = heart only, no calendar frame).

### Type styles used (ko; en lh ×1.4, ja lh ×1.6, see §3.13)
| Role | Family | size/lh weight | Color |
|---|---|---|---|
| Tab-root title "기념일" | Gaegu (display) | 30/45 700, pb 2 | text |
| Detail hero title | Gaegu | 26/39 700 | text |
| Detail D-number | Gaegu | 44/50.6 700 | primary (always, even D-239) |
| Empty-state title | Gaegu | 22/33 700 | text |
| Nav title slot | Noto Sans KR | 17/25.5 700 | text (empty on board) |
| Section header | Noto Sans KR | 14/21 700, padding `2 4 0` | text2 |
| Row title | Noto Sans KR | 16/24 700, nowrap + ellipsis | text |
| Row date | Gowun Dodum | 13/19.5 400 | text2 |
| Row right (D-n etc.) | Noto Sans KR | 15/22.5 700, nowrap | see D-pill below |
| "직접" badge | Noto Sans KR | 11/16 700 | text2 |
| Segment label | Noto Sans KR | 15 (no lh) 700 sel / 500 unsel | text / text2 |
| Info label (계산/알림/반복/메모) | Noto Sans KR | 13/19.5 700 | text2 |
| Info value | Gowun Dodum | 16/24 400, `white-space:pre-line` | text |
| Footnote | Gowun Dodum | 13/19.5 400, padding `0 6` | text2 |
| Button label | Noto Sans KR | 16/24 700 | per button |
| Text button (접기/편집) | Noto Sans KR | 16 700 | primary |
| Placeholder row text | Noto Sans KR | 15/22.5 500 | text2 |
| Empty body | Gowun Dodum | 15/22.5 400 | text2 |
All ko text `word-break:keep-all` (→ `WORD_BREAK` in components.tsx); en/ja frames drop keep-all.
Note: app `typeStyle` maps ja body → NotoSansJP, board uses Zen Maru Gothic for ja body; board uses Noto Sans KR weight 500 (unselected segment, placeholder) — app registers only `NotoSansKR` (400) and `NotoSansKRBold` (700), no 500.

### Radii / borders
- Cards: hand-drawn jitter `18.8 21.6 22.0 18.8 / 21.2 20.0 20.0 22.4` ≈ `radius.card` 20 (+cornerJitter); border 2 `divider`; bg `surface`; overflow hidden.
- Kind tile 40: jitter `12.0 13.8 14.1 12.0 / 13.6 12.8 12.8 14.3` (≈13); hero tile 64: `19.3 22.1 22.5 19.3 / 21.7 20.5 20.5 22.9` (≈21). Border 1.5 `#4A3426` in BOTH modes.
- Secondary/outline buttons: `26.9 22.6 25.9 26.4 / 22.6 25.4 24.0 24.0` (~pill for 48 high); empty CTA (52 high) `29.1 24.4 28.1 28.6 / 24.4 27.6 26.0 26.0`.
- Segmented: group radius 13, segment radius 10. Badge/pill/add button: 999.
- Row divider: 1px, `margin-left:66px` (=14 pad + 40 tile + 12 gap), color `divider`. Same 66px inset is also used between detail info rows (which have no icon) — reproduce or verify against board V0-anniv-detail-years.

### List row anatomy (`<button>`, full width)
- min-h 64, padding `6 14`, gap 12, align center, bg transparent (today row bg `surface2` #F3E0C4).
- Kind tile 40×40 (aria-hidden) → icon 22, stroke `#4A3426` width 2, round caps/joins.
- Middle: column; line 1 = title (+ badge), line 2 = date (`date.short`, e.g. "11월 11일 (수)").
- "직접" badge (`anniv.badge.custom`; en "Custom", ja "追加"): inline after title, border 1.2 `border` (#8A6B55 / dark #A58E7B), radius 999, padding `0 6`, margin-left 6, text2. Shown only on 직접 추가 rows in 전체 filter; not shown in 직접 추가 filter.
- Right (flex none): plain text, or today pill: bg primary, radius 999, padding `2 10`, text onPrimary #FFFFFF "오늘".
- D colors: ≤14 days `primary` (#B24A24; dark #F0A67F); >14 `text` (#3F2D22; dark #F7EBDD); past `text2` (#6B5444).
- a11y label per row = `anniv.row.a11y` "{title}, {date}, {left}" with `date.long`: e.g. "빼빼로데이, 2026년 11월 11일 (수), D-9", "하루 생일, 2026년 8월 21일 (금), 73일 전"; en "Pepero Day, Wed, Nov 11, 2026, In 9 days"; ja "ペペロデー、2026年11月11日(水)、あと9日". Badge not in a11y label.

### Kind icons (stroke `#4A3426` w2, viewBox 24, both modes)
| Kind (rule word) | Tile bg → token | SVG |
|---|---|---|
| 일수 N일 (하트) | #F4B79B palette.peach | `M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z` |
| 주년 (리본) | #F2A7B4 palette.pink | `circle 12,9 r5` + `M9 13.2L7 21l5-2.6 5 2.6-2-7.8` |
| 생일 (케이크) | #F7D98B palette.butter | `M4 20.5h16M5.5 20.5v-7h13v7M5.5 15.8c2 1.2 3.4 1.2 4.6 0s3.6-1.2 4.8 0 2.6 1.2 3.6 0M12 13.5V10M12 7.5c.9-.9.9-1.9 0-3-.9 1.1-.9 2.1 0 3z` |
| 빼빼로데이 (빼빼로) | #AACBE2 palette.sky | `M6.5 21L14 4M11 21l7.5-17` + second path `M10.6 13.2L14 5.5M15.1 13.2l3.4-7.7` stroke-width 4 |
| 크리스마스 (트리) | #A8C6A0 palette.sage | `M12 3l5 6h-3l4 5h-3l4 5H5l4-5H6l4-5H7zM12 19v2.5` |
| 직접 추가 (별) | #C9B8E8 palette.lav | `M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8L3.5 9.7l5.9-.9z` |
None exist in app `Icon.tsx` (its `heart` path differs). Kind→icon pairing is from tile color + rule word order; icon shapes confirm it.

### Other icons
- Add (+): `M12 5v14M5 12h14`; chevron-down (show past): `M6 9l6 6 6-6`; back: `M15 5l-7 7 7 7` (= app `back`); bell: `M6 16v-5a6 6 0 0 1 12 0v5l1.5 2h-15z` + `M10 20.5a2 2 0 0 0 4 0`; trash: `M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6`.

### Controls
- Add button (header right, in a `gap:4` row): 48×48 circle, bg primary, border 2 `line`, plus icon 24 stroke 2.2 onPrimary. a11y "기념일 추가" (`anniv.add`). Dark: bg #F0A67F, border #E8D3BC (dark.line), icon #2B1A12 (dark.onPrimary).
- Segmented filter (`role="group"`, segments `aria-pressed`): wrapper padding `10 20 2`; group bg surface2, radius 13, padding 3, gap 3; segments flex 1, min-h 42, radius 10. Selected: border 1.5 `line`, bg surface, 700 text. Unselected: no border, transparent, 500 text2. Labels `anniv.filter.all` 전체 / `anniv.filter.custom` 직접 추가. Not the app `Chip` component.
- Outline button ("지난 기념일 N개 보기", "알림 설정 열기"): full width, min-h 48, padding `8 20`, gap 8, bg surface, border 2 `border` (#8A6B55 — app `Button secondary` uses `line` and min-h 52: mismatch), icon 20 stroke 2.1 text, label 16/24 700 text.
- Primary CTA (empty state): width 220 (wrapper margin-top 4), min-h 52, bg primary, border 2 line, plus icon 20 white stroke 2.1, label white.
- Text button (접기, 편집): min 48×48, padding `0 12`, transparent, 16 700 primary.
- Danger text button (삭제): min-h 48, transparent, no border, danger #A3341C (dark #FF9A82), trash icon 20.

### Hex → token
| Hex | Token | Use |
|---|---|---|
| #FBF1E3 | light.bg | screen bg |
| #FFF8EC | light.surface | cards, selected segment, outline buttons |
| #F3E0C4 | light.surface2 | segmented track, today row bg |
| #3F2D22 | light.text | text |
| #6B5444 | light.text2 | secondary text, unselected tabs |
| #B24A24 | light.primary | accent, add btn, pill, D≤14 |
| #FFFFFF | light.onPrimary | |
| #4A3426 | light.line / illustration.outline | add-btn border, selected segment border, tile borders & kind icons |
| #8A6B55 | light.border | badge border, outline buttons, dashed placeholder |
| #E3CDB0 | light.divider | card border, row dividers |
| #A3341C | light.danger | delete |
| #F4B79B #F2A7B4 #F7D98B #AACBE2 #A8C6A0 #C9B8E8 | palette peach/pink/butter/sky/sage/lav | kind tiles |
| #2B2320 #352B26 #40342E #F7EBDD #CDB8A5 #F0A67F #2B1A12 #E8D3BC #A58E7B #4A3D36 #FF9A82 | dark.bg/surface/surface2/text/text2/primary/onPrimary/line/border/divider/danger | dark frames |
| #000, rgba tab-bar values | none (device/system chrome) | |
| #F6ECDD, #E1EDF5/#2D5E86 | none / light.infoBg/info | board canvas only |

## 3. Screens

### 3.1 V0-anniv-list · 목록 · 다가오는 기념일 (light ko, today 2026-11-02)
1. Header: title "기념일" (`tab.anniv`), right add button.
2. Segmented: 전체 (selected) | 직접 추가.
3. Section header "다가오는 기념일" (`anniv.section.upcoming`); gap 8 to card.
4. Card rows (dividers between):
| Title (key) | Badge | Date | Right | Right color | Tile |
|---|---|---|---|---|---|
| 빼빼로데이 (`anniv.pepero`) | – | 11월 11일 (수) | D-9 | primary | sky/빼빼로 |
| 크리스마스 (`anniv.christmas`) | – | 12월 25일 (금) | D-53 | text | sage/트리 |
| 내 생일 (`anniv.birthday.me`) | – | 3월 14일 (일) | D-132 | text | butter/케이크 |
| 처음 만난 날 (user data) | 직접 | 5월 17일 (월) | D-196 | text | lav/별 |
| 2주년 (`anniv.years` n=2) | – | 6월 29일 (화) | D-239 | text | pink/리본 |
| 하루 생일 (`anniv.birthday` name=하루) | – | 8월 21일 (토) | D-292 | text | butter/케이크 |
5. Gap 14, outline button: chevron-down + "지난 기념일 10개 보기" (`anniv.past.show` n=10). Tap → expands (3.2).
6. Tab bar, 기념일 selected.
Right text key: `dday.left` "D-{n}" (`dday.left.one` for 1 day: ko "D-1", en "Tomorrow", ja "明日").

### 3.2 V0-anniv-list-past · 지난 기념일 펼침
- Same header + segmented (전체).
- "다가오는 기념일" card shows only 빼빼로데이 D-9 (primary) and 크리스마스 D-53 in this frame (rest of upcoming not drawn — verify against board V0-anniv-list-past whether it's scroll position).
- Past section header row: flex space-between, align center: left "지난 기념일" (`anniv.section.past`, section-header style) + right text button "지난 기념일 접기" (`anniv.past.hide`, primary). No show-button in this state.
- Past card (most recent first), right text = `dday.ago` in text2:
| Title | Badge | Date | Right | Tile |
|---|---|---|---|---|
| 하루 생일 | – | 8월 21일 (금) | 73일 전 | butter |
| 1주년 | – | 6월 29일 (월) | 126일 전 | pink |
| 처음 만난 날 | 직접 | 5월 17일 (일) | 169일 전 | lav |
| 300일 (`anniv.days`) | – | 4월 24일 (금) | 192일 전 | peach/하트 |
| 내 생일 | – | 3월 14일 (토) | 233일 전 | butter |
| 200일 | – | 1월 14일 (수) | 292일 전 | peach |
- a11y e.g. "300일, 2026년 4월 24일 (금), 192일 전". Past rows are still tappable buttons.

### 3.3 V0-anniv-list-today · 오늘이 기념일 (11월 11일)
- Section "오늘" (`anniv.section.today`) above "다가오는 기념일".
- Today card: 빼빼로데이 row, row bg surface2 #F3E0C4, date "11월 11일 (수)", right = filled pill "오늘" (`dday.today`; bg primary, padding 2 10, radius 999, white 15/22.5 700). a11y "빼빼로데이, 2026년 11월 11일 (수), 오늘".
- Upcoming: 크리스마스 D-44 · 내 생일 D-123 · 처음 만난 날(직접) D-187 · 2주년 D-230 (all text color). 하루 생일 not drawn.
- Button "지난 기념일 9개 보기".

### 3.4 V0-anniv-list-custom · 필터 · 직접 추가
- Segmented: 직접 추가 selected (border 1.5 line, surface bg, 700), 전체 unselected.
- "다가오는 기념일": one row 처음 만난 날 · 5월 17일 (월) · D-196, NO "직접" badge.
- "지난 기념일" header (no 접기 button) + card shown directly (not collapsed): 처음 만난 날 · 5월 17일 (일) · 169일 전 (text2), no badge.
- No show-past button in this frame.

### 3.5 V0-anniv-list-empty · 직접 추가가 아직 없음 (filter = 직접 추가)
- Segmented 직접 추가 selected.
- Centered empty block (flex 1, column, center, gap 12, text-center, padding `0 16`):
  1. Mascot box 140×140; img 132.9×131.6 at left 3.5 / bottom 5.6, alt "모피, 기다리고 있어요" (`mascot.alt.lookup`; pose `mascot_lookup`). Board asset `/_blob/5615ca8fb23b403b9f8a721cc834fee8`.
  2. Title "둘만의 기념일을 추가해 보세요" (`anniv.empty.title`, Gaegu 22/33 700).
  3. Body "처음 만난 날, 첫 여행처럼 둘에게 특별한 날을 남겨요. 상대에게도 함께 보여요." (`anniv.empty.body`).
  4. Primary CTA w220 "기념일 추가" with + icon (`anniv.add`) → add/edit screen (V0-05).
- Tab bar present.

### 3.6 V0-anniv-list-bwait · 상대가 생일을 아직 안 넣음
- Same as 3.1 but 하루 생일 row is absent; a placeholder row sits right after "내 생일" (before 처음 만난 날):
  - Non-interactive `div` (not a button, no aria-label), min-h 64, padding `6 14`, gap 12.
  - Tile 40, no fill, border 1.5 DASHED `border` #8A6B55, jitter `12.2 14.0 14.3 12.2 / 13.8 13.0 13.0 14.6`; cake icon 22 stroke text2 #6B5444.
  - Text "하루님이 생일을 넣으면 함께 보여요" (`anniv.birthday.wait` name=하루), Noto 15/22.5 500 text2.
- Upcoming rows: 빼빼로데이 D-9 (primary) · 크리스마스 D-53 · 내 생일 D-132 · [placeholder] · 처음 만난 날(직접) D-196 · 2주년 D-239.
- Button "지난 기념일 9개 보기".

### 3.7 Detail common layout (years / season / birthday)
1. Nav: back 48 (icon 26, stroke 2.2, text color, a11y "뒤로" `common.back`), empty title, right 48 empty spacer.
2. Hero (column, center, gap 6, margin-top 4): tile 64 (kind color, border 1.5 #4A3426) with icon 35; title 26/39 Gaegu; date `date.long` 15/22.5 text2; D-number 44/50.6 Gaegu primary.
3. Info card (surface, border 2 divider): rows padding `12 16`, gap 2 (label over value); divider 1px ml 66.
4. Footnote 13/19.5 text2, padding `0 6`.
5. Outline button: bell icon + "알림 설정 열기" (`anniv.detail.openSettings`) → settings notification screen (V0-set-notify per V0-00 flow; target not drawn here).
6. Tab bar, 기념일 tab selected (detail is pushed inside the anniversary tab).

### 3.8 V0-anniv-detail-years · 상세 · 2주년 (자동)
- Hero: pink tile/리본, "2주년", "2027년 6월 29일 (화)", "D-239".
- 계산 (`anniv.detail.rule`): "매년 사귄 날과 같은 날짜 (6월 29일)\n사귄 날로 자동 계산돼요" = `anniv.rule.years` (md=`date.md`) + newline + `anniv.detail.auto`.
- 알림 (`anniv.detail.notify`): "기본 설정 (오전 9:00 · 하루 전)" = `anniv.notify.default` with time=`set.notify.time.value` "오전 9:00", early=`set.notify.early.1d` "하루 전".
- Footnote: "자동으로 들어가는 기념일은 고치거나 지울 수 없어요. 종류별 알림은 설정에서 바꿔요." (`anniv.detail.system.note`).
- Button "알림 설정 열기". No edit/delete.

### 3.9 V0-anniv-detail-season · 상세 · 빼빼로데이 (자동)
- Hero: sky tile/빼빼로, "빼빼로데이", "2026년 11월 11일 (수)", "D-9".
- 계산: "매년 11월 11일\n매년 자동으로 들어가는 기념일이에요" = `anniv.rule.fixed` + `anniv.detail.auto.fixed`.
- 알림: "기본 설정 (오전 9:00 · 하루 전)". Footnote = `anniv.detail.system.note`. Button "알림 설정 열기".

### 3.10 V0-anniv-detail-birthday · 상세 · 하루 생일 (partner's)
- Hero: butter tile/케이크, "하루 생일", "2027년 8월 21일 (토)", "D-292".
- 계산: "매년 8월 21일 · 양력" (`anniv.rule.birthday`, single line, no auto line).
- 알림: "기본 설정 (오전 9:00 · 하루 전)".
- Footnote: "생일은 본인만 고칠 수 있어요." (`anniv.detail.birthday.note`).
- Button "알림 설정 열기". No edit button (right nav slot empty).

### 3.11 V0-anniv-detail-custom · 상세 · 직접 추가 (상대가 만듦)
- Nav right: text button "편집" (`common.edit`, primary) → V0-05 edit screen.
- Hero: lav tile/별, "처음 만난 날", "2027년 5월 17일 (월)", "D-196".
- Info card rows: 반복 (`anniv.detail.repeat`) "매년" (`anniv.repeat.yearly`; alt `anniv.repeat.once` 한 번만) / 메모 (`anniv.detail.memo`) "홍대 앞 작은 카페, 비 오던 날" (user data) / 알림 "기본 설정 (오전 9:00 · 하루 전)". No 계산 row.
- Footnote: "하루님이 추가했어요 · 10월 30일 수정" (`anniv.detail.by` name=하루, date=`date.md`; self-created → `anniv.detail.byMe` "내가 추가했어요 · {date} 수정").
- NO "알림 설정 열기" button, NO tab bar. Pinned footer (flex none, padding `12 20 42`, gap 6): danger text button trash icon + "이 기념일 삭제" (`edit.delete` from copy-v0-edit). Deletion needs confirmation per V0-00 flow (dialog not on this board).

### 3.12 Dark (iOS · 어두운 앱 · 한국어): V0-anniv-list, V0-anniv-detail-custom
Same layout/content as 3.1 and 3.11. Exact color changes:
| Element | Light | Dark |
|---|---|---|
| Screen bg | #FBF1E3 | #2B2320 (dark.bg); board ring #4A3D36 |
| Title/row title/info value | #3F2D22 | #F7EBDD (dark.text) |
| Section header, date, info label, footnote, badge text, unselected segment | #6B5444 | #CDB8A5 (dark.text2) |
| Add button bg / border / icon | #B24A24 / #4A3426 / #FFFFFF | #F0A67F / #E8D3BC / #2B1A12 |
| Segmented track | #F3E0C4 | #40342E (dark.surface2) |
| Selected segment bg / border | #FFF8EC / #4A3426 | #352B26 / #E8D3BC |
| Card bg / border / row divider | #FFF8EC / #E3CDB0 / #E3CDB0 | #352B26 / #4A3D36 / #4A3D36 |
| D≤14 accent, D-number, 편집 | #B24A24 | #F0A67F |
| D>14 right text | #3F2D22 | #F7EBDD |
| Badge border | #8A6B55 | #A58E7B (dark.border) |
| Show-past button bg / border / text+icon | #FFF8EC / #8A6B55 / #3F2D22 | #352B26 / #A58E7B / #F7EBDD |
| Back icon | #3F2D22 | #F7EBDD |
| Delete text+icon | #A3341C | #FF9A82 (dark.danger) |
| Tab bar bg / top border | rgba(249,249,249,.94) / rgba(60,60,67,.29) | rgba(30,26,24,.94) / rgba(84,84,88,.6) |
| Tab unselected / selected | #6B5444 / #B24A24 | #CDB8A5 / #F0A67F |
| Home indicator | #3F2D22 | #F7EBDD |
| Kind tiles + icons + 1.5 border | pastel + #4A3426 | unchanged (pastel + #4A3426) |
Dark today-pill, placeholder, empty state, past-expanded: not drawn — verify against board.

### 3.13 English (V0-anniv-list · English, light) and Japanese (V0-anniv-list · 日本語, light)
| Item | ko | en | ja |
|---|---|---|---|
| Title | 기념일 | Anniversaries (Gaegu 30/42) | 記念日 (Yomogi 30/48) |
| Add a11y | 기념일 추가 | Add anniversary | 記念日を追加 |
| Filters | 전체 / 직접 추가 | All / Custom | すべて / 追加した記念日 |
| Section | 다가오는 기념일 | Upcoming | これからの記念日 |
| Titles | 빼빼로데이, 크리스마스, 내 생일, 처음 만난 날, 2주년, 하루 생일 | Pepero Day, Christmas, My birthday, The day we met, 2-year anniversary, Haru's birthday | ペペロデー, クリスマス, 私の誕生日, 初めて会った日, 2周年, ハルの誕生日 |
| Badge | 직접 | Custom | 追加 |
| Date | 11월 11일 (수) | Wed, Nov 11 | 11月11日(水) |
| Right | D-9 | In 9 days | あと9日 |
| Show past | 지난 기념일 10개 보기 | Show 10 past | 過ぎた記念日を10件見る |
| Tabs | 홈/기념일/설정 | Home/Anniversaries/Settings | ホーム/記念日/設定 |
| Tab a11y | 기념일 탭, 3개 중 2번째, 선택됨 | Anniversaries tab, 2 of 3, selected | 記念日タブ、3件中2件目、選択中 |
| Tablist a11y | 탭 막대 | Tab bar | タブバー |
- en metrics: same sizes, line-height ×1.4 (title row 16/22.4, date 13/18.2, right 15/21, section 14/19.6); families unchanged (Noto Sans KR / Gowun Dodum); no keep-all.
- ja metrics: all text `'Zen Maru Gothic','Noto Sans JP'` (incl. segments, badge), line-height ×1.6 (16/25.6, 13/20.8, 15/24, 14/22.4), `line-break:strict` on text; title Yomogi 700 30/48.
- en/ja D-9 still primary; layout, sizes, colors identical to ko.

### 3.14 Interactions / navigation (from frames + V0-00 flow)
- Tab "기념일" root = V0-anniv-list. Row tap → V0-anniv-detail-* (rows are buttons; placeholder row is not).
- Header + / empty CTA "기념일 추가" → V0-05 add screen (V0-edit-*).
- Detail back (←) → list. Custom detail "편집" → V0-05 edit; "이 기념일 삭제" → confirm → delete.
- "지난 기념일 N개 보기" expands past section in place; "지난 기념일 접기" collapses.
- "알림 설정 열기" → settings notifications.
- Filter toggles 전체 ↔ 직접 추가 (aria-pressed).
- Detail of auto kinds and partner birthday: read-only (no edit/delete).

## 4. References to other screens / rules
- "날짜 계산 (기존 S06·스펙 규칙)" — reuses S06 메인 D-day counting rules (D+1 on start day, calendar-day diff + 1, space timezone midnight).
- V0-00 flow board: "날짜 세기 (기존 S06 · 스펙 규칙 그대로)"; "N일 기념일 = 사귄 날 + (N − 1)일. 기존 서버 목록에는 150일이 없어서 V0 백엔드에서 더해야 해요(500·1000일은 오너 목록에 없어 V0에서 빠짐 — 열린 질문)."; "주년 = 같은 달력 날짜(365일 단위 아님) → 1주년은 366일째. 2월 29일 시작은 평년 2월 28일. 같은 날이면 주년이 우선."; "생일은 양력 월·일(연도 선택), 2월 29일 생일은 평년 2월 28일."; "직접 추가 기념일: 두 사람 누구나 추가·편집·삭제(삭제는 확인). 동시 편집은 버전 확인 후 충돌 안내."; "자동 기념일: 아무도 못 고침. 알림만 각 기기에서 종류별로."; "홈 · 기념일 · 설정 3개(시스템 UITabBar). 기존 "방" 탭은 숨기고 "기념일" 탭이 그 자리에 와요."; 기념일 당일 → "로컬 알림 09:00", V0-home-today 축하 카드, V0-anniv-list-today.
- Copy reuse: `anniv.detail.notify` = 기존 `set.sec.notif`; `anniv.days` = `milestone.label.day`; `anniv.years` = `milestone.label.anniv`; tabs/a11y reuse `tab.*`, `a11y.tab*`.
- V0-05 기념일 추가·편집 (separate board) = target of +/편집; V0-07 settings (notify) = target of 알림 설정 열기.

## 5. Not determinable from this board
- Copy keys present but no frame: `anniv.birthday.mine` "내 생일을 넣으면 서로 보여요", `anniv.birthday.add` "내 생일 넣기" (state where I have not entered my birthday), `anniv.rule.days` (N일 detail — no 일수 detail frame), `anniv.detail.nth`, `anniv.detail.when` (날짜), `anniv.notify.off`, `anniv.repeat.once` (한 번만 item), `anniv.detail.byMe`.
- "내 생일" detail (self birthday: edit affordance?) — verify against board V0-anniv-detail-birthday / V0-05.
- Placement rule of the birthday-wait placeholder (board puts it after 내 생일, not at a date position) — verify against board V0-anniv-list-bwait.
- Whether list scrolls (frames use overflow hidden; list-past shows only 2 upcoming rows) — verify against board V0-anniv-list-past.
- Past count 10 vs visible 6: which 4 items are below the fold — verify against board V0-anniv-list-past.
- Detail navigation title text (slot is empty on all details).
- Pressed/disabled/loading/error states of list, filter, detail; delete confirmation dialog; pull-to-refresh.
- Behaviour when item date = today in detail (D-number "오늘"?) — not drawn.
- How "알림 기본 설정" value changes when the user disabled that kind (`anniv.notify.off`).
- Dark-mode variants of today pill, past-expanded, empty, placeholder, auto details; en/ja for details and other states.
- Why detail D-239 is primary while the 14-day rule colors list D-n — board shows detail D-number always primary.
- Same-day collision ordering (주년 vs N일) only from V0-00 ("같은 날이면 주년이 우선"); ordering of other same-date items not specified.
