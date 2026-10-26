# screens.md — 화면 목록과 상태 (방향 A)

각 화면의 목적, 이동, 상태, 사용하는 번역 키, 긴 문구 사례예요. 상태 ID는 캔버스 프레임 캡션과 같아요(예: `S07-decorated`). 모든 화면은 iOS와 Android, 한국어·영어·일본어, 밝은/어두운 앱, 방의 낮/밤(방 화면), 고대비, 글자 200%에서 그렸어요(어느 프레임이 어느 조합인지는 캔버스 캡션 두 번째 줄). 탭 3개(홈·방·설정)의 루트 화면은 S06·S07·S13이고, 탭 단위로 상태를 모은 보드가 S23·S24·S26, 이동 규칙은 S27 / `interaction-notes.md`예요.

공통 규칙
- **화면 번호**는 `specs/001-couple-prompt-todo/design-brief.md`의 1~16번과 같아요(S01~S16). S11(기록)은 첫 버전에서 뺐어요(후속 버전). S17은 비어 있어요(마스코트는 **캐릭터 섹션 C01~C05**로 옮겼어요), S18 에셋, S19 글꼴·토큰, S20 접근성, S21 긴 문구, S22 컴포넌트, S23·S24·S26 탭 단위(S25는 기록 탭이라 뺐어요), S27 탭 구조.
- **탭 바가 보이는 화면**: 홈·방·설정 루트(및 그 루트의 시트). 나머지 푸시 화면과 작업 흐름, 탭 바 앞의 흐름(S01~S05)에서는 숨겨요.
- **글자 확대**: 200%까지 설계. 줄이지 않고 줄바꿈·스크롤. 방 도구 막대 라벨은 160%에서 멈추고 2단으로 바뀌어요.
- 한국어 문구는 존댓말 해요체, 알림·달력·할 일·가격, 그리고 홈 배경 사진 말고 다른 사진 기능을 암시하는 표현을 쓰지 않아요.

## S01 온보딩 / 시작

- **캔버스 보드**: `S01-onboarding`
- **목적**: 제품 소개 3장(함께한 날 세기 · 프롬프트로 방 꾸미기 · 마스코트 — 3번째 장이 앱 전체에서 유일한 캐릭터 히어로), 로그인 시작, 약관·개인정보·연령 문구, 재실행 상태.
- **이동**: 앱 첫 실행 → 소개 1~3 → 시작하기 → S02. 이미 계정이 있어요 → S02. 재실행(로그아웃 후) → 최근 사용한 방법 강조된 로그인.
- 연령 문구("만 14세 이상")는 plan.md 구현 전 결정 4(연령 제한)가 정해지기 전의 **제안 문구**예요.
- 스토어 정책 문구 자리는 약관 링크 아래 한 줄이에요(법무 확정 후 교체).
- 탭 바 없음(탭 구조 앞의 흐름).
- **긴 문구·언어 사례**: 영어 "Count the days you've had together"처럼 제목이 길어도 두 줄로 줄바꿈돼요. 일본어 본문은 line-break: strict.

| 상태 ID | 설명 | 사용하는 키 | 그린 조합 |
|---|---|---|---|
| `S01-1` | 소개 1: 둘이 함께한 날 | `onb.skip` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `onb.p1.title` `onb.p1.body` `onb.pageOf` `common.next` | iOS·밝게·ko, Android·어둡게·ko |
| `S01-2` | 소개 2: 프롬프트로 방 꾸미기 | `onb.skip` `onb.p2.title` `onb.p2.body` `onb.pageOf` `common.next` | iOS·밝게·ko, Android·어둡게·ko |
| `S01-3` | 소개 3: 마스코트 + 시작, 약관·연령 문구 위치 | `a11y.pose.wave_main` `a11y.mascot` `onb.p3.title` `onb.p3.body` `onb.pageOf` `onb.start` `onb.hasAccount` `onb.legal.lead` `onb.legal.links` `onb.age` | iOS·밝게·ko, Android·어둡게·ko, iOS·밝게·en, Android·어둡게·ja 외 4 |
| `S01-return` | 재실행: 최근 사용 로그인 표시 | `onb.back.title` `onb.back.body` `onb.lastUsed` `login.kakao` `login.apple` `login.email` `onb.legal.lead` `onb.legal.links` `onb.age` | iOS·밝게·ko, Android·어둡게·ko, iOS·밝게·en, Android·어둡게·ja |

## S02 로그인 선택 / 인증

- **캔버스 보드**: `S02-login`
- **목적**: 카카오·Apple·이메일 선택, OAuth 이동·복귀, 처리 중, 취소, 재시도, 이메일 코드 입력·재전송·만료·시도 과다.
- **이동**: S01 → 선택 → (카카오/Apple) 외부 이동 → 복귀 → 처리 중 → 공간 없음이면 S03, 있으면 홈. 이메일 → 주소 입력 → 6자리 코드(메일의 링크로도 가능) → 처리 중.
- 카카오·Apple 버튼은 공식 에셋으로 교체할 자리표시예요. 카카오는 공식 노랑 #FEE500·검정 글자, Apple은 플랫폼 지침의 흑백을 그대로 써요.
- 코드 방식(6자리)을 기본으로 그렸어요. 링크 방식만 쓸지는 구현 때 확정(인계 문서의 열린 질문).
- Android도 Apple 로그인은 웹 흐름이라 같은 버튼을 써요.
- **긴 문구·언어 사례**: 코드 안내 문구는 이메일 주소가 길어지면 줄바꿈돼요(주소는 줄 중간에서 끊지 않고 전체를 다음 줄로).

| 상태 ID | 설명 | 사용하는 키 | 그린 조합 |
|---|---|---|---|
| `S02-select` | 로그인 방법 선택 | `login.title` `login.kakao` `login.apple` `login.email` `onb.legal.lead` `onb.legal.links` `onb.age` | iOS·밝게·ko, Android·어둡게·ko, iOS·밝게·en, Android·어둡게·ja 외 4 |
| `S02-redirect` | OAuth 이동 중 (카카오) | `login.redirect.title` `login.redirect.body` `login.cancel` | iOS·밝게·ko, Android·어둡게·ko |
| `S02-proc` | 복귀 후 처리 중 | `login.processing` | iOS·밝게·ko, Android·어둡게·ko |
| `S02-cancel` | 취소 | `login.cancelled.title` `login.cancelled.body` `common.retry` `login.other` | iOS·밝게·ko, Android·어둡게·ko |
| `S02-error` | 오류 · 재시도 | `login.error.title` `login.error.body` `common.retry` `login.other` | iOS·밝게·ko, Android·어둡게·ko |
| `S02-email` | 이메일 입력 (입력 중) | `login.email.title` `login.email.label` `login.email.send` | iOS·밝게·ko, Android·어둡게·ko, iOS·밝게·ko·200% |
| `S02-email-bad` | 이메일 형식 오류 | `login.email.title` `login.email.label` `login.email.invalid` `login.email.send` | iOS·밝게·ko, Android·어둡게·ko |
| `S02-sending` | 이메일 코드 발송 중 | `login.email.title` `login.email.label` `login.email.send` | iOS·밝게·ko, Android·어둡게·ko |
| `S02-code` | 코드 입력 (재전송 대기) | `login.code.wrong` `login.code.expired` `login.code.rate` `login.code.resendIn` `login.code.title` `login.code.body` `login.code.confirm` | iOS·밝게·ko, Android·어둡게·ko |
| `S02-code-wrong` | 코드 불일치 | `login.code.wrong` `login.code.expired` `login.code.rate` `login.code.resend` `login.code.title` `login.code.body` `login.code.confirm` | iOS·밝게·ko, Android·어둡게·ko, iOS·밝게·en, Android·어둡게·ja |
| `S02-code-exp` | 코드 만료 | `login.code.wrong` `login.code.expired` `login.code.rate` `login.code.resend` `login.code.title` `login.code.body` `login.code.confirm` | iOS·밝게·ko, Android·어둡게·ko |
| `S02-code-rate` | 시도 과다 | `login.code.wrong` `login.code.expired` `login.code.rate` `login.code.resend` `login.code.title` `login.code.body` `login.code.confirm` | iOS·밝게·ko, Android·어둡게·ko |

## S03 커플 공간 생성

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

## S04 초대 코드 생성 · 공유

- **캔버스 보드**: `S04-invite-create`
- **목적**: 코드 생성 중, 8자리 코드와 만료 시간(24시간, 한 번만 수락), OS 공유 시트, 복사, 만료 임박, 만료됨, 재발급(기존 미사용 코드 폐기 안내), 공유 취소, 네트워크 오류, 상대 대기.
- **이동**: S03 → S04. 공유 시트(OS) / 복사. 나중에 초대하기 → 홈(초대 미완료).
- 코드는 0/O, 1/I 없이 8자(4-4 그룹)로 제안했어요(스펙에 길이 없음).
- 공유 시트는 OS 컴포넌트를 닮게 그린 자리표시예요.
- 알림이 없어서 "상대가 들어오면 알려 드려요"가 아니라 "앱을 열면 확인할 수 있어요"로 써요.
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

## S05 초대 코드 입력 / 수락

- **캔버스 보드**: `S05-invite-enter`
- **목적**: 코드 입력, 확인, 초대 상대·공간 확인 후 수락, 만료·사용됨·유효하지 않음·인원 초과·이미 다른 공간 소속.
- **이동**: S02(공간 없음) → "초대 코드가 있어요" → S05 → 참여 → 홈.
- 이미 다른 공간에 있는 사용자는 "한 번에 하나의 공간만"으로 안내해요(plan.md 구현 전 결정 4 제안 답).
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

