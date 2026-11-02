# S23 S23 tab

승인자: 미승인
승인일: 미정

## 목적, ID, 경로

ID: S23
Route: /(tabs)/home

## 디자인 원본

- [S23-tab-home.dc.html](../../../canvas/project/S23-tab-home.dc.html)

## 이미지

- [S23-first__ios-light-ko.png](../../../exports/S23-first__ios-light-ko.png)

## 상태와 상호작용

| 상태 ID | 설명 | 사용하는 키 |
|---|---|---|
| `S23-first` | 홈 · 첫 실행(공간을 만든 직후) + 방 탭 안내 | `dday.eyebrow` `a11y.dday` `dday.count` `date.since` `main.appName` `a11y.cover.add` `cover.add` `main.invitePending.title` `main.invitePending.body` `main.invitePending.action` `a11y.pose.wave_main` `a11y.mascot` `main.roomCard.title` `main.roomCard.day` `main.openRoom` `a11y.tabbar` `tab.home` `a11y.tab.sel` `a11y.tab` `tab.room` `tab.settings` `coach.home` `a11y.coach` `coach.ok` `main.editDate` |
| `S23-empty` | 홈 · 비어 있음(날짜 미설정) | `main.noDate.title` `main.noDate.body` `main.appName` `a11y.cover.add` `cover.add` `main.noDate.action` `a11y.tabbar` `tab.home` `a11y.tab.sel` `a11y.tab` `tab.room` `tab.settings` |
| `S23-normal` | 홈 · 보통(두 사람 참여) | `dday.eyebrow` `a11y.dday` `dday.count` `date.since` `sample.partner` `main.chip.both` `main.appName` `a11y.cover.add` `cover.add` `a11y.pose.wave_main` `a11y.mascot` `main.roomCard.title` `main.roomCard.day` `main.openRoom` `main.editDate` `a11y.tabbar` `tab.home` `a11y.tab.sel` `a11y.tab` `tab.room` `tab.settings` |
| `S23-photo` | 홈 · 배경 사진 있음 | `dday.eyebrow` `a11y.dday` `dday.count` `date.since` `sample.partner` `main.chip.both` `a11y.cover.photo` `main.appName` `a11y.cover.change` `a11y.pose.wave_main` `a11y.mascot` `main.roomCard.title` `main.roomCard.day` `main.openRoom` `main.editDate` `a11y.tabbar` `tab.home` `a11y.tab.sel` `a11y.tab` `tab.room` `tab.settings` |
| `S23-pending` | 홈 · 상대 초대 미완료 | `dday.eyebrow` `a11y.dday` `dday.count` `date.since` `main.appName` `a11y.cover.add` `cover.add` `main.invitePending.title` `main.invitePending.body` `main.invitePending.action` `a11y.pose.wave_main` `a11y.mascot` `main.roomCard.title` `main.roomCard.day` `main.openRoom` `main.editDate` `a11y.tabbar` `tab.home` `a11y.tab.sel` `a11y.tab` `tab.room` `tab.settings` |
| `S23-sheet-photo` | 홈 → 배경 사진 바꾸기(시트 · 탭 바 위로 올라옴) | `dday.eyebrow` `a11y.dday` `dday.count` `date.since` `sample.partner` `main.chip.both` `a11y.cover.photo` `main.appName` `a11y.cover.change` `a11y.pose.wave_main` `a11y.mascot` `main.roomCard.title` `main.roomCard.day` `main.openRoom` `main.editDate` `a11y.tabbar` `tab.home` `a11y.tab.sel` `a11y.tab` `tab.room` `tab.settings` `cover.sheet.title` `cover.by.time` `cover.by` `cover.sheet.pick` `cover.sheet.remove` `cover.sheet.note` `common.cancel` |
| `S23-loading` | 홈 · 로딩 | `main.loading` `main.appName` `main.openRoom` `a11y.tabbar` `tab.home` `a11y.tab.sel` `a11y.tab` `tab.room` `tab.settings` |
| `S23-offline` | 홈 · 오프라인(마지막 상태) | `main.offline.title` `main.offline.body` `dday.eyebrow` `a11y.dday` `dday.count` `date.since` `sample.partner` `main.chip.both` `main.appName` `a11y.cover.add` `cover.add` `a11y.pose.wave_main` `a11y.mascot` `main.roomCard.title` `main.roomCard.day` `main.openRoom` `main.editDate` `a11y.tabbar` `tab.home` `a11y.tab.sel` `a11y.tab` `tab.room` `tab.settings` |
| `S23-error` | 홈 · 동기화 오류 | `main.sync.title` `main.sync.body` `common.retry` `dday.eyebrow` `a11y.dday` `dday.count` `date.since` `sample.partner` `main.chip.both` `main.appName` `a11y.cover.add` `cover.add` `a11y.pose.wave_main` `a11y.mascot` `main.roomCard.title` `main.roomCard.day` `main.openRoom` `main.editDate` `a11y.tabbar` `tab.home` `a11y.tab.sel` `a11y.tab` `tab.room` `tab.settings` |
| `S23-push-invite` | 홈 → 초대 코드 보기(푸시 · 탭 바 숨김) | `invite.expires` `invite.expiresAt.sample` `invite.expiresAt` `invite.title` `invite.body` `invite.code.label` `a11y.code` `invite.reissue` `invite.share` `invite.copy` |
| `S23-sheet-date` | 홈 → 날짜 수정(시트 · 탭 바 위로 올라옴) | `dday.eyebrow` `a11y.dday` `dday.count` `date.since` `sample.partner` `main.chip.both` `main.appName` `a11y.cover.add` `cover.add` `a11y.pose.wave_main` `a11y.mascot` `main.roomCard.title` `main.roomCard.day` `main.openRoom` `main.editDate` `a11y.tabbar` `tab.home` `a11y.tab.sel` `a11y.tab` `tab.room` `tab.settings` `main.editSheet.title` `main.editSheet.body` `common.save` |

## 이동 및 뒤로

F02: S06 홈 ↔ S07 방 ↔ S13 설정; S06 → S04 초대, 사진 시트, S28 마일스톤. 뒤로: 시트/상세를 먼저 닫고 탭 루트는 홈, 홈 루트에서는 앱 종료.

## 접근성

상태 표에 나열된 `a11y.*` 키를 스크린 리더 이름으로 사용합니다. 공통 접근성 및 200% 글자 규칙은 [interaction notes](../../../interaction-notes.md#10-접근성-상호작용)를 참조하세요. TODO: 해당 상태에 명시되지 않은 역할과 이름을 확인하세요.

## 수락 시나리오

- [ ] S23-AC-01: 홈 탭을 선택하면 홈 루트를 표시한다.

## 열린 질문 / 추적

TODO: 명세에 없는 disabled/offline 상태의 적용 여부와 정확한 뒤로 대상을 확인하세요. 시나리오와 요구사항·테스트·실행 결과는 [추적표](../../traceability.md)에 연결하세요.
