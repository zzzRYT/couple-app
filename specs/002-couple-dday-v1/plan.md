# Implementation Plan: 커플 D+Day V1 (iOS · TestFlight)

**Branch**: `fm/cpl-v1-handoffs` (spec 디렉터리 `002-couple-dday-v1`) | **Date**: 2026-11-02 | **Spec**: [spec.md](./spec.md)

**Input**: `specs/002-couple-dday-v1/spec.md`, 정본 디자인 아티팩트 version `1793598115-fafc`, 기존 코드(이 계획을 쓰며 직접 확인한 파일과 줄 번호는 아래 각 절에 적었다).

## Summary

기존 Expo SDK 58 앱과 Supabase 백엔드를 그대로 쓰되, (1) 방·프롬프트·커버·신고 진입을 기능 플래그로 숨기고, (2) 탭을 홈·기념일·설정 3개로 바꾸고, (3) 구성원 이름·생일과 직접 추가 기념일을 서버에 더하고, (4) 모든 기념일 계산을 앱의 순수 모듈 하나(`src/lib/anniversaries.ts`)로 모아 홈·목록·위젯·알림이 같은 결과를 쓰게 하며, (5) iOS 위젯 extension(App Group)과 로컬 알림 스케줄러를 새로 만들고, (6) EAS Build/Submit/Update와 GitHub `workflow_dispatch`로 TestFlight 배포를 자동화한다. 일은 조사 보고서의 6개 슬라이스(S1~S6) 순서로 하며 슬라이스마다 Codex용 handoff가 하나씩 있다(`handoffs/`).

## Technical Context

**Language/Version**: TypeScript 5.9(앱, Deno Edge Functions), SQL(PostgreSQL 15, Supabase), Swift 5.10+(위젯 대안 경로에서만)

**Primary Dependencies**: Expo SDK 58(`expo` ~58.0.19), expo-router 58, React Native 0.88, i18next 26, `@supabase/supabase-js` 2, expo-notifications 58(이미 있음). 추가: `expo-updates`(S1), `expo-widgets`(S4, PoC 결과에 따라 `@bacons/apple-targets`), `expo-file-system`이나 `expo-secure-store`(이미 있음)로 로컬 저장.

**Storage**: Supabase Postgres(공간·프로필·직접 추가 기념일·축하 기록), 기기 로컬(알림 설정, 축하 닫기 기록, 마지막 V1 데이터), App Group 공유 컨테이너(위젯 스냅샷).

**Testing**: Jest + jest-expo + `@testing-library/react-native`(앱), `deno test`(Edge Functions, 로컬 스택 대상), pgTAP `supabase test db`(SQL·RLS), XCUITest(시뮬레이터 두 대 연결 흐름, 기존 `firstmate/data/cpl-pairtest/PairUITest.swift` 패턴), 기기 수동 체크리스트(위젯·알림·TestFlight). Maestro는 쓰지 않는다.

**Target Platform**: iOS 17+ iPhone(SDK 58 최소 16.4), TestFlight 내부 테스트. Android는 범위 밖(빌드는 깨지지 않게만 유지).

**Project Type**: 모바일 앱 + BaaS(pnpm 워크스페이스 `apps/mobile`, `packages/scene-contract`, `supabase/`).

**Performance Goals**: 홈 첫 표시 1초 안(캐시가 있을 때), 기념일 계산 1년치 10ms 안(순수 함수), 위젯 데이터 쓰기 50ms 안.

**Constraints**: 공간 시간대 기준 하루 경계, 오프라인 읽기만, 위젯·알림에 개인 정보 최소화, 서버 푸시 없음, 로컬 알림 최대 50개.

**Scale/Scope**: 사용자 2명(TestFlight), 화면 약 45개 프레임, 문구 키 약 280개(ko/en/ja).

## Constitution Check

*GATE: Phase 0 전과 Phase 1 뒤에 확인.*

| 원칙 | 확인 | 근거 |
|---|---|---|
| I. 안전·개인정보 | 통과 | 생일 연도는 본인에게만, 위젯·알림·잠금 화면에 이름·연도·토큰 없음(V0-NF-04), 상대 생일은 둘 다 넣었을 때만. 알림은 옵트인. |
| II. 결정적 경계 | 통과 | 모든 입력(제목·메모·이름·날짜·시간대)을 Edge Function과 RPC에서 다시 검증. 위젯 JSON은 `schemaVersion`으로 검증 후 사용. |
| III. 접근성 | 통과 | S20 규칙(48pt, 200%, 동작 줄이기, VoiceOver 라벨)을 각 handoff의 완료 조건에 넣음. |
| IV. 검증 가능한 변경 | 통과 | 모든 수락 시나리오 ID → 테스트 계층 추적표(아래). 마이그레이션·RLS는 pgTAP. |
| V. 작고 되돌릴 수 있는 설계 | 통과 | 숨김은 플래그(데이터·코드 삭제 없음). 새 테이블은 공간 삭제 시 cascade, 마이그레이션마다 rollback 헤더(`tools/ci/check-migrations.mjs`). |
| 추가 제약: 확정/제안 구분 | 통과 | spec "Decisions and Assumed Defaults" 표. |
| 추가 제약: 비밀 | 통과 | Expo·ASC 키는 GitHub secret과 EAS credentials에만(V0-F14-AC-05). |

