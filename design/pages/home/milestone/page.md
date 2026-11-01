# S28 마일스톤 축하 · 기념 방 꾸미기 제안

승인자: 미승인
승인일: 미정

## 목적, ID, 경로

ID: S28
Route: /(tabs)/home and /(tabs)/room (planned states)

## 디자인 원본

- [S28-milestone.dc.html](../../../canvas/project/S28-milestone.dc.html)

## 이미지

- [S28-home-day__android-dark-ja.png](../../../exports/S28-home-day__android-dark-ja.png)
- [S28-home-day__ios-light-ko.png](../../../exports/S28-home-day__ios-light-ko.png)
- [S28-preview__ios-day-light-ko.png](../../../exports/S28-preview__ios-day-light-ko.png)
- [S28-notif-banner__android-dark-ja.png](../../../exports/S28-notif-banner__android-dark-ja.png)
- [S28-home-anniv__ios-light-en.png](../../../exports/S28-home-anniv__ios-light-en.png)
- [S28-room-busy__ios-day-light-ko.png](../../../exports/S28-room-busy__ios-day-light-ko.png)
- [S28-room-day__ios-day-light-ko.png](../../../exports/S28-room-day__ios-day-light-ko.png)
- [S28-notif-banner__ios-light-ko.png](../../../exports/S28-notif-banner__ios-light-ko.png)
- [S28-room-day__android-night-dark-ja.png](../../../exports/S28-room-day__android-night-dark-ja.png)
- [S28-notif-prompt__ios-light-ko.png](../../../exports/S28-notif-prompt__ios-light-ko.png)

## 상태와 상호작용

- **캔버스 보드**: `S28-milestone`
- **목적**: 함께한 날이 50일·100일·200일·300일·500일·1000일이거나 주년(함께한 날짜와 같은 달력 날짜)이면, 앱을 열었을 때 마스코트(아루미)가 홈 카드와 방 말풍선으로 축하하고 앱이 준비한 기념 방 꾸미기 제안을 기존 미리 보기 → 적용 흐름으로 볼 수 있어요. 옵트인 기기 예약 알림(오전 9시)도 받을 수 있어요(서버 푸시 없음). 고정 문구(AI 호출 없음), 자동 적용 없음.
- **이동**: 앱 열기(또는 알림을 눌러 열기) → 홈 카드(닫기 / 기념 방 꾸미기 보기) → 첫 카드를 닫은 뒤 알림 사전 안내 시트(알림 켜기 / 다음에) → OS 권한 창 · 방 탭 말풍선(닫기) + 하단 제안 입구 → 점유 시작 → 미리 보기(S09, "{라벨} 제안" 뱃지) → 적용 확인("적용한 뒤에는 되돌릴 수 없어요") → 적용. 상대가 점유 중이면 입구가 막히고 이유를 알려요.
- 마일스톤 목록·규칙(7일 안에 처음 열면 늦은 축하, 커플당 한 번, 구성원마다 한 번씩, 날짜 수정 규칙)은 보드 아래쪽 표에 있어요. 모두 **제안값**이고 결정권자가 조정할 수 있어요.
- 마스코트 포즈는 기존 `cheer`(신나게 인사)만 써요. 통통 뛰기(2.4초)와 반짝임(1.4초)은 앱 고정 동작이고 동작 줄이기에서는 정지해요.
- 제안은 AI를 쓰지 않는 앱 프리셋(케이크·풍선·리본·반짝이 + 기념 문구, 주년은 선물 추가)이라 해외 AI 동의·하루 3회 한도와 무관해요. 새 카탈로그 오브젝트는 0개(24종 그대로).
- 카드는 앱 면 위에 놓여서 홈 배경 사진과 상관없이 같은 대비예요. 글자 130% 이상에서는 카드가 세로로 쌓이고, 방의 입구는 글자 크기를 160%로 제한해요.
- **알림은 옵트인 기기 예약 알림만**이에요: 오전 9시(방 시간대), 이름·날짜 없는 문구, 서버 푸시·토큰 저장 없음, 탭 바 배지 없음. 규칙은 보드 아래 표, 설정 행은 S13·S26.
- **긴 문구·언어 사례**: 일본어 제목은 {n}日目です / {n}周年です로 줄여서 한 줄에 들어가고, 영어 "Your 1-year anniversary"는 두 줄로 줄바꿈돼요.

