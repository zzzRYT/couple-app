# S10 되돌리기 — 열린 대화 안에서만

승인자: 미승인
승인일: 미정

## 목적, ID, 경로

ID: S10
Route: /prompt (dialog)

## 디자인 원본

- [S10-undo.dc.html](../../../canvas/project/S10-undo.dc.html)

## 이미지

- [S10-confirm__ios-day-light-ko.png](../../../exports/S10-confirm__ios-day-light-ko.png)

## 상태와 상호작용

- **캔버스 보드**: `S10-undo`
- **목적**: 점유자가 지금 열린 프롬프트 대화에서 방금 만든 변경을 취소하고 바로 앞 미리 보기로 돌아가요(없으면 현재 방 보기). 확인, 진행, 성공(점유는 그대로), 되돌릴 변경 없음, 상대 점유 중, 늦은 중복 요청(서버 충돌), 실패.
- **이동**: S09의 "이전 미리 보기로 되돌리기" → 확인 다이얼로그 → 같은 미리 보기 화면.
- **적용한 뒤에는 되돌릴 수 없어요.** 되돌리기는 아직 적용하지 않은 변경에만 있고 방 도구 막대에는 되돌리기 버튼이 없어요. 다시 적용(redo)도 없어요.
- 되돌려도 점유와 대화는 그대로 이어져요(점유를 풀지 않아요). 되돌릴 수 있는 만큼은 이 대화에서 만든 미리 보기까지예요.
- 되돌리기는 점유자만 할 수 있어서 상대가 점유 중이면 이유와 함께 막혀요.
- **긴 문구·언어 사례**: 다이얼로그 본문은 3줄까지 늘어나요.

| 상태 ID | 설명 | 사용하는 키 | 그린 조합 |
|---|---|---|---|
| `S10-confirm` | 되돌리기 확인 (이 대화 안에서만) | `preview.changes` `preview.changes.list` `preview.badge` `preview.view.current` `preview.view.candidate` `preview.undo` `preview.applyHint` `preview.apply` `preview.cancel` `a11y.pose.wave_main` `a11y.mascot` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `prompt.title` `prompt.mine` `a11y.presence` `undo.title` `undo.body` `undo.confirm` `common.cancel` | iOS·낮·밝게·ko, Android·밤·어둡게·ko, iOS·낮·밝게·en, Android·밤·어둡게·ja 외 4 |
| `S10-progress` | 되돌리는 중 | `preview.changes` `preview.changes.list` `preview.badge` `preview.view.current` `preview.view.candidate` `preview.undo` `preview.applyHint` `preview.apply` `preview.cancel` `a11y.pose.wave_main` `a11y.mascot` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `prompt.title` `prompt.mine` `a11y.presence` `undo.progress` | iOS·낮·밝게·ko, Android·밤·어둡게·ko |
| `S10-done` | 성공 · 바로 앞 미리 보기로 (점유는 그대로) | `preview.changes` `preview.changes.list` `preview.badge` `preview.view.current` `preview.view.candidate` `preview.undo` `preview.applyHint` `preview.apply` `preview.cancel` `a11y.pose.wave_main` `a11y.mascot` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `prompt.title` `prompt.mine` `a11y.presence` `undo.done.title` `undo.done.body` | iOS·낮·밝게·ko, Android·밤·어둡게·ko |
| `S10-none` | 되돌릴 변경 없음 (적용한 방은 되돌릴 수 없음) | `preview.view.current` `preview.view.candidate` `preview.undo` `preview.applyHint` `preview.apply` `preview.cancel` `a11y.pose.wave_main` `a11y.mascot` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `prompt.title` `prompt.mine` `a11y.presence` `undo.none.title` `undo.none.body` `common.confirm` | iOS·낮·밝게·ko, Android·밤·어둡게·ko |
| `S10-busy` | 상대가 점유 중 · 되돌릴 수 없음 | `preview.changes` `preview.changes.list` `preview.badge` `preview.view.current` `preview.view.candidate` `preview.undo` `sample.partner` `preview.partner.wait` `preview.partner.readonly` `preview.applyHint` `preview.apply` `preview.cancel` `a11y.pose.wave_main` `a11y.mascot` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `prompt.title` `prompt.partner` `a11y.presence` `undo.busy.title` `undo.busy.body` `common.confirm` | iOS·낮·밝게·ko, Android·밤·어둡게·ko, iOS·낮·밝게·en, Android·밤·어둡게·ja |
| `S10-conflict` | 늦은 중복 요청 · 서버 충돌 안전 상태 | `preview.changes` `preview.changes.list` `preview.badge` `preview.view.current` `preview.view.candidate` `preview.undo` `preview.applyHint` `preview.apply` `preview.cancel` `a11y.pose.wave_main` `a11y.mascot` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `prompt.title` `prompt.mine` `a11y.presence` `undo.conflict.title` `undo.conflict.body` `common.confirm` | iOS·낮·밝게·ko, Android·밤·어둡게·ko, iOS·낮·밝게·en, Android·밤·어둡게·ja |
| `S10-error` | 되돌리기 실패 | `preview.changes` `preview.changes.list` `preview.badge` `preview.view.current` `preview.view.candidate` `preview.undo` `preview.applyHint` `preview.apply` `preview.cancel` `a11y.pose.wave_main` `a11y.mascot` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `prompt.title` `prompt.mine` `a11y.presence` `undo.err.title` `undo.err.body` `common.retry` `common.cancel` | iOS·낮·밝게·ko, Android·밤·어둡게·ko |

## 이동 및 뒤로

F03: S07 → S08 → S09 → 적용 후 S07; S09 → S10 → 이전 미리보기; 필요 시 S12 동의. 뒤로: 대화/시트 또는 확인을 닫고 이전 단계로. 취소 시 방은 유지.

## 접근성

상태 표에 나열된 `a11y.*` 키를 스크린 리더 이름으로 사용합니다. 공통 접근성 및 200% 글자 규칙은 [interaction notes](../../../interaction-notes.md#10-접근성-상호작용)를 참조하세요. TODO: 해당 상태에 명시되지 않은 역할과 이름을 확인하세요.

## 수락 시나리오

- [ ] S10-AC-01: 열린 대화 안에서 되돌리면 이전 미리보기로 돌아가고 방은 바뀌지 않는다.

## 열린 질문 / 추적

TODO: 명세에 없는 disabled/offline 상태의 적용 여부와 정확한 뒤로 대상을 확인하세요. 시나리오와 요구사항·테스트·실행 결과는 [추적표](../../traceability.md)에 연결하세요.
