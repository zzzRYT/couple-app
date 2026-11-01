# S06 홈 탭 — 메인 D-day 페이지

승인자: 미승인
승인일: 미정

## 목적, ID, 경로

ID: S06
Route: /(tabs)/home

## 디자인 원본

- [S06-main-dday.dc.html](../../../canvas/project/S06-main-dday.dc.html)

## 이미지

- [S06-photo__ios-light-ko.png](../../../exports/S06-photo__ios-light-ko.png)
- [S06-photo-crop__ios-light-ko.png](../../../exports/S06-photo-crop__ios-light-ko.png)
- [S06-both__ios-light-ko.png](../../../exports/S06-both__ios-light-ko.png)
- [S06-photo-sheet__ios-light-ko.png](../../../exports/S06-photo-sheet__ios-light-ko.png)
- [S06-photo-partner-changed__ios-light-ko.png](../../../exports/S06-photo-partner-changed__ios-light-ko.png)
- [S06-both__android-dark-ja.png](../../../exports/S06-both__android-dark-ja.png)
- [S06-photo__android-dark-ko.png](../../../exports/S06-photo__android-dark-ko.png)

## 상태와 상호작용

- **캔버스 보드**: `S06-main-dday, S23-tab-home`
- **목적**: 함께한 일수(풍선·리본 일러스트와 함께), 날짜 편집, 초대 미완료, 두 사람 참여, 로딩, 동기화 오류, 오프라인 마지막 상태, 날짜 미설정, 방 카드(지금 방의 낮·밤 표시), "우리 방 열기".
- **이동**: 탭 루트(홈). 초대 코드 보기 → 푸시(탭 바 숨김). 날짜 수정 → 시트. 우리 방 열기 → 방 탭.
- D-day 문구는 템플릿: `dday.eyebrow` + `dday.count`(ko "함께한 지 / {n}일째", en "Together / Day {n}", ja "一緒に過ごして / {n}日目"). 접근성 문장은 별도 키 `a11y.dday`.
- 일수 규칙 제안: 함께한 날짜 당일을 1일째로 센다.
- 큰 글자(≥160%)에서는 마스코트를 줄이고 방 카드를 접어서 숫자를 우선해요.
- **긴 문구·언어 사례**: 영어는 "Day 483"처럼 단어가 숫자 앞, 일본어는 "483日目". 200%에서 영어 "Day"와 숫자가 두 줄이 돼요.

