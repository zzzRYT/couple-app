# S07 방 탭 — 방 페이지

승인자: 미승인
승인일: 미정

## 목적, ID, 경로

ID: S07
Route: /(tabs)/room

## 디자인 원본

- [S07-room.dc.html](../../../canvas/project/S07-room.dc.html)

## 이미지

- [S07-decorated__android-night-dark-ko.png](../../../exports/S07-decorated__android-night-dark-ko.png)
- [S07-decorated__ios-day-light-ko-hc.png](../../../exports/S07-decorated__ios-day-light-ko-hc.png)
- [S07-gen-room__ios-day-light-ko.png](../../../exports/S07-gen-room__ios-day-light-ko.png)
- [S07-decorated__ios-night-light-ko.png](../../../exports/S07-decorated__ios-night-light-ko.png)
- [S07-decorated__ios-day-light-ko.png](../../../exports/S07-decorated__ios-day-light-ko.png)
- [S07-no-mascot__ios-day-light-ko.png](../../../exports/S07-no-mascot__ios-day-light-ko.png)
- [S07-decorated__ios-day-dark-ko.png](../../../exports/S07-decorated__ios-day-dark-ko.png)
- [S07-decorated__android-night-dark-ja-200.png](../../../exports/S07-decorated__android-night-dark-ja-200.png)
- [S07-protect__ios-day-light-ko.png](../../../exports/S07-protect__ios-day-light-ko.png)
- [S07-obj-detail__ios-day-light-ko.png](../../../exports/S07-obj-detail__ios-day-light-ko.png)

## 상태와 상호작용

- **캔버스 보드**: `S07-room, S24-tab-room`
- **목적**: 마스코트가 기본 포함된 장면, 낮/밤, 네이티브 날짜 위젯, 방 도구 막대(꾸미기 하나), 시스템 탭 바, 로딩·오프라인 읽기 전용·동기화 중/실패·상대 변경 실시간 반영·장면 데이터 복구 오류, 날짜 위젯 숨김, 보호 영역.
- **이동**: 탭 루트(방). 꾸미기 → 모달 시트(S08). 탭 바로 다른 탭. 되돌리기는 방 탭에 없고 꾸미기 시트 안(S09)에만 있어요.
- 방 도구 막대는 방 화면 **자신의 도구 막대**(위쪽)이고, 아래 탭 바는 **시스템 컴포넌트**예요. 두 영역 + 날짜 위젯 + 시스템 안전 영역이 보호 영역이에요(장식이 가리거나 입력을 가로챌 수 없음).
- 도구 막대 윤곽선은 방의 낮밤을 따라가요(낮 방 갈색, 밤 방 크림).
- 상대가 꾸미는 중이면 꾸미기 알약이 "지켜보기"로 바뀌어요.
- **긴 문구·언어 사례**: 도구 막대는 버튼 하나라 글자가 커져도 한 줄이고, 라벨은 160%에서 확대를 멈춰요.

