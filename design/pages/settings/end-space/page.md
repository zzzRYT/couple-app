# S14 공간 종료

승인자: 미승인
승인일: 미정

## 목적, ID, 경로

ID: S14
Route: /settings/end-space, /ended

## 디자인 원본

- [S14-end-space.dc.html](../../../canvas/project/S14-end-space.dc.html)

## 이미지

- [S14-partner-disconnect__ios-light-ko.png](../../../exports/S14-partner-disconnect__ios-light-ko.png)
- [S14-confirm__ios-light-ko.png](../../../exports/S14-confirm__ios-light-ko.png)
- [S14-partner-deleted__ios-light-ko.png](../../../exports/S14-partner-deleted__ios-light-ko.png)
- [S14-done__ios-light-ko.png](../../../exports/S14-done__ios-light-ko.png)

## 상태와 상호작용

- **캔버스 보드**: `S14-end-space`
- **목적**: 결과(삭제되고 되돌릴 수 없음)를 또렷하게 쓴 확인(체크 후에만 활성), 진행, 종료 직후 안내와 "새 공간 시작하기", 상대가 종료한 경우, 상대가 연결을 끊은 경우, 상대가 계정을 삭제한 경우(이름 없이). **복구 기능과 보관 기간 안내는 없어요**(2026-10-27 결정 · 가정).
- **이동**: 설정 > 공간 종료(푸시) → 확인 → 종료 안내 화면(탭 구조 대신). "새 공간 시작하기" → S03(공간 만들기) 또는 S05(초대 코드 입력). 상대가 먼저 끝냈다면 앱을 열 때 같은 안내 화면이 보여요.
- 종료는 소프트 삭제예요: 두 사람 모두 즉시 접근이 끊기고 서버가 내부적으로 일정 기간 뒤 완전히 삭제해요. 화면·문구는 기간이나 복구 방법을 말하지 않아요.
- "잘못 누른 느낌"을 줄이지 않도록 결과 세 줄 + 체크박스 + 빨간 버튼.
- 종료한 뒤 바로 새 공간을 만들거나 초대를 수락할 수 있어요("한 공간만"은 활성 공간만 세요).
- **긴 문구·언어 사례**: 결과 설명이 일본어에서 4줄까지 늘어나요.

| 상태 ID | 설명 | 사용하는 키 | 그린 조합 |
|---|---|---|---|
| `S14-entry` | 설정의 공간 종료 진입 (확인 단계 앞) | `set.title` `set.name.value` `set.login.kakao` `set.together` `set.together.value` `set.cover` `set.cover.on` `set.room.mode` `set.room.mode.auto` `set.room.mode.day` `set.room.mode.night` `set.room.mode.help` `set.room.now` `set.room.tz` `set.room.tz.value` `set.lang` `set.theme` `set.theme.system` `set.theme.light` `set.theme.dark` `set.hc` `set.hc.help` `a11y.off` `a11y.switch` `set.notif` `set.notif.sub.off` `set.notif.help` `set.ai.consent` `consent.status.on` `set.sec.info` `set.about.version` `set.about.licenses` `set.terms` `set.privacy` `set.support` `set.logout` `set.end` `set.end.help` `set.account.delete` `set.account.delete.sub` `set.sec.app` `set.sec.notif` `set.sec.ai` `set.sec.danger` `a11y.tabbar` `tab.home` `a11y.tab` `tab.room` `tab.settings` `a11y.tab.sel` | iOS·낮·밝게·ko, Android·밤·어둡게·ko |
| `S14-confirm` | 종료 확인 · 결과 명시(삭제되고 되돌릴 수 없음, 체크 전) | `end.title` `end.body` `end.b1` `end.b2` `end.b3` `end.check` `end.confirm` `end.cancel` | iOS·밝게·ko, Android·어둡게·ko, iOS·밝게·en, Android·어둡게·ja 외 4 |
| `S14-checked` | 확인 체크 후 활성 | `end.title` `end.body` `end.b1` `end.b2` `end.b3` `end.check` `end.confirm` `end.cancel` | iOS·밝게·ko, Android·어둡게·ko |
| `S14-progress` | 종료 중 | `end.title` `end.body` `end.b1` `end.b2` `end.b3` `end.check` `end.confirm` `end.cancel` | iOS·밝게·ko, Android·어둡게·ko |
| `S14-done` | 종료 직후 · 새 공간 시작하기 (기간·복구 안내 없음) | `end.done.title` `end.done.body` `end.newSpace` | iOS·밝게·ko, Android·어둡게·ko, iOS·밝게·en, Android·어둡게·ja 외 1 |
| `S14-partner` | 상대가 종료한 경우 (내 화면) | `sample.partner` `end.byPartner` `end.done.title` `end.done.body` `end.newSpace` | iOS·밝게·ko, Android·어둡게·ko |
| `S14-partner-disconnect` | 상대가 연결을 끊은 경우 (내 화면) | `sample.partner` `end.byPartnerDisconnect` `end.done.title` `end.done.body` `end.newSpace` | iOS·밝게·ko, Android·어둡게·ko, iOS·밝게·en, Android·어둡게·ja 외 1 |
| `S14-partner-deleted` | 상대가 계정을 삭제한 경우 (내 화면 · 이름 없이) | `sample.partner` `end.byPartnerDeleted` `end.done.title` `end.done.body` `end.newSpace` | iOS·밝게·ko, Android·어둡게·ko, iOS·밝게·en, Android·어둡게·ja |
| `S14-error` | 종료 실패 | `end.title` `end.body` `end.b1` `end.b2` `end.b3` `end.check` `end.confirm` `end.cancel` `end.err.title` `end.err.body` `common.retry` `common.close` | iOS·밝게·ko, Android·어둡게·ko |

## 이동 및 뒤로

F04: S13 → S14 종료 또는 S15 신고; 동의 관리 → S12. 뒤로: 상세에서 설정으로; 종료 완료 후 S14 종료 안내. S27은 세 탭의 전역 내비게이션 참조.

## 접근성

상태 표에 나열된 `a11y.*` 키를 스크린 리더 이름으로 사용합니다. 공통 접근성 및 200% 글자 규칙은 [interaction notes](../../../interaction-notes.md#10-접근성-상호작용)를 참조하세요. TODO: 해당 상태에 명시되지 않은 역할과 이름을 확인하세요.

## 수락 시나리오

- [ ] S14-AC-01: 공간 종료를 확인한 뒤 종료 안내를 표시한다.

## 열린 질문 / 추적

TODO: 명세에 없는 disabled/offline 상태의 적용 여부와 정확한 뒤로 대상을 확인하세요. 시나리오와 요구사항·테스트·실행 결과는 [추적표](../../traceability.md)에 연결하세요.