| 상태 ID | 설명 | 사용하는 키 | 그린 조합 |
|---|---|---|---|
| `S06-loading` | 로딩 (스켈레톤) | `main.loading` `main.appName` `main.openRoom` `a11y.tabbar` `tab.home` `a11y.tab.sel` `a11y.tab` `tab.room` `tab.settings` | iOS·밝게·ko, Android·어둡게·ko |
| `S06-both` | 기본: 두 사람 참여 · 배경 사진 없음(종이색 바탕) | `dday.eyebrow` `a11y.dday` `dday.count` `date.since` `sample.partner` `main.chip.both` `main.appName` `a11y.cover.add` `cover.add` `a11y.pose.wave_main` `a11y.mascot` `main.roomCard.title` `main.roomCard.day` `main.openRoom` `main.editDate` `a11y.tabbar` `tab.home` `a11y.tab.sel` `a11y.tab` `tab.room` `tab.settings` | iOS·밝게·ko, Android·어둡게·ko, iOS·밝게·en, Android·어둡게·ja 외 4 |
| `S06-photo` | 배경 사진 있음 (사진 위 글자는 어두운 막으로 받침) | `dday.eyebrow` `a11y.dday` `dday.count` `date.since` `sample.partner` `main.chip.both` `a11y.cover.photo` `main.appName` `a11y.cover.change` `a11y.pose.wave_main` `a11y.mascot` `main.roomCard.title` `main.roomCard.day` `main.openRoom` `main.editDate` `a11y.tabbar` `tab.home` `a11y.tab.sel` `a11y.tab` `tab.room` `tab.settings` | iOS·밝게·ko, Android·어둡게·ko, iOS·밝게·en, Android·어둡게·ja 외 2 |
| `S06-photo-load` | 배경 사진 불러오는 중 | `dday.eyebrow` `a11y.dday` `dday.count` `date.since` `sample.partner` `main.chip.both` `cover.loading` `main.appName` `a11y.pose.wave_main` `a11y.mascot` `main.roomCard.title` `main.roomCard.day` `main.openRoom` `main.editDate` `a11y.tabbar` `tab.home` `a11y.tab.sel` `a11y.tab` `tab.room` `tab.settings` | iOS·밝게·ko, Android·어둡게·ko |
| `S06-photo-err` | 배경 사진 불러오기 실패 (종이색으로 대체) | `cover.load.err` `common.retry` `dday.eyebrow` `a11y.dday` `dday.count` `date.since` `sample.partner` `main.chip.both` `main.appName` `a11y.cover.add` `cover.add` `a11y.pose.wave_main` `a11y.mascot` `main.roomCard.title` `main.roomCard.day` `main.openRoom` `main.editDate` `a11y.tabbar` `tab.home` `a11y.tab.sel` `a11y.tab` `tab.room` `tab.settings` | iOS·밝게·ko, Android·어둡게·ko |
| `S06-photo-sheet` | 사진 바꾸기 시트 (앨범 선택 · 없애기) | `dday.eyebrow` `a11y.dday` `dday.count` `date.since` `sample.partner` `main.chip.both` `a11y.cover.photo` `main.appName` `a11y.cover.change` `a11y.pose.wave_main` `a11y.mascot` `main.roomCard.title` `main.roomCard.day` `main.openRoom` `main.editDate` `a11y.tabbar` `tab.home` `a11y.tab.sel` `a11y.tab` `tab.room` `tab.settings` `cover.sheet.title` `cover.by.time` `cover.by` `cover.sheet.pick` `cover.sheet.remove` `cover.sheet.note` `common.cancel` | iOS·밝게·ko, Android·어둡게·ko |
| `S06-photo-add-sheet` | 사진 추가 시트 (처음) | `dday.eyebrow` `a11y.dday` `dday.count` `date.since` `sample.partner` `main.chip.both` `main.appName` `a11y.cover.add` `cover.add` `a11y.pose.wave_main` `a11y.mascot` `main.roomCard.title` `main.roomCard.day` `main.openRoom` `main.editDate` `a11y.tabbar` `tab.home` `a11y.tab.sel` `a11y.tab` `tab.room` `tab.settings` `cover.sheet.title` `cover.sheet.pick` `cover.sheet.note` `common.cancel` | iOS·밝게·ko, Android·어둡게·ko |
| `S06-photo-crop` | 사진 자르기 (시스템 사진 선택 뒤) | `cover.crop.title` `a11y.cover.crop` `cover.crop.hint` `cover.crop.done` `common.cancel` | iOS·밝게·ko, Android·어둡게·ko |
| `S06-photo-upload` | 사진 올리는 중 | `dday.eyebrow` `a11y.dday` `dday.count` `date.since` `sample.partner` `main.chip.both` `cover.up.title` `a11y.cover.photo` `main.appName` `a11y.cover.change` `a11y.pose.wave_main` `a11y.mascot` `main.roomCard.title` `main.roomCard.day` `main.openRoom` `main.editDate` `a11y.tabbar` `tab.home` `a11y.tab.sel` `a11y.tab` `tab.room` `tab.settings` | iOS·밝게·ko, Android·어둡게·ko |
| `S06-photo-uperr` | 사진 올리기 실패 (기존 사진 유지) | `cover.err.title` `cover.err.body` `common.retry` `dday.eyebrow` `a11y.dday` `dday.count` `date.since` `sample.partner` `main.chip.both` `a11y.cover.photo` `main.appName` `a11y.cover.change` `a11y.pose.wave_main` `a11y.mascot` `main.roomCard.title` `main.roomCard.day` `main.openRoom` `main.editDate` `a11y.tabbar` `tab.home` `a11y.tab.sel` `a11y.tab` `tab.room` `tab.settings` | iOS·밝게·ko, Android·어둡게·ko |
| `S06-photo-reject` | 쓸 수 없는 사진 (형식·크기) | `dday.eyebrow` `a11y.dday` `dday.count` `date.since` `sample.partner` `main.chip.both` `main.appName` `a11y.cover.add` `cover.add` `a11y.pose.wave_main` `a11y.mascot` `main.roomCard.title` `main.roomCard.day` `main.openRoom` `main.editDate` `a11y.tabbar` `tab.home` `a11y.tab.sel` `a11y.tab` `tab.room` `tab.settings` `cover.rej.title` `cover.rej.body` `common.done` | iOS·밝게·ko, Android·어둡게·ko |
| `S06-photo-updated` | 사진 바꿈 완료 토스트 | `dday.eyebrow` `a11y.dday` `dday.count` `date.since` `sample.partner` `main.chip.both` `a11y.cover.photo` `main.appName` `a11y.cover.change` `a11y.pose.wave_main` `a11y.mascot` `main.roomCard.title` `main.roomCard.day` `main.openRoom` `main.editDate` `a11y.tabbar` `tab.home` `a11y.tab.sel` `a11y.tab` `tab.room` `tab.settings` `cover.updated` | iOS·밝게·ko, Android·어둡게·ko |
| `S06-photo-partner-changed` | 상대가 사진을 바꿈 (홈을 열면 누가 바꿨는지 안내) | `dday.eyebrow` `a11y.dday` `dday.count` `date.since` `sample.partner` `main.chip.both` `a11y.cover.photo` `main.appName` `a11y.cover.change` `a11y.pose.wave_main` `a11y.mascot` `main.roomCard.title` `main.roomCard.day` `main.openRoom` `main.editDate` `a11y.tabbar` `tab.home` `a11y.tab.sel` `a11y.tab` `tab.room` `tab.settings` `cover.partner.changed` | iOS·밝게·ko, Android·어둡게·ko |
| `S06-photo-partner-removed` | 상대가 사진을 없앰 (종이색으로 돌아감) | `dday.eyebrow` `a11y.dday` `dday.count` `date.since` `sample.partner` `main.chip.both` `main.appName` `a11y.cover.add` `cover.add` `a11y.pose.wave_main` `a11y.mascot` `main.roomCard.title` `main.roomCard.day` `main.openRoom` `main.editDate` `a11y.tabbar` `tab.home` `a11y.tab.sel` `a11y.tab` `tab.room` `tab.settings` `cover.partner.removed` | iOS·밝게·ko, Android·어둡게·ko |
| `S06-photo-removed` | 사진 없앰 토스트 (종이색으로 돌아감) | `dday.eyebrow` `a11y.dday` `dday.count` `date.since` `sample.partner` `main.chip.both` `main.appName` `a11y.cover.add` `cover.add` `a11y.pose.wave_main` `a11y.mascot` `main.roomCard.title` `main.roomCard.day` `main.openRoom` `main.editDate` `a11y.tabbar` `tab.home` `a11y.tab.sel` `a11y.tab` `tab.room` `tab.settings` `cover.removed` | iOS·밝게·ko, Android·어둡게·ko |
| `S06-pending` | 상대 초대 미완료 | `dday.eyebrow` `a11y.dday` `dday.count` `date.since` `main.appName` `a11y.cover.add` `cover.add` `main.invitePending.title` `main.invitePending.body` `main.invitePending.action` `a11y.pose.wave_main` `a11y.mascot` `main.roomCard.title` `main.roomCard.day` `main.openRoom` `main.editDate` `a11y.tabbar` `tab.home` `a11y.tab.sel` `a11y.tab` `tab.room` `tab.settings` | iOS·밝게·ko, Android·어둡게·ko, iOS·밝게·en, Android·어둡게·ja 외 1 |
| `S06-nodate` | 날짜 미설정 | `main.noDate.title` `main.noDate.body` `main.appName` `a11y.cover.add` `cover.add` `main.noDate.action` `a11y.tabbar` `tab.home` `a11y.tab.sel` `a11y.tab` `tab.room` `tab.settings` | iOS·밝게·ko, Android·어둡게·ko |
| `S06-edit` | 날짜 수정 시트 | `dday.eyebrow` `a11y.dday` `dday.count` `date.since` `sample.partner` `main.chip.both` `main.appName` `a11y.cover.add` `cover.add` `a11y.pose.wave_main` `a11y.mascot` `main.roomCard.title` `main.roomCard.day` `main.openRoom` `main.editDate` `a11y.tabbar` `tab.home` `a11y.tab.sel` `a11y.tab` `tab.room` `tab.settings` `main.editSheet.title` `main.editSheet.body` `common.save` | iOS·밝게·ko, Android·어둡게·ko, iOS·밝게·en, Android·어둡게·ja |
| `S06-saved` | 날짜 수정 완료 토스트 | `dday.eyebrow` `a11y.dday` `dday.count` `date.since` `sample.partner` `main.chip.both` `main.appName` `a11y.cover.add` `cover.add` `a11y.pose.wave_main` `a11y.mascot` `main.roomCard.title` `main.roomCard.day` `main.openRoom` `main.editDate` `a11y.tabbar` `tab.home` `a11y.tab.sel` `a11y.tab` `tab.room` `tab.settings` `main.editSheet.saved` | iOS·밝게·ko, Android·어둡게·ko |
| `S06-syncerr` | 동기화 오류 (마지막 저장본) | `main.sync.title` `main.sync.body` `common.retry` `dday.eyebrow` `a11y.dday` `dday.count` `date.since` `sample.partner` `main.chip.both` `main.appName` `a11y.cover.add` `cover.add` `a11y.pose.wave_main` `a11y.mascot` `main.roomCard.title` `main.roomCard.day` `main.openRoom` `main.editDate` `a11y.tabbar` `tab.home` `a11y.tab.sel` `a11y.tab` `tab.room` `tab.settings` | iOS·밝게·ko, Android·어둡게·ko |
| `S06-offline` | 오프라인 · 마지막 상태 | `main.offline.title` `main.offline.body` `dday.eyebrow` `a11y.dday` `dday.count` `date.since` `sample.partner` `main.chip.both` `main.appName` `a11y.cover.add` `cover.add` `a11y.pose.wave_main` `a11y.mascot` `main.roomCard.title` `main.roomCard.day` `main.openRoom` `main.editDate` `a11y.tabbar` `tab.home` `a11y.tab.sel` `a11y.tab` `tab.room` `tab.settings` | iOS·밝게·ko, Android·어둡게·ko |
| `S06-night` | 방이 밤일 때 방 카드 | `dday.eyebrow` `a11y.dday` `dday.count` `date.since` `sample.partner` `main.chip.both` `main.appName` `a11y.cover.add` `cover.add` `a11y.pose.wave_main` `a11y.mascot` `main.roomCard.title` `main.roomCard.night` `main.openRoom` `main.editDate` `a11y.tabbar` `tab.home` `a11y.tab.sel` `a11y.tab` `tab.room` `tab.settings` | iOS·밝게·ko, Android·어둡게·ko |

## 이동 및 뒤로

F02: S06 홈 ↔ S07 방 ↔ S13 설정; S06 → S04 초대, 사진 시트, S28 마일스톤. 뒤로: 시트/상세를 먼저 닫고 탭 루트는 홈, 홈 루트에서는 앱 종료.

## 접근성

상태 표에 나열된 `a11y.*` 키를 스크린 리더 이름으로 사용합니다. 공통 접근성 및 200% 글자 규칙은 [interaction notes](../../../interaction-notes.md#10-접근성-상호작용)를 참조하세요. TODO: 해당 상태에 명시되지 않은 역할과 이름을 확인하세요.

## 수락 시나리오

- [ ] S06-AC-01: 두 사람이 참여하면 함께한 일수와 방 열기를 표시한다.
- [ ] S06-AC-02: 오프라인에서는 마지막 상태를 표시한다.

## 열린 질문 / 추적

TODO: 명세에 없는 disabled/offline 상태의 적용 여부와 정확한 뒤로 대상을 확인하세요. 시나리오와 요구사항·테스트·실행 결과는 [추적표](../../traceability.md)에 연결하세요.
