# V0-07 설정: design extract
Verified 2026-11-02: 72 claims checked, 3 corrected.

Source: board `V0-07-settings.dc.html` (page "V0 · 설정"), artifact https://claude.ai/artifact/M2WFQCFnVzoWbHNhJPCz5X version `1793598115-fafc`.
I read the slim board (the board) in full. I took icon geometry from the full board (`artifact/project/V0-07-settings.dc.html`).
Copy keys come from `copy-v0.md` and, where noted, `copy-v0.md` / `copy-v0.md`. Some cross-checks use `V0-00-flow`.
Hex values are as drawn. Token names refer to `apps/mobile/src/theme/tokens.ts` `color.app.{light|dark}.normal.*` unless stated otherwise.
The board has no interaction script (`DCLogic.renderVals()` returns `{}`). Navigation below comes from screen titles, row affordances and the rules text. Anything not drawn is marked "verify against board <id>".

---

## 1. Board header, notes and rules (verbatim)

- Eyebrow: `AROOM · V0 · D+DAY · 설정`. H1: `V0-07 설정`.
- Lead: `내 정보(이름·생일), 우리(사귄 날·상대·시간대), 알림(시간·미리 알림·종류), 화면(언어·모드), 도움(문의·개인정보 처리방침·약관·버전), 계정(로그아웃·연결 끊기·계정 삭제).`
- Section 1 `iOS · 밝은 앱 · 한국어`, note: `S13 설정의 V0 변형이에요. 방 낮·밤, AI 처리 동의, 배경 사진, 고대비 별도 행은 빼고(고대비는 iOS 설정을 따름) 필요한 것만 남겼어요.`
- Section 2 `어두운 앱 · 영어 · 일본어` has no note.
- Section 3 `규칙`, three cards:

**구역과 적용 범위**
- `내 정보: 나에게만(이름·생일은 상대에게 보임). 우리: 두 사람에게(사귄 날·시간대). 알림·화면: 이 기기에만.`
- `사귄 날을 바꾸면 확인 후 두 사람의 D+N·일수 기념일·주년·위젯이 함께 바뀌고, 상대 홈에 "하루님이 사귄 날을 바꿨어요" 띠가 한 번 떠요.`
- `시간대는 공간을 만든 기기의 시간대로 정해지고 설정에서 바꿀 수 있어요(두 사람에게 적용). 화면 S13의 시간대 고르기 시트를 재사용해요.`

**알림 (권장 기본값 · 오너 결정 대기)**
- `로컬 예약 알림만(서버 푸시 없음). 기본: 켜면 기념일 당일 오전 9:00(공간 시간대) + 하루 전 미리 알림.`
- `미리 알림은 하나만 고를 수 있어요(없음 / 하루 전 / 3일 전 / 일주일 전). 종류별(함께한 날·생일·시즌·직접 추가)로 끌 수 있어요.`
- `가까운 기념일부터 최대 약 50개를 이 기기에 예약하고 앱을 열 때·편집할 때·시간대가 바뀔 때 다시 맞춰요. 상대가 바꾼 내용은 상대 폰이 아니라 내 폰에서 내가 앱을 열 때 반영돼요(알림 설정 아래에 그대로 적었어요).`
- `기기에서 알림이 꺼져 있으면 띠와 "기기 설정 열기"를 보여 주고 스위치는 비활성.`
- `알림 문구: 자동 기념일은 이름 없이 "오늘은 빼빼로데이예요", 직접 추가는 제목을 보일지 오너 결정(v0-scope.md Q4).`

**계정** (this card is drawn infoBg `#E1EDF5` with info border `#2D5E86`; the other two cards are bg/divider)
- `로그인은 Apple 하나(이메일·앱 비밀번호 제안은 V1에 없음). 계정 삭제 본인 확인은 "Apple로 다시 로그인해 확인"이고 Apple 토큰 해지를 꼭 불러요.`
- `연결 끊기 = S14 공간 종료와 같은 결과: 두 사람 모두 공간을 잃고 날짜·기념일·생일 공유가 지워져요. 상대는 다음에 열 때 V0-state-ended.`
- `로그아웃·연결 끊기·계정 삭제 때 이 기기의 예약 알림과 위젯 공유 데이터(App Group)를 지워요.`
- `신고·차단(S15)은 V1 설정에서 빼요(두 사람만 쓰는 공간이라). 필요하면 문의하기로 받아요 — 오너 확인.`

The rules above are summarised here as the topics the task listed:
- **Start date change:** confirm first, then it applies to both people. The partner's home shows a one-time banner. Copy key `home.partnerEdited` = `{name}님이 사귄 날을 {date}로 바꿨어요`. The rules text quotes the shorter `"하루님이 사귄 날을 바꿨어요"`.
- **Time zone:** set from the creator's device and changeable in settings for both people. It reuses the S13 time-zone sheet. V0-00-flow adds: `사귄 날·시간대: 두 사람 누구나, 확인 후 두 사람에게 적용. 상대 홈에 "하루님이 사귄 날을 바꿨어요" 띠.`
- **Notifications:**
  - Master on/off.
  - Time defaults to 09:00 in the space time zone.
  - One early reminder: none / 1 day / 3 days / 1 week.
  - On/off per kind: 함께한 날, 생일, 시즌, 직접 추가.
  - **Per-anniversary on/off is not on this board.** Only per-kind switches are drawn.
  - When notifications are denied on the device: banner, `기기 설정 열기`, switches disabled.
  - Partner changes apply the next time this user opens the app. This is the footer under the notification settings.
- **Language and mode:** apply to this device only (`이 기기에만 적용돼요.`).
- **Help rows:** 문의하기 (opens in app or mail, not stated), 개인정보 처리방침 and 이용약관 (external), 버전 (static).
- **Logout, disconnect, delete:** each one clears this device's scheduled notifications and the widget App Group data. Delete re-authenticates with Apple and revokes the Apple token.

---

## 2. Global frame facts

