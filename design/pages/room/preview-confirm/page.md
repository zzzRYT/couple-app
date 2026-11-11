# S09 공유 미리 보기 / 적용 확인·취소

승인자: 미승인
승인일: 미정

## 목적, ID, 경로

ID: S09
Route: /prompt (panel)

## 디자인 원본

- [S09-preview-confirm.dc.html](../../../canvas/project/S09-preview-confirm.dc.html)

## 이미지

- [S09-gen-preview__ios-day-light-ko.png](../../../exports/S09-gen-preview__ios-day-light-ko.png)
- [S09-chat-making__ios-day-light-ko.png](../../../exports/S09-chat-making__ios-day-light-ko.png)
- [S09-chat-ready__ios-day-light-ko.png](../../../exports/S09-chat-ready__ios-day-light-ko.png)
- [S09-chat-mine__ios-day-light-ko.png](../../../exports/S09-chat-mine__ios-day-light-ko.png)
- [S09-toggle__ios-day-light-ko.png](../../../exports/S09-toggle__ios-day-light-ko.png)
- [S09-chat-refine__ios-day-light-ko.png](../../../exports/S09-chat-refine__ios-day-light-ko.png)
- [S09-applied__ios-day-light-ko.png](../../../exports/S09-applied__ios-day-light-ko.png)
- [S09-chat-partner__ios-day-light-ko.png](../../../exports/S09-chat-partner__ios-day-light-ko.png)
- [S09-partner-applied__ios-day-light-ko.png](../../../exports/S09-partner-applied__ios-day-light-ko.png)
- [S09-chat-mine__ios-night-dark-ko.png](../../../exports/S09-chat-mine__ios-night-dark-ko.png)
- [S09-chat-mine__ios-day-light-en.png](../../../exports/S09-chat-mine__ios-day-light-en.png)

## 상태와 상호작용

> **2026-11-10 · 꾸미기 독으로 바뀌었어요.** 아래 설명과 상태 표의 일부는 2026-10 설계(꾸미기 시트 · 적용 확인 화면) 기준으로 남아 있어요. 지금 흐름은 방 아래 작은 독 + 방 위 미리 보기이고, 오너가 2026-11-10에 정한 규칙은 ① 적용 직후 방 위 ‘적용했어요 · 되돌리기’ 한 줄(한 단계 · 다시 적용 없음 · 다음 요청, 방 탭을 떠날 때, 3분 유휴에 끝남) ② 차례 부탁하기 · 넘겨주기 ③ 독의 ‘오늘 n번 남음’이에요. 현재 상태 목록은 캔버스 보드를, 규칙은 [interaction notes](../../../interaction-notes.md) §4–§6 · §9 · §14와 [spec](../../../../specs/001-couple-prompt-todo/spec.md)의 FR-011 · FR-013 · FR-028 · FR-030 · FR-031을 따르세요. 위 이미지는 현재 보드에서 다시 뽑았어요.

- **캔버스 보드**: `S09-preview-confirm`
- **목적**: 두 사람에게 같은 현재 방과 후보를 보여 주고, 점유자만 적용·취소·이전 미리 보기로 되돌리기(S10). 적용은 독의 적용하기 한 번이 확인이고(확인 화면 없음), 적용 직후 방 위 한 줄에서 한 번 되돌릴 수 있어요(S10). 현재 방/미리 보기 전환, 유효성 경고(보호 영역 자동 이동, 한도 초과), 세션 만료 직전, 적용 중·성공·취소, 네트워크·모델 오류, 버전 충돌.
- **이동**: S08 → 미리 보기 → 적용(점유 해제 → 방) / 취소(현재 방 유지, 점유 해제).
- 1단계의 "나에게만 보여요"는 폐기: 미리 보기는 공유 대화에 저장되어 **두 사람 모두에게 보여요**(방은 적용 전까지 안 바뀜).
- 적용은 session owner + expected version + idempotency key(서버). 충돌이면 "방이 방금 바뀌었어요".
- **적용 직후 한 번 되돌릴 수 있어요**(2026-11-10 오너 결정): 적용하면 독이 닫히고 방 위에 ‘적용했어요 · 되돌리기’ 한 줄이 떠요(`S09-applied`). 한 단계만이고 다시 적용하는 기능(redo)은 없어요. 적용 확인 다이얼로그(`S09-confirm`)와 ‘되돌리기 없음’ 안내는 없어졌어요.
- **긴 문구·언어 사례**: 만료 직전 안내는 초 단위 변수(`{s}`)를 쓰고 두 줄까지 늘어나요.