Phase 1 뒤 재확인: 위반 없음. Complexity Tracking 해당 없음.

## Project Structure

### Documentation (this feature)

```text
specs/002-couple-dday-v1/
├── spec.md              # 요구 사항·수락 시나리오·결정 표
├── plan.md              # 이 문서(아키텍처 델타·출시·테스트·추적표)
├── research.md          # 결정과 대안
├── data-model.md        # 테이블·RPC·RLS·로컬 저장소
├── contracts/
│   ├── v1-api.md        # Edge Function 경로·요청·응답·오류
│   └── widget-snapshot.schema.json  # App Group 위젯 데이터 스키마(schemaVersion 1)
├── quickstart.md        # 로컬 검증 순서
├── analysis.md          # speckit-analyze 결과
├── tasks.md             # 슬라이스별 작업
├── checklists/requirements.md
└── handoffs/            # Codex용 자기 완결 handoff H01~H06 + README
```

### Source Code (repository root)

```text
apps/mobile/
├── app.config.ts                 # S1 updates·runtimeVersion·version, S4 widget plugin·App Group
├── eas.json                      # S1 testflight 프로필·channel·submit
├── src/config/identity.ts        # S4 appGroupId·widgetBundleId 매개변수(.dev)
├── src/config/version.ts         # S1 신규: 버전 행 문자열
├── src/config/features.ts        # S2 신규: V1 기능 플래그
├── src/app/(tabs)/_layout.tsx    # S2 홈·기념일·설정
├── src/app/(tabs)/anniversaries/ # S2 자리 → S3 목록
├── src/app/anniversary/[key].tsx # S3 신규: 상세(탭 밖 루트 라우트)
├── src/app/anniversary-edit.tsx  # S3 신규: 추가·편집 full-screen modal
├── src/app/(onboarding)/profile.tsx  # S2 신규: 이름·생일 단계
├── src/app/settings/*            # S2·S5·S6 설정 하위 화면
├── src/lib/anniversaries.ts      # S2(일수·주년)→S3(전체) 신규: 순수 계산 엔진
├── src/lib/__fixtures__/anniversaries.json  # S3 공유 fixture(앱·서버·Swift)
├── src/features/home/            # S2 V1 홈으로 재구성
├── src/features/anniversaries/   # S3 신규
├── src/features/widgets/         # S4 신규: 스냅샷 작성·reload
├── src/features/notifications/   # S5 신규: 사전 안내·스케줄러·설정 저장
├── src/i18n/locales/v1/*.json    # S2 신규: V1 문구 overlay(ko/en/ja)
└── widgets/ (또는 targets/widget/)  # S4 신규: 위젯 레이아웃(expo-widgets) 또는 Swift 타깃
supabase/
├── migrations/20261103000100_v1_member_profile.sql      # S2
├── migrations/20261103000200_v1_space_time_zone.sql     # S2
├── migrations/20261103000300_v1_snapshot.sql            # S2(이름) → S3에서 기념일·생일 공개 규칙 확장
├── migrations/20261103000400_v1_milestones.sql          # S3
├── migrations/20261103000500_v1_custom_anniversary.sql  # S3
├── functions/_shared/milestones.ts   # S3 150일·V1 목록
├── functions/profile/index.ts        # S2 PUT /profile/member
├── functions/spaces/index.ts         # S2 PATCH time-zone, S3 anniversaries CRUD
└── tests/*.test.sql                  # pgTAP
.github/workflows/release-ios.yml, ota.yml   # S1
```

**Structure Decision**: 기존 모노레포 구조를 유지한다. 새 화면은 `src/features/<feature>/`에 컴포넌트, `src/app/` 라우트는 얇게 둔다(기존 관례). 서버는 기존 Edge Function 파일에 경로를 더하고 새 함수 배포 단위는 만들지 않는다(`tools/ci/check-functions-boot.mjs` 영향 최소).

## Architecture Deltas (기존 코드 확인 결과)

### 1. 재사용 감사 (조사 보고서 §4를 코드로 다시 확인)

