# S03 커플 공간 생성

승인자: 미승인
승인일: 미정

## 목적, ID, 경로

ID: S03
Route: /(onboarding)/choose-space, /(onboarding)/create-space

## 디자인 원본

- [S03-couple-space.dc.html](../../../canvas/project/S03-couple-space.dc.html)

## 이미지

- [S03-creating__ios-light-ko.png](../../../exports/S03-creating__ios-light-ko.png)
- [S03-form__ios-light-ko.png](../../../exports/S03-form__ios-light-ko.png)

## 상태와 상호작용

- **캔버스 보드**: `S03-couple-space`
- **목적**: 함께한 날짜 입력·수정(달력이 아닌 3열 휠), 형식·유효성 오류(미래 날짜, 존재하지 않는 날짜), 생성 중·성공·연결 오류. 방의 시간대 안내.
- **이동**: S02 → 날짜 입력 → 공간 만들기 → 성공 → S04.
- 날짜는 달력 UI로 고르지 않아요(달력 기능을 암시하지 않기 위해). 3열 휠(년·월·일, 영어는 월·일·년 순서).
- 방의 낮밤은 만드는 사람의 현재 시간대로 정해지고 설정에서 바꿀 수 있다는 안내를 여기서 처음 보여요(FR-020).
- **긴 문구·언어 사례**: 날짜 필드 순서가 언어별로 달라요(ko/ja 년·월·일, en 월·일·년).

| 상태 ID | 설명 | 사용하는 키 | 그린 조합 |
|---|---|---|---|
| `S03-form` | 날짜 입력 (기본) | `space.title` `space.body` `space.date.label` `space.year` `space.month` `space.day` `space.date.hint` `space.tz.name` `space.tz.note` `space.create` | iOS·밝게·ko, Android·어둡게·ko, iOS·밝게·en, Android·어둡게·ja 외 4 |
| `S03-picker` | 날짜 휠 선택 시트 | `space.title` `space.body` `space.date.label` `space.year` `space.month` `space.day` `space.date.hint` `space.tz.name` `space.tz.note` `space.create` `space.date.pick` `common.done` | iOS·밝게·ko, Android·어둡게·ko |
| `S03-future` | 미래 날짜 오류 | `space.date.future` `space.title` `space.body` `space.date.label` `space.year` `space.month` `space.day` `space.tz.name` `space.tz.note` `space.create` | iOS·밝게·ko, Android·어둡게·ko, iOS·밝게·en, Android·어둡게·ja |
| `S03-invalid` | 존재하지 않는 날짜 오류 | `space.date.invalid` `space.title` `space.body` `space.date.label` `space.year` `space.month` `space.day` `space.tz.name` `space.tz.note` `space.create` | iOS·밝게·ko, Android·어둡게·ko |
| `S03-creating` | 생성 중 | `space.creating` | iOS·밝게·ko, Android·어둡게·ko |
| `S03-ok` | 생성 성공 | `space.ok.title` `space.ok.body` `space.ok.next` | iOS·밝게·ko, Android·어둡게·ko |
| `S03-error` | 연결 오류 | `space.title` `space.body` `space.date.label` `space.year` `space.month` `space.day` `space.date.hint` `space.tz.name` `space.tz.note` `space.err.title` `space.err.body` `common.retry` `space.create` | iOS·밝게·ko, Android·어둡게·ko |

## 이동 및 뒤로

F01: S02 → S03 → S04 → 홈; 다른 사용자는 S02 → S05 → 홈. 홈 → S04 재진입. 뒤로: 생성/참여 → 공간 선택; 초대는 진입한 화면으로. 초대 링크와 대기 화면의 정확한 뒤로 동작은 확인 필요.

## 접근성

상태 표에 나열된 `a11y.*` 키를 스크린 리더 이름으로 사용합니다. 공통 접근성 및 200% 글자 규칙은 [interaction notes](../../../interaction-notes.md#10-접근성-상호작용)를 참조하세요. TODO: 해당 상태에 명시되지 않은 역할과 이름을 확인하세요.

## 수락 시나리오

- [ ] S03-AC-01: 유효한 날짜로 공간을 만들면 S04로 이동한다.
- [ ] S03-AC-02: 미래 날짜와 존재하지 않는 날짜에 오류를 표시한다.

## 열린 질문 / 추적

TODO: 명세에 없는 disabled/offline 상태의 적용 여부와 정확한 뒤로 대상을 확인하세요. 시나리오와 요구사항·테스트·실행 결과는 [추적표](../../traceability.md)에 연결하세요.