| 상태 ID | 설명 | 사용하는 키 | 그린 조합 |
|---|---|---|---|
| `S09-mine` | 점유자 · 미리 보기 + 적용/취소 (공유 미리 보기) | `preview.changes` `preview.changes.list` `preview.shared` `preview.badge` `preview.view.current` `preview.view.candidate` `preview.undo` `preview.applyHint` `preview.apply` `preview.cancel` `a11y.pose.wave_main` `a11y.mascot` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `prompt.title` `prompt.mine` `a11y.presence` | iOS·낮·밝게·ko, Android·밤·어둡게·ko, iOS·낮·밝게·en, Android·밤·어둡게·ja 외 4 |
| `S09-confirm` | 적용 확인 · 적용하면 되돌릴 수 없다고 알림 | `preview.changes` `preview.changes.list` `preview.badge` `preview.view.current` `preview.view.candidate` `preview.undo` `preview.applyHint` `preview.apply` `preview.cancel` `a11y.pose.wave_main` `a11y.mascot` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `prompt.title` `prompt.mine` `a11y.presence` `preview.confirm.title` `preview.confirm.body` `common.cancel` | iOS·낮·밝게·ko, Android·밤·어둡게·ko |
| `S09-toggle` | 점유자 · 현재 방 보기로 전환 | `preview.changes` `preview.changes.list` `preview.shared` `preview.view.current` `preview.view.candidate` `preview.undo` `preview.applyHint` `preview.apply` `preview.cancel` `a11y.pose.wave_main` `a11y.mascot` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `prompt.title` `prompt.mine` `a11y.presence` | iOS·낮·밝게·ko, Android·밤·어둡게·ko |
| `S09-partner` | 상대 · 읽기 전용 (적용 버튼 비활성, 점유자 표시) | `preview.changes` `preview.changes.list` `preview.shared` `preview.badge` `preview.view.current` `preview.view.candidate` `preview.undo` `sample.partner` `preview.partner.wait` `preview.partner.readonly` `preview.applyHint` `preview.apply` `preview.cancel` `a11y.pose.wave_main` `a11y.mascot` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `prompt.title` `prompt.partner` `a11y.presence` | iOS·낮·밝게·ko, Android·밤·어둡게·ko, iOS·낮·밝게·en, Android·밤·어둡게·ja |
| `S09-warn-protect` | 경고 · 보호 영역을 가린 소품 자동 이동 | `preview.warn.protected` `preview.changes` `preview.changes.list` `preview.badge` `preview.view.current` `preview.view.candidate` `preview.undo` `preview.applyHint` `preview.apply` `preview.cancel` `a11y.pose.wave_main` `a11y.mascot` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `prompt.title` `prompt.mine` `a11y.presence` | iOS·낮·밝게·ko, Android·밤·어둡게·ko |
| `S09-warn-limit` | 경고 · 한도 초과, 줄인 제안 | `preview.suggest` `prompt.limit` `preview.changes` `preview.changes.list` `preview.badge` `preview.view.current` `preview.view.candidate` `preview.undo` `preview.applyHint` `preview.apply` `preview.cancel` `a11y.pose.wave_main` `a11y.mascot` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `prompt.title` `prompt.mine` `a11y.presence` | iOS·낮·밝게·ko, Android·밤·어둡게·ko |
| `S09-expiring` | 세션 만료 직전 | `preview.expiring` `preview.changes` `preview.changes.list` `preview.badge` `preview.view.current` `preview.view.candidate` `preview.undo` `preview.applyHint` `preview.apply` `preview.cancel` `a11y.pose.wave_main` `a11y.mascot` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `prompt.title` `prompt.mine` `a11y.presence` | iOS·낮·밝게·ko, Android·밤·어둡게·ko |
| `S09-applying` | 적용 중 | `preview.changes` `preview.changes.list` `preview.badge` `preview.view.current` `preview.view.candidate` `preview.undo` `preview.applyHint` `preview.applying` `preview.cancel` `a11y.pose.wave_main` `a11y.mascot` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `prompt.title` `prompt.mine` `a11y.presence` | iOS·낮·밝게·ko, Android·밤·어둡게·ko |
| `S09-applied` | 적용 완료 (점유 해제) | `preview.applied.title` `preview.applied.body` `sample.me` `prompt.msg.status.applied` `preview.view.current` `preview.view.candidate` `a11y.pose.wave_main` `a11y.mascot` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `prompt.title` `prompt.free` `a11y.presence` | iOS·낮·밝게·ko, Android·밤·어둡게·ko |
| `S09-cancelled` | 취소 (현재 방 유지, 점유 해제) | `prompt.start` `sample.me` `prompt.msg.status.cancelled` `preview.view.current` `preview.view.candidate` `a11y.pose.wave_main` `a11y.mascot` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `prompt.title` `prompt.free` `a11y.presence` `preview.cancel.toast` | iOS·낮·밝게·ko, Android·밤·어둡게·ko |
| `S09-apply-err` | 적용 실패 (네트워크) | `preview.apply.err.title` `preview.apply.err.body` `common.retry` `preview.changes` `preview.changes.list` `preview.badge` `preview.view.current` `preview.view.candidate` `preview.undo` `preview.applyHint` `preview.apply` `preview.cancel` `a11y.pose.wave_main` `a11y.mascot` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `prompt.title` `prompt.mine` `a11y.presence` | iOS·낮·밝게·ko, Android·밤·어둡게·ko |
| `S09-model-err` | 모델 오류 (미리 보기 생성 실패) | `prompt.msg.me` `prompt.msg.time` `prompt.fail.title` `preview.model.err` `common.retry` `prompt.placeholder` `a11y.input` `a11y.send` `prompt.left` `prompt.idleHint` `a11y.pose.wave_main` `a11y.mascot` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `prompt.title` `prompt.mine` `a11y.presence` | iOS·낮·밝게·ko, Android·밤·어둡게·ko |
| `S09-conflict` | 버전 충돌 (늦은 중복 적용 · 서버 거부) | `preview.changes` `preview.changes.list` `preview.badge` `preview.view.current` `preview.view.candidate` `preview.undo` `preview.applyHint` `preview.apply` `preview.cancel` `a11y.pose.wave_main` `a11y.mascot` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `prompt.title` `prompt.mine` `a11y.presence` `preview.conflict.title` `preview.conflict.body` `common.confirm` | iOS·낮·밝게·ko, Android·밤·어둡게·ko, iOS·낮·밝게·en, Android·밤·어둡게·ja |
| `S09-gen-preview` | 새로 만든 장식이 들어간 미리 보기 (장식 표시 · 개수) | `gen.preview.count` `gen.badge` `preview.changes` `preview.changes.list` `preview.badge` `preview.view.current` `preview.view.candidate` `preview.undo` `preview.applyHint` `preview.apply` `preview.cancel` `a11y.pose.wave_main` `a11y.mascot` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `prompt.title` `prompt.mine` `a11y.presence` | iOS·낮·밝게·ko, Android·밤·어둡게·ko, iOS·낮·밝게·en, Android·밤·어둡게·ja |

## 이동 및 뒤로

F03: S07 → S08 → S09 → 적용 후 S07; S09 → S10 → 이전 미리보기; 필요 시 S12 동의. 뒤로: 대화/시트 또는 확인을 닫고 이전 단계로. 취소 시 방은 유지.

## 접근성

상태 표에 나열된 `a11y.*` 키를 스크린 리더 이름으로 사용합니다. 공통 접근성 및 200% 글자 규칙은 [interaction notes](../../../interaction-notes.md#10-접근성-상호작용)를 참조하세요. TODO: 해당 상태에 명시되지 않은 역할과 이름을 확인하세요.

## 수락 시나리오

- [ ] S09-AC-01: 적용하기를 누르면 확인 화면 없이 적용되고, 독이 닫히며 방 위에 ‘적용했어요 · 되돌리기’ 한 줄이 뜬다.
- [ ] S09-AC-02: 취소하면 현재 방을 유지한다.

## 열린 질문 / 추적

TODO: 명세에 없는 disabled/offline 상태의 적용 여부와 정확한 뒤로 대상을 확인하세요. 시나리오와 요구사항·테스트·실행 결과는 [추적표](../../traceability.md)에 연결하세요.