| 영역 | 확인한 코드 | V1 처리 |
|---|---|---|
| 인증 | `src/features/auth/LoginScreen.tsx`, `AppleButton.tsx`, `Welcome.tsx`, `src/lib/auth.ts`, `src/app/(auth)/{index,welcome,login,email-code}.tsx`, dev quick login `features/auth/devQuickLogin/` | Apple만 보이게 `V0-start-intro`로 재구성. 이메일 경로는 `development` 변형에서만(`EXPO_PUBLIC_DEV_EMAIL_LOGIN`, `app.config.ts:6-13` 가드 유지). |
| 공간 만들기 | `features/onboarding/CreateSpaceScreen.tsx`(60줄, 날짜만), `app/(onboarding)/create-space.tsx`(기기 시간대 = `getCalendars()[0].timeZone`), `client.createSpace` | 날짜 화면을 V0 디자인으로, 그 뒤 새 `profile` 단계. 공간 생성은 프로필 단계 "다음"에서(뒤로 가기 안전). |
| 초대 | `features/onboarding/{InviteScreen,JoinScreen,SpaceChoiceScreen}.tsx`, `supabase/functions/invitations/index.ts` | 그대로 재사용, V0 문구·레이아웃만. PR 26의 "새 초대 유지" 로직(`InviteScreen`, `SpaceContext`) 유지. |
| 앱 게이트 | `src/lib/appGate.ts`(booting/signedOut/sessionExpired/needsOnboardingChoice/ended/active), `src/app/_layout.tsx` | 새 상태 `needsProfile`(활성 공간이 있고 내 `displayName`이 null)와 `connectedOnce` 흐름 추가. |
| 홈 | `features/home/HomeScreen.tsx:57-126`(커버·방 카드·방 열기·날짜 편집 시트), `app/(tabs)/home.tsx`(커버 로딩·업로드) | 새 `V1HomeScreen`으로 교체. 커버·방 관련 import 제거, 날짜 편집은 설정으로 이동. 기존 `HomeScreen`은 플래그 뒤에 남겨 둠(삭제 안 함). |
| D+일 | `src/lib/dday.ts`(`dayCount`, `todayIn`, `parseCalendarDate`), `supabase/functions/_shared/dday.ts` | 그대로. `anniversaries.ts`가 이를 사용. |
| 동기화 | `features/space/useSnapshotSync.ts`(포그라운드·Realtime 힌트·오프라인 15초 재시도·마지막 snapshot 메모리 유지) | 그대로 + 마지막 V1 데이터 로컬 저장(A-22). `session` 이외 이벤트는 이미 refresh(`:58`). |
| 축하 | `supabase/functions/_shared/milestones.ts:4`(`DAY_MILESTONES = [50,100,200,300,500,1000]`), `functions/milestones/index.ts`, 마이그레이션 `20261102000700_milestones.sql:5,15`(키·일수 check 제약), `features/milestone/{useMilestone,MilestoneCard}.ts(x)` | V1 목록 `[50,100,150,200,300]`, check 제약에 150 추가, 시간대를 `couple_space.time_zone`으로. 카드 UI는 V0 축하 카드로 교체, 프리셋 제안 버튼 제거. |
| 시간대 | `update_room_mode`(`20261102000300_room_mode.sql`)만 `couple_space.time_zone`을 바꿈 — prompt session 잠금을 거침 | 새 RPC `update_space_time_zone`(잠금 없음, 버전 확인). 마일스톤 RPC의 `room_theme_document->>'timeZone'` coalesce 제거. |
| 이름·생일 | **없음**(`user_profile`은 locale·time_zone·ui_theme만, `20261101000100_base_schema.sql:2-8`) | `user_profile`에 열 추가 + snapshot 확장(S2 이름, S3 생일). |
| 설정 | `features/settings/SettingsScreen.tsx`(132줄: 방 모드·시간대·커버·AI 동의·신고·종료·탈퇴·언어·테마·고대비·라이선스), `preferences.tsx`, `logout.ts` | V0 구조로 재구성. 방 모드·커버·AI 동의·신고 행 제거(플래그), 사귄 날·시간대·내 정보·알림 행 추가. |
| 탈퇴·종료 | `features/account/{DeleteAccountScreen,deleteAccount}.ts(x)`(이미 `cancelAllScheduledNotificationsAsync`), `features/lifecycle/{EndSpaceScreen,EndedScreen,leave}.ts(x)`, `supabase/functions/account/runner.ts` | 재사용. V0 문구, 위젯 데이터 지우기 추가. 새 테이블은 `couple_space` cascade·`auth.users` cascade로 정리. |
| i18n | `src/i18n/index.ts`(i18next, `{}` 보간, `keySeparator: false`), 로케일 JSON은 `tools/i18n/import-design-copy.mjs`가 `design/i18n-copy.md`에서 생성(키 640개 기대, 지금 JSON은 646개) | `design/`을 고치지 않으려고 V1 문구는 `locales/v1/<locale>.json` overlay로 더하고 `createI18n`이 합친다. 브랜드 이름은 i18next nesting `$t(app.name)`로만 참조. |
| 알림 | 의존성과 탈퇴 시 전체 취소만(`app/settings/delete-account.tsx:3,20`) | 새 `features/notifications/`. |
| 위젯 | 없음(`features/room/DdayWidget.tsx`는 앱 안 컴포넌트) | 새 extension. |
| 출시 | `eas.json`(development/preview internal/production, `appVersionSource: remote`), `app.config.ts`(updates·version 없음), `.github/workflows/ci.yml`만 | S1 전체 신규. |

