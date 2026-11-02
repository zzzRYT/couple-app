# Design foundations — couple D+Day V0 (V0 design)
Verified 2026-11-02: 104 claims checked, 4 corrected.

Sources: slim boards `V0-00-flow`, `S19-type-tokens`, `S20-accessibility`, `S22-components` (artifact M2WFQCFnVzoWbHNhJPCz5X v1793598115-fafc).
Repo used for comparison (read-only): `apps/mobile/src/theme/*`, `apps/mobile/src/ui/*`, `design/tokens.json`, `design/components.md` (branch `fm/cpl-v1-handoffs`).
`design/tokens.json` and `apps/mobile/src/theme/tokens.ts` are identical (checked by parsing both).
Legend: OK = same as board · MISMATCH = differs · n/a = not in code.

---

## 1. V0-00 flow board (verbatim, ko)

Header: `AROOM · V0 · D+DAY · 2026-11-02` — "V0 흐름 · 개요 (커플 D+Day V0)"
> 방 꾸미기는 다음 버전으로 미루고, 두 사람이 연결해서 D+Day와 기념일을 보고 위젯으로 확인하는 앱을 V0으로 먼저 내요. 이 페이지는 전체 흐름, 범위, 날짜 규칙, 누가 무엇을 바꾸는지를 모았어요.

Legend: 같은 ID가 각 페이지의 프레임 이름이에요. 기존 보드에 이미 있는 상태(로그인 시트, 초대 오류 등)는 다시 그리지 않고 점선 칸으로 가리켜요. 실선 칸 = 이번에 그린 V0 프레임 · 점선 칸 = 기존 보드 그대로 재사용 · 파란 칸 = 시스템 · 앱 밖 · 붉은 칸 = 끝나는 동작

### 1.1 Flow lines (7)
1. **처음 · 만드는 사람**: V0-start-intro 소개 + Apple로 계속하기 → S02-apple Apple 시스템 시트 (재사용) → V0-start-choose 새로 시작하기 → V0-start-date 사귄 날 → V0-start-profile 이름 · 생일 → V0-start-invite 초대 코드 공유 → V0-home-pending 홈 · 상대 대기 (코드 보임)
2. **처음 · 초대받은 사람**: V0-start-intro 소개 + Apple로 계속하기 → V0-start-choose 초대 코드가 있어요 → V0-start-enter 코드 입력 (오류는 S05) → V0-start-found 참여 확인 → V0-start-profile 이름 · 생일 → V0-start-connected 연결 완료 → V0-start-notify 알림 사전 안내 → iOS 권한
3. **상대가 들어온 뒤 · 만드는 사람**: V0-home-pending 홈 · 상대 대기 → Realtime / 앱 열기 상대 참여 감지 → V0-start-connected 연결 완료 (한 번) → V0-start-notify 알림 사전 안내 → V0-home 홈
4. **매일**: 위젯 홈 화면 · 잠금 화면 → V0-home 홈 · D+N · 다음 기념일 → V0-anniv-list 기념일 탭 → V0-anniv-detail-* 상세 → V0-edit-* 추가 · 편집 · 삭제
5. **기념일 당일**: 로컬 알림 09:00 이 기기에 예약된 알림 → V0-home-today 홈 · 축하 카드 → V0-anniv-list-today 목록 "오늘" → 위젯 · 오늘 오늘은 빼빼로데이
6. **설정**: V0-set-main 설정 → V0-set-me 이름 · 생일 → V0-set-start-confirm 사귄 날 바꾸기 (확인) → V0-set-notify 알림 · 거부됨 → V0-set-lang / mode 언어 · 화면 모드 → V0-set-disconnect / delete 연결 끊기 · 계정 삭제
7. **끝날 때**: 상대가 연결 끊기 · 계정 삭제 (상대 기기에서) → 다음 앱 열기 또는 열린 동안 Realtime → V0-state-ended 공간이 끝났어요 → V0-start-choose 새로 시작하기

