# V0-05 기념일 추가 · 편집 — design extract

Verified 2026-11-02: 80 claims checked, 3 corrected.

Source: artifact https://claude.ai/artifact/M2WFQCFnVzoWbHNhJPCz5X (version 1793598115-fafc), board `V0-05-anniv-edit.dc.html`, page "V0 · 기념일" (canvas page id `v0-anniv`, board 1760×5772 at x0 y4956).
Read from the slimmed board; icon path data was taken from the unslimmed copy `artifact/project/V0-05-anniv-edit.dc.html`. The text in both files matches.
Copy: `copy-v0.md` (keys from other sections of that file are marked †).
Hex → token: `light.*` = `tokens.color.app.light.normal.*` and `dark.*` = `tokens.color.app.dark.normal.*` in `apps/mobile/src/theme/tokens.ts`.

## 1. Board header facts

- Eyebrow: `AROOM · V0 · D+DAY · 기념일 편집`. H1: `V0-05 기념일 추가 · 편집`. `<title>`: `V0 기념일 추가 · 편집`.
- Description: `둘만의 기념일을 만들고 고치고 지워요. 두 사람 모두 할 수 있고, 저장하면 상대에게도 보여요.`
- Section 1 `iOS · 밝은 앱 · 한국어`, with this note: `"+"(목록 오른쪽 위)로 열리는 전체 화면 시트예요. 저장·취소는 위 막대, 삭제는 편집에서만 아래에 있어요.`
- Section 2 is `어두운 앱 · 영어 · 일본어`. Section 3 is `규칙`, with three cards.

### Rules on the board (verbatim)
**폼 규칙**
- 제목 필수 1~20자, 날짜 필수(과거·미래 모두 가능), 반복 "매년"(기본) 또는 "한 번만", 메모 선택 0~100자, 알림 "기본 설정"(기본) 또는 "끄기".
- 저장은 제목이 있고 오류가 없을 때만 켜져요. 20자를 넘으면 입력은 받되 카운터와 칸이 빨개지고 저장이 잠겨요.
- 매년이면 다음 날짜와 D-n을, 한 번만이면서 지난 날짜면 "지난 기념일에 들어가요"를 바로 보여 줘요.
- 고친 것이 있는데 취소를 누르면 버릴지 물어요.

**함께 쓰는 기념일**
- 저장하면 서버에 쓰고 두 사람 목록에 보여요. 상대 앱이 열려 있으면 Realtime으로 바로, 닫혀 있으면 상대가 앱을 열 때 반영돼요(상대 기기의 알림·위젯도 그때 다시 맞춰요).
- 동시 편집은 마지막 저장이 이기지 않아요: 저장할 때 서버 버전이 바뀌었으면 V0-edit-conflict로 최신 내용을 다시 보여 주고 한 번 더 저장하게 해요.
- 상대가 이미 지운 기념일이면 V0-edit-gone 후 목록으로.
- 삭제는 확인 후 두 사람 모두에게서 바로 사라지고 되돌릴 수 없어요.