| 상태 ID | 설명 | 사용하는 키 | 그린 조합 |
|---|---|---|---|
| `S28-home-day` | 홈 · 100일 당일 축하 카드(앱을 열면 보임) | `milestone.label.day` `milestone.title.day` `milestone.body.today` `a11y.pose.cheer` `a11y.mascot` `a11y.milestone.close` `milestone.action.suggest` `a11y.milestone.card` `dday.eyebrow` `a11y.dday` `dday.count` `date.since` `sample.partner` `main.chip.both` `main.appName` `a11y.cover.add` `cover.add` `main.openRoom` `main.editDate` `a11y.tabbar` `tab.home` `a11y.tab.sel` `a11y.tab` `tab.room` `tab.settings` | iOS·밝게·ko, Android·어둡게·ko, iOS·밝게·en, Android·어둡게·ja 외 2 |
| `S28-home-anniv` | 홈 · 1주년(같은 달력 날짜) 축하 카드 | `milestone.label.anniv` `milestone.title.anniv` `milestone.body.today` `a11y.pose.cheer` `a11y.mascot` `a11y.milestone.close` `milestone.action.suggest` `a11y.milestone.card` `dday.eyebrow` `a11y.dday` `dday.count` `date.since` `sample.partner` `main.chip.both` `main.appName` `a11y.cover.add` `cover.add` `main.openRoom` `main.editDate` `a11y.tabbar` `tab.home` `a11y.tab.sel` `a11y.tab` `tab.room` `tab.settings` | iOS·밝게·ko, Android·어둡게·ko, iOS·밝게·en, Android·어둡게·ja |
| `S28-home-late` | 홈 · 며칠 뒤에 처음 연 경우(늦은 축하 문구) | `milestone.label.day` `milestone.title.day` `milestone.body.late` `a11y.pose.cheer` `a11y.mascot` `a11y.milestone.close` `milestone.action.suggest` `a11y.milestone.card` `dday.eyebrow` `a11y.dday` `dday.count` `date.since` `sample.partner` `main.chip.both` `main.appName` `a11y.cover.add` `cover.add` `main.openRoom` `main.editDate` `a11y.tabbar` `tab.home` `a11y.tab.sel` `a11y.tab` `tab.room` `tab.settings` | iOS·밝게·ko, Android·어둡게·ko |
| `S28-home-photo` | 홈 · 배경 사진 위에서도 카드는 앱 면 위에 놓임 | `milestone.label.day` `milestone.title.day` `milestone.body.today` `a11y.pose.cheer` `a11y.mascot` `a11y.milestone.close` `milestone.action.suggest` `a11y.milestone.card` `dday.eyebrow` `a11y.dday` `dday.count` `date.since` `sample.partner` `main.chip.both` `a11y.cover.photo` `main.appName` `a11y.cover.change` `main.openRoom` `main.editDate` `a11y.tabbar` `tab.home` `a11y.tab.sel` `a11y.tab` `tab.room` `tab.settings` | iOS·밝게·ko, Android·어둡게·ko |
| `S28-room-day` | 방 · 마스코트 말풍선 + 기념 꾸미기 제안 입구 | `milestone.bubble.day` `a11y.milestone.bubble` `a11y.milestone.close` `milestone.label.day` `milestone.suggest.chip` `milestone.suggest.hint` `a11y.pose.cheer` `a11y.mascot` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `room.ctl.decorate` `a11y.tabbar` `tab.home` `a11y.tab` `tab.room` `a11y.tab.sel` `tab.settings` | iOS·낮·밝게·ko, Android·밤·어둡게·ko, iOS·낮·밝게·en, Android·밤·어둡게·ja 외 3 |
| `S28-room-anniv` | 방 · 1주년 말풍선 | `milestone.bubble.anniv` `a11y.milestone.bubble` `a11y.milestone.close` `milestone.label.anniv` `milestone.suggest.chip` `milestone.suggest.hint` `a11y.pose.cheer` `a11y.mascot` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `room.ctl.decorate` `a11y.tabbar` `tab.home` `a11y.tab` `tab.room` `a11y.tab.sel` `tab.settings` | iOS·낮·밝게·ko, Android·밤·어둡게·ko |
| `S28-room-closed` | 방 · 말풍선을 닫은 뒤(제안 입구는 남음) | `milestone.label.day` `milestone.suggest.chip` `milestone.suggest.hint` `a11y.pose.cheer` `a11y.mascot` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `room.ctl.decorate` `a11y.tabbar` `tab.home` `a11y.tab` `tab.room` `a11y.tab.sel` `tab.settings` | iOS·낮·밝게·ko, Android·밤·어둡게·ko |
| `S28-room-busy` | 방 · 상대가 꾸미는 중이라 제안 막힘 | `milestone.bubble.day` `a11y.milestone.bubble` `a11y.milestone.close` `milestone.label.day` `milestone.suggest.busy` `a11y.pose.cheer` `a11y.mascot` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `room.ctl.decorate` `a11y.tabbar` `tab.home` `a11y.tab` `tab.room` `a11y.tab.sel` `tab.settings` | iOS·낮·밝게·ko, Android·밤·어둡게·ko, iOS·낮·밝게·en, Android·밤·어둡게·ja 외 1 |
| `S28-room-full` | 방 · 방이 가득 차서 제안 막힘 | `milestone.bubble.day` `a11y.milestone.bubble` `a11y.milestone.close` `milestone.label.day` `milestone.suggest.full` `a11y.pose.cheer` `a11y.mascot` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `room.ctl.decorate` `a11y.tabbar` `tab.home` `a11y.tab` `tab.room` `a11y.tab.sel` `tab.settings` | iOS·낮·밝게·ko, Android·밤·어둡게·ko |
| `S28-notif-banner` | 알림 배너(OS가 그림) · 잠금 화면 · 이름·날짜 없는 문구 | `a11y.pose.wave_main` `a11y.mascot` `main.appName` `notif.body` | iOS·밝게·ko, Android·어둡게·ko, iOS·밝게·en, Android·어둡게·ja |
| `S28-notif-prompt` | 알림 사전 안내 시트(첫 축하 카드를 닫은 뒤 한 번) · 다음 화면은 OS 권한 창 | `a11y.pose.cheer` `a11y.mascot` `notif.prompt.body` `notif.prompt.note` `notif.prompt.allow` `notif.prompt.later` `dday.eyebrow` `a11y.dday` `dday.count` `date.since` `sample.partner` `main.chip.both` `main.appName` `a11y.cover.add` `cover.add` `a11y.pose.wave_main` `main.roomCard.title` `main.roomCard.day` `main.openRoom` `main.editDate` `a11y.tabbar` `tab.home` `a11y.tab.sel` `a11y.tab` `tab.room` `tab.settings` `notif.prompt.title` | iOS·밝게·ko, Android·어둡게·ko, iOS·밝게·en, Android·어둡게·ja |
| `S28-notif-opened` | 알림을 눌러 앱을 연 모습 · 홈에 축하 카드가 바로 보임 | `milestone.label.day` `milestone.title.day` `milestone.body.today` `a11y.pose.cheer` `a11y.mascot` `a11y.milestone.close` `milestone.action.suggest` `a11y.milestone.card` `dday.eyebrow` `a11y.dday` `dday.count` `date.since` `sample.partner` `main.chip.both` `main.appName` `a11y.cover.add` `cover.add` `main.openRoom` `main.editDate` `a11y.tabbar` `tab.home` `a11y.tab.sel` `a11y.tab` `tab.room` `tab.settings` | iOS·밝게·ko, Android·어둡게·ko |
| `S28-preview` | 제안 미리 보기(기존 S09 흐름) · AI 없음 · 점유자 | `milestone.label.day` `milestone.msg.suggest` `preview.changes` `milestone.preview.changes` `milestone.preview.badge` `milestone.preview.note` `preview.view.current` `preview.view.candidate` `preview.undo` `preview.applyHint` `preview.apply` `preview.cancel` `milestone.plate.day` `a11y.pose.wave_main` `a11y.mascot` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `prompt.title` `prompt.mine` `a11y.presence` | iOS·낮·밝게·ko, Android·밤·어둡게·ko, iOS·낮·밝게·en, Android·밤·어둡게·ja |
| `S28-preview-partial` | 제안 미리 보기 · 방에 자리가 모자라 일부만 | `milestone.label.day` `milestone.msg.suggest` `preview.changes` `milestone.preview.changes` `milestone.suggest.partial` `milestone.preview.badge` `milestone.preview.note` `preview.view.current` `preview.view.candidate` `preview.undo` `preview.applyHint` `preview.apply` `preview.cancel` `milestone.plate.day` `a11y.pose.wave_main` `a11y.mascot` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `prompt.title` `prompt.mine` `a11y.presence` | iOS·낮·밝게·ko, Android·밤·어둡게·ko |
| `S28-preview-anniv` | 1주년 제안 미리 보기(선물 포함 6개) | `milestone.label.anniv` `milestone.msg.suggest` `preview.changes` `milestone.preview.changes` `milestone.preview.badge` `milestone.preview.note` `preview.view.current` `preview.view.candidate` `preview.undo` `preview.applyHint` `preview.apply` `preview.cancel` `milestone.plate.anniv` `a11y.pose.wave_main` `a11y.mascot` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `prompt.title` `prompt.mine` `a11y.presence` | iOS·낮·밝게·ko, Android·밤·어둡게·ko |

## 이동 및 뒤로

F02: S06 홈 ↔ S07 방 ↔ S13 설정; S06 → S04 초대, 사진 시트, S28 마일스톤. 뒤로: 시트/상세를 먼저 닫고 탭 루트는 홈, 홈 루트에서는 앱 종료.

## 접근성

상태 표에 나열된 `a11y.*` 키를 스크린 리더 이름으로 사용합니다. 공통 접근성 및 200% 글자 규칙은 [interaction notes](../../../interaction-notes.md#10-접근성-상호작용)를 참조하세요. TODO: 해당 상태에 명시되지 않은 역할과 이름을 확인하세요.

## 수락 시나리오

- [ ] S28-AC-01: 마일스톤 날짜에 홈에서 축하 상태와 방 꾸미기 제안을 표시한다.

## 열린 질문 / 추적

TODO: 명세에 없는 disabled/offline 상태의 적용 여부와 정확한 뒤로 대상을 확인하세요. 시나리오와 요구사항·테스트·실행 결과는 [추적표](../../traceability.md)에 연결하세요.
