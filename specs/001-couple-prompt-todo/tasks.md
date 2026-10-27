---
description: "프롬프트로 꾸미는 커플 D-day와 우리 방 — 구현 태스크 목록 (Expo/React Native + Supabase)"
---

# Tasks: 프롬프트로 꾸미는 커플 D-day와 우리 방

**입력**: `specs/001-couple-prompt-todo/`의 `spec.md`(사용자 스토리·FR-001~FR-059), `plan.md`(기술 맥락·저장소 구조), `data-model.md`, `contracts/api.md`와 `contracts/*.schema.json` 4개, `research.md`, `quickstart.md`, 디자인 `design/`(`tokens.json`, `i18n-copy.md` 587키, `assets-manifest.csv`, `assets-sketch/`, `mascot/`, `components.md`, `interaction-notes.md`, `screens.md`)

**전제**: 이 문서는 **문서만**이다. 저장소에는 아직 앱 코드가 없고, 이 태스크 목록이 구현의 시작점이다. 구현은 나중에 codex 작업자가 이 파일만 보고 실행한다.

**테스트**: **요청됨** — 계획과 `quickstart.md`가 정한 검증 흐름(계약 테스트, RLS, 점유·멱등, 장면 검증, 마일스톤 계산, 알림 예약, 하루 5회, 한 공간 규칙, 14세 문구, 연결 끊기, 세션 안 되돌리기, 마스코트 되살림)은 **각 스토리에서 구현보다 먼저 쓰고 실패를 확인**한다.

**구성**: 사용자 스토리별 단계(P1 → P2), 각 단계는 독립적으로 구현·검증할 수 있다. 스토리 번호는 `spec.md`의 User Story 1~7이다.

## 요약

| 단계 | 태스크 | 그중 [P] |
|---|---|---|
| Phase 1: Setup (저장소·도구·비밀·식별자 자리표시) | 9 | 7 |
| Phase 2: Foundational (모든 사용자 스토리가 기다리는 기반) | 25 | 9 |
| Phase 3: User Story 1 — 커플 공간 만들고 D-day 확인하기 (P1) | 19 | 8 |
| Phase 4: User Story 4 — 공유 프롬프트 세션 이어가기 (P1, 방 꾸미기 apply의 선행 조건) | 7 | 3 |
| Phase 5: User Story 2 — 프롬프트로 둘만의 방 꾸미기 (P1) | 23 | 10 |
| Phase 6: User Story 3 — 언어 및 표시 테마 설정 (P1) | 6 | 4 |
| Phase 7: User Story 5 — 커플 공간 종료와 복구, 연결 끊기, 신고 (P2) | 13 | 6 |
| Phase 8: User Story 6 — 홈 배경 사진 정하기 (P2) | 7 | 2 |
| Phase 9: User Story 7 — 마일스톤 축하와 옵트인 기기 예약 알림 (P2) | 13 | 5 |
| Phase 10: Polish & Cross-Cutting (구현 마무리, 출시 게이트와 별개) | 8 | 8 |
| Phase 11: 출시 게이트 (구현을 막지 않는다 — 출시 전에 사람이 닫는다) | 12 | 12 |
| **합계** | **142** | **74** |

- 각 스토리의 **독립 테스트**와 **체크포인트**는 해당 단계 머리에 있다.
- **MVP 컷 라인**: Phase 1~5(설정·기반·US1·US4·US2). 자세한 내용은 아래 "구현 전략".
- **게이트에 막힌 태스크는 없다**: 모든 구현 태스크는 자리표시로 진행하고, 출시 전 확인은 Phase 11에서 사람이 닫는다.

## 형식과 규칙

`- [ ] T### [P?] [US?] 설명 (파일 경로) → 수락: …`