## S06 홈 탭 — 메인 D-day 페이지

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
| `S06-photo-sheet` | 사진 바꾸기 시트 (앨범 선택 · 없애기) | `dday.eyebrow` `a11y.dday` `dday.count` `date.since` `sample.partner` `main.chip.both` `a11y.cover.photo` `main.appName` `a11y.cover.change` `a11y.pose.wave_main` `a11y.mascot` `main.roomCard.title` `main.roomCard.day` `main.openRoom` `main.editDate` `a11y.tabbar` `tab.home` `a11y.tab.sel` `a11y.tab` `tab.room` `tab.settings` `cover.sheet.title` `cover.sheet.pick` `cover.sheet.remove` `cover.sheet.note` `common.cancel` | iOS·밝게·ko, Android·어둡게·ko |
| `S06-photo-add-sheet` | 사진 추가 시트 (처음) | `dday.eyebrow` `a11y.dday` `dday.count` `date.since` `sample.partner` `main.chip.both` `main.appName` `a11y.cover.add` `cover.add` `a11y.pose.wave_main` `a11y.mascot` `main.roomCard.title` `main.roomCard.day` `main.openRoom` `main.editDate` `a11y.tabbar` `tab.home` `a11y.tab.sel` `a11y.tab` `tab.room` `tab.settings` `cover.sheet.title` `cover.sheet.pick` `cover.sheet.note` `common.cancel` | iOS·밝게·ko, Android·어둡게·ko |
| `S06-photo-crop` | 사진 자르기 (시스템 사진 선택 뒤) | `cover.crop.title` `a11y.cover.crop` `cover.crop.hint` `cover.crop.done` `common.cancel` | iOS·밝게·ko, Android·어둡게·ko |
| `S06-photo-upload` | 사진 올리는 중 | `dday.eyebrow` `a11y.dday` `dday.count` `date.since` `sample.partner` `main.chip.both` `cover.up.title` `a11y.cover.photo` `main.appName` `a11y.cover.change` `a11y.pose.wave_main` `a11y.mascot` `main.roomCard.title` `main.roomCard.day` `main.openRoom` `main.editDate` `a11y.tabbar` `tab.home` `a11y.tab.sel` `a11y.tab` `tab.room` `tab.settings` | iOS·밝게·ko, Android·어둡게·ko |
| `S06-photo-uperr` | 사진 올리기 실패 (기존 사진 유지) | `cover.err.title` `cover.err.body` `common.retry` `dday.eyebrow` `a11y.dday` `dday.count` `date.since` `sample.partner` `main.chip.both` `a11y.cover.photo` `main.appName` `a11y.cover.change` `a11y.pose.wave_main` `a11y.mascot` `main.roomCard.title` `main.roomCard.day` `main.openRoom` `main.editDate` `a11y.tabbar` `tab.home` `a11y.tab.sel` `a11y.tab` `tab.room` `tab.settings` | iOS·밝게·ko, Android·어둡게·ko |
| `S06-photo-reject` | 쓸 수 없는 사진 (형식·크기) | `dday.eyebrow` `a11y.dday` `dday.count` `date.since` `sample.partner` `main.chip.both` `main.appName` `a11y.cover.add` `cover.add` `a11y.pose.wave_main` `a11y.mascot` `main.roomCard.title` `main.roomCard.day` `main.openRoom` `main.editDate` `a11y.tabbar` `tab.home` `a11y.tab.sel` `a11y.tab` `tab.room` `tab.settings` `cover.rej.title` `cover.rej.body` `common.done` | iOS·밝게·ko, Android·어둡게·ko |
| `S06-photo-updated` | 사진 바꿈 완료 토스트 | `dday.eyebrow` `a11y.dday` `dday.count` `date.since` `sample.partner` `main.chip.both` `a11y.cover.photo` `main.appName` `a11y.cover.change` `a11y.pose.wave_main` `a11y.mascot` `main.roomCard.title` `main.roomCard.day` `main.openRoom` `main.editDate` `a11y.tabbar` `tab.home` `a11y.tab.sel` `a11y.tab` `tab.room` `tab.settings` `cover.updated` | iOS·밝게·ko, Android·어둡게·ko |
| `S06-photo-removed` | 사진 없앰 토스트 (종이색으로 돌아감) | `dday.eyebrow` `a11y.dday` `dday.count` `date.since` `sample.partner` `main.chip.both` `main.appName` `a11y.cover.add` `cover.add` `a11y.pose.wave_main` `a11y.mascot` `main.roomCard.title` `main.roomCard.day` `main.openRoom` `main.editDate` `a11y.tabbar` `tab.home` `a11y.tab.sel` `a11y.tab` `tab.room` `tab.settings` `cover.removed` | iOS·밝게·ko, Android·어둡게·ko |
| `S06-pending` | 상대 초대 미완료 | `dday.eyebrow` `a11y.dday` `dday.count` `date.since` `main.appName` `a11y.cover.add` `cover.add` `main.invitePending.title` `main.invitePending.body` `main.invitePending.action` `a11y.pose.wave_main` `a11y.mascot` `main.roomCard.title` `main.roomCard.day` `main.openRoom` `main.editDate` `a11y.tabbar` `tab.home` `a11y.tab.sel` `a11y.tab` `tab.room` `tab.settings` | iOS·밝게·ko, Android·어둡게·ko, iOS·밝게·en, Android·어둡게·ja 외 1 |
| `S06-nodate` | 날짜 미설정 | `main.noDate.title` `main.noDate.body` `main.appName` `a11y.cover.add` `cover.add` `main.noDate.action` `a11y.tabbar` `tab.home` `a11y.tab.sel` `a11y.tab` `tab.room` `tab.settings` | iOS·밝게·ko, Android·어둡게·ko |
| `S06-edit` | 날짜 수정 시트 | `dday.eyebrow` `a11y.dday` `dday.count` `date.since` `sample.partner` `main.chip.both` `main.appName` `a11y.cover.add` `cover.add` `a11y.pose.wave_main` `a11y.mascot` `main.roomCard.title` `main.roomCard.day` `main.openRoom` `main.editDate` `a11y.tabbar` `tab.home` `a11y.tab.sel` `a11y.tab` `tab.room` `tab.settings` `main.editSheet.title` `main.editSheet.body` `common.save` | iOS·밝게·ko, Android·어둡게·ko, iOS·밝게·en, Android·어둡게·ja |
| `S06-saved` | 날짜 수정 완료 토스트 | `dday.eyebrow` `a11y.dday` `dday.count` `date.since` `sample.partner` `main.chip.both` `main.appName` `a11y.cover.add` `cover.add` `a11y.pose.wave_main` `a11y.mascot` `main.roomCard.title` `main.roomCard.day` `main.openRoom` `main.editDate` `a11y.tabbar` `tab.home` `a11y.tab.sel` `a11y.tab` `tab.room` `tab.settings` `main.editSheet.saved` | iOS·밝게·ko, Android·어둡게·ko |
| `S06-syncerr` | 동기화 오류 (마지막 저장본) | `main.sync.title` `main.sync.body` `common.retry` `dday.eyebrow` `a11y.dday` `dday.count` `date.since` `sample.partner` `main.chip.both` `main.appName` `a11y.cover.add` `cover.add` `a11y.pose.wave_main` `a11y.mascot` `main.roomCard.title` `main.roomCard.day` `main.openRoom` `main.editDate` `a11y.tabbar` `tab.home` `a11y.tab.sel` `a11y.tab` `tab.room` `tab.settings` | iOS·밝게·ko, Android·어둡게·ko |
| `S06-offline` | 오프라인 · 마지막 상태 | `main.offline.title` `main.offline.body` `dday.eyebrow` `a11y.dday` `dday.count` `date.since` `sample.partner` `main.chip.both` `main.appName` `a11y.cover.add` `cover.add` `a11y.pose.wave_main` `a11y.mascot` `main.roomCard.title` `main.roomCard.day` `main.openRoom` `main.editDate` `a11y.tabbar` `tab.home` `a11y.tab.sel` `a11y.tab` `tab.room` `tab.settings` | iOS·밝게·ko, Android·어둡게·ko |
| `S06-night` | 방이 밤일 때 방 카드 | `dday.eyebrow` `a11y.dday` `dday.count` `date.since` `sample.partner` `main.chip.both` `main.appName` `a11y.cover.add` `cover.add` `a11y.pose.wave_main` `a11y.mascot` `main.roomCard.title` `main.roomCard.night` `main.openRoom` `main.editDate` `a11y.tabbar` `tab.home` `a11y.tab.sel` `a11y.tab` `tab.room` `tab.settings` | iOS·밝게·ko, Android·어둡게·ko |

## S07 방 탭 — 방 페이지

- **캔버스 보드**: `S07-room, S24-tab-room`
- **목적**: 마스코트가 기본 포함된 장면, 낮/밤, 네이티브 날짜 위젯, 방 도구 막대(되돌리기·꾸미기), 시스템 탭 바, 로딩·오프라인 읽기 전용·동기화 중/실패·상대 변경 실시간 반영·장면 데이터 복구 오류, 날짜 위젯 숨김, 보호 영역.
- **이동**: 탭 루트(방). 꾸미기 → 모달 시트(S08). 되돌리기 → 확인 다이얼로그(S10). 탭 바로 다른 탭.
- 방 도구 막대는 방 화면 **자신의 도구 막대**(위쪽)이고, 아래 탭 바는 **시스템 컴포넌트**예요. 두 영역 + 날짜 위젯 + 시스템 안전 영역이 보호 영역이에요(장식이 가리거나 입력을 가로챌 수 없음).
- 도구 막대 윤곽선은 방의 낮밤을 따라가요(낮 방 갈색, 밤 방 크림).
- 상대가 꾸미는 중이면 꾸미기 알약이 "지켜보기"로 바뀌고 되돌리기가 잠겨요.
- **긴 문구·언어 사례**: 도구 막대 라벨은 160%에서 멈추고 ≥160%에서는 꾸미기 한 줄 + 되돌리기 한 줄(2단)로 바뀌어요.

| 상태 ID | 설명 | 사용하는 키 | 그린 조합 |
|---|---|---|---|
| `S07-new` | 새 방 (마스코트 기본 + 화분) | `a11y.pose.wave_main` `a11y.mascot` `a11y.pose.walk` `a11y.pose.cheer` `a11y.pose.lookup` `a11y.pose.lie` `a11y.pose.sleep` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `room.ctl.undo` `room.ctl.decorate` `a11y.tabbar` `tab.home` `a11y.tab` `tab.room` `a11y.tab.sel` `tab.settings` | iOS·낮·밝게·ko, Android·밤·어둡게·ko, iOS·낮·밝게·en, Android·밤·어둡게·ja |
| `S07-decorated` | 꾸민 방 (소품·문구 2개·날짜 위젯) | `a11y.pose.wave_main` `a11y.mascot` `a11y.pose.walk` `a11y.pose.cheer` `a11y.pose.lookup` `a11y.pose.lie` `a11y.pose.sleep` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `room.ctl.undo` `room.ctl.decorate` `a11y.tabbar` `tab.home` `a11y.tab` `tab.room` `a11y.tab.sel` `tab.settings` | iOS·낮·밝게·ko, Android·밤·어둡게·ko, iOS·낮·밝게·en, Android·밤·어둡게·ja 외 10 |
| `S07-loading` | 로딩 (장면 자리 표시) | `room.loading` `room.ctl.undo` `room.ctl.decorate` `a11y.tabbar` `tab.home` `a11y.tab` `tab.room` `a11y.tab.sel` `tab.settings` | iOS·낮·밝게·ko, Android·밤·어둡게·ko |
| `S07-offline` | 오프라인 읽기 전용 | `room.offline` `a11y.pose.wave_main` `a11y.mascot` `a11y.pose.walk` `a11y.pose.cheer` `a11y.pose.lookup` `a11y.pose.lie` `a11y.pose.sleep` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `room.ctl.undo` `room.ctl.decorate` `a11y.tabbar` `tab.home` `a11y.tab` `tab.room` `a11y.tab.sel` `tab.settings` | iOS·낮·밝게·ko, Android·밤·어둡게·ko, iOS·낮·밝게·en, Android·밤·어둡게·ja |
| `S07-syncing` | 동기화 중 표시 | `room.syncing` `a11y.pose.wave_main` `a11y.mascot` `a11y.pose.walk` `a11y.pose.cheer` `a11y.pose.lookup` `a11y.pose.lie` `a11y.pose.sleep` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `room.ctl.undo` `room.ctl.decorate` `a11y.tabbar` `tab.home` `a11y.tab` `tab.room` `a11y.tab.sel` `tab.settings` | iOS·낮·밝게·ko, Android·밤·어둡게·ko |
| `S07-syncfail` | 동기화 실패 | `room.syncFail.title` `room.syncFail.body` `common.retry` `a11y.pose.wave_main` `a11y.mascot` `a11y.pose.walk` `a11y.pose.cheer` `a11y.pose.lookup` `a11y.pose.lie` `a11y.pose.sleep` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `room.ctl.undo` `room.ctl.decorate` `a11y.tabbar` `tab.home` `a11y.tab` `tab.room` `a11y.tab.sel` `tab.settings` | iOS·낮·밝게·ko, Android·밤·어둡게·ko |
| `S07-partner` | 상대가 방을 바꿈 (실시간 반영) | `sample.partner` `room.partnerChanged` `a11y.pose.lookup` `a11y.mascot` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `room.ctl.undo` `room.ctl.decorate` `a11y.tabbar` `tab.home` `a11y.tab` `tab.room` `a11y.tab.sel` `tab.settings` | iOS·낮·밝게·ko, Android·밤·어둡게·ko |
| `S07-recover` | 장면 데이터 복구 오류 | `room.recover.title` `room.recover.body` `room.recover.action` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `room.ctl.undo` `room.ctl.decorate` `a11y.tabbar` `tab.home` `a11y.tab` `tab.room` `a11y.tab.sel` `tab.settings` | iOS·낮·밝게·ko, Android·밤·어둡게·ko |
| `S07-hidden` | 날짜 위젯을 방에서 숨긴 경우 | `room.ddayHidden` `a11y.pose.wave_main` `a11y.mascot` `a11y.pose.walk` `a11y.pose.cheer` `a11y.pose.lookup` `a11y.pose.lie` `a11y.pose.sleep` `room.ctl.undo` `room.ctl.decorate` `a11y.tabbar` `tab.home` `a11y.tab` `tab.room` `a11y.tab.sel` `tab.settings` | iOS·낮·밝게·ko, Android·밤·어둡게·ko |
| `S07-protect` | 보호 영역 표시 (측정값에서 계산) | `a11y.pose.wave_main` `a11y.mascot` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `room.ctl.undo` `room.ctl.decorate` `a11y.tabbar` `tab.home` `a11y.tab` `tab.room` `a11y.tab.sel` `tab.settings` | iOS·낮·밝게·ko, Android·밤·어둡게·ko, iOS·낮·밝게·ko·200% |
| `S07-protect-small` | 보호 영역 · 360×640 | `a11y.pose.wave_main` `a11y.mascot` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `room.ctl.undo` `room.ctl.decorate` `a11y.tabbar` `tab.home` `a11y.tab` `tab.room` `a11y.tab.sel` `tab.settings` | Android·낮·밝게·ko |
| `S07-protect-med` | 보호 영역 · 412×915 | `a11y.pose.wave_main` `a11y.mascot` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `room.ctl.undo` `room.ctl.decorate` `a11y.tabbar` `tab.home` `a11y.tab` `tab.room` `a11y.tab.sel` `tab.settings` | Android·낮·밝게·ko |
| `S07-protect-large` | 보호 영역 · 430×932 | `a11y.pose.wave_main` `a11y.mascot` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `room.ctl.undo` `room.ctl.decorate` `a11y.tabbar` `tab.home` `a11y.tab` `tab.room` `a11y.tab.sel` `tab.settings` | iOS·낮·밝게·ko |
| `S07-protect-1.3` | 보호 영역 · 글자 130% | `a11y.pose.wave_main` `a11y.mascot` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `room.ctl.undo` `room.ctl.decorate` `a11y.tabbar` `tab.home` `a11y.tab` `tab.room` `a11y.tab.sel` `tab.settings` | iOS·밤·어둡게·ja·130% |
| `S07-protect-1.6` | 보호 영역 · 글자 160% | `a11y.pose.wave_main` `a11y.mascot` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `room.ctl.undo` `room.ctl.decorate` `a11y.tabbar` `tab.home` `a11y.tab` `tab.room` `a11y.tab.sel` `tab.settings` | iOS·밤·어둡게·ja·160% |
| `S07-widget-coral` | 날짜 위젯 모양·위치 변경 · coral | `a11y.pose.wave_main` `a11y.mascot` `a11y.pose.walk` `a11y.pose.cheer` `a11y.pose.lookup` `a11y.pose.lie` `a11y.pose.sleep` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `room.ctl.undo` `room.ctl.decorate` `a11y.tabbar` `tab.home` `a11y.tab` `tab.room` `a11y.tab.sel` `tab.settings` | iOS·낮·밝게·ko |
| `S07-widget-yellow` | 날짜 위젯 모양·위치 변경 · yellow | `a11y.pose.wave_main` `a11y.mascot` `a11y.pose.walk` `a11y.pose.cheer` `a11y.pose.lookup` `a11y.pose.lie` `a11y.pose.sleep` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `room.ctl.undo` `room.ctl.decorate` `a11y.tabbar` `tab.home` `a11y.tab` `tab.room` `a11y.tab.sel` `tab.settings` | iOS·밤·어둡게·ko |
| `S07-widget-white` | 날짜 위젯 모양·위치 변경 · white | `a11y.pose.wave_main` `a11y.mascot` `a11y.pose.walk` `a11y.pose.cheer` `a11y.pose.lookup` `a11y.pose.lie` `a11y.pose.sleep` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `room.ctl.undo` `room.ctl.decorate` `a11y.tabbar` `tab.home` `a11y.tab` `tab.room` `a11y.tab.sel` `tab.settings` | iOS·낮·밝게·ko |
| `S07-widget-navy` | 날짜 위젯 모양·위치 변경 · navy | `a11y.pose.wave_main` `a11y.mascot` `a11y.pose.walk` `a11y.pose.cheer` `a11y.pose.lookup` `a11y.pose.lie` `a11y.pose.sleep` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `room.ctl.undo` `room.ctl.decorate` `a11y.tabbar` `tab.home` `a11y.tab` `tab.room` `a11y.tab.sel` `tab.settings` | iOS·밤·어둡게·ko |