### Device and chrome
| Item | Value |
|---|---|
| Frame | 390×844, radius 44, board ring `0 0 0 6px #E3CDB0` (dark `#4A3D36`). The ring is board chrome only. |
| Screen bg | `#FBF1E3` = `bg`; dark `#2B2320` = dark `bg` |
| Default text | `#3F2D22` = `text`; dark `#F7EBDD` |
| Dynamic Island mock | top 11, 124×36, radius 18, `#000` |
| Home indicator mock | bottom 8, 134×5, radius 3, `text` color at opacity .85 (dark `#F7EBDD`) |
| Safe top | Tab root: title row padding-top **55**. Pushed screens: nav row padding-top **51**. Tokens give `safeArea.ios.top` 47. Use real insets plus the extra. |
| Bottom spacer | Tab root: 91 (83 tab bar + 8). Pushed screens with no footer: 42. Footer CTA area: padding `12 20 42`. |

### Tab bar (V0-set-main, main-2; this is the system UITabBar)
- Height 83, padding-top 7, three equal tabs.
- Icons 25px, gap 2. Labels: SF 10/12, weight 500; the selected label is 600.
- Light: bg `rgba(249,249,249,.94)`, top hairline `0.5px rgba(60,60,67,.29)`, unselected tint `#6B5444` (`text2`), selected `#B24A24` (`primary`).
- Dark: bg `rgba(30,26,24,.94)`, hairline `rgba(84,84,88,.6)`, unselected `#CDB8A5`, selected `#F0A67F`. This follows `tokens.systemTabBar`: selected = primary, unselected = text2.
- Icon paths:
  - Home: `M4 11l8-7 8 7v9a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z`
  - Anniversaries: the calendar-heart glyph (same as the 미리 알림 icon, below).
  - Settings: a circle r3.2 plus 8 rays (sun/gear). Selected tab icon stroke is 2.2; unselected tab icons are 2 (the Settings icon is only drawn selected on this board).
- a11y: tablist `탭 막대` (`a11y.tabbar`). Tabs use `a11y.tab` + `a11y.tab.sel`, e.g. `설정 탭, 3개 중 3번째, 선택됨`.

### Large title (tab root)
- Row: padding `55 16 4 20`, min-height 48, flex-end. The trailing slot is empty (gap 4).
- Title `설정`: Gaegu 700, 30/45, `text`, padding-bottom 2. en: 30/42 with no keep-all. ja: Yomogi 30/48 with line-break strict.

### Pushed-screen nav bar
- Row: padding `51 8 4`, gap 4, min-height 48, center aligned.
- Back button: 48×48, transparent. Icon is a 26px chevron `M15 5l-7 7 7 7`, stroke `text` 2.2 (dark `#F7EBDD`). aria-label `뒤로` / `Back` (`common.back`).
- Title: centered, Noto Sans KR 700, 17/25.5, `text`. en is 17/23.8.
- Trailing slot: 48 wide. Either empty, or a text button (V0-set-me `저장`): min 48×48, padding 0 12, Noto Sans KR 700 16, `primary`.

### Scroll content
- Tab root: padding `12 20 0`, section gap **18**.
- Pushed screens: padding `8 20 0`, gap **16**.
- Gutter 20 = `GUTTER` (`spacing[4]`).

### Grouped list anatomy
| Part | Spec |
|---|---|
| Section header | Noto Sans KR 700, 13/19.5, `text2`, padding `0 6 6`. ko text has no uppercase transform. en 13/18.2, ja Zen Maru Gothic 13/20.8. |
| Group card | bg `surface` `#FFF8EC`, border 2 `divider` `#E3CDB0`, overflow hidden, hand-drawn radius `19.4 19.8 16.9 19.1 / 18 18 20.2 16.9` (≈ `radius.card` 20 with jitter). Dark: `#352B26` / `#4A3D36`. |
| Row | min-height **56**, padding `8 16`, gap 12, transparent bg, no per-row border |
| Leading icon tile (main screen) | 32×32, radius 10, bg `surface2` `#F3E0C4` (dark `#40342E`). Icon 18px, stroke `text2` 2.0 (dark `#CDB8A5`). Pushed sub-screens have no tile. |
| Label | Noto Sans KR **500**, 16/24, `text`. Danger rows: weight 700, `danger` `#A3341C`, and the icon stroke is `danger` too (the tile bg stays `surface2`). |
| Trailing block | flex row, gap 6, max-width 52% |
| Value label | Gowun Dodum 400, 15/22.5, `text2`, right-aligned. en 15/21; ja Zen Maru Gothic 15/24. |
| Chevron | 18px `M9 5l7 7-7 7`, stroke `text2` 2.2 |
| External-link icon | 18px `M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5`, stroke `text2` 2.0. Used on privacy and terms. |
| Selection check | 22px `M5 12.5l4.5 4.5L19 7`, stroke `primary` 2.6. Unselected rows keep a 22px empty spacer. |
| Switch (iOS) | 51×31, radius 16. Knob 27×27 at top 2, `#FFFFFF`, shadow `0 2px 4px rgba(0,0,0,.18)`. On: track `primary` (dark `#F0A67F`), knob left 22. Off: track `#E9E9EA` (iOS system; no token), knob left 2. Disabled: track `surface2` `#F3E0C4` at opacity .5, knob left 2. The switch is aria-hidden; the whole row is the button. |
| Divider | 1px, `margin-left:16`, so it runs from 16pt to the right edge. On the main screen it also passes under the icon tile. Color `divider` (dark `#4A3D36`). |
| Group footer | Gowun Dodum 400, 13/19.5, `text2`, padding `6 6 0` |

### Fonts by language (all variants)
- **ko:**
  - Display: Gaegu 700.
  - Labels, headers and emphasis: Noto Sans KR 500 or 700.
  - Body and value text: Gowun Dodum 400.
  - Line height 1.5, `word-break: keep-all`.