### 2. 기능 플래그와 숨김 (S2)

- 새 파일 `apps/mobile/src/config/features.ts`: `export const V1_FEATURES = { room: false, prompt: false, cover: false, reportBlock: false, emailLogin: variant === 'development', kakaoLogin: false, notifications: false } as const`. 컴파일 시 상수(원격 설정 없음). `notifications`는 S5(H05)에서 `true`로 바꾼다.
- `src/app/(tabs)/_layout.tsx`: `room` 트리거 제거, `anniversaries` 트리거 추가(SF Symbol은 board 아이콘과 가장 가까운 것, H02 디자인 발췌 참고).
- `src/app/_layout.tsx`: `prompt/index`, `prompt/consent`, `settings/report` 화면을 `V1_FEATURES.*` guard로 막는다(`Stack.Protected guard={false}`). 라우트 파일은 남긴다.
- `src/app/(tabs)/room.tsx`는 남기되 탭에 없음. 딥링크로 들어오면 홈으로 리다이렉트.
- 서버: 방·프롬프트·커버 Edge Function은 그대로 둔다(데이터 삭제 금지, V0-NF-06).

### 3. 데이터 모델과 API (자세히: [data-model.md](./data-model.md), [contracts/v1-api.md](./contracts/v1-api.md))

새 마이그레이션(모두 첫 10줄 안에 `-- rollback:` 헤더 필수):

| 파일 | 슬라이스 | 내용 |
|---|---|---|
| `20261103000100_v1_member_profile.sql` | S2 | `user_profile`에 `display_name text`(trim 후 1~10자), `birth_month smallint`, `birth_day smallint`, `birth_year smallint`(셋은 함께 null 또는 유효한 날짜; 2월 29일 허용), `profile_updated_at`. RPC `set_member_profile(actor, display_name, birth_month, birth_day, birth_year)` security definer, 각 활성 공간에 `notify_space(..., 'member', {"kind":"profile"})`. |
| `20261103000200_v1_space_time_zone.sql` | S2 | RPC `update_space_time_zone(actor, target, tz, expected timestamptz)`(`pg_timezone_names` 검증, `updated_at` 버전 확인 → `VERSION_CONFLICT`). `couple_space`에 `anniversary_changed_by uuid`, `anniversary_changed_at timestamptz` 추가하고 `update_anniversary`가 채우도록 재정의. `milestone_context`, `record_milestones`, `mark_milestone_seen`도 `couple_space.time_zone`만 쓰도록 재정의(S2에서 시간대를 바꿔도 서버 축하가 같은 시간대를 쓰게). |
| `20261103000300_v1_snapshot.sql` | S2 | `space_snapshot` 재정의: `members[]`에 `displayName`, `me`에 `displayName`·`birthday`(연도 포함), `space`에 `anniversaryChangedBy`·`anniversaryChangedAt`. 기존 필드는 그대로 둔다(하위 호환). |
| `20261103000400_v1_milestones.sql` | S3 | `milestone_celebration`의 두 check 제약(`milestone_celebration_milestone_key_check`, `milestone_celebration_check`)을 `d(50\|100\|150\|200\|300\|500\|1000)`로 넓힘(옛 기록 보존). 시간대 단일화는 S2(`…200`)에서 이미 함. |
| `20261103000500_v1_custom_anniversary.sql` | S3 | 테이블 `space_anniversary`, RLS(구성원 읽기만), RPC `create_custom_anniversary`, `update_custom_anniversary`, `delete_custom_anniversary`(소프트 삭제), `space_snapshot` 확장(`anniversaries[]`, 상대 생일 공개 규칙). 변경마다 `notify_space(..., 'anniversary', {"id":…})`. |

Edge Function 경로(기존 파일에 추가, 모두 인증 필수, 변경은 멱등 키):

| 경로 | 파일 | 슬라이스 |
|---|---|---|
| `PUT /profile/member` | `functions/profile/index.ts` | S2 |
| `PATCH /spaces/:spaceId/time-zone` | `functions/spaces/index.ts` | S2 |
| `POST /spaces/:spaceId/anniversaries` | `functions/spaces/index.ts` | S3 |
| `PATCH /spaces/:spaceId/anniversaries/:id` | `functions/spaces/index.ts` | S3 |
| `DELETE /spaces/:spaceId/anniversaries/:id` (body `expectedVersion`) | `functions/spaces/index.ts` | S3 |
| `GET /spaces/:spaceId/milestones/current` | 기존, 목록만 변경 | S3 |