## S08 공유 프롬프트 대화 / 입력

- **캔버스 보드**: `S08-prompt-session`
- **목적**: 공유 대화와 미리 보기, 점유 상태 6가지(비어 있음 / 내가 점유 / 상대가 점유(쓰는 중·만드는 중) / 내 점유 만료 임박 / 내 점유 만료 / 상대 만료 후 이어받기), 이어받기 경합, 동의 필요, 하루 10회 소진, 오프라인, 미지원 요청, 브랜드 요청 거절, 실패·재시도, 키보드.
- **이동**: 방 탭의 꾸미기 → 모달 시트. 비어 있을 때 "내가 꾸밀게요"로 점유. 닫기 → 방.
- 점유는 자동이 아니라 "내가 꾸밀게요"로 시작해요(상대가 의도치 않게 막히는 것 방지). 3분(가정) 입력이 없으면 풀리고 쓰던 글은 남아요.
- 상대는 대화·미리 보기를 실시간 읽기 전용으로 봐요. 입력칸은 잠금 아이콘과 이유를 보여요.
- AI 배지는 두지 않았어요(스펙). 결과 카드는 "제안"으로 말해요.
- 탭 바는 모달 시트가 덮어요.
- **긴 문구·언어 사례**: 점유 표시 칩은 두 줄 헤더(제목 + 칩)로 둬서 영어·일본어 이름이 길어도 줄바꿈되지 않아요.

| 상태 ID | 설명 | 사용하는 키 | 그린 조합 |
|---|---|---|---|
| `S08-free` | 비어 있음 (아무도 점유 안 함) · 내가 꾸밀게요 | `prompt.msg.status.released` `prompt.msg.me` `prompt.msg.time` `prompt.msg.result` `prompt.start` `prompt.start.help` `a11y.pose.wave_main` `a11y.mascot` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `prompt.title` `prompt.free` `a11y.presence` `prompt.tab.prompt` `prompt.tab.mascot` | iOS·낮·밝게·ko, Android·밤·어둡게·ko, iOS·낮·밝게·ko·200%, Android·밤·어둡게·ja·200% |
| `S08-empty` | 비어 있음 · 대화 없음(처음) | `prompt.history.empty` `prompt.start` `prompt.start.help` `a11y.pose.wave_main` `a11y.mascot` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `prompt.title` `prompt.free` `a11y.presence` `prompt.tab.prompt` `prompt.tab.mascot` | iOS·낮·밝게·ko, Android·밤·어둡게·ko |
| `S08-mine` | 내가 점유 · 입력 가능 | `prompt.msg.me` `prompt.msg.time` `prompt.msg.result` `prompt.placeholder` `a11y.input` `a11y.send` `prompt.left` `prompt.idleHint` `a11y.pose.wave_main` `a11y.mascot` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `prompt.title` `prompt.mine` `a11y.presence` `prompt.tab.prompt` `prompt.tab.mascot` | iOS·낮·밝게·ko, Android·밤·어둡게·ko, iOS·낮·밝게·en, Android·밤·어둡게·ja 외 3 |
| `S08-kbd` | 내가 점유 · 키보드 입력 중 (탭 바·도구 막대를 가리지 않는 모달) | `prompt.msg.result` `prompt.msg.me` `prompt.placeholder` `a11y.input` `a11y.send` `prompt.left` `prompt.idleHint` `a11y.pose.wave_main` `a11y.mascot` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `prompt.title` `prompt.mine` `a11y.presence` `prompt.tab.prompt` `prompt.tab.mascot` `prompt.kbd` | iOS·낮·밝게·ko, Android·밤·어둡게·ko |
| `S08-sending` | 제출 중 · 입력 잠김 | `prompt.msg.me` `prompt.msg.time` `prompt.sending` `sample.partner` `prompt.input.partner` `a11y.input.ro` `a11y.send` `a11y.pose.wave_main` `a11y.mascot` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `prompt.title` `prompt.mine` `a11y.presence` `prompt.tab.prompt` `prompt.tab.mascot` | iOS·낮·밝게·ko, Android·밤·어둡게·ko |
| `S08-partner-typing` | 상대 점유 · 쓰는 중 (읽기 전용 실시간) | `prompt.msg.me` `prompt.msg.time` `sample.partner` `prompt.msg.partner` `prompt.partner.typing` `prompt.input.partner` `a11y.input.ro` `a11y.send` `a11y.pose.wave_main` `a11y.mascot` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `prompt.title` `prompt.partner` `a11y.presence` `prompt.tab.prompt` `prompt.tab.mascot` | iOS·낮·밝게·ko, Android·밤·어둡게·ko, iOS·낮·밝게·en, Android·밤·어둡게·ja |
| `S08-partner-working` | 상대 점유 · 미리 보기 만드는 중 | `sample.partner` `prompt.msg.partner` `prompt.msg.time` `prompt.partner.thinking` `prompt.input.partner` `a11y.input.ro` `a11y.send` `a11y.pose.wave_main` `a11y.mascot` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `prompt.title` `prompt.partner` `a11y.presence` `prompt.tab.prompt` `prompt.tab.mascot` | iOS·낮·밝게·ko, Android·밤·어둡게·ko |
| `S08-expiring` | 내 점유 · 만료 임박 (30초 전) | `prompt.msg.me` `prompt.msg.time` `prompt.msg.result` `prompt.expiring` `prompt.expiring.action` `prompt.placeholder` `a11y.input` `a11y.send` `prompt.left` `prompt.idleHint` `a11y.pose.wave_main` `a11y.mascot` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `prompt.title` `prompt.mine` `a11y.presence` `prompt.tab.prompt` `prompt.tab.mascot` | iOS·낮·밝게·ko, Android·밤·어둡게·ko |
| `S08-idle` | 내 점유 · 유휴로 해제됨 (쓰던 글 남음) | `prompt.msg.me` `prompt.msg.time` `prompt.msg.result` `prompt.idle.me.title` `prompt.idle.me.body` `prompt.placeholder` `a11y.input` `a11y.send` `prompt.idle.me.action` `a11y.pose.wave_main` `a11y.mascot` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `prompt.title` `prompt.free` `a11y.presence` `prompt.tab.prompt` `prompt.tab.mascot` | iOS·낮·밝게·ko, Android·밤·어둡게·ko |
| `S08-takeover` | 상대 유휴 만료 · 이어받기 (이전 미리 보기 유지) | `preview.badge` `prompt.msg.me` `prompt.msg.time` `prompt.msg.result` `prompt.msg.status.preview` `sample.partner` `prompt.takeover.title` `prompt.takeover.body` `prompt.takeover.action` `a11y.pose.wave_main` `a11y.mascot` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `prompt.title` `prompt.free` `a11y.presence` `prompt.tab.prompt` `prompt.tab.mascot` | iOS·낮·밝게·ko, Android·밤·어둡게·ko, iOS·낮·밝게·en, Android·밤·어둡게·ja |
| `S08-takeover-lost` | 이어받기 경합 · 상대가 먼저 | `preview.badge` `prompt.msg.me` `prompt.msg.time` `prompt.msg.result` `prompt.msg.status.preview` `sample.partner` `prompt.input.partner` `a11y.input.ro` `a11y.send` `a11y.pose.wave_main` `a11y.mascot` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `prompt.title` `prompt.partner` `a11y.presence` `prompt.tab.prompt` `prompt.tab.mascot` `prompt.takeover.lost` | iOS·낮·밝게·ko, Android·밤·어둡게·ko |
| `S08-consent` | 동의 필요 · 입력 막힘 | `prompt.consent.need` `prompt.consent.action` `a11y.input` `a11y.send` `a11y.pose.wave_main` `a11y.mascot` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `prompt.title` `prompt.mine` `a11y.presence` `prompt.tab.prompt` `prompt.tab.mascot` | iOS·낮·밝게·ko, Android·밤·어둡게·ko |
| `S08-quota` | 하루 10회 소진 | `prompt.msg.me` `prompt.msg.time` `prompt.msg.result` `prompt.quota.title` `prompt.quota.body` `a11y.input` `a11y.send` `a11y.pose.wave_main` `a11y.mascot` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `prompt.title` `prompt.mine` `a11y.presence` `prompt.tab.prompt` `prompt.tab.mascot` | iOS·낮·밝게·ko, Android·밤·어둡게·ko |
| `S08-offline` | 오프라인 · 온라인 전용 | `prompt.msg.me` `prompt.msg.time` `prompt.msg.result` `main.offline.title` `prompt.offline` `a11y.input` `a11y.send` `a11y.pose.wave_main` `a11y.mascot` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `prompt.title` `prompt.mine` `a11y.presence` `prompt.tab.prompt` `prompt.tab.mascot` | iOS·낮·밝게·ko, Android·밤·어둡게·ko |
| `S08-unsupported` | 지원하지 않는 요청 | `prompt.unsupported.title` `prompt.unsupported.body` `prompt.placeholder` `a11y.input` `a11y.send` `prompt.left` `prompt.idleHint` `a11y.pose.wave_main` `a11y.mascot` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `prompt.title` `prompt.mine` `a11y.presence` `prompt.tab.prompt` `prompt.tab.mascot` | iOS·낮·밝게·ko, Android·밤·어둡게·ko |
| `S08-brand` | 기존 캐릭터·브랜드 요청 거절 | `prompt.brand.refuse` `prompt.brand.action` `prompt.placeholder` `a11y.input` `a11y.send` `prompt.left` `prompt.idleHint` `a11y.pose.wave_main` `a11y.mascot` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `prompt.title` `prompt.mine` `a11y.presence` `prompt.tab.prompt` `prompt.tab.mascot` | iOS·낮·밝게·ko, Android·밤·어둡게·ko |
| `S08-fail` | 실패 · 재시도 | `prompt.msg.me` `prompt.msg.time` `prompt.fail.title` `prompt.fail.body` `common.retry` `prompt.placeholder` `a11y.input` `a11y.send` `prompt.left` `prompt.idleHint` `a11y.pose.wave_main` `a11y.mascot` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `prompt.title` `prompt.mine` `a11y.presence` `prompt.tab.prompt` `prompt.tab.mascot` | iOS·낮·밝게·ko, Android·밤·어둡게·ko |

