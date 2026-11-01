# S12 해외 AI 처리 동의

승인자: 미승인
승인일: 미정

## 목적, ID, 경로

ID: S12
Route: /prompt/consent

## 디자인 원본

- [S12-ai-consent.dc.html](../../../canvas/project/S12-ai-consent.dc.html)

## 이미지

- [S12-first__ios-light-ko.png](../../../exports/S12-first__ios-light-ko.png)

## 상태와 상호작용

- **캔버스 보드**: `S12-ai-consent`
- **목적**: 전송 정보, 목적, 처리 사업자·국가, 보관·철회, 두 사람이 함께 쓰는 방이라 동의는 사람마다 따로라는 설명. 동의 / 나중에 / 철회 / 철회됨.
- **이동**: 꾸미기 첫 요청 직전(전체 화면 모달). 설정 > AI 처리 동의(푸시)에서 상태 확인·철회.
- 해외 사업자의 보관 기간은 법무 확인 전이라 `[법무 확인 후 입력]` 자리표시를 그대로 뒀어요.
- 나중에 → 방 보기와 D-day는 그대로, 꾸미기만 잠겨요.
- 동의 버튼은 항상 화면 아래에 고정이고 본문만 스크롤돼요.
- **긴 문구·언어 사례**: 본문이 영어·일본어에서 길어져 스크롤 길이가 늘어요. 버튼은 화면에 고정.

| 상태 ID | 설명 | 사용하는 키 | 그린 조합 |
|---|---|---|---|
| `S12-first` | 요청 직전 첫 동의 (상단) | `consent.title` `consent.lead` `consent.sent.label` `consent.sent.body` `consent.purpose.label` `consent.purpose.body` `consent.processor.label` `consent.processor.body` `consent.keep.label` `consent.keep.body` `consent.provider.keep` `consent.couple.label` `consent.couple.body` `consent.agree` `consent.later` | iOS·밝게·ko, Android·어둡게·ko, iOS·밝게·en, Android·어둡게·ja 외 4 |
| `S12-end` | 스크롤 끝 · 동의 버튼은 항상 보임 | `consent.title` `consent.lead` `consent.sent.label` `consent.sent.body` `consent.purpose.label` `consent.purpose.body` `consent.processor.label` `consent.processor.body` `consent.keep.label` `consent.keep.body` `consent.provider.keep` `consent.couple.label` `consent.couple.body` `consent.agree` `consent.later` | iOS·밝게·ko, Android·어둡게·ko, iOS·밝게·ko·200% |
| `S12-later` | 나중에 → 방 보기는 유지 (꾸미기만 잠김) | `a11y.pose.wave_main` `a11y.mascot` `a11y.pose.walk` `a11y.pose.cheer` `a11y.pose.lookup` `a11y.pose.lie` `a11y.pose.sleep` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `room.ctl.decorate` `a11y.tabbar` `tab.home` `a11y.tab` `tab.room` `a11y.tab.sel` `tab.settings` `consent.later.note` | iOS·낮·밝게·ko, Android·밤·어둡게·ko |
| `S12-status-on` | 설정 · 동의 상태 (동의함) | `set.ai.consent` `consent.status.date` `consent.status.on` `consent.couple.body` `consent.sent.body` `consent.keep.body` `consent.withdraw` | iOS·밝게·ko, Android·어둡게·ko |
| `S12-withdraw` | 철회 확인 | `consent.withdraw.title` `consent.withdraw.body` `consent.withdraw` `common.cancel` `set.ai.consent` `consent.status.date` `consent.status.on` `consent.couple.body` `consent.sent.body` `consent.keep.body` | iOS·밝게·ko, Android·어둡게·ko, iOS·밝게·en, Android·어둡게·ja |
| `S12-withdrawn` | 철회됨 (다시 동의 가능) | `set.ai.consent` `consent.status.off` `consent.couple.body` `consent.sent.body` `consent.keep.body` `consent.agree` `consent.withdraw.done` | iOS·밝게·ko, Android·어둡게·ko |

## 이동 및 뒤로

F03: S07 → S08 → S09 → 적용 후 S07; S09 → S10 → 이전 미리보기; 필요 시 S12 동의. 뒤로: 대화/시트 또는 확인을 닫고 이전 단계로. 취소 시 방은 유지.

## 접근성

상태 표에 나열된 `a11y.*` 키를 스크린 리더 이름으로 사용합니다. 공통 접근성 및 200% 글자 규칙은 [interaction notes](../../../interaction-notes.md#10-접근성-상호작용)를 참조하세요. TODO: 해당 상태에 명시되지 않은 역할과 이름을 확인하세요.

## 수락 시나리오

- [ ] S12-AC-01: 동의하지 않으면 AI 처리를 시작하지 않는다.

## 열린 질문 / 추적

TODO: 명세에 없는 disabled/offline 상태의 적용 여부와 정확한 뒤로 대상을 확인하세요. 시나리오와 요구사항·테스트·실행 결과는 [추적표](../../traceability.md)에 연결하세요.