### 1.2 범위 — V0 (= V0 디자인) 범위
- F01 Apple 로그인 · F02 커플 연결(공간 만들기 + 사귄 날, 초대 코드, 코드 입력) · F03 홈 D+Day
- F04 자동 기념일(50·100·150·200·300일, 매년 주년) · F05 생일(각자 입력, 둘 다 넣으면 공개) · F06 시즌(빼빼로데이 11/11, 크리스마스 12/25)
- F07 직접 추가 기념일(두 사람 공유, 추가·편집·삭제) · F08 기념일 목록·상세 · F09 당일 축하 카드
- F10 로컬 알림(시간·미리 알림·종류) · F11 iOS 홈 화면·잠금 화면 위젯 · F12 최소 설정 · F13 시스템 상태 · F14 출시 자동화·OTA(화면 없음)
- 자세한 ID 표와 열린 질문: the V0 scope notes (summarised in `../../spec.md`)

**V0에서 빼는 것** (보드는 지우지 않고 Later 페이지로)
- 방 · 방 탭 · 프롬프트 꾸미기 · 미리 보기 · 되돌리기 · 해외 AI 처리 동의 · 기념 방 꾸미기 제안 · 기록
- 홈 배경 사진 커버(S06) · 방 낮·밤 설정 · 신고·차단(S15)
- 이메일 로그인 · 앱 비밀번호 제안 · 카카오 로그인 · Android 앱과 위젯 · 서버 푸시 · 음력 생일

**탭 구조**: 홈 · 기념일 · 설정 3개(시스템 UITabBar). 기존 "방" 탭은 숨기고 "기념일" 탭이 그 자리에 와요. 탭 접근성 이름은 기존 a11y.tab 템플릿(총 3개)을 그대로 써요.

### 1.3 상호작용 규칙 (date / calculation rules)
**날짜 세기 (기존 S06 · 스펙 규칙 그대로)**
- 사귄 날 당일 = 1일째 = D+1. 달력 날짜 차 + 1, 공간의 IANA 시간대(기본 Asia/Seoul) 자정 기준.
- N일 기념일 = 사귄 날 + (N − 1)일. 기존 서버 목록에는 150일이 없어서 V0 백엔드에서 더해야 해요(500·1000일은 오너 목록에 없어 V0에서 빠짐 — 열린 질문).
- 주년 = 같은 달력 날짜(365일 단위 아님) → 1주년은 366일째. 2월 29일 시작은 평년 2월 28일. 같은 날이면 주년이 우선.
- 생일은 양력 월·일(연도 선택), 2월 29일 생일은 평년 2월 28일.

**누가 무엇을 고치나**
- 사귄 날·시간대: 두 사람 누구나, 확인 후 두 사람에게 적용. 상대 홈에 "하루님이 사귄 날을 바꿨어요" 띠.
- 직접 추가 기념일: 두 사람 누구나 추가·편집·삭제(삭제는 확인). 동시 편집은 버전 확인 후 충돌 안내.
- 생일·이름: 본인만. 상대 생일은 두 사람 모두 넣었을 때만 보여요.
- 자동 기념일: 아무도 못 고침. 알림만 각 기기에서 종류별로.
- 알림·언어·화면 모드: 이 기기에만.

**상대가 연결을 끊으면**
- 연결 끊기 = S14 공간 종료와 같은 결과. 두 사람 모두 공간을 잃고 사귄 날·직접 추가 기념일·생일 공유가 지워져요(되돌릴 수 없음).
- 끊긴 쪽은 다음에 앱을 열 때(열려 있으면 바로) V0-state-ended를 보고 "새로 시작하기"로 다시 연결할 수 있어요.
- 두 기기 모두 예약 알림과 위젯 데이터를 지워요. 상대가 계정을 삭제해도 같아요.

**시간대 · 하루 경계**
- D+N·D-n·축하 카드·알림 시각은 모두 공간 시간대 기준이에요. 여행 중이어도 서울 자정에 하루가 넘어가요.
- 공간 시간대는 만든 사람 기기의 시간대로 정하고 설정에서 바꿀 수 있어요(두 사람에게 적용).
- 서버가 계산하고 앱·위젯은 마지막으로 받은 사귄 날·시간대로 같은 규칙을 다시 계산해요(오프라인에서도 날짜는 넘어가요).

**동기화 · 오프라인**
- 앱이 열려 있는 동안 Realtime 힌트 → 다시 불러오기. 닫혀 있던 폰은 다음에 열 때 반영돼요(알림·위젯 다시 맞춤 포함).
- 불러오기는 전부 아니면 없음(2026-11-01 규칙). 오프라인은 마지막 데이터로 읽기만.