오류: 기존 `ERROR_CODES` 재사용. 충돌은 `VERSION_CONFLICT`(409), 삭제된 기념일 수정은 `NOT_FOUND`(404, extra `{ gone: true }`), 입력 오류 `INVALID_REQUEST`. 새 코드는 만들지 않는다.

RLS 규칙: `space_anniversary`는 `select`만 `is_space_member(space_id)`로 허용, `insert/update/delete`는 `authenticated`에서 revoke하고 security definer RPC로만. `user_profile`의 기존 정책(본인만)은 그대로이며 상대 이름·생일은 `space_snapshot`(security definer)만 내보낸다. 상대 생일은 **두 사람 모두 생일이 있을 때만** 포함, 연도는 절대 포함하지 않는다.

### 4. 앱 계산 엔진 `src/lib/anniversaries.ts` (S2에서 시작, S3에서 완성)

- 순수 함수 `computeAnniversaries(input, nowIso): { today; dayCount; todayItems; upcoming; past; celebrationCandidates }`. 입력·출력의 정본 모양은 `handoffs/H03-anniversaries.md` §6 2단계에 있다(`input = { startDate, timeZone, me: { birthday }, partner: { birthday } | null, customs: [{ id, title, date, repeat }] }`). 어떤 축하 카드를 보일지(닫힘 기록 반영)는 엔진 밖 홈 화면이 정한다. S2(H02)는 일수·주년만 다루는 `computeMilestoneView`로 시작한다.
- `Occurrence = { key: string; kind: 'days' | 'years' | 'birthday' | 'season' | 'custom'; date: string; n?: number; who?: 'me' | 'partner'; seasonId?: 'pepero' | 'christmas'; customId?: string; title?: string }`. `key` 예: `d150`, `y2`, `bday:me:2026`, `season:pepero:2026`, `custom:<uuid>:2026`.
- 규칙: spec `V0-DR-01`~`06`, 우선순위 주년 > 일수 > 생일 > 직접 > 시즌, 늦은 축하는 `days`/`years`만 7일.
- 서버 `_shared/milestones.ts`와 같은 fixture(`src/lib/__fixtures__/anniversaries.json`)로 Jest와 Deno 테스트를 모두 돈다(기존 `__fixtures__/dday.json`을 읽는 `supabase/functions/_shared/__tests__/dday.test.ts` 패턴, 새 파일 `_shared/__tests__/anniversaries.test.ts`).
- 일수·주년 축하의 "봤음"은 서버(`milestones/current`의 `celebration.seenByMe`), 나머지는 기기 저장소 키 `v1.celebration.seen.<spaceId>.<userId>`.

### 5. 위젯 (S4)

- **PoC 먼저**(T401): `expo-widgets` config plugin으로 extension `com.jinjinstar.aroom.dev.widgets`, App Group `group.com.jinjinstar.aroom.dev`. 앱이 숫자 하나를 쓰고 `reload`했을 때 홈·잠금 위젯이 그 숫자를 보이는지 TestFlight 기기에서 확인. 실패(서명·SDK 문제)하면 `@bacons/apple-targets` + Swift `TimelineProvider`로 전환(같은 스냅샷 스키마).
- **스냅샷 스키마**: [contracts/widget-snapshot.schema.json](./contracts/widget-snapshot.schema.json). 요지: `{ schemaVersion: 1, writtenAt, spaceId, state: 'normal' | 'pending' | 'none' | 'ended', locale, timeZone, startDate, names: { me, partner }, strings: {…미리 번역한 짧은 문구}, entries: [{ date, showAt, dayCount, today?: item, next: item[] }] }`, `item = { key, kind, title, date, daysLeft, privacySensitive }`. `entries`는 공간 시간대 자정부터 앞으로 **최소 35일**치(보드 예시는 30일). 두 사람 이름(`names`)은 홈 위젯에만 쓰고 잠금 위젯 레이아웃은 이름을 그리지 않는다. 생일 연도·토큰·이메일·사용자 id 없음.
- **쓰기 시점**: snapshot 동기화 성공, 기념일·프로필·사귄 날·시간대·언어 변경, 포그라운드 진입, 로그아웃·연결 끊기·종료·탈퇴(→ `state: 'none'` 또는 `'ended'`로 덮어쓰기). 원자적 쓰기(임시 파일 → rename 또는 API가 보장하는 단일 set) 후 `reload`.
- **timeline**: 각 entry의 표시 시각 = 그 날짜의 공간 시간대 00:00. 정책 `atEnd`(마지막 entry 뒤 다시 요청).
- **딥링크**: `aroom-dev://home`(기존 scheme `aroom-dev`, `app.config.ts:21`), 오늘 카드 → 홈, 대기 → 홈(초대 카드), 공간 없음 → 앱 시작, 기념일 행 → `/anniversary/<key>`. 정확한 대상은 H04 디자인 발췌의 "verify" 항목 참고.
- **OTA 경계**: 위젯 레이아웃(JS든 Swift든)과 extension 설정은 새 빌드로만 바꾼다고 가정한다(검증 전 OTA 보장 안 함).