- **en:** same families. Line height 1.4 and no keep-all.
- **ja:**
  - Every non-display text uses Zen Maru Gothic (400, 500 and 700 all appear); the display title uses Yomogi.
  - Line height 1.6, `line-break: strict`.
  - The card bg font is `'Zen Maru Gothic','Noto Sans JP'`.
- System alert and tab bar text use `-apple-system / SF Pro Text`.
- **App gap:** `theme/fonts.ts` registers only NotoSansKR 400 and 700 (no 500), ZenMaruGothic **Bold only**, and maps ja body to NotoSansJP. The board needs Noto Sans KR Medium 500 (every row label) and Zen Maru Gothic Regular and Medium.

### Radii seen (hand-drawn jitter; no shadows anywhere except the iOS switch knob)
| Element | Radius | Token |
|---|---|---|
| Group card | ≈17–20 | `radius.card` 20 |
| Profile card, banner, consequence card | ≈19–22 | `radius.card` 20 |
| Input and date boxes | ≈15–18 | `radius.input` 16 |
| Primary CTA (52 high) | ≈24–29 | `radius.pill` |
| Secondary button (48 high) | ≈22–27 | `radius.pill` |
| Info chip | 999 | `radius.pill` |
| Checkbox | 8 | none |
| Icon tile | 10 | none |
| Kind tile | ≈11–13 | none |
| iOS alert | 14 | none |

### Color map (light → token; dark value as drawn)
| Light hex | Token | Dark hex drawn |
|---|---|---|
| #FBF1E3 | bg | #2B2320 |
| #FFF8EC | surface | #352B26 |
| #F3E0C4 | surface2 | #40342E |
| #3F2D22 | text | #F7EBDD |
| #6B5444 | text2 | #CDB8A5 |
| #B24A24 | primary | #F0A67F |
| #FFFFFF (on primary/danger) | onPrimary / onDanger | #2B1A12 (check on checkbox) / #2A0A06 (danger CTA text) |
| #4A3426 | line (button and checkbox borders) | #E8D3BC |
| #8A6B55 | border (inputs, secondary button) | not drawn in dark (token `#A58E7B`) |
| #E3CDB0 | divider | #4A3D36 |
| #A3341C | danger | #FF9A82 |
| #7A4F00 / #FFEFC4 | warn / warnBg | not drawn in dark |
| #2D5E86 / #E1EDF5 | info / infoBg | not drawn in dark |
| #F4B79B #F7D98B #AACBE2 #C9B8E8 | illustration.palette peach / butter / sky / lav | unchanged in dark |
| #4A3426 (tile outline and icon) | illustration.outline | unchanged in dark |
| #E9E9EA | none (iOS switch off) | not drawn |

---

## 3. Screens

### 3.1 V0-set-main · 설정 · 위 (tab root, light ko)
Top to bottom:
1. **Large title** `설정` (`set.title`), as in §2.
2. **Profile card**, a button. It has no section header, even though `set.section.me` = `내 정보` exists in the copy table.
   - Card: padding 14 16, gap 14, radius ≈20, bg `surface`, border 2 `divider`.
   - Avatar: 52×52 circle, bg peach `#F4B79B`, border 1.5 `#4A3426`. The initial `도` is Noto Sans KR 700 22, `#4A3426`; it is the first character of the name and is aria-hidden.
   - Name `도담` (runtime): Noto Sans KR 700, 18/27, `text`.
   - Subtitle `생일 · 3월 14일`: `set.me.birthday` + ` · ` + `date.md`, Gowun Dodum 14/21, `text2`. When no birthday is set, the subtitle probably uses `set.me.birthday.none` `넣지 않음`, but that state is not drawn (verify against board V0-set-main).
   - Chevron 18. Tapping opens **V0-set-me**.
3. **Section `우리`** (`set.section.us`):
   - `사귄 날` (`set.us.start`):
     - Icon: heart `M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z`.
     - Value `2025년 6월 29일`. There is no exact key; this is `date.long` without the weekday.
     - Chevron. Opens **V0-set-start**.
   - `상대` (`set.us.partner`):
     - Icon: person (circle cx12 cy8 r4 + `M4 21a8 8 0 0 1 16 0`).
     - Value `하루 · 연결됨` (`set.us.connected`).
     - **No chevron**, so the row is static.
   - `기준 시간대` (`set.us.tz`):
     - Icon: globe (circle r9 + `M3 12h18M12 3c2.5 2.5 3.5 5.5 3.5 9s-1 6.5-3.5 9c-2.5-2.5-3.5-5.5-3.5-9S9.5 5.5 12 3z`).
     - Value `서울 (UTC+9)` (`set.us.tz.value`, a display name plus offset, not the IANA id).
     - Chevron. Opens the S13 time-zone sheet.
   - Footer: `날짜가 바뀌는 자정과 알림 시간은 이 시간대를 따라요. 두 사람에게 같이 적용돼요.` (`set.us.tz.note`).
4. **Section `알림`** (`set.section.notify`):
   - `기념일 알림` (`set.notify.toggle`):
     - Icon: bell (`M6 16v-5a6 6 0 0 1 12 0v5l1.5 2h-15z` + `M10 20.5a2 2 0 0 0 4 0`).
     - Inline switch, **on**.
   - `알림 시간` (`set.notify.time`):
     - Icon: clock (circle r9 + `M12 7v5l3 2`).
     - Value `오전 9:00` (`set.notify.time.value`) and a chevron.
   - `미리 알림` (`set.notify.early`):
     - Icon: calendar-heart (rect 3.5,5 17×15.5 rx2.5 + `M3.5 9.5h17M8 3v4M16 3v4` + small heart).
     - Value `하루 전` (`set.notify.early.1d`) and a chevron.
   - The section has no footer on main, and the screen is clipped here (overflow hidden; the content continues in main-2).
5. Tab bar with 설정 selected.