### 1.4 출시 메모 — `OWNER DECISION PENDING` (권장 · 오너 결정 대기)
- V0은 TestFlight로 오너와 여자친구에게 먼저: GitHub workflow_dispatch → EAS Build → EAS Submit → TestFlight.
- JS·문구·자산은 EAS Update(OTA) preview 채널에서 확인 후 production으로. 위젯 extension·권한·네이티브 변경은 새 빌드.
- 첫 빌드는 .dev 테스트 bundle id(com.jinjinstar.aroom.dev, 위젯 extension은 별도 id)로. 이름 확정 전 production 등록은 하지 않아요.

### 1.5 접근성 · 모션 (on V0-00)
- 터치 대상 48pt 이상, iOS 안전 영역 위 47 · 아래 34(S19 토큰). 글자 200%까지(S20).
- 움직이는 원본은 S29 하나. V0 축하 카드의 모피 깡총·반짝임은 동작 줄이기에서 멈춘 모양(이 보드들의 그림)이에요.
- 대비는 S19 토큰 그대로(밝게·어둡게). 색만으로 구분하지 않아요.

### 1.6 보드 지도
V0 · 시작: V0-01 시작 + 문구 · V0 · 홈·D+Day: V0-02 홈, V0-03 시스템 상태 + 문구 · V0 · 기념일: V0-04 목록·상세, V0-05 추가·편집 + 문구 · V0 · 위젯: V0-06 위젯 + 문구 · V0 · 설정: V0-07 설정 + 문구 · 공통 문구(탭·기념일 이름·날짜 형식·버튼): 이 페이지 오른쪽 "문구 · V0 공통" · Later 페이지: 방·꾸미기, V0 이후(기록). 기존 S·C 보드는 그대로 남아 있어요.

### 1.7 Open questions / pending decisions on the board
- 500·1000일 기념일: 오너 목록에 없어 V0에서 빠짐 — **열린 질문**.
- 150일: 기존 서버 목록에 없음 → V0 백엔드에서 추가 필요 (decision made; work item).
- 출시 메모 전체: **OWNER DECISION PENDING**.
- 나머지 열린 질문은 `the V0 scope notes (summarised in `../../spec.md`)` 참조 (not read here).

---

## 2. Color tokens (S19) vs `tokens.ts`

App modes are independent of room day/night. Outline width: normal **2px**, high contrast **3px** (`bw` in tokens.ts: 2/3 OK).

| token | light | light · HC | dark | dark · HC | tokens.ts |
|---|---|---|---|---|---|
| bg | #FBF1E3 | #FFFAF2 | #2B2320 | #1A1411 | OK |
| surface | #FFF8EC | #FFFFFF | #352B26 | #241C18 | OK |
| surface2 | #F3E0C4 | #F5E7D2 | #40342E | #33281F | OK |
| text | #3F2D22 | #1F140D | #F7EBDD | #FFF6EA | OK |
| text2 | #6B5444 | #4A3426 | #CDB8A5 | #EBD9C5 | OK |
| primary | #B24A24 | #8A2F10 | #F0A67F | #FFC09C | OK |
| onPrimary | #FFFFFF | #FFFFFF | #2B1A12 | #1A0F08 | OK |
| line | #4A3426 | #1F140D | #E8D3BC | #FFF0DC | OK |
| border | #8A6B55 | #1F140D | #A58E7B | #F0DCC4 | OK |
| divider | #E3CDB0 | #8A6B55 | #4A3D36 | #A58E7B | OK |
| danger | #A3341C | #8A1F10 | #FF9A82 | #FFB4A2 | OK |
| dangerBg | #FBE3DC | #FBE3DC | #4A2219 | #4A2219 | OK |
| onDanger | #FFFFFF | #FFFFFF | #2A0A06 | #1A0A06 | OK |
| success | #3C6B45 | #27502F | #9CD0A3 | #B5E4BB | OK |
| successBg | #E4F0DE | #E4F0DE | #26372A | #26372A | OK |
| warn | #7A4F00 | #5E3C00 | #F7D98B | #FFE39A | OK |
| warnBg | #FFEFC4 | #FFEFC4 | #40361A | #40361A | OK |
| info | #2D5E86 | #1D4A6E | #9CC6E4 | #B9DBF2 | OK |
| infoBg | #E1EDF5 | #E1EDF5 | #25364A | #25364A | OK |
| focus | #2D5E86 | #1D4A6E | #9CC6E4 | #B9DBF2 | OK |

