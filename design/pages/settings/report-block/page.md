# S15 신고 / 연결 끊기

승인자: 미승인
승인일: 미정

## 목적, ID, 경로

ID: S15
Route: /settings/report

## 디자인 원본

- [S15-report-block.dc.html](../../../canvas/project/S15-report-block.dc.html)

## 이미지

- [S15-obj-reason__ios-light-ko.png](../../../exports/S15-obj-reason__ios-light-ko.png)
- [S15-obj-sent__android-dark-ja.png](../../../exports/S15-obj-sent__android-dark-ja.png)
- [S15-block__android-dark-ja.png](../../../exports/S15-block__android-dark-ja.png)
- [S15-block__ios-light-ko.png](../../../exports/S15-block__ios-light-ko.png)

## 상태와 상호작용

- **캔버스 보드**: `S15-report-block`
- **목적**: 대상(상대·공유 문구·방 장면) 선택, 사유, 자세한 내용(선택), 제출 성공·실패, 연결 끊기 확인과 결과, 지원 연락처.
- **이동**: 설정 > 문의·신고(푸시), 대화 메시지의 ⋯ > 이 메시지 신고(시트).
- 지원 연락처는 `[지원 이메일]` 자리표시예요.
- **연결 끊기**(예전 이름 "차단")는 "상대는 방·대화를 볼 수 없고 이 공간이 종료돼요. 함께 쓰던 데이터는 삭제돼요"라고 분명히 말해요(기간·복구 안내 없음)(결정). 신고와는 별개의 기능이에요. 구현의 문구 키·API 이름은 `report.block*`·`block` 그대로예요(계약 이름을 바꾸지 않으려고).
- **긴 문구·언어 사례**: 사유 문구가 길어져도 한 줄에 라디오와 함께 줄바꿈돼요.