- **[P]**: 서로 다른 파일을 건드리고 끝나지 않은 태스크에 의존하지 않아 **병렬 실행 가능**.
- **[US#]**: 사용자 스토리 단계의 태스크에만 붙는다(Setup·Foundational·Polish·게이트에는 없음).
- 각 태스크는 파일 경로와 **수락 기준**(통과해야 할 검사)을 갖는다. 설명 속 `T###` 참조는 다른 태스크를 가리킨다.
- 데이터 모델의 제약(열거형 값, 범위, 불변 규칙)은 해당 태스크에 **원문 그대로** 적었다. 구현 중 임의로 바꾸지 않는다.

### codex 작업자 지침

1. 시작 전에 이 파일과 위 "입력" 문서를 읽는다. 한 번에 **한 태스크**씩, 앞선 태스크가 끝난 뒤(또는 [P]로 독립일 때) 한다.
2. **테스트 태스크 먼저**: 테스트를 쓰고 실패하는 것을 확인한 뒤 구현 태스크로 간다. 구현 뒤 해당 테스트가 통과해야 완료다.
3. **비밀·식별자**: API 키·서비스 키를 저장소·로그·앱 번들·PR·채팅에 넣지 않는다. `com.jinjinstar.mopiru`·`mopiru.jinjinstar.com`은 **자리표시**이고 T005 한 파일에만 둔다. **스토어 등록·제출을 하지 않는다**(게이트 G2·G3 전). 공개 지원 이메일을 만들거나 저장소·git 설정의 주소를 쓰지 않는다.
4. **자리표시**를 쓰는 곳(법무 문구 `[법무 확인 후 입력]`, 카카오·Apple 버튼, 18개 일반 오브젝트 스케치, 영어·일본어 초안)은 그대로 만들고 **출시 게이트**에서 교체한다.
5. `design/`과 `specs/` 문서는 입력이다. 구현 때문에 계약이 달라지면 코드 대신 **문서를 먼저 고치고** 그 변경을 PR에 적는다.
6. 도구 선택(pnpm, Vitest, Jest+jest-expo, Deno test, pgTAP)은 계획이 고정하지 않은 **제안**이다. 소유자가 바꾸면 같은 의미의 도구로 바꾸되 수락 기준은 유지한다.
7. 표시 문자열은 **코드에 직접 쓰지 않는다**(키만, FR-019). 키 이름은 `design/i18n-copy.md` 그대로 쓴다(화면 이름이 바뀐 `report.block*` 포함).

### 경로 규칙 (plan.md "저장소 구조 제안")

```text
apps/mobile/                  Expo 앱 (src/app, src/features, src/scene, src/ui, src/i18n, src/lib, src/theme, src/config)
packages/scene-contract/      공유 JSON Schema와 순수 검증 규칙 (@couple/scene-contract)
supabase/functions/           Edge Functions (_shared + 기능별 폴더)
supabase/migrations/          스키마·RLS·RPC
supabase/seed/                카탈로그·리뷰용 고정 샘플
supabase/tests/               pgTAP 테스트 (제안: plan이 정한 폴더 밖의 테스트 전용 폴더)
assets/catalog/               manifest, 권리 기록, 최적화된 이미지
tools/                        생성 스크립트 (i18n·tokens·catalog·ai)
docs/                         구현 문서·점검표·게이트 기록
```

## 출시 게이트와 구현의 관계 (구현은 막히지 않는다)

| 게이트 | 내용 | 영향받는 태스크(자리표시로 진행) | 닫는 태스크 |
|---|---|---|---|
| G1 법률 검토 | 연령 문구, 해외 AI 보관 기간, 사진 개인정보, 알림, UGC, AI 오류 가능 고지 | T038, T047, T081, 번역 키 값 | T131 |
| G2 이름 확인 | 상표·스토어 이름·도메인·bundle ID | T005, T006 | T132 |
| G3 스토어 규칙 | 글자 수·심사·연령 등급·UGC·연결 끊기+신고·알림 메모 | T101, T122 | T133 |
| G4 원어민 검수 | 영어·일본어 문구 | T024 | T134 |
| G5 카카오·Apple 에셋 | 공식 SDK/에셋 | T048, T046 | T135 |
| G6 글꼴 크기 실측 | 9파일 vs 최소 구성 | T027, T129 | T136 |
| G7 에셋 최종 포맷·그림 | PNG-8/WebP, 18개 오브젝트 납품 | T029 | T137 |
| G8 AI 약관·비용·승급 | 포함 크레딧의 공개 앱 사용 문의, Usage Policy, 유료 전환, 승급 기준 | T071, T077 | T138 |
| G9 서버 푸시 | 로컬 알림으로 충분한지 | T121 | T139 |
| G10 지원 이메일 | 공개 주소 필요(아직 없음) | T005, T097 | T140 |
| G11 닮음 검사 | 마스코트·아이콘(권장, 비차단) | T029 | T141 |
| G12 계정·운영 | 개인 계정, Supabase 무료 정지 동작 | T004, T006 | T142 |

---

## Phase 1: Setup (저장소·도구·비밀·식별자 자리표시)

**목적**: 코드가 없는 저장소에 plan.md "저장소 구조 제안"대로 작업 공간을 만든다. 이 단계에서 만드는 식별자·키 자리는 모두 **자리표시**이고, 이름 확인(G2)이 끝나기 전에는 스토어에 아무것도 등록하지 않는다.

- [ ] T001 Root workspace 만들기: `package.json`(pnpm workspaces: `apps/*`, `packages/*`), `pnpm-workspace.yaml`, `.nvmrc`(Node 22), `tsconfig.base.json`(strict, `noUncheckedIndexedAccess`), `.editorconfig`, `.gitignore`(`node_modules/`, `.env*`(단 `.env.example`은 추적), `supabase/.temp/`, `*.figcraft`, `*.keystore`, `*.p8`) → 수락: `pnpm install`이 빈 워크스페이스에서 성공하고 `git status`에 비밀·빌드 산출물이 잡히지 않는다.
- [ ] T002 [P] `apps/mobile`에 Expo SDK 58 + React Native 0.88 + TypeScript 앱 만들기(`apps/mobile/package.json`, `app.config.ts`, `tsconfig.json`, `babel.config.js`, `metro.config.js`, `src/app/_layout.tsx` 빈 레이아웃). 의존성: `expo-router`, `expo-localization`, `i18next`, `react-i18next`, `@shopify/react-native-skia`(3.7.4 근처, 출시 때 호환 행렬 재고정), `@supabase/supabase-js`, `expo-notifications`, `expo-image-picker`, `expo-secure-store`, `expo-font`, `expo-splash-screen`, `react-native-reanimated` → 수락: `pnpm --filter mobile exec expo export --platform ios`가 성공(빈 화면).
- [ ] T003 [P] `packages/scene-contract` 패키지 만들기(`packages/scene-contract/package.json`(이름 `@couple/scene-contract`), `tsconfig.json`, `src/index.ts`, `vitest.config.ts`) → 수락: `pnpm --filter @couple/scene-contract test`가 "테스트 0개"로 통과하는 것이 아니라 최소 스모크 테스트 1개로 통과한다.
- [ ] T004 [P] `supabase/config.toml`, `supabase/migrations/`, `supabase/functions/`, `supabase/seed/`, `supabase/tests/`(pgTAP) 폴더 만들기. `config.toml`에 Auth(이메일 OTP 6자리 `otp_length = 6`, magic link 허용, 카카오·Apple 공급자 자리), Realtime, Storage 활성. 문서에 "원격 프로젝트는 소유자가 **Seoul `ap-northeast-2` 무료 플랜**으로 만든다(무료 프로젝트는 비활동 시 일시 정지됨)" 적기(`supabase/README.md`) → 수락: `supabase start`로 로컬 스택이 뜨고 `supabase status`가 성공.
- [ ] T005 [P] 앱 식별자 한 곳에 모으기 `apps/mobile/src/config/identity.ts`: `export const APP_IDENTITY = { name: 'Mopiru', slug: 'mopiru', iosBundleId: 'com.jinjinstar.mopiru', androidApplicationId: 'com.jinjinstar.mopiru', supportDomain: 'mopiru.jinjinstar.com', supportEmail: null as string | null, PLACEHOLDER: true } as const`(주석에 `TODO(G2 이름 확인 전: 스토어에 등록 금지)`)를 두고 `app.config.ts`가 이 값만 읽게 한다. `supportEmail`은 `null`(공개 지원 이메일이 아직 없고 만들지 않는다. G10). 저장소·git 설정의 이메일을 쓰지 않는다 → 수락: 문자열 `com.jinjinstar.mopiru`가 `identity.ts` 외에는 코드에 없다(grep 테스트 `apps/mobile/src/config/__tests__/identity.test.ts`).
- [ ] T006 [P] `apps/mobile/eas.json`에 `development`(개발 클라이언트), `preview`(내부 배포), `production` 프로필을 정의하되 **스토어 제출(`submit`) 설정은 넣지 않는다**(G2·G3 전). 문서 `apps/mobile/README.md`에 EAS 무료 플랜 한도(월 15 iOS + 15 Android 빌드)와 "Expo 계정은 소유자가 만든다" 적기 → 수락: `eas.json`이 JSON 스키마 검증을 통과하고 `submit` 키가 없다.
- [ ] T007 비밀 처리 규칙 만들기: `supabase/functions/.env.example`에 `ANTHROPIC_API_KEY=`(값 비움, 주석: "소유자의 Claude Max 요금제 포함 월 $100 API 크레딧에 연결된 **Console API 키**만 사용. 채팅 로그인·Claude Code 한도·OAuth 토큰은 쓰지 않는다. 이 프로젝트 전용 Console workspace에 지출 한도를 둔다. 크레딧은 결제 주기마다 소멸하고 잔액 0이면 요청이 멈춘다. 공개 출시 전 유료 크레딧 전환(G8)"), `SUPABASE_SERVICE_ROLE_KEY=`(값 비움), `docs/secrets.md`에 "서버 비밀은 `supabase secrets set`으로만 입력, 앱·저장소·로그·PR·채팅에 두지 않는다" 적기. `.github/workflows/secret-scan.yml`에 gitleaks 실행 → 수락: `gitleaks detect`가 통과하고, `.env.example`에 실제 키 문자열이 없다.
- [ ] T008 [P] ESLint(typescript-eslint, react-native, `eslint-plugin-i18next`의 `no-literal-string`을 `apps/mobile/src/features/**`·`src/ui/**`에 적용), Prettier, `pnpm lint`·`pnpm typecheck` 스크립트를 루트에 추가 → 수락: 컴포넌트에 한글/영문 리터럴을 직접 쓰면 lint가 실패한다(FR-019 "화면 코드에 표시 문자열 금지").
- [ ] T009 [P] `.github/workflows/ci.yml`: install → lint → typecheck → `scene-contract` Vitest → mobile Jest → `supabase db start` + `supabase test db`(pgTAP) → `deno test`(functions) → 스키마 동일성 검사(`@couple/scene-contract`의 `schemas/*.json`이 `specs/001-couple-prompt-todo/contracts/*.schema.json`과 바이트 동일) → 수락: PR에서 모든 단계가 돌고 스키마가 어긋나면 실패한다.

---

## Phase 2: Foundational (모든 사용자 스토리가 기다리는 기반)

**목적**: 계약·검증기·DB 기본 스키마·서버 공통 코드·앱 뼈대(i18n·테마·글꼴·카탈로그·로더). **이 단계가 끝나기 전에는 어떤 스토리도 시작하지 않는다.**

### 2-A. 계약과 검증기 (`packages/scene-contract`) — 테스트 먼저

- [ ] T010 [P] 테스트 먼저(실패 확인): `packages/scene-contract/tests/scene.contract.test.ts`. 픽스처 `packages/scene-contract/fixtures/scene/*.json`로 quickstart A 사례 전부: 유효(허용 ID, 오브젝트 ≤16, 텍스트 ≤3), **경계 실패**(17번째 오브젝트, 4번째 문구, 좌표 <0 또는 >1, 회전 범위 초과, 텍스트 길이 초과), **보안 실패**(임의 필드, URL, SVG/HTML, script, 이벤트 속성, 알 수 없는/은퇴된 asset ID), **마스코트 사례**(새 방에 `app_mascot` 정확히 1개, 마스코트 포함 16개 경계, `mascotState`·착용·색·표정·포즈 필드와 중복 마스코트 거부) → 수락: 모든 사례가 기대 결과(통과/거부+오류 위치)로 단언되고 구현 전에는 실패한다.
- [ ] T011 [P] 테스트 먼저: `packages/scene-contract/tests/theme.contract.test.ts` + `fixtures/theme/*.json` — `room-theme.schema.json`(`mode: day|night|follow_time`, IANA `timeZone`, 낮/밤 배경색·팔레트·에셋 variant), `room-presentation.schema.json`(D-day 표현: `visible`, `x`,`y`,`width`,`height`, `styleToken`, `textScale`, `surfaceToken`), `room-prompt-session.schema.json`(`status: occupied|released|expired` 등)의 유효·무효 사례 → 수락: 알 수 없는 필드를 거부하고 `follow_time` 기본·`timeZone` 필수를 단언한다.
- [ ] T012 `packages/scene-contract/schemas/`에 `specs/001-couple-prompt-todo/contracts/*.schema.json` 4개를 **그대로 복사**하고 `pnpm --filter @couple/scene-contract sync:schemas`(복사 스크립트 `scripts/sync-schemas.mjs`)로 재동기화할 수 있게 한다 → 수락: CI 동일성 검사(T009)가 통과한다.
- [ ] T013 `packages/scene-contract/src/validate.ts`: Ajv(strict, `additionalProperties:false` 존중)로 `validateScene`, `validateTheme`, `validatePresentation`, `validateSessionDoc` 구현. 결과 형식 `{ ok: boolean, errors: { path: string, code: string }[] }`. 서버와 앱이 **같은 함수**를 쓴다 → 수락: T010·T011가 모두 통과한다.
- [ ] T014 테스트 먼저(`packages/scene-contract/tests/geometry.test.ts`) 후 구현(`src/geometry.ts`, `src/protectedZones.ts`): 회전한 bounding box, 장면 가장자리 밖 노드, 상단·하단 시스템 안전 영역, 네이티브 컨트롤·D-day 뷰 침범(보호 영역) 계산. 안전 영역 입력은 파라미터(iOS 47/34, Android 32/24는 디자인 가정값 — `design/handoff.md` §8) → 수락: 좁은/넓은 비율·큰 글자 사례에서 침범 노드를 정확히 보고한다.
- [ ] T015 `packages/scene-contract/src/mascot.ts`: `ensureSingleMascot(scene)`, `defaultMascotPlacement()`(기본 자리·크기는 `design/interaction-notes.md` §11), `rejectMascotAppearance(candidate)`(`assetId: app_mascot` 외 마스코트 표현·상태 필드 거부). 마스코트는 16개 한도에 **포함** → 수락: T010의 마스코트 사례가 통과한다.
- [ ] T016 `packages/scene-contract/scripts/make-parity-fixtures.mjs`: 서버(Deno)와 앱(Jest)이 같은 입력으로 같은 결과를 내는지 대조하는 공용 픽스처(`fixtures/parity/*.json`, 입력+기대 결과) 생성 → 수락: Jest·Deno 양쪽에서 같은 파일을 읽어 같은 결과를 단언하는 테스트가 각각 하나씩 존재한다(Phase 3 이후 서버 측은 `supabase/functions/_shared/__tests__/parity.test.ts`).

### 2-B. DB 기본 스키마와 RLS — 테스트 먼저

- [ ] T017 [P] 마이그레이션 정책 `docs/migrations.md`와 `supabase/README.md`: 모든 마이그레이션은 앞으로 적용(forward)하며 **되돌릴 수 있는 방법 또는 명시적 삭제 정책**을 파일 머리 주석에 적는다(헌법 V "저장 데이터 변경은 안전한 이전·복구·삭제 정책을 가진다"). 파괴적 변경(열 삭제·타입 축소)은 백업 확인 후에만, 공유 행은 `space_id`와 RLS 정책 없이 추가하지 않는다 → 수락: `supabase db reset`이 모든 마이그레이션을 처음부터 적용하고, CI 린트 스크립트 `tools/ci/check-migrations.mjs`가 머리 주석(`-- rollback:` 또는 `-- deletion-policy:`)이 없는 마이그레이션을 실패시킨다.
- [ ] T018 [P] 테스트 먼저: `supabase/tests/rls_base.test.sql`(pgTAP). 사용자 A·B는 같은 공간 구성원, C는 비구성원. A·B만 공간·구성원·초대 행을 읽고 쓰며, C는 공간 ID를 알아도 읽기/수정/채널 구독 불가. 종료(`recovery_pending`) 공간의 쓰기는 거부 → 수락: 구현 전에는 실패한다.
- [ ] T019 `supabase/migrations/20261101000100_base_schema.sql`: `user_profile`(`user_id` PK, `locale`(ko-KR|en-US|ja-JP|null), `time_zone`, `ui_theme` check in (`system`,`light`,`dark`) default `system`, `created_at`, `updated_at`), `couple_space`(`status` check in (`active`,`recovery_pending`,`deleted`), `anniversary_date date`, `created_at`, `updated_at`, `ended_at`, `delete_after`, `ended_reason` check in (`ended`,`disconnect`), `ended_by_user_id`), `space_member`(복합 PK `(space_id,user_id)`, `role` check = `member`, `joined_at`, `left_at`, `space_active boolean not null default true`(공간이 `active`인 동안만 true; 종료·연결 끊기 때 같은 트랜잭션에서 false, 복구 때 true), `ai_consent_state` check in (`not_given`,`granted`,`revoked`) default `not_given`, `ai_consent_at`, `ai_consent_text_version`, `ai_consent_revoked_at`), `idempotency_key`(`key uuid`, `user_id`, `endpoint`, `response jsonb`, `created_at`, unique `(user_id,key,endpoint)`), `space_lifecycle_event`(`id`, `space_id`, `event_type` check in (`ended`,`disconnected`,`recovered`,`deletion_started`,`deletion_completed`,`cover_changed`,`cover_removed`,`milestone_preset_previewed`,`milestone_preset_applied`), `actor_user_id`, `occurred_at`, `metadata jsonb`(개인 내용 금지)). **한 사용자는 활성 공간의 `space_member`를 하나만 가진다**(부분 고유 인덱스 `unique (user_id) where space_active` — 상태가 다른 테이블에 있어 비정규화 열 `space_active`로 건다. **복구 대기(`recovery_pending`) 공간의 행은 `space_active=false`라서 새 공간을 막지 않는다**: 결정 FR-057·Decided 23, 가정) → 수락: 마이그레이션이 로컬에 적용되고 같은 사용자의 두 번째 `space_active=true` 행 삽입이 DB에서 거부되며, `space_active=false` 행이 있는 사용자는 새 활성 공간 행을 가질 수 있다.
- [ ] T020 `supabase/migrations/20261101000200_rls_base.sql`: 모든 공유 테이블에 RLS 활성화, 헬퍼 `is_space_member(space_id)`·`is_space_active(space_id)`(security definer), 정책(구성원만 select, 활성 공간 구성원만 write), `space_member`는 본인 동의 행만 수정 → 수락: T018가 통과한다.
- [ ] T021 [P] `supabase/functions/_shared/`: `auth.ts`(JWT 검증→`userId`), `errors.ts`(`{ error: { code, retryable } }` 형식, 코드 목록 `VERSION_CONFLICT`, `SESSION_OCCUPIED`, `SESSION_CONFLICT`, `DAILY_LIMIT_REACHED`, `ALREADY_IN_SPACE`, `RESTORE_NOT_ALLOWED`, `RESTORE_BLOCKED_OTHER_SPACE`, `ROOM_FULL`, `NOTHING_TO_UNDO`, `PREVIEW_CHANGED`, `ALREADY_APPLIED`, `MILESTONE_PASSED`, `COVER_FORMAT_UNSUPPORTED`, `COVER_TOO_LARGE`, `COVER_INVALID_IMAGE`, `UNSUPPORTED_REQUEST`, `INVALID_CANDIDATE`; **자연어 문구·locale 키·원문 프롬프트를 응답에 넣지 않는다**), `idempotency.ts`(모든 변경 요청이 `Idempotency-Key` UUID를 받아 같은 키 재요청에 저장된 응답 반환), `logging.ts`(로그 필드 allowlist: 키·프롬프트 원문·서명된 URL·초대 코드 금지) → 수락: Deno 단위 테스트 `supabase/functions/_shared/__tests__/shared.test.ts`가 (a) 오류 형식, (b) 같은 키 재요청 멱등, (c) 로그에 금지 필드가 남지 않음을 단언한다.
- [ ] T022 [P] `supabase/migrations/20261101000300_rate_and_audit.sql`: `daily_request_count`(`space_id`, `local_date date`(방 시간대 기준), `count int`, PK `(space_id, local_date)`)와 원자적 증가 함수 `increment_daily_request(space_id, limit int default 5)`(초과 시 예외 `DAILY_LIMIT_REACHED`) — **커플당 하루 최대 5회**, 날짜 키는 **방 시간대의 날짜**(자정 초기화) → 수락: pgTAP `supabase/tests/daily_limit.test.sql`이 5번째 허용·6번째 거부·병렬 호출에서도 초과 불가·자정 경계(시간대 2개)를 단언한다(테스트를 함수보다 먼저 작성).

### 2-C. 앱 뼈대 (`apps/mobile`)

- [ ] T023 [P] 테스트 먼저: `apps/mobile/src/i18n/__tests__/locales.test.ts` — `ko`·`en`·`ja` 리소스가 **같은 키 집합(587개)**을 가지고, 빈 값이 없고, `{name}` 같은 보간 변수가 세 언어에서 일치하며, `design/i18n-copy.md`의 키 수 표기("총 키 수: **587**")와 같다 → 수락: 구현 전에는 실패.
- [ ] T024 `tools/i18n/import-design-copy.mjs`: `design/i18n-copy.md`의 표(`| \`키\` | ko | en | ja |`)를 읽어 `apps/mobile/src/i18n/locales/{ko-KR,en-US,ja-JP}.json`과 타입 `apps/mobile/src/i18n/keys.d.ts`를 생성. 키 이름은 바꾸지 않는다(`report.block*`·`prompt.quota.body` 포함 — 화면 이름이 '연결 끊기'로 바뀌어도 키는 유지). 영어·일본어는 **원어민 검수 전 초안**(G4) 표시를 `locales/README.md`에 적는다 → 수락: T023이 통과한다.
- [ ] T025 `apps/mobile/src/i18n/index.ts`: `expo-localization`으로 기기 언어를 읽고 `i18next`+`react-i18next` 초기화, 앱 내 언어 선택이 기기 언어보다 우선(`user_profile.locale`과 `expo-secure-store`/AsyncStorage에 저장), 날짜·숫자는 `Intl`, D-day 문구는 메시지 리소스 → 수락: `apps/mobile/src/i18n/__tests__/setup.test.ts`가 기기 언어 `ja-JP`에서 시작→앱에서 `ko-KR` 선택→문자열이 바뀌는지 단언한다.
- [ ] T026 `tools/tokens/build-tokens.mjs`로 `design/tokens.json`에서 `apps/mobile/src/theme/tokens.ts`(색·글꼴·간격·안전 영역·방 낮/밤 × 앱 light/dark × 고대비 8조합) 생성. 대비 검증은 `design/tools/contrast-check.mjs`를 호출하는 테스트 `apps/mobile/src/theme/__tests__/contrast.test.ts` → 수락: "229 pairs checked, 0 failures"에 해당하는 결과를 단언한다.
- [ ] T027 `apps/mobile/assets/fonts/`에 글꼴 파일(Inter, Noto Sans KR, Noto Sans JP, 손글씨 Gaegu·Yomogi, Gowun Dodum, Zen Maru Gothic: `design/handoff.md` §5 5번 "권장 9파일")과 `OFL` 고지를 넣고 `apps/mobile/src/theme/fonts.ts`로 `expo-font` 로딩. 손글씨는 토큰 크기 ≥20 굵은 제목에만(`design/handoff.md` §3). **번들 크기는 EAS 산출물로 실측 필요(G6)** — 이 태스크는 파일 배치와 로딩만 → 수락: 로딩 전 스플래시 유지, 한글·일본어·라틴 글리프 픽스처 렌더 테스트가 누락 글리프 없이 통과.
- [ ] T028 [P] `tools/catalog/build-manifest.mjs`: `design/assets-manifest.csv`에서 **카탈로그 24개**(방 안 마스코트 포즈 6: `mascot_wave_main`, `mascot_cheer`, `mascot_lookup`, `mascot_walk`, `mascot_lie`, `mascot_sleep` + 일반 오브젝트 18: `obj_decor_{books,cushion,frame,lamp}`, `obj_keep_{gift,letter,mug}`, `obj_party_{balloon,cake,ribbon}`, `obj_plant_{flowerpot,potted}`, `obj_shape_{dots,sparkle,squiggle}`, `obj_sky_{cloud,moon,star}`)를 추려 `assets/catalog/manifest.json` 생성(`asset_id`, `catalog_version`, `asset_kind: room_object|mascot_pose`, `uri`, `format`, `width_px`, `height_px`, `byte_size`, `sha256`, `license_kind`, `rights_record_ref`, `status: active|retired`). 방 밖 일러스트 5종(`star_sit`,`box`,`heart`,`phone`,`back`)은 **넣지 않는다**. 장면의 마스코트 오브젝트는 `assetId: app_mascot` 하나이고 포즈 이미지 6장은 클라이언트가 고른다 → 수락: 항목 수 24, `asset_kind`별 6/18, 모든 `sha256`이 실제 파일과 일치(`assets/catalog/__tests__/manifest.test.mjs`).
- [ ] T029 `tools/catalog/build-placeholders.mjs`: `design/assets-sketch/obj_*.svg`(낮/밤 variant `obj_decor_lamp__night.svg` 포함)을 `assets/catalog/images/*@2x.png`(PNG-8, 에셋 최종 포맷은 G7에서 확정)로 변환 — **18개 일반 오브젝트는 자리표시 스케치**이고 최종 그림은 일러스트레이터 납품 후 교체(`design/assets-spec.md` §9). 마스코트 6포즈는 `design/mascot/harmonized/mascot_*@2x.png`를 복사 → 수락: 24개 이미지가 `assets/catalog/images/`에 있고 매니페스트 해시와 일치. 카탈로그 manifest는 `rights_record_ref`에 "placeholder-sketch-not-final"(오브젝트) / "ai-generated-master-used-as-is-risk-accepted"(마스코트, 닮음 검사·법률 검토는 출시 전 권장 G11)를 기록한다.
- [ ] T030 `apps/mobile/src/scene/catalog.ts`: 번들 `manifest.json`을 읽어 `getAsset(assetId)`(알 수 없는/은퇴 ID는 `null`), 마스코트 포즈 이미지 맵, 낮/밤 variant 선택 → 수락: `apps/mobile/src/scene/__tests__/catalog.test.ts`가 24개 로드, 알 수 없는 ID null, 은퇴 에셋 레거시 렌더 표시를 단언한다.
- [ ] T031 [P] `apps/mobile/src/lib/api.ts`(Supabase Functions 호출 래퍼: 모든 변경 요청에 `Idempotency-Key` UUID 생성·재시도 동일 키 사용), `apps/mobile/src/lib/errors.ts`(서버 오류 `code` → i18n 키 매핑 표 — `design/i18n-copy.md`의 대응 표를 `contracts/api.md` 코드 이름에 맞춰 확정, 결정 대기 항목 아님), `apps/mobile/src/lib/supabase.ts` → 수락: 단위 테스트가 (a) 같은 재시도에 같은 키, (b) 모든 오류 코드가 번역 키를 가짐을 단언한다.
- [ ] T032 `apps/mobile/src/app/` 라우트 뼈대(Expo Router): `(auth)/welcome.tsx`, `(auth)/login.tsx`, `(onboarding)/create-space.tsx`, `(onboarding)/invite.tsx`, `(onboarding)/join.tsx`, `(tabs)/_layout.tsx`(**시스템 탭 바 3개: 홈·방·설정**, 기록 탭 없음), `(tabs)/home.tsx`, `(tabs)/room.tsx`, `(tabs)/settings/index.tsx`. 비선택 탭 틴트를 반드시 지정(`design/handoff.md` §3) → 수락: `apps/mobile/src/app/__tests__/routes.test.tsx`가 탭 3개와 라우트 존재를 단언한다.
- [ ] T033 `apps/mobile/src/ui/`에 `design/components.md` §2~§8의 공용 컴포넌트: `Button`(primary/secondary/danger/dangerOutline/ghost), `TextField`, `Chip`, `Banner`(info·success·warn·danger·offline), `Toast`, `Skeleton`, `Dialog`, `BottomSheet`, `ListRow`, `OccupancyChip`. 터치 영역 ≥44pt, 접근성 이름, 대비는 T026 사용 → 수락: 스냅샷 + 접근성 테스트(`apps/mobile/src/ui/__tests__/*.test.tsx`)가 라벨·역할·터치 크기를 단언한다.
- [ ] T034 `apps/mobile/src/ui/motion.ts`: `useReducedMotion()`(iOS 동작 줄이기·Android 애니메이션 끔)과 순환 로더 `apps/mobile/src/ui/CycleLoader.tsx`(화분→풍선→창문→책, 4.8초 주기, 동작 줄이기에서는 첫 오브젝트 정지 그림, 전역 기본 로딩). 창문은 **로더 전용 그림**(`design/boards S03`의 스케치 `WINDOW_SVG`)이고 카탈로그에 넣지 않는다(카탈로그 24개 그대로; 결정·가정, `spec.md` Decided 25) → 수락: `CycleLoader.test.tsx`가 정상 순환·동작 줄이기 정지를 단언한다.

**체크포인트**: T001~T034 완료 시 앱이 빈 화면 라우트·번역·테마·글꼴·카탈로그·로더를 갖고, 서버에는 기본 스키마·RLS·공통 코드·검증기가 있다.

---

## Phase 3: User Story 1 — 커플 공간 만들고 D-day 확인하기 (P1)

**목표**: 로그인 → 연령 확인 문구 → 공간 만들기(함께한 날짜) → 초대 코드 공유 → 상대 수락 → 홈에서 같은 D-day 확인. (FR-001~FR-007, FR-057, FR-058)

**독립 테스트**: 두 사용자가 초대 코드로 같은 공간에 참여하고 같은 날짜 기준의 일수를 본다. 이미 공간이 있는 사용자의 수락은 거절되고 코드가 소모되지 않는다.

### 테스트 먼저 (실패 확인 후 구현)

- [ ] T035 [P] [US1] `supabase/tests/invitation.test.sql`(pgTAP)과 `supabase/functions/invitations/__tests__/invitations.test.ts`(Deno): ① 24시간 만료 거절 ② 한 번 수락된 코드 재사용 거절 ③ 위조 코드 거절(해시 불일치) ④ 두 명이 찬 뒤 제3 구성원 수락 거절 ⑤ 재발급 시 기존 미사용 코드 `revoked`(원자적) ⑥ **이미 다른 활성 공간의 구성원인 사용자의 수락은 `409 ALREADY_IN_SPACE`이고 코드는 `active`로 남아 공간에서 나온 뒤 같은 코드로 가입된다. 복구 대기(`recovery_pending`)만 있는 사용자의 수락은 허용된다(결정·가정 Decided 23)** ⑦ 코드 형식: 8자, 4-4 표시, 혼동 문자 `0 O 1 I` 제외, 원문은 응답에서 한 번만 → 수락: 구현 전 실패.
- [ ] T036 [P] [US1] `supabase/tests/create_space.test.sql`: `POST /spaces` 트랜잭션이 공간+첫 구성원을 함께 만들고, 이미 **활성** 공간 구성원인 사용자는 `ALREADY_IN_SPACE`, **복구 대기(`recovery_pending`, 픽스처로 직접 만든 상태)만 있는 사용자와 삭제(`deleted`) 뒤의 사용자는 새 공간 생성 가능**(결정·가정 Decided 23), 그리고 `GET /spaces/mine`이 (활성만 / 복구 대기만 / 둘 다 / 없음) 네 경우에 `active`·`ended`(`ended_at`이 가장 최근인 하나)를 맞게 돌려주고 비구성원 공간은 절대 담지 않음 → 수락: 구현 전 실패.
- [ ] T037 [P] [US1] `packages/scene-contract`가 아니라 `apps/mobile/src/lib/__tests__/dday.test.ts`와 `supabase/functions/_shared/__tests__/dday.test.ts`(같은 픽스처 `apps/mobile/src/lib/__fixtures__/dday.json` 공유): 함께한 날짜 **당일 = 1일째**, 방 시간대 자정 경계(예: `Asia/Seoul`·`America/Los_Angeles` 2개), 미래 날짜·존재하지 않는 날짜(2월 30일) 거절, ko/en/ja D-day 문구(어순·`Intl` 날짜) → 수락: 앱과 서버 결과가 같다는 단언 포함, 구현 전 실패.
- [ ] T038 [P] [US1] `apps/mobile/src/features/auth/__tests__/agegate.test.tsx`: 가입 시작 화면의 약관 줄이 키 `onb.legal.lead`("계속하면 만 14세 이상이며 아래 내용에 동의하는 것으로 봐요" 세 언어)와 `onb.legal.links`를 보여 주고, **생년월일 입력 필드가 없으며**, 서버로 생년월일을 보내지 않는다 → 수락: 구현 전 실패. 문구의 최종 확정은 법률 검토(G1)이므로 키 값만 바꾸면 반영되게 둔다.
- [ ] T039 [P] [US1] `supabase/tests/rls_snapshot.test.sql`: `GET snapshot` 용 뷰/함수가 구성원에게만 `anniversary_date`·구성원 수·초대 상태를 보여 주고 비구성원은 0행 → 수락: 구현 전 실패.

### 서버 구현

- [ ] T040 [US1] `supabase/migrations/20261101000400_invitation.sql`: `invitation`(`id`, `space_id`, `created_by_user_id`, `token_hash`(**코드 원문 저장 금지**), `status` check in (`active`,`accepted`,`expired`,`revoked`), `created_at`, `expires_at`(= created_at + 24h), `accepted_at`, `accepted_by_user_id`, `revoked_at`)와 RLS(구성원 읽기, 쓰기는 RPC로만). RPC `create_space(anniversary_date)`, `create_invitation(space_id)`(기존 활성 초대를 같은 트랜잭션에서 `revoked`), `accept_invitation(code)`(해시 대조·미만료·미사용·대상 공간 활성·멤버 1명·**호출자가 다른 공간 구성원이 아님**을 단일 트랜잭션에서 확인, 성공 시 코드 즉시 소비), `update_anniversary(space_id, date)`; 공간 종료·삭제가 아닌 상태에서만 → 수락: T035·T036의 DB 부분이 통과한다.
- [ ] T041 [P] [US1] `supabase/functions/_shared/inviteCode.ts`: 알파벳 `ABCDEFGHJKLMNPQRSTUVWXYZ23456789`에서 `0 O 1 I` 제외(CSPRNG), 8자를 4-4로 표시(`K7M4-Q9XP`), 입력 정규화(대소문자·하이픈·공백 무시), 해시는 SHA-256(+서버 pepper 비밀) → 수락: Deno 테스트가 형식·제외 문자·정규화·충돌 없음(10만 개 샘플)을 단언한다.
- [ ] T042 [US1] `supabase/migrations/20261101000450_invitation_attempts.sql`과 `supabase/functions/invitations/index.ts`에서 **코드 입력 시도 제한**(사용자당 시간당 실패 N회 후 429; N=10은 구현 가정, 값은 서버 설정) — 8자 코드의 무차별 대입 방지 → 수락: Deno 테스트가 N+1번째 실패 시도가 `429`이고 정상 코드도 잠금 동안 거절되는 것을 단언(잠금 해제 시각 포함).
- [ ] T043 [US1] `supabase/functions/spaces/index.ts`: `POST /spaces`, `GET /spaces/mine`(제안: 앱이 열 때 들어갈 공간을 정한다 — 빈칸이어서 추가), `GET /spaces/{id}/snapshot`(복구 대기 공간이면 `lifecycle`만 반환), `PATCH /spaces/{id}/anniversary`(응답에 `milestonesReset` 필드 자리 — US7에서 채움). 공통 코드(T021)를 쓰고 `ALREADY_IN_SPACE`를 `409`로 반환 → 수락: T036·T039가 통과한다.
- [ ] T044 [US1] `supabase/functions/invitations/index.ts`: `POST /spaces/{id}/invitations`(요청 `{expiresInSeconds:86400}`는 무시하고 서버가 24시간 고정; 응답 201 `{invitationId, code, expiresAt}`), `POST /invitations/accept`(요청 `{code}`, 응답 200 `{spaceId, status:'active', memberCount:2}`, 실패 시 코드 소모 안 함) → 수락: T035가 통과한다.
- [ ] T045 [P] [US1] `supabase/functions/profile/index.ts`: `GET /profile/preferences`(현재 `{locale, uiTheme}` 반환; 스냅샷이 "프로필 설정 API로 읽고 저장"한다고 했으나 읽기 엔드포인트가 계약에 없어 이 태스크에서 `contracts/api.md`에 추가함)와 `PATCH /profile/preferences`(요청 `{locale: 'ko-KR'|'en-US'|'ja-JP'|null, uiTheme: 'system'|'light'|'dark'}`; `null`은 기기 언어, 지원 locale 목록은 앱 번역 리소스 manifest와 일치). 공유 장면이 사용자 개인 설정을 바꿀 수 없다 → 수락: 허용 외 locale·uiTheme 거절 테스트 통과.
- [ ] T046 [P] [US1] 이메일 OTP(6자리 코드 기본, 메일 링크도 허용)·카카오·Apple OAuth를 Supabase Auth로 설정: `supabase/config.toml`(로컬), `docs/auth-setup.md`(원격 프로젝트에서 소유자가 해야 할 일: Kakao Developers 앱·Redirect URI·동의항목, Apple Services ID·redirect domain, Expo universal link). **카카오·Apple 공식 SDK/에셋 교체는 G5** → 수락: 로컬에서 이메일 OTP로 가입·로그인되는 통합 테스트 `supabase/functions/_shared/__tests__/auth.int.test.ts` 통과.

### 앱 구현

- [ ] T047 [US1] `apps/mobile/src/app/(auth)/welcome.tsx`와 `apps/mobile/src/features/auth/Welcome.tsx`: 소개 3장(함께한 날 세기 · 프롬프트로 방 꾸미기 · 마스코트 — 3번째 장이 앱 전체에서 **유일한** 캐릭터 히어로), 이름·슬로건 묶음(`brand.tagline`, 글자 크기 130% 이상에서 숨김), 약관 줄(T038 통과 조건), `이미 계정이 있어요` 경로. 모든 문자열은 `t('onb.*')` 키 → 수락: T038가 통과하고 lint(no-literal-string)가 통과한다.
- [ ] T048 [US1] `apps/mobile/src/app/(auth)/login.tsx`, `email-code.tsx`, `apps/mobile/src/features/auth/`: 카카오·Apple·이메일 선택(최근 사용 방법 강조), 이메일 6자리 코드 입력·재전송·만료·시도 과다 상태, OAuth 이동·복귀·취소·재시도, 처리 중은 T034의 순환 로더. 카카오·Apple 버튼은 **자리표시 컴포넌트**(G5에서 공식 에셋으로 교체) → 수락: `apps/mobile/src/features/auth/__tests__/login.test.tsx`가 상태별 화면(처리 중·취소·오류)을 단언한다.
- [ ] T049 [US1] `apps/mobile/src/app/(onboarding)/create-space.tsx`: 함께한 날짜 입력 — **3열 휠(달력 아님)**, 미래 날짜·존재하지 않는 날짜 검증 메시지, 방 시간대 안내(생성자 IANA 시간대로 초기화), 생성 중·성공·연결 오류. 이미 공간이 있으면 `ALREADY_IN_SPACE` 안내(`join.hasSpace.*`) → 수락: `create-space.test.tsx`가 유효성·오류 매핑을 단언.
- [ ] T050 [US1] `apps/mobile/src/app/(onboarding)/invite.tsx`: 코드 생성 중, 8자 코드(4-4)와 만료 시각(24시간), OS 공유 시트·복사, 만료 임박·만료됨, 재발급(기존 미사용 코드 폐기 안내), 공유 취소, 네트워크 오류, 상대 대기(떠다니는 편지 모션 3.2초, 동작 줄이기에서 정지). 서버 코드는 화면 밖 로그에 남기지 않는다 → 수락: `invite.test.tsx`가 만료·재발급 상태 전이를 단언.
- [ ] T051 [US1] `apps/mobile/src/app/(onboarding)/join.tsx`: 코드 입력(붙여넣기 제공, 8자 4-4 마스크), 확인, 초대 상대·공간 확인 후 수락, 오류 6종(만료·사용됨·유효하지 않음·인원 초과·이미 다른 공간 `join.hasSpace.*`·시도 과다). `이미 다른 공간에 있어요` 배너 + "지금 공간 보기" → 수락: `join.test.tsx`가 각 오류 코드→번역 키 매핑과 `ALREADY_IN_SPACE`에서 입력값이 유지됨을 단언.
- [ ] T052 [US1] `apps/mobile/src/lib/dday.ts`(앱)·`supabase/functions/_shared/dday.ts`(서버): T037 통과 구현. `apps/mobile/src/features/home/HomeScreen.tsx`와 `apps/mobile/src/app/(tabs)/home.tsx`: 함께한 일수(풍선·리본 일러스트), 날짜 편집(3열 휠), 초대 미완료 상태, 두 사람 참여 상태, 로딩·동기화 오류·오프라인(마지막 상태 읽기 전용). 홈 위쪽 사진 자리는 기본 바탕(사진 기능은 US6) → 수락: T037 통과, `HomeScreen.test.tsx`가 상태별 렌더를 단언.
- [ ] T053 [US1] `apps/mobile/src/features/space/useSpaceSnapshot.ts`: 앱을 열 때 `GET /spaces/mine`으로 들어갈 공간(활성 → 없으면 가장 최근 종료 공간의 종료 화면 → 없으면 공간 만들기)을 정하고, 앱을 열 때·포그라운드 복귀 때 `GET snapshot` 호출 + Supabase Realtime 구독(채널은 구성원인 `space_id`만, payload에는 변경 종류와 ID만)으로 초대자가 최신 구성원 상태를 보게 한다 → 수락: 두 클라이언트 모의 테스트에서 수락 후 초대자 화면이 `memberCount:2`로 바뀐다.

**체크포인트**: US1이 단독으로 동작·검증 가능(두 기기 또는 두 에뮬레이터).

---

## Phase 4: User Story 4 — 공유 프롬프트 세션 이어가기 (P1, 방 꾸미기 apply의 선행 조건)

**목표**: 공간당 한 명만 점유(lease), 상대는 실시간 읽기 전용, 만료·takeover. (FR-030, FR-031) US2의 confirm/undo가 이 점유를 쓰므로 US2보다 먼저 만든다.

**독립 테스트**: 두 기기에서 동시 acquire 중 한 명만 성공, 비점유자 읽기 전용, 3분 유휴 만료 후 takeover.

### 테스트 먼저

- [ ] T054 [P] [US4] `supabase/tests/prompt_session.test.sql`(pgTAP, 고정 시계 주입 함수 `app_now()`): ① 동시 acquire 두 건 중 정확히 하나만 `occupied`, 다른 하나는 `SESSION_OCCUPIED`+owner/expiry ② heartbeat는 **최근 사용자 활동이 있을 때만** `expires_at`을 서버 시각 + 3분으로 연장 ③ heartbeat가 멈추면 3분 후 `expired` ④ takeover는 `expectedOwnerUserId`와 만료를 원자적으로 비교(유효한 lease면 `SESSION_OCCUPIED`) ⑤ `release` 사유 `cancel`/confirm 시 해제 ⑥ 비구성원·종료 공간은 거부 → 수락: 구현 전 실패.
- [ ] T055 [P] [US4] `supabase/functions/prompt-session/__tests__/conversation.test.ts`: 두 구성원 모두 `GET prompt-conversation`으로 메시지(`kind: user_prompt|preview|status`)를 시간순으로 읽고 제3자는 403, Realtime payload는 **메시지/미리 보기 ID와 상태만**(내용 없음) → 수락: 구현 전 실패.
- [ ] T056 [P] [US4] `apps/mobile/src/features/prompt/__tests__/session.test.tsx`: 점유 중인 상대의 화면은 입력·제출·적용이 비활성이고 점유자 표시·만료 예정 칩이 보이며, 점유자는 만료 30초 전 경고(`prompt.idleHint` 계열 키)를 보고, 앱이 백그라운드가 되면 heartbeat를 보내지 않는다(가짜 타이머) → 수락: 구현 전 실패.

### 구현

- [ ] T057 [US4] `supabase/migrations/20261101000500_prompt_session.sql`: `prompt_session`(`id`, `space_id`, `owner_user_id`, `status` check in (`occupied`,`released`,`expired`), `acquired_at`, `last_activity_at`, `expires_at`, `heartbeat_at`, `released_at`, `release_reason`, `takeover_count`; **공간당 `occupied` 한 행만**: 부분 고유 인덱스 `unique (space_id) where status='occupied'`), `prompt_message`(`id`, `space_id`, `session_id`, `decoration_request_id`, `author_user_id`, `kind` check in (`user_prompt`,`preview`,`status`), `body_text`, `created_at`)와 RLS(구성원만). RPC `acquire_session`, `heartbeat_session`, `takeover_session`, `release_session`(모두 `security definer`, 서버 시각 `app_now()` 사용). 유휴 시간 3분·경고 30초는 `app_settings` 테이블 값(서버 설정값) → 수락: T054가 통과한다.
- [ ] T058 [US4] `supabase/functions/prompt-session/index.ts`: `GET /spaces/{id}/prompt-conversation`, `POST …/prompt-session/acquire`(201 `{sessionId, ownerUserId, expiresAt}` / 409 `SESSION_OCCUPIED`), `…/{sessionId}/heartbeat`, `…/takeover`(`{expectedOwnerUserId, idempotencyKey}`), `…/release`(`{reason:'cancel'}`, 204). 변경 요청은 모두 `Idempotency-Key` 처리 → 수락: T055가 통과한다.
- [ ] T059 [US4] `supabase/migrations/20261101000550_realtime_auth.sql`: Realtime 채널 인가 — 인증 주체가 구성원인 `space_id`의 채널만 구독 가능, payload에는 현재 방 버전 ID/번호·변경 종류·변경자·시각·session owner/expiry·message/preview ID만(내용 금지) → 수락: `supabase/tests/realtime_auth.test.sql`에서 제3자 구독이 거부된다.
- [ ] T060 [US4] `apps/mobile/src/features/prompt/useSession.ts`(acquire/heartbeat 타이머(포그라운드·입력 활동 때만)/takeover/release, 만료 30초 전 경고 이벤트), `apps/mobile/src/ui/OccupancyChip.tsx` 사용, 비점유자 읽기 전용 모드(`design/components.md` §3.2·§7), takeover 흐름(`prompt.takeover.*` 키) → 수락: T056가 통과한다.

**체크포인트**: 방 편집 없이도 두 기기에서 점유·읽기 전용·만료·takeover가 검증된다.

---

## Phase 5: User Story 2 — 프롬프트로 둘만의 방 꾸미기 (P1)

**목표**: 고정 마스코트가 있는 방 → 동의 → 프롬프트 → 검증된 미리 보기 → 점유자만 적용(되돌릴 수 없음 확인) → 두 사람에게 같은 방. 열린 대화 안 되돌리기, 하루 5회 한도, 마스코트 되살림. (FR-008~FR-018c, FR-025~FR-031)

**독립 테스트**: 서로 다른 프롬프트가 서로 다른 미리 보기를 만들고, 동의 없으면 AI 호출 0회, 6번째 요청은 429, 적용은 점유자만, 적용 뒤 undo는 `ALREADY_APPLIED`.

> **MVP 데모 조각은 이 단계가 끝나면 완성된다(아래 "MVP 컷 라인").**

### 테스트 먼저

- [ ] T061 [P] [US2] `supabase/functions/decoration-previews/__tests__/previews.test.ts`(Anthropic **provider spy**/mock 사용): ① **동의 없는 계정·한 사람만 동의한 커플·철회한 사용자·종료 공간**에서 요청 → 네트워크 호출 0회 ② 정상·부적절·금지 IP 지칭·prompt injection·잘못된 JSON·폐기된 ID·보호 영역 충돌 응답 mock ③ repair **최대 1회**(성공/실패 각각) ④ **하루 5번째 요청 허용·6번째 `429 DAILY_LIMIT_REACHED`**, 병렬 요청에서도 초과 불가, 방 시간대 자정 이후 초기화, 마일스톤 제안은 계수 안 함 ⑤ 모델에 **날짜 원본·이메일·카카오 식별자·초대 코드·계정 세부를 보내지 않음**(spy가 받은 payload 검사) ⑥ 마스코트를 바꾸라는 프롬프트(`옷·색·표정·교체·새로 그리기`)는 `422 UNSUPPORTED_REQUEST`로 거절 ⑦ 오류·로그에 키·원문 없음 → 수락: 구현 전 실패.
- [ ] T062 [P] [US2] `supabase/functions/decoration-previews/__tests__/confirm.test.ts` + `supabase/tests/confirm.test.sql`: ① 점유자만 confirm ② confirm = 새 불변 버전 저장 + current pointer 이동 + lease 해제가 **한 트랜잭션** ③ 같은 `Idempotency-Key` 재시도는 한 번만 적용 ④ stale `baseVersion`·동시 apply는 `409 VERSION_CONFLICT`/`SESSION_CONFLICT`, 중복 저장 없음 ⑤ cancel은 공유 방을 바꾸지 않고 lease 해제 ⑥ preview 직후 강제 종료해도 current version 불변 ⑦ **적용된 요청의 undo는 `409 ALREADY_APPLIED`** → 수락: 구현 전 실패.
- [ ] T063 [P] [US2] `supabase/functions/prompt-session/__tests__/undo.test.ts`: 열린 대화의 최신 미리 보기를 `reverted`로 바꾸고 바로 앞 미리 보기(없으면 `previewId:null` = 현재 방 보기) 반환, 방 버전 불변, **lease 유지**, 되돌릴 후보 없으면 `409 NOTHING_TO_UNDO`, 이미 바뀌었으면 `409 PREVIEW_CHANGED`, 연속 undo는 이 대화의 미리 보기 범위에서 멈춤, 두 구성원이 같은 미리 보기를 봄 → 수락: 구현 전 실패.
- [ ] T064 [P] [US2] `supabase/functions/room/__tests__/mascot_recall.test.ts`: 마스코트가 없을 때만 기본 자리에 1개 추가한 새 방 버전(`source: mascot_recall`), 이미 있으면 200 멱등, 16개 가득이면 `422 ROOM_FULL`, 점유 세션이 활성이면 `409 SESSION_OCCUPIED`, 오래된 `expectedVersion`은 `409 VERSION_CONFLICT`, AI·점유·미리 보기 없이 동작 → 수락: 구현 전 실패.
- [ ] T065 [P] [US2] `apps/mobile/src/features/room/__tests__/room.test.tsx`: 새 방 첫 열기에 마스코트 1개, 방 도구 막대는 "꾸미기" 하나뿐(설정·삭제·나가기는 설정 탭 안), D-day 블록은 별도 네이티브 뷰이고 프롬프트로 위치·모양·색·크기만 바뀌며 날짜 값은 안 바뀜, 방에서 제거해도 홈 D-day 유지, 마스코트 제거 시 "모피 다시 부르기" 컨트롤(점유 중인 상대가 있으면 비활성+이유), 동작 줄이기에서 서서 인사 정지 포즈 → 수락: 구현 전 실패.
- [ ] T066 [P] [US2] `apps/mobile/src/features/prompt/__tests__/panel.test.tsx`: 입력 → 제출 → 미리 보기 → **적용 확인 다이얼로그에 "적용한 뒤에는 되돌릴 수 없어요"(키 `preview.confirm.*`)가 보이고 확인해야만 confirm 호출** → 적용 후 되돌리기 버튼 없음, 취소, 미리 보기 되돌리기(열린 대화 안), 동의 필요 상태, 하루 5회 소진 상태(`prompt.quota.title/body`, "하루 5번까지"), 오프라인(입력 비활성·큐 없음·"인터넷에 연결되어야 꾸밀 수 있어요"), 키보드 완료 키 = **줄바꿈**(보내기는 버튼으로만) → 수락: 구현 전 실패.

### 서버 구현

- [ ] T067 [US2] `supabase/migrations/20261101000600_room.sql`: `asset_catalog_entry`(`asset_id` PK, `catalog_version`, `asset_kind` check in (`room_object`,`mascot_pose`), `uri`, `format`, `width_px`, `height_px`, `byte_size`, `sha256`, `license_kind`, `license_text_version`, `creator`, `rights_record_ref`, `status` check in (`active`,`retired`)), `room_theme`(`space_id` PK, `current_version_id`, `version_counter`, `updated_at`, `updated_by_user_id`), `room_theme_version`(`id`, `space_id`, `version_number` 공간 내 고유 증가, `schema_version`, `scene_document jsonb`(카탈로그 오브젝트+텍스트만), `room_presentation jsonb`, `room_theme_document jsonb`(방 모드 `day|night|follow_time`, IANA `timeZone`), `source` check in (`initial`,`prompt`,`manual_migration`,`mascot_recall`,`milestone_preset`,`room_mode`), `provenance`(`model_provider`,`model_id`,`model_snapshot`,`request_id`,`created_at`,`created_by_user_id`), `content_hash`; **확정 후 불변(update/delete 금지 트리거)**), `decoration_request`(`id`, `space_id`, `session_id`, `requested_by_user_id`, `base_version_id`, `base_version_number`, `prompt_text`, `source` check in (`ai`,`milestone_preset`), `state` check in (`queued`,`generated`,`rejected`,`previewed`,`reverted`,`applied`,`cancelled`,`expired`,`failed`), `result_candidate jsonb`, `failure_code`, `repair_count` check ≤ 1, `created_at`, `expires_at`, `applied_version_id`). 카탈로그 24개를 `supabase/seed/catalog.sql`로 적재(T028 매니페스트에서 생성) → 수락: `supabase/tests/room_schema.test.sql`이 버전 불변·`repair_count ≤ 1`·`state` 값 제한을 단언한다.
- [ ] T068 [US2] `supabase/migrations/20261101000650_init_room.sql`: `create_space` RPC가 같은 트랜잭션에서 초기 방 버전(`source: initial`, **`app_mascot` 정확히 1개** 기본 배치, `room_theme_document.mode = 'follow_time'`, `timeZone` = 생성자 IANA)을 만들도록 수정하고, 이미 있는 공간에는 `ensure_initial_room(space_id)` 백필 함수 제공 → 수락: pgTAP이 새 공간의 초기 장면이 T013 스키마를 통과함(서버 측 같은 검증기)을 단언한다.
- [ ] T069 [US2] `supabase/functions/_shared/sceneValidate.ts`(Deno): `@couple/scene-contract`의 `validateScene/Theme/Presentation`과 보호 영역 검사를 Deno에서 import해 쓰고 T016 공용 픽스처로 앱과 같은 결과를 단언하는 `supabase/functions/_shared/__tests__/parity.test.ts` 작성 → 수락: 앱·서버 결과 동일.
- [ ] T070 [P] [US2] `supabase/functions/ai-consent/index.ts`: `PUT /spaces/{id}/ai-consent`(`{state:'granted'|'revoked', noticeVersion:'ai-overseas-v1'}`), 인증 사용자 본인 동의만 기록, 상태 변경 감사 이벤트, **철회 시 대기 요청과 미적용 preview 무효화**. AI 요청은 **두 구성원 모두 `granted`일 때만** 허용 → 수락: T061 ①이 통과한다.
- [ ] T071 [US2] `supabase/functions/_shared/anthropic.ts`: Claude Messages API **구조화 출력** 호출 래퍼. 키는 `Deno.env.get('ANTHROPIC_API_KEY')`(서버 비밀)만 사용, 로그에 키·프롬프트·모델 원문 금지. 모델 정책: **기본 Haiku 5.5**(`claude-haiku-5-5`), 품질 실패 사례에 한해 **Sonnet 5.5**(`claude-sonnet-5-5`)로 제한 승급 — 승급 기준은 실제 prompt fixture 결과로 정하므로(G8) 승급은 설정 플래그 `AI_ESCALATE_TO_SONNET=false`가 기본인 **훅**으로만 만든다. 요청에는 프롬프트 + 최소한의 현재 scene JSON, 낮/밤 허용 토큰, D-day 표현 허용 토큰, 장면 검증 규칙만 넣는다(날짜 원본 금지) → 수락: T061 ⑤⑦이 통과한다.
- [ ] T072 [US2] `supabase/functions/decoration-previews/index.ts`: `POST /spaces/{id}/decoration-previews`(요청 `{prompt, sessionId, baseVersion, idempotencyKey}`; 순서: 구성원·활성 공간·**두 사람 동의**·**일일 한도(`increment_daily_request`, 5)**·유효 session owner·현재 버전·프롬프트 길이 → T071 → T013+보호 영역+카탈로그 ID 검증 → repair 최대 1회 → `decoration_request`·`prompt_message` 저장 → Realtime(ID·상태만)), 응답 201 `{previewId, baseVersion, sceneDocument, roomPresentation, roomThemeDocument, expiresAt, validation}`; `422 UNSUPPORTED_REQUEST`/`422 INVALID_CANDIDATE`; **프롬프트가 데이터·기능·권한·고정 컨트롤을 변경하려 하면 거절**(FR-014, FR-015), 마스코트 모습 변경 거절(FR-018) → 수락: T061가 통과한다.
- [ ] T073 [US2] 같은 함수 폴더에서 `POST …/{previewId}/confirm`(요청 `{baseVersion, sessionId, idempotencyKey}`)과 `DELETE …/{previewId}?sessionId=`: DB RPC `confirm_preview`로 점유자·preview·유효기간·base version 확인, idempotency 처리, 새 불변 버전 저장, `room_theme.current_version_id` 이동, lease 해제를 **한 트랜잭션**으로 수행. 응답 201 `{appliedVersion, source:'prompt', updatedAt}`. cancel은 후보를 반영하지 않고 lease 해제 → 수락: T062이 통과한다.
- [ ] T074 [US2] `supabase/functions/prompt-session/index.ts`에 `POST …/{sessionId}/undo`(요청 `{expectedPreviewId, idempotencyKey}`) 추가: 최신 미리 보기를 `reverted`로 바꾸고 앞 후보 반환, lease·방 버전 불변, 적용된 요청은 `ALREADY_APPLIED` → 수락: T063가 통과한다.
- [ ] T075 [US2] `supabase/functions/room/index.ts`: `POST /spaces/{id}/room/mascot-recall`(요청 `{expectedVersion, idempotencyKey}`) 구현 → 수락: T064이 통과한다.
- [ ] T076 [P] [US2] `supabase/functions/lifecycle-sweep/index.ts`(스케줄 실행 `pg_cron` 또는 Supabase Scheduled Function, 재실행 가능): 취소/만료·미적용 후보와 `prompt_message`는 **24시간 후 삭제**, 적용된 prompt/status 메시지는 **30일 후 삭제** → 수락: 고정 시계 Deno 테스트가 경계(24시간·30일)에서 삭제하고 재실행해도 결과가 같음을 단언.
- [ ] T077 [P] [US2] `supabase/functions/decoration-previews/__fixtures__/prompts.json`: 서로 다른 꾸밈 의도 프롬프트 10개(ko/en/ja 포함)와 기대 속성(SC-003 검증용; 목표 수치는 임시 가정) + 승급 기준 평가 스크립트 `tools/ai/eval-fixtures.mjs`(실제 키 없이 mock 모드, 키가 있을 때만 호출) → 수락: mock 모드에서 스크립트가 실행되고 보고서를 출력한다. 실제 호출 평가와 승급 기준 확정은 출시 게이트 G8.

### 앱 구현

- [ ] T078 [US2] `apps/mobile/src/scene/RoomScene.tsx`(Skia 캔버스: 장식 오브젝트·텍스트, 낮/밤 variant, 회전·레이어), `apps/mobile/src/scene/protectedZones.ts`(T014의 보호 영역을 실제 측정값(시스템 안전 영역 + 방 도구 막대 + D-day 위젯 + 시스템 탭 바)으로 계산, 글자 확대 시 재계산), 장식은 hit target을 가로채지 않는다(`pointerEvents="none"`), D-day·고정 컨트롤은 네이티브 접근성 트리에 남는다 → 수락: `apps/mobile/src/scene/__tests__/render.test.tsx`가 보호 영역 침범 노드 비침범·접근성 트리 유지를 단언.
- [ ] T079 [US2] `apps/mobile/src/scene/MascotRoam.tsx`: 전체 크기 방 화면에서 포즈 이미지 6장을 **40초 주기**로 인사→걷기→신나게 인사→올려다보기→엎드리기→잠자기→걸어 돌아와 인사 반복(걷기 구간 좌우 반전·위아래 흔들림), 누르는 동안 `mascot_cheer`, **동작 줄이기에서는 서서 인사(`mascot_wave_main`) 정지 포즈**, 축소된 방(방 카드·미리 보기 축소)에서는 정지 포즈. 포즈는 앱이 정하며 서버·장면 데이터에 저장하지 않는다(`design/interaction-notes.md` §11) → 수락: `MascotRoam.test.tsx`(가짜 타이머)가 주기·정지 조건을 단언.
- [ ] T080 [US2] `apps/mobile/src/app/(tabs)/room.tsx`, `apps/mobile/src/features/room/RoomScreen.tsx`: 방 장면 + 네이티브 D-day 위젯(`design/components.md` §8) + 방 도구 막대(위쪽, "꾸미기" 하나), 로딩·오프라인 읽기 전용(꾸미기 비활성 배너)·동기화 오류, **"모피 다시 부르기" 고정 컨트롤**과 방을 다시 열 때(점유자 없을 때) 자동 1회 `mascot-recall` 호출(**정확한 자동 시점은 가정 — 조정 가능**, 한 곳 `apps/mobile/src/features/room/recallPolicy.ts`에 둠) → 수락: T065가 통과한다.
- [ ] T081 [P] [US2] `apps/mobile/src/app/prompt/consent.tsx`, `apps/mobile/src/features/consent/ConsentScreen.tsx`: 해외 AI 처리 동의(처리 주체·전송 데이터·목적·보관 안내 키 `consent.*`; **보관 기간 문구는 `[법무 확인 후 입력]` 자리표시 — G1**), 구성원별 동의/철회, 동의 전·철회 후 프롬프트 전송 차단 → 수락: `consent.test.tsx`가 동의 전 제출 비활성과 철회 시 미적용 preview 폐기 표시를 단언.
- [ ] T082 [US2] `apps/mobile/src/app/prompt/index.tsx`(모달 시트, 탭 바를 덮음), `apps/mobile/src/features/prompt/PromptPanel.tsx`: 공유 대화·미리 보기, 점유 상태 6가지(비어 있음/내가 점유/상대 점유(쓰는 중·만드는 중)/내 점유 만료 임박/내 점유 만료/상대 만료 후 이어받기), 이어받기 경합, 동의 필요, **하루 5회 소진**, 오프라인, 미지원 요청, 실패·재시도, 되돌리기(열린 대화 안, 키 `undo.*`), 적용 확인 다이얼로그(**"적용한 뒤에는 되돌릴 수 없어요"**). 입력칸 완료 키 = 줄바꿈, 보내기는 버튼으로만. 마스코트 꾸미기 UI(탭·슬롯·팔레트)는 **없다** → 수락: T066가 통과한다.
- [ ] T083 [US2] `apps/mobile/src/features/room/useRoom.ts`: 방 버전 동기화(앱 열기·포그라운드 복귀·Realtime 알림 후 재조회), 오프라인에서는 마지막 확정 방·D-day 읽기 전용, **오프라인 편집·AI·confirm 요청을 큐에 쌓아 나중에 자동 적용하지 않는다**(명확한 온라인 안내) → 수락: `useRoom.test.tsx`가 오프라인 동작과 재연결 후 최신 버전 반영을 단언.

**체크포인트**: 두 기기에서 점유 → 프롬프트 → 미리 보기 → 적용 → 양쪽 동일 방이 확인된다 = **MVP 데모 조각 완성**.

---

## Phase 6: User Story 3 — 언어 및 표시 테마 설정 (P1)

**목표**: 기기 언어로 시작, 앱 내 언어 선택, 방 낮/밤 모드(day·night·follow_time)와 시간대, 앱 light/dark를 독립 설정. (FR-019, FR-020)

**독립 테스트**: 기기 언어 감지·앱 내 변경·긴 번역문·day/night × light/dark 4조합의 대비·보호 영역.

### 테스트 먼저

- [ ] T084 [P] [US3] `apps/mobile/src/features/settings/__tests__/language.test.tsx`: 기기 언어 `ko-KR/en-US/ja-JP`로 첫 실행 → 해당 리소스·날짜·숫자·D-day, 설정에서 다른 언어 선택 → **모든 UI 문자열이 바뀜**(키 누락 시 실패), pseudo-localization(+40% 길이)·큰 글자·좁은 화면에서 clipping 없음과 고정 컨트롤이 가려지지 않음, 사용자가 쓴 방 문구는 번역·변경되지 않음, 서버 오류는 코드만 와서 현재 locale 문구가 선택됨 → 수락: 구현 전 실패.
- [ ] T085 [P] [US3] `apps/mobile/src/features/settings/__tests__/themes.test.tsx`: day/night × light/dark 4조합 각각에서 본문 4.5:1·큰 글자 3:1 대비(T026 토큰 사용), 장면·마스코트·텍스트·D-day·입력 패널·고정 버튼의 보호 영역·터치 영역 → 수락: 4조합 모두 통과.
- [ ] T086 [P] [US3] `apps/mobile/src/features/settings/__tests__/followTime.test.ts`: `follow_time`은 방 `timeZone`의 현지 시각으로 낮/밤 variant 선택(경계 시각·시간대 변경·DST 포함 픽스처), 새 공간의 기본은 `follow_time` + 생성자 시간대, 수동 `day`/`night`와 시간대 변경 → 수락: 구현 전 실패.

### 구현

- [ ] T087 [US3] `supabase/functions/spaces/index.ts`에 `PATCH /spaces/{id}/room-mode`(요청 `{mode: 'day'|'night'|'follow_time', timeZone, expectedCurrentVersion, idempotencyKey}`) 추가: **공유 설정이라 서버 필요**(오프라인에서는 앱이 잠금), 변경은 **새 방 버전**으로 저장(`source: room_mode` — 데이터 모델에 이 값을 더했음, T067 참고), 옛 `expectedCurrentVersion`은 `409 VERSION_CONFLICT` → 수락: pgTAP/Deno 테스트가 구성원만 변경, 잘못된 IANA 시간대 거절, 버전 충돌을 단언.
- [ ] T088 [US3] `apps/mobile/src/app/(tabs)/settings/index.tsx`, `apps/mobile/src/features/settings/`: 설정 루트(계정·방·이 기기·정보) 섹션, **언어 시트**(앱 언어), **시간대·방 낮/밤 모드**(오프라인에서는 잠금+이유, 이 기기 화면 설정은 항상 가능), **앱 모양**(`system|light|dark`, 기본 `system`, 고대비는 OS 설정을 따름), 글꼴·오픈소스 라이선스 푸시(`lic.*`) → 수락: T084·T085·T086가 통과한다.
- [ ] T089 [P] [US3] `apps/mobile/src/features/settings/followTime.ts`: 방 낮/밤 선택 순수 함수(`Intl` 기반) + 앱 UI 모드와 독립 → 수락: T086가 통과한다.

**체크포인트**: P1 스토리 전체(US1·US4·US2·US3) 완료 = **P1 완성 컷**.

---

## Phase 7: User Story 5 — 커플 공간 종료와 복구, 연결 끊기, 신고 (P2)

**목표**: 어느 구성원이든 공간을 종료하고 30일 안에 복구할 수 있으며 30일이 지나면 삭제된다. 복구 대기 중에도 새 공간을 만들 수 있고("한 공간만"은 활성 공간만 센다), 복구는 두 사람 중 누구라도 다른 활성 공간에 있으면 막힌다. 연결 끊기로 끝난 공간은 끊은 사람만 복구한다(결정·가정, `spec.md` Decided 23·24). **연결 끊기**(예전 "차단")는 같은 종료·복구 메커니즘에 상대의 접근 차단을 더하고 결과를 분명히 알린다. **신고**는 별개 기능이다. (FR-022~FR-024, FR-059)

**독립 테스트**: 종료 → 30일 안 복구 → 30일 경계 삭제의 상태 전이를 고정 시계로 검증하고, 복구 대기 중 새 공간 → 복구 막힘 → 새 공간 종료 후 복구, 연결 끊기 뒤 끊긴 쪽의 복구 거부를 확인하고, 연결 끊기 확인 창이 결과를 말하는지, 신고가 연결 끊기 없이 접수되는지 확인한다.

### 테스트 먼저

- [ ] T090 [P] [US5] `supabase/tests/lifecycle.test.sql`과 `supabase/functions/spaces/__tests__/end_recover.test.ts`(고정 시계 `app_now()`): ① 종료 즉시 `recovery_pending`, `delete_after` = 서버 시각 + 30일, 새 초대·편집·AI·사진 업로드 차단 ② 30일 안 구성원 복구 → `active`, 보관 데이터(방 버전·사진·마일스톤 기록) 그대로 ③ 30일 시각 경계 직전/직후 배치 삭제(`deleted`, 공간 관련 복구 대상 데이터와 홈 커버 사진 객체 삭제, 재실행해도 결과 동일, 시간대 영향 없음) ④ 복구 대기 중에도, 삭제 뒤에도 해당 사용자가 새 공간을 만들 수 있음(FR-057, 결정·가정 Decided 23; 세부는 T092) ⑤ 종료 이벤트·종료자·만료 시각 저장 → 수락: 구현 전 실패.
- [ ] T091 [P] [US5] `supabase/functions/spaces/__tests__/block.test.ts`: `POST /spaces/{id}/block`(**화면 이름은 연결 끊기, 엔드포인트 이름은 `block` 유지**) 호출 시 공간이 `recovery_pending`(종료 이유 `disconnect`, 이벤트 `disconnected`)이 되고, **상대의 읽기·쓰기가 즉시 막히며**(RLS), 30일 안에 복구 가능, 신고 행은 만들어지지 않음, 비구성원은 403 → 수락: 구현 전 실패. (복구를 누가 할 수 있는지는 T092에서 검증한다: 연결을 끊은 사람만, 결정·가정 Decided 24.)
- [ ] T092 [P] [US5] `supabase/tests/restore_rules.test.sql`(pgTAP)과 `supabase/functions/spaces/__tests__/recover.test.ts`(Deno, 고정 시계 `app_now()`): ① **복구 대기 중 새 공간 허용**: A가 S1을 종료(`recovery_pending`) → A는 `POST /spaces`로 S2를 만들 수 있고 B는 다른 초대 코드로 S3에 가입할 수 있음 ② **복구 막힘**: A가 S2(활성)에 있으면 A·B 누구의 `POST /spaces/S1/recover`도 `409 RESTORE_BLOCKED_OTHER_SPACE`이고 S1은 `recovery_pending`·두 구성원 `space_active=false` 그대로이며 응답에 "누가" 쓰는지 정보가 없음, B만 S3에 있어도 A의 복구가 막힘(두 구성원 모두 검사), 보통 종료(`ended`)와 연결 끊기(`disconnect`) 모두 같음 ③ S2를 종료한 뒤 `delete_after` 안에는 S1 복구 성공(두 구성원 `space_active=true`, `ended_at`·`delete_after`·`ended_reason`·`ended_by_user_id` 비움, 이벤트 `recovered`와 actor) ④ **연결 끊기 복구 권한**: `disconnect`로 끝난 S1은 끊은 사람만 복구 200, 끊긴 쪽은 `403 RESTORE_NOT_ALLOWED`, 비구성원도 403, 상대 동의 없이 복구되고 끊긴 쪽의 읽기 접근이 돌아옴 ⑤ 보통 종료(`ended`)는 어느 쪽이든 복구 ⑥ 경계: `delete_after` 직전 복구 성공, 직후 `404`(삭제 후) ⑦ 동시성: 같은 사용자가 S2 생성과 S1 복구를 동시에 보내도 활성 공간은 하나뿐이고 하나는 `ALREADY_IN_SPACE` 또는 `RESTORE_BLOCKED_OTHER_SPACE` ⑧ 복구 대기 공간의 `GET /spaces/{id}/snapshot`은 `lifecycle`(`endedReason`, `endedBy`, `canRestore`)만 주고 장면·사진·대화는 주지 않으며 `canRestore`는 끊긴 쪽에서 false → 수락: 구현 전 실패.
- [ ] T093 [P] [US5] `supabase/functions/reports/__tests__/reports.test.ts`: `POST /spaces/{id}/reports`(`target: partner|shared_text|room_scene`, `reason: harass|inappropriate|privacy|other`, `detail?`, `messageId?`) 201, **홈 커버 사진은 대상이 아니다**(대상 값 거절), 신고자 본인만 자기 신고를 읽음, 처리 결과를 앱에 알리지 않음, 연결 끊기 없이도 접수 → 수락: 구현 전 실패.
- [ ] T094 [P] [US5] `apps/mobile/src/features/lifecycle/__tests__/lifecycle.test.tsx`: 설정의 "공간 종료" 확인 단계(30일 복구 안내 `set.end.help`), 종료 상태 화면(복구 기한 표시·복구 버튼·**"새 공간 시작하기"와 안내 `end.newSpace.note`**·종료된 공간에서는 편집/초대 비활성), **상대가 연결을 끊은 경우의 화면(`end.byPartnerDisconnect`·`end.onlyDisconnector`, 복구 버튼 없음)과 내가 연결을 끊은 경우(복구 버튼 있음)**, **복구 막힘 대화 상자(`end.restore.blocked.title/body`, 누가 쓰는지 말하지 않음)**, **연결 끊기 확인 다이얼로그가 `report.block.body`("연결을 끊으면 ○○님은 이 공간의 방과 대화를 볼 수 없고, 이 공간이 종료돼요. 30일 안(○월 ○일까지)에는 복구할 수 있어요")를 확인 전에 보여 줌**, 신고 흐름(대상→이유→자세한 내용(선택)→제출 성공/실패·입력 유지), 대화 메시지 ⋯ → "이 메시지 신고" 시트, 신고 대상 목록에 사진 없음 → 수락: 구현 전 실패.

### 서버 구현

- [ ] T095 [US5] `supabase/migrations/20261101000700_lifecycle_report.sql`: `report`(`id`, `space_id`, `reporter_user_id`, `target` check in (`partner`,`shared_text`,`room_scene`), `reason` check in (`harass`,`inappropriate`,`privacy`,`other`), `detail`, `message_id`, `created_at`, `status` check in (`received`,`reviewed`); RLS: 신고자 본인 읽기), RPC `end_space(space_id, reason)`(`ended`|`disconnect`; `ended_at`, `delete_after` = now + 30일, `ended_reason`, `ended_by_user_id` = 호출자, 두 구성원의 `space_active=false`를 **같은 트랜잭션**에서, 진행 중 `prompt_session` 해제, 활성 `invitation` 폐기), `recover_space(space_id)`(사용자 단위 어드바이저리 락 후: 종료 이유가 `disconnect`이면 `ended_by_user_id` 본인만·`ended`이면 구성원 누구나 — 아니면 `RESTORE_NOT_ALLOWED`; 두 구성원 `space_active=true`로 되돌리다 고유 인덱스 위반이면 `RESTORE_BLOCKED_OTHER_SPACE`; 종료 열 네 개를 비우고 `recovered` 이벤트 기록), `purge_expired_spaces()`(재실행 가능 배치: `delete_after <= now`인 공간의 모든 관련 행·Storage 객체 삭제 후 `deleted`) → 수락: T090의 DB 부분이 통과한다.
- [ ] T096 [US5] `supabase/functions/spaces/index.ts`에 `POST /spaces/{id}/end`(`{confirm:true}`), `POST /spaces/{id}/recover`(`{confirm:true}`; `403 RESTORE_NOT_ALLOWED`·`409 RESTORE_BLOCKED_OTHER_SPACE`·삭제 뒤 `404`), `POST /spaces/{id}/block`(`{confirm:true}`; 응답은 `/end`와 같고 `deleteAfter` 포함) 추가하고 `GET snapshot`의 `lifecycle` 요약에 `endedReason`·`endedBy`·`canRestore`를 채운다 → 수락: T090·T091·T092가 통과한다.
- [ ] T097 [P] [US5] `supabase/functions/reports/index.ts`: `POST /spaces/{id}/reports` 구현 → 수락: T093가 통과한다. 신고 연락처 **공개 지원 이메일은 아직 없다(G10)** — 응답·화면에 임의 주소를 넣지 않는다.
- [ ] T098 [US5] `supabase/functions/lifecycle-sweep/index.ts`에 `purge_expired_spaces()` 호출과 `deletion_started`/`deletion_completed` 이벤트 기록 추가(T076 확장) → 수락: T090 ③이 통과한다.

### 앱 구현

- [ ] T099 [US5] `apps/mobile/src/app/settings/end-space.tsx`, `apps/mobile/src/features/lifecycle/EndSpaceScreen.tsx`·`EndedScreen.tsx`: 공간 종료(2단계 확인, 30일 복구 기한 안내), 종료 상태(복구 기한·복구 버튼·"종료된 공간"), 복구 완료 → 수락: T094의 종료·복구 부분이 통과한다.
- [ ] T100 [US5] `apps/mobile/src/features/lifecycle/EndedScreen.tsx`(T099의 화면을 확장)와 `apps/mobile/src/features/lifecycle/RestoreBlockedDialog.tsx`: 종료 화면 상태 — (a) 보통 종료(내가 또는 상대가): "공간 복구하기" + "새 공간 시작하기"(`end.newSpace`: 공간 만들기·초대 코드 입력으로 이동)와 안내 `end.newSpace.note`, (b) **상대가 연결을 끊은 경우**(`endedReason=disconnect`, `endedBy=partner`): `end.byPartnerDisconnect` + `end.onlyDisconnector`, **복구 버튼 없음**, "새 공간 시작하기"만, (c) 내가 연결을 끊은 경우: (a)와 같음. 복구 요청이 `RESTORE_BLOCKED_OTHER_SPACE`면 대화 상자 `end.restore.blocked.title/body`(누가 쓰는지 말하지 않음), `RESTORE_NOT_ALLOWED`는 `canRestore=false`로 이미 버튼이 없으므로 방어용 `end.err.*`. 복구 대기 공간이 여럿이어도 `GET /spaces/mine`의 `ended` 하나만 보인다 → 수락: T094의 종료 화면·복구 막힘 부분이 통과한다.
- [ ] T101 [US5] `apps/mobile/src/app/settings/report.tsx`, `apps/mobile/src/features/report/ReportScreen.tsx`, `apps/mobile/src/features/report/DisconnectDialog.tsx`: 화면 제목 **"신고 · 연결 끊기"**(`report.title`), 신고 흐름과 별개 버튼 "○○님과 연결 끊기"(`report.block`, 위험 외곽선 버튼), 확인 다이얼로그(`report.block.title/body/confirm`), 성공 후 종료 상태 화면, 대화 메시지 신고 시트. 키 이름은 `report.block*` 그대로(번역 문구만 '연결 끊기') → 수락: T094의 연결 끊기·신고 부분이 통과한다.
- [ ] T102 [US5] 설정 탭의 계정·방 섹션 항목 연결(`apps/mobile/src/features/settings/`): 문의·신고(푸시), 공간 종료, AI 처리 동의 관리(푸시, 탭 바 숨김) — 되돌리기 어렵거나 중요한 작업 흐름은 탭 바를 숨긴다(`design/interaction-notes.md` §2) → 수락: 라우트 테스트가 해당 화면에서 탭 바 숨김을 단언.

**체크포인트**: US5는 US1~US4 위에서 단독 검증 가능.

---

## Phase 8: User Story 6 — 홈 배경 사진 정하기 (P2)

**목표**: 시스템 사진 선택기로 사진 한 장 → 커버 비율로 자르기 → 올리기 → 표시·바꾸기·없애기, 마지막 변경 우선, 비공개 저장, AI·장면으로 새지 않음. (FR-032~FR-039)

**독립 테스트**: quickstart A5 전체.

### 테스트 먼저

- [ ] T103 [P] [US6] `supabase/functions/home-cover/__tests__/cover.test.ts`와 `supabase/tests/home_cover.test.sql`: ① 허용 형식 `image/jpeg|png|heic`, 원본 **20MB 이하**, 위반은 `400 COVER_FORMAT_UNSUPPORTED`/`400 COVER_TOO_LARGE` ② 깨진 이미지·**이미지 헤더만 위장한 파일**은 `422 COVER_INVALID_IMAGE` ③ GPS 등 EXIF/XMP가 있는 사진을 올린 뒤 저장 객체를 내려받아 **메타데이터 없음** ④ 비구성원·종료 공간의 읽기/쓰기 거절(RLS), 공개 URL 없음, **서명된 URL 만료 뒤 열리지 않음** ⑤ 두 기기가 거의 동시에 교체해도 한 장만 남고 마지막 변경 우선(`version` 증가, 409로 막지 않음), 먼저 올린 객체는 **24시간 뒤 정리** ⑥ 업로드 중 오류·앱 종료에도 기존 사진 유지, 새 사진 저장이 끝나기 전에는 기존 사진을 바꾸지 않음 ⑦ 공간 삭제(30일 경계, 고정 시계) 시 객체·행 삭제, 복구 대기 중에는 유지·복구하면 그대로 ⑧ **provider spy**로 사진 URL·경로가 프롬프트·씬·AI 요청·로그에 없음 ⑨ 사진 변경에 점유 세션·미리 보기 확인 불필요 ⑩ 감사 이벤트는 `cover_changed`/`cover_removed` 종류만(경로·파일명 없음) → 수락: 구현 전 실패.
- [ ] T104 [P] [US6] `apps/mobile/src/features/cover/__tests__/cover.test.tsx`: 사진 없음→선택(**사진 보관함 권한 요청 0회**)→자르기(커버 비율 고정)→올리는 중→표시, 바꾸기·없애기, 형식 오류·크기 초과·업로드 실패(다시 시도, 기존 사진 유지), 오프라인(마지막 사진 표시·변경 막힘+이유), 상대가 바꿨을 때 "누가 마지막으로 바꿨는지" 표시, 매우 밝은/어두운/흰 단색 사진에서 일수·날짜·상태 표시줄 글자 대비 4.5:1(받침 막), 사진은 장식(읽기 순서 제외)·변경 컨트롤은 접근성 이름 → 수락: 구현 전 실패.

### 구현

- [ ] T105 [US6] `supabase/migrations/20261101000800_home_cover.sql`: `home_cover_photo`(`space_id` PK, `status` check in (`none`,`uploading`,`ready`,`failed`), `current_object_path`, `content_type`, `byte_size`, `width_px`, `height_px`, `sha256`, `crop jsonb`(정규화 `x`,`y`,`width`,`height`), `version`, `uploaded_by_user_id`(마지막으로 바꾸거나 없앤 사람), `uploaded_at`, `updated_at`, `pending_delete jsonb`(이전 객체 경로+삭제 예정 시각 = 새 사진 저장 확인 후 24시간)), Storage 비공개 버킷 `home-covers`와 RLS(읽기·쓰기·교체·삭제: 활성 공간 구성원만, `recovery_pending`이면 읽기도 새 업로드도 차단하고 사진은 유지). **URL은 저장하지 않는다** → 수락: T103 ④⑦의 DB 부분이 통과한다.
- [ ] T106 [US6] 스파이크 `docs/spikes/heic.md`와 PoC: HEIC 입력을 **서버 재인코딩(wasm)**으로 처리할지 **클라이언트 변환(JPEG) 후 업로드**로 처리할지 비교해 하나를 고른다(둘 다 EXIF/XMP 제거 재인코딩 사본 저장이 필수) → 수락: 선택한 방식으로 HEIC 샘플이 끝까지 업로드·표시되고 결론이 문서에 기록된다.
- [ ] T107 [US6] `supabase/functions/home-cover/index.ts`: `POST …/home-cover/upload-url`(`{contentType, byteSize}` → 201 `{uploadId, uploadUrl, expiresAt}` 일회용·짧은 수명), `PUT …/home-cover`(`{uploadId, crop}` + `Idempotency-Key`; 실제 이미지 헤더·크기·형식 검사 → EXIF/XMP 제거 재인코딩 → `version` 증가, 200 `{status:'ready', version, uploadedBy, updatedAt}`), `GET …/home-cover`(`{status, version, signedUrl, signedUrlExpiresAt, crop, uploadedBy, updatedAt}`; 서명 URL은 로그 금지), `DELETE …/home-cover`(204, 이전 객체 `pending_delete`), Realtime에는 `cover_version`과 변경 종류(`changed|removed`)만 → 수락: T103가 통과한다.
- [ ] T108 [US6] `supabase/functions/lifecycle-sweep/index.ts`에 `pending_delete` 24시간 정리 추가 → 수락: T103 ⑤가 통과한다.
- [ ] T109 [US6] `apps/mobile/src/app/home/cover-crop.tsx`, `apps/mobile/src/features/cover/` (`CoverPicker.tsx`, `CoverCrop.tsx`, `useHomeCover.ts`): `expo-image-picker`로 시스템 선택기(**권한 요청 없음**), 커버 비율 고정 자르기, 업로드·교체·삭제, 홈 상단 커버 + 글자 받침 막(어두운 막/면)으로 대비 보장, 사진 변경 시트(`cover.*` 키), 변경자 표시 → 수락: T104가 통과한다.

**체크포인트**: US6은 홈(US1)에 얹혀 독립 검증 가능, 사진 없이도 모든 기능이 동작한다.

---

## Phase 9: User Story 7 — 마일스톤 축하와 옵트인 기기 예약 알림 (P2)

**목표**: 50·100·200·300·500·1000일과 주년(함께한 날짜와 같은 달력 날짜, 매년)에 앱을 열면 마스코트가 홈 카드·방 말풍선으로 축하하고, 앱이 준비한 기념 꾸미기 제안을 기존 미리 보기→적용 흐름으로 연다. 사용자가 켠 기기에는 당일 오전 9시(방 시간대) **로컬 예약 알림**(서버 푸시·토큰 없음). (FR-040~FR-056)

**독립 테스트**: quickstart A6 전체(시작 날짜를 바꿔 각 마일스톤 전날·당일·다음 날·7일째·8일째, 윤일 시작, 겹침, 두 기기 독립 확인, 알림 허용·거절·재예약·취소).

### 테스트 먼저

- [ ] T110 [P] [US7] `supabase/functions/_shared/__tests__/milestones.test.ts`(Deno, 고정 시계)와 `supabase/tests/milestone.test.sql`: ① 일수 마일스톤 날짜 = 함께한 날짜 + `milestone_days` − 1(당일=1일째) 50/100/200/300/500/1000 ② 주년 = 함께한 날짜 + N년의 **같은 월·일**(1·2·3주년, **365/730일 아님**), **2월 29일 시작의 평년 주년은 2월 28일** ③ 주년과 일수가 같은 날이면 하나만, `anniversary` > `day` ④ 방 시간대 자정 경계(`Asia/Seoul`·`America/Los_Angeles`)와 **기기 시계 무관(서버 계산)** ⑤ 보이는 기간 = 당일 포함 7일, 8일째는 `passed`로 바꾸고 안 보임, 더 늦으면 지난 것으로만 기록 ⑥ 여러 개가 7일 안에 있으면 가장 최근 하나만(같은 날이면 주년 우선) ⑦ `GET current` 호출이 `MilestoneCelebration` 행을 **멱등** 생성(유일 `(space_id, milestone_key)`) ⑧ 두 구성원이 모두 참여한 활성 공간에서만 생성·표시, 종료(복구 대기) 중엔 안 보이고 복구하면 기록 유지 ⑨ **함께한 날짜 수정**: 기록된 마일스톤은 날짜가 바뀌어도 다시 축하하지 않되 새 `milestone_date`가 오늘보다 뒤면 행과 `MilestoneSeen`을 지워 새 날짜에 한 번 더(`milestonesReset`), 이미 지난 날짜로 바뀌면 기록 없는 것만 7일 규칙 ⑩ `upcoming`은 아직 안 온 것을 날짜순 최대 3개 → 수락: 구현 전 실패.
- [ ] T111 [P] [US7] `supabase/tests/milestone_seen.test.sql`: `MilestoneSeen`(`celebration_id`, `member_user_id` 복합 PK, `seen_at`, `via: home|room`) — 한쪽이 닫아도 상대는 자기 첫 열기에서 한 번 봄, 같은 요청 재전송 멱등, **RLS로 본인 행만 읽음**(상대가 봤는지 안 읽음) → 수락: 구현 전 실패.
- [ ] T112 [P] [US7] `supabase/functions/milestones/__tests__/preset.test.ts`: `POST …/milestone-preview`는 점유(`acquire`) 필요, **AI 호출 0회·동의 불필요·일일 한도 미계수**, 소품 5~6개(케이크·풍선·리본·반짝이 2, 주년은 선물 추가)+기념 문구 1개, 우선순위 케이크→리본→풍선→반짝이→선물→문구로 **자리 있는 만큼만** 놓고 `placed`/`requested` 반환, 자리가 전혀 없으면 `422 ROOM_FULL`, 상대가 점유 중이면 `409 SESSION_OCCUPIED`, 기간 지남 `410 MILESTONE_PASSED`, 오래된 버전 `409 VERSION_CONFLICT`, 기념 문구는 시작한 구성원의 앱 언어로 저장(번역 안 함)·문구 3개 한도 준수, 적용은 기존 confirm 경로(`source: milestone_preset`, 자동 적용 없음), 적용되면 `preset_applied_version_id` 기록, **AI 요청 이력에 안 남고 감사 이벤트 `milestone_preset_previewed/applied`(키만)** → 수락: 구현 전 실패.
- [ ] T113 [P] [US7] `apps/mobile/src/features/milestone/__tests__/notifications.test.ts`(`expo-notifications` mock): ① **앱 첫 실행에서 알림 권한을 묻지 않음** ② 첫 축하 카드를 닫은 직후 사전 안내 시트가 한 번 뜨고 "다음에"면 다시 뜨지 않음(설정에서만) ③ "알림 켜기" 후 OS 권한 허용 → `upcoming` 최대 3개를 **당일 오전 9시(방 시간대)**로 예약, 알림 식별자 = 마일스톤 키(중복 예약 없음) ④ 재예약 트리거: 함께한 날짜 변경·방 시간대 변경·앱 업데이트·앱 열 때 목록 확인·공간 복구 ⑤ 취소 트리거: 공간 종료·연결 끊기·로그아웃·알림 끄기·상대 이탈로 인한 종료, 상대 초대 중에는 예약 안 함 ⑥ 권한 거절/해제 → 설정 행 "기기에서 알림이 꺼져 있어요"+기기 설정 열기 ⑦ **알림 문구는 제목 = 앱 이름, 본문 "모피가 축하할 일이 생겼어요."(ko/en/ja) 하나이고 이름·날짜·일수·주년 수가 없음** ⑧ 알림을 누르면 홈으로 열려 축하 카드(이미 본 마일스톤이면 카드 없이 홈만) ⑨ 알림을 켜지 않은 기기는 예약 0건 ⑩ **서버에 푸시 토큰·알림 설정을 저장하는 코드 경로 없음**(`getExpoPushTokenAsync`/`registerForPushNotificationsAsync` 사용 금지 grep 테스트) ⑪ 탭 바 배지 없음 → 수락: 구현 전 실패.
- [ ] T114 [P] [US7] `apps/mobile/src/features/milestone/__tests__/cards.test.tsx`: 홈 카드("100일을 함께했어요", 닫기 ✕, 늦은 축하 문구, 사진 위 배경에서도 읽힘), 방 말풍선("100일째, 축하해요!", `mascot_cheer` 포즈로 서서 말풍선, 닫으면 다시 돌아다님), 카드·말풍선 중 하나만 닫아도 확인 처리, 제안 입구("기념 방 꾸미기 보기"; 상대 점유 중·방 가득 참·말풍선 닫은 뒤에도 입구 유지), 통통 2.4초·반짝임 1.4초는 **동작 줄이기에서 정지**, 글자 130% 이상에서 카드가 세로로 쌓임, ko/en/ja에서 잘리지 않음, 오프라인·서버 오류에서는 축하만 숨김 → 수락: 구현 전 실패.

### 서버 구현

- [ ] T115 [US7] `supabase/migrations/20261101000900_milestone.sql`: `milestone_celebration`(`id`, `space_id`, `milestone_key` (`d50|d100|d200|d300|d500|d1000|y1|y2|y3…`), `kind` check in (`day`,`anniversary`), `milestone_days`, `anniversary_n`, `milestone_date`, `priority`, `status` check in (`active`,`passed`), `preset_applied_version_id`, `created_at`; **유일 `(space_id, milestone_key)`**), `milestone_seen`(`celebration_id`, `member_user_id` 복합 PK, `seen_at`, `via` check in (`home`,`room`); RLS 본인 행만), `update_anniversary` RPC 확장(트랜잭션 안에서 새 `milestone_date`가 오늘보다 뒤인 행과 확인 기록 삭제, `milestonesReset` 반환), 공간 삭제 시 함께 삭제 → 수락: T111·T110의 DB 부분이 통과한다.
- [ ] T116 [US7] `supabase/functions/_shared/milestones.ts`: 순수 함수 `computeMilestones(anniversaryDate, timeZone, today)` — T110 ①~⑥⑩를 만족(날짜 연산은 방 시간대의 달력 날짜로, 서버 시각만 사용) → 수락: T110의 단위 부분이 통과한다.
- [ ] T117 [US7] `supabase/functions/milestones/index.ts`: `GET /spaces/{id}/milestones/current`(응답 `{dayCount, timezone, celebration|null, upcoming[≤3]}`, `seenByMe`, `presetAvailable`, `presetId`), `POST …/milestones/{celebrationId}/seen`(`{via}`, 204 멱등) → 수락: T110·T111이 통과한다.
- [ ] T118 [US7] `supabase/functions/_shared/milestonePresets.ts`: 서버 코드 상수 `milestone-day`(케이크·풍선·리본·반짝이 2 + 기념 문구)·`milestone-anniversary`(+선물), **기존 카탈로그 24개 안의 오브젝트만**(`obj_party_cake`, `obj_party_balloon`, `obj_party_ribbon`, `obj_shape_sparkle` ×2, `obj_keep_gift`; 새 오브젝트 0개), 기존 배치 알고리즘과 T069 검증기(16/3 한도·보호 영역)를 거쳐 후보 장면 생성 → 수락: T112 단위 부분이 통과한다.
- [ ] T119 [US7] `supabase/functions/milestones/index.ts`에 `POST /spaces/{id}/prompt-session/{sessionId}/milestone-preview` 추가(T118 사용, `decoration_request.source = 'milestone_preset'`, 기존 `confirm` 재사용) → 수락: T112이 통과한다.

### 앱 구현

- [ ] T120 [US7] `apps/mobile/src/features/milestone/` (`MilestoneCard.tsx`, `MilestoneBubble.tsx`, `useMilestone.ts`, `PresetEntry.tsx`): 앱을 열 때와 방 탭에 들어갈 때 `GET milestones/current` 한 번, 카드·말풍선·제안 입구, 닫기는 `POST seen`(오프라인이면 기기 큐에 저장했다가 연결 후 한 번만 전달), 제안은 기존 프롬프트 패널의 점유→미리 보기("{라벨} 제안" 뱃지·변경 요약·"AI를 쓰지 않는 앱의 제안이에요")→적용 확인→적용 흐름으로 연결, 마스코트 `mascot_cheer` + 통통 2.4초·반짝임 1.4초(카드·말풍선이 열려 있는 동안, 10초 뒤 정지 — 디자인 제안값, 동작 줄이기 정지) → 수락: T114가 통과한다.
- [ ] T121 [US7] `apps/mobile/src/features/milestone/notifications.ts`: `expo-notifications` 로컬 예약(`scheduleNotificationAsync`, 날짜 트리거 오전 9시 방 시간대), 식별자 = 마일스톤 키, 가장 가까운 3개만, 재예약·취소 트리거(T113 ④⑤), 알림 문구는 번역 리소스 고정 한 가지(`notif.*`), 알림 누르면 딥 링크로 홈. Android 알림 채널 하나(마일스톤), Android 13+ `POST_NOTIFICATIONS`, **푸시 토큰·APNs/FCM 설정 없음**(서버 푸시는 G9에서 필요해지면 따로) → 수락: T113가 통과한다.
- [ ] T122 [US7] `apps/mobile/src/features/milestone/NotifPrompt.tsx`(사전 안내 시트: 무엇을 언제 보내는지, 이름·날짜 없음, 설정에서 끌 수 있음, "알림 켜기"/"다음에"), `apps/mobile/src/features/settings/NotificationRow.tsx`(설정 > 알림 > 마일스톤 알림 토글; 상태 꺼짐(이 기기에만 적용)/켜짐(오전 9시)/기기에서 꺼져 있음(기기 설정 열기)) → 수락: T113 ②⑥이 통과한다. 스토어 심사 메모에 "알림은 사용자가 켠 로컬 알림, 마케팅 아님, 토큰 저장 없음, 문구에 개인정보 없음"을 적는 일은 G3의 일부.

**체크포인트**: US7은 US1~US2(+US5의 종료 규칙) 위에서 독립 검증 가능.

---

## Phase 10: Polish & Cross-Cutting (구현 마무리, 출시 게이트와 별개)

- [ ] T123 [P] 모든 공유 테이블에 대한 RLS 총점검 `supabase/tests/rls_all.test.sql`: A·B 구성원, C 제3자로 `space_member`, `invitation`, `room_*`, `decoration_request`, `prompt_*`, `home_cover_photo`, `milestone_*`, `report`, Storage `home-covers`, Realtime 채널을 순회해 읽기/쓰기/구독 거부를 단언 → 수락: 통과.
- [ ] T124 [P] 로그·오류 allowlist 총점검 `supabase/functions/_shared/__tests__/log_allowlist.test.ts`: 모든 Edge Function을 mock 입력으로 실행해 키·프롬프트 원문·서명 URL·초대 코드·모델 출력이 로그/오류에 없음을 단언, `gitleaks` CI 통과 → 수락: 통과.
- [ ] T125 [P] 접근성 총점검 `apps/mobile/src/__tests__/a11y.test.tsx`: 모든 라우트에서 터치 ≥44pt, 접근성 이름, 큰 글자 130%/200%, 동작 줄이기 정지, 마스코트 낭독 한 번 → 수락: 통과.
- [ ] T126 [P] 리뷰용 고정 샘플 공간 `supabase/seed/review_space.sql`과 `docs/review-account.md`: 반복 사용 가능한 고정 샘플 장면, 신고/연결 끊기 경로 포함. **실제 초대 코드를 포함하지 않는다**(`quickstart.md` 준비 3번). 심사 노트 초안(고정 렌더러는 데이터만 처리) → 수락: 시드 적용 후 리뷰 계정으로 방·신고·연결 끊기 화면이 열린다.
- [ ] T127 [P] 실기기 점검표 `docs/device-checklist.md`(실행은 사람): 안전 영역 값(iOS 47/34, Android 32/24 가정), 시스템 탭 바·키보드·공유 시트, 스크린 리더 낭독, dynamic type, 화면 회전, 사진 선택기 권한 팝업 없음·HEIC, 알림 권한 흐름과 알림 배너 실제 모양, 통통·반짝임·되살림 움직임, Kakao·Apple·이메일 redirect(EAS 내부 빌드), 아이콘 29px 가독성(A는 29px에서 "경계") → 수락: 항목별 합격/불합격 기록 칸이 있다.
- [ ] T128 [P] quickstart 검증 실행 `docs/validation-report.md`: `specs/001-couple-prompt-todo/quickstart.md`의 A, A2~A7, B~E 시나리오를 자동 테스트와 수동 단계로 구분해 결과 기록. SC-001~005는 별도 제품 계측이라 "미측정"으로 둔다(SC-001~003은 PoC 동안 측정하지 않기로 결정·가정, Decided 26)(저장소 검사 통과를 사용자 성공 기준 입증으로 표시하지 않는다) → 수락: 보고서에 시나리오별 상태가 있다.
- [ ] T129 [P] EAS `preview` 내부 배포 빌드 한 번(iOS·Android) 성공 확인과 SDK 58 / RN 0.88 / Skia 호환 행렬 고정(`docs/compat-matrix.md`), 번들 크기 실측 기록(**글꼴 크기 실측은 G6의 입력**) → 수락: 빌드 링크·크기 기록.
- [ ] T130 [P] `README.md`(루트)와 `docs/architecture.md`: 저장소 구조·실행 방법·테스트 명령·비밀 규칙·게이트 목록 링크. `design/README.md`/`handoff.md`의 구현 포인터는 이미 있으므로 구현 결과로 달라진 점만 반영 → 수락: 새 기여자가 README만으로 로컬에서 앱과 Supabase 로컬 스택을 띄운다.

---

## Phase 11: 출시 게이트 (구현을 막지 않는다 — 출시 전에 사람이 닫는다)

> 위 구현 태스크는 **자리표시 값으로 끝까지 진행할 수 있다.** 아래 게이트는 코드가 아니라 확인·결정·검수 항목이고 모두 [P]다. 닫히기 전에는 **스토어 등록·공개 출시만** 막힌다.

- [ ] T131 [P] **G1 법률 검토**: 연령 문구("만 14세 이상") 최종 표현, 해외 AI 처리 동의와 **보관 기간 문구**(`[법무 확인 후 입력]`), 사진 개인정보 처리방침 최종 문구와 국외 처리 범위, 알림, 스토어 UGC 설명, AI 표시 의무, 꾸밈 결과의 개인적·비상업적 이용 허용과 소유권 비보장 문구(FR-025, 이용약관), "AI 제안이 틀릴 수 있다" 앱 안 안내 문구(Commercial Terms D.3; 현재 화면·키에는 없음 — 결정되면 `apps/mobile/src/i18n/locales/*.json`에 키 추가) → 닫는 방법: 법률 의견 기록을 `docs/legal/`에 저장하고 해당 번역 키 값 교체.
- [ ] T132 [P] **G2 이름 확인**: 상표(모피루/Mopiru/モピル, 모피/Mopi/モピ), 앱스토어·Google Play 이름 사용 가능 여부, 도메인 `mopiru.jinjinstar.com` 생성, 한국어 '모피'(털가죽) 맥락. **확인 전에는 bundle ID `com.jinjinstar.mopiru`를 스토어에 등록하지 않는다** → 닫는 방법: T005의 `PLACEHOLDER: false`와 최종 값, `docs/name-clearance.md`.
- [ ] T133 [P] **G3 스토어 규칙 재확인**: 이름(30자 안팎)·부제 글자 수와 심사 규칙, 스토어 연령 등급 설문(최소 연령 14세와 일치), **"연결 끊기 + 신고"가 악성 이용자 차단·신고 기대를 충족하는지**, 사진 UGC 설명, 알림 심사 메모(사용자가 켠 로컬 알림, 마케팅 아님, 토큰 저장 없음), 신고 연락처 → 닫는 방법: `docs/store-submission.md`에 확인 결과.
- [ ] T134 [P] **G4 원어민 검수**: 영어·일본어 전체 문구(특히 'Disconnect'·'つながりを終了' 초안, 일본어 표기 モピル·モピ) → 닫는 방법: 검수본을 T024 입력(`design/i18n-copy.md`)에 반영하고 재생성.
- [ ] T135 [P] **G5 카카오·Apple 공식 에셋/SDK**: T048의 자리표시 버튼을 공식 SDK·에셋으로 교체 → 닫는 방법: 교체 PR과 EAS 내부 빌드에서 redirect 확인.
- [ ] T136 [P] **G6 글꼴 번들 크기 실측**: T129의 실측으로 9파일(≈16.4MB 압축 전)/최소 구성(≈10MB) 중 선택, `OFL` 고지 포함 확인 → 닫는 방법: T027 갱신.
- [ ] T137 [P] **G7 에셋 최종 포맷**: PNG-8 또는 WebP 무손실 결정, 일러스트레이터가 18개 일반 오브젝트 최종 그림을 납품(자리표시 스케치 교체, `design/assets-spec.md` §9) → 닫는 방법: T029 재실행과 manifest 갱신.
- [ ] T138 [P] **G8 AI 이용 약관·비용·승급 기준**: ① 크레딧 연결 때 보이는 프로그램 약관 원문과 현재 Commercial Terms를 읽고 포함 크레딧을 공개 소비자 앱에 써도 되는지 Anthropic 지원팀에 **서면 문의**(답 전에는 PoC 전용) ② 만 14세 이상 사용자 앱의 Usage Policy 확인 ③ **유료 API 크레딧/결제 설정으로 전환**(포함 크레딧은 주기마다 소멸하고 잔액 0이면 요청 정지), workspace 지출 한도·커플당 하루 5회 재확인 ④ T077 실측 평가로 Haiku→Sonnet 승급 기준 결정(T071의 `AI_ESCALATE_TO_SONNET` 규칙으로 반영) → 닫는 방법: `docs/ai-terms.md`.
- [ ] T139 [P] **G9 서버 푸시 필요 여부**: 기기 로컬 알림으로 충분한지 사용 후 결정(더하면 토큰 저장·서버 예약·APNs/FCM 키·처리방침 항목 필요) → 닫는 방법: 결정 기록, 필요 시 새 스펙.
- [ ] T140 [P] **G10 공개 지원 이메일**: 소유자가 주소를 만든다(임의로 만들지 않는다). 신고 화면·스토어 등록·개인정보 처리방침에 반영 → 닫는 방법: T005의 `supportEmail`과 `report.contact` 번역 값.
- [ ] T141 [P] **G11 마스코트·아이콘 닮음 검사와 법률 검토**(출시 전 권장, 출시를 막지 않음): 마스코트 마스터(소유자가 생성형 AI 도구로 만든 원본)의 유사성 검사, 선택 생성 기록(도구 이름·날짜·프롬프트: owner to supply), 아이콘 A 29px 가독성(경계) 실기기 확인 → 닫는 방법: 기록을 `design/mascot/README.md`에 반영.
- [ ] T142 [P] **G12 개인 개발자 계정과 Supabase 운영 설정**: Apple·Google Play 개인 계정 등록(스토어 판매자 이름이 개인 이름, 법인 이전은 가능하나 절차 필요), Supabase 무료 프로젝트의 비활동 일시 정지 동작 확인과 서울 리전 유지, 운영 요금제 결정 → 닫는 방법: `docs/accounts.md`.

---

## FR → 태스크 대응표

모든 기능 요구사항(FR-001~FR-059, 62개 항목)이 하나 이상의 태스크로 구현·검증된다. 사용자 성공 기준 SC-001~SC-005는 별도 계측이며 태스크가 없다(SC-001~003은 PoC 동안 측정하지 않기로 결정·가정, `spec.md` Decided 26).

| FR | 태스크 |
|---|---|
| FR-001 | T046, T048 |
| FR-002 | T036, T043, T049 |
| FR-003 | T035, T040, T041, T044, T050 |
| FR-004 | T035, T040, T044, T053 |
| FR-005 | T018, T020, T123 |
| FR-006 | T037, T052, T043 |
| FR-007 | T037, T052 |
| FR-008 | T067, T080 |
| FR-009 | T010, T013, T078 |
| FR-010 | T072, T077 |
| FR-011 | T062, T073, T082 |
| FR-012 | T073, T083 |
| FR-013 | T063, T074, T065, T082 |
| FR-014 | T061, T072 |
| FR-015 | T014, T078, T061 |
| FR-016 | T070, T081, T061 |
| FR-017 | T071, T061 |
| FR-018 | T015, T010, T068, T065 |
| FR-018a | T079 |
| FR-018b | T034 |
| FR-018c | T064, T075, T080 |
| FR-019 | T024, T025, T008, T084 |
| FR-020 | T087, T089, T086, T088 |
| FR-021 | T010, T107 |
| FR-022 | T090, T096, T099, T100 |
| FR-023 | T090, T092, T096, T100 |
| FR-024 | T090, T098 |
| FR-025 | T131 |
| FR-026 | T065, T078, T014 |
| FR-027 | T080, T014 |
| FR-028 | T022, T061, T072, T082 |
| FR-029 | T013, T010, T072 |
| FR-030 | T054, T057, T058, T060 |
| FR-031 | T054, T073 |
| FR-032 | T109, T107 |
| FR-033 | T103, T104, T107 |
| FR-034 | T103, T105 |
| FR-035 | T103, T109 |
| FR-036 | T104 |
| FR-037 | T104, T109 |
| FR-038 | T103, T098 |
| FR-039 | T093, T094, T104 |
| FR-040 | T110, T116 |
| FR-041 | T110, T120 |
| FR-042 | T111, T117, T120 |
| FR-043 | T110, T115 |
| FR-044 | T113, T121 |
| FR-045 | T114, T120 |
| FR-046 | T112, T119, T120 |
| FR-047 | T112 |
| FR-048 | T118, T028 |
| FR-049 | T114, T120 |
| FR-050 | T113, T121 |
| FR-051 | T113, T122 |
| FR-052 | T113, T121 |
| FR-053 | T113, T121 |
| FR-054 | T113, T121 |
| FR-055 | T113, T121 |
| FR-056 | T113, T122 |
| FR-057 | T019, T035, T036, T043, T051, T092 |
| FR-058 | T038, T047 |
| FR-059 | T091, T096, T101, T093, T097, T092, T100 |


---

## 의존성과 실행 순서

- **Phase 1 Setup** → **Phase 2 Foundational**(계약·검증기·DB 기본·앱 뼈대) → 스토리 단계. Foundational이 끝나기 전에는 어떤 스토리도 시작하지 않는다.
- 스토리 순서(의존): **US1**(공간·초대·홈) → **US4**(점유 세션: US2의 적용이 쓴다) → **US2**(방·AI 꾸미기) → **US3**(언어·테마 설정, US1·Foundational에만 의존하므로 US2와 병행 가능) → **US5**(종료·연결 끊기·신고) → **US6**(홈 사진) → **US7**(마일스톤·알림; 방 제안은 US2·US4, 종료·복구 규칙은 US5에 의존).
- US5·US6·US7은 서로 독립(모두 US1 이후)이고 US2 이후 병행 가능하다. 단 US7의 알림 취소 트리거 중 "공간 종료·연결 끊기"는 US5의 종료 기능이 먼저 있어야 통합 테스트가 완성된다.
- 각 단계 안의 순서: **테스트(실패 확인) → 마이그레이션 → 서버 함수 → 앱**. 앱 태스크는 같은 단계의 서버 계약이 끝난 뒤 실행한다.

## 병렬 실행 예시

- **Phase 1**: T002, T003, T004, T005, T006, T008, T009를 동시에(T001 이후).
- **Phase 2**: 계약 테스트 T010·T011, DB 테스트 T018, 앱 테스트 T023를 동시에 작성. T028와 T031도 서로 독립.
- **US1**: T035·T036·T037·T038·T039를 동시에 쓰고, 서버(T043·T044·T045)와 앱 화면(T047·T048·T049)은 계약 확정 뒤 병행.
- **US2**: 테스트 T061·T062·T063·T064·T065·T066를 동시에.
- **US5·US6·US7**: 세 단계를 서로 다른 작업자가 동시에.

## 구현 전략

### MVP 컷 라인 — "첫 데모 가능한 조각"

**Phase 1 + Phase 2 + US1(Phase 3) + US4(Phase 4) + US2(Phase 5)** 를 마치면 아래 흐름이 **두 기기에서** 끝까지 돌아간다:

1. 로그인(이메일 코드; 카카오·Apple은 자리표시 버튼) → 연령 문구 → 공간 만들기
2. 초대 코드 공유 → 상대 수락(이미 공간이 있으면 거절·코드 유지)
3. 홈 D-day(같은 날짜·같은 일수)
4. 고정 마스코트가 있는 방(40초 돌아다니는 동작, 되살림)
5. 동의 → 프롬프트 → 검증된 미리 보기 → 점유자만 "되돌릴 수 없어요" 확인 후 적용 → 양쪽 같은 방, 하루 5회 한도, 열린 대화 안 되돌리기

이 컷 라인에 **들어가지 않는 것**: 설정 화면의 언어·방 모드·앱 모양(US3), 종료·연결 끊기·신고(US5), 홈 사진(US6), 마일스톤·알림(US7). 언어는 기기 언어를 따르는 기본 동작만 Foundational에 들어 있다.

### 단계별 컷

1. **MVP 데모**: Phase 1~5 (위).
2. **P1 완성**: + US3(Phase 6) — 언어·방 낮/밤·앱 모양 설정.
3. **V1 완성**: + US5·US6·US7(Phase 7~9) + Polish(Phase 10).
4. **출시**: + 게이트 G1~G12(Phase 11)를 사람이 닫은 뒤.

### 점진 전달

한 스토리를 끝낼 때마다 해당 스토리의 "독립 테스트"를 실행하고, quickstart의 대응 시나리오(US1→C, US4→C, US2→A·B·D·A7, US3→A2·A3, US5→E, US6→A5, US7→A6)를 확인한 뒤 다음으로 넘어간다.

## 결정된 질문 (2026-10-27, 소유자가 "계속 진행하자"고 답함 — 권고안을 **가정으로 표시해** 반영)

분석에서 올라온 네 질문은 모두 권고안대로 정했다. 소유자가 각각을 따로 확인한 것은 아니므로 가정이고, 바꾸면 해당 태스크를 고친다(`spec.md` Decided 23~26).

- **Q1 → 복구 대기 중에도 새 공간(가정)**: "한 공간만"은 **활성 공간**만 센다. 종료·연결 끊기 뒤 30일 동안에도 새 공간을 만들거나 초대를 수락할 수 있다. 대신 **복구할 때 두 사람 중 누구라도 다른 활성 공간에 있으면 복구는 막힌다**(`409 RESTORE_BLOCKED_OTHER_SPACE`; 권고안은 연결 끊기만 말했지만 규칙의 일관성을 위해 보통 종료에도 적용). 반영: T019(`space_member.space_active`와 부분 고유 인덱스), T036, T035, T092, T095, T096, T100.
- **Q2 → 연결 끊기 뒤 복구는 끊은 사람만(가정)**: 연결 끊기로 끝난 공간은 연결을 끊은 사람만 복구한다(상대 동의 없음, `403 RESTORE_NOT_ALLOWED`). 보통 "공간 종료"는 어느 쪽이든 복구한다. 반영: T092, T095, T096, T100, T094.
- **Q3 → 순환 로더의 창문은 로더 전용(가정)**: 카탈로그 24개 그대로, `obj_decor_window`는 만들지 않는다. 반영: T034.
- **Q4 → SC-001~003 수치는 그대로, PoC 동안 측정하지 않는다(가정)**: 측정 태스크를 만들지 않는다. 반영: T128, T077(fixture와 모의 실행만, 목표 달성 판정은 하지 않음).

## 열린 질문 (가정으로 구현하는 작은 것 — 소유자가 바꾸면 따른다)

- **R1 복구 대기 공간이 둘 이상일 때**: 새 공간을 시작했다가 그것도 종료하면 복구 대기 공간이 둘이 된다. 지금은 `GET /spaces/mine`이 `ended_at`이 가장 최근인 하나만 돌려주고 종료 화면은 그것만 보인다(오래된 것은 기한이 지나면 삭제). 선택 화면은 두지 않았다. (T100)
- **R2 연결을 끊은 사람의 계정이 사라질 때**: 복구할 사람이 없어 30일 뒤 삭제로 끝나는 것으로 둔다(가정). 별도 처리 태스크는 없다.
- **R3 보통 종료에도 "복구 때 다른 활성 공간이 있으면 막힘"을 적용**: 권고안의 확장이다(위 Q1). 보통 종료는 막지 않는 쪽을 원하면 T095의 `recover_space`와 T092 ②를 고친다.
- 출시 게이트 G1~G12(Phase 11)는 별개로 계속 열려 있다.