## S09 공유 미리 보기 / 적용 확인·취소

- **캔버스 보드**: `S09-preview-confirm`
- **목적**: 두 사람에게 같은 현재 방과 후보를 보여 주고, 점유자만 적용·취소. 현재 방/미리 보기 전환, 유효성 경고(보호 영역 자동 이동, 한도 초과), 세션 만료 직전, 적용 중·성공·취소, 네트워크·모델 오류, 버전 충돌.
- **이동**: S08 → 미리 보기 → 적용(점유 해제 → 방) / 취소(현재 방 유지, 점유 해제).
- 1단계의 "나에게만 보여요"는 폐기: 미리 보기는 공유 대화에 저장되어 **두 사람 모두에게 보여요**(방은 적용 전까지 안 바뀜).
- 적용은 session owner + expected version + idempotency key(서버). 충돌이면 "방이 방금 바뀌었어요".
- **긴 문구·언어 사례**: 만료 직전 안내는 초 단위 변수(`{s}`)를 쓰고 두 줄까지 늘어나요.

| 상태 ID | 설명 | 사용하는 키 | 그린 조합 |
|---|---|---|---|
| `S09-mine` | 점유자 · 미리 보기 + 적용/취소 (공유 미리 보기) | `preview.changes` `preview.changes.list` `preview.shared` `preview.badge` `preview.view.current` `preview.view.candidate` `preview.applyHint` `preview.apply` `preview.cancel` `a11y.pose.wave_main` `a11y.mascot` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `prompt.title` `prompt.mine` `a11y.presence` `prompt.tab.prompt` `prompt.tab.mascot` | iOS·낮·밝게·ko, Android·밤·어둡게·ko, iOS·낮·밝게·en, Android·밤·어둡게·ja 외 4 |
| `S09-toggle` | 점유자 · 현재 방 보기로 전환 | `preview.changes` `preview.changes.list` `preview.shared` `preview.view.current` `preview.view.candidate` `preview.applyHint` `preview.apply` `preview.cancel` `a11y.pose.wave_main` `a11y.mascot` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `prompt.title` `prompt.mine` `a11y.presence` `prompt.tab.prompt` `prompt.tab.mascot` | iOS·낮·밝게·ko, Android·밤·어둡게·ko |
| `S09-partner` | 상대 · 읽기 전용 (적용 버튼 비활성, 점유자 표시) | `preview.changes` `preview.changes.list` `preview.shared` `preview.badge` `preview.view.current` `preview.view.candidate` `sample.partner` `preview.partner.wait` `preview.partner.readonly` `preview.applyHint` `preview.apply` `preview.cancel` `a11y.pose.wave_main` `a11y.mascot` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `prompt.title` `prompt.partner` `a11y.presence` `prompt.tab.prompt` `prompt.tab.mascot` | iOS·낮·밝게·ko, Android·밤·어둡게·ko, iOS·낮·밝게·en, Android·밤·어둡게·ja |
| `S09-warn-protect` | 경고 · 보호 영역을 가린 소품 자동 이동 | `preview.warn.protected` `preview.changes` `preview.changes.list` `preview.badge` `preview.view.current` `preview.view.candidate` `preview.applyHint` `preview.apply` `preview.cancel` `a11y.pose.wave_main` `a11y.mascot` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `prompt.title` `prompt.mine` `a11y.presence` `prompt.tab.prompt` `prompt.tab.mascot` | iOS·낮·밝게·ko, Android·밤·어둡게·ko |
| `S09-warn-limit` | 경고 · 한도 초과, 줄인 제안 | `preview.suggest` `prompt.limit` `preview.changes` `preview.changes.list` `preview.badge` `preview.view.current` `preview.view.candidate` `preview.applyHint` `preview.apply` `preview.cancel` `a11y.pose.wave_main` `a11y.mascot` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `prompt.title` `prompt.mine` `a11y.presence` `prompt.tab.prompt` `prompt.tab.mascot` | iOS·낮·밝게·ko, Android·밤·어둡게·ko |
| `S09-expiring` | 세션 만료 직전 | `preview.expiring` `preview.changes` `preview.changes.list` `preview.badge` `preview.view.current` `preview.view.candidate` `preview.applyHint` `preview.apply` `preview.cancel` `a11y.pose.wave_main` `a11y.mascot` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `prompt.title` `prompt.mine` `a11y.presence` `prompt.tab.prompt` `prompt.tab.mascot` | iOS·낮·밝게·ko, Android·밤·어둡게·ko |
| `S09-applying` | 적용 중 | `preview.changes` `preview.changes.list` `preview.badge` `preview.view.current` `preview.view.candidate` `preview.applyHint` `preview.applying` `preview.cancel` `a11y.pose.wave_main` `a11y.mascot` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `prompt.title` `prompt.mine` `a11y.presence` `prompt.tab.prompt` `prompt.tab.mascot` | iOS·낮·밝게·ko, Android·밤·어둡게·ko |
| `S09-applied` | 적용 완료 (점유 해제) | `preview.applied.title` `preview.applied.body` `sample.me` `prompt.msg.status.applied` `preview.view.current` `preview.view.candidate` `a11y.pose.wave_main` `a11y.mascot` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `prompt.title` `prompt.free` `a11y.presence` `prompt.tab.prompt` `prompt.tab.mascot` | iOS·낮·밝게·ko, Android·밤·어둡게·ko |
| `S09-cancelled` | 취소 (현재 방 유지, 점유 해제) | `prompt.start` `sample.me` `prompt.msg.status.cancelled` `preview.view.current` `preview.view.candidate` `a11y.pose.wave_main` `a11y.mascot` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `prompt.title` `prompt.free` `a11y.presence` `prompt.tab.prompt` `prompt.tab.mascot` `preview.cancel.toast` | iOS·낮·밝게·ko, Android·밤·어둡게·ko |
| `S09-apply-err` | 적용 실패 (네트워크) | `preview.apply.err.title` `preview.apply.err.body` `common.retry` `preview.changes` `preview.changes.list` `preview.badge` `preview.view.current` `preview.view.candidate` `preview.applyHint` `preview.apply` `preview.cancel` `a11y.pose.wave_main` `a11y.mascot` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `prompt.title` `prompt.mine` `a11y.presence` `prompt.tab.prompt` `prompt.tab.mascot` | iOS·낮·밝게·ko, Android·밤·어둡게·ko |
| `S09-model-err` | 모델 오류 (미리 보기 생성 실패) | `prompt.msg.me` `prompt.msg.time` `prompt.fail.title` `preview.model.err` `common.retry` `prompt.placeholder` `a11y.input` `a11y.send` `prompt.left` `prompt.idleHint` `a11y.pose.wave_main` `a11y.mascot` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `prompt.title` `prompt.mine` `a11y.presence` `prompt.tab.prompt` `prompt.tab.mascot` | iOS·낮·밝게·ko, Android·밤·어둡게·ko |
| `S09-conflict` | 버전 충돌 (늦은 중복 적용 · 서버 거부) | `preview.changes` `preview.changes.list` `preview.badge` `preview.view.current` `preview.view.candidate` `preview.applyHint` `preview.apply` `preview.cancel` `a11y.pose.wave_main` `a11y.mascot` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `prompt.title` `prompt.mine` `a11y.presence` `prompt.tab.prompt` `prompt.tab.mascot` `preview.conflict.title` `preview.conflict.body` `common.confirm` | iOS·낮·밝게·ko, Android·밤·어둡게·ko, iOS·낮·밝게·en, Android·밤·어둡게·ja |

## S10 되돌리기 확인

- **캔버스 보드**: `S10-undo`
- **목적**: 직전 적용 전 방으로 복구. 확인, 진행, 성공(점유 해제), 되돌릴 변경 없음, 상대 점유 중, 늦은 중복 요청(서버 충돌), 실패.
- **이동**: 방 도구 막대의 되돌리기 → 다이얼로그 → 방.
- 되돌리기는 점유자만 할 수 있어서 상대가 점유 중이면 이유와 함께 막혀요.
- **긴 문구·언어 사례**: 다이얼로그 본문은 3줄까지 늘어나요.

| 상태 ID | 설명 | 사용하는 키 | 그린 조합 |
|---|---|---|---|
| `S10-confirm` | 되돌리기 확인 | `a11y.pose.wave_main` `a11y.mascot` `a11y.pose.walk` `a11y.pose.cheer` `a11y.pose.lookup` `a11y.pose.lie` `a11y.pose.sleep` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `room.ctl.undo` `room.ctl.decorate` `a11y.tabbar` `tab.home` `a11y.tab` `tab.room` `a11y.tab.sel` `tab.settings` `undo.title` `undo.body` `undo.confirm` `common.cancel` | iOS·낮·밝게·ko, Android·밤·어둡게·ko, iOS·낮·밝게·en, Android·밤·어둡게·ja 외 4 |
| `S10-progress` | 되돌리는 중 | `a11y.pose.wave_main` `a11y.mascot` `a11y.pose.walk` `a11y.pose.cheer` `a11y.pose.lookup` `a11y.pose.lie` `a11y.pose.sleep` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `room.ctl.undo` `room.ctl.decorate` `a11y.tabbar` `tab.home` `a11y.tab` `tab.room` `a11y.tab.sel` `tab.settings` `undo.progress` | iOS·낮·밝게·ko, Android·밤·어둡게·ko |
| `S10-done` | 성공 · 점유 해제 | `a11y.pose.wave_main` `a11y.mascot` `a11y.pose.walk` `a11y.pose.cheer` `a11y.pose.lookup` `a11y.pose.lie` `a11y.pose.sleep` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `room.ctl.undo` `room.ctl.decorate` `a11y.tabbar` `tab.home` `a11y.tab` `tab.room` `a11y.tab.sel` `tab.settings` `undo.done.title` `undo.done.body` | iOS·낮·밝게·ko, Android·밤·어둡게·ko |
| `S10-none` | 되돌릴 변경 없음 | `a11y.pose.wave_main` `a11y.mascot` `a11y.pose.walk` `a11y.pose.cheer` `a11y.pose.lookup` `a11y.pose.lie` `a11y.pose.sleep` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `room.ctl.undo` `room.ctl.decorate` `a11y.tabbar` `tab.home` `a11y.tab` `tab.room` `a11y.tab.sel` `tab.settings` `undo.none.title` `undo.none.body` `common.confirm` | iOS·낮·밝게·ko, Android·밤·어둡게·ko |
| `S10-busy` | 상대가 점유 중 · 되돌릴 수 없음 | `a11y.pose.wave_main` `a11y.mascot` `a11y.pose.walk` `a11y.pose.cheer` `a11y.pose.lookup` `a11y.pose.lie` `a11y.pose.sleep` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `room.ctl.undo` `room.ctl.decorate` `a11y.tabbar` `tab.home` `a11y.tab` `tab.room` `a11y.tab.sel` `tab.settings` `sample.partner` `undo.busy.title` `undo.busy.body` `common.confirm` | iOS·낮·밝게·ko, Android·밤·어둡게·ko, iOS·낮·밝게·en, Android·밤·어둡게·ja |
| `S10-conflict` | 늦은 중복 요청 · 서버 충돌 안전 상태 | `a11y.pose.wave_main` `a11y.mascot` `a11y.pose.walk` `a11y.pose.cheer` `a11y.pose.lookup` `a11y.pose.lie` `a11y.pose.sleep` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `room.ctl.undo` `room.ctl.decorate` `a11y.tabbar` `tab.home` `a11y.tab` `tab.room` `a11y.tab.sel` `tab.settings` `undo.conflict.title` `undo.conflict.body` `common.confirm` | iOS·낮·밝게·ko, Android·밤·어둡게·ko, iOS·낮·밝게·en, Android·밤·어둡게·ja |
| `S10-error` | 되돌리기 실패 | `a11y.pose.wave_main` `a11y.mascot` `a11y.pose.walk` `a11y.pose.cheer` `a11y.pose.lookup` `a11y.pose.lie` `a11y.pose.sleep` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `room.ctl.undo` `room.ctl.decorate` `a11y.tabbar` `tab.home` `a11y.tab` `tab.room` `a11y.tab.sel` `tab.settings` `undo.err.title` `undo.err.body` `common.retry` `common.cancel` | iOS·낮·밝게·ko, Android·밤·어둡게·ko |