| 상태 ID | 설명 | 사용하는 키 | 그린 조합 |
|---|---|---|---|
| `S15-entry` | 진입 · 설정의 문의·신고 → 신고 대상 고르기 | `report.title` `report.target.partner` `report.target.text` `report.target.scene` `report.what` `sample.partner` `report.block` `report.contact` | iOS·밝게·ko, Android·어둡게·ko, iOS·밝게·en, Android·어둡게·ja 외 4 |
| `S15-msg-menu` | 진입 · 대화 메시지에서 신고 | `sample.partner` `prompt.msg.partner` `prompt.msg.time` `prompt.input.partner` `a11y.input.ro` `a11y.send` `a11y.pose.wave_main` `a11y.mascot` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `prompt.title` `prompt.partner` `a11y.presence` `report.msg.menu` `report.msg.menu.cancel` | iOS·낮·밝게·ko, Android·밤·어둡게·ko |
| `S15-reason` | 사유 선택 | `report.title` `report.target.partner` `report.target.text` `report.target.scene` `report.what` `report.why` `report.reason.harass` `report.reason.inappropriate` `report.reason.privacy` `report.reason.other` `report.submit` | iOS·밝게·ko, Android·어둡게·ko |
| `S15-detail` | 자세한 내용 입력 (선택) | `report.title` `report.target.partner` `report.target.text` `report.target.scene` `report.what` `report.why` `report.reason.harass` `report.reason.inappropriate` `report.reason.privacy` `report.reason.other` `report.detail` `report.detail.placeholder` `report.submit` | iOS·밝게·ko, Android·어둡게·ko |
| `S15-sending` | 제출 중 | `report.title` `report.target.partner` `report.target.text` `report.target.scene` `report.what` `report.why` `report.reason.harass` `report.reason.inappropriate` `report.reason.privacy` `report.reason.other` `report.sending` | iOS·밝게·ko, Android·어둡게·ko |
| `S15-done` | 제출 성공 · 지원 연락처 | `report.done.title` `report.done.body` `report.contact` `common.done` | iOS·밝게·ko, Android·어둡게·ko |
| `S15-fail` | 제출 실패 (입력 유지) | `report.title` `report.target.partner` `report.target.text` `report.target.scene` `report.what` `report.why` `report.reason.harass` `report.reason.inappropriate` `report.reason.privacy` `report.reason.other` `report.fail.title` `report.fail.body` `common.retry` `report.submit` | iOS·밝게·ko, Android·어둡게·ko |
| `S15-block` | 연결 끊기 확인 · 결과 설명 | `report.title` `report.target.partner` `report.target.text` `report.target.scene` `report.what` `sample.partner` `report.block` `report.block.title` `report.block.body` `report.block.confirm` `common.cancel` | iOS·밝게·ko, Android·어둡게·ko, iOS·밝게·en, Android·어둡게·ja |
| `S15-blocked` | 연결을 끊은 뒤 결과 (공간 종료 상태) | `end.done.title` `end.done.body` `end.newSpace` | iOS·밝게·ko, Android·어둡게·ko |
| `S15-obj-reason` | 장식 신고 · 사유 선택 | `report.obj.title` `obj.detail.kind.bubble` `sample.partner` `gen.lib.by` `report.obj.lead` `report.obj.reason.copyright` `report.obj.reason.offensive` `report.obj.reason.personal` `report.obj.reason.other` `report.obj.send` | iOS·밝게·ko, Android·어둡게·ko, iOS·밝게·en, Android·어둡게·ja 외 1 |
| `S15-obj-note` | 장식 신고 · 선택 메모 (상대에게 안 보임) | `report.obj.title` `obj.detail.kind.bubble` `sample.partner` `gen.lib.by` `report.obj.reason.copyright` `report.obj.reason.offensive` `report.obj.reason.personal` `report.obj.reason.other` `report.obj.note` `report.obj.note.hint` `report.obj.send` | iOS·밝게·ko, Android·어둡게·ko |
| `S15-obj-sent` | 장식 신고 · 접수 (내 화면에서 숨김) | `report.obj.done.title` `report.obj.done.body` `common.done` | iOS·밝게·ko, Android·어둡게·ko, iOS·밝게·en, Android·어둡게·ja |
| `S15-obj-fail` | 장식 신고 · 보내지 못함 (입력 유지) | `report.obj.title` `obj.detail.kind.bubble` `sample.partner` `gen.lib.by` `report.obj.reason.copyright` `report.obj.reason.offensive` `report.obj.reason.personal` `report.obj.reason.other` `report.obj.fail.title` `report.obj.fail.body` `common.retry` `report.obj.send` | iOS·밝게·ko, Android·어둡게·ko |
| `S15-obj-limit` | 장식 신고 · 오늘 한도(10건) 초과 | `report.obj.title` `obj.detail.kind.bubble` `sample.partner` `gen.lib.by` `report.obj.reason.copyright` `report.obj.reason.offensive` `report.obj.reason.personal` `report.obj.reason.other` `report.obj.limit` `report.obj.send` | iOS·밝게·ko, Android·어둡게·ko |

## 이동 및 뒤로

F04: S13 → S14 종료 또는 S15 신고; 동의 관리 → S12. 뒤로: 상세에서 설정으로; 종료 완료 후 S14 종료 안내. S27은 세 탭의 전역 내비게이션 참조.

## 접근성

상태 표에 나열된 `a11y.*` 키를 스크린 리더 이름으로 사용합니다. 공통 접근성 및 200% 글자 규칙은 [interaction notes](../../../interaction-notes.md#10-접근성-상호작용)를 참조하세요. TODO: 해당 상태에 명시되지 않은 역할과 이름을 확인하세요.

## 수락 시나리오

- [ ] S15-AC-01: 신고 사유를 선택하고 제출한 뒤 완료 상태를 표시한다.

## 열린 질문 / 추적

TODO: 명세에 없는 disabled/offline 상태의 적용 여부와 정확한 뒤로 대상을 확인하세요. 시나리오와 요구사항·테스트·실행 결과는 [추적표](../../traceability.md)에 연결하세요.