### 3.2 V0-set-main-2 · 설정 · 아래로 스크롤 (same screen scrolled)
- The header area is a 55px empty band. No collapsed nav title is drawn.
- **Section `화면`** (`set.section.display`):
  - `언어` (`set.lang`): globe icon, value `기기 설정 따르기` (`set.lang.system`), chevron. Opens V0-set-lang.
  - `화면 모드` (`set.mode`): moon icon `M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z`, value `시스템 설정 따르기` (`set.mode.system`), chevron. Opens V0-set-mode.
  - Footer `이 기기에만 적용돼요.` (`set.display.note`).
- **Section `도움`** (`set.section.help`):
  - `문의하기` (`set.help.contact`): mail icon (rect 3,5 18×14 rx2 + `M3.5 6.5l8.5 6.5 8.5-6.5`) and a chevron. The target is not drawn (verify against board V0-set-main-2).
  - `개인정보 처리방침` (`set.help.privacy`): shield icon `M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z`. The trailing icon is **external-link**, not a chevron, so it opens a browser.
  - `이용약관` (`set.help.terms`): document icon `M7 3h7l5 5v13H7zM14 3v5h5` and an **external-link** icon.
  - `버전` (`set.help.version`): info icon (circle r9 + `M12 11v5M12 8h.01`), value `1.0.0 (12)` (runtime `version (build)`). No chevron, so it is static.
- **Section `계정`** (`set.section.account`):
  - `Apple로 로그인함` (`set.account.apple`): person icon, no trailing element, static.
  - `로그아웃` (`set.account.logout`): logout icon `M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4M10 17l-5-5 5-5M5 12h11`. No chevron. **No confirmation dialog is drawn** (verify against board V0-set-main-2).
  - `연결 끊기` (`set.account.disconnect`): danger. Link-off icon `M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1M3 3l18 18`. No chevron. Opens V0-set-disconnect.
  - `계정 삭제` (`set.account.delete`): danger. Trash icon `M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6`. No chevron and no sub-value. Opens V0-set-delete.
  - No footer.
- Tab bar.
- Every row on the board (with or without a chevron) is a `<button>` with `cursor:default`, so markup does not signal tappability; infer it from the trailing affordance. Treat 상대, 버전 and Apple로 로그인함 (no trailing element) as non-interactive. Treat 로그아웃, 연결 끊기 and 계정 삭제 as actions.

### 3.3 V0-set-me · 내 정보 (이름 · 생일)
- **Nav:** back, title `내 정보 고치기` (`set.me.edit.title`), trailing text button `저장` (`common.save`, `primary` 700 16).
- **Name field:**
  - Header row (space-between, baseline): `이름` (`set.me.name`) in Noto Sans KR 700, 14/21, `text`; counter `2/10` in Gowun Dodum 13/19.5, `text2`. The counter has no key, and the max of 10 is implied.
  - Field: min-height 52, padding 0 16, radius ≈16, bg `surface`, border 2 `border` `#8A6B55`.
  - Value `도담` in Gowun Dodum 16/24, `text`.
  - No placeholder, focus or error state is drawn.
- **Birthday** (gap 6 below the label `생일`, `set.me.birthday`, 14/700):
  - The field is one `<button>` holding two boxes (month, day), each flex 1, gap 8.
  - Each box: min-height 52, padding 0 12, radius ≈16, bg `surface`, border 2 `border`, centered, gap 4.
  - Number: Noto Sans KR 700, 20/30, `text` (`3`, `14`). Unit: Gowun Dodum 14/21, `text2` (`월`, `일`). The units have no key.
  - Tapping opens a picker. It is not drawn (verify against board V0-set-me; the onboarding uses `start.date.picker`).
- **Year switch row** (min-height 48, space-between): `태어난 해도 넣기` (`start.profile.year`) in Noto Sans KR 500, 15/22.5. The switch is **off** (`#E9E9EA`). The year box that appears when it is on is not drawn.
- **Hint:** `두 사람 모두 생일을 넣으면 서로의 기념일에 함께 보여요. 양력 기준이에요.` (`start.profile.birthdayHint`), 13/19.5, `text2`.
- **Warn banner:**
  - Padding 12 14, radius ≈20, bg `warnBg` `#FFEFC4`, border 2 `warn` `#7A4F00`, gap 10, top-aligned.
  - Icon: cake, 20px, stroke `warn` (`M4 20.5h16M5.5 20.5v-7h13v7…`).
  - Text: `하루님은 아직 생일을 넣지 않았어요. 둘 다 넣으면 서로 보여요.` (`set.me.birthday.partnerWait`), Noto Sans KR 500, 14/21, `warn`.
  - Shown only while the partner has no birthday (implied).
- No bottom CTA; there is a 42 spacer. The 저장 disabled state and the back-with-unsaved-changes behaviour are not drawn.

### 3.4 V0-set-start · 사귄 날 고치기
- **Nav:** back, title `사귄 날 고치기` (`set.start.title`), empty trailing slot.
- **Lead:** `이 날이 1일째(D+1)예요. 나중에 설정에서 고칠 수 있어요.` (`start.date.body`, reused from onboarding), Gowun Dodum 15/22.5, `text2`.
- **Label:** `사귄 날` (`start.date.label` / `set.us.start`), 14/700, `text`. Gap 8 to the field.
- **Date button:** three boxes with the input style from §3.3. Year is flex **1.5**, month and day are flex 1, gap 8. Values `2025 년`, `6 월`, `21 일`.
- **Preview chip:**
  - Inline-flex, padding 4 11, radius 999, bg `infoBg`, border 1.5 `info`.
  - Text: Noto Sans KR 700, 13/19, `info`.
  - Icon: 15px heart, stroke `info` 2.2.
  - Copy: `바꾸면 오늘이 500일째가 돼요` (`set.start.preview`, n=500).
- **Change note** (gap 8): info icon, 18px, stroke `info` 2.0. Text `2025.06.29 → 2025.06.21. 하루님 화면과 위젯, 날짜 기념일도 함께 바뀌어요.` (`set.start.confirm.body` reused inline), 13/19.5, `text2`. Date format `YYYY.MM.DD`.
- **Footer:**
  - Primary CTA `저장` (`common.save`).
  - Full width, min-height 52, padding 8 20, pill, bg `primary`, border 2 `line` `#4A3426`.
  - Text: Noto Sans KR 700, 16/24, `onPrimary`.
