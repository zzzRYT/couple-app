# V0-01 시작 (로그인 · 연결) — design extract
Verified 2026-11-02: 112 claims checked, 7 corrected.

Source: artifact M2WFQCFnVzoWbHNhJPCz5X v1793598115-fafc, board `V0-01-start.dc.html` (slim copy + original for SVG paths). All px = pt at 1x (390×844 frame).
Token shorthand: `L.x` = `color.app.light.normal.x`, `D.x` = `color.app.dark.normal.x`, `pal.x` = `color.illustration.palette.x`.

## 1. Board header facts

- Eyebrow: `AROOM · V0 · D+DAY · 시작`. Page `<title>`: `V0 시작 · 로그인 · 연결`. H1: `V0-01 시작 (로그인 · 연결)`.
- Description (verbatim): "V0의 첫 경험이에요. Apple 로그인 하나, 사귄 날 입력, 내 이름과 생일, 그리고 S03~S05의 초대·참여 동작을 그대로 써요. 만든 초대 코드는 홈에서도 계속 보여요(PR 26)."
- Section 1 `iOS · 밝은 앱 · 한국어`, flow text (verbatim):
  - 만드는 사람: 소개 → 시작 방법 → 사귄 날 → 이름·생일 → 초대 코드 → 홈(상대 대기).
  - 초대받은 사람: 소개 → 시작 방법 → 코드 입력 → 참여 확인 → 이름·생일 → 연결 완료 → 알림 안내.
- Section 2 `iOS · 어두운 앱 · 한국어` (intro, date, invite, connected).
- Section 3 `영어 · 일본어 (주요 화면)`: "번역으로 길어진 문구가 잘리지 않고 줄바꿈되는지 봐요." (intro en, intro ja, date en, notify ja-dark).
- Section 4 `규칙 · 재사용`: three cards (verbatim in §4 below). No drawn flow arrows; order = frame order + flow text.
- Light frame order: intro, choose, date, date-picker, date-future, profile, profile-err, invite, enter, found, connected, notify, notify-os.

Rules card "V0에서 달라진 점" (verbatim):
- S01 3장 소개를 1장으로 줄였어요. 방·프롬프트 소개는 빠져요.
- "함께한 날짜" 대신 "사귄 날"이라고 불러요. 1일째(D+1) 규칙을 입력 화면에서 바로 보여 줘요.
- 공간 만들기 다음에 이름·생일을 받아요. 생일은 건너뛸 수 있고, 태어난 해는 선택이에요(양력).
- 초대받은 사람은 코드 확인 → 참여 → 이름·생일 → 연결 완료 순서예요.
- 알림 권한은 앱 첫 화면에서 묻지 않아요. 연결이 끝난 직후 사전 안내를 한 번 보여 주고, "알림 켜기"를 눌렀을 때만 iOS 권한 창을 띄워요.