## S12 해외 AI 처리 동의

- **캔버스 보드**: `S12-ai-consent`
- **목적**: 전송 정보, 목적, 처리 사업자·국가, 보관·철회, 두 사람이 함께 쓰는 방이라 동의는 사람마다 따로라는 설명. 동의 / 나중에 / 철회 / 철회됨.
- **이동**: 꾸미기 첫 요청 직전(전체 화면 모달). 설정 > AI 처리 동의(푸시)에서 상태 확인·철회.
- 해외 사업자의 보관 기간은 법무 확인 전이라 `[법무 확인 후 입력]` 자리표시를 그대로 뒀어요.
- 나중에 → 방 보기와 D-day는 그대로, 꾸미기만 잠겨요.
- 동의 버튼은 항상 화면 아래에 고정이고 본문만 스크롤돼요.
- **긴 문구·언어 사례**: 본문이 영어·일본어에서 길어져 스크롤 길이가 늘어요. 버튼은 화면에 고정.

| 상태 ID | 설명 | 사용하는 키 | 그린 조합 |
|---|---|---|---|
| `S12-first` | 요청 직전 첫 동의 (상단) | `consent.title` `consent.lead` `consent.sent.label` `consent.sent.body` `consent.purpose.label` `consent.purpose.body` `consent.processor.label` `consent.processor.body` `consent.keep.label` `consent.keep.body` `consent.provider.keep` `consent.couple.label` `consent.couple.body` `consent.agree` `consent.later` | iOS·밝게·ko, Android·어둡게·ko, iOS·밝게·en, Android·어둡게·ja 외 4 |
| `S12-end` | 스크롤 끝 · 동의 버튼은 항상 보임 | `consent.title` `consent.lead` `consent.sent.label` `consent.sent.body` `consent.purpose.label` `consent.purpose.body` `consent.processor.label` `consent.processor.body` `consent.keep.label` `consent.keep.body` `consent.provider.keep` `consent.couple.label` `consent.couple.body` `consent.agree` `consent.later` | iOS·밝게·ko, Android·어둡게·ko, iOS·밝게·ko·200% |
| `S12-later` | 나중에 → 방 보기는 유지 (꾸미기만 잠김) | `a11y.pose.wave_main` `a11y.mascot` `a11y.pose.walk` `a11y.pose.cheer` `a11y.pose.lookup` `a11y.pose.lie` `a11y.pose.sleep` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `room.ctl.undo` `room.ctl.decorate` `a11y.tabbar` `tab.home` `a11y.tab` `tab.room` `a11y.tab.sel` `tab.settings` `consent.later.note` | iOS·낮·밝게·ko, Android·밤·어둡게·ko |
| `S12-status-on` | 설정 · 동의 상태 (동의함) | `set.ai.consent` `consent.status.date` `consent.status.on` `consent.couple.body` `consent.sent.body` `consent.keep.body` `consent.withdraw` | iOS·밝게·ko, Android·어둡게·ko |
| `S12-withdraw` | 철회 확인 | `consent.withdraw.title` `consent.withdraw.body` `consent.withdraw` `common.cancel` `set.ai.consent` `consent.status.date` `consent.status.on` `consent.couple.body` `consent.sent.body` `consent.keep.body` | iOS·밝게·ko, Android·어둡게·ko, iOS·밝게·en, Android·어둡게·ja |
| `S12-withdrawn` | 철회됨 (다시 동의 가능) | `set.ai.consent` `consent.status.off` `consent.couple.body` `consent.sent.body` `consent.keep.body` `consent.agree` `consent.withdraw.done` | iOS·밝게·ko, Android·어둡게·ko |

## S13 설정 탭

- **캔버스 보드**: `S13-settings, S26-tab-settings`
- **목적**: 프로필/로그아웃, 앱 언어(기기 언어 기본), 방 낮·밤 모드와 시간대(두 사람에게 적용), 앱 화면 모드·고대비(이 기기에만), 함께한 날짜, AI 동의, 앱 정보, 약관, 문의·신고, 공간 종료 진입.
- **이동**: 탭 루트(설정). 언어·시간대 → 시트. AI 동의 관리·라이선스·공간 종료·문의·신고 → 푸시(탭 바 숨김).
- 구역 제목으로 **어디에 적용되는지** 구분해요: "방 · 두 사람에게 적용돼요" / "이 기기의 화면 · 이 기기에만 적용돼요".
- "공간 종료"는 고정 컨트롤이 아니라 설정 안 위험 구역 한 줄(확인 단계 필수). 이는 스펙 FR-027 문구와 달라요(handoff.md).
- 방 낮·밤·시간대는 공유 설정이라 오프라인에서는 잠겨요. 이 기기의 화면 설정은 오프라인에서도 바꿀 수 있어요.
- **긴 문구·언어 사례**: 구역 제목이 영어·일본어에서 길어져 두 줄이 돼요.

| 상태 ID | 설명 | 사용하는 키 | 그린 조합 |
|---|---|---|---|
| `S13-loading` | 로딩 | `set.title` `set.loading` `a11y.tabbar` `tab.home` `a11y.tab` `tab.room` `tab.settings` `a11y.tab.sel` | iOS·밝게·ko, Android·어둡게·ko |
| `S13-top` | 계정 · 공간 · 방 (낮·밤 모드는 두 사람에게 적용) | `set.title` `set.name.value` `set.login.kakao` `set.together` `set.together.value` `set.cover` `set.cover.on` `set.room.mode` `set.room.mode.auto` `set.room.mode.day` `set.room.mode.night` `set.room.mode.help` `set.room.now` `set.room.tz` `set.room.tz.value` `set.lang` `set.theme` `set.theme.system` `set.theme.light` `set.theme.dark` `set.hc` `set.hc.help` `a11y.off` `a11y.switch` `set.ai.consent` `consent.status.on` `set.sec.info` `set.about.version` `set.about.licenses` `set.terms` `set.privacy` `set.support` `set.logout` `set.end` `set.end.help` `set.sec.couple` `set.sec.room` `a11y.tabbar` `tab.home` `a11y.tab` `tab.room` `tab.settings` `a11y.tab.sel` | iOS·낮·밝게·ko, Android·밤·어둡게·ko, iOS·낮·밝게·en, Android·밤·어둡게·ja 외 2 |
| `S13-bottom` | 이 기기 화면 · 언어 · 모드 · 고대비 · 앱 정보 · 공간 종료 | `set.title` `set.name.value` `set.login.kakao` `set.together` `set.together.value` `set.cover` `set.cover.on` `set.room.mode` `set.room.mode.auto` `set.room.mode.day` `set.room.mode.night` `set.room.mode.help` `set.room.now` `set.room.tz` `set.room.tz.value` `set.lang` `set.theme` `set.theme.system` `set.theme.light` `set.theme.dark` `set.hc` `set.hc.help` `a11y.off` `a11y.switch` `set.ai.consent` `consent.status.on` `set.sec.info` `set.about.version` `set.about.licenses` `set.terms` `set.privacy` `set.support` `set.logout` `set.end` `set.end.help` `set.sec.app` `set.sec.ai` `set.sec.danger` `a11y.tabbar` `tab.home` `a11y.tab` `tab.room` `tab.settings` `a11y.tab.sel` | iOS·낮·밝게·ko, Android·밤·어둡게·ko, iOS·낮·밝게·en, Android·밤·어둡게·ja 외 3 |
| `S13-cover-sheet` | 홈 배경 사진 행 → 바꾸기 시트 | `set.title` `set.name.value` `set.login.kakao` `set.together` `set.together.value` `set.cover` `set.cover.on` `set.room.mode` `set.room.mode.auto` `set.room.mode.day` `set.room.mode.night` `set.room.mode.help` `set.room.now` `set.room.tz` `set.room.tz.value` `set.lang` `set.theme` `set.theme.system` `set.theme.light` `set.theme.dark` `set.hc` `set.hc.help` `a11y.off` `a11y.switch` `set.ai.consent` `consent.status.on` `set.sec.info` `set.about.version` `set.about.licenses` `set.terms` `set.privacy` `set.support` `set.logout` `set.end` `set.end.help` `set.sec.couple` `set.sec.room` `a11y.tabbar` `tab.home` `a11y.tab` `tab.room` `tab.settings` `a11y.tab.sel` `cover.sheet.title` `cover.sheet.pick` `cover.sheet.remove` `cover.sheet.note` `common.cancel` | iOS·낮·밝게·ko, Android·밤·어둡게·ko |
| `S13-room-night` | 방 모드 = 밤 선택 | `set.title` `set.name.value` `set.login.kakao` `set.together` `set.together.value` `set.cover` `set.cover.on` `set.room.mode` `set.room.mode.auto` `set.room.mode.day` `set.room.mode.night` `set.room.mode.help` `set.room.now` `set.room.tz` `set.room.tz.value` `set.lang` `set.theme` `set.theme.system` `set.theme.light` `set.theme.dark` `set.hc` `set.hc.help` `a11y.off` `a11y.switch` `set.ai.consent` `consent.status.on` `set.sec.info` `set.about.version` `set.about.licenses` `set.terms` `set.privacy` `set.support` `set.logout` `set.end` `set.end.help` `set.sec.couple` `set.sec.room` `a11y.tabbar` `tab.home` `a11y.tab` `tab.room` `tab.settings` `a11y.tab.sel` | iOS·낮·밝게·ko, Android·밤·어둡게·ko |
| `S13-hc-on` | 고대비 켬 (글자·컨트롤만 강화) | `set.title` `set.name.value` `set.login.kakao` `set.together` `set.together.value` `set.cover` `set.cover.on` `set.room.mode` `set.room.mode.auto` `set.room.mode.day` `set.room.mode.night` `set.room.mode.help` `set.room.now` `set.room.tz` `set.room.tz.value` `set.lang` `set.theme` `set.theme.system` `set.theme.light` `set.theme.dark` `set.hc` `set.hc.help` `a11y.on` `a11y.switch` `set.ai.consent` `consent.status.on` `set.sec.info` `set.about.version` `set.about.licenses` `set.terms` `set.privacy` `set.support` `set.logout` `set.end` `set.end.help` `set.sec.app` `set.sec.ai` `set.sec.danger` `a11y.tabbar` `tab.home` `a11y.tab` `tab.room` `tab.settings` `a11y.tab.sel` | iOS·낮·밝게·ko·고대비, Android·밤·어둡게·ko·고대비 |
| `S13-lang` | 언어 선택 시트 | `set.title` `set.name.value` `set.login.kakao` `set.together` `set.together.value` `set.cover` `set.cover.on` `set.room.mode` `set.room.mode.auto` `set.room.mode.day` `set.room.mode.night` `set.room.mode.help` `set.room.now` `set.room.tz` `set.room.tz.value` `set.lang` `set.theme` `set.theme.system` `set.theme.light` `set.theme.dark` `set.hc` `set.hc.help` `a11y.off` `a11y.switch` `set.ai.consent` `consent.status.on` `set.sec.info` `set.about.version` `set.about.licenses` `set.terms` `set.privacy` `set.support` `set.logout` `set.end` `set.end.help` `set.sec.app` `set.sec.ai` `set.sec.danger` `a11y.tabbar` `tab.home` `a11y.tab` `tab.room` `tab.settings` `a11y.tab.sel` `set.lang.sheet` `set.lang.system` `set.lang.note` | iOS·밝게·ko, Android·어둡게·ko, iOS·밝게·en, Android·어둡게·ja |
| `S13-tz` | 시간대 선택 시트 | `set.title` `set.name.value` `set.login.kakao` `set.together` `set.together.value` `set.cover` `set.cover.on` `set.room.mode` `set.room.mode.auto` `set.room.mode.day` `set.room.mode.night` `set.room.mode.help` `set.room.now` `set.room.tz` `set.room.tz.value` `set.lang` `set.theme` `set.theme.system` `set.theme.light` `set.theme.dark` `set.hc` `set.hc.help` `a11y.off` `a11y.switch` `set.ai.consent` `consent.status.on` `set.sec.info` `set.about.version` `set.about.licenses` `set.terms` `set.privacy` `set.support` `set.logout` `set.end` `set.end.help` `set.sec.couple` `set.sec.room` `a11y.tabbar` `tab.home` `a11y.tab` `tab.room` `tab.settings` `a11y.tab.sel` `set.room.tz.pick` `set.room.tz.search` `set.room.tz.tokyo` `set.room.tz.la` `set.room.tz.ny` `set.room.tz.london` | iOS·낮·밝게·ko, Android·밤·어둡게·ko |
| `S13-theme-dark` | 화면 모드 = 어둡게 선택 | `set.title` `set.name.value` `set.login.kakao` `set.together` `set.together.value` `set.cover` `set.cover.on` `set.room.mode` `set.room.mode.auto` `set.room.mode.day` `set.room.mode.night` `set.room.mode.help` `set.room.now` `set.room.tz` `set.room.tz.value` `set.lang` `set.theme` `set.theme.system` `set.theme.light` `set.theme.dark` `set.hc` `set.hc.help` `a11y.off` `a11y.switch` `set.ai.consent` `consent.status.on` `set.sec.info` `set.about.version` `set.about.licenses` `set.terms` `set.privacy` `set.support` `set.logout` `set.end` `set.end.help` `set.sec.app` `set.sec.ai` `set.sec.danger` `a11y.tabbar` `tab.home` `a11y.tab` `tab.room` `tab.settings` `a11y.tab.sel` | iOS·낮·밝게·ko, Android·밤·어둡게·ko |
| `S13-logout` | 로그아웃 확인 | `set.title` `set.name.value` `set.login.kakao` `set.together` `set.together.value` `set.cover` `set.cover.on` `set.room.mode` `set.room.mode.auto` `set.room.mode.day` `set.room.mode.night` `set.room.mode.help` `set.room.now` `set.room.tz` `set.room.tz.value` `set.lang` `set.theme` `set.theme.system` `set.theme.light` `set.theme.dark` `set.hc` `set.hc.help` `a11y.off` `a11y.switch` `set.ai.consent` `consent.status.on` `set.sec.info` `set.about.version` `set.about.licenses` `set.terms` `set.privacy` `set.support` `set.logout` `set.end` `set.end.help` `set.sec.app` `set.sec.ai` `set.sec.danger` `a11y.tabbar` `tab.home` `a11y.tab` `tab.room` `tab.settings` `a11y.tab.sel` `set.logout.title` `set.logout.body` `common.cancel` | iOS·밝게·ko, Android·어둡게·ko |
| `S13-error` | 불러오기 오류 | `set.title` `set.err.title` `set.err.body` `common.retry` `a11y.tabbar` `tab.home` `a11y.tab` `tab.room` `tab.settings` `a11y.tab.sel` | iOS·밝게·ko, Android·어둡게·ko |

