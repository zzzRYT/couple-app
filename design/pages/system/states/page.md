# S16 공통 오류 · 빈 · 로딩 · 오프라인

승인자: 미승인
승인일: 미정

## 목적, ID, 경로

ID: S16
Route: 독립 라우트 없음 (참고 보드 또는 미구현)

## 디자인 원본

- [S16-system-states.dc.html](../../../canvas/project/S16-system-states.dc.html)

## 이미지

- 내보낸 PNG 없음; 위 보드 원본을 확인하세요.

## 상태와 상호작용

- **캔버스 보드**: `S16-system-states`
- **목적**: 서버·AI 일시 장애, 로그인 만료, 접근 거부, 인터넷 끊김, 요청 한도, 구버전 장면, 삭제된 에셋, 동기화 대기, 로딩, 빈 상태.
- **이동**: 발생 지점에 따라 전체 화면 또는 배너. 앱은 마지막 확정 방·D-day를 보여 주고 오프라인 편집이나 미리 보기 적용은 하지 않아요.
- 오류는 항상 "무엇이 그대로인지"를 먼저 말해요(예: 방은 그대로예요).
- **긴 문구·언어 사례**: 오류 제목이 일본어에서 길어져도 가운데 정렬 두 줄.

| 상태 ID | 설명 | 사용하는 키 | 그린 조합 |
|---|---|---|---|
| `S16-server` | 서버·AI 일시 장애 (서버) | `sys.server.title` `sys.server.body` `sys.retry` `common.close` | iOS·밝게·ko, Android·어둡게·ko, iOS·밝게·en, Android·어둡게·ja 외 4 |
| `S16-ai` | AI 처리 일시 중단 (꾸미기만) | `sys.ai.title` `sys.ai.body` `sys.retry` `prompt.offline` `a11y.input` `a11y.send` `a11y.pose.wave_main` `a11y.mascot` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `prompt.title` `prompt.mine` `a11y.presence` | iOS·낮·밝게·ko, Android·밤·어둡게·ko |
| `S16-login` | 로그인 만료 | `sys.login.title` `sys.login.body` `sys.login.action` | iOS·밝게·ko, Android·어둡게·ko |
| `S16-denied` | 접근 거부 (구성원 아님·종료) | `sys.denied.title` `sys.denied.body` `join.haveCode` `join.createSpace` | iOS·밝게·ko, Android·어둡게·ko |
| `S16-offline` | 인터넷 끊김 · 메인 마지막 상태 | `main.offline.title` `main.offline.body` `dday.eyebrow` `a11y.dday` `dday.count` `date.since` `sample.partner` `main.chip.both` `main.appName` `a11y.cover.add` `cover.add` `a11y.pose.wave_main` `a11y.mascot` `main.roomCard.title` `main.roomCard.day` `main.openRoom` `main.editDate` `a11y.tabbar` `tab.home` `a11y.tab.sel` `a11y.tab` `tab.room` `tab.settings` | iOS·밝게·ko, Android·어둡게·ko |
| `S16-quota` | 요청 한도 (하루 3회) | `sys.quota.title` `prompt.quota.body` `prompt.quota.title` `a11y.input` `a11y.send` `a11y.pose.wave_main` `a11y.mascot` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `prompt.title` `prompt.mine` `a11y.presence` | iOS·낮·밝게·ko, Android·밤·어둡게·ko |
| `S16-old-scene` | 구버전 장면 (읽을 수 있는 부분만) | `sys.old.title` `sys.old.body` `sys.old.action` `a11y.pose.wave_main` `a11y.mascot` `a11y.pose.walk` `a11y.pose.cheer` `a11y.pose.lookup` `a11y.pose.lie` `a11y.pose.sleep` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `room.ctl.decorate` `a11y.tabbar` `tab.home` `a11y.tab` `tab.room` `a11y.tab.sel` `tab.settings` | iOS·낮·밝게·ko, Android·밤·어둡게·ko, iOS·낮·밝게·en, Android·밤·어둡게·ja |
| `S16-asset` | 삭제된·누락된 에셋 (빈 자리 유지) | `sys.asset.title` `sys.asset.body` `a11y.pose.wave_main` `a11y.mascot` `a11y.pose.walk` `a11y.pose.cheer` `a11y.pose.lookup` `a11y.pose.lie` `a11y.pose.sleep` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `room.ctl.decorate` `a11y.tabbar` `tab.home` `a11y.tab` `tab.room` `a11y.tab.sel` `tab.settings` | iOS·낮·밝게·ko, Android·밤·어둡게·ko, iOS·낮·밝게·en, Android·밤·어둡게·ja |
| `S16-pending` | 데이터 동기화 대기 | `sys.pending.title` `sys.pending.body` `a11y.pose.wave_main` `a11y.mascot` `a11y.pose.walk` `a11y.pose.cheer` `a11y.pose.lookup` `a11y.pose.lie` `a11y.pose.sleep` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `room.ctl.decorate` `a11y.tabbar` `tab.home` `a11y.tab` `tab.room` `a11y.tab.sel` `tab.settings` | iOS·낮·밝게·ko, Android·밤·어둡게·ko |
| `S16-loading-main` | 로딩 · 메인 스켈레톤 | `main.loading` `main.appName` `main.openRoom` `a11y.tabbar` `tab.home` `a11y.tab.sel` `a11y.tab` `tab.room` `tab.settings` | iOS·밝게·ko, Android·어둡게·ko |
| `S16-empty` | 빈 상태 (공통 빈 화면) | `sys.empty.title` `sys.empty.body` `common.close` | iOS·밝게·ko, Android·어둡게·ko |

## 이동 및 뒤로

공통 상태와 접근성은 각 화면에서 진입하고 해당 화면으로 복귀. 상세 이동은 각 화면 및 interaction-notes 참조.

## 접근성

상태 표에 나열된 `a11y.*` 키를 스크린 리더 이름으로 사용합니다. 공통 접근성 및 200% 글자 규칙은 [interaction notes](../../../interaction-notes.md#10-접근성-상호작용)를 참조하세요. TODO: 해당 상태에 명시되지 않은 역할과 이름을 확인하세요.

## 수락 시나리오

- [ ] S16-AC-01: 네트워크 오류에서 재시도 동작을 제공한다.

## 열린 질문 / 추적

TODO: 명세에 없는 disabled/offline 상태의 적용 여부와 정확한 뒤로 대상을 확인하세요. 시나리오와 요구사항·테스트·실행 결과는 [추적표](../../traceability.md)에 연결하세요.