Room (Later in V0; listed for completeness) — day / night: wall #FBF1E3/#2B2320 · floor #F3E0C4/#352A25 · line #4A3426/#E8D3BC · frame #C99A6B/#7A5C48 · sky #E6F0F7/#2F3050 · sun #F7D98B/#F7D98B · star #F7D98B/#FFF4DF · glass #FFF8EC/#3A2F2A — tokens.ts OK.

Illustration palette (S19) — all OK in `tokens.color.illustration.palette`: peach #F4B79B · butter #F7D98B · sage #A8C6A0 · sage2 #8FB68A · sky #AACBE2 · sky2 #8DB6D2 · pink #F2A7B4 · rose #E88A9B · cream #FFF4DF · terra #D98B63 · wood #C99A6B · ice #E6F0F7 · lav #C9B8E8 · aqua #9ED8CB · dark #7A5C48.

Date-widget presets (fill / text #3F2D22 / contrast; brown outline + cream rim #FFF4DF always) — all OK in `widgetPresets`: butter #FFE6A8 10.64 · peach #F4B79B 7.51 · sage #A8C6A0 6.99 · sky #AACBE2 7.67 · pink #F2A7B4 6.81 · cream #FFF8EC 12.36.

Other fixed colors: dialog/sheet scrim `rgba(43,35,32,0.5)` (S22; code OK). Tab bar tints: selected = `primary`, unselected = `text2` (must be set; iOS default gray fails 4.5:1).

---

## 3. Type scale (S19) vs `typography.ts` / `fonts.ts`

Letter-spacing: not specified for any app token on the board (only board chrome uses .04em) → use 0. Word break: ko `keep-all` (code: `lineBreakStrategyIOS: 'hangul-word'`), ja `line-break: strict`, en normal.

| token | use | size / weight | line height ko · en · ja (px) | face |
|---|---|---|---|---|
| display | D-day 숫자 · 화면 제목 · 마스코트 말풍선 · 방 문구(≥20) | 56 / 700 | 84 · 78 · 90 | display |
| title | 화면 제목 | 28 / 700 | 42 · 39 · 45 | display |
| heading | 섹션·다이얼로그 제목 | 20 / 700 | 30 · 28 · 32 | display |
| body | 본문·입력·말풍선 | 16 / 400 | 24 · 22 · 26 | body |
| label | 버튼·라벨·칩(굵게) | 16 / 600 | 24 · 22 · 26 | emph |
| bodySm | 보조 설명 | 14 / 400 | 21 · 20 · 22 | body |
| caption | 캡션·탭 라벨 | 12 / 400 | 18 · 17 · 19 | body |

Ratios: ko 1.5, en 1.4, ja 1.6 for **every** token incl. display. Untokenized sizes seen on S22: 15 (banner title, dialog body, bubble), 13 (chip, error text, row description), 11 (bubble time).

Faces per locale (fallback order):

| role | ko | en | ja |
|---|---|---|---|
| display (only tokens ≥20px AND bold) | Gaegu 700 → Gowun Dodum → Noto Sans KR | Gaegu 700 → Gowun Dodum | Yomogi 400 → Zen Maru Gothic → Noto Sans JP |
| body | Gowun Dodum 400 → Noto Sans KR | Gowun Dodum 400 → Noto Sans KR | Zen Maru Gothic 400 → Noto Sans JP |
| emph (buttons, labels, chips, bold secondary) | Noto Sans KR 500 · 700 | Noto Sans KR 500 · 700 | Zen Maru Gothic 500 · 700 |
| numbers | Gowun Dodum; big D-day = display | same | Zen Maru Gothic; big D-day = Yomogi |

Rules: face decided on the 100% token size (scaling never turns body into handwriting). If any glyph is missing from Gaegu (rare syllables, `·`, `…`) render the whole sentence in the body face. No faux bold: Yomogi and Gowun Dodum are never bolded (switch to emph face). **Inter is no longer used** (en uses Gaegu/Gowun Dodum Latin). Fonts are bundled, never remote.

Recommended bundle (S19): Gaegu-Bold, GowunDodum-Regular, NotoSansKR-Medium + -Bold, Yomogi-Regular, ZenMaruGothic-Regular/-Medium/-Bold, NotoSansJP-Regular (9 files ≈16.4MB). Minimum set: Gaegu + Gowun Dodum + Noto Sans KR 700; Yomogi + Zen Maru Gothic Regular·Bold (then no 500 weight; body/bold only).

Code comparison:

| item | board | code | status |
|---|---|---|---|
| sizes/weights of 7 tokens | as table | `tokens.typography.scale` identical | OK |
| ko/en display family | Gaegu 700 | `GaeguBold` | OK |
| ko/en body | Gowun Dodum 400 | `GowunDodum` | OK |
| ko/en emph | Noto Sans KR 500·700 | `NotoSansKRBold` only (700) | MISMATCH (no 500; all emph renders 700) |
| ja display | Yomogi 400 | `Yomogi` | OK |
| ja body | Zen Maru Gothic 400 | `NotoSansJP` (400) | MISMATCH (ZenMaruGothic Regular not bundled) |
| ja emph | Zen Maru Gothic 500·700 | `ZenMaruGothicBold` only | MISMATCH (no 500) |
| label weight | token 600; S19/S22 samples render 700 | 700 (Bold file) | OK vs sample; token says 600 — verify against board S19 |
| display/title/heading line height | locale ratio (e.g. 56→84/78/90; S22 dialog title 20/30) | `typography.ts` uses 1.25 (56→70, 20→25); `tokens.json lineHeight.display = 1.1` | MISMATCH (both code and tokens.json) |
| body/label/bodySm/caption line height | ko 1.5 / en 1.4 / ja 1.6, rounded | `Math.round(size*ratio)` → same px | OK |
| fonts.ts registered extras | not in bundle list | `Inter`, `NotoSansKR` 400, `NotoSansJPBold` registered, unused by typography.ts | MISMATCH (dead assets; Inter should go) |
| missing files | ZenMaruGothic Regular/Medium, NotoSansKR Medium | absent in `assets/fonts` | MISMATCH |

---

## 4. Spacing, radii, borders, shadows, motion (S19)

| item | board value | tokens.ts | status |
|---|---|---|---|
| spacing scale | 4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 | `spacing` same (index 0=4 … 4=20, 5=24 … 8=48) | OK (beware index-based use in code) |
| radius | input 16 · card 20 · sheet 28 · buttons/chips full pill | `radius` 16/20/28/999 | OK |
| corner jitter | each corner ±12% (hand-drawn), not on system components | `cornerJitter` text; ui/ code uses plain radii | not implemented in code |
| outline | 2px normal · 3px HC, colour = app `line` (light #4A3426 · dark #E8D3BC) | `border.outline` 2/3 | OK in tokens; ui/ always uses `outline.normal` (2) → HC 3px NOT applied |
| shadows / blur | none | `elevation: none` | OK (home-cover text shadow is Later/S06) |
| touch target | min 48×48 (iOS 44pt / Android 48dp floor); room toolbar 52 | `touch` 48 / 44 / 48 / 52 | OK |
| safe area | iOS top 47 · bottom 34; Android top 32 · bottom 24 (gesture) or 48 (3-button); measure on device | `safeArea` same | OK (code uses `useSafeAreaInsets`) |
| motion | transitions ≤150ms; none when system Reduce Motion | `motion.transitionMs 150`, `reducedMotion: no transition` | OK in tokens; RN `Modal` fade/slide durations are OS-fixed — verify ≤150ms |
| easing curves | not on these boards | — | verify against board S29 |
| loop/character motion | "움직이는 원본은 S29 하나"; reduce motion = still pose | `Spot.tsx` float 6pt, 3200ms ease-in-out, still when reduced (from interaction-notes) | durations: verify against board S29 |
| focus ring | 3px ring + 3px offset, ≥3:1 | `focus` 3/3/3 | OK |
| font scale | designed to 200%; toolbar labels cap 160% | `fontScale` 2 / 1.6 | OK |

---

## 5. Components (S22) — light values; dark/HC swap the token

All measurements px at 100%. Corner radii on the board are jittered around the base value (e.g. buttons 24.4–29.1 ≈ pill on 52px).

### 5.1 Button — `ui/components.tsx` `Button` (re-exported by `ui/Button.tsx`)
Common: min-height **52**, padding **8 × 20**, gap 8, pill radius, border 2px (HC **3px**), label = `label` token (Noto Sans KR 700 16/24), full width in sheets.

| variant | face / ink / edge | code |
|---|---|---|
| primary | primary / onPrimary / line | OK |
| secondary | surface / text / line | OK |
| danger | danger / onDanger / line | OK |
| dangerOutline | surface / danger / danger | OK |
| ghost | transparent / primary / none (0 border) | OK |
| loading | primary look + 18px spinner (ring onPrimary 30% opacity, 3px stroke) + label kept ("불러오는 중이에요") | ActivityIndicator + label — OK in spirit |
| disabled | surface2 / text2 / border, **dashed** | OK |
| pressed | brightness 0.9 + translateY 1px | opacity 0.88 + translateY 1 — MISMATCH (approximation) |
| focus | 3px `focus` outline, offset 3 | n/a (no focus ring) |

Code MISMATCHES: horizontal padding `spacing[5]` = **24** (board 20); border width hard-coded 2 (HC must be 3); `compact` 48 height variant not on S22 (but V0-01 draws 48h ghost and compact-secondary buttons — keep it).

### 5.2 Text field — `TextField` (ui/TextField.tsx)
- Label above: Noto Sans KR **700 14/21**, text; gap label→field **6**.
- Field: min-height **52**, padding **8 × 16**, radius ~16, surface face, body text Gowun Dodum 16/24, placeholder text2, leading 20px icon (stroke text2) shown in default/focus/error samples.
- States: default border **2px line**; focus **3px focus** + 3px focus outline offset 3; error **2.5px danger** + message row (18px danger icon, gap 6, Noto Sans KR **500 13/19.5** danger); disabled/read-only surface2 face + 2px `border`.
- HC: default 3px, focus 4px, error 3.5px.
- Code MISMATCHES: default border uses `border` (#8A6B55) not `line`; focus only recolours (no width change, no outer ring); error text uses `bodySm` (Gowun 14) not 13/500 emph, icon 16 (board 18); vertical padding 12 (board 8); label gap 8 (board 6); no leading icon slot; HC widths absent.

### 5.3 Chip — `Chip` (ui/Chip.tsx)
Padding **5 × 12**, pill, border **1.5px**, gap 6, Noto Sans KR 700 13/19.5. S22 chips are drawn with no icon (code has a 16px icon slot; V0-01 success chip uses a 15px icon).

| kind | face / ink / edge (board) | code |
|---|---|---|
| neutral | surface2 / text / line | MISMATCH (code surface / text2 / border) |
| info | infoBg / info / info | OK |
| success | successBg / success / success | OK |
| warn | warnBg / warn / warn | OK |
| danger | dangerBg / danger / danger | OK |
| primary | primary / onPrimary / line | MISMATCH (code edge primary) |

Code also: border 2px (board 1.5), padding 16 × 4 (board 12 × 5).
Occupancy chip (`OccupancyChip`, room feature = Later): padding 6 × 12, 15px icon; free surface2/text/`border`; mine primary/onPrimary/primary + countdown 12/18 700 tabular; partner warnBg/warn/warn. Code free → neutral chip (MISMATCH face), no countdown.

### 5.4 Banner — `Banner` (ui/Banner.tsx)
- Padding **14 × 16**, radius ~**18**, border 2px kind colour, gap 12, 22px icon (stroke 2.1, kind colour), text column gap 4.
- Title Noto Sans KR 700 **15/22.5 in kind colour**; body Gowun Dodum 400 **14/21 in `text`**.
- Kinds: info infoBg/info · success successBg/success · warn warnBg/warn · danger dangerBg/danger · offline surface2 / edge line / title text.
- Role `status` (components.md: `alert` only for error screen transitions).
- Code MISMATCHES: title colour `text` (board kind colour); body colour `text2` (board `text`); offline edge `text2` (board `line`); radius 16 (board ~18); vertical padding 12 (14); icon 20 (22); `accessibilityRole="alert"` (board/doc `status`). Text action (underlined primary) comes from components.md, not drawn on S22.

### 5.5 List row + card — `ListRow`, `Card` (ui/ListRow.tsx, components.tsx)
- Group card: radius **20**, surface, border 2px **divider** (HC `line` per components.md), overflow hidden. `Card` OK (radius 20, divider, padding 20).
- Row: min-height **56**, padding **10 × 16**, gap **14**; leading icon 22 (text / danger); label Noto Sans KR **500 16/24**; value Noto Sans KR **500 14/21 text2**; trailing chevron 20 text2.
- Danger row: label danger + description Gowun Dodum 400 13/19.5 text2.
- Row separators: verify against board S22 (none visible in slim data).
- Code MISMATCHES: label/value use Gowun body/bodySm 400 (board Noto Sans KR 500); vertical padding 12, no horizontal padding, gap 12; chevron 18 (board 20); no description line for danger row; adds 1px divider between rows.

### 5.6 Dialog — `Dialog` (ui/Dialog.tsx)
- Scrim rgba(43,35,32,0.5), side inset 20, vertically centred. Card: surface, border 2px line, radius ~**26** (24.4–29.1), padding **24 / 20 / 20**, gap 12.
- Icon circle **48**, infoBg face, 2px line. Title `heading` Gaegu 700 **20/30**. Body Gowun 400 **15/22.5 text2**.
- Buttons stacked full-width, gap 8, margin-top 8: primary (or danger) then secondary "취소".
- `role=dialog aria-modal`; focus to title on open, back to caller on close (components.md).
- Code: scrim/inset/border OK. MISMATCHES: gap `spacing[3]` = 16 (board 12), radius 28 (sheet token), padding 24 all sides, icon 52 with surface2 face, body `body` 16, title line-height 25 (typography 1.25 rule), no 8px top margin before buttons.

### 5.7 Segment · switch · checkbox · radio — **no component in apps/mobile/src/ui**
- Segment: container padding 4, gap 4, radius ~18, surface2, 2px line; item min-height **44**, radius ~14, Noto Sans KR 14/21; unselected 500 text, transparent 1.5px border; selected primary / onPrimary 700, 1.5px line.
- Switch: 54 × 32, radius 16, 2px line; on = primary track + white (onPrimary) 21px thumb right; off = surface2 track + surface thumb left; thumb 2px line.
- Checkbox 26 × 26, radius ~8, 2px line; checked primary fill. Radio 26 circle, 2px line, surface; selected 12px primary dot.
- Needed for V0-set-lang/mode (화면 모드 기기 설정/밝게/어둡게) and alert toggles. Note 44 item height < 48 touch rule — verify against board S22.

### 5.8 Not drawn on S22 (use repo doc + code; visual values unverified)
| component | board status | code | notes (from `design/components.md`) |
|---|---|---|---|
| Bottom sheet | verify against board S22 (not present) | `BottomSheet`: radius 28 top, 2px line, handle 40×4 `border`, scrim 0.5, heading title, covers tab bar | rounded top, handle, title + content, rises above keyboard, covers tab bar |
| Toast | verify against board S22 (not present) | `Toast`: pill, dark-brown (light)/cream (dark) face, 18 check icon, emph 15, padding 12 × 20, hides after 3s | 3s auto-hide, immediate under Reduce Motion (code does not shorten); ignores HC tokens |
| Skeleton | verify against board S22 (not present) | `Skeleton`: surface2, radius 16, default h 44 | doc: HC adds dashed outline — not in code |
| Tab bar | system UITabBar (S20 mock: 83px incl. home indicator, labels 10/12, selected 600 primary, unselected 500 text2) | not in ui/; `useTabBarClearance` iOS 49 + inset | app sets only tints, labels, icons; no badges; 3 tabs 홈·기념일·설정 |
| Icon button | (components.md) 48 circle, surface, line | `IconButton` OK (48, 2px line; plain variant) | always needs a11y name |

Room-only pieces on S22 (Later): room toolbar pill (52 high, padding 8 × 10, 15/22.5 700), date widget (padding 8 16 8 12, radius ~28, 2px line + 2px rim #FFF4DF, label Noto Sans KR 500 14/21, number Gaegu 700 24/36 tabular), scene-text plate (cream #FFF8EC, Gaegu 20/30, padding 6 × 14, ≥20pt), chat bubbles (15/22.5, radius 18 with 4px tail corner), mascot PNG heights 200/96/48.

---

## 6. Accessibility checklist (S20 + S19 + V0-00)

- [ ] Contrast per WCAG 2.2: text ≥4.5:1, large text & non-text ≥3:1. Use S19 tokens unchanged; final S20 matrix (room day/night × app light/dark × normal/HC) has zero failures — don't introduce new colour pairs.
- [ ] Never distinguish by colour alone: errors/success/warn = colour + icon + text; selection = outline weight / fill / check.
- [ ] Touch targets ≥48×48 (iOS floor 44pt, Android 48dp).
- [ ] Safe areas: iOS top 47 / bottom 34 (Android 32 / 24 or 48) as defaults — always use measured insets.
- [ ] Text scaling to 200%: grow + wrap, never auto-shrink; keep line-height ratios (ko 1.5, en 1.4, ja 1.6); display headings scale too. Big D-day: if it doesn't fit, "Day" and the number go on two lines.
- [ ] Face rule evaluated on the unscaled token (200% body never becomes handwriting).
- [ ] System tab bar: iOS keeps its size (long-press large-text HUD); Android label & bar height grow. Always set unselected tint (`text2`) — iOS default gray is 2.8–3.3:1.
- [ ] High contrast: only text, controls and borders get darker/thicker (outline 3px); illustrations/backgrounds unchanged. Implement HC border widths (ui/ currently doesn't).
- [ ] Focus: 3px ring + 3px gap, ≥3:1. Focus order = visual order (top→bottom, left→right), tab bar last.
- [ ] Reduce Motion: no transitions; animated character (S29 source, 모피 깡총·반짝임 on the celebration card) shows the still pose drawn on the V0 boards; spinner becomes a static arc (components.md).
- [ ] Transitions ≤150ms otherwise.
- [ ] Decorative images hidden from screen readers (`importantForAccessibility="no"` / `accessibilityElementsHidden`); mascot image named `a11y.mascot` "모피, {pose}".
- [ ] State changes announced once via `role=status` (don't interrupt typing); countdowns not read every second.
- [ ] Dialog: `role=dialog aria-modal`, focus to title, return focus on close.
- [ ] VoiceOver names (ko / en / ja) relevant to V0:

| key | 한국어 | English | 日本語 |
|---|---|---|---|
| a11y.tabbar | 탭 막대 | Tab bar | タブバー |
| a11y.tab | {name} 탭, {total}개 중 {n}번째{sel} | {name} tab, {n} of {total}{sel} | {name}タブ、{total}件中{n}件目{sel} |
| a11y.tab.sel | , 선택됨 | , selected | 、選択中 |
| a11y.dday | 함께한 지 {n}일째, 2025년 6월 29일부터 | Day {n} together, since June 29, 2025 | 一緒に過ごして{n}日目、2025年6月29日から |
| a11y.mascot | 모피, {pose} | Mopi, {pose} | モピ、{pose} |
| a11y.code | 초대 코드 {code}, 글자 하나씩 읽어요 | Invite code {code}, read one character at a time | 招待コード {code}、1文字ずつ読み上げます |
| a11y.share | 초대 코드 공유 시트 열기 | Open the share sheet for the invite code | 招待コードの共有シートを開く |
| a11y.copy | 초대 코드 복사 | Copy the invite code | 招待コードをコピー |
| a11y.switch | {name}, {state} | {name}, {state} | {name}、{state} |
| a11y.dateField | 함께한 날짜 입력 | Enter the date you got together | 一緒になった日を入力 |
| a11y.decor | 장식 소품, 읽지 않아도 돼요 | Decorative item | 装飾の小物（読み上げ不要） |
| a11y.close | 닫기 | Close | 閉じる |
| a11y.back | 뒤로 가기 | Go back | 戻る |
| a11y.coach | 안내: {text} | Tip: {text} | ヒント：{text} |

(Room-only keys on S20 — toolbar, decorate, undo, input, input.ro, send, apply, cancel, presence, countdown, version — are Later.) Note: S20 mocks still say "4개 중"; V0-00 says the template is used with total = 3.

---

## 7. Could NOT be determined from these inputs

- Easing curves and per-animation durations (celebration card hop/sparkle, sheet/dialog enter): verify against board S29.
- Whether RN `Modal` fade/slide stays within 150ms: verify on device / against board S29.
- Icon glyphs (SVG paths stripped): which icon each chip/banner/field/row uses — verify against board S22 (code icon names: `ui/Icon.tsx`).
- Chip icon size when a chip does carry an icon (S22 chips have none; V0-01 uses 15): verify against board S22.
- Bottom sheet, toast, skeleton visuals (sizes, paddings, HC): verify against board S22 / V0-03 (not drawn on S22).
- List-row separators inside a group card: verify against board S22.
- `label` token weight 600 vs rendered 700: verify against board S19.
- Segment item height 44 vs 48pt touch rule: verify against board S22.
- Screen gutter (code uses 20 = `spacing[4]`): not stated on S19/S22 — verify against board V0-02.
- Exact dark/HC values for occupancy chips, bubbles, room pills: present on S22 but not extracted (room features are Later).
- Contents of `the V0 scope notes (summarised in `../../spec.md`)` (open questions) — not part of the inputs.
