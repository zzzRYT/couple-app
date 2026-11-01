# S05 초대 코드 입력 / 수락

승인자: 미승인
승인일: 미정

## 목적, ID, 경로

ID: S05
Route: /(onboarding)/join, /i/[code], /invite/[code]

## 디자인 원본

- [S05-invite-enter.dc.html](../../../canvas/project/S05-invite-enter.dc.html)

## 이미지

- [S05-has__ios-light-ko.png](../../../exports/S05-has__ios-light-ko.png)
- [S05-found__ios-light-ko.png](../../../exports/S05-found__ios-light-ko.png)

## 상태와 상호작용

- **캔버스 보드**: `S05-invite-enter`
- **목적**: 코드 입력, 확인, 초대 상대·공간 확인 후 수락, 만료·사용됨·유효하지 않음·인원 초과·이미 다른 공간 소속.
- **이동**: S02(공간 없음) → "초대 코드가 있어요" → S05 → 참여 → 홈.
- 이미 다른 공간에 있는 사용자는 "한 번에 하나의 공간만" 안내를 받고 코드가 소모되지 않아요(결정: 사용자당 한 공간). 지금 공간에서 먼저 나오려면(설정의 공간 종료) 한 뒤 다시 입력해요.
- 붙여넣기를 제공해요.
- **긴 문구·언어 사례**: 오류 문구가 영어·일본어에서 길어져도 카드 안에서 줄바꿈돼요.

| 상태 ID | 설명 | 사용하는 키 | 그린 조합 |
|---|---|---|---|
| `S05-empty` | 코드 입력 (비어 있음) | `join.check` `join.title` `join.body` `invite.code.label` `join.paste` | iOS·밝게·ko, Android·어둡게·ko |
| `S05-typing` | 코드 입력 중 | `join.check` `join.title` `join.body` `invite.code.label` `join.paste` | iOS·밝게·ko, Android·어둡게·ko, iOS·밝게·ko·고대비, Android·어둡게·ko·고대비 외 2 |
| `S05-checking` | 코드 확인 중 | `join.checking` `join.title` `join.body` `invite.code.label` `join.paste` | iOS·밝게·ko, Android·어둡게·ko |
| `S05-found` | 초대 상대·공간 확인 후 수락 | `join.found.heading` `sample.partner` `join.found.title` `set.together.value` `join.found.body` `join.accept` `join.decline` | iOS·밝게·ko, Android·어둡게·ko, iOS·밝게·en, Android·어둡게·ja |
| `S05-expired` | 만료된 코드 | `join.expired.title` `join.expired.body` `join.check` `join.title` `join.body` `invite.code.label` `join.paste` | iOS·밝게·ko, Android·어둡게·ko, iOS·밝게·en, Android·어둡게·ja |
| `S05-used` | 이미 사용된 코드 | `join.used.title` `join.used.body` `join.check` `join.title` `join.body` `invite.code.label` `join.paste` | iOS·밝게·ko, Android·어둡게·ko |
| `S05-invalid` | 유효하지 않은 코드 | `join.invalid.title` `join.invalid.body` `join.check` `join.title` `join.body` `invite.code.label` `join.paste` | iOS·밝게·ko, Android·어둡게·ko |
| `S05-full` | 공간 인원 초과 | `join.full.title` `join.full.body` `join.check` `join.title` `join.body` `invite.code.label` `join.paste` | iOS·밝게·ko, Android·어둡게·ko |
| `S05-has` | 이미 다른 공간 소속 | `join.hasSpace.title` `join.hasSpace.body` `join.hasSpace.action` `common.close` `join.title` `join.body` `invite.code.label` `join.paste` | iOS·밝게·ko, Android·어둡게·ko, iOS·밝게·en, Android·어둡게·ja 외 1 |
| `S05-ok` | 참여 완료 | `join.ok.title` `sample.partner` `join.ok.body` `join.ok.next` | iOS·밝게·ko, Android·어둡게·ko |
| `S05-net` | 네트워크 오류 | `join.err` `common.retry` `join.check` `join.title` `join.body` `invite.code.label` `join.paste` | iOS·밝게·ko, Android·어둡게·ko |

## 이동 및 뒤로

F01: S02 → S03 → S04 → 홈; 다른 사용자는 S02 → S05 → 홈. 홈 → S04 재진입. 뒤로: 생성/참여 → 공간 선택; 초대는 진입한 화면으로. 초대 링크와 대기 화면의 정확한 뒤로 동작은 확인 필요.

## 접근성

상태 표에 나열된 `a11y.*` 키를 스크린 리더 이름으로 사용합니다. 공통 접근성 및 200% 글자 규칙은 [interaction notes](../../../interaction-notes.md#10-접근성-상호작용)를 참조하세요. TODO: 해당 상태에 명시되지 않은 역할과 이름을 확인하세요.

## 수락 시나리오

- [ ] S05-AC-01: 코드를 확인한 뒤 상대와 공간을 보여 주고 수락하면 홈으로 이동한다.
- [ ] S05-AC-02: 만료되거나 이미 사용된 코드에 해당 오류를 표시한다.

## 열린 질문 / 추적

TODO: 명세에 없는 disabled/offline 상태의 적용 여부와 정확한 뒤로 대상을 확인하세요. 시나리오와 요구사항·테스트·실행 결과는 [추적표](../../traceability.md)에 연결하세요.
