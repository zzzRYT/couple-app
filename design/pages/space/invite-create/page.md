# S04 초대 코드 생성 · 공유

승인자: 미승인
승인일: 미정

## 목적, ID, 경로

ID: S04
Route: /invite

## 디자인 원본

- [S04-invite-create.dc.html](../../../canvas/project/S04-invite-create.dc.html)

## 이미지

- [S04-waiting__ios-light-ko.png](../../../exports/S04-waiting__ios-light-ko.png)
- [S04-code__ios-light-ko.png](../../../exports/S04-code__ios-light-ko.png)

## 상태와 상호작용

- **캔버스 보드**: `S04-invite-create`
- **목적**: 코드 생성 중, 8자리 코드와 만료 시간(24시간, 한 번만 수락), OS 공유 시트, 복사, 만료 임박, 만료됨, 재발급(기존 미사용 코드 폐기 안내), 공유 취소, 네트워크 오류, 상대 대기.
- **이동**: S03 → S04. 공유 시트(OS) / 복사. 나중에 초대하기 → 홈(초대 미완료).
- 코드는 0/O, 1/I 없이 8자(4-4 그룹)로 제안했어요(스펙에 길이 없음).
- 공유 시트는 OS 컴포넌트를 닮게 그린 자리표시예요.
- 초대·꾸밈 변경에 대한 알림은 없어서 "상대가 들어오면 알려 드려요"가 아니라 "앱을 열면 확인할 수 있어요"로 써요.
- **긴 문구·언어 사례**: 200% 글자에서는 코드 8칸이 4+4 두 줄로 나뉘어요.

| 상태 ID | 설명 | 사용하는 키 | 그린 조합 |
|---|---|---|---|
| `S04-gen` | 코드 생성 중 | `invite.title` `invite.body` `invite.generating` `invite.share` `invite.copy` | iOS·밝게·ko, Android·어둡게·ko |
| `S04-code` | 코드 · 만료 시간 · 공유/복사 | `invite.expires` `invite.expiresAt.sample` `invite.expiresAt` `invite.title` `invite.body` `invite.code.label` `a11y.code` `invite.reissue` `invite.share` `invite.copy` | iOS·밝게·ko, Android·어둡게·ko, iOS·밝게·en, Android·어둡게·ja 외 4 |
| `S04-share` | OS 공유 시트 | `invite.expires` `invite.expiresAt.sample` `invite.expiresAt` `invite.title` `invite.body` `invite.code.label` `a11y.code` `invite.reissue` `invite.share` `invite.copy` `login.email.label` `invite.shareSheet.title` `invite.shareMsg` | iOS·밝게·ko, Android·어둡게·ko |
| `S04-copied` | 복사 완료 토스트 | `invite.expires` `invite.expiresAt.sample` `invite.expiresAt` `invite.title` `invite.body` `invite.code.label` `a11y.code` `invite.reissue` `invite.share` `invite.copy` `invite.copied` | iOS·밝게·ko, Android·어둡게·ko |
| `S04-soon` | 만료 임박 (30분 이내) | `invite.expiring` `invite.title` `invite.body` `invite.code.label` `a11y.code` `invite.reissue` `invite.share` `invite.copy` | iOS·밝게·ko, Android·어둡게·ko |
| `S04-expired` | 만료됨 · 재발급 유도 | `invite.expired.title` `invite.expired.body` `invite.title` `invite.body` `invite.code.label` `a11y.code` `invite.reissue` | iOS·밝게·ko, Android·어둡게·ko, iOS·밝게·en, Android·어둡게·ja 외 1 |
| `S04-reissue` | 재발급 확인 (기존 코드 폐기) | `invite.expires` `invite.expiresAt.sample` `invite.expiresAt` `invite.title` `invite.body` `invite.code.label` `a11y.code` `invite.reissue` `invite.share` `invite.copy` `invite.reissue.title` `invite.reissue.body` `common.cancel` | iOS·밝게·ko, Android·어둡게·ko, iOS·밝게·en, Android·어둡게·ja |
| `S04-cancelled` | 공유 취소 안내 | `invite.expires` `invite.expiresAt.sample` `invite.expiresAt` `invite.title` `invite.body` `invite.code.label` `a11y.code` `invite.reissue` `invite.share` `invite.copy` `invite.shareCancelled` | iOS·밝게·ko, Android·어둡게·ko |
| `S04-error` | 네트워크 오류 | `invite.title` `invite.err.title` `invite.err.body` `common.retry` `invite.later` | iOS·밝게·ko, Android·어둡게·ko |
| `S04-waiting` | 상대 참여 대기 (메인 진입 전) | `invite.waiting.title` `invite.waiting.body` `invite.code.label` `common.next` | iOS·밝게·ko, Android·어둡게·ko |

## 이동 및 뒤로

F01: S02 → S03 → S04 → 홈; 다른 사용자는 S02 → S05 → 홈. 홈 → S04 재진입. 뒤로: 생성/참여 → 공간 선택; 초대는 진입한 화면으로. 초대 링크와 대기 화면의 정확한 뒤로 동작은 확인 필요.

## 접근성

상태 표에 나열된 `a11y.*` 키를 스크린 리더 이름으로 사용합니다. 공통 접근성 및 200% 글자 규칙은 [interaction notes](../../../interaction-notes.md#10-접근성-상호작용)를 참조하세요. TODO: 해당 상태에 명시되지 않은 역할과 이름을 확인하세요.

## 수락 시나리오

- [ ] S04-AC-01: 코드 화면에 8자리 코드, 만료 시간, 공유와 복사를 표시한다.
- [ ] S04-AC-02: 재발급 전에 기존 미사용 코드가 폐기됨을 안내한다.

## 열린 질문 / 추적

TODO: 명세에 없는 disabled/offline 상태의 적용 여부와 정확한 뒤로 대상을 확인하세요. 시나리오와 요구사항·테스트·실행 결과는 [추적표](../../traceability.md)에 연결하세요.