### 6. 알림 (S5)

- 새 `features/notifications/`: `preferences.ts`(기기 저장: `{ enabled, time: 'HH:mm', early: 'none'|'1d'|'3d'|'7d', kinds: {milestone, birthday, season, custom}, offIds: string[], prePromptSeen }`, `expo-secure-store` 키 `v1.notify.<userId>`), `plan.ts`(순수: `computeAnniversaries`의 다가오는 발생 → 알림 목록, 최대 50개, 가까운 순), `scheduler.ts`(현재 예약과 diff → 취소·추가), `PrePromptScreen`(`V0-start-notify`).
- 트리거: 공간 시간대의 `날짜 + HH:mm`을 절대 시각(UTC)으로 바꿔 `{ type: 'date', date }` 트리거 사용. 기기 시간대를 따라 움직이는 calendar 트리거는 쓰지 않는다(V0-DR-05). DST가 있는 시간대에서 존재하지 않는 시각(예: 02:30)은 다음 유효 시각으로.
- 식별자: `v1:<occurrenceKey>:<offsetDays>`. 예약 데이터 `data: { v1: true, key }`. "모두 취소"는 V1 식별자만(다른 알림이 없으므로 탈퇴는 기존대로 전체 취소 유지).
- 재계산 시점: 포그라운드, snapshot 변경(사귄 날·시간대·기념일·생일), 알림 설정 변경, 언어 변경. 취소: 로그아웃·연결 끊기·종료·탈퇴·알림 끄기.
- 권한: 사전 안내 "알림 켜기" → `requestPermissionsAsync`. 거부 → 설정 `V0-set-notify-denied`(앱 설정 열기 `Linking.openSettings()`).

### 7. i18n과 브랜드 (S2 시작, S6 마무리)

- `src/i18n/locales/v1/{ko-KR,en-US,ja-JP}.json` 새 overlay. `createI18n`이 기본 리소스 위에 병합(같은 키면 overlay 우선 — 예: `invite.title`). 생성기(`tools/i18n/import-design-copy.mjs`)와 `design/`은 건드리지 않는다. PR 25의 design-sync가 병합되면 overlay를 정본 문구 파일로 옮기는 후속 작업을 둔다(S6 T606).
- `keys.d.ts`도 생성 파일이므로 overlay 키 타입은 `src/i18n/v1Keys.d.ts`에 두고, overlay JSON과 함께 생성기 `tools/i18n/build-v1-overlay.mjs`가 만든다(키 279개 = 문구 278 + `mascot.name`).
- 브랜드(D-08): `app.name` = 아룸 / Aroom / アルーム, `mascot.name` = 아루미 / Aroomi / アルーミ(일본어는 저장소의 기존 값)만 이름을 담고, 다른 V1 문구는 `$t(app.name)`·`$t(mascot.name)` nesting으로 참조한다. 보드 문구의 모피루·모피는 생성기가 nesting으로 바꾼다. 테스트: V1 overlay 값 가운데 브랜드 키가 아닌 값에 `아룸|Aroom|アルーム|아루미|Aroomi|アルーミ|모피루|Mopiru|モピル|모피|Mopi|モピ`가 직접 있으면 실패.
- 한국어 조사: "아룸"은 받침(ㅁ)이 있어 뒤 조사가 을·이·은·과·으로가 된다. 보드 문구 가운데 해당하는 것은 `widget.none.title`("모피루를 시작해요" → "아룸을 시작해요") 하나다. "아루미"는 받침이 없어 "아루미가"는 그대로다. 생성기가 `$t(app.name)를|가|는|와|로` → `을|이|은|과|으로`로 고치고 테스트로 확인한다.
- iOS 표시 이름은 `identity.ts`의 `APP_IDENTITY.name`(`Aroom`)이다. 알림 권한 창의 앱 이름은 OS가 표시 이름으로 그린다. production bundle id는 아직 정하지 않았다(A-02).

### 8. 출시 파이프라인 (S1)

- `apps/mobile/eas.json`:
  - 새 build 프로필 `testflight`: `extends: "preview"`가 아니라 독립 정의 — `distribution: "store"`, `channel: "preview"`, `autoIncrement: true`, `env: { APP_VARIANT: "preview", EXPO_PUBLIC_APP_VARIANT: "preview" }`, `environment: "preview"`. bundle id는 `app.config.ts`가 `.dev`로 고른다.
  - `production` 프로필에 `channel: "production"`, `autoIncrement: true`(production App ID 등록 전에는 쓰지 않음).
  - `submit.testflight.ios`: `ascAppId`(오너가 ASC 앱 레코드를 만든 뒤 숫자 id, 비밀 아님), `appleTeamId: "43ZASDF2J7"`. ASC API 키는 EAS credentials에 등록(저장소에 없음).