| 상태 ID | 설명 | 사용하는 키 | 그린 조합 |
|---|---|---|---|
| `S07-new` | 새 방 (마스코트 기본 + 화분) | `a11y.pose.wave_main` `a11y.mascot` `a11y.pose.walk` `a11y.pose.cheer` `a11y.pose.lookup` `a11y.pose.lie` `a11y.pose.sleep` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `room.ctl.decorate` `a11y.tabbar` `tab.home` `a11y.tab` `tab.room` `a11y.tab.sel` `tab.settings` | iOS·낮·밝게·ko, Android·밤·어둡게·ko, iOS·낮·밝게·en, Android·밤·어둡게·ja |
| `S07-decorated` | 꾸민 방 (소품·문구 2개·날짜 위젯) | `a11y.pose.wave_main` `a11y.mascot` `a11y.pose.walk` `a11y.pose.cheer` `a11y.pose.lookup` `a11y.pose.lie` `a11y.pose.sleep` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `room.ctl.decorate` `a11y.tabbar` `tab.home` `a11y.tab` `tab.room` `a11y.tab.sel` `tab.settings` | iOS·낮·밝게·ko, Android·밤·어둡게·ko, iOS·낮·밝게·en, Android·밤·어둡게·ja 외 10 |
| `S07-loading` | 로딩 (장면 자리 표시) | `room.loading` `room.ctl.decorate` `a11y.tabbar` `tab.home` `a11y.tab` `tab.room` `a11y.tab.sel` `tab.settings` | iOS·낮·밝게·ko, Android·밤·어둡게·ko |
| `S07-offline` | 오프라인 읽기 전용 | `room.offline` `a11y.pose.wave_main` `a11y.mascot` `a11y.pose.walk` `a11y.pose.cheer` `a11y.pose.lookup` `a11y.pose.lie` `a11y.pose.sleep` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `room.ctl.decorate` `a11y.tabbar` `tab.home` `a11y.tab` `tab.room` `a11y.tab.sel` `tab.settings` | iOS·낮·밝게·ko, Android·밤·어둡게·ko, iOS·낮·밝게·en, Android·밤·어둡게·ja |
| `S07-syncing` | 동기화 중 표시 | `room.syncing` `a11y.pose.wave_main` `a11y.mascot` `a11y.pose.walk` `a11y.pose.cheer` `a11y.pose.lookup` `a11y.pose.lie` `a11y.pose.sleep` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `room.ctl.decorate` `a11y.tabbar` `tab.home` `a11y.tab` `tab.room` `a11y.tab.sel` `tab.settings` | iOS·낮·밝게·ko, Android·밤·어둡게·ko |
| `S07-syncfail` | 동기화 실패 | `room.syncFail.title` `room.syncFail.body` `common.retry` `a11y.pose.wave_main` `a11y.mascot` `a11y.pose.walk` `a11y.pose.cheer` `a11y.pose.lookup` `a11y.pose.lie` `a11y.pose.sleep` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `room.ctl.decorate` `a11y.tabbar` `tab.home` `a11y.tab` `tab.room` `a11y.tab.sel` `tab.settings` | iOS·낮·밝게·ko, Android·밤·어둡게·ko |
| `S07-partner` | 상대가 방을 바꿈 (실시간 반영) | `sample.partner` `room.partnerChanged` `a11y.pose.lookup` `a11y.mascot` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `room.ctl.decorate` `a11y.tabbar` `tab.home` `a11y.tab` `tab.room` `a11y.tab.sel` `tab.settings` | iOS·낮·밝게·ko, Android·밤·어둡게·ko |
| `S07-recover` | 장면 데이터 복구 오류 | `room.recover.title` `room.recover.body` `room.recover.action` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `room.ctl.decorate` `a11y.tabbar` `tab.home` `a11y.tab` `tab.room` `a11y.tab.sel` `tab.settings` | iOS·낮·밝게·ko, Android·밤·어둡게·ko |
| `S07-hidden` | 날짜 위젯을 방에서 숨긴 경우 | `room.ddayHidden` `a11y.pose.wave_main` `a11y.mascot` `a11y.pose.walk` `a11y.pose.cheer` `a11y.pose.lookup` `a11y.pose.lie` `a11y.pose.sleep` `room.ctl.decorate` `a11y.tabbar` `tab.home` `a11y.tab` `tab.room` `a11y.tab.sel` `tab.settings` | iOS·낮·밝게·ko, Android·밤·어둡게·ko |
| `S07-no-mascot` | 아루미가 방에서 빠진 방 · 고정 컨트롤 "아루미 다시 부르기" | `room.mascot.recall` `room.mascot.missing` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `room.ctl.decorate` `a11y.tabbar` `tab.home` `a11y.tab` `tab.room` `a11y.tab.sel` `tab.settings` | iOS·낮·밝게·ko, Android·밤·어둡게·ko, iOS·낮·밝게·en, Android·밤·어둡게·ja |
| `S07-protect` | 보호 영역 표시 (측정값에서 계산) | `a11y.pose.wave_main` `a11y.mascot` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `room.ctl.decorate` `a11y.tabbar` `tab.home` `a11y.tab` `tab.room` `a11y.tab.sel` `tab.settings` | iOS·낮·밝게·ko, Android·밤·어둡게·ko, iOS·낮·밝게·ko·200% |
| `S07-gen-room` | 생성 장식이 들어간 방 (배경 조각 2 + 말풍선 틀) | `a11y.pose.wave_main` `a11y.mascot` `a11y.pose.walk` `a11y.pose.cheer` `a11y.pose.lookup` `a11y.pose.lie` `a11y.pose.sleep` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `room.ctl.decorate` `a11y.tabbar` `tab.home` `a11y.tab` `tab.room` `a11y.tab.sel` `tab.settings` | iOS·낮·밝게·ko, Android·밤·어둡게·ko, iOS·낮·밝게·en, Android·밤·어둡게·ja |
| `S07-obj-detail` | 생성 장식을 누르면 · 장식 상세 시트 (신고하기 · 방 전체 신고) | `a11y.pose.wave_main` `a11y.mascot` `a11y.pose.walk` `a11y.pose.cheer` `a11y.pose.lookup` `a11y.pose.lie` `a11y.pose.sleep` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `room.ctl.decorate` `a11y.tabbar` `tab.home` `a11y.tab` `tab.room` `a11y.tab.sel` `tab.settings` `obj.detail.kind.bubble` `sample.partner` `gen.lib.by` `obj.report` `obj.report.scene` `common.close` | iOS·낮·밝게·ko, Android·밤·어둡게·ko, iOS·낮·밝게·en, Android·밤·어둡게·ja |
| `S07-obj-reported` | 신고 직후 · 내 화면에서 그 장식이 숨겨짐 | `a11y.pose.wave_main` `a11y.mascot` `a11y.pose.walk` `a11y.pose.cheer` `a11y.pose.lookup` `a11y.pose.lie` `a11y.pose.sleep` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `room.ctl.decorate` `a11y.tabbar` `tab.home` `a11y.tab` `tab.room` `a11y.tab.sel` `tab.settings` `report.obj.done.title` `obj.hidden.note` | iOS·낮·밝게·ko, Android·밤·어둡게·ko |
| `S07-obj-detail-reported` | 신고한 장식의 상세 · "신고했어요 · 접수됨" | `a11y.pose.wave_main` `a11y.mascot` `a11y.pose.walk` `a11y.pose.cheer` `a11y.pose.lookup` `a11y.pose.lie` `a11y.pose.sleep` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `room.ctl.decorate` `a11y.tabbar` `tab.home` `a11y.tab` `tab.room` `a11y.tab.sel` `tab.settings` `obj.hidden.note` `obj.reported` `obj.report.scene` `common.close` | iOS·낮·밝게·ko, Android·밤·어둡게·ko |
| `S07-obj-removed` | 운영 검토로 장식이 방에서 빠짐 · 두 사람에게 한 번 안내 | `a11y.pose.wave_main` `a11y.mascot` `a11y.pose.walk` `a11y.pose.cheer` `a11y.pose.lookup` `a11y.pose.lie` `a11y.pose.sleep` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `room.ctl.decorate` `a11y.tabbar` `tab.home` `a11y.tab` `tab.room` `a11y.tab.sel` `tab.settings` `obj.removed.notice` | iOS·낮·밝게·ko, Android·밤·어둡게·ko |
| `S07-protect-small` | 보호 영역 · 360×640 | `a11y.pose.wave_main` `a11y.mascot` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `room.ctl.decorate` `a11y.tabbar` `tab.home` `a11y.tab` `tab.room` `a11y.tab.sel` `tab.settings` | Android·낮·밝게·ko |
| `S07-protect-med` | 보호 영역 · 412×915 | `a11y.pose.wave_main` `a11y.mascot` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `room.ctl.decorate` `a11y.tabbar` `tab.home` `a11y.tab` `tab.room` `a11y.tab.sel` `tab.settings` | Android·낮·밝게·ko |
| `S07-protect-large` | 보호 영역 · 430×932 | `a11y.pose.wave_main` `a11y.mascot` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `room.ctl.decorate` `a11y.tabbar` `tab.home` `a11y.tab` `tab.room` `a11y.tab.sel` `tab.settings` | iOS·낮·밝게·ko |
| `S07-protect-1.3` | 보호 영역 · 글자 130% | `a11y.pose.wave_main` `a11y.mascot` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `room.ctl.decorate` `a11y.tabbar` `tab.home` `a11y.tab` `tab.room` `a11y.tab.sel` `tab.settings` | iOS·밤·어둡게·ja·130% |
| `S07-protect-1.6` | 보호 영역 · 글자 160% | `a11y.pose.wave_main` `a11y.mascot` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `room.ctl.decorate` `a11y.tabbar` `tab.home` `a11y.tab` `tab.room` `a11y.tab.sel` `tab.settings` | iOS·밤·어둡게·ja·160% |
| `S07-widget-coral` | 날짜 위젯 모양·위치 변경 · coral | `a11y.pose.wave_main` `a11y.mascot` `a11y.pose.walk` `a11y.pose.cheer` `a11y.pose.lookup` `a11y.pose.lie` `a11y.pose.sleep` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `room.ctl.decorate` `a11y.tabbar` `tab.home` `a11y.tab` `tab.room` `a11y.tab.sel` `tab.settings` | iOS·낮·밝게·ko |
| `S07-widget-yellow` | 날짜 위젯 모양·위치 변경 · yellow | `a11y.pose.wave_main` `a11y.mascot` `a11y.pose.walk` `a11y.pose.cheer` `a11y.pose.lookup` `a11y.pose.lie` `a11y.pose.sleep` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `room.ctl.decorate` `a11y.tabbar` `tab.home` `a11y.tab` `tab.room` `a11y.tab.sel` `tab.settings` | iOS·밤·어둡게·ko |
| `S07-widget-white` | 날짜 위젯 모양·위치 변경 · white | `a11y.pose.wave_main` `a11y.mascot` `a11y.pose.walk` `a11y.pose.cheer` `a11y.pose.lookup` `a11y.pose.lie` `a11y.pose.sleep` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `room.ctl.decorate` `a11y.tabbar` `tab.home` `a11y.tab` `tab.room` `a11y.tab.sel` `tab.settings` | iOS·낮·밝게·ko |
| `S07-widget-navy` | 날짜 위젯 모양·위치 변경 · navy | `a11y.pose.wave_main` `a11y.mascot` `a11y.pose.walk` `a11y.pose.cheer` `a11y.pose.lookup` `a11y.pose.lie` `a11y.pose.sleep` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `room.ctl.decorate` `a11y.tabbar` `tab.home` `a11y.tab` `tab.room` `a11y.tab.sel` `tab.settings` | iOS·밤·어둡게·ko |

## 이동 및 뒤로

F03: S07 → S08 → S09 → 적용 후 S07; S09 → S10 → 이전 미리보기; 필요 시 S12 동의. 뒤로: 대화/시트 또는 확인을 닫고 이전 단계로. 취소 시 방은 유지.

## 접근성

상태 표에 나열된 `a11y.*` 키를 스크린 리더 이름으로 사용합니다. 공통 접근성 및 200% 글자 규칙은 [interaction notes](../../../interaction-notes.md#10-접근성-상호작용)를 참조하세요. TODO: 해당 상태에 명시되지 않은 역할과 이름을 확인하세요.

## 수락 시나리오

- [ ] S07-AC-01: 오프라인에서는 방을 읽기 전용으로 표시한다.

## 열린 질문 / 추적

TODO: 명세에 없는 disabled/offline 상태의 적용 여부와 정확한 뒤로 대상을 확인하세요. 시나리오와 요구사항·테스트·실행 결과는 [추적표](../../traceability.md)에 연결하세요.