- **Not drawn** (verify against board V0-set-start): the unchanged state (presumably no chip, no note and a disabled 저장), the future-date error (onboarding has `start.date.err.future`), and the picker.

### 3.5 V0-set-start-confirm · 사귄 날 바꾸기 확인 (두 사람에게 적용)
- This is V0-set-start under a **native iOS alert**. The board labels it `iOS 시스템 알림`; that label is an annotation, not UI.
- Scrim `rgba(0,0,0,.35)`.
- Alert: 270 wide, radius 14, bg `rgba(242,242,242,.96)`, text centered.
- Title `사귄 날을 바꿀까요?` (`set.start.confirm.title`): SF 600, 17/22, `#000`.
- Body `2025.06.29 → 2025.06.21. 하루님 화면과 위젯, 날짜 기념일도 함께 바뀌어요.` (`set.start.confirm.body`, `{old} → {new}. {name}님…`): SF 400, 13/18. Padding `19 16 15`, gap 4.
- Buttons: a horizontal pair, min-height 44, 0.5 hairlines `rgba(60,60,67,.29)`.
  - `취소` (`common.cancel`): 400, `#007AFF`.
  - `바꾸기` (`set.start.confirm.cta`): 600, `#007AFF`. It is the preferred action, **not** destructive red.
- In React Native this maps to `Alert.alert(title, body, [{text: 취소, style:'cancel'}, {text: 바꾸기, isPreferred:true}])`.
- On confirm: save; both partners update; the partner sees the `home.partnerEdited` banner once. Pending, success and failure UI are not drawn (verify against board V0-set-start-confirm).

### 3.6 V0-set-notify · 알림
- **Nav:** back, title `알림`, empty trailing slot.
- **Group 1** (no header, rows with no icon tile):
  - `기념일 알림`: switch **on**.
  - Divider.
  - `알림 시간`: value `오전 9:00` and a chevron. A time picker is implied but not drawn (verify against board V0-set-notify).
- **Group 2** `미리 알림` (single-select radio list):
  - `없음` (`set.notify.early.none`)
  - `하루 전` **✓ selected** (`.1d`)
  - `3일 전` (`.3d`)
  - `일주일 전` (`.7d`)
  - Uses the check/spacer pattern from §2.
- **Group 3** `알림 받을 기념일` (`set.notify.kinds`): each row has a kind tile and a switch (all **on**).
  - Kind tile: 36×36, radius ≈11–13, border 1.5 `#4A3426`, 20px icon with stroke `#4A3426` 2.0.
  - | Row | Key | Tile bg | Icon |
    |---|---|---|---|
    | `함께한 날` | `anniv.kind.milestone` | peach `#F4B79B` | heart |
    | `생일` | `anniv.kind.birthday` | butter `#F7D98B` | cake |
    | `시즌 기념일` | `anniv.kind.season` | sky `#AACBE2` | Pepero sticks: `M6.5 21L14 4M11 21l7.5-17` + inner stroke-width 4 `M10.6 13.2L14 5.5M15.1 13.2l3.4-7.7` |
    | `직접 추가한 기념일` | `anniv.kind.custom` | lav `#C9B8E8` | star `M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8L3.5 9.7l5.9-.9z` |
  - Footer (`set.notify.note`, `{name}`=하루): `알림은 이 기기에서만 울려요. 하루님 알림은 하루님이 정해요. 가까운 기념일부터 최대 50개를 이 기기에 미리 예약하고, 하루님이 기념일을 바꾸면 앱을 열 때 다시 맞춰요.`
- 42 bottom spacer.
- **Master switch off (not denied):** not drawn. It is unknown whether groups 2 and 3 hide or disable (verify against board V0-set-notify).

### 3.7 V0-set-notify-denied · 기기에서 알림이 꺼짐
- **Nav:** same as V0-set-notify.
- **Warn banner** at the top:
  - Padding 14 16, radius ≈20, bg `warnBg`, border 2 `warn`. Column, gap 8.
  - Row (gap 10, centered): bell-off icon, 22px, stroke `warn` 2.2 (`M6 16v-5a6 6 0 0 1 9.5-4.9M18 11v5l1.5 2h-12` + `M10 20.5a2 2 0 0 0 4 0M4 4l16 16`), then title `기기에서 알림이 꺼져 있어요` (`set.notify.denied.title`) in Noto Sans KR 700, 16/24, `warn`.
  - Body `기기 설정에서 모피루 알림을 켜면 기념일에 받을 수 있어요.` (`set.notify.denied.body`): Gowun Dodum 14/21, `warn`.
  - Button `기기 설정 열기` (`set.notify.denied.cta`):
    - Full width, min-height 48, padding 8 20, pill, bg `surface`, border 2 `border` `#8A6B55`.
    - Text: Noto Sans KR 700 16, `text`.
    - Leading external-link icon, 20px, stroke `text` 2.1.
    - Action: open iOS app settings (`Linking.openSettings()`).
  - This differs from the app's `Banner`: there the title and body are `text` / `text2`, the radius is `input` 16, and the action is an underlined link.
- **Group 1:**
  - `기념일 알림` switch is **disabled**: off position, track `surface2` at opacity .5.
  - `알림 시간` still shows `오전 9:00` and a chevron with no dimming. Whether it is tappable is not stated (verify against board V0-set-notify-denied).
- **The 미리 알림 group is not rendered** in the denied state.
- **Group 3** `알림 받을 기념일`: same four rows, all switches **disabled** (off, .5).
- **Footer:** the same `set.notify.note`.

### 3.8 V0-set-lang · 언어
- **Nav:** back, title `언어` (`set.lang`). This is a pushed full screen, **not** a bottom sheet.
- One group of radio rows (no icon tile):
  - `기기 설정 따르기` **✓** (`set.lang.system`)
  - `한국어`, `English`, `日本語`: autonyms, no keys, never translated.