**알림 선택** (this card uses infoBg #E1EDF5 with a 2px info #2D5E86 border)
- "기본 설정"은 설정의 알림 시간·미리 알림을 따라요(기본 오전 9:00 · 하루 전, 오너 확인 필요).
- "끄기"는 이 기념일만 이 기기에서 알리지 않아요. 상대 기기의 알림은 상대가 정해요.

### Requested topics checked against the board
| Topic | Board says |
|---|---|
| Title limit | Required, 1–20 characters. The counter counts every character including spaces: `처음 만난 날`=7, `첫 여행 · 강릉`=9, `우리가 처음으로 손잡고 한강 걸었던 날`=21. Input past 20 is still accepted. |
| Memo limit | Optional, 0–100 characters (`홍대 앞 작은 카페, 비 오던 날`=18; EN memo=38; JA memo=13). No memo-overflow frame is drawn, but the copy key `edit.err.memo.long` exists. |
| Repeat | `매년` (default) / `한 번만`. |
| Notification | `기본 설정 (오전 9:00 · 하루 전)` (default) / `알림 끄기`. Applies to this device only. |
| Who can edit | Both partners. Frame caption: `편집 (상대가 만든 기념일도 가능)`. |
| Created-by / last-edited | NOT on this board. It appears on V0-04 detail (§4). |
| Version conflict | Rule plus the V0-edit-conflict frame. |
| Already deleted | Rule plus the V0-edit-gone frame. |
| Save error | V0-edit-saveerr frame (toast). No retry is drawn. |
| Offline disabled | NOT on this board (see §4 and §5). |

## 2. Global frame facts

### Device and chrome
- Frame: 390×844, radius 44, frame ring `box-shadow 0 0 0 6px` #E3CDB0 (light.divider) / #4A3D36 (dark.divider). Screen bg #FBF1E3 light.bg / #2B2320 dark.bg.
- Dynamic island: top 11, 124×36, r18, #000. Home indicator: bottom 8, 134×5, r3, light.text #3F2D22 / dark.text #F7EBDD, opacity .85. No status-bar text is drawn.
- Safe areas: the nav bar has padding-top 51 (= `safeArea.ios.top` 47 + 4). The bottom spacer is 42px (= bottom 34 + 8). The delete footer has padding-bottom 42. The sheet has padding-bottom 34.

### Nav bar ("full-screen sheet" header)
- Row: `display:flex; align-items:center; gap:4; padding:51 8 4; min-height:48`. Total header height is about 103.
- Left: `취소` (`common.cancel`). Text button, min 48×48, padding 0 12, transparent, Noto Sans KR 16/500, colour text.
- Center: title `기념일 추가` (`edit.new.title`) or `기념일 편집` (`edit.edit.title`). Noto Sans KR 17px, line-height 25.5, weight 700, text, centered, `word-break:keep-all`.
- Right: `저장` (`common.save`). Text button, 48×48 min, Noto Sans KR 16/700.
  - Enabled colour is primary (#B24A24 light / #F0A67F dark).
  - Disabled has the `disabled` attribute, text2 #6B5444, and opacity .6.
- Side slots have min-width 48. The right slot is justified to the end.

### Form body
- Container: `flex:1; padding:8 20 0; flex-direction:column; gap:14`. The mock clips with `overflow:hidden`; implement it as a ScrollView (inference).
- Order: Title → Date → Repeat (+ preview chip) → Memo → Notification → shared hint. Edit mode adds a footer delete button.
- Each field group: `flex column; gap:6`.
- Label: Noto Sans KR 14/21/700, text. Label and counter sit in a row with `justify-content:space-between; align-items:baseline`.
- Counter: Gowun Dodum 13/19.5/400, text2. It turns danger #A3341C when there is an error. Format `{n}/{max}` (`edit.counter`).

### Text field (title)
- Box: `min-height:52; padding:0 16; gap:10; align-items:center; bg surface #FFF8EC (dark #352B26); border:2px solid border #8A6B55 (dark #A58E7B)`.
- Radius is hand-drawn jitter: `15/17.3/17.6/15 / 17/16/16/17.9` (≈ `radius.input` 16 ±12%).
- Value: Gowun Dodum 16/24/400, text. Placeholder: same font, text2. Placeholder `예: 처음 만난 날` = `edit.field.title.ph`.
- Error style: border and counter change to danger #A3341C. The background stays surface and the value colour stays text.
- Error message sits directly under the field, inside the same group with gap 6. It is `role="alert"`, row `gap:6; align-items:center`. The `warn` icon (triangle) is 16px, stroke 2.2, danger. Text is Noto Sans KR 13/19.5/**700**, danger.
- Focus style: NOT drawn (see §5).

### Memo field
- Same box with `min-height:64; padding:14 16; align-items:flex-start`. Text uses `white-space:pre-line` (multi-line).
- Placeholder `둘만 아는 이야기를 적어요` = `edit.field.memo.ph`.

### Date field (read-only boxes; tapping opens the picker)
- The whole row is a single `<button>` with `display:flex; gap:8`. It holds 3 boxes.
- KO/JA order is year (flex 1.5), month (flex 1), day (flex 1).
- Each box: `min-height:52; padding:0 12; bg surface; 2px border; radius jitter 17.9/15/17.3/17.6 / 15/17/16/16; centered; gap:4`.
- Number: Noto Sans KR 20/30/700, text. Unit (`년`/`월`/`일`): Gowun Dodum 14/21/400, text2.
- EN order is Month (flex 1.2, `May`), Day (flex 1, `17`), Year (flex 1.4, `2025`). EN boxes have no unit labels.

### Segmented control (repeat, notification; also the list filter)
- Track: `role="group"; display:flex; gap:3; padding:3; radius:13; bg surface2 #F3E0C4 (dark #40342E)`.
- Option: `flex:1; min-height:42; radius:10`, Noto Sans KR 15px, `aria-pressed`.
  - Selected: border 1.5 line #4A3426 (dark #E8D3BC), bg surface (dark #352B26), weight 700, text.
  - Unselected: no border, transparent, weight 500, text2 (dark #CDB8A5).
- The notification segment holds the long label `기본 설정 (오전 9:00 · 하루 전)` at the same 42 min-height. Wrapping is not shown.

### Preview chip (under Repeat, inside the repeat group)
- Next (yearly) variant: inline-flex pill, `gap:6; padding:4 11; radius:999; bg infoBg #E1EDF5 (dark #25364A); border 1.5 info #2D5E86 (dark #9CC6E4)`. Text is Noto Sans KR 13/19/700, colour info. Icon is a 15px calendar-with-heart, stroke 2.2, colour info.
  - Text: `다음 기념일 {date} · {left}` (`edit.preview.next`). `{date}` = `date.short` (`5월 17일 (월)`). `{left}` = `dday.left` `D-196` or `dday.today` `오늘`.
- Past (once + past date) variant: bg surface2 #F3E0C4, border text2 #6B5444, text text2. Icon is a 15px info circle (circle r9 + `M12 11v5M12 8h.01`).
  - Text: `지난 날짜예요. 지난 기념일에 들어가요.` (`edit.preview.past`).
- The icon is a calendar rect (x3.5 y5 17×15.5 rx2.5), `M3.5 9.5h17M8 3v4M16 3v4` (top line + two binding ticks) and a heart (`M12 18s-3-1.9-3-3.8a1.5 1.5 0 0 1 3-.6 1.5 1.5 0 0 1 3 .6c0 1.9-3 3.8-3 3.8z`). The app `Icon.calendarHeart` has only the heart, with no calendar frame.

### Shared hint (last row of the form)
- Row `gap:8; align-items:flex-start`. Info icon 18px, stroke 2, colour info. Text is Gowun Dodum 13/19.5/400, text2.
- Text: `저장하면 하루님에게도 보여요. 하루님 앱이 닫혀 있으면 앱을 열 때 반영돼요.` = `edit.shared.hint` with {name}=하루.

### Delete footer (edit mode only)
- It replaces the 42px spacer. Container: `flex:none; padding:12 20 42; column; gap:6`.
- Button: full width, `min-height:48; padding:8 20; transparent; no border; radius jitter ≈24`, centered, gap 8.
- Trash icon: 20px, stroke 2.1, path `M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6`.
- Label `이 기념일 삭제` (`edit.delete`): Noto Sans KR 16/24/700, danger #A3341C (dark #FF9A82).

### Date picker (bottom sheet + wheel), from V0-edit-picker
- Scrim: `inset:0; rgba(0,0,0,.35)`, z35.
- Sheet: `role="dialog"`, bottom-anchored, **height 330**, radius `28 30 0 0`, bg surface #FFF8EC, `border-top:2px solid line #4A3426`, padding `10 20 34`, column gap 14.
- Handle: 40×5, r3, bg border #8A6B55 at opacity .6.
- Header row (`space-between`):
  - Title `날짜 고르기`: Noto Sans KR 18/27/700, text. There is no V0 copy key; the existing app key `space.date.pick` has the same ko text.
  - Right: `완료` (`common.done`). Text button, 16/700, primary, min 48.
- Wheel: `role="group" aria-label="날짜 고르기"`, `padding:0 8`, 3 equal columns (flex 1 each), 5 rows × **40px** visible.
- Selection band: absolute `top:80; height:40; left/right 0`, r12, bg surface2 #F3E0C4, border 1.5 border #8A6B55, aria-hidden.
- Row text (Noto Sans KR, colour text) from top to bottom:
  - Rows ±2: 17px/500, opacity .3
  - Rows ±1: 19px/500, opacity .55
  - Centre row: **21px/700**, opacity 1
- The wheel has no unit suffixes. Sample columns: years 2023–2027 (2025 selected), months 3–7 (5), days 15–19 (17).
- The app's `DateWheel` differs: ROW 44, a surface2 fill on the selected row, emphasis 17, text2 for other rows, a 2px line card around it, and `완료` as a full Button below. The `DateField` year box uses flex 1.4.

### iOS system alerts (delete, discard, conflict, gone)
- Drawn as a native `UIAlertController`, not the app's `Dialog` (the frame label says `iOS 시스템 알림`). Use `Alert.alert`.
- Light: scrim rgba(0,0,0,.35). Box 270 wide, r14, bg rgba(242,242,242,.96). Body padding 19 16 15, gap 4. Title SF 600 17/22 #000; message SF 400 13/18 #000. Buttons are min 44 high, with 0.5px separators rgba(60,60,67,.29). Blue #007AFF, red #FF3B30.
- Dark: scrim rgba(0,0,0,.5), box rgba(44,44,46,.96), text #FFF, separators rgba(84,84,88,.65), blue #0A84FF, red #FF453A.
- Two buttons sit in a row. A single button uses a column. The bold (600) button is the preferred action.

### Toast
- `role="status"`, absolute `left:20; right:20`.
  - bottom 110 on form screens (above the delete footer)
  - bottom 96 on the list (above the 83px tab bar)
- Box: `padding:12 16; gap:10`, row, centered. Radius jitter `20.2/16.9/19.4/19.8 / 16.9/19.1/18/18` (≈18, not a pill).
- Colours: bg #3F2D22 (light.text), `box-shadow:0 6px 18px rgba(0,0,0,.18)`.
- Icon: 20px, stroke 2.3, #FFF8EC (light.surface). Text: Noto Sans KR 15/22.5/700, #FFF8EC.
- Icons: check `M5 12.5l4.5 4.5L19 7` for success; warn triangle for error.
- The app `Toast` differs: pill radius, padding 12/20 (spacing[2]/spacing[4]), gap 8, 18px icon, `alignSelf:center` (not full width), no shadow, `role=alert`, auto-hide after 3s. `tokens.elevation` says "no shadows anywhere". The board toast is the only element with a shadow.
- Dark toast: not drawn.

### Fonts (per language)
| | Emphasis (labels, nav, buttons, segments, chip, date numbers, error, toast) | Body (values, placeholders, counters, units, hint) | line-height | break |
|---|---|---|---|---|
| ko | Noto Sans KR 500/700 | Gowun Dodum 400 | 1.5 | `word-break:keep-all` |
| en | same stacks as ko (Noto Sans KR / Gowun Dodum) | Gowun Dodum | 1.4 (17→23.8, 14→19.6, 13→18.2, 16→22.4, 20→28) | normal |
| ja | Zen Maru Gothic (both roles) | Zen Maru Gothic | 1.6 (17→27.2, 14→22.4, 13→20.8, 16→25.6, 20→32) | `line-break:strict` |

- The chip keeps a fixed line-height of 19px in every language.
- List title `기념일` uses Gaegu 30/45/700 (display). System alerts and the tab bar use -apple-system / SF Pro Text.
- `typography.ts` maps ja body → NotoSansJP, but the board (and `tokens.typography.families.ja.body`) uses Zen Maru Gothic.
- Date numbers are 20px/700 in Noto Sans KR, not the display face, even though `faceRule` would allow display at ≥20 bold.

### Colour map
| Hex | Light token | Dark hex | Dark token | Used for |
|---|---|---|---|---|
| #FBF1E3 | bg | #2B2320 | bg | screen |
| #FFF8EC | surface | #352B26 | surface | fields, selected segment, sheet, toast ink |
| #F3E0C4 | surface2 | #40342E | surface2 | segment track, wheel band, past chip |
| #3F2D22 | text | #F7EBDD | text | text, toast bg |
| #6B5444 | text2 | #CDB8A5 | text2 | counters, units, placeholders, disabled save |
| #B24A24 | primary | #F0A67F | primary | 저장, 완료, + button, selected tab |
| #4A3426 | line | #E8D3BC | line | selected segment border, sheet top border, + border, icon tile border |
| #8A6B55 | border | #A58E7B | border | field borders, wheel band, handle |
| #E3CDB0 | divider | #4A3D36 | divider | list cards, frame ring |
| #A3341C | danger | #FF9A82 | danger | errors, delete |
| #2D5E86 / #E1EDF5 | info / infoBg | #9CC6E4 / #25364A | info / infoBg | next chip, hint icon |
| #C9B8E8 | illustration.palette.lav | — | — | list icon tile |
| #FFFFFF | onPrimary | — | — | + icon |
| #007AFF #FF3B30 #0A84FF #FF453A, rgba(242,242,242,.96), rgba(44,44,46,.96) | none (iOS system) | | | alerts |
| rgba(0,0,0,.35) / .5 | none | | | scrims. The app Dialog/BottomSheet use rgba(43,35,32,.5). |
| rgba(249,249,249,.94) | none (system tab bar) | | | tab bar |

## 3. Screens

Unless noted, every screen uses the nav bar, the form layout and the default values described in §2. "Default form" means the light KO layout.

### V0-edit-new — 추가 · 비어 있음 (저장 잠김)
- Nav: `취소` | `기념일 추가` | `저장` **disabled** (text2, opacity .6).
- Title: counter `0/20` (text2); placeholder `예: 처음 만난 날`; border is the normal `border` colour.
- Date: `2026 년 / 11 월 / 2 일`. The default is today (the board's today is 2026-11-02, Monday).
- Repeat: `매년` selected. Chip: `다음 기념일 11월 2일 (월) · 오늘`. Today uses `dday.today`.
- Memo: `0/100`, placeholder. Notification: `기본 설정 (오전 9:00 · 하루 전)` selected.
- Hint row, then the 42px spacer. No delete button.
- No error is shown while the field is untouched. The empty-title error appears only on V0-edit-err-empty; its trigger is unspecified.

### V0-edit-filled — 추가 · 채움 (다음 날짜 미리 보기)
- `저장` enabled (primary).
- Title `처음 만난 날`, `7/20`, value colour text.
- Date `2025 년 5 월 17 일`. Repeat `매년`. Chip `다음 기념일 5월 17일 (월) · D-196`: the next occurrence is 2027-05-17, Monday, 196 days from 2026-11-02.
- Memo `홍대 앞 작은 카페, 비 오던 날`, `18/100`. Notification default.

### V0-edit-picker — 날짜 휠
- The filled form sits behind the sheet, showing title, date, repeat and chip, then the hint. Memo and notification are not drawn in this frame because the sheet covers them.
- Sheet and wheel are as in §2, with 2025/5/17 centred.
- Interaction (inferred from the controls): tap the date row → the sheet opens with the current value; scroll the columns; `완료` commits.
- What happens on a scrim tap or swipe-down is not specified.

### V0-edit-once — 한 번만 · 지난 날짜
- `저장` enabled. Title `첫 여행 · 강릉`, `9/20`. Date `2025 / 9 / 13`.
- Repeat: `한 번만` selected (aria-pressed true), `매년` unselected.
- Chip: past variant `지난 날짜예요. 지난 기념일에 들어가요.`
- Memo empty `0/100`. Notification default.
- Once + future date: not drawn (§5).

### V0-edit-err-empty — 제목 비어 있음
- `저장` disabled. Title counter `0/20` in **danger**; the field border is danger and shows the placeholder.
- Under the field: warn icon + `제목을 넣어 주세요` (`edit.err.title.empty`), `role=alert`.
- Rest of the form: date 2026/11/2, chip `… 11월 2일 (월) · 오늘`, memo empty.

### V0-edit-err-long — 제목 20자 넘음
- `저장` disabled. Counter `21/20` in danger, border danger.
- Value `우리가 처음으로 손잡고 한강 걸었던 날` in text colour. Overflow is not truncated.
- Error: warn icon + `제목은 20자까지 쓸 수 있어요` (`edit.err.title.long`). Rest of the form is the same as err-empty.

### V0-edit-edit — 편집 (상대가 만든 기념일도 가능)
- Nav title `기념일 편집`. `저장` is **enabled even with no changes**: the rule only requires a title and no errors.
- Values are the same as filled.
- Footer: `이 기념일 삭제` with trash icon, danger, full width, under the hint (§2).
- Nothing on the board shows who created the item or when it was last edited.

### V0-edit-delete — 삭제 확인
- Base: the edit screen. The iOS alert is `role=alertdialog`, `aria-label` = its title.
  - Title `기념일을 삭제할까요?` (`edit.delete.title`).
  - Message `하루님 화면에서도 사라지고 되돌릴 수 없어요.` (`edit.delete.body`).
  - Buttons in a row: left `취소` (`common.cancel`, 400, blue), right `삭제` (`common.delete`, 400, **red/destructive**).
- After confirming: the item is removed for both partners immediately and cannot be undone (rule).
- What comes next is not drawn. The copy key `edit.deleted` `삭제했어요` exists, which implies a toast on return to the list (§5).

### V0-edit-discard — 저장 안 하고 닫기
- Trigger: `취소` while there are unsaved changes (rule). The alert has title `고친 내용을 버릴까요?` (`edit.discard.title`). The message is an **empty** body element.
- Buttons in a row: left `버리기` (`edit.discard.cta`, 400, red/destructive), right `계속 고치기` (`edit.discard.keep`, **600 bold**, blue = preferred).
- Discard closes the sheet. Keep dismisses the alert.
- `취소` with no changes closes immediately (implied by the rule).

### V0-edit-conflict — 상대가 먼저 고침
- Alert title `하루님이 먼저 고쳤어요` (`edit.conflict.title`). Message `최신 내용을 불러왔어요. 확인하고 다시 저장해 주세요.` (`edit.conflict.body`).
- One button in a column: `확인` (`common.ok`, 600, blue).
- Behind the alert, the edit form already shows the **latest server content** (drawn with the same sample values) and `저장` is enabled.
- After `확인`, the user reviews the form and saves again (one more save, against the new version).

### V0-edit-gone — 상대가 이미 삭제함
- Alert title `이미 삭제된 기념일이에요` (`edit.gone.title`). Message `하루님이 삭제했어요. 목록으로 돌아갈게요.` (`edit.gone.body`). Single `확인` (600).
- On `확인` the sheet closes and returns to the list (rule: "V0-edit-gone 후 목록으로").

### V0-edit-saveerr — 저장 실패
- Base: the edit screen with all values intact. `저장` stays enabled; the delete footer is visible.
- Toast at bottom 110: warn triangle icon (#FFF8EC) + `저장하지 못했어요. 고친 내용은 그대로 있어요.` (`edit.save.err`).
- The sheet stays open. No retry button; the user taps `저장` again.

### V0-edit-saved — 저장 후 목록 · 토스트 (V0-04 list screen)
- Header: `display:flex; align-items:flex-end; space-between; padding:55 16 4 20`.
  - Left: title `기념일` (`tab.anniv`), Gaegu 30/45/700, text, padding-bottom 2.
  - Right: `+` button, 48×48 circle, bg primary, border 2 line. Plus icon 24 white, stroke 2.2. `aria-label="기념일 추가"` (`anniv.add`†).
- Filter: segmented control with `padding:10 20 2`. `전체` (`anniv.filter.all`†) and `직접 추가` (`anniv.filter.custom`†, **selected**).
- Body: `padding:10 20 0; gap:14`.
- Section label `다가오는 기념일` (`anniv.section.upcoming`†): Noto Sans KR 14/21/700, text2, padding 2 4 0. The section has gap 8.
- Card: surface, border 2 divider #E3CDB0, radius jitter ≈20 (18.8/21.6/22/18.8 / 21.2/20/20/22.4).
- Row: button, `min-height:64; padding:6 14; gap:12`.
  - Icon tile: 40×40, radius ≈13 jitter, bg lav #C9B8E8, border 1.5 line, star icon 22 stroke line.
  - Title `처음 만난 날`: Noto Sans KR 16/24/700, single line with ellipsis. Date `5월 17일 (월)`: Gowun 13/19.5 text2.
  - Right: `D-196`, Noto Sans KR 15/22.5/700, text.
  - Row a11y label: `처음 만난 날, 2027년 5월 17일 (월), D-196` (`anniv.row.a11y`† with `date.long`).
- Section `지난 기념일` (`anniv.section.past`†): the same row with `5월 17일 (일)` and `169일 전` (`dday.ago`) in **text2**. a11y label `처음 만난 날, 2026년 5월 17일 (일), 169일 전`.
- The rows have no `직접` badge, even though V0-04's "전체" list shows one.
- Spacer 91. Tab bar: `role=tablist`, `aria-label="탭 막대"`, height 83, padding-top 7.
  - Tabs: `홈 탭, 3개 중 1번째`, `기념일 탭, 3개 중 2번째, 선택됨` (`a11y.tab`), `설정 탭, 3개 중 3번째`.
  - Icons 25px. Labels SF 10/12: selected 600 primary, unselected 500 text2.
- Toast at bottom 96: check icon + `저장했어요` (`edit.saved`).

### Dark — V0-edit-filled (iOS · 어두운 앱 · 한국어)
- Same as filled, with every colour swapped to the dark tokens in the §2 colour map.
- Save is #F0A67F. Segment track is #40342E; selected segment has border #E8D3BC on #352B26. Chip is #25364A / #9CC6E4. Hint icon is #9CC6E4. Home indicator is #F7EBDD.

### Dark — V0-edit-delete
- The dark edit screen. Nav title `기념일 편집`; delete button and icon #FF9A82.
- Dark alert: scrim .5, #2C2C2E at .96, white text, #0A84FF `취소`, #FF453A `삭제`, separators rgba(84,84,88,.65).

### EN — V0-edit-filled (light)
- Nav: `Cancel` | `New anniversary` | `Save`.
- Fields:
  - `Title` with `14/20` and value `The day we met`.
  - `Date` boxes: `May` / `17` / `2025`, with no units and flex 1.2 / 1 / 1.4.
  - `Repeat`: `Every year` / `Once`. Chip: `Next: Mon, May 17 · In 196 days`.
  - `Note (optional)` with `38/100` and value `A tiny café in Hongdae, on a rainy day`.
  - `Notifications`: `Default (9:00 AM · 1 day before)` / `Off`.
- Hint: `Once saved, Haru sees it too. If Haru's app is closed, their phone updates when they open it.`
- Line-height is 1.4 and `keep-all` is removed. Every other dimension is the same as KO.

### JA — V0-edit-filled (light)
- Font is Zen Maru Gothic throughout.
- Nav: `キャンセル` | `記念日を追加` | `保存`.
- Fields:
  - `タイトル` with `7/20` and value `初めて会った日`.
  - `日付` boxes: `2025 年 / 5 月 / 17 日`, with ko proportions (1.5/1/1).
  - `繰り返し`: `毎年` / `1回だけ`. Chip: `次は5月17日(月)・あと196日`.
  - `メモ（任意）` with `13/100` and value `弘大の小さなカフェ、雨の日`.
  - `通知`: `基本設定（午前9:00・1日前）` / `オフ`.
- Hint: `保存するとハルさんにも表示されます。ハルさんのアプリが閉じていると、次に開いたときに反映されます。`

### Copy keys used, and board strings with no key in copy-v0-edit
| Board text | Key |
|---|---|
| 매년 / 한 번만 | `anniv.repeat.yearly` / `anniv.repeat.once`† |
| 기본 설정 (오전 9:00 · 하루 전) | `anniv.notify.default`† with `{time}`=`set.notify.time.value`† and `{early}`=`set.notify.early.1d`† |
| 알림 끄기 | `anniv.notify.off`† |
| 알림 | `edit.field.notify` (= existing `set.sec.notif`) |
| 날짜 고르기 | none in V0 copy. The existing app key `space.date.pick` has ko `날짜 고르기`, en `Choose a date`, ja `日付を選ぶ`. |
| 확인 | `common.ok` (en/ja `OK`) |
| 하루님 / Haru / ハルさん | `{name}` = partner display name. ko adds `님`, ja adds `さん`. |
| Drawn nowhere | `edit.err.memo.long`, `edit.deleted`, `edit.saving` |

The EN date box shows `May`, which is consistent with `Intl` short month in `DateWheel.fieldText`.

### A11y labels found on the board
- Segmented controls: `role=group`, options with `aria-pressed`.
- Error row: `role=alert`. Toasts: `role=status`.
- Alerts: `role=alertdialog` with `aria-label` = title.
- Picker: sheet `role=dialog`; wheel group `aria-label="날짜 고르기"`; the band is aria-hidden.
- All icons are `aria-hidden`.
- List: `+` button `aria-label="기념일 추가"`; rows and tabs as listed above.
- No labels on the board for: title/memo fields (the app `TextField` uses `label` as its accessibilityLabel), the date button, the wheel columns, or the counters.

### Keyboard
- No keyboard is drawn on any frame, and no field is shown in a focused state. The form has no "done/next" accessory.
- Implementation guidance (not from the board): the memo is multi-line (`pre-line`); keep `저장` reachable in the header.

## 4. References to other boards

| Board | What it says, as it applies here |
|---|---|
| V0-04-anniv `V0-anniv-detail-custom` | Shows `하루님이 추가했어요 · 10월 30일 수정` (`anniv.detail.by` `{name}님이 추가했어요 · {date} 수정`) above `이 기념일 삭제`, plus a `편집` button that opens this sheet. Rule: "직접 추가한 기념일은 두 사람 모두 만들고 고치고 지울 수 있어요. 상세에 누가 만들었는지와 마지막 수정일을 보여요." |
| V0-04 `V0-anniv-list-empty` | Empty "직접 추가" list with a `기념일 추가` CTA. "+" in the header opens V0-edit-new. |
| V0-04 rules | `생일·시즌·직접 추가(매년)는 양력 같은 월·일, "한 번만"은 그 날짜 하루.` · upcoming covers today through +1 year; past covers −1 year · D-n is shown in the accent colour within 14 days, and today is a filled pill `오늘` · calculations use local midnight in the space's time zone. |
| V0-00-flow | `V0-edit-*: 추가 · 편집 · 삭제`. `직접 추가 기념일: 두 사람 누구나 추가·편집·삭제(삭제는 확인). 동시 편집은 버전 확인 후 충돌 안내.` |
| V0-00-flow | `앱이 열려 있는 동안 Realtime 힌트 → 다시 불러오기 … 불러오기는 전부 아니면 없음(2026-11-01 규칙). 오프라인은 마지막 데이터로 읽기만.` This implies offline = read-only, but the board draws no offline state for the edit sheet. |
| copy-v0-edit | `edit.field.notify` reuses `set.sec.notif`. Every other key is new, and the EN/JA text is a draft (`EN·JA 초안`). |
| App code | Board components that differ from the existing ones: `DateField`/`DateWheel`, `Toast`, `BottomSheet` (330 fixed height and handle 40×5 on the board vs app 40×4, maxHeight 90%, title type `heading` 20), and `Dialog` (the board uses the iOS system alert instead). Icons not in `Icon.tsx`: trash, plus, star, home, settings-sun, and the calendar-with-heart chip icon. |

## 5. Facts that could not be determined
- Focused state of the title and memo fields (border colour and width). Not drawn. `TextField` uses `focus` #2D5E86. Verify against board V0-edit-filled.
- When the empty-title error appears (on blur, on save tap, or after first edit). Verify against board V0-edit-err-empty.
- Whether typing past 20 is hard-capped at some length. The rule only says input is accepted.
- Memo over 100: no frame is drawn (copy `edit.err.memo.long` exists). Presumed to mirror the title (red counter and border, save locked). Verify against board V0-edit-err-long.
- Once + future date chip text (the next chip? D-n?). Not drawn. Verify against board V0-edit-once.
- Yearly + date whose occurrence is today, or with a past year: drawn only as `오늘` (new) and next year (filled).
- Saving state (spinner or disabled save, `edit.saving` `저장하는 중이에요`): not drawn.
- Offline behaviour of the sheet (save disabled, banner): not on the board.
- Toast duration and animation, and the dark-mode toast colours.
- The post-delete destination and the `삭제했어요` toast: not drawn.
- Whether the picker commits on scrim tap or swipe, and the wheel year range. Not drawn; the app uses maxYear−80..maxYear and also needs future years.
- Whether changes to the notification selection alone count as "고친 것" for the discard prompt (it is device-local).
- Dark variants of picker, errors, discard, conflict, gone, saveerr and saved: only filled and delete are drawn dark. EN/JA exist only for filled. Use token swaps.
- Whether save is disabled in edit mode when nothing has changed. The board shows it enabled.
- The `기본 설정` time when settings differ from the default: the rule says it follows Settings (`오너 확인 필요`).
- Status bar contents and sheet presentation animation (full-screen modal vs page sheet): verify against board V0-edit-new.
- Whether the form scrolls under the nav bar, and whether the nav bar has a divider. None is drawn.
