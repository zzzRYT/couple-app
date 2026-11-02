# S24 S24 tab

승인자: 미승인
승인일: 미정

## 목적, ID, 경로

ID: S24
Route: /(tabs)/room

## 디자인 원본

- [S24-tab-room.dc.html](../../../canvas/project/S24-tab-room.dc.html)

## 이미지

- [S24-partner__ios-day-light-ko.png](../../../exports/S24-partner__ios-day-light-ko.png)

## 상태와 상호작용

| 상태 ID | 설명 | 사용하는 키 |
|---|---|---|
| `S24-first` | 방 · 첫 실행(마스코트만) + 꾸미기 안내 | `coach.room` `coach.ok` `a11y.pose.wave_main` `a11y.mascot` `a11y.pose.walk` `a11y.pose.cheer` `a11y.pose.lookup` `a11y.pose.lie` `a11y.pose.sleep` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `room.ctl.decorate` `a11y.tabbar` `tab.home` `a11y.tab` `tab.room` `a11y.tab.sel` `tab.settings` |
| `S24-empty` | 방 · 비어 있음(새 방 그대로) | `a11y.pose.wave_main` `a11y.mascot` `a11y.pose.walk` `a11y.pose.cheer` `a11y.pose.lookup` `a11y.pose.lie` `a11y.pose.sleep` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `room.ctl.decorate` `a11y.tabbar` `tab.home` `a11y.tab` `tab.room` `a11y.tab.sel` `tab.settings` |
| `S24-normal` | 방 · 보통(꾸민 방) | `a11y.pose.wave_main` `a11y.mascot` `a11y.pose.walk` `a11y.pose.cheer` `a11y.pose.lookup` `a11y.pose.lie` `a11y.pose.sleep` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `room.ctl.decorate` `a11y.tabbar` `tab.home` `a11y.tab` `tab.room` `a11y.tab.sel` `tab.settings` |
| `S24-partner` | 방 · 상대가 꾸미는 중(실시간 읽기 전용 · 꾸미기가 지켜보기로 바뀜) | `sample.partner` `room.partnerLive` `a11y.pose.wave_main` `a11y.mascot` `a11y.pose.walk` `a11y.pose.cheer` `a11y.pose.lookup` `a11y.pose.lie` `a11y.pose.sleep` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `room.watch` `a11y.tabbar` `tab.home` `a11y.tab` `tab.room` `a11y.tab.sel` `tab.settings` |
| `S24-loading` | 방 · 로딩 | `room.loading` `room.ctl.decorate` `a11y.tabbar` `tab.home` `a11y.tab` `tab.room` `a11y.tab.sel` `tab.settings` |
| `S24-offline` | 방 · 오프라인 읽기 전용 | `room.offline` `a11y.pose.wave_main` `a11y.mascot` `a11y.pose.walk` `a11y.pose.cheer` `a11y.pose.lookup` `a11y.pose.lie` `a11y.pose.sleep` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `room.ctl.decorate` `a11y.tabbar` `tab.home` `a11y.tab` `tab.room` `a11y.tab.sel` `tab.settings` |
| `S24-error` | 방 · 동기화 실패 / 장면 복구 오류 | `room.syncFail.title` `room.syncFail.body` `common.retry` `a11y.pose.wave_main` `a11y.mascot` `a11y.pose.walk` `a11y.pose.cheer` `a11y.pose.lookup` `a11y.pose.lie` `a11y.pose.sleep` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `room.ctl.decorate` `a11y.tabbar` `tab.home` `a11y.tab` `tab.room` `a11y.tab.sel` `tab.settings` |
| `S24-modal-decorate` | 방 → 꾸미기(모달 시트 · 탭 바를 덮음) | `prompt.msg.me` `prompt.msg.time` `prompt.msg.result` `prompt.placeholder` `a11y.input` `a11y.send` `prompt.left` `prompt.idleHint` `a11y.pose.wave_main` `a11y.mascot` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `prompt.title` `prompt.mine` `a11y.presence` |

## 이동 및 뒤로

F03: S07 → S08 → S09 → 적용 후 S07; S09 → S10 → 이전 미리보기; 필요 시 S12 동의. 뒤로: 대화/시트 또는 확인을 닫고 이전 단계로. 취소 시 방은 유지.

## 접근성

상태 표에 나열된 `a11y.*` 키를 스크린 리더 이름으로 사용합니다. 공통 접근성 및 200% 글자 규칙은 [interaction notes](../../../interaction-notes.md#10-접근성-상호작용)를 참조하세요. TODO: 해당 상태에 명시되지 않은 역할과 이름을 확인하세요.

## 수락 시나리오

- [ ] S24-AC-01: 방 탭을 선택하면 방 루트를 표시한다.

## 열린 질문 / 추적

TODO: 명세에 없는 disabled/offline 상태의 적용 여부와 정확한 뒤로 대상을 확인하세요. 시나리오와 요구사항·테스트·실행 결과는 [추적표](../../traceability.md)에 연결하세요.