- Footer `이 기기에만 적용돼요.` (`set.display.note`).
- Whether the screen pops back on selection is not drawn (verify against board V0-set-lang).

### 3.9 V0-set-mode · 화면 모드
- **Nav:** back, title `화면 모드` (`set.mode`). Pushed screen.
- Radio rows:
  - `시스템 설정 따르기` **✓** (`set.mode.system`)
  - `밝게` (`set.mode.light`)
  - `어둡게` (`set.mode.dark`)
- Footer `이 기기에만 적용돼요.`
- There is no high-contrast row; it follows iOS.

### 3.10 V0-set-disconnect · 연결 끊기 (S14 규칙)
- **Nav:** back and an **empty title** (the title div is empty). Empty trailing slot.
- **Heading** `연결을 끊을까요?` (`set.disconnect.title`): Gaegu 700, **26/39**, `text`, margin-top 4. There is no lead paragraph.
- **Consequence card:**
  - Padding 16, radius ≈20, bg `surface`, border 2 `divider`. Column, gap 12.
  - Each item is a row (gap 10, top-aligned): warning-triangle icon, 18px, stroke `danger` 2.2 (`M12 3.5l9.5 16.5h-19z` + `M12 10v4.5M12 17.5h.01`), then text in Gowun Dodum 15/22.5, `text`.
  1. `두 사람의 공간이 끝나요. 하루님도 더 이상 볼 수 없어요.` (`set.disconnect.i1`)
  2. `사귄 날, 직접 추가한 기념일, 서로의 생일 공유가 지워져요.` (`.i2`)
  3. `되돌릴 수 없어요. 다시 쓰려면 새로 연결해야 해요.` (`.i3`)
  4. `위젯과 이 기기의 알림도 함께 지워져요.` (`.i4`)
- **Checkbox row:**
  - `role=checkbox aria-checked=true`, min-height 48, padding 0 4, gap 12.
  - Box: 26×26, radius 8, border 2 `line`, checked bg **`primary`** `#B24A24`, check 18px white, stroke 3.
  - Label `내용을 확인했어요` (`set.confirm.check`): Noto Sans KR 500, 16/24, `text`.
- **Footer** (padding 12 20 42, gap 6):
  - Danger CTA `연결 끊기` (`set.account.disconnect`): min-height 52, pill, bg `danger` `#A3341C`, border 2 `line`, white 700 16.
  - Ghost `취소` (`common.cancel`): min-height 48, transparent, `primary` 700 16.
- **Only the checked state is drawn.** The unchecked look, a disabled CTA, progress, failure and the post-disconnect destination are not drawn (verify against board V0-set-disconnect).
- **Result:** the partner sees V0-state-ended on their next open. This device clears its notifications and widget data.

### 3.11 V0-set-delete · 계정 삭제 (Apple로 다시 확인)
- **Nav:** back and an empty title.
- **Heading** `계정을 삭제할까요?` (`set.delete.title`): Gaegu 700, 26/39.
- **Lead** `삭제하면 바로 로그아웃되고, 되돌릴 수 없어요.` (`set.delete.body`): Gowun Dodum 15/22.5, `text2`.
- **Consequence card**, same style as §3.10, with warning-triangle icons:
  1. `내 계정과 프로필 정보가 삭제돼요` (`set.delete.i1`)
  2. `함께 쓰는 공간이 있다면 종료돼요. 두 사람 모두 들어갈 수 없고 날짜·기념일이 삭제돼요` (`.i2`)
  3. `같은 계정으로 다시 가입해도 이전 내용은 돌아오지 않아요` (`.i3`)
- **Checkbox** `내용을 확인했어요`, checked, same style as §3.10.
- **Note** `Apple로 가입한 계정은 삭제할 때 Apple 연결도 함께 해제돼요.` (`set.delete.apple.note`): 13/19.5, `text2`.
- **Footer:**
  - Danger CTA with a **white Apple logo glyph** (20px, fill `#FFFFFF`) and the text `Apple로 다시 로그인해 확인` (`set.delete.reauth`, `{provider}`=Apple).
  - Ghost `취소`.
  - The copy table also lists `set.delete.cta` `계정 삭제하기`, but **that string is not used on the board**.
- **Interaction:** the CTA runs Apple re-auth directly (no intermediate bottom sheet is drawn), then calls the delete and revokes the Apple token. Progress, failure and done states are not drawn here (§4).

### 3.12 Dark variants (`iOS · 어두운 앱 · 한국어`)
Layout and text are identical to light. Only colors change.
- **V0-set-main (dark):**
  - bg `#2B2320`. Cards `#352B26` with border `#4A3D36`. Dividers `#4A3D36`.
  - Icon tiles `#40342E`, icon stroke `#CDB8A5`.
  - Labels and title `#F7EBDD`. Values, section headers, footer, chevrons and profile subtitle `#CDB8A5`.
  - Switch on `#F0A67F`, knob `#FFFFFF`.
  - Tab bar `rgba(30,26,24,.94)`, hairline `rgba(84,84,88,.6)`, selected `#F0A67F`, unselected `#CDB8A5`.
  - Home indicator `#F7EBDD`.
  - **The avatar is unchanged:** peach `#F4B79B`, border and initial `#4A3426`.
  - The dark main frame shows only the top part (through 미리 알림). The dark danger rows are not drawn; the `danger` dark token is `#FF9A82` (verify against board V0-set-main dark).
- **V0-set-notify (dark):**
  - Same color swaps.
  - Back icon and title `#F7EBDD`.
  - Selection check `#F0A67F`.
  - **Kind tiles are unchanged**: the palette fills with `#4A3426` outline and icon.
- **V0-set-disconnect (dark):**
  - Heading and item text `#F7EBDD`. Item icons `#FF9A82`.
  - Card `#352B26` / `#4A3D36`.
  - Checkbox: bg `#F0A67F`, border `#E8D3BC`, check `#2B1A12`.
  - Danger CTA: bg `#FF9A82`, border `#E8D3BC`, text `#2A0A06`.
  - Ghost 취소 `#F0A67F`.