## S14 공간 종료 / 30일 복구

- **캔버스 보드**: `S14-end-space`
- **목적**: 결과·날짜를 또렷하게 쓴 확인(체크 후에만 활성), 진행, 종료 직후 복구 기한과 남은 일수, 복구 확인·성공·실패, 30일 만료·삭제 완료, 상대가 종료한 경우.
- **이동**: 설정 > 공간 종료(푸시) → 확인 → 종료 완료 화면(탭 구조 대신). 복구 → 홈. 만료 → S03.
- 날짜는 종료 시점 + 30일을 언어 관례로(예 2026년 11월 23일).
- "잘못 누른 느낌"을 줄이지 않도록 결과 세 줄 + 체크박스 + 빨간 버튼.
- **긴 문구·언어 사례**: 결과 설명이 일본어에서 4줄까지 늘어나요.

| 상태 ID | 설명 | 사용하는 키 | 그린 조합 |
|---|---|---|---|
| `S14-entry` | 설정의 공간 종료 진입 (확인 단계 앞) | `set.title` `set.name.value` `set.login.kakao` `set.together` `set.together.value` `set.cover` `set.cover.on` `set.room.mode` `set.room.mode.auto` `set.room.mode.day` `set.room.mode.night` `set.room.mode.help` `set.room.now` `set.room.tz` `set.room.tz.value` `set.lang` `set.theme` `set.theme.system` `set.theme.light` `set.theme.dark` `set.hc` `set.hc.help` `a11y.off` `a11y.switch` `set.ai.consent` `consent.status.on` `set.sec.info` `set.about.version` `set.about.licenses` `set.terms` `set.privacy` `set.support` `set.logout` `set.end` `set.end.help` `set.sec.app` `set.sec.ai` `set.sec.danger` `a11y.tabbar` `tab.home` `a11y.tab` `tab.room` `tab.settings` `a11y.tab.sel` | iOS·낮·밝게·ko, Android·밤·어둡게·ko |
| `S14-confirm` | 종료 확인 · 결과와 날짜 명시 (체크 전) | `end.date` `end.title` `end.body` `end.b1` `end.b2` `end.b3` `end.check` `end.confirm` `end.cancel` | iOS·밝게·ko, Android·어둡게·ko, iOS·밝게·en, Android·어둡게·ja 외 4 |
| `S14-checked` | 확인 체크 후 활성 | `end.date` `end.title` `end.body` `end.b1` `end.b2` `end.b3` `end.check` `end.confirm` `end.cancel` | iOS·밝게·ko, Android·어둡게·ko |
| `S14-progress` | 종료 중 | `end.date` `end.title` `end.body` `end.b1` `end.b2` `end.b3` `end.check` `end.confirm` `end.cancel` | iOS·밝게·ko, Android·어둡게·ko |
| `S14-done` | 종료 직후 · 복구 기한과 남은 일수 | `end.done.title` `end.date` `end.done.body` `end.left` `end.restore` | iOS·밝게·ko, Android·어둡게·ko, iOS·밝게·en, Android·어둡게·ja 외 1 |
| `S14-partner` | 상대가 종료한 경우 (내 화면) | `sample.partner` `end.byPartner` `end.done.title` `end.date` `end.done.body` `end.left` `end.restore` | iOS·밝게·ko, Android·어둡게·ko |
| `S14-restore-confirm` | 복구 확인 | `end.done.title` `end.date` `end.done.body` `end.left` `end.restore` `end.restore.title` `end.restore.body` `common.cancel` | iOS·밝게·ko, Android·어둡게·ko |
| `S14-restore-progress` | 복구 중 | `end.restore.progress` `end.done.title` `end.date` `end.done.body` `end.left` | iOS·밝게·ko, Android·어둡게·ko |
| `S14-restore-ok` | 복구 성공 | `end.restore.done` `tab.home` | iOS·밝게·ko, Android·어둡게·ko |
| `S14-restore-fail` | 복구 실패 · 기한 재안내 | `end.done.title` `end.date` `end.done.body` `end.left` `end.restore` `end.restore.fail.title` `end.restore.fail.body` `common.retry` `common.close` | iOS·밝게·ko, Android·어둡게·ko |
| `S14-expired` | 30일 만료 · 삭제 완료 | `end.expired.title` `end.expired.body` `end.expired.action` | iOS·밝게·ko, Android·어둡게·ko, iOS·밝게·en, Android·어둡게·ja |
| `S14-error` | 종료 실패 | `end.date` `end.title` `end.body` `end.b1` `end.b2` `end.b3` `end.check` `end.confirm` `end.cancel` `end.err.title` `end.err.body` `common.retry` `common.close` | iOS·밝게·ko, Android·어둡게·ko |

## S15 신고 / 차단

- **캔버스 보드**: `S15-report-block`
- **목적**: 대상(상대·공유 문구·방 장면) 선택, 사유, 자세한 내용(선택), 제출 성공·실패, 차단 확인과 결과, 지원 연락처.
- **이동**: 설정 > 문의·신고(푸시), 대화 메시지의 ⋯ > 이 메시지 신고(시트).
- 지원 연락처는 `[지원 이메일]` 자리표시예요.
- 차단은 "상대는 방·대화를 볼 수 없고 공간이 종료(30일 복구)"로 제안했어요(열린 질문).
- **긴 문구·언어 사례**: 사유 문구가 길어져도 한 줄에 라디오와 함께 줄바꿈돼요.

| 상태 ID | 설명 | 사용하는 키 | 그린 조합 |
|---|---|---|---|
| `S15-entry` | 진입 · 설정의 문의·신고 → 신고 대상 고르기 | `report.title` `report.target.partner` `report.target.text` `report.target.scene` `report.what` `sample.partner` `report.block` `report.contact` | iOS·밝게·ko, Android·어둡게·ko, iOS·밝게·en, Android·어둡게·ja 외 4 |
| `S15-msg-menu` | 진입 · 대화 메시지에서 신고 | `sample.partner` `prompt.msg.partner` `prompt.msg.time` `prompt.input.partner` `a11y.input.ro` `a11y.send` `a11y.pose.wave_main` `a11y.mascot` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `prompt.title` `prompt.partner` `a11y.presence` `prompt.tab.prompt` `prompt.tab.mascot` `report.msg.menu` `report.msg.menu.cancel` | iOS·낮·밝게·ko, Android·밤·어둡게·ko |
| `S15-reason` | 사유 선택 | `report.title` `report.target.partner` `report.target.text` `report.target.scene` `report.what` `report.why` `report.reason.harass` `report.reason.inappropriate` `report.reason.privacy` `report.reason.other` `report.submit` | iOS·밝게·ko, Android·어둡게·ko |
| `S15-detail` | 자세한 내용 입력 (선택) | `report.title` `report.target.partner` `report.target.text` `report.target.scene` `report.what` `report.why` `report.reason.harass` `report.reason.inappropriate` `report.reason.privacy` `report.reason.other` `report.detail` `report.detail.placeholder` `report.submit` | iOS·밝게·ko, Android·어둡게·ko |
| `S15-sending` | 제출 중 | `report.title` `report.target.partner` `report.target.text` `report.target.scene` `report.what` `report.why` `report.reason.harass` `report.reason.inappropriate` `report.reason.privacy` `report.reason.other` `report.sending` | iOS·밝게·ko, Android·어둡게·ko |
| `S15-done` | 제출 성공 · 지원 연락처 | `report.done.title` `report.done.body` `report.contact` `common.done` | iOS·밝게·ko, Android·어둡게·ko |
| `S15-fail` | 제출 실패 (입력 유지) | `report.title` `report.target.partner` `report.target.text` `report.target.scene` `report.what` `report.why` `report.reason.harass` `report.reason.inappropriate` `report.reason.privacy` `report.reason.other` `report.fail.title` `report.fail.body` `common.retry` `report.submit` | iOS·밝게·ko, Android·어둡게·ko |
| `S15-block` | 차단 확인 · 결과 설명 | `report.title` `report.target.partner` `report.target.text` `report.target.scene` `report.what` `sample.partner` `report.block` `report.block.title` `end.date` `report.block.body` `report.block.confirm` `common.cancel` | iOS·밝게·ko, Android·어둡게·ko, iOS·밝게·en, Android·어둡게·ja |
| `S15-blocked` | 차단 후 결과 (공간 종료 상태) | `end.done.title` `end.date` `end.done.body` `end.left` `end.restore` | iOS·밝게·ko, Android·어둡게·ko |