Rules card "접근성 · 모션" (verbatim, card bg `L.infoBg` #E1EDF5, border 2 `L.info` #2D5E86):
- 모든 버튼과 칸은 48pt 이상, 위 47 · 아래 34 안전 영역을 비워요.
- 연결 완료의 모피는 S29의 깡총(cpl-hop)·반짝임(cpl-twinkle)을 쓰고, 동작 줄이기가 켜지면 이 그림처럼 멈춰 있어요.
- 글자 200%에서는 내용이 스크롤되고 아래 버튼은 고정돼요(S20 규칙).

## 2. Global frame facts

### 2.1 Frame & chrome
| Item | Value |
|---|---|
| Device frame | 390×844, radius 44, ring `0 0 0 6px` #E3CDB0 (=`L.divider`) light / #4A3D36 (=`D.divider`) dark — mockup only |
| Screen bg | light #FBF1E3 `L.bg`; dark #2B2320 `D.bg` |
| Status bar | 47 top area left empty (no clock/battery drawn). Dynamic Island mock: top 11, 124×36, r18, #000 |
| Home indicator | bottom 8, 134×5, r3, color `L.text`/`D.text`, opacity .85 (system; don't draw) |
| Safe areas | top 47, bottom 34 (= `tokens.safeArea.ios`) |
| Screen without nav bar | 47px spacer at top (intro, connected, notify, notify-os) |
| Nav bar (with back) | row `padding:51 8 4`, min-height 48, gap 4. Left slot min-w 48 → back button 48×48, transparent, r999, chevron 26px stroke `L.text` w2.2, aria-label `뒤로` / en `Back` (`common.back`). Center: title text 17/25.5 Noto Sans KR 700 `L.text` — **empty on every screen**. Right slot: 48 spacer |
| Content area | flex 1, `padding: 8 20 0`, column, gap 16, overflow hidden (200% text → scroll, per S20) |
| Footer | flex none, `padding: 12 20 42` (42 = 34 safe + 8), column, gap 6; pinned |

### 2.2 Fonts (ko frames: base family `'Gowun Dodum','Noto Sans KR'`; `word-break: keep-all` on all ko text)
| Role | Family / weight | Size / line-height | Color | Token note |
|---|---|---|---|---|
| Screen title | Gaegu 700 | 26 / 39 | `L.text` | no scale token at 26 (`title`=28, `heading`=20) |
| Big title (intro name, connected) | Gaegu 700 | 28 / 42 | `L.text` | `title` (28/700 display) |
| Notify title | Gaegu 700 | 24 / 36 | `L.text` | no token |
| Found "{name}님의 공간이에요" | Gaegu 700 | 20 / 30 | `L.text` | `heading` |
| D+ number | Gaegu 700 | 56 / 64.4 | `L.text` | `display` (56) |
| Body / subtitle | Gowun Dodum 400 | 15 / 22.5 | `L.text2` | no token (body=16, bodySm=14) |
| Body 16 (connected body, field text) | Gowun Dodum 400 | 16 / 24 | text2 / text | `body` |
| Body 14 (card body, hint) | Gowun Dodum 400 | 14 / 21 | `L.text2` | `bodySm` |
| Small 13 (counter, profile hint) | Gowun Dodum 400 | 13 / 19.5 | `L.text2` | no token |
| Caption 12 (terms) | Gowun Dodum 400 | 12 / 18 | `L.text2` | `caption` |
| Field label | Noto Sans KR 700 | 14 / 21 | `L.text` (invite label: text2) | `emphasisStyle(14)` |
| Button label | Noto Sans KR 700 | 16 / 24 | per variant | `label` is 16/600 — board uses 700 |
| Card title (choose, picker title, names) | Noto Sans KR 700 | 18 / 27 | `L.text` | no token |
| Feature row / toggle label | Noto Sans KR 500 | 15 / 22.5 | `L.text` | no token |
| Slogan, expiry | Noto Sans KR 500 | 13 / 19.5 | `L.text2` | no token |
| Chip / error text | Noto Sans KR 700 | 13 / 19 (chip) · 13 / 19.5 (error) | success / danger | `emphasisStyle(13)` |
| Code cell char | Noto Sans KR 700 | 20 | `L.text` | — |
| iOS system UI (notification, alert) | -apple-system / SF Pro Text | see screens | system | no token |
- en: same families as ko, line-height ×1.4 (26→36.4, 15→21, 14→19.6, 17→23.8, 20→28, 12→16.8), no keep-all.
- ja: frame family `'Zen Maru Gothic','Noto Sans JP'`; display = `Yomogi` (board CSS says 700, but Yomogi ships only 400 and S19 forbids faux bold → render 400); body/buttons = Zen Maru Gothic; line-height ×1.6 (28→44.8, 26→41.6, 24→38.4, 15→24, 13→20.8, 12→19.2); `line-break: strict`. NB app `typography.ts` maps ja body → NotoSansJP; board uses Zen Maru Gothic for body.

### 2.3 Radii, borders, shadows
- Hand-drawn corner jitter everywhere (≈±12%, `radius.cornerJitter`). Nominal: buttons ≈26 (52h) / ≈24 (48h) → `radius.pill`; fields/date segments ≈16 → `radius.input`; cards ≈20–22 → `radius.card`; sheet 28/30 top → `radius.sheet`; icon tiles 36→≈12, 48→≈16; code cells r10; picker band r12.
  - exact strings: primary btn `29.1 24.4 28.1 28.6 / 24.4 27.6 26 26`; 48h btn `26.9 22.6 25.9 26.4 / 22.6 25.4 24 24`; date segment `17.9 15 17.3 17.6 / 15 17 16 16`; name field `15 17.3 17.6 15 / 17 16 16 17.9`; choose card `24.6 20.7 23.8 24.2 / 20.7 23.3 22 22`; code/found card `20 22.4 18.8 21.6 / 22 18.8 21.2 20`; notify preview card `22.6 25.9 26.4 22.6 / 25.4 24 24 26.9`.
- Borders: 2 (controls, cards, cells), 1.5 (icon tiles, chips, picker band), 1 (Apple button), 0.5 (iOS alert separators). `border.outline.normal`=2.
- Shadows: none on app UI. Only system mocks: notification bubble `0 4 14 rgba(0,0,0,.10)`; iOS switch knob `0 2 4 rgba(0,0,0,.18)`.

### 2.4 Color → token map
| Hex | Token | Hex (dark) | Token |
|---|---|---|---|
| #FBF1E3 | `L.bg` (= room.day.wall) | #2B2320 | `D.bg` |
| #FFF8EC | `L.surface` | #352B26 | `D.surface` |
| #F3E0C4 | `L.surface2` | #40342E | `D.surface2` |
| #3F2D22 | `L.text` | #F7EBDD | `D.text` |
| #6B5444 | `L.text2` | #CDB8A5 | `D.text2` |
| #B24A24 | `L.primary` | #F0A67F | `D.primary` |
| #FFFFFF | `L.onPrimary` | #2B1A12 | `D.onPrimary` |
| #4A3426 | `L.line` (= illustration.outline) | #E8D3BC | `D.line` |
| #8A6B55 | `L.border` | #A58E7B | `D.border` |
| #E3CDB0 | `L.divider` | #4A3D36 | `D.divider` |
| #A3341C | `L.danger` | (not drawn) | `D.danger` #FF9A82 by token |
| #3C6B45 / #E4F0DE | `L.success` / `L.successBg` | #9CD0A3 / #26372A | `D.success` / `D.successBg` |
| #2D5E86 / #E1EDF5 | `L.info` / `L.infoBg` | #9CC6E4 | `D.info` |
| #F4B79B #F7D98B #C9B8E8 | `pal.peach` `pal.butter` `pal.lav` (same in dark) | #FFF4DF | `illustration.rim` (sparkle) |
| #000000 / #FFFFFF | Apple button — **no token** (Apple brand) | | |
| #E9E9EA | iOS switch off-track — **no token** | | |
| #1C1C1E, #6C6C70 / #F2F2F7, #AEAEB2 | iOS notification text light/dark — **no token** | | |
| rgba(255,255,255,.86) / rgba(58,52,48,.92) | notification bubble light/dark — **no token** | | |
| rgba(242,242,242,.96), #007AFF, rgba(60,60,67,.29) | iOS alert — **system, no token** | | |
| rgba(0,0,0,.35) | scrim (sheet + alert) — **no token**; app `Dialog`/`BottomSheet` use rgba(43,35,32,.5) | | |
| #F6ECDD, #4A3426 text | board canvas only (not app) | | |

### 2.5 Recurring components (light; dark in §3.14)
| Component | Spec | vs `ui/components.tsx` |
|---|---|---|
| Primary button | full width, min-h 52, pad 8 20, gap 8, bg `L.primary`, border 2 `L.line`, label 16/24 Noto 700 `L.onPrimary`, optional 20px icon stroke onPrimary w2.1 | matches `Button primary` (weight 700 vs label 600) |
| Secondary button | full width, min-h 52, bg `L.surface`, border 2 **`L.border` #8A6B55**, label `L.text`, icon 20 stroke text | `Button secondary` uses edge `color.line` — board uses `border` |
| Ghost button | full width, min-h 48, transparent, no border, label 16/24 700 `L.primary` | `Button ghost` |
| Compact secondary (paste) | auto width centered, min-h 48, pad 8 20, surface, border 2 `L.border`, icon 20 | JoinScreen paste is `ghost compact` today |
| Disabled primary | bg `L.surface2`, border 2 **dashed** `L.border`, label `L.text2`, `disabled` attr | matches `Button disabled` |
| Apple button | full width, min-h 52, r26, bg #000, border 1 #000, label 16/24 Noto 700 #FFF, Apple logo 20 fill #FFF; dark: bg/border #FFF, label/logo #000 | `AppleButton` = native, BLACK style always, r26, h52 — dark variant differs |
| Text field | min-h 52, pad 0 16, gap 10, bg `L.surface`, border 2 `L.border`; error border `L.danger`; value 16/24 Gowun 400 `L.text`; placeholder `L.text2` | `TextField` uses focus colour `L.focus`; focused state not drawn |
| Field header w/ counter | row space-between baseline: label 14/21 Noto 700 + counter `n/10` 13/19.5 Gowun `L.text2` (error: `L.danger`) | new |
| Date segment group | `<button>` row gap 8 of segments: min-h 52, pad 0 12, gap 4, bg surface, border 2 `L.border` (error `L.danger`); number 20/30 Noto 700 text + unit 14/21 Gowun text2. ko flex Y:M:D = 1.5:1:1 | new (CreateSpace uses another date control) |
| Success chip | inline-flex, gap 6, pad 4 11, r999, bg `L.successBg`, border **1.5** `L.success`, text 13/19 Noto 700 `L.success`, heart icon 15 stroke success w2.2 | `Chip success`: border 2, min-h 32, icon 16 |
| Inline error | `role=alert`, row gap 6 center: warn triangle 16 stroke `L.danger` w2.2 + text 13/19.5 Noto 700 `L.danger` | `TextField` error uses bodySm 14 Gowun 400 |
| Info hint row | row gap 10 align start: info icon 18 stroke `L.info` w2 + text 14/21 Gowun `L.text2` | not a Banner (no bg/border) |
| Code cells | row gap 5 center; 8 cells 34×44 r10, bg surface, border 2 `L.line`, char 20 Noto 700 text; after cell 4 a dash 8×2 bg `L.border` aria-hidden; container `role=text aria-label="K7M4Q9XP"` | — |
| Icon tile | 36×36 (r≈12) or 48×48 (r≈16), pastel `pal.*` bg, border 1.5 `L.line` (also in dark), line icon stroke `L.line` w2 (20 or 26) aria-hidden | — |
| Names row | `role=text aria-label="도담님과 하루님"`, gap 8: name 18/27 Noto 700 text · heart 16 fill+stroke `L.primary` · name | — |
| Bottom sheet | see V0-start-date-picker | `BottomSheet`: handle 40×4 r2 `border`, scrim differs |

### 2.6 Icons (SVG path data from original; 24-grid, round caps/joins)
| Use | Shape (original `d`) | `Icon.tsx` name |
|---|---|---|
| back | `M15 5l-7 7 7 7` | `back` |
| choose chevron | `M9 5l7 7-7 7` | `forward` |
| heart (feature 1, choose "new", D+ chip, names) | `M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z` | `heart` (different path, same meaning) |
| cake (feature 2) | `M4 20.5h16M5.5 20.5v-7h13v7M5.5 15.8c2 1.2 3.4 1.2 4.6 0s3.6-1.2 4.8 0 2.6 1.2 3.6 0M12 13.5V10M12 7.5c.9-.9.9-1.9 0-3-.9 1.1-.9 2.1 0 3z` | **missing** |
| star (feature 3, choose "join") | `M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8L3.5 9.7l5.9-.9z` | **missing** |
| warn triangle | `M12 3.5l9.5 16.5h-19z` + `M12 10v4.5M12 17.5h.01` | `warn` |
| info | `<circle r9>` + `M12 11v5M12 8h.01` | `info` |
| share | `M12 3.5v11M7.5 8l4.5-4.5L16.5 8M5 13v6a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-6` | `share` |
| copy / paste (same glyph) | `<rect 8.5,8.5 11.5×11.5 rx2>` + `M15.5 8.5V5a1 1 0 0 0-1-1H5…h3.5` | `copy` |
| bell (알림 켜기) | `M6 16v-5a6 6 0 0 1 12 0v5l1.5 2h-15z` + `M10 20.5a2 2 0 0 0 4 0` | **missing** |
| Apple logo | filled path (`M16.5 12.6c0-2.3…`) | native button |
| sparkle | `<use href="#obj_shape_sparkle">` viewBox 64: rim #FFF4DF (strokes 5.8/5.4), fill `pal.butter` #F7D98B + #FFF4DF offset (1.3,1), outline #4A3426 w2.4/2 | `sparkle` is a plain line icon; board uses illustrated symbol |

Mascot images (by alt / tokens.mascot.poses): blob `2af67948…` = `mascot_wave_main` (alt `mascot.alt.wave` "모피, 인사하고 있어요"); `ad10ffa2…` = `mascot_cheer` (`mascot.alt.cheer` "모피, 신나 있어요"); `5615ca8f…` = `mascot_lookup` (`mascot.alt.lookup` "모피, 기다리고 있어요"). Files: `design/mascot/cutouts/mascot_*.png`. Each sits in a square box with the image offset slightly (values per screen).

## 3. Screens

### 3.1 V0-start-intro — "소개 + Apple 로그인 (S01·S02를 한 화면으로)"
No nav bar (47 spacer). Content gap 16:
1. Hero column, center, gap 6, margin-top 18:
   - Mascot box 150×150; wave image 160.1×141 at left −5, bottom 6; alt `모피, 인사하고 있어요` (`mascot.alt.wave`).
   - `모피루` (`app.name`) Gaegu 28/42 700 text.
   - `Our little world, together.` (`app.slogan`) Noto 13/19.5 500 text2.
2. `우리 둘의 날을 세어요` (`start.intro.title`) Gaegu 26/39 center, margin-top 6.
3. Feature list column gap 12, padding 4 8; each row gap 12, align center; tile 36×36 + icon 20; text Noto 15/22.5 500 text:
   - peach tile, heart — `사귄 날부터 D+Day를 세어요` (`start.intro.f1`)
   - butter tile, cake — `50일·100일·주년·생일을 미리 알려 줘요` (`start.intro.f2`)
   - lav tile, star — `홈 화면과 잠금 화면 위젯으로 바로 봐요` (`start.intro.f3`)
Footer: Apple button `Apple로 계속하기` (`auth.apple`, old key `login.apple`); terms `계속하면 이용약관과 개인정보 처리방침에 동의하게 돼요.` (`start.intro.terms`) Gowun 12/18 text2 center, padding 4 8 0 — plain text, no link styling drawn.
- Nav: Apple → system sheet/cancel/error per S02 → (success) V0-start-choose. No back.
- Dark: bg `D.bg`; texts `D.text`/`D.text2`; tiles unchanged; Apple button white (#FFF bg+border, #000 text+logo).
- en: `Mopiru`, `Count your days together`, features `Counts D+Day from the day you got together` / `Reminds you of 50 days, 100 days, anniversaries and birthdays` / `See it on your Home Screen and Lock Screen`, `Continue with Apple`, `By continuing, you agree to the Terms of Use and Privacy Policy.`; alt `Mopi, waving`; lh 1.4 (name 39.2, slogan 18.2, title 36.4, rows 21, terms 16.8). Rows must wrap, not truncate.
- ja: `モピル`, `ふたりの日を数えよう`, `付き合った日からD+Dayを数えます` / `50日・100日・記念日・誕生日をお知らせします` / `ホーム画面とロック画面のウィジェットですぐ見られます`, `Appleで続ける`, `続けると、利用規約とプライバシーポリシーに同意したことになります。`; alt `モピ、手を振っています`; Yomogi 28/44.8 & 26/41.6, Zen Maru 13/20.8, 15/24, 12/19.2; Apple label in Zen Maru Gothic 16/24 700.

### 3.2 V0-start-choose — "시작 방법 고르기"
Nav bar with back. Content:
1. `어떻게 시작할까요?` (`start.choose.title`) Gaegu 26/39, margin 8 0 6.
2. Card button "new": full width, row gap 14 center, padding 18 16, bg surface, border 2 **`L.line`**; tile 48 peach + heart 26; text column gap 2: `새로 시작하기` (`start.choose.new.title`) Noto 18/27 700 text; `사귄 날을 넣고 상대를 초대해요` (`start.choose.new.body`) Gowun 14/21 text2; trailing forward chevron 20 stroke text2 w2.2.
3. Card button "join": same but border 2 **`L.border`**, tile lav + star; `초대 코드가 있어요` (`start.choose.join.title`, old `join.haveCode`); `상대에게 받은 8자리 코드를 넣어요` (`start.choose.join.body`).
4. flex:1 spacer; mascot lookup box 120×120 centered (img 113.9×112.8, left 3, bottom 4.8), alt `모피, 기다리고 있어요`.
Footer: empty 42px spacer (no buttons).
- Nav: new → V0-start-date; join → V0-start-enter. Back target: verify against board V0-start-choose (PR 24 "<" control).
- Dark/en/ja: not drawn.

### 3.3 V0-start-date — "사귄 날 입력 (S03 날짜 상자 재사용)"
Nav bar with back. Content:
1. `사귄 날을 알려 주세요` (`start.date.title`) Gaegu 26/39, margin-top 8.
2. `이 날이 1일째(D+1)예요. 나중에 설정에서 고칠 수 있어요.` (`start.date.body`) Gowun 15/22.5 text2.
3. Group column gap 8, margin-top 6: label `사귄 날` (`start.date.label`) 14/21 Noto 700 text; date segment button (Y flex 1.5 `2025`+`년`, M `6`+`월`, D `29`+`일`); success chip `오늘은 492일째 · D+492` (`start.date.preview`, n=492) with heart 15.
Footer: primary `다음` (`common.next`).
- States on board: filled/valid (this), sheet open (3.4), future error (3.5). Empty/initial value: verify against board V0-start-date.
- Nav: tapping the segment button opens V0-start-date-picker; 다음 → V0-start-profile.
- Dark: segments bg `D.surface`, border `D.border`; numbers `D.text`, units `D.text2`; chip bg `D.successBg`, border/text/icon `D.success`; primary bg `D.primary`, border `D.line`, label `D.onPrimary`; back icon `D.text`.
- en (caption "월 일 년 순서"): back aria `Back`; `When did you two start dating?`; `This day counts as Day 1. You can change it later in Settings.`; label `Start date`; segments order Month/Day/Year with flex 1.2/1/1.4, values `Jun` / `29` / `2025`, **no unit labels**, number lh 28; chip `Today is Day 492`; button `Next`.

### 3.4 V0-start-date-picker — "날짜 휠 시트"
Underlying screen = 3.3 unchanged. Overlay:
- Scrim: full frame, rgba(0,0,0,.35), z35 (covers footer button).
- Sheet `role=dialog`: bottom 0, height 380, radius 28 30 0 0, bg `L.surface`, border-top 2 `L.line` (no side borders), padding 10 20 34, column gap 14.
  1. Handle 40×5, r3, `L.border`, opacity .6, centered.
  2. Header row space-between: `날짜 고르기` (`start.date.picker`) Noto 18/27 700 text; `완료` (`common.done`) text button min 48×48, pad 0 12, Noto 16 700 `L.primary`.
  3. Wheel `role=group aria-label="날짜 고르기"`, padding 0 8; selection band absolute top 80, h40, r12, bg `L.surface2`, border 1.5 `L.border`, aria-hidden. Three equal columns (flex 1), 5 rows × 40: rows ±2 = 17 Noto 500 opacity .3; ±1 = 19/500 opacity .55; center = 21/700 opacity 1; all `L.text`.
     - Year: 2023, 2024, **2025**, 2026, (5th row empty → no 2027 shown). Month: 4, 5, **6**, 7, 8. Day: 27, 28, **29**, 30, 1. Numbers only, no 년/월/일.
  4. Success chip (align-self flex-start) `오늘은 492일째 · D+492`, live-updating with selection.
- Nav: 완료 closes sheet and commits; scrim tap / swipe-down behaviour: verify against board V0-start-date-picker.

### 3.5 V0-start-date-future — "미래 날짜 오류"
Same as 3.3 except: segments border 2 `L.danger`, values `2027`년 `3`월 `1`일; chip replaced by inline error (`role=alert`) `오늘 이후의 날짜는 고를 수 없어요.` (`start.date.err.future`, old `space.date.future`); `다음` disabled (dashed style).
- Dark/en/ja: not drawn (dark danger would be `D.danger` #FF9A82 by token — not on board).

### 3.6 V0-start-profile — "이름 · 생일 (생일은 선택, 연도도 선택)"
Nav bar with back. Content gap 16:
1. `나를 알려 주세요` (`start.profile.title`) Gaegu 26/39, margin-top 8.
2. Name group gap 6: header row `내 이름` (`start.profile.name`) + counter `2/10` (max 10 chars); field value `도담` (16/24 Gowun text).
3. Birthday group gap 6:
   - label `내 생일 (선택)` (`start.profile.birthday`);
   - date segment button with 2 segments flex 1:1 — `3`+`월`, `14`+`일` (no year while toggle off);
   - toggle row min-h 48, space-between, gap 12: `태어난 해도 넣기` (`start.profile.year`) Noto 15/22.5 500 text; iOS switch 51×31 r16 track #E9E9EA (off), knob 27×27 r14 #FFF at (2,2) with shadow; switch drawn aria-hidden;
   - hint `두 사람 모두 생일을 넣으면 서로의 기념일에 함께 보여요. 양력 기준이에요.` (`start.profile.birthdayHint`) Gowun 13/19.5 text2.
Footer: primary `다음` (`common.next`); ghost `생일은 나중에 넣을게요` (`start.profile.skip`).
- Nav: creator → V0-start-invite; joiner → V0-start-connected (per flow text). Skip = continue without birthday (same targets).
- Year-on state (3 segments), switch-on colors, birthday picker sheet, focused field: verify against board V0-start-profile.

### 3.7 V0-start-profile-err — "이름이 비어 있음"
Same as 3.6 except: counter `0/10` in `L.danger`; field border `L.danger`, placeholder `상대에게 보일 이름` (`start.profile.name.ph`) in `L.text2`; inline error below field `이름을 넣어 주세요` (`start.profile.err.name`); primary `다음` disabled (dashed); ghost skip still enabled. Trigger timing (on blur vs on submit): verify against board V0-start-profile-err.

### 3.8 V0-start-invite — "초대 코드 (S04 동작 · 만든 뒤에도 계속 보임)"
Nav bar with back. Content:
1. `상대를 초대해 주세요` (`invite.title`) Gaegu 26/39, margin-top 8.
2. `아래 코드를 상대에게 보내 주세요. 코드는 24시간 동안 한 번만 쓸 수 있어요.` (`invite.body`) Gowun 15/22.5 text2.
3. Code card: padding 20 12, bg surface, border 2 `L.line`; column gap 12 center: `초대 코드` (`invite.label`) Noto 14/21 700 **text2**; code cells `K7M4`–`Q9XP`; `23시간 41분 뒤에 만료돼요` (`invite.expires`, h=23 m=41) Noto 13/19.5 500 text2.
4. Info hint row: `코드는 홈에도 계속 보여요. 상대가 넣으면 바로 연결돼요.` (`start.invite.hint`).
Footer: primary + share icon `코드 공유하기` (`invite.share`); secondary + copy icon `코드 복사` (`invite.copy`); ghost `홈에서 기다릴게요` (`start.invite.home`).
- Nav: share → system share sheet (S04); copy → clipboard + toast (S04); ghost → Home (partner-waiting state, code still shown there per PR 26). Expiring/expired/reissue/network: S04.
- Dark: card bg `D.surface`, border `D.line`; cells bg `D.surface`, border `D.line`, char `D.text`; dash `D.border`; label/expiry `D.text2`; info icon `D.info`; share btn bg `D.primary`, border `D.line`, label+icon `D.onPrimary`; copy btn bg `D.surface`, border `D.border`, label+icon `D.text`; ghost label `D.primary`.

### 3.9 V0-start-enter — "코드 입력 (S05 재사용 · 오류 상태는 S05 그대로)"
Nav bar with back. Content:
1. `초대 코드를 입력해 주세요` (`join.title`) Gaegu 26/39, margin-top 8.
2. `상대에게 받은 8자리 코드를 입력해 주세요.` (`join.body`) Gowun 15/22.5 text2.
3. Wrapper margin-top 8: code cells (filled `K7M4Q9XP`, same spec as invite; `role=text aria-label="K7M4Q9XP"`).
4. Centered compact secondary `붙여넣기` (`join.paste`) with copy glyph 20.
Footer: primary `코드 확인` (`join.check`).
- Nav: 코드 확인 → V0-start-found. Errors (expired/used/wrong/full/already in space/network): S05. Empty/partial/focused cell state and keyboard: verify against board V0-start-enter (only filled state drawn).

### 3.10 V0-start-found — "참여 확인 (S05-found 변형)"
Nav bar with back. Content:
1. `이 공간에 참여할까요?` (`join.found.title`) Gaegu 26/39, margin-top 8.
2. Card padding 22 16, bg surface, border 2 `L.line`; column center gap 8, text-align center: names row `도담 ♥ 하루` (aria `도담님과 하루님`); `하루님의 공간이에요` (`join.found.who`, name=하루) Gaegu 20/30; `사귄 날은 2025년 6월 29일이에요. 오늘은 492일째예요.` (`start.join.found.body`, date drawn as `2025년 6월 29일`, n=492) Gowun 15/22.5 text2.
3. Mascot wave box 130×130 centered, margin-top 8 (img 138.7×122.2, left −4.4, bottom 5.2).
Footer: primary `참여하기` (`join.accept`); ghost `참여하지 않기` (`join.decline`).
- Nav: 참여하기 → V0-start-profile (joiner); 참여하지 않기 → back to enter (S05 behaviour; verify against board V0-start-found).

### 3.11 V0-start-connected — "연결 완료"
No nav bar (47 spacer). Content gap 16:
1. Mascot cheer wrapper 170×170, centered, margin-top 40 (img 176.8×159.8, left −3.4, bottom 6.8), alt `모피, 신나 있어요`. Sparkles (aria-hidden): 22px at left −4/top 2 rotate −8°; 18px at right −2/top −4 rotate 10°.
2. `연결됐어요!` (`start.connected.title`) Gaegu 28/42 center.
3. Names row `도담 ♥ 하루` (aria `도담님과 하루님`), centered.
4. `하루님과 함께한 지 492일째예요` (`start.connected.body`) Gowun 16/24 text2 center.
5. `D+492` (`dday.big`) Gaegu 56/64.4 700 text, centered.
Footer: primary `시작하기` (`start.connected.cta`, old `onb.start`).
- Motion: mascot `cpl-hop` + sparkles `cpl-twinkle` from S29; reduce motion → static as drawn. Keyframe values not on this board (see S29).
- Nav: 시작하기 → V0-start-notify (joiner; also the creator, once, after the partner joins — V0-00 flow line 3). No back.
- Dark: texts `D.text`/`D.text2`, heart `D.primary` #F0A67F, button dark primary.

### 3.12 V0-start-notify — "알림 사전 안내 (연결 직후 한 번)"
No nav bar. Content:
1. Preview card margin-top 12, padding 26 14 20, gap 14, bg `L.surface2`, border 2 `L.divider`:
   - Notification mock `role=img aria-label="모피루, 오늘은 빼빼로데이예요. 모피가 함께 축하해요."`: row gap 10 center, padding 12 14, r20, bg rgba(255,255,255,.86), shadow 0 4 14 rgba(0,0,0,.10). App icon 38×38 r9 bg #FBF1E3, border 1 rgba(0,0,0,.08), mascot wave in 40 box (img 42.7×37.6, alt ""). Text: `모피루` (`app.name`) SF 600 15/20 #1C1C1E; `지금` (`notify.sample.when`) SF 400 13/18 #6C6C70 right-aligned; `오늘은 빼빼로데이예요. 모피가 함께 축하해요.` (`notify.sample.body`) SF 400 15/20 #1C1C1E.
   - Mascot cheer 110×110 centered (img 114.4×103.4).
2. `기념일을 잊지 않게 알려 드릴까요?` (`notify.pre.title`) Gaegu 24/36 center.
3. `기념일 당일 오전 9시에 알려 드려요. 시간과 미리 알림은 설정에서 바꿀 수 있어요.` (`notify.pre.body`) Gowun 15/22.5 text2 center.
Footer: primary + bell icon `알림 켜기` (`notify.pre.allow`); ghost `다음에` (`notify.pre.later`).
- Nav: 알림 켜기 → iOS permission (3.13); 다음에 → skip (creator → V0-home per V0-00 flow line 3; joiner destination: verify against board V0-start-notify). Shown once.
- ja (dark): frame font Zen Maru; card bg `D.surface2`, border `D.divider`; bubble rgba(58,52,48,.92), text #F2F2F7, time #AEAEB2, icon tile bg stays #FBF1E3; aria `モピル, 今日はペペロデーです。モピもいっしょにお祝いします。`; `今`; title `記念日を忘れないようにお知らせしましょうか？` Yomogi 24/38.4 `D.text`; body `記念日当日の午前9時にお知らせします。時間と事前のお知らせは設定で変更できます。` Zen Maru 15/24 `D.text2`; `オンにする` (bg `D.primary`, border `D.line`, label+bell `D.onPrimary`); `あとで` `D.primary`; mascot alt `モピ、はしゃいでいます`.

### 3.13 V0-start-notify-os — "iOS 권한 창"
3.12 underneath + overlay (z40) rgba(0,0,0,.35), column center gap 10:
- `role=alertdialog` 270 wide, r14, bg rgba(242,242,242,.96), centered text. Body padding 19 16 15 gap 4: `"모피루"에서 알림을 보내고자 합니다` (`notify.os.title`) SF 600 17/22 #000; `기념일 당일에 알려 드려요.` (`notify.os.body`) SF 400 13/18 #000. Button row: `허용 안 함` (`notify.os.deny`) 400 17/22 #007AFF | `허용` (`notify.os.allow`) 600 17/22 #007AFF; each min-h 44, border-top 0.5 rgba(60,60,67,.29), divider left 0.5.
- Caption under dialog, drawn inside the frame on the scrim (not part of the iOS alert; has a copy key with en/ja — whether it ships: verify against board V0-start-notify-os): `iOS 시스템 권한 창 (문구는 OS가 정함, 본문만 앱이 정함)` (`notify.os.label`) SF 600 11/14 #FFF opacity .85.
- This is the native OS prompt — do not build. Post-allow/deny destination: verify against board V0-start-notify-os.

### 3.14 Dark variants drawn (summary)
Only intro, date, invite, connected (+ ja notify). All use: bg #2B2320, frame ring #4A3D36, home indicator #F7EBDD, back icon #F7EBDD, primary btn #F0A67F / border #E8D3BC / label #2B1A12, ghost label #F0A67F, surface #352B26 with border #A58E7B (fields, secondary) or #E8D3BC (cards, code cells), chip #26372A/#9CD0A3, info #9CC6E4. Icon tiles and mascot tile keep light illustration colors (#4A3426 outlines). Annotation captions under dark frames stay #3F2D22/#6B5444 (board text).

## 4. References to reused older boards
| Ref | What the board says |
|---|---|
| S01 | intro: "S01·S02를 한 화면으로"; "S01 3장 소개를 1장으로 줄였어요. 방·프롬프트 소개는 빠져요." |
| S02 | "Apple 시스템 시트·취소·오류: S02 그대로 (S02-apple · S02-cancel · S02-error). V0 로그인은 Apple 하나뿐이에요." |
| S03 | date: "S03 날짜 상자 재사용"; description "S03~S05의 초대·참여 동작을 그대로 써요" |
| S04 | invite: "S04 동작 · 만든 뒤에도 계속 보임"; "초대 코드 만료 임박·만료·재발급·공유 시트·복사 토스트·네트워크 오류: S04 그대로." |
| S05 | enter: "S05 재사용 · 오류 상태는 S05 그대로"; found: "S05-found 변형"; "코드 만료·사용됨·틀림·인원 초과·이미 다른 공간·네트워크 오류: S05 그대로." |
| S20 | "글자 200%에서는 내용이 스크롤되고 아래 버튼은 고정돼요(S20 규칙)." |
| S29 | "연결 완료의 모피는 S29의 깡총(cpl-hop)·반짝임(cpl-twinkle)을 쓰고, 동작 줄이기가 켜지면 이 그림처럼 멈춰 있어요." |
| PR 24 | "뒤로 가기는 PR 24의 공통 "<" 컨트롤, 48pt." (= `BackControl`/`IconButton plain`, icon 26) |
| PR 26 | "만든 초대 코드는 홈에서도 계속 보여요(PR 26)." |
| S13, S16, S22 | not referenced on this board |

Existing-code deltas (repo `apps/mobile/src/features`): `auth/Welcome.tsx` is a 3-page carousel with skip/dots/legal links/age line → board: single page, no links drawn. `auth/LoginScreen.tsx` Apple (native/web) + config-gated Kakao (`options.kakao`) + dev-only email → Apple only. `onboarding/SpaceChoiceScreen.tsx` two plain Buttons + centered title/body → two icon cards + mascot, no footer button. `onboarding/CreateSpaceScreen.tsx` has a time-zone Banner → not drawn here; adds D+ chip. `onboarding/JoinScreen.tsx` paste = ghost compact → board secondary compact with icon. `onboarding/InviteScreen.tsx` has waiting view/reissue → board adds hint row + "홈에서 기다릴게요".

## 5. Could not determine (verify against board)
- Icon identity is inferred from path shapes (cake/star/bell absent from `Icon.tsx`; heart path differs from `Icon.tsx heart`).
- Empty/initial state of the date screen and of the code-entry cells; focused field/cell state; keyboard presence (V0-start-date, V0-start-enter, V0-start-profile).
- Profile with year toggle ON (3-segment layout, switch-on color), birthday picker sheet, max date/validation for birthday (V0-start-profile).
- When the name error appears (blur vs submit) (V0-start-profile-err).
- Back targets for choose/date/profile/invite/enter/found; whether back from choose signs out (V0-start-choose etc.).
- Picker dismissal by scrim tap/drag; whether 완료 is needed to commit; how future dates are blocked in the wheel (2027 row empty) vs the date-future state (V0-start-date-picker / -future).
- Joiner's destination after 다음에 and after OS allow/deny (V0-start-notify, V0-start-notify-os). (Creator: V0-00 flow line 3 = home-pending → partner joins → connected once → notify → V0-home.) Note: iOS's real notification prompt does not show app-supplied body text; the board claims "본문만 앱이 정함" — verify feasibility.
- Found screen shows `도담 ♥ 하루` before the joiner has entered a name (profile comes after join): which name is shown at that point (V0-start-found).
- Date format inside `start.join.found.body` (`2025년 6월 29일`, no weekday) vs `date.long` (has weekday).
- a11y label `도담님과 하루님` and counter `n/10`, unit labels `년/월/일`, `Jun` month abbreviation have no copy key in the tables.
- Accessible name for the year switch (visual is aria-hidden) and for the date segment `<button>` (no aria-label drawn).
- Keyframes/timings of cpl-hop / cpl-twinkle (S29, not on this board).
- Dark versions of choose, date-picker, date-future, profile(-err), enter, found, notify(-os ko); en/ja for all screens except intro, date (en), notify (ja).
- Terms text: no tappable links / underline drawn for 이용약관 / 개인정보 처리방침.
- Nav-bar center title is an empty element on every screen — whether any screen has a title.