- Not drawn in dark: me, start, confirm, denied, lang, mode, delete.

### 3.13 English and Japanese variants
- **V0-set-main · English:**
  - Title `Settings`. Avatar initial `D`.
  - Profile: `Dodam`, `Birthday · Mar 14`.
  - `Us`:
    - `Start date`: `Jun 29, 2025`
    - `Partner`: `Haru · Connected`
    - `Time zone`: `Seoul (UTC+9)`
    - Footer: `Midnight and reminder times follow this time zone, for both of you.`
  - `Notifications`:
    - `Anniversary reminders`: switch on
    - `Time`: `9:00 AM`
    - `Early reminder`: `1 day before`
  - Tabs `Home` / `Anniversaries` / `Settings`.
  - a11y: `Tab bar`, `Home tab, 1 of 3`, `Anniversaries tab, 2 of 3`, `Settings tab, 3 of 3, selected`.
  - Metrics change only in line height (1.4: 16→22.4, 15→21, 13→18.2, title 30/42) and the removal of keep-all.
- **V0-set-notify · English:**
  - Back aria `Back`, title `Notifications` (17/23.8).
  - `Anniversary reminders`, `Time`: `9:00 AM`.
  - `Early reminder`: `None`, `1 day before` ✓, `3 days before`, `1 week before`.
  - `Remind me about`: `Our milestones`, `Birthdays`, `Seasonal days`, `Added by you two`.
  - Footer: `Reminders ring on this device only; Haru sets their own. Up to 50 upcoming days are scheduled on this device, and changes Haru makes are picked up when you open the app.`
- **V0-set-main · 日本語:**
  - `設定`. Initial `ド`. `ドダム`, `誕生日 · 3月14日` (note ` · ` with spaces).
  - `ふたり`:
    - `付き合った日`: `2025年6月29日`
    - `相手`: `ハル・つながっています`
    - `基準タイムゾーン`: `ソウル（UTC+9）` (full-width parentheses)
    - Footer: `日付が変わる時刻と通知時刻はこのタイムゾーンに従います。ふたりに適用されます。`
  - `通知`: `記念日の通知` (on), `通知時刻`: `午前9:00`, `事前通知`: `1日前`.
  - Tabs `ホーム` / `記念日` / `設定`.
  - a11y: `タブバー`, `ホームタブ、3件中1件目`, `記念日タブ、3件中2件目`, `設定タブ、3件中3件目、選択中`.
  - Fonts: Zen Maru Gothic everywhere, title Yomogi 30/48. Line heights 1.6: 16→25.6, 15→24, 14→22.4, 13→20.8, 18→28.8.
- Other screens have no en/ja frames. Use the copy table (§3 keys) for their strings.

### 3.14 Accessibility (as drawn)
- Back buttons: `aria-label="뒤로"` / `Back`.
- Alert: `role=alertdialog`, `aria-label` = title.
- Checkboxes: `role=checkbox` with `aria-checked`.
- The tab bar uses tablist/tab roles with the labels above.
- Icons, tiles, avatars and switch visuals are all `aria-hidden`.
- **Rows carry no explicit aria-label.** The row text is the name. Suggested (inferred): value rows read as `label, value` (existing `ListRow` does this); switch rows use `accessibilityRole="switch"` with the checked state; radio rows use selected state; danger rows announce as buttons.
- The main screen's touch targets are rows of at least 56. Buttons are at least 48. CTAs are 52.

---

## 4. Reused older screens: what this board says
| Ref | What V0-07 says | Detail on this board? |
|---|---|---|
| S13 settings | V0-set-* is "S13 설정의 V0 변형". It drops room day/night, AI consent, background photo and the separate high-contrast row. | Yes (this board) |
| S13 time-zone sheet | "화면 S13의 시간대 고르기 시트를 재사용해요." Reached from `기준 시간대`. It applies to both people; V0-00-flow says this happens after confirmation. | **No.** The sheet is not drawn. The existing code sheet (`set.room.tz.pick`, IANA list with search) is the S13 implementation, but its value display differs (board `서울 (UTC+9)` vs code IANA id). Whether a confirm step exists for time-zone changes: verify against board V0-set-main. |
| S14 end space | "연결 끊기 = S14 공간 종료와 같은 결과". Partner gets `V0-state-ended` on next open. V0-00-flow: the ended side can start again via `V0-start-choose`. | Only the confirm screen. The S14 progress, done and error screens are **not** drawn; the code has `end.progress`, `end.done.*`, `end.err.*`. The initiator's post-disconnect destination is not stated. |
| Account deletion progress / fail / done (S13 account flow) | Not mentioned on V0-07 apart from the confirm screen. | No. The code has `acct.delete.progress`, `acct.delete.fail.*`, `acct.delete.done`; the board neither confirms nor removes them. |
| S15 report/block | Removed from V1 settings. Use 문의하기 instead (owner to confirm). | n/a |
| S16 common states | Not referenced on V0-07. V0-03-states says the remaining common states (login expired, update required, no permission) stay "S16 그대로". | No |
| V0-state-ended | The partner's screen after a disconnect or delete. | Lives on the V0-03 board |

---