- `apps/mobile/app.config.ts`: `version: '1.0.0'`(마케팅 버전, 사람이 올림), `runtimeVersion: { policy: 'fingerprint' }`, `updates: { url: 'https://u.expo.dev/<projectId>' }`(`EAS_PROJECT.projectId` 사용), plugins에 `expo-updates`는 자동, S4에 위젯 plugin. `ios.buildNumber`는 원격 관리라 넣지 않는다.
- `apps/mobile/package.json`: `expo-updates` 추가(`npx expo install expo-updates`로 SDK 58 맞춤 버전).
- `.github/workflows/release-ios.yml`(`workflow_dispatch`, inputs `profile`=testflight 고정 선택지, `submit`=true/false): checkout → pnpm install → `expo/expo-github-action@v8`(`eas-version: latest`, `token: ${{ secrets.EXPO_TOKEN }}`) → `eas build --platform ios --profile testflight --non-interactive --wait --auto-submit-with-profile testflight`(submit=false면 `--auto-submit` 없이). 빌드 실패 시 제출 없음. `concurrency` 그룹으로 동시 실행 방지.
- `.github/workflows/ota.yml`(`workflow_dispatch`, inputs `channel`=preview|production, `message`, `group`(승격할 때)): preview는 `eas update --channel preview --message ... --non-interactive`, production은 `eas update:republish --group <id> --destination-channel production`(preview에서 확인한 같은 업데이트를 승격). 롤백도 이전 그룹 republish.
- runtimeVersion `fingerprint`: native 변경(위젯·plugin·권한)이 있으면 runtime이 바뀌어 옛 빌드에 OTA가 가지 않는다. `appVersion` 정책은 쓰지 않는다(버전 올리기를 잊는 위험).
- 버전: 마케팅 `version`은 `app.config.ts`, 빌드 번호는 EAS 원격 자동 증가(extension도 같은 번호 — expo-widgets/apple-targets가 상속, S4에서 archive로 확인).
- 비밀: GitHub secret `EXPO_TOKEN` 하나. Apple 배포 인증서·프로비저닝·ASC API 키는 EAS credentials.

### 9. 테스트 전략

| 계층 | 도구·위치 | 무엇을 |
|---|---|---|
| 순수 로직 | Jest `apps/mobile/src/lib/__tests__/anniversaries.test.ts`, `features/notifications/__tests__/plan.test.ts`, `features/widgets/__tests__/snapshot.test.ts` | 날짜 규칙, 우선순위, 알림 목록, 위젯 스냅샷(스키마 검증 포함) |
| 계산 일치 | Jest + Deno가 같은 `anniversaries.json` fixture | 앱·서버 결과 일치(V0-NF-05) |
| 화면 | RNTL `features/**/__tests__/*.test.tsx`, `src/app/__tests__/navigationFlows.test.tsx` | 문구 키·상태·탐색·a11y 라벨 |
| Edge Function | `deno test -A supabase/functions` (로컬 스택) | 경로·검증·오류 코드·멱등 |
| SQL·RLS | pgTAP `supabase/tests/*.test.sql` | 제약·RPC·RLS·생일 공개 규칙·cascade |
| 두 기기 흐름 | XCUITest(시뮬레이터 두 대), firstmate `cpl-pairtest` 스크립트(`start-local.sh`, `PairUITest.swift`) | 연결·실시간 반영 |
| 기기 수동 | TestFlight 폰 체크리스트(`quickstart.md`) | 위젯 외관·자정·App Group, 알림 실제 울림, OTA, 권한 |
| 보드 일치 | 시뮬레이터 스크린샷 vs 보드 프레임(handoff의 Design extract) | SC-007 |

CI(`.github/workflows/ci.yml`)는 이미 lint·typecheck·mobile test·pgTAP·deno test·migration 헤더 검사를 돈다. 새 테스트는 이 경로 안에 둔다.

### 10. 추적표 (scenario → layer → where)

`V0-DR-NN` 행은 그 아래 `V0-DR-NN-AC-*` 시나리오를 모두 포함한다. 범위 표기(`-AC-01~07`)는 양 끝을 포함한다.