## S16 공통 오류 · 빈 · 로딩 · 오프라인

- **캔버스 보드**: `S16-system-states`
- **목적**: 서버·AI 일시 장애, 로그인 만료, 접근 거부, 인터넷 끊김, 요청 한도, 구버전 장면, 삭제된 에셋, 동기화 대기, 로딩, 빈 상태.
- **이동**: 발생 지점에 따라 전체 화면 또는 배너. 앱은 마지막 확정 방·D-day를 보여 주고 오프라인 편집이나 미리 보기 적용은 하지 않아요.
- 오류는 항상 "무엇이 그대로인지"를 먼저 말해요(예: 방은 그대로예요).
- **긴 문구·언어 사례**: 오류 제목이 일본어에서 길어져도 가운데 정렬 두 줄.

| 상태 ID | 설명 | 사용하는 키 | 그린 조합 |
|---|---|---|---|
| `S16-server` | 서버·AI 일시 장애 (서버) | `sys.server.title` `sys.server.body` `sys.retry` `common.close` | iOS·밝게·ko, Android·어둡게·ko, iOS·밝게·en, Android·어둡게·ja 외 4 |
| `S16-ai` | AI 처리 일시 중단 (꾸미기만) | `sys.ai.title` `sys.ai.body` `sys.retry` `prompt.offline` `a11y.input` `a11y.send` `a11y.pose.wave_main` `a11y.mascot` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `prompt.title` `prompt.mine` `a11y.presence` `prompt.tab.prompt` `prompt.tab.mascot` | iOS·낮·밝게·ko, Android·밤·어둡게·ko |
| `S16-login` | 로그인 만료 | `sys.login.title` `sys.login.body` `sys.login.action` | iOS·밝게·ko, Android·어둡게·ko |
| `S16-denied` | 접근 거부 (구성원 아님·종료) | `sys.denied.title` `sys.denied.body` `join.haveCode` `join.createSpace` | iOS·밝게·ko, Android·어둡게·ko |
| `S16-offline` | 인터넷 끊김 · 메인 마지막 상태 | `main.offline.title` `main.offline.body` `dday.eyebrow` `a11y.dday` `dday.count` `date.since` `sample.partner` `main.chip.both` `main.appName` `a11y.cover.add` `cover.add` `a11y.pose.wave_main` `a11y.mascot` `main.roomCard.title` `main.roomCard.day` `main.openRoom` `main.editDate` `a11y.tabbar` `tab.home` `a11y.tab.sel` `a11y.tab` `tab.room` `tab.settings` | iOS·밝게·ko, Android·어둡게·ko |
| `S16-quota` | 요청 한도 (하루 10회) | `sys.quota.title` `prompt.quota.body` `prompt.quota.title` `a11y.input` `a11y.send` `a11y.pose.wave_main` `a11y.mascot` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `prompt.title` `prompt.mine` `a11y.presence` `prompt.tab.prompt` `prompt.tab.mascot` | iOS·낮·밝게·ko, Android·밤·어둡게·ko |
| `S16-old-scene` | 구버전 장면 (읽을 수 있는 부분만) | `sys.old.title` `sys.old.body` `sys.old.action` `a11y.pose.wave_main` `a11y.mascot` `a11y.pose.walk` `a11y.pose.cheer` `a11y.pose.lookup` `a11y.pose.lie` `a11y.pose.sleep` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `room.ctl.undo` `room.ctl.decorate` `a11y.tabbar` `tab.home` `a11y.tab` `tab.room` `a11y.tab.sel` `tab.settings` | iOS·낮·밝게·ko, Android·밤·어둡게·ko, iOS·낮·밝게·en, Android·밤·어둡게·ja |
| `S16-asset` | 삭제된·누락된 에셋 (빈 자리 유지) | `sys.asset.title` `sys.asset.body` `a11y.pose.wave_main` `a11y.mascot` `a11y.pose.walk` `a11y.pose.cheer` `a11y.pose.lookup` `a11y.pose.lie` `a11y.pose.sleep` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `room.ctl.undo` `room.ctl.decorate` `a11y.tabbar` `tab.home` `a11y.tab` `tab.room` `a11y.tab.sel` `tab.settings` | iOS·낮·밝게·ko, Android·밤·어둡게·ko, iOS·낮·밝게·en, Android·밤·어둡게·ja |
| `S16-pending` | 데이터 동기화 대기 | `sys.pending.title` `sys.pending.body` `a11y.pose.wave_main` `a11y.mascot` `a11y.pose.walk` `a11y.pose.cheer` `a11y.pose.lookup` `a11y.pose.lie` `a11y.pose.sleep` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `room.ctl.undo` `room.ctl.decorate` `a11y.tabbar` `tab.home` `a11y.tab` `tab.room` `a11y.tab.sel` `tab.settings` | iOS·낮·밝게·ko, Android·밤·어둡게·ko |
| `S16-loading-main` | 로딩 · 메인 스켈레톤 | `main.loading` `main.appName` `main.openRoom` `a11y.tabbar` `tab.home` `a11y.tab.sel` `a11y.tab` `tab.room` `tab.settings` | iOS·밝게·ko, Android·어둡게·ko |
| `S16-empty` | 빈 상태 (공통 빈 화면) | `sys.empty.title` `sys.empty.body` `common.close` | iOS·밝게·ko, Android·어둡게·ko |

## 탭 단위 보기 (S23 · S24 · S26)

탭마다 루트 화면의 **첫 실행 · 비어 있음 · 보통 · 로딩 · 오프라인 · 오류**(방은 **상대가 꾸미는 중**)와 한국어·영어·일본어 긴 문구, 푸시·시트·모달로 이어지는 화면을 한 보드에 모았어요. 상태 ID는 `S23-first`처럼 탭 번호로 시작해요.

### S23

| 상태 ID | 설명 | 사용하는 키 |
|---|---|---|
| `S23-first` | 홈 · 첫 실행(공간을 만든 직후) + 방 탭 안내 | `dday.eyebrow` `a11y.dday` `dday.count` `date.since` `main.appName` `a11y.cover.add` `cover.add` `main.invitePending.title` `main.invitePending.body` `main.invitePending.action` `a11y.pose.wave_main` `a11y.mascot` `main.roomCard.title` `main.roomCard.day` `main.openRoom` `a11y.tabbar` `tab.home` `a11y.tab.sel` `a11y.tab` `tab.room` `tab.settings` `coach.home` `a11y.coach` `coach.ok` `main.editDate` |
| `S23-empty` | 홈 · 비어 있음(날짜 미설정) | `main.noDate.title` `main.noDate.body` `main.appName` `a11y.cover.add` `cover.add` `main.noDate.action` `a11y.tabbar` `tab.home` `a11y.tab.sel` `a11y.tab` `tab.room` `tab.settings` |
| `S23-normal` | 홈 · 보통(두 사람 참여) | `dday.eyebrow` `a11y.dday` `dday.count` `date.since` `sample.partner` `main.chip.both` `main.appName` `a11y.cover.add` `cover.add` `a11y.pose.wave_main` `a11y.mascot` `main.roomCard.title` `main.roomCard.day` `main.openRoom` `main.editDate` `a11y.tabbar` `tab.home` `a11y.tab.sel` `a11y.tab` `tab.room` `tab.settings` |
| `S23-photo` | 홈 · 배경 사진 있음 | `dday.eyebrow` `a11y.dday` `dday.count` `date.since` `sample.partner` `main.chip.both` `a11y.cover.photo` `main.appName` `a11y.cover.change` `a11y.pose.wave_main` `a11y.mascot` `main.roomCard.title` `main.roomCard.day` `main.openRoom` `main.editDate` `a11y.tabbar` `tab.home` `a11y.tab.sel` `a11y.tab` `tab.room` `tab.settings` |
| `S23-pending` | 홈 · 상대 초대 미완료 | `dday.eyebrow` `a11y.dday` `dday.count` `date.since` `main.appName` `a11y.cover.add` `cover.add` `main.invitePending.title` `main.invitePending.body` `main.invitePending.action` `a11y.pose.wave_main` `a11y.mascot` `main.roomCard.title` `main.roomCard.day` `main.openRoom` `main.editDate` `a11y.tabbar` `tab.home` `a11y.tab.sel` `a11y.tab` `tab.room` `tab.settings` |
| `S23-sheet-photo` | 홈 → 배경 사진 바꾸기(시트 · 탭 바 위로 올라옴) | `dday.eyebrow` `a11y.dday` `dday.count` `date.since` `sample.partner` `main.chip.both` `a11y.cover.photo` `main.appName` `a11y.cover.change` `a11y.pose.wave_main` `a11y.mascot` `main.roomCard.title` `main.roomCard.day` `main.openRoom` `main.editDate` `a11y.tabbar` `tab.home` `a11y.tab.sel` `a11y.tab` `tab.room` `tab.settings` `cover.sheet.title` `cover.sheet.pick` `cover.sheet.remove` `cover.sheet.note` `common.cancel` |
| `S23-loading` | 홈 · 로딩 | `main.loading` `main.appName` `main.openRoom` `a11y.tabbar` `tab.home` `a11y.tab.sel` `a11y.tab` `tab.room` `tab.settings` |
| `S23-offline` | 홈 · 오프라인(마지막 상태) | `main.offline.title` `main.offline.body` `dday.eyebrow` `a11y.dday` `dday.count` `date.since` `sample.partner` `main.chip.both` `main.appName` `a11y.cover.add` `cover.add` `a11y.pose.wave_main` `a11y.mascot` `main.roomCard.title` `main.roomCard.day` `main.openRoom` `main.editDate` `a11y.tabbar` `tab.home` `a11y.tab.sel` `a11y.tab` `tab.room` `tab.settings` |
| `S23-error` | 홈 · 동기화 오류 | `main.sync.title` `main.sync.body` `common.retry` `dday.eyebrow` `a11y.dday` `dday.count` `date.since` `sample.partner` `main.chip.both` `main.appName` `a11y.cover.add` `cover.add` `a11y.pose.wave_main` `a11y.mascot` `main.roomCard.title` `main.roomCard.day` `main.openRoom` `main.editDate` `a11y.tabbar` `tab.home` `a11y.tab.sel` `a11y.tab` `tab.room` `tab.settings` |
| `S23-push-invite` | 홈 → 초대 코드 보기(푸시 · 탭 바 숨김) | `invite.expires` `invite.expiresAt.sample` `invite.expiresAt` `invite.title` `invite.body` `invite.code.label` `a11y.code` `invite.reissue` `invite.share` `invite.copy` |
| `S23-sheet-date` | 홈 → 날짜 수정(시트 · 탭 바 위로 올라옴) | `dday.eyebrow` `a11y.dday` `dday.count` `date.since` `sample.partner` `main.chip.both` `main.appName` `a11y.cover.add` `cover.add` `a11y.pose.wave_main` `a11y.mascot` `main.roomCard.title` `main.roomCard.day` `main.openRoom` `main.editDate` `a11y.tabbar` `tab.home` `a11y.tab.sel` `a11y.tab` `tab.room` `tab.settings` `main.editSheet.title` `main.editSheet.body` `common.save` |

### S24

