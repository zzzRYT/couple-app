# V0-06 위젯 — design extract (implementation-grade)
Verified 2026-11-02: 64 claims checked, 9 corrected.

Source: board `V0-06-widgets.dc.html` (page "V0 · 위젯"), artifact https://claude.ai/artifact/M2WFQCFnVzoWbHNhJPCz5X version `1793598115-fafc`, read from slim copy `slim/V0-06-widgets.dc.slim.html`; icon path data read from the full board `artifact/project/V0-06-widgets.dc.html`. Icons are custom 24×24-viewBox stroke paths (not SF Symbols); glyphs listed in §6.1.
Copy keys: `copy-v0.md` (`widget.*`), `copy-v0.md` (`dday.*`, `anniv.*`, `date.*`, `app.name`).
Tokens: `apps/mobile/src/theme/tokens.ts`, `fonts.ts` (couple-app worktree).
Frame ids: the board names only two frames with ids: `V0-widget-context-home` and `V0-widget-context-lock`. Other frames are named here by their board caption (e.g. "밝게 · small · 기본"). Use that caption wherever this file says "verify against board".

Sample data used on every frame (the board's "today" is **2026-11-02, Mon**): start date 2025-06-29 → `D+492`; next = 빼빼로데이 11/11 (`D-9`); then 크리스마스 12/25 (D-53), 내 생일 3/14 (D-132), 처음 만난 날 5/17 (D-196), 2주년 6/29 (D-239). Names "도담 · 하루".
- Day-count rule checked against the data: D+N = (today − startDate in days) + 1, so the start date itself is D+1. 2025-06-29 → 2026-11-02 is 491 days, which gives D+492. The "오늘" frames show D+501 on 11/11.
- D-n = target − today in days. "N주년" falls on the start date's month and day, N years later (2주년 = 2027-06-29).

---

## 1. Board header, notes (verbatim ko) and global rules

**Header**: eyebrow `AROOM · V0 · D+DAY · 위젯`; title `V0-06 위젯 (홈 화면 · 잠금 화면)`.
> iOS 홈 화면 small · medium · large와 잠금 화면 circular · rectangular · inline이에요. D+N, 두 사람 이름, 다음 기념일과 남은 날, 오늘이 기념일인 상태, 연결 전·자리표시 상태를 그렸어요. Android는 다음 단계예요.

Section notes (verbatim):
- 홈 화면 위젯 · 외관 4종: "같은 정보를 full color · dark · tinted · clear로. tinted와 clear는 iOS가 배경을 바꾸고 색을 한 톤으로 칠해요(실기기 확인)."
- 상태: "오늘이 기념일 · 상대 연결 전 · 공간 없음 · 공간 끝남 · 자리표시(로딩)."
- 잠금 화면 위젯 (frame note): "왼쪽부터 circular 72×72 · (gauge 변형) · rectangular 160×72 · inline 234×26. iOS가 한 색으로 칠하니 그림·굵기·위치로 구분해요. 이름은 잠금 화면에 넣지 않아요."
- 맥락 예시: "홈 화면과 잠금 화면에 놓인 모습이에요. 배경과 시계는 맥락용 그림이에요."

### 1.1 크기 (pt · 바깥 경계) — verbatim note + table
> 출처: Apple HIG Widgets의 화면별 표(조사 보고서 cpl-v1-feasibility §1, 2026-11-02). 기기마다 크기가 달라요. 이 보드는 393×852 pt 기준으로 그렸어요. 코너 반지름(22pt로 그림)과 안쪽 여백, 3× px 내보내기 크기는 실제 기기와 현재 Apple HIG로 다시 확인해야 해요 — verify against current Apple HIG.

| 화면 pt | small | medium | large | circular | rectangular | inline |
|---|---|---|---|---|---|---|
| 393×852 (기준 · iPhone 15/16 등) | 158×158 | 338×158 | 338×354 | 72×72 | 160×72 | 234×26 |
| 390×844 | 158×158 | 338×158 | 338×354 | 72×72 | 160×72 | 234×26 |
| 430×932 / 428×926 | 170×170 | 364×170 | 364×382 | 76×76 | 172×76 | 257×26 |
| 414×896 | 169×169 | 360×169 | 360×379 | 76×76 | 160×72 | 248×26 |
| 375×812 | 155×155 | 329×155 | 329×345 | 72×72 | 157×72 | 225×26 |
| 375×667 | 148×148 | 321×148 | 321×324 | 68×68 | 153×68 | 225×26 |

Build the layouts flexibly (from `GeometryReader`/`widgetFamily`), not at fixed sizes. All frames were drawn at the 393×852 sizes.

### 1.2 누르면 어디로 (verbatim)
- small · circular · rectangular · inline: 위젯 전체가 하나의 대상 → 앱 홈(mopiru://home).
- medium · large: 기념일 행마다 Link → 그 기념일 상세(mopiru://anniversary/{id}), 나머지 자리 → 홈.
- 오늘이 기념일: 홈의 축하 카드로. 상대 연결 전: 홈의 초대 코드 카드로. 공간 없음·로그인 전: 앱 시작 화면.

Implementation: use `.widgetURL` on small/accessory widgets and `Link` on each medium/large row. The routes for "축하 카드", "초대 코드 카드" and "앱 시작 화면" are not written as URLs on the board (see §6).

### 1.3 갱신 (권장 · 실기기 확인 필요) (verbatim)
- 앱이 공간 시간대의 다음 자정들(예: 30일치)을 timeline 항목으로 미리 넣어 D+N·D-n이 자정마다 바뀌게 해요.
- 로그인·동기화 성공·기념일 변경·사귄 날 변경·앱이 앞으로 올 때 App Group 스냅샷을 새로 쓰고 reload를 요청해요.
- 상대가 바꾼 내용은 내 앱이 그 변경을 받은 뒤(앱을 열거나 열린 동안 Realtime)에야 위젯에 반영돼요. 위젯이 스스로 서버를 부르지 않아요.
- WidgetKit 예산 때문에 정확히 00:00:00 갱신을 보장하지 않아요. 여행·시간대 변경·DST·재부팅·오래 안 열기를 실기기로 시험해요.
- 로그아웃·연결 끊기·계정 삭제 때 스냅샷을 지우고 "공간 없음"으로 바꿔요.

### 1.4 구현 제약 (Expo SDK 58 expo-widgets) (verbatim)
- 위젯은 SwiftUI(Expo UI) 전용 별도 런타임이라 React Native 화면·hooks·앱 상태를 못 써요. 글자·도형·SF Symbols 같은 아이콘·번들 이미지만으로 그렸어요.
- 캔버스의 /_blob 그림은 런타임에 못 불러와요. 모피는 위젯 extension에 PNG로 번들할 때만 쓰고, 틴트·투명·잠금 화면에서는 단색 실루엣이 될 수 있어 빼요.
- 손글씨 글꼴(Gaegu·Yomogi)도 extension에 번들해야 해요. 못 하면 숫자는 SF Rounded로 대체(오너 확인).
- 공유 데이터(App Group): schemaVersion · spaceId · startDate · timeZone · 다가오는 기념일(제목·날짜·종류) · 이름 둘 · updatedAt. 토큰·메모·생일 연도는 넣지 않아요.

### 1.5 외관과 접근성 (verbatim)
- full color · dark · iOS 18 tinted · iOS 26 clear(Liquid Glass) · 잠금 화면 vibrant 단색을 모두 그렸어요. tinted/clear에서는 D+N 숫자와 하트만 accent 그룹(widgetAccentable)이에요.
- 색만으로 구분하지 않아요: 종류는 아이콘 모양, 오늘은 반짝이 아이콘 + "오늘" 글자, 연결 전은 시계 아이콘 + 글자.
- VoiceOver: 위젯 하나를 "함께한 지 492일째. 다음 기념일 빼빼로데이, D-9"처럼 한 문장으로 읽어요.
- 잠금 화면 위젯에는 이름을 넣지 않아요. 직접 추가한 제목은 privacySensitive로 표시해 잠금 상태 데이터 숨김 설정을 따르게 해요(오너 확인).

### 1.6 Android (Later) (verbatim)
- V1은 iOS만. Android 홈 화면 위젯은 다음 단계예요(Glance/AppWidget 또는 expo-widgets의 Android 지원).
- Android 잠금 화면 위젯은 기기에 따라 달라요: Google은 Pixel Tablet에 이미 있고 Android 16 QPR1부터 AOSP 폰·태블릿에 열린다고 안내해요. 제조사 지원·개인 정보 노출은 그때 다시 봐요.

### 1.7 위젯 갤러리 이름 · 설명 (verbatim)
- D+Day — 함께한 날과 다음 기념일을 보여 줘요. (small · medium · large · 잠금 화면 3종) → `widget.gallery.dday.name` / `.desc`
- 다가오는 기념일 — 다가오는 기념일을 날짜순으로 보여 줘요. (medium · large) → `widget.gallery.list.name` / `.desc`
- 갤러리 미리 보기는 예시 데이터가 아니라 자리표시(placeholder) 모양을 보여 줘요.

So there are **2 widget kinds**: `D+Day` with families systemSmall/Medium/Large and accessoryCircular/Rectangular/Inline, and `다가오는 기념일` with systemMedium/Large. The board draws only one medium layout and one large layout. It does not show whether the two kinds share them (see §6).

### 1.8 Fonts (as drawn; CSS stacks)
| role | ko / en stack | ja stack | weights used |
|---|---|---|---|
| display (big D+N / D-n numbers, today title) | `Gaegu, Gowun Dodum, Noto Sans KR` | `Yomogi, Zen Maru Gothic, Noto Sans JP` | 700 |
| emphasis (names, labels, titles, D-n) | `Noto Sans KR, Gowun Dodum` | `Zen Maru Gothic, Noto Sans JP` | 500, 600 (inline only), 700 |
| body (dates, "…부터", body lines) | `Gowun Dodum, Noto Sans KR` | `Zen Maru Gothic, Noto Sans JP` | 400 |
| lock screen (all text) | `Noto Sans KR, Gowun Dodum` (no Gaegu) | not drawn | 400/500/600/700 |

- Line height is always 1.25× the font size (11→13.8, 12→15, 13→16.2, 14→17.5, 16→20, 38→47.5, …).
- Fallback (board rule): if the extension can't bundle Gaegu/Yomogi, render the **numbers** in SF Rounded (`.fontDesign(.rounded)`). This needs owner confirmation.
- App bundle gaps (from `fonts.ts`): there are no NotoSansKR 500 or 600 assets (only 400 and 700). Yomogi exists only as 400, though the board draws it at 700. ZenMaruGothic exists only as 700, though the board uses 400 and 500. The widget extension needs its own font files either way.

### 1.9 Color → token map (all hex exact from board)
| hex | token | used for |
|---|---|---|
| `#FFF8EC` | `app.light.normal.surface` (= `room.day.glass`, widgetPresets cream) | light widget background |
| `#3F2D22` | `app.light.normal.text` | primary text, light |
| `#6B5444` | `app.light.normal.text2` | secondary text, light |
| `#B24A24` | `app.light.normal.primary` | heart, D-n, accent icons, light |
| `#E3CDB0` | `app.light.normal.divider` | divider lines, medium column rule, today-row pill bg (light) |
| `#4A3426` | `app.light.normal.line` / `illustration.outline` / `widgetOutline.ink` | kind-tile border + tile icon stroke (light **and dark**) |
| `#2B2320` | `app.dark.normal.bg` (also `room.night.wall`), not `dark.surface` `#352B26` | dark widget background |
| `#F7EBDD` | `app.dark.normal.text` | primary text, dark; skeleton color (dark) |
| `#CDB8A5` | `app.dark.normal.text2` | secondary text, dark |
| `#F0A67F` | `app.dark.normal.primary` | heart, D-n, accent icons, dark |
| `#4A3D36` | `app.dark.normal.divider` | dividers + today-row pill bg, dark |
| `#AACBE2` / `#A8C6A0` / `#F7D98B` / `#C9B8E8` / `#F2A7B4` | `illustration.palette.sky / sage / butter / lav / pink` | kind-tile fills (same in light and dark) |
| `#F6D7B8`, `rgba(246,215,184,.72)`, `rgba(246,215,184,.3)`, bg `rgba(24,19,16,.62)` | **no token** (tinted simulation) | tinted mock |
| `#FFFFFF`, `rgba(255,255,255,.82/.72/.35/.3/.2/.16/.5)` | none (system vibrant/clear simulation) | clear + lock mocks |
| `#FBF1E3` | `app.light.normal.bg` | app icon tile in home context |

High-contrast token variants are not drawn for widgets.

---

## 2. Per family

Common to all home-screen widgets: radius 22 (drawn; the system container clips in practice), `overflow:hidden`, flat with no shadow. Text is single-line with tail ellipsis (`lineLimit(1)`, `.truncationMode(.tail)`) unless the row says "wrap".
Kind tile = a rounded square with a 1.5px `#4A3426` border, filled with a palette color, holding a 2px-stroke `#4A3426` line icon. Its corners are hand-drawn and jittered: about 0.30–0.35 × size, with each corner different (e.g. 22px tile: `6.6 7.6 7.7 6.6 / 7.5 7.0 7.0 7.9`). In SwiftUI, approximate this with a `RoundedRectangle(cornerRadius: ≈0.32×size)`.

Row tile colors as drawn (same in every appearance that shows tiles):
| row title | tile fill |
|---|---|
| 빼빼로데이 (`anniv.pepero`) | `#AACBE2` sky |
| 크리스마스 (`anniv.christmas`) | `#A8C6A0` sage |
| 내 생일 (`anniv.birthday.me`) | `#F7D98B` butter |
| 처음 만난 날 (no copy key; user/custom?) | `#C9B8E8` lav |
| 2주년 (`anniv.years`) | `#F2A7B4` pink; its icon contains `circle cx12 cy9 r5` (medal-like) |

The rule that maps kind or item to tile color is not stated. 빼빼로데이 and 크리스마스 are both seasonal but get different colors, so the rule is per-item or per-icon. Verify against board "밝게 · large · 다가오는 5개 + 모피" and the V0-04 anniv board.

### 2.1 systemSmall — 158×158, padding 14, VStack
Three variants: 기본, 다음 기념일 강조, 모피.

**A. small · 기본 (D+N · 다음 기념일)**: aria `widget.a11y` "함께한 지 492일째. 다음 기념일 빼빼로데이, D-9"
1. HStack gap 4: filled heart 12×12 (fill = stroke = primary) + names "도담 · 하루" (Noto KR 12/700, text, ellipsis). Name format is `{name1} · {name2}`; no copy key.
2. Flex-1 block, vertically centered:
   - "함께한 지" `dday.together` (Noto KR 11/500, text2)
   - "D+492" `dday.big` (Gaegu 38/700, text). EN "Day 492" Gaegu 38; JA "492日目" Yomogi 32.
3. Divider 1px, divider color, margin-bottom 7.
4. HStack gap 6: line icon 14 (primary stroke, stroke 2; the item's kind glyph, here the Pepero sticks) + title "빼빼로데이" (Noto KR 12/700, text, flex 1, ellipsis) + "D-9" `dday.left` (Noto KR 12/700, primary). EN "In 9 days", JA "あと9日".

**B. small · 다음 기념일 강조**
1. "다음" `widget.next` (Noto KR 11/500, text2). JA "次へ".
2. Title "빼빼로데이" (Noto KR 16/700, text, ellipsis).
3. Flex-1 block, vertically centered: "D-9" (Gaegu 40/700, **primary**). EN "In 9 days" and JA "あと9日" shrink to **26**.
4. HStack, space-between, gap 6: date "11월 11일 (수)" `date.short` (Gowun 11/400, text2) | "D+492" (Noto KR 11/700, text).

**C. small · 모피 (번들 이미지)**: only in light and dark. Tinted and clear omit it (§1.4).
1. Heart 12 + names (as in A).
2. "D+492" (Gaegu 32/700, text, margin-top 4). JA Yomogi 26.
3. Mascot, absolutely positioned at `right:-6, bottom:-4`. Box 86×86; image drawn 91.8×80.8 at `left:-2.9, bottom:3.4`, overflowing the box.
4. Spacer.
5. "D-9" (Noto KR 12/700, primary).
6. Title "빼빼로데이" (Noto KR 11/500, text2, **max-width 70**, ellipsis), which keeps it clear of the mascot.

Mascot asset: the single blob `/_blob/2af6794870da9a488e87b623bc0ff9bc` (same image in every size), alt "" / aria-hidden. Pose id is not stated; verify against board "밝게 · small · 모피 (번들 이미지)". The image is the same in dark mode. It is decorative, so leave it out of the VoiceOver sentence.

### 2.2 systemMedium — 338×158, padding 14
aria `widget.a11y`. HStack gap 2, full height.
- **Left column** (fixed width 128, VStack):
  1. Heart 12 + names (Noto KR 12/700).
  2. Flex-1 centered block: "함께한 지" (11/500 text2) + "D+492" (Gaegu 36/700 text). JA Yomogi 30.
  3. "2025.06.29부터" `dday.since` with date written `yyyy.MM.dd` (Gowun 11/400 text2). EN "Since 2025.06.29", JA "2025.06.29から".
- **Right column** (flex 1, padding-left 12, left border 1px divider, VStack gap 9):
  1. Header "다가오는 기념일" `widget.gallery.list.name` (Noto KR 11/**700**, text2). EN "Coming up", JA "もうすぐの記念日".
  2. **3 rows**, each an HStack gap 7: kind tile 22×22 (icon 12) + title (Noto KR 13/**500**, text, flex 1, ellipsis) + D-n (Noto KR 13/700, primary). Rows show no date.
- No mascot in medium.

### 2.3 systemLarge — 338×354, padding 18
aria `widget.a11y`.
1. Top HStack, gap 8, align top:
   - Left (flex 1):
     - Heart **13** + names (Noto KR 13/700 text).
     - "D+492" (Gaegu **46**/700 text, margin-top 2). JA Yomogi 36.
     - "2025년 6월 29일부터" (Gowun 12/400 text2): the long date without weekday, + `dday.since`. EN "Since Jun 29, 2025", JA "2025年6月29日から".
   - Right: mascot box 96×96 with margin `-6 -6 0 0` (pushed into the top-right corner); image 102.4×90.2 at `left:-3.2, bottom:3.8`. **Dropped in tinted and clear** (caption "다가오는 5개 (모피 없음)").
2. Divider 1px, margin `12 0 10`.
3. "다가오는 기념일" (Noto KR 12/700 text2, margin-bottom 8).
4. **5 rows**, VStack gap 9. Each row is an HStack gap 9:
   - kind tile 26×26 (icon 14)
   - VStack: title (Noto KR 14/**700** text, ellipsis) + date `date.short` "11월 11일 (수)" (Gowun 11/400 text2)
   - D-n (Noto KR 14/700 primary)

### 2.4 Home-screen appearances (same layout, colors swap)
| element | full color (light) | dark | tinted iOS 18 (mock) | clear iOS 26 (mock) |
|---|---|---|---|---|
| widget bg | `#FFF8EC` | `#2B2320` | `rgba(24,19,16,.62)` (system) | `rgba(255,255,255,.16)` + 1px `rgba(255,255,255,.5)` border (system glass) |
| primary text | `#3F2D22` | `#F7EBDD` | `#F6D7B8` | `#FFFFFF` |
| secondary text | `#6B5444` | `#CDB8A5` | `rgba(246,215,184,.72)` | `rgba(255,255,255,.82)` |
| accent (heart, D-n, icons) | `#B24A24` | `#F0A67F` | `#F6D7B8` (same as text) | `#FFFFFF` |
| divider / column rule | `#E3CDB0` | `#4A3D36` | `rgba(246,215,184,.3)` | `rgba(255,255,255,.35)` |
| kind tile | palette fill + `#4A3426` border | **same as light** | **no tile**: bare line icon, 20px (medium) / 24px (large) in the 22/26 box | same as tinted |
| mascot | yes (small C, large) | yes | **no** | **no** |
| small variants drawn | 기본, 다음, 모피 | 기본, 다음, 모피 | 기본, 다음 | 기본, 다음 |

The tinted and clear colors are simulations. In code, use `.primary`/`.secondary` hierarchy, put **only the D+N number and the heart** in `.widgetAccentable()`, and switch on `widgetRenderingMode` (`.fullColor` vs `.accented`/`.vibrant`) to drop tiles and the mascot.

### 2.5 accessoryCircular — 72×72 (vibrant mono)
Background `rgba(255,255,255,.2)` circle, equivalent to `AccessoryWidgetBackground()`.
- **보통**: centered VStack:
  - filled heart 11
  - "D+" `widget.lock.days` (Noto KR 10/700, 72% white). EN "Day".
  - "492" (Noto KR 22/700 white, `tabular-nums`)
  - aria `dday.a11y` "함께한 지 492일째, 2025년 6월 29일부터"
- **Gauge variant**: transparent background. Ring r=31 (in a 72 box), stroke 5, track `rgba(255,255,255,.3)`, progress `#FFFFFF` with round cap, starting at 12 o'clock and running clockwise. The drawn dasharray is `136.3 194.8`, about **70%**. Center:
  - line icon 13 (stroke 2.2, the next item's kind glyph: Pepero sticks)
  - "D-9" (Noto KR 17/700). EN "In 9 days" at **12**/700.
  - aria "빼빼로데이, 11월 11일 (수), D-9"
  - What the gauge measures is not stated. 70% matches (30−9)/30, but that is unconfirmed (§6).
- **오늘**: line icon 18 (stroke 2.2; 4-point sparkle glyph) + "오늘" `dday.today` (Noto KR 15/700). EN "Today". aria `widget.today`.
- **연결 전**: same as 보통.
- **자리표시**: two bars, 40×10 (r5) and 28×8 (r4), with a 6pt spacer between; white at 30% opacity. aria "불러오는 중이에요" / EN "Loading".

### 2.6 accessoryRectangular — 160×72
Padding `6 4`, VStack gap 2, vertically centered, left aligned.
| state | row 1 | row 2 | row 3 |
|---|---|---|---|
| 보통 | filled heart 13 + "D+492" (Noto KR 16/700) | "빼빼로데이" (13/500 white) | "D-9 · 11월 11일" `dday.left` + `date.md` (13/400, 72% white) |
| 오늘 | 4-point sparkle line icon 14 (stroke 2.2) + "오늘은 빼빼로데이" `widget.today` (15/700) | "D+501" (13/500, 72%) | — |
| 연결 전 | heart 13 + "D+492" (16/700) | "상대 연결 전" `widget.pending` (13/500, 72%) | — |
| 자리표시 | bar 50%×12 | bar 80%×10 | bar 65%×10 (r5, white .3) |

EN 보통: "Day 492" / "Pepero Day" / "In 9 days · Nov 11". EN 오늘: "Today: Pepero Day" / "Day 501".
Names never appear. Set the custom title `.privacySensitive()` (§1.5).

### 2.7 accessoryInline — 234×26
HStack gap 5, centered: filled heart 13 + one text line (Noto KR **15/600**, white, ellipsis).
| state | text ko | text en |
|---|---|---|
| 보통 | `D+492 · 빼빼로데이 D-9` | `Day 492 · Pepero Day In 9 days` |
| 오늘 | `오늘은 빼빼로데이` | `Today: Pepero Day` |
| 연결 전 | `D+492 · 상대 연결 전` | `Day 492 · Partner not joined` |
| 자리표시 | drawn **with the normal text** (`D+492 · 빼빼로데이 D-9`); no skeleton | same |

iOS renders inline as system text plus one image. The font and size here are illustrative only.

### 2.8 Lock vibrant colors
White `#FFFFFF` is the primary. Secondary is `rgba(255,255,255,.72)`. Circle bg `.2`, gauge track `.3`, skeleton `.3`. The board backdrop `#33415C` is canvas only. In code, use `.primary`/`.secondary` under `.vibrant` rendering.

---

## 3. States (drawn: light and dark home, vibrant lock; tinted/clear states not drawn)

| state | small | medium | large | circular | rectangular | inline |
|---|---|---|---|---|---|---|
| 보통 | A/B/C §2.1 | §2.2 | §2.3 | §2.5 (plain + gauge) | §2.6 | §2.7 |
| 오늘이 기념일 | drawn ↓ | drawn ↓ | **not drawn** | drawn | drawn | drawn |
| 상대 연결 전 | drawn ↓ | drawn ↓ | not drawn | drawn | drawn | drawn |
| 로그인 전 / 공간 없음 | drawn ↓ | not drawn | not drawn | not drawn | not drawn | not drawn |
| 공간이 끝남 | drawn ↓ | not drawn | not drawn | not drawn | not drawn | not drawn |
| 자리표시 (갤러리·로딩) | drawn ↓ | drawn ↓ | drawn ↓ | drawn | drawn | normal text |

**small · 오늘이 기념일** (aria "오늘은 빼빼로데이" = `widget.today`)
1. HStack, space-between, align top:
   - the item's kind tile, 30×30 (fill `#AACBE2` for 빼빼로데이, 1.5px line border, icon 16)
   - sparkle 22×22 (symbol `#obj_shape_sparkle`, viewBox 64, from the full board): two 4-point stars, the large one filled `#F7D98B` (butter), the small one filled `#FFF4DF` (`illustration.rim`), both outlined `#4A3426` (stroke 2.4 / 2) over a `#FFF4DF` rim. Same in dark.
2. Flex-1 block, bottom-aligned, gap 2:
   - "오늘은 " (Noto KR 12/500 text2)
   - "빼빼로데이" (Gaegu **19**/700 text)
   - "D+501" (Noto KR 13/700 primary)

The `widget.today` template "오늘은 {title}" is split across two lines here. EN/JA versions of this frame are not drawn.

**medium · 오늘이 기념일** (aria "함께한 지 501일째. 다음 기념일 빼빼로데이, 오늘", i.e. `widget.a11y` with `{left}` = `dday.today`)
- The left column is unchanged (D+501).
- Right column, first row: a highlight pill (padding `5 8`, radius 10, bg divider color: `#E3CDB0` light / `#4A3D36` dark) holding a 4-point sparkle line icon 16 (primary stroke) and "오늘은 빼빼로데이" (Noto KR 13/700 text, ellipsis). The pill has no D-n.
- Then 2 normal rows (크리스마스 D-44, 내 생일 D-123), still 3 rows in total.

**small · 상대 연결 전** (aria "상대 연결 전")
1. "함께한 지" (11/500 text2)
2. "D+492" (Gaegu 32/700 text)
3. Spacer.
4. HStack gap 5: clock icon 14 (stroke 2.2, primary; circle r9 + hands) + "상대 연결 전" `widget.pending` (Noto KR 12/700 primary).
5. "앱에서 초대 코드를 보내요" `widget.pending.body` (Gowun 11/400 text2, **wraps**).

No names. D+N is still shown, so startDate exists before the partner joins.

**medium · 상대 연결 전** (aria: the normal `widget.a11y`)
- Names read "도담 · 상대". The partner name is replaced by "상대", which has no copy key.
- The left-column bottom shows clock 13 + "상대 연결 전" (Noto KR 11/700 primary) in place of the since-date.
- The right column is the normal 3-row list.

**small · 로그인 전 / 공간 없음** (aria "모피루를 시작해요")
1. Outline heart icon 26 (primary stroke 2, no fill).
2. Spacer.
3. "모피루를 시작해요" `widget.none.title` (Noto KR 15/700 text, wraps).
4. "앱을 열어 둘의 공간을 만들어요" `widget.none.body` (Gowun 11/400 text2, wraps).

**small · 공간이 끝남** (aria "공간이 끝났어요")
1. Broken-link icon 24 (two chain links with a diagonal slash; **text2** stroke 2).
2. Spacer.
3. "공간이 끝났어요" `widget.ended` (15/700 text, wraps).
4. "모피루" `app.name` (Gowun 11/400 text2).

**자리표시** (aria "불러오는 중이에요"; no copy key)
Skeleton bars are the primary text color at **opacity .16**: `#3F2D22` light, `#F7EBDD` dark. Rounded ends: radius = floor(h/2) as drawn (10→5, 8→4, 9→4, 12→6, 14→7, 30→15, 40→20).
- **small**: VStack gap 8 with [70%×10, 40%×8], then a flex-1 centered 80%×30, then a 90%×10 at the bottom.
- **medium**:
  - HStack gap 14.
  - Left column, width 128, VStack gap 10: 80%×10, 50%×8, 90%×30, 60%×8.
  - Right column, VStack gap 14, padding-top 4: 60%×9, then 3 × (100%×12).
- **large**: padding 18, VStack gap 12: 40%×10, 60%×40, 50%×9, a 14pt spacer, 35%×9, then 5 × (100%×14).

In SwiftUI, the system `.redacted(reason: .placeholder)` is the likely path, but the board draws explicit bars; the owner should choose.

Dark-state differences: only the colors swap per §2.4. The ended icon uses `#CDB8A5` and the none icon uses `#F0A67F`.

---

## 4. Context frames and localization

**`V0-widget-context-home`** ("홈 화면에 small + medium", iOS · 홈 화면 · 한국어)
- Phone 390×844, radius 44, wallpaper `#C9B8E8` with a pink `#F2A7B4` blob (opacity .55).
- Content padding `70 26 0`, gap 26.
  - Row 1 (HStack gap 22): small 기본 + a 2×2 grid of 62pt app icons (grid gap 26). The first icon is the app icon: `#FBF1E3` tile, radius 15, mascot 68.3×60.2.
  - Row 2: medium (normal).
  - Then a 4-column icon grid (gap 26/22) and a dock (inset 12, bottom 14, h 92, r 32, `rgba(255,255,255,.35)`).
- Shows the light widget on a colored wallpaper with no special treatment.

**`V0-widget-context-lock`** ("잠금 화면에 inline + circular ×2 + rectangular", iOS · 잠금 화면 · 한국어)
- Wallpaper `#7FA7C6` with a sage hill and a sun.
- The inline widget sits in the date row: "11월 2일 월요일" (system 17/600), gap 8, then inline "D+492 · 빼빼로데이 D-9".
- Clock "9:41" (92/600).
- Below the clock, a row with gap 14 and margin-top 12: circular plain (D+ 492), circular gauge (D-9), rectangular (normal).

**EN / JA (light only; home families only)**: the layout is structurally identical to KO (diffed). Lock frames are drawn in KO and EN only. No JA lock frames exist.
| item | ko | en | ja |
|---|---|---|---|
| names | 도담 · 하루 | Dodam · Haru | ドダム · ハル |
| together | 함께한 지 | Together | 一緒に過ごして |
| big count (`dday.big`) | D+492 | Day 492 | 492日目 |
| D-n (`dday.left`) | D-9 | In 9 days | あと9日 |
| next (`widget.next`) | 다음 | Next | 次へ |
| since, medium | 2025.06.29부터 | Since 2025.06.29 | 2025.06.29から |
| since, large | 2025년 6월 29일부터 | Since Jun 29, 2025 | 2025年6月29日から |
| row date (`date.short`) | 11월 11일 (수) | Wed, Nov 11 | 11月11日(水) |
| list header | 다가오는 기념일 | Coming up | もうすぐの記念日 |
| a11y | 함께한 지 492일째. 다음 기념일 빼빼로데이, D-9 | Day 492 together. Next: Pepero Day, In 9 days | 一緒に492日目。次の記念日はペペロデー、あと9日 |
| titles | 빼빼로데이/크리스마스/내 생일/처음 만난 날/2주년 | Pepero Day/Christmas/My birthday/The day we met/2-year anniversary | ペペロデー/クリスマス/私の誕生日/初めて会った日/2周年 |

Overflow handling, as drawn: the layout never reflows. Long strings either shrink to a fixed smaller size or get ellipsis.
| slot | ko | en | ja |
|---|---|---|---|
| small A big number | Gaegu 38 | Gaegu 38 | **Yomogi 32** |
| small B D-n | Gaegu 40 | **Gaegu 26** | **Yomogi 26** |
| small C number | Gaegu 32 | Gaegu 32 | **Yomogi 26** |
| medium number | Gaegu 36 | Gaegu 36 | **Yomogi 30** |
| large number | Gaegu 46 | Gaegu 46 | **Yomogi 36** |
| lock gauge D-n | 17 | **12** ("In 9 days") | not drawn |

- All other sizes are identical across languages.
- EN/JA use the same 1.25 line height.
- In SwiftUI, prefer `.minimumScaleFactor` with these sizes as targets, or fixed per-locale sizes, to match the board.
- Lock circular `widget.lock.days`: ja is "日目", a **suffix**, but the circular layout puts the label above the number. The JA layout is not drawn (§6).

---

## 5. Drawn data needs

| field | used by | format / notes |
|---|---|---|
| `startDate` (+ `timeZone`) | D+N everywhere; "…부터" | D+N = days(start→today in space TZ) + 1; since-date shown as `yyyy.MM.dd` (medium) or long date without weekday (large) |
| `today` in space TZ | D+N, D-n, today state | timeline entries at each local midnight (§1.3) |
| names ×2 | small A/C, medium, large (home only) | "{me} · {partner}"; partner missing → "상대" (medium pending) |
| partner joined? (bool) | pending state | drives clock + `widget.pending` |
| space status: none/logged-out, ended, active | none/ended states | |
| upcoming anniversaries, sorted by date asc | small (1), medium (3), large (5), lock (1) | each needs `id` (deep link), `title`, `date` (y-m-d), `kind` (tile color + icon), D-n |
| title localization source | all | system kinds use copy keys (`anniv.pepero`, `anniv.christmas`, `anniv.birthday.me`, `anniv.years`); custom title is raw text (privacySensitive) |
| is-today flag for next item | today state | `D-0` renders as "오늘은 {title}" / "오늘", plus D+N shown under it |
| weekday | `date.short` in rows, small B | locale weekday short (수 / Wed / 水) |
| gauge progress 0–1 | lock circular gauge | definition unknown (§6) |
| `updatedAt`, `schemaVersion`, `spaceId` | not drawn; listed in the App Group note | — |

Not stored, per the note: tokens, memos, birth year.

---

## 6. Facts that could NOT be determined (verify against board)

1. **Icon glyphs** (read from path data in the full board; custom paths, no SF Symbol names given, so the coder must pick symbols or bundle the paths):
   - heart: names row / lock (filled), none state (outline)
   - 빼빼로데이: two diagonal sticks with thick coated tops (also small A next-item icon, gauge center, small-today tile)
   - 크리스마스: tiered tree with trunk · 내 생일: cake with candle flame · 처음 만난 날: 5-point star · 2주년: medal (circle + ribbon)
   - today (medium pill, circular, rectangular): 4-point sparkle · pending: clock (circle r9 + hands) · ended: broken link
   The SF Symbol choice is not on the board (owner).
2. **Sparkle** `#obj_shape_sparkle` (small today): a multi-color illustration (colors in §3); it cannot be accent-tinted as one glyph. Tinted/clear treatment is not drawn.
3. **Mascot pose id** and the PNG export size for blob `2af6794870da9a488e87b623bc0ff9bc`. Verify against board "밝게 · small · 모피 (번들 이미지)".
4. **Kind → tile color/icon mapping rule**: only per-item colors and glyphs are visible (§2, §6.1).
5. **Which kind "처음 만난 날" is** (custom vs milestone). It has no copy key.
6. **Gauge meaning** and its progress formula. The drawn value is 70%.
7. **Widget kinds vs layouts**: does the "다가오는 기념일" kind reuse the D+N medium/large layout, or does it have a list-only layout? Only one medium and one large are drawn.
8. **States not drawn**:
   - large: today, pending, none, ended
   - medium: none, ended
   - lock: none, ended
   - every state in tinted/clear
   - every EN/JA state frame and the JA lock frame
9. **Placeholder inline**: the board shows real text, not a skeleton. Intended?
10. **Deep-link URLs** for 축하 카드, 초대 코드 카드 and 앱 시작 화면. Only `mopiru://home` and `mopiru://anniversary/{id}` are given.
11. **Copy keys missing** for: "불러오는 중이에요" / "Loading", the partner placeholder "상대", the name separator " · ", the `yyyy.MM.dd` since-date format, and the long date without weekday.
    - `widget.next` ja "次へ" is a reused button label. "次" or "次の記念日" may fit better (owner).
12. **Real corner radius and padding** per device. The board drew 22 / 14 / 18 at 393pt and says to verify against current Apple HIG. Scaling for the 170/169/155/148 sizes is not drawn.
13. **Font bundling decisions**: Gaegu/Yomogi in the extension vs SF Rounded fallback (owner confirmation), and the missing weights (§1.8).
14. **privacySensitive scope**: the board says custom titles only, needs owner confirmation, and doesn't say whether built-in titles or D-n are redacted.
15. **"N주년" and "N일" milestone generation** (`anniv.years`/`anniv.days`): their presence in the list is drawn, but the generation rules are not on this board.