| 시나리오 | 계층 | 위치(파일 또는 체크리스트) |
|---|---|---|
| V0-F14-AC-01 | CI 정적 + 기기 | `tools/tests/release-config.test.mjs`(eas.json·workflow 정적 검사), 오너 실행 로그 |
| V0-F14-AC-02 | 기기 | quickstart §TestFlight |
| V0-F14-AC-03, -04 | 기기 | quickstart §OTA |
| V0-F14-AC-05 | CI | 기존 `secret-scan.yml` + release-config 테스트(비밀 리터럴 없음) |
| V0-F14-AC-06 | Jest | `src/config/__tests__/identity.test.ts`(기존) |
| V0-F01-AC-01~03 | RNTL | `features/auth/__tests__/login.test.tsx`, `src/app/__tests__/navigationFlows.test.tsx` |
| V0-F02-AC-01~07, -09, -10 | RNTL | `features/onboarding/__tests__/{create-space,profile,invite,join}.test.tsx`, `lib/__tests__/appGate.test.ts` |
| V0-F02-AC-08 | XCUITest + RNTL | `PairUITest.swift`(pairtest), `features/home/__tests__/V1HomeScreen.test.tsx` |
| V0-F03-AC-01~05 | RNTL | `features/home/__tests__/V1HomeScreen.test.tsx`, `src/app/__tests__/routes.test.tsx` |
| V0-F04-AC-01, V0-DR-02, V0-DR-03 | Jest + Deno + pgTAP | `lib/__tests__/anniversaries.test.ts`, `supabase/functions/_shared/__tests__/milestones.test.ts`, `supabase/tests/milestone.test.sql` |
| V0-F04-AC-02 | RNTL | `features/anniversaries/__tests__/detail.test.tsx` |
| V0-F05-AC-01~04 | pgTAP + RNTL | `supabase/tests/v1_custom_anniversary.test.sql`(snapshot 공개 규칙), `v1_member_profile.test.sql`, `features/anniversaries/__tests__/list.test.tsx` |
| V0-F06-AC-01 | Jest + RNTL | `anniversaries.test.ts`, `detail.test.tsx` |
| V0-F07-AC-01~07, -10, -11 | RNTL | `features/anniversaries/__tests__/edit.test.tsx` |
| V0-F07-AC-03, -08, -09, -10, -12 | Deno + pgTAP | `supabase/functions/spaces/__tests__/anniversaries.test.ts`, `supabase/tests/v1_custom_anniversary.test.sql` |
| V0-F08-AC-01~04 | Jest + RNTL | `anniversaries.test.ts`, `list.test.tsx` |
| V0-F09-AC-01~05 | Jest + RNTL + Deno | `anniversaries.test.ts`, `V1HomeScreen.test.tsx`, `milestones.test.ts` |
| V0-F10-AC-01, -05 | RNTL | `features/notifications/__tests__/prePrompt.test.tsx`, `features/settings/__tests__/notifications.test.tsx` |
| V0-F10-AC-02~04, -06, -07 | Jest | `features/notifications/__tests__/{plan,scheduler}.test.ts` |
| V0-F10-AC-08 | 기기 | quickstart §알림 |
| V0-F11-AC-01, -03, -04, -08 | 기기 | quickstart §위젯 |
| V0-F11-AC-02, -05~07, -09 | Jest | `features/widgets/__tests__/snapshot.test.ts` |
| V0-F12-AC-01~03, -06, -09, -10 | RNTL | `features/settings/__tests__/*.test.tsx` |
| V0-F12-AC-04, -05 | Deno + pgTAP | `spaces/__tests__/time_zone.test.ts`, `supabase/tests/v1_space_time_zone.test.sql` |
| V0-F12-AC-07, -08 | RNTL + 기존 Deno/pgTAP | `features/lifecycle/__tests__/lifecycle.test.tsx`, `features/account/__tests__/delete.test.tsx`, `supabase/tests/account_deletion.test.sql` |
| V0-F13-AC-01~05 | RNTL | `features/home/__tests__/states.test.tsx`, `features/lifecycle/__tests__/lifecycle.test.tsx` |
| V0-DR-01, -05, -06 | Jest + Deno | `anniversaries.test.ts`, `_shared/__tests__/parity.test.ts` |
| V0-EC-01~12 | Jest(대부분) | `anniversaries.test.ts`의 `describe('V0-EC-xx')` |
| V0-NF-01 | RNTL + 기기 | 각 화면 테스트의 a11y 라벨 검사, quickstart §접근성(200%, VoiceOver, 동작 줄이기) |
| V0-NF-02 | Jest | `src/i18n/__tests__/v1Overlay.test.ts`(세 언어 키 일치, 브랜드 리터럴 금지) |
| V0-NF-04 | Jest | `snapshot.test.ts`(연도·id 없음), `plan.test.ts`(직접 추가 제목 숨김) |
| V0-NF-06 | Jest | `src/config/__tests__/features.test.ts`, `routes.test.tsx`(숨긴 라우트로 갈 수 없음) |

### 11. 슬라이스 사이 검증 게이트

각 슬라이스 PR이 병합된 뒤 오너가 TestFlight 빌드(S1 이후) 또는 시뮬레이터 증거(스크린샷·영상)로 확인하고 승인해야 다음 handoff를 보낸다. 자세한 순서는 `handoffs/README.md`.

## Complexity Tracking

해당 없음(Constitution Check 위반 없음).