| 상태 ID | 설명 | 사용하는 키 |
|---|---|---|
| `S24-first` | 방 · 첫 실행(마스코트만) + 꾸미기 안내 | `coach.room` `coach.ok` `a11y.pose.wave_main` `a11y.mascot` `a11y.pose.walk` `a11y.pose.cheer` `a11y.pose.lookup` `a11y.pose.lie` `a11y.pose.sleep` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `room.ctl.undo` `room.ctl.decorate` `a11y.tabbar` `tab.home` `a11y.tab` `tab.room` `a11y.tab.sel` `tab.settings` |
| `S24-empty` | 방 · 비어 있음(새 방 그대로) | `a11y.pose.wave_main` `a11y.mascot` `a11y.pose.walk` `a11y.pose.cheer` `a11y.pose.lookup` `a11y.pose.lie` `a11y.pose.sleep` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `room.ctl.undo` `room.ctl.decorate` `a11y.tabbar` `tab.home` `a11y.tab` `tab.room` `a11y.tab.sel` `tab.settings` |
| `S24-normal` | 방 · 보통(꾸민 방) | `a11y.pose.wave_main` `a11y.mascot` `a11y.pose.walk` `a11y.pose.cheer` `a11y.pose.lookup` `a11y.pose.lie` `a11y.pose.sleep` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `room.ctl.undo` `room.ctl.decorate` `a11y.tabbar` `tab.home` `a11y.tab` `tab.room` `a11y.tab.sel` `tab.settings` |
| `S24-partner` | 방 · 상대가 꾸미는 중(실시간 읽기 전용 · 되돌리기 잠김) | `sample.partner` `room.partnerLive` `a11y.pose.wave_main` `a11y.mascot` `a11y.pose.walk` `a11y.pose.cheer` `a11y.pose.lookup` `a11y.pose.lie` `a11y.pose.sleep` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `room.ctl.undo` `room.watch` `a11y.tabbar` `tab.home` `a11y.tab` `tab.room` `a11y.tab.sel` `tab.settings` |
| `S24-loading` | 방 · 로딩 | `room.loading` `room.ctl.undo` `room.ctl.decorate` `a11y.tabbar` `tab.home` `a11y.tab` `tab.room` `a11y.tab.sel` `tab.settings` |
| `S24-offline` | 방 · 오프라인 읽기 전용 | `room.offline` `a11y.pose.wave_main` `a11y.mascot` `a11y.pose.walk` `a11y.pose.cheer` `a11y.pose.lookup` `a11y.pose.lie` `a11y.pose.sleep` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `room.ctl.undo` `room.ctl.decorate` `a11y.tabbar` `tab.home` `a11y.tab` `tab.room` `a11y.tab.sel` `tab.settings` |
| `S24-error` | 방 · 동기화 실패 / 장면 복구 오류 | `room.syncFail.title` `room.syncFail.body` `common.retry` `a11y.pose.wave_main` `a11y.mascot` `a11y.pose.walk` `a11y.pose.cheer` `a11y.pose.lookup` `a11y.pose.lie` `a11y.pose.sleep` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `room.ctl.undo` `room.ctl.decorate` `a11y.tabbar` `tab.home` `a11y.tab` `tab.room` `a11y.tab.sel` `tab.settings` |
| `S24-modal-decorate` | 방 → 꾸미기(모달 시트 · 탭 바를 덮음) | `prompt.msg.me` `prompt.msg.time` `prompt.msg.result` `prompt.placeholder` `a11y.input` `a11y.send` `prompt.left` `prompt.idleHint` `a11y.pose.wave_main` `a11y.mascot` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `prompt.title` `prompt.mine` `a11y.presence` `prompt.tab.prompt` `prompt.tab.mascot` |

### S26

| 상태 ID | 설명 | 사용하는 키 |
|---|---|---|
| `S26-first` | 설정 · 첫 실행(AI 동의 전 · 언어는 기기 설정) | `set.title` `set.name.value` `set.login.kakao` `set.together` `set.together.value` `set.cover` `set.cover.on` `set.room.mode` `set.room.mode.auto` `set.room.mode.day` `set.room.mode.night` `set.room.mode.help` `set.room.now` `set.room.tz` `set.room.tz.value` `set.lang` `set.theme` `set.theme.system` `set.theme.light` `set.theme.dark` `set.hc` `set.hc.help` `a11y.off` `a11y.switch` `set.ai.consent` `consent.status.on` `set.sec.info` `set.about.version` `set.about.licenses` `set.terms` `set.privacy` `set.support` `set.logout` `set.end` `set.end.help` `set.sec.app` `set.sec.ai` `set.sec.danger` `a11y.tabbar` `tab.home` `a11y.tab` `tab.room` `tab.settings` `a11y.tab.sel` `consent.status.off` |
| `S26-normal` | 설정 · 보통(위) | `set.title` `set.name.value` `set.login.kakao` `set.together` `set.together.value` `set.cover` `set.cover.on` `set.room.mode` `set.room.mode.auto` `set.room.mode.day` `set.room.mode.night` `set.room.mode.help` `set.room.now` `set.room.tz` `set.room.tz.value` `set.lang` `set.theme` `set.theme.system` `set.theme.light` `set.theme.dark` `set.hc` `set.hc.help` `a11y.off` `a11y.switch` `set.ai.consent` `consent.status.on` `set.sec.info` `set.about.version` `set.about.licenses` `set.terms` `set.privacy` `set.support` `set.logout` `set.end` `set.end.help` `set.sec.couple` `set.sec.room` `a11y.tabbar` `tab.home` `a11y.tab` `tab.room` `tab.settings` `a11y.tab.sel` |
| `S26-normal2` | 설정 · 보통(아래) | `set.title` `set.name.value` `set.login.kakao` `set.together` `set.together.value` `set.cover` `set.cover.on` `set.room.mode` `set.room.mode.auto` `set.room.mode.day` `set.room.mode.night` `set.room.mode.help` `set.room.now` `set.room.tz` `set.room.tz.value` `set.lang` `set.theme` `set.theme.system` `set.theme.light` `set.theme.dark` `set.hc` `set.hc.help` `a11y.off` `a11y.switch` `set.ai.consent` `consent.status.on` `set.sec.info` `set.about.version` `set.about.licenses` `set.terms` `set.privacy` `set.support` `set.logout` `set.end` `set.end.help` `set.sec.app` `set.sec.ai` `set.sec.danger` `a11y.tabbar` `tab.home` `a11y.tab` `tab.room` `tab.settings` `a11y.tab.sel` |
| `S26-loading` | 설정 · 로딩 | `set.title` `set.loading` `a11y.tabbar` `tab.home` `a11y.tab` `tab.room` `tab.settings` `a11y.tab.sel` |
| `S26-offline` | 설정 · 오프라인(방 설정은 잠김) | `set.title` `set.offline.title` `set.offline.body` `set.name.value` `set.login.kakao` `set.together` `set.together.value` `set.cover` `set.cover.on` `set.room.mode` `set.room.mode.auto` `set.room.mode.day` `set.room.mode.night` `set.room.mode.help` `set.room.now` `set.room.tz` `set.room.tz.value` `set.lang` `set.theme` `set.theme.system` `set.theme.light` `set.theme.dark` `set.hc` `set.hc.help` `a11y.off` `a11y.switch` `set.ai.consent` `consent.status.on` `set.sec.info` `set.about.version` `set.about.licenses` `set.terms` `set.privacy` `set.support` `set.logout` `set.end` `set.end.help` `set.sec.couple` `set.sec.room` `a11y.tabbar` `tab.home` `a11y.tab` `tab.room` `tab.settings` `a11y.tab.sel` |
| `S26-error` | 설정 · 불러오기 오류 | `set.title` `set.err.title` `set.err.body` `common.retry` `a11y.tabbar` `tab.home` `a11y.tab` `tab.room` `tab.settings` `a11y.tab.sel` |
| `S26-push-consent` | 설정 → AI 처리 동의 관리(푸시) | `set.ai.consent` `consent.status.date` `consent.status.on` `consent.couple.body` `consent.sent.body` `consent.keep.body` `consent.withdraw` |
| `S26-push-lic` | 설정 → 글꼴·오픈소스 라이선스(푸시) | `lic.title` `lic.note` `lic.inter` `lic.ofl` `lic.view` `lic.notokr` `lic.notojp` |
| `S26-sheet-lang` | 설정 → 언어(시트) | `set.title` `set.name.value` `set.login.kakao` `set.together` `set.together.value` `set.cover` `set.cover.on` `set.room.mode` `set.room.mode.auto` `set.room.mode.day` `set.room.mode.night` `set.room.mode.help` `set.room.now` `set.room.tz` `set.room.tz.value` `set.lang` `set.theme` `set.theme.system` `set.theme.light` `set.theme.dark` `set.hc` `set.hc.help` `a11y.off` `a11y.switch` `set.ai.consent` `consent.status.on` `set.sec.info` `set.about.version` `set.about.licenses` `set.terms` `set.privacy` `set.support` `set.logout` `set.end` `set.end.help` `set.sec.app` `set.sec.ai` `set.sec.danger` `a11y.tabbar` `tab.home` `a11y.tab` `tab.room` `tab.settings` `a11y.tab.sel` `set.lang.sheet` `set.lang.system` `set.lang.note` |
| `S26-sheet-tz` | 설정 → 시간대(시트) | `set.title` `set.name.value` `set.login.kakao` `set.together` `set.together.value` `set.cover` `set.cover.on` `set.room.mode` `set.room.mode.auto` `set.room.mode.day` `set.room.mode.night` `set.room.mode.help` `set.room.now` `set.room.tz` `set.room.tz.value` `set.lang` `set.theme` `set.theme.system` `set.theme.light` `set.theme.dark` `set.hc` `set.hc.help` `a11y.off` `a11y.switch` `set.ai.consent` `consent.status.on` `set.sec.info` `set.about.version` `set.about.licenses` `set.terms` `set.privacy` `set.support` `set.logout` `set.end` `set.end.help` `set.sec.couple` `set.sec.room` `a11y.tabbar` `tab.home` `a11y.tab` `tab.room` `tab.settings` `a11y.tab.sel` `set.room.tz.pick` `set.room.tz.search` `set.room.tz.tokyo` `set.room.tz.la` `set.room.tz.ny` `set.room.tz.london` |
| `S26-push-end` | 설정 → 공간 종료 확인(푸시 · 탭 바 숨김) | `end.date` `end.title` `end.body` `end.b1` `end.b2` `end.b3` `end.check` `end.confirm` `end.cancel` |

## 캐릭터 섹션 (C01~C05)

마스코트(소유자가 제공한 캐릭터)는 화면 안에 퍼뜨리지 않고 **독립 보드 5장**에 모았어요: C01 캐릭터 개요 · C02 제스처 시트(11개 제스처를 원본/가공본으로 1:1) · C03 팔레트·해부·규칙 · C04 배경·크기 · C05 하모나이즈 vs 원본. 파일은 `mascot/`.

**캐릭터가 나오는 화면(현재 두 곳)**

| 어디 | 화면 · 상태 | 포즈 | 이유 |
|---|---|---|---|
| 방 장면의 기본 오브젝트 | S07 방(방 상태 전부), S24 방 탭, 그리고 방을 축소해 보여 주는 곳(S06·S23 홈의 방 카드, S08·S09·S10 프롬프트·미리 보기·되돌리기의 방 축소 보기) | `wave_main`(상대 점유 상태는 `lookup`) | 방에 처음부터 있는 앱 소유 기본 오브젝트라서 방 그림이면 같이 나와요 |
| 온보딩 히어로 1개 | S01-3 | `wave_main` | 앱의 얼굴을 소개하는 유일한 히어로 |

그 밖의 화면(온보딩 1·2, 재실행, 로그인 처리, 공간 생성 중·성공, 초대 대기·확인·참여 완료, 홈 D-day 상단, 빈 상태, 프롬프트 빈 대화, 공간 종료·복구·만료, 신고 제출 완료, 설정 프로필 등)은 캐릭터 없이 **오브젝트 스케치로 만든 작은 일러스트**(책 더미·편지·화분·풍선·리본·달·구름·선물)나 단순한 레이아웃이에요.

**나중에 캡틴이 원하면 더 쓸 수 있는 곳(제안만, 배치 아님)**: `cheer` 성공·참여 완료 · `heart` 초대 수락 · `phone` 로그인 대기 · `box` 빈 상태 · `lookup` 초대 대기 · `walk` 불러오는 중 · `sleep` 밤·보관 중 · `star_sit` 기념일 · `back` 이별·종료 안내 · `lie` 오프라인 대기.

## 설명 없는 보드

- **C01~C05 캐릭터 섹션**, **S18 에셋**, **S19 글꼴·토큰**, **S20 접근성**, **S21 긴 문구**, **S22 컴포넌트**, **S27 탭 구조**는 화면이 아니라 참고 보드예요: 각각 `assets-spec.md`, `tokens.json`, `contrast-report.md`, 이 문서, `components.md`, `interaction-notes.md`와 대응해요.