## 5. Existing `SettingsScreen.tsx` vs board: remove, hide or change for V1
| Existing (code, key) | Board evidence | Action |
|---|---|---|
| Section `set.sec.room` "방 · 두 사람에게 적용돼요": row `set.room.mode`, the 3 room-mode buttons, `set.room.mode.help` | Board note: "방 낮·밤 … 빼고". Flow: "방 낮·밤 설정" out of V1. | **Remove** |
| `set.room.tz` row (inside the room section) | It moves to `우리` as `기준 시간대` with value `서울 (UTC+9)` and the `set.us.tz.note` footer | **Move and relabel** |
| Section `set.sec.couple` "우리 공간": `set.together` 함께한 날짜 | Becomes `우리` › `사귄 날`, which opens V0-set-start. A partner row is added. | **Change** |
| `set.cover` 홈 배경 사진 | "배경 사진 … 빼고". Flow: S06 cover out. | **Remove** |
| Section `set.sec.ai`, `set.ai.consent` | "AI 처리 동의 … 빼고" | **Remove** |
| `set.sec.app` "이 기기의 화면": language **BottomSheet** with `set.lang.note` (방 문구 번역 안내) | Section is `화면`. Language is a **pushed screen** V0-set-lang; footer `이 기기에만 적용돼요.` | **Change**; drop `set.lang.note` |
| `set.theme` row + 3 inline mode buttons | Row `화면 모드` › pushed V0-set-mode radio list | **Change** |
| `set.hc` 고대비 row + `set.hc.help` | "고대비 별도 행은 빼고(고대비는 iOS 설정을 따름)" | **Remove** the row. Keep the automatic iOS high-contrast following in `preferences.tsx`. |
| `set.sec.account`: logout only, plus a logout Dialog (`set.logout.body` mentions "방") | 계정 = `Apple로 로그인함`, `로그아웃`, `연결 끊기`, `계정 삭제`. No logout dialog is drawn. | **Change.** Whether to keep a logout confirm: verify against board V0-set-main-2. If it is kept, its body copy needs rewording, because it still mentions 방. |
| `set.sec.info` 앱 정보: `set.about.version` "버전 {v}" as a label | `도움` › `버전` with the value `1.0.0 (12)` on the right | **Change** |
| `set.about.licenses` + licenses sheet | **Not on the board** | Hide per the board. This is a legal or owner question (§6). |
| `set.terms`, `set.privacy` (disabled rows) | Enabled rows with an external-link icon | **Change** (wire up URLs) |
| `set.support` "문의 · 신고" (`onOpenReport`) | `문의하기` (`set.help.contact`). Report and block are removed. | **Change** |
| Section `set.sec.danger` "공간": `set.end` 공간 종료 + `set.end.help` | Replaced by `연결 끊기` inside `계정`. There is no help text under it. | **Remove/replace** |
| `set.account.delete` with value `set.account.delete.sub` "되돌릴 수 없어요" | `계정 삭제` sits in `계정` with no value | **Change** (drop the sub-value) |
| New and missing in code: profile card (V0-set-me), `상대` row, the whole `알림` section and V0-set-notify, the `도움` header, `Apple로 로그인함` | Board | **Add** |

Component-level gaps (code vs board):
- **ListRow:**
  - Code: bare 22px icon, always shows a chevron, full-width bottom border, no horizontal padding.
  - Board: 32px `surface2` tile with an 18px icon, a trailing slot that can be a chevron, external-link, value only, switch, check or nothing, padding 16, divider inset left 16, label Noto Sans KR 500 (code uses the `body` variant, i.e. Gowun Dodum 400).
- **SectionLabel:** code is emphasis 14 with marginTop 8; board is 13/700, padding `0 6 6`, plus a group footer style.
- **Card:** code is padding 16, gap 8; board group is padding 0 with rows padded.
- **Title:** code is `AppText variant="title"` (28, display line height 1.25); board is Gaegu 30/45.
- **EndSpaceScreen:**
  - Code: `end.*` copy about 방·사진·장식, "•" bullets, 3 items, CTA `end.confirm` 공간 종료하기, checkbox 24 with `danger` fill.
  - Board: 4 items with warning icons, heading 26, no lead, CTA `연결 끊기`, checkbox 26 with **`primary`** fill.
- **DeleteAccountScreen:**
  - Code: card uses `dangerBg` with a `danger` border and check/warn icons. CTA `acct.delete.confirm` opens a re-auth BottomSheet (Kakao, Apple or email). Checkbox fill is `danger`.
  - Board: card `surface`/`divider` with warning triangles. One CTA, `Apple로 다시 로그인해 확인`, with the Apple glyph. Apple only. Apple note text. Checkbox fill `primary`.
  - `acct.delete.b2` copy is replaced by `set.delete.i2`.

---

## 6. Facts not determinable from the board
- What tapping the `알림` rows on main does: whether `알림 시간` and `미리 알림` open V0-set-notify or a picker directly, and which row leads to V0-set-notify (verify against board V0-set-main).
- Time-picker and date-picker UI for 알림 시간, 사귄 날 and 생일 (verify against boards V0-set-notify, V0-set-start, V0-set-me).
- V0-set-me:
  - Name max length: `2/10` implies 10, but there is no rule text.
  - Empty-name error, the 저장 disabled state and the unsaved-changes back behaviour.
  - Year field layout when `태어난 해도 넣기` is on.
  - Birthday "none" display.
- V0-set-start: the unchanged state, future-date validation, save pending/failure, and whether the alert appears on 저장 or before saving.
- Time-zone change: whether it also gets a confirm alert like the start date. The rules say both apply; only the start-date confirm is drawn.
- Notify:
  - The master-switch-off state.
  - Whether `알림 시간` is tappable in the denied state.
  - Whether the early-reminder group is hidden in the denied state by design or only on this frame (it is absent in the frame).
- Per-anniversary notification off: **not on this board**. Only per-kind switches appear.
- Logout confirmation (none drawn), logout result, and the disconnect/delete progress, failure and done screens. The post-disconnect destination for the initiator.
- Unchecked checkbox look and the CTA disabled style on disconnect and delete.
- 문의하기 target (mail, web or in-app). Privacy and terms URLs.
- License screen (`set.about.licenses`): absent from the board. Whether it is intentionally removed is an owner/legal call.
- Pressed/highlight states for rows. Focus rings.
- Dark colors for: danger rows on the main list, warn/info banners and chips, input borders, disabled switch, and the iOS alert (system dark alert assumed).
- en/ja frames for me, start, confirm, denied, lang, mode, disconnect and delete. Use the copy table.
- Exact hand-drawn corner jitter per element. Use the tokens with `cornerJitter` (each element's radii are listed in §2).
