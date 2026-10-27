---
description: "프롬프트로 꾸미는 커플 D-day와 우리 방 — 구현 태스크 목록 (Expo/React Native + Supabase)"
---

# Tasks: 프롬프트로 꾸미는 커플 D-day와 우리 방

**입력**: `specs/001-couple-prompt-todo/`의 `spec.md`(사용자 스토리·FR-001~FR-074), `plan.md`(기술 맥락·저장소 구조), `data-model.md`, `contracts/api.md`와 `contracts/*.schema.json` 5개(+ 형식 샘플 `contracts/samples/`), `ai-guardrails.md`, 기준 라이브러리 `design/reference-library/`, `research.md`, `quickstart.md`, 디자인 `design/`(`tokens.json`, `i18n-copy.md` 640키, `assets-manifest.csv`, `assets-sketch/`, `mascot/`, `components.md`, `interaction-notes.md`, `screens.md`)

**전제**: 이 문서는 **문서만**이다. 저장소에는 아직 앱 코드가 없고, 이 태스크 목록이 구현의 시작점이다. 구현은 나중에 codex 작업자가 이 파일만 보고 실행한다.

**테스트**: **요청됨** — 계획과 `quickstart.md`가 정한 검증 흐름(계약 테스트, RLS, 점유·멱등, 장면 검증, 마일스톤 계산, 알림 예약, 하루 3회, 생성 장식·가드레일·신고, 한 공간 규칙, 14세 문구, 연결 끊기, 세션 안 되돌리기, 마스코트 되살림)은 **각 스토리에서 구현보다 먼저 쓰고 실패를 확인**한다.

**구성**: 사용자 스토리별 단계(P1 → P2), 각 단계는 독립적으로 구현·검증할 수 있다. 스토리 번호는 `spec.md`의 User Story 1~10이다.

## 요약

| 단계 | 태스크 | 그중 [P] |
|---|---|---|
| Phase 1: Setup (저장소·도구·비밀·식별자 자리표시) | 9 | 7 |
| Phase 2: Foundational (모든 사용자 스토리가 기다리는 기반) | 25 | 9 |
| Phase 3: User Story 1 — 커플 공간 만들고 D-day 확인하기 (P1) | 19 | 8 |
| Phase 4: User Story 4 — 공유 프롬프트 세션 이어가기 (P1, 방 꾸미기 apply의 선행 조건) | 7 | 3 |
| Phase 5: User Story 2 — 프롬프트로 둘만의 방 꾸미기 (P1) | 23 | 10 |
| Phase 6: User Story 3 — 언어 및 표시 테마 설정 (P1) | 6 | 4 |
| Phase 7: User Story 5 — 커플 공간 종료(소프트 삭제), 연결 끊기, 신고 (P2) | 13 | 6 |
| Phase 8: User Story 6 — 홈 배경 사진 정하기 (P2) | 7 | 2 |
| Phase 9: User Story 7 — 마일스톤 축하와 옵트인 기기 예약 알림 (P2) | 13 | 5 |
| Phase 10: User Story 8 — 프롬프트로 새 배경·말풍선·소품 장식 만들기 (P2, MVP 바로 다음 단계) | 22 | 9 |
| Phase 11: User Story 9 — 생성된 장식·방 신고하기 (P2, US8과 함께 출시) | 6 | 3 |
| Phase 12: User Story 10 — 계정 삭제 (P1, 출시 필수 · MVP 컷에는 없음) | 8 | 5 |
| Phase 13: Polish & Cross-Cutting (구현 마무리, 출시 게이트와 별개) | 8 | 8 |
| Phase 14: 출시 게이트 (구현을 막지 않는다 — 출시 전에 사람이 닫는다) | 18 | 18 |
| **합계** | **184** | **97** |

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
3. **비밀·식별자**: API 키·서비스 키를 저장소·로그·앱 번들·PR·채팅에 넣지 않는다. `com.jinjinstar.aroom`·`aroom.jinjinstar.com`은 **자리표시**이고 T005 한 파일에만 둔다. **스토어 등록·제출을 하지 않는다**(게이트 G2·G3 전). 공개 지원 이메일을 만들거나 저장소·git 설정의 주소를 쓰지 않는다.
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
| G1 법률 검토 | 연령 문구, 해외 AI 보관 기간, 사진 개인정보, 알림, UGC, AI 오류 가능 고지 | T038, T047, T081, 번역 키 값 | T167 |
| G2 이름 확인 | 상표·스토어 이름·도메인·bundle ID | T005, T006 | T168 |
| G3 스토어 규칙 | 글자 수·심사·연령 등급·UGC·연결 끊기+신고·알림 메모 | T101, T122 | T169 |
| G4 원어민 검수 | 영어·일본어 문구 | T024 | T170 |
| G5 카카오·Apple 에셋 | 공식 SDK/에셋 | T048, T046 | T171 |
| G6 글꼴 크기 실측 | 9파일 vs 최소 구성 | T027, T165 | T172 |
| G7 에셋 최종 포맷·그림 | PNG-8/WebP, 18개 오브젝트 납품 | T029 | T173 |
| G8 AI 약관·비용·승급 | 포함 크레딧의 공개 앱 사용 문의, Usage Policy, 유료 전환, 승급 기준 | T071, T077 | T174 |
| G9 서버 푸시 | 로컬 알림으로 충분한지 | T121 | T175 |
| G10 지원 이메일 | 공개 주소 필요(아직 없음) | T005, T097 | T176 |
| G11 닮음 검사 | 마스코트·아이콘(권장, 비차단) | T029 | T177 |
| G12 계정·운영 | 개인 계정, Supabase 무료 정지 동작 | T004, T006 | T178 |
| G13 기준 라이브러리 승인 | 자리표시 레퍼런스의 최종 세트·스타일 승인 | T134, T130 | T179 |
| G14 생성 콘텐츠 스토어 규칙 | Apple 1.2·Google Play AI 생성 콘텐츠·연령 등급·심사 노트 | T150, T135 | T180 |
| G15 약관·개인정보·법률(생성) | 약관·처리방침·AI 결과 권리·표시 의무 | T143, T135 | T181 |
| G16 Anthropic 사용 정책(생성) | 시행 중·개정판 본문, 14세 이상 이용자 | T071, T135 | T182 |
| G17 생성 품질·실제 모델 평가 | SC-008, 품질·비용 측정, 옵션 B 후퇴 결정, 운영 담당·응답 시간 | T144, T135 | T183 |
| G18 계정 삭제 출시 점검 | 처리방침·Apple 심사 노트·Google 데이터 보안 양식과 웹 삭제 링크·Kakao unlink·앱 밖 요청 절차 | T158, T156, T157 | T184 |

---

## Phase 1: Setup (저장소·도구·비밀·식별자 자리표시)

**목적**: 코드가 없는 저장소에 plan.md "저장소 구조 제안"대로 작업 공간을 만든다. 이 단계에서 만드는 식별자·키 자리는 모두 **자리표시**이고, 이름 확인(G2)이 끝나기 전에는 스토어에 아무것도 등록하지 않는다.

- [x] T001 Root workspace 만들기: `package.json`(pnpm workspaces: `apps/*`, `packages/*`), `pnpm-workspace.yaml`, `.nvmrc`(Node 22), `tsconfig.base.json`(strict, `noUncheckedIndexedAccess`), `.editorconfig`, `.gitignore`(`node_modules/`, `.env*`(단 `.env.example`은 추적), `supabase/.temp/`, `*.figcraft`, `*.keystore`, `*.p8`) → 수락: `pnpm install`이 빈 워크스페이스에서 성공하고 `git status`에 비밀·빌드 산출물이 잡히지 않는다.
- [x] T002 [P] `apps/mobile`에 Expo SDK 58 + React Native 0.88 + TypeScript 앱 만들기(`apps/mobile/package.json`, `app.config.ts`, `tsconfig.json`, `babel.config.js`, `metro.config.js`, `src/app/_layout.tsx` 빈 레이아웃). 의존성: `expo-router`, `expo-localization`, `i18next`, `react-i18next`, `@shopify/react-native-skia`(3.7.4 근처, 출시 때 호환 행렬 재고정), `@supabase/supabase-js`, `expo-notifications`, `expo-image-picker`, `expo-secure-store`, `expo-font`, `expo-splash-screen`, `react-native-reanimated` → 수락: `pnpm --filter mobile exec expo export --platform ios`가 성공(빈 화면).
- [x] T003 [P] `packages/scene-contract` 패키지 만들기(`packages/scene-contract/package.json`(이름 `@couple/scene-contract`), `tsconfig.json`, `src/index.ts`, `vitest.config.ts`) → 수락: `pnpm --filter @couple/scene-contract test`가 "테스트 0개"로 통과하는 것이 아니라 최소 스모크 테스트 1개로 통과한다.
- [x] T004 [P] `supabase/config.toml`, `supabase/migrations/`, `supabase/functions/`, `supabase/seed/`, `supabase/tests/`(pgTAP) 폴더 만들기. `config.toml`에 Auth(이메일 OTP 6자리 `otp_length = 6`, magic link 허용, 카카오·Apple 공급자 자리), Realtime, Storage 활성. 문서에 "원격 프로젝트는 소유자가 **Seoul `ap-northeast-2` 무료 플랜**으로 만든다(무료 프로젝트는 비활동 시 일시 정지됨)" 적기(`supabase/README.md`) → 수락: `supabase start`로 로컬 스택이 뜨고 `supabase status`가 성공.
- [x] T005 [P] 앱 식별자 한 곳에 모으기 `apps/mobile/src/config/identity.ts`: `export const APP_IDENTITY = { name: 'Aroom', slug: 'aroom', iosBundleId: 'com.jinjinstar.aroom', androidApplicationId: 'com.jinjinstar.aroom', supportDomain: 'aroom.jinjinstar.com', supportEmail: null as string | null, PLACEHOLDER: true } as const`(주석에 `TODO(G2 이름 확인 전: 스토어에 등록 금지)`)를 두고 `app.config.ts`가 이 값만 읽게 한다. `supportEmail`은 `null`(공개 지원 이메일이 아직 없고 만들지 않는다. G10). 저장소·git 설정의 이메일을 쓰지 않는다 → 수락: 문자열 `com.jinjinstar.aroom`가 `identity.ts` 외에는 코드에 없다(grep 테스트 `apps/mobile/src/config/__tests__/identity.test.ts`).
- [x] T006 [P] `apps/mobile/eas.json`에 `development`(개발 클라이언트), `preview`(내부 배포), `production` 프로필을 정의하되 **스토어 제출(`submit`) 설정은 넣지 않는다**(G2·G3 전). 문서 `apps/mobile/README.md`에 EAS 무료 플랜 한도(월 15 iOS + 15 Android 빌드)와 "Expo 계정은 소유자가 만든다" 적기 → 수락: `eas.json`이 JSON 스키마 검증을 통과하고 `submit` 키가 없다.
- [x] T007 비밀 처리 규칙 만들기: `supabase/functions/.env.example`에 `ANTHROPIC_API_KEY=`(값 비움, 주석: "소유자의 Claude Max 요금제 포함 월 $100 API 크레딧에 연결된 **Console API 키**만 사용. 채팅 로그인·Claude Code 한도·OAuth 토큰은 쓰지 않는다. 이 프로젝트 전용 Console workspace에 지출 한도를 둔다. 크레딧은 결제 주기마다 소멸하고 잔액 0이면 요청이 멈춘다. 공개 출시 전 유료 크레딧 전환(G8)"), `SUPABASE_SERVICE_ROLE_KEY=`(값 비움), `docs/secrets.md`에 "서버 비밀은 `supabase secrets set`으로만 입력, 앱·저장소·로그·PR·채팅에 두지 않는다" 적기. `.github/workflows/secret-scan.yml`에 gitleaks 실행 → 수락: `gitleaks detect`가 통과하고, `.env.example`에 실제 키 문자열이 없다.
- [x] T008 [P] ESLint(typescript-eslint, react-native, `eslint-plugin-i18next`의 `no-literal-string`을 `apps/mobile/src/features/**`·`src/ui/**`에 적용), Prettier, `pnpm lint`·`pnpm typecheck` 스크립트를 루트에 추가 → 수락: 컴포넌트에 한글/영문 리터럴을 직접 쓰면 lint가 실패한다(FR-019 "화면 코드에 표시 문자열 금지").
- [x] T009 [P] `.github/workflows/ci.yml`: install → lint → typecheck → `scene-contract` Vitest → mobile Jest → `supabase db start` + `supabase test db`(pgTAP) → `deno test`(functions) → 스키마 동일성 검사(`@couple/scene-contract`의 `schemas/*.json`이 `specs/001-couple-prompt-todo/contracts/*.schema.json`과 바이트 동일) → 수락: PR에서 모든 단계가 돌고 스키마가 어긋나면 실패한다.

---

## Phase 2: Foundational (모든 사용자 스토리가 기다리는 기반)

**목적**: 계약·검증기·DB 기본 스키마·서버 공통 코드·앱 뼈대(i18n·테마·글꼴·카탈로그·로더). **이 단계가 끝나기 전에는 어떤 스토리도 시작하지 않는다.**

### 2-A. 계약과 검증기 (`packages/scene-contract`) — 테스트 먼저

- [x] T010 [P] 테스트 먼저(실패 확인): `packages/scene-contract/tests/scene.contract.test.ts`. 픽스처 `packages/scene-contract/fixtures/scene/*.json`로 quickstart A 사례 전부: 유효(허용 ID, 오브젝트 ≤16, 텍스트 ≤3), **경계 실패**(17번째 오브젝트, 4번째 문구, 좌표 <0 또는 >1, 회전 범위 초과, 텍스트 길이 초과), **보안 실패**(임의 필드, URL, SVG/HTML, script, 이벤트 속성, 알 수 없는/은퇴된 asset ID), **마스코트 사례**(새 방에 `app_mascot` 정확히 1개, 마스코트 포함 16개 경계, `mascotState`·착용·색·표정·포즈 필드와 중복 마스코트 거부) → 수락: 모든 사례가 기대 결과(통과/거부+오류 위치)로 단언되고 구현 전에는 실패한다.
- [x] T011 [P] 테스트 먼저: `packages/scene-contract/tests/theme.contract.test.ts` + `fixtures/theme/*.json` — `room-theme.schema.json`(`mode: day|night|follow_time`, IANA `timeZone`, 낮/밤 배경색·팔레트·에셋 variant), `room-presentation.schema.json`(D-day 표현: `visible`, `x`,`y`,`width`,`height`, `styleToken`, `textScale`, `surfaceToken`), `room-prompt-session.schema.json`(`status: occupied|released|expired` 등)의 유효·무효 사례 → 수락: 알 수 없는 필드를 거부하고 `follow_time` 기본·`timeZone` 필수를 단언한다.
- [x] T012 `packages/scene-contract/schemas/`에 `specs/001-couple-prompt-todo/contracts/*.schema.json` 4개를 **그대로 복사**하고 `pnpm --filter @couple/scene-contract sync:schemas`(복사 스크립트 `scripts/sync-schemas.mjs`)로 재동기화할 수 있게 한다 → 수락: CI 동일성 검사(T009)가 통과한다.
- [x] T013 `packages/scene-contract/src/validate.ts`: Ajv(strict, `additionalProperties:false` 존중)로 `validateScene`, `validateTheme`, `validatePresentation`, `validateSessionDoc` 구현. 결과 형식 `{ ok: boolean, errors: { path: string, code: string }[] }`. 서버와 앱이 **같은 함수**를 쓴다 → 수락: T010·T011가 모두 통과한다.
- [x] T014 테스트 먼저(`packages/scene-contract/tests/geometry.test.ts`) 후 구현(`src/geometry.ts`, `src/protectedZones.ts`): 회전한 bounding box, 장면 가장자리 밖 노드, 상단·하단 시스템 안전 영역, 네이티브 컨트롤·D-day 뷰 침범(보호 영역) 계산. 안전 영역 입력은 파라미터(iOS 47/34, Android 32/24는 디자인 가정값 — `design/handoff.md` §8) → 수락: 좁은/넓은 비율·큰 글자 사례에서 침범 노드를 정확히 보고한다.
- [x] T015 `packages/scene-contract/src/mascot.ts`: `ensureSingleMascot(scene)`, `defaultMascotPlacement()`(기본 자리·크기는 `design/interaction-notes.md` §11), `rejectMascotAppearance(candidate)`(`assetId: app_mascot` 외 마스코트 표현·상태 필드 거부). 마스코트는 16개 한도에 **포함** → 수락: T010의 마스코트 사례가 통과한다.
- [x] T016 `packages/scene-contract/scripts/make-parity-fixtures.mjs`: 서버(Deno)와 앱(Jest)이 같은 입력으로 같은 결과를 내는지 대조하는 공용 픽스처(`fixtures/parity/*.json`, 입력+기대 결과) 생성 → 수락: Jest·Deno 양쪽에서 같은 파일을 읽어 같은 결과를 단언하는 테스트가 각각 하나씩 존재한다(Phase 3 이후 서버 측은 `supabase/functions/_shared/__tests__/parity.test.ts`).

### 2-B. DB 기본 스키마와 RLS — 테스트 먼저

- [x] T017 [P] 마이그레이션 정책 `docs/migrations.md`와 `supabase/README.md`: 모든 마이그레이션은 앞으로 적용(forward)하며 **되돌릴 수 있는 방법 또는 명시적 삭제 정책**을 파일 머리 주석에 적는다(헌법 V "저장 데이터 변경은 안전한 이전·복구·삭제 정책을 가진다"). 파괴적 변경(열 삭제·타입 축소)은 백업 확인 후에만, 공유 행은 `space_id`와 RLS 정책 없이 추가하지 않는다 → 수락: `supabase db reset`이 모든 마이그레이션을 처음부터 적용하고, CI 린트 스크립트 `tools/ci/check-migrations.mjs`가 머리 주석(`-- rollback:` 또는 `-- deletion-policy:`)이 없는 마이그레이션을 실패시킨다.
- [x] T018 [P] 테스트 먼저: `supabase/tests/rls_base.test.sql`(pgTAP). 사용자 A·B는 같은 공간 구성원, C는 비구성원. A·B만 공간·구성원·초대 행을 읽고 쓰며, C는 공간 ID를 알아도 읽기/수정/채널 구독 불가. 종료(`ended`) 공간은 읽기·쓰기·채널 구독 모두 거부 → 수락: 구현 전에는 실패한다.
- [x] T019 `supabase/migrations/20261101000100_base_schema.sql`: `user_profile`(`user_id` PK, `locale`(ko-KR|en-US|ja-JP|null), `time_zone`, `ui_theme` check in (`system`,`light`,`dark`) default `system`, `created_at`, `updated_at`), `couple_space`(`status` check in (`active`,`ended`), `anniversary_date date`, `created_at`, `updated_at`, `ended_at`, `purge_after`, `ended_reason` check in (`ended`,`disconnect`,`account_deletion`), `ended_by_user_id`), `space_member`(복합 PK `(space_id,user_id)`, `role` check = `member`, `joined_at`, `left_at`, `space_active boolean not null default true`(공간이 `active`인 동안만 true; 종료·연결 끊기 때 같은 트랜잭션에서 false; 복구는 없다), `ai_consent_state` check in (`not_given`,`granted`,`revoked`) default `not_given`, `ai_consent_at`, `ai_consent_text_version`, `ai_consent_revoked_at`), `idempotency_key`(`key uuid`, `user_id`, `endpoint`, `response jsonb`, `created_at`, unique `(user_id,key,endpoint)`), `space_lifecycle_event`(`id`, `space_id`, `event_type` check in (`ended`,`disconnected`,`deletion_started`,`deletion_completed`,`cover_changed`,`cover_removed`,`milestone_preset_previewed`,`milestone_preset_applied`), `actor_user_id`, `occurred_at`, `metadata jsonb`(개인 내용 금지)). **한 사용자는 활성 공간의 `space_member`를 하나만 가진다**(부분 고유 인덱스 `unique (user_id) where space_active` — 상태가 다른 테이블에 있어 비정규화 열 `space_active`로 건다. **종료(`ended`, 소프트 삭제)된 공간의 행은 `space_active=false`라서 새 공간을 막지 않는다**: 결정 FR-057, Decided 33) → 수락: 마이그레이션이 로컬에 적용되고 같은 사용자의 두 번째 `space_active=true` 행 삽입이 DB에서 거부되며, `space_active=false` 행이 있는 사용자는 새 활성 공간 행을 가질 수 있다.
- [x] T020 `supabase/migrations/20261101000200_rls_base.sql`: 모든 공유 테이블에 RLS 활성화, 헬퍼 `is_space_member(space_id)`·`is_space_active(space_id)`(security definer), 정책(구성원만 select, 활성 공간 구성원만 write), `space_member`는 본인 동의 행만 수정 → 수락: T018가 통과한다.
- [x] T021 [P] `supabase/functions/_shared/`: `auth.ts`(JWT 검증→`userId`), `errors.ts`(`{ error: { code, retryable } }` 형식, 코드 목록 `VERSION_CONFLICT`, `SESSION_OCCUPIED`, `SESSION_CONFLICT`, `DAILY_LIMIT_REACHED`, `ALREADY_IN_SPACE`, `GENERATION_REFUSED`, `GENERATION_FAILED`, `GENERATION_DISABLED`, `LIBRARY_FULL`, `RATE_LIMITED`, `REPORT_RATE_LIMITED`, `ROOM_FULL`, `NOTHING_TO_UNDO`, `PREVIEW_CHANGED`, `ALREADY_APPLIED`, `MILESTONE_PASSED`, `COVER_FORMAT_UNSUPPORTED`, `COVER_TOO_LARGE`, `COVER_INVALID_IMAGE`, `UNSUPPORTED_REQUEST`, `INVALID_CANDIDATE`; **자연어 문구·locale 키·원문 프롬프트를 응답에 넣지 않는다**), `idempotency.ts`(모든 변경 요청이 `Idempotency-Key` UUID를 받아 같은 키 재요청에 저장된 응답 반환), `logging.ts`(로그 필드 allowlist: 키·프롬프트 원문·서명된 URL·초대 코드 금지) → 수락: Deno 단위 테스트 `supabase/functions/_shared/__tests__/shared.test.ts`가 (a) 오류 형식, (b) 같은 키 재요청 멱등, (c) 로그에 금지 필드가 남지 않음을 단언한다.
- [x] T022 [P] `supabase/migrations/20261101000300_rate_and_audit.sql`: `daily_request_count`(`space_id`, `local_date date`(방 시간대 기준), `count int`, PK `(space_id, local_date)`)와 예약 표 `daily_request_reservation`(`request_id` PK, `space_id`, `local_date`, `status` check in (`reserved`,`succeeded`,`released`), `created_at`), 원자적 함수 `reserve_daily_request(space_id, request_id, limit int default 3)`(성공 횟수 + 진행 중 예약이 한도 이상이면 예외 `DAILY_LIMIT_REACHED`), `finalize_daily_request(request_id, succeeded boolean)`(성공일 때만 같은 트랜잭션에서 `count`를 올리고 실패·거절이면 `released`로 바꿔 **센 값을 바꾸지 않는다**) — **커플당 하루 최대 3회, 성공한 미리 보기만 센다**(결정·가정 Decided 27), 날짜 키는 **방 시간대의 날짜**(자정 초기화) → 수락: pgTAP `supabase/tests/daily_limit.test.sql`이 3번째 성공 허용·4번째 거부·병렬 예약에서도 초과 불가·실패·거절 뒤 횟수 불변(10번 실패해도 성공 3회 가능)·자정 경계(시간대 2개)를 단언한다(테스트를 함수보다 먼저 작성).

### 2-C. 앱 뼈대 (`apps/mobile`)

- [x] T023 [P] 테스트 먼저: `apps/mobile/src/i18n/__tests__/locales.test.ts` — `ko`·`en`·`ja` 리소스가 **같은 키 집합(640개)**을 가지고, 빈 값이 없고, `{name}` 같은 보간 변수가 세 언어에서 일치하며, `design/i18n-copy.md`의 키 수 표기("총 키 수: **640**")와 같다 → 수락: 구현 전에는 실패.
- [x] T024 `tools/i18n/import-design-copy.mjs`: `design/i18n-copy.md`의 표(`| \`키\` | ko | en | ja |`)를 읽어 `apps/mobile/src/i18n/locales/{ko-KR,en-US,ja-JP}.json`과 타입 `apps/mobile/src/i18n/keys.d.ts`를 생성. 키 이름은 바꾸지 않는다(`report.block*`·`prompt.quota.body` 포함 — 화면 이름이 '연결 끊기'로 바뀌어도 키는 유지). 영어·일본어는 **원어민 검수 전 초안**(G4) 표시를 `locales/README.md`에 적는다 → 수락: T023이 통과한다.
- [x] T025 `apps/mobile/src/i18n/index.ts`: `expo-localization`으로 기기 언어를 읽고 `i18next`+`react-i18next` 초기화, 앱 내 언어 선택이 기기 언어보다 우선(`user_profile.locale`과 `expo-secure-store`/AsyncStorage에 저장), 날짜·숫자는 `Intl`, D-day 문구는 메시지 리소스 → 수락: `apps/mobile/src/i18n/__tests__/setup.test.ts`가 기기 언어 `ja-JP`에서 시작→앱에서 `ko-KR` 선택→문자열이 바뀌는지 단언한다.
- [x] T026 `tools/tokens/build-tokens.mjs`로 `design/tokens.json`에서 `apps/mobile/src/theme/tokens.ts`(색·글꼴·간격·안전 영역·방 낮/밤 × 앱 light/dark × 고대비 8조합) 생성. 대비 검증은 `design/tools/contrast-check.mjs`를 호출하는 테스트 `apps/mobile/src/theme/__tests__/contrast.test.ts` → 수락: "229 pairs checked, 0 failures"에 해당하는 결과를 단언한다.
- [x] T027 `apps/mobile/assets/fonts/`에 글꼴 파일(Inter, Noto Sans KR, Noto Sans JP, 손글씨 Gaegu·Yomogi, Gowun Dodum, Zen Maru Gothic: `design/handoff.md` §5 5번 "권장 9파일")과 `OFL` 고지를 넣고 `apps/mobile/src/theme/fonts.ts`로 `expo-font` 로딩. 손글씨는 토큰 크기 ≥20 굵은 제목에만(`design/handoff.md` §3). **번들 크기는 EAS 산출물로 실측 필요(G6)** — 이 태스크는 파일 배치와 로딩만 → 수락: 로딩 전 스플래시 유지, 한글·일본어·라틴 글리프 픽스처 렌더 테스트가 누락 글리프 없이 통과.
- [x] T028 [P] `tools/catalog/build-manifest.mjs`: `design/assets-manifest.csv`에서 **카탈로그 24개**(방 안 마스코트 포즈 6: `mascot_wave_main`, `mascot_cheer`, `mascot_lookup`, `mascot_walk`, `mascot_lie`, `mascot_sleep` + 일반 오브젝트 18: `obj_decor_{books,cushion,frame,lamp}`, `obj_keep_{gift,letter,mug}`, `obj_party_{balloon,cake,ribbon}`, `obj_plant_{flowerpot,potted}`, `obj_shape_{dots,sparkle,squiggle}`, `obj_sky_{cloud,moon,star}`)를 추려 `assets/catalog/manifest.json` 생성(`asset_id`, `catalog_version`, `asset_kind: room_object|mascot_pose`, `uri`, `format`, `width_px`, `height_px`, `byte_size`, `sha256`, `license_kind`, `rights_record_ref`, `status: active|retired`). 방 밖 일러스트 5종(`star_sit`,`box`,`heart`,`phone`,`back`)은 **넣지 않는다**. 장면의 마스코트 오브젝트는 `assetId: app_mascot` 하나이고 포즈 이미지 6장은 클라이언트가 고른다 → 수락: 항목 수 24, `asset_kind`별 6/18, 모든 `sha256`이 실제 파일과 일치(`assets/catalog/__tests__/manifest.test.mjs`).
- [x] T029 `tools/catalog/build-placeholders.mjs`: `design/assets-sketch/obj_*.svg`(낮/밤 variant `obj_decor_lamp__night.svg` 포함)을 `assets/catalog/images/*@2x.png`(PNG-8, 에셋 최종 포맷은 G7에서 확정)로 변환 — **18개 일반 오브젝트는 자리표시 스케치**이고 최종 그림은 일러스트레이터 납품 후 교체(`design/assets-spec.md` §9). 마스코트 6포즈는 `design/mascot/harmonized/mascot_*@2x.png`를 복사 → 수락: 24개 이미지가 `assets/catalog/images/`에 있고 매니페스트 해시와 일치. 카탈로그 manifest는 `rights_record_ref`에 "placeholder-sketch-not-final"(오브젝트) / "ai-generated-master-used-as-is-risk-accepted"(마스코트, 닮음 검사·법률 검토는 출시 전 권장 G11)를 기록한다.
- [x] T030 `apps/mobile/src/scene/catalog.ts`: 번들 `manifest.json`을 읽어 `getAsset(assetId)`(알 수 없는/은퇴 ID는 `null`), 마스코트 포즈 이미지 맵, 낮/밤 variant 선택 → 수락: `apps/mobile/src/scene/__tests__/catalog.test.ts`가 24개 로드, 알 수 없는 ID null, 은퇴 에셋 레거시 렌더 표시를 단언한다.
- [x] T031 [P] `apps/mobile/src/lib/api.ts`(Supabase Functions 호출 래퍼: 모든 변경 요청에 `Idempotency-Key` UUID 생성·재시도 동일 키 사용), `apps/mobile/src/lib/errors.ts`(서버 오류 `code` → i18n 키 매핑 표 — `design/i18n-copy.md`의 대응 표를 `contracts/api.md` 코드 이름에 맞춰 확정, 결정 대기 항목 아님), `apps/mobile/src/lib/supabase.ts` → 수락: 단위 테스트가 (a) 같은 재시도에 같은 키, (b) 모든 오류 코드가 번역 키를 가짐을 단언한다.
- [x] T032 `apps/mobile/src/app/` 라우트 뼈대(Expo Router): `(auth)/welcome.tsx`, `(auth)/login.tsx`, `(onboarding)/create-space.tsx`, `(onboarding)/invite.tsx`, `(onboarding)/join.tsx`, `(tabs)/_layout.tsx`(**시스템 탭 바 3개: 홈·방·설정**, 기록 탭 없음), `(tabs)/home.tsx`, `(tabs)/room.tsx`, `(tabs)/settings/index.tsx`. 비선택 탭 틴트를 반드시 지정(`design/handoff.md` §3) → 수락: `apps/mobile/src/app/__tests__/routes.test.tsx`가 탭 3개와 라우트 존재를 단언한다.
- [x] T033 `apps/mobile/src/ui/`에 `design/components.md` §2~§8의 공용 컴포넌트: `Button`(primary/secondary/danger/dangerOutline/ghost), `TextField`, `Chip`, `Banner`(info·success·warn·danger·offline), `Toast`, `Skeleton`, `Dialog`, `BottomSheet`, `ListRow`, `OccupancyChip`. 터치 영역 ≥44pt, 접근성 이름, 대비는 T026 사용 → 수락: 스냅샷 + 접근성 테스트(`apps/mobile/src/ui/__tests__/*.test.tsx`)가 라벨·역할·터치 크기를 단언한다.
- [x] T034 `apps/mobile/src/ui/motion.ts`: `useReducedMotion()`(iOS 동작 줄이기·Android 애니메이션 끔)과 순환 로더 `apps/mobile/src/ui/CycleLoader.tsx`(화분→풍선→창문→책, 4.8초 주기, 동작 줄이기에서는 첫 오브젝트 정지 그림, 전역 기본 로딩). 창문은 **로더 전용 그림**(`design/boards S03`의 스케치 `WINDOW_SVG`)이고 카탈로그에 넣지 않는다(카탈로그 24개 그대로; 결정·가정, `spec.md` Decided 25) → 수락: `CycleLoader.test.tsx`가 정상 순환·동작 줄이기 정지를 단언한다.

**체크포인트**: T001~T034 완료 시 앱이 빈 화면 라우트·번역·테마·글꼴·카탈로그·로더를 갖고, 서버에는 기본 스키마·RLS·공통 코드·검증기가 있다.

---

## Phase 3: User Story 1 — 커플 공간 만들고 D-day 확인하기 (P1)

**목표**: 로그인 → 연령 확인 문구 → 공간 만들기(함께한 날짜) → 초대 코드 공유 → 상대 수락 → 홈에서 같은 D-day 확인. (FR-001~FR-007, FR-057, FR-058)

**독립 테스트**: 두 사용자가 초대 코드로 같은 공간에 참여하고 같은 날짜 기준의 일수를 본다. 이미 공간이 있는 사용자의 수락은 거절되고 코드가 소모되지 않는다.

### 테스트 먼저 (실패 확인 후 구현)

- [x] T035 [P] [US1] `supabase/tests/invitation.test.sql`(pgTAP)과 `supabase/functions/invitations/__tests__/invitations.test.ts`(Deno): ① 24시간 만료 거절 ② 한 번 수락된 코드 재사용 거절 ③ 위조 코드 거절(해시 불일치) ④ 두 명이 찬 뒤 제3 구성원 수락 거절 ⑤ 재발급 시 기존 미사용 코드 `revoked`(원자적) ⑥ **이미 다른 활성 공간의 구성원인 사용자의 수락은 `409 ALREADY_IN_SPACE`이고 코드는 `active`로 남아 공간에서 나온 뒤 같은 코드로 가입된다. 종료된(`ended`) 공간만 있는 사용자의 수락은 바로 허용된다(활성 공간만 셈, 결정·가정)** ⑦ 코드 형식: 8자, 4-4 표시, 혼동 문자 `0 O 1 I` 제외, 원문은 응답에서 한 번만 → 수락: 구현 전 실패.
- [x] T036 [P] [US1] `supabase/tests/create_space.test.sql`: `POST /spaces` 트랜잭션이 공간+첫 구성원을 함께 만들고, 이미 **활성** 공간 구성원인 사용자는 `ALREADY_IN_SPACE`, **종료(`ended`, 픽스처로 만든 상태)된 공간만 있는 사용자는 새 공간 생성 가능**(활성 공간만 셈), 그리고 `GET /spaces/mine`이 (활성만 / 종료 알림만 / 둘 다 / 없음) 네 경우에 `active`와 `ended: {kind, by, at}`(가장 최근 알림 하나, 공간 데이터·ID·삭제 예정일 없음)를 맞게 돌려주고 비구성원 공간은 절대 담지 않음 → 수락: 구현 전 실패.
- [x] T037 [P] [US1] `packages/scene-contract`가 아니라 `apps/mobile/src/lib/__tests__/dday.test.ts`와 `supabase/functions/_shared/__tests__/dday.test.ts`(같은 픽스처 `apps/mobile/src/lib/__fixtures__/dday.json` 공유): 함께한 날짜 **당일 = 1일째**, 방 시간대 자정 경계(예: `Asia/Seoul`·`America/Los_Angeles` 2개), 미래 날짜·존재하지 않는 날짜(2월 30일) 거절, ko/en/ja D-day 문구(어순·`Intl` 날짜) → 수락: 앱과 서버 결과가 같다는 단언 포함, 구현 전 실패.
- [x] T038 [P] [US1] `apps/mobile/src/features/auth/__tests__/agegate.test.tsx`: 가입 시작 화면의 약관 줄이 키 `onb.legal.lead`("계속하면 만 14세 이상이며 아래 내용에 동의하는 것으로 봐요" 세 언어)와 `onb.legal.links`를 보여 주고, **생년월일 입력 필드가 없으며**, 서버로 생년월일을 보내지 않는다 → 수락: 구현 전 실패. 문구의 최종 확정은 법률 검토(G1)이므로 키 값만 바꾸면 반영되게 둔다.
- [x] T039 [P] [US1] `supabase/tests/rls_snapshot.test.sql`: `GET snapshot` 용 뷰/함수가 구성원에게만 `anniversary_date`·구성원 수·초대 상태를 보여 주고 비구성원은 0행 → 수락: 구현 전 실패.

### 서버 구현

- [x] T040 [US1] `supabase/migrations/20261101000400_invitation.sql`: `invitation`(`id`, `space_id`, `created_by_user_id`, `token_hash`(**코드 원문 저장 금지**), `status` check in (`active`,`accepted`,`expired`,`revoked`), `created_at`, `expires_at`(= created_at + 24h), `accepted_at`, `accepted_by_user_id`, `revoked_at`)와 RLS(구성원 읽기, 쓰기는 RPC로만). RPC `create_space(anniversary_date)`, `create_invitation(space_id)`(기존 활성 초대를 같은 트랜잭션에서 `revoked`), `accept_invitation(code)`(해시 대조·미만료·미사용·대상 공간 활성·멤버 1명·**호출자가 다른 공간 구성원이 아님**을 단일 트랜잭션에서 확인, 성공 시 코드 즉시 소비), `update_anniversary(space_id, date)`; 공간 종료·삭제가 아닌 상태에서만 → 수락: T035·T036의 DB 부분이 통과한다.
- [x] T041 [P] [US1] `supabase/functions/_shared/inviteCode.ts`: 알파벳 `ABCDEFGHJKLMNPQRSTUVWXYZ23456789`에서 `0 O 1 I` 제외(CSPRNG), 8자를 4-4로 표시(`K7M4-Q9XP`), 입력 정규화(대소문자·하이픈·공백 무시), 해시는 SHA-256(+서버 pepper 비밀) → 수락: Deno 테스트가 형식·제외 문자·정규화·충돌 없음(10만 개 샘플)을 단언한다.
- [x] T042 [US1] `supabase/migrations/20261101000450_invitation_attempts.sql`과 `supabase/functions/invitations/index.ts`에서 **코드 입력 시도 제한**(사용자당 시간당 실패 N회 후 429; N=10은 구현 가정, 값은 서버 설정) — 8자 코드의 무차별 대입 방지 → 수락: Deno 테스트가 N+1번째 실패 시도가 `429`이고 정상 코드도 잠금 동안 거절되는 것을 단언(잠금 해제 시각 포함).
- [x] T043 [US1] `supabase/functions/spaces/index.ts`: `POST /spaces`, `GET /spaces/mine`(제안: 앱이 열 때 들어갈 공간을 정한다 — 빈칸이어서 추가), `GET /spaces/{id}/snapshot`(종료된 공간이면 비구성원처럼 `404`), 종료 알림 확인 `POST /spaces/mine/ended/ack`는 T096, `PATCH /spaces/{id}/anniversary`(응답에 `milestonesReset` 필드 자리 — US7에서 채움). 공통 코드(T021)를 쓰고 `ALREADY_IN_SPACE`를 `409`로 반환 → 수락: T036·T039가 통과한다.
- [x] T044 [US1] `supabase/functions/invitations/index.ts`: `POST /spaces/{id}/invitations`(요청 `{expiresInSeconds:86400}`는 무시하고 서버가 24시간 고정; 응답 201 `{invitationId, code, expiresAt}`), `POST /invitations/accept`(요청 `{code}`, 응답 200 `{spaceId, status:'active', memberCount:2}`, 실패 시 코드 소모 안 함) → 수락: T035가 통과한다.
- [x] T045 [P] [US1] `supabase/functions/profile/index.ts`: `GET /profile/preferences`(현재 `{locale, uiTheme}` 반환; 스냅샷이 "프로필 설정 API로 읽고 저장"한다고 했으나 읽기 엔드포인트가 계약에 없어 이 태스크에서 `contracts/api.md`에 추가함)와 `PATCH /profile/preferences`(요청 `{locale: 'ko-KR'|'en-US'|'ja-JP'|null, uiTheme: 'system'|'light'|'dark'}`; `null`은 기기 언어, 지원 locale 목록은 앱 번역 리소스 manifest와 일치). 공유 장면이 사용자 개인 설정을 바꿀 수 없다 → 수락: 허용 외 locale·uiTheme 거절 테스트 통과.
- [x] T046 [P] [US1] 이메일 OTP(6자리 코드 기본, 메일 링크도 허용)·카카오·Apple OAuth를 Supabase Auth로 설정: `supabase/config.toml`(로컬), `docs/auth-setup.md`(원격 프로젝트에서 소유자가 해야 할 일: Kakao Developers 앱·Redirect URI·동의항목, Apple Services ID·redirect domain, Expo universal link). **카카오·Apple 공식 SDK/에셋 교체는 G5** → 수락: 로컬에서 이메일 OTP로 가입·로그인되는 통합 테스트 `supabase/functions/_shared/__tests__/auth.int.test.ts` 통과. **개정(2026-10-27, 소유자 결정)**: 제품 로그인은 Apple만(네이티브 id token, Client IDs = 번들 ID), 카카오는 비활성 플래그, 이메일 OTP는 개발 빌드·로컬 전용 테스트 로그인(가정). 설정은 `docs/apple-sign-in-setup.md`.

### 앱 구현

- [x] T047 [US1] `apps/mobile/src/app/(auth)/welcome.tsx`와 `apps/mobile/src/features/auth/Welcome.tsx`: 소개 3장(함께한 날 세기 · 프롬프트로 방 꾸미기 · 마스코트 — 3번째 장이 앱 전체에서 **유일한** 캐릭터 히어로), 이름·슬로건 묶음(`brand.tagline`, 글자 크기 130% 이상에서 숨김), 약관 줄(T038 통과 조건), `이미 계정이 있어요` 경로. 모든 문자열은 `t('onb.*')` 키 → 수락: T038가 통과하고 lint(no-literal-string)가 통과한다.
- [x] T048 [US1] `apps/mobile/src/app/(auth)/login.tsx`, `email-code.tsx`, `apps/mobile/src/features/auth/`: 카카오·Apple·이메일 선택(최근 사용 방법 강조), 이메일 6자리 코드 입력·재전송·만료·시도 과다 상태, OAuth 이동·복귀·취소·재시도, 처리 중은 T034의 순환 로더. 카카오·Apple 버튼은 **자리표시 컴포넌트**(G5에서 공식 에셋으로 교체) → 수락: `apps/mobile/src/features/auth/__tests__/login.test.tsx`가 상태별 화면(처리 중·취소·오류)을 단언한다. **개정(2026-10-27)**: 로그인 화면은 iOS에서 Apple 공식 버튼(`expo-apple-authentication`)만 보이고, 카카오 버튼은 `KAKAO_ENABLED=false`로 숨김, 이메일은 개발 빌드에서만(`src/config/auth.ts`). Android는 Apple 버튼 없음.
- [x] T049 [US1] `apps/mobile/src/app/(onboarding)/create-space.tsx`: 함께한 날짜 입력 — **3열 휠(달력 아님)**, 미래 날짜·존재하지 않는 날짜 검증 메시지, 방 시간대 안내(생성자 IANA 시간대로 초기화), 생성 중·성공·연결 오류. 이미 공간이 있으면 `ALREADY_IN_SPACE` 안내(`join.hasSpace.*`) → 수락: `create-space.test.tsx`가 유효성·오류 매핑을 단언.
- [x] T050 [US1] `apps/mobile/src/app/(onboarding)/invite.tsx`: 코드 생성 중, 8자 코드(4-4)와 만료 시각(24시간), OS 공유 시트·복사, 만료 임박·만료됨, 재발급(기존 미사용 코드 폐기 안내), 공유 취소, 네트워크 오류, 상대 대기(떠다니는 편지 모션 3.2초, 동작 줄이기에서 정지). 서버 코드는 화면 밖 로그에 남기지 않는다 → 수락: `invite.test.tsx`가 만료·재발급 상태 전이를 단언.
- [x] T051 [US1] `apps/mobile/src/app/(onboarding)/join.tsx`: 코드 입력(붙여넣기 제공, 8자 4-4 마스크), 확인, 초대 상대·공간 확인 후 수락, 오류 6종(만료·사용됨·유효하지 않음·인원 초과·이미 다른 공간 `join.hasSpace.*`·시도 과다). `이미 다른 공간에 있어요` 배너 + "지금 공간 보기" → 수락: `join.test.tsx`가 각 오류 코드→번역 키 매핑과 `ALREADY_IN_SPACE`에서 입력값이 유지됨을 단언.
- [x] T052 [US1] `apps/mobile/src/lib/dday.ts`(앱)·`supabase/functions/_shared/dday.ts`(서버): T037 통과 구현. `apps/mobile/src/features/home/HomeScreen.tsx`와 `apps/mobile/src/app/(tabs)/home.tsx`: 함께한 일수(풍선·리본 일러스트), 날짜 편집(3열 휠), 초대 미완료 상태, 두 사람 참여 상태, 로딩·동기화 오류·오프라인(마지막 상태 읽기 전용). 홈 위쪽 사진 자리는 기본 바탕(사진 기능은 US6) → 수락: T037 통과, `HomeScreen.test.tsx`가 상태별 렌더를 단언.
- [x] T053 [US1] `apps/mobile/src/features/space/useSpaceSnapshot.ts`: 앱을 열 때 `GET /spaces/mine`으로 들어갈 공간(활성 → 없으면 가장 최근 종료 공간의 종료 화면 → 없으면 공간 만들기)을 정하고, 앱을 열 때·포그라운드 복귀 때 `GET snapshot` 호출 + Supabase Realtime 구독(채널은 구성원인 `space_id`만, payload에는 변경 종류와 ID만)으로 초대자가 최신 구성원 상태를 보게 한다 → 수락: 두 클라이언트 모의 테스트에서 수락 후 초대자 화면이 `memberCount:2`로 바뀐다.

**체크포인트**: US1이 단독으로 동작·검증 가능(두 기기 또는 두 에뮬레이터).

---

## Phase 4: User Story 4 — 공유 프롬프트 세션 이어가기 (P1, 방 꾸미기 apply의 선행 조건)

**목표**: 공간당 한 명만 점유(lease), 상대는 실시간 읽기 전용, 만료·takeover. (FR-030, FR-031) US2의 confirm/undo가 이 점유를 쓰므로 US2보다 먼저 만든다.

**독립 테스트**: 두 기기에서 동시 acquire 중 한 명만 성공, 비점유자 읽기 전용, 3분 유휴 만료 후 takeover.

### 테스트 먼저

- [x] T054 [P] [US4] `supabase/tests/prompt_session.test.sql`(pgTAP, 고정 시계 주입 함수 `app_now()`): ① 동시 acquire 두 건 중 정확히 하나만 `occupied`, 다른 하나는 `SESSION_OCCUPIED`+owner/expiry ② heartbeat는 **최근 사용자 활동이 있을 때만** `expires_at`을 서버 시각 + 3분으로 연장 ③ heartbeat가 멈추면 3분 후 `expired` ④ takeover는 `expectedOwnerUserId`와 만료를 원자적으로 비교(유효한 lease면 `SESSION_OCCUPIED`) ⑤ `release` 사유 `cancel`/confirm 시 해제 ⑥ 비구성원·종료 공간은 거부 → 수락: 구현 전 실패.
- [x] T055 [P] [US4] `supabase/functions/prompt-session/__tests__/conversation.test.ts`: 두 구성원 모두 `GET prompt-conversation`으로 메시지(`kind: user_prompt|preview|status`)를 시간순으로 읽고 제3자는 403, Realtime payload는 **메시지/미리 보기 ID와 상태만**(내용 없음) → 수락: 구현 전 실패.
- [x] T056 [P] [US4] `apps/mobile/src/features/prompt/__tests__/session.test.tsx`: 점유 중인 상대의 화면은 입력·제출·적용이 비활성이고 점유자 표시·만료 예정 칩이 보이며, 점유자는 만료 30초 전 경고(`prompt.idleHint` 계열 키)를 보고, 앱이 백그라운드가 되면 heartbeat를 보내지 않는다(가짜 타이머) → 수락: 구현 전 실패.

### 구현

- [x] T057 [US4] `supabase/migrations/20261101000500_prompt_session.sql`: `prompt_session`(`id`, `space_id`, `owner_user_id`, `status` check in (`occupied`,`released`,`expired`), `acquired_at`, `last_activity_at`, `expires_at`, `heartbeat_at`, `released_at`, `release_reason`, `takeover_count`; **공간당 `occupied` 한 행만**: 부분 고유 인덱스 `unique (space_id) where status='occupied'`), `prompt_message`(`id`, `space_id`, `session_id`, `decoration_request_id`, `author_user_id`, `kind` check in (`user_prompt`,`preview`,`status`), `body_text`, `created_at`)와 RLS(구성원만). RPC `acquire_session`, `heartbeat_session`, `takeover_session`, `release_session`(모두 `security definer`, 서버 시각 `app_now()` 사용). 유휴 시간 3분·경고 30초는 `app_settings` 테이블 값(서버 설정값) → 수락: T054가 통과한다.
- [x] T058 [US4] `supabase/functions/prompt-session/index.ts`: `GET /spaces/{id}/prompt-conversation`, `POST …/prompt-session/acquire`(201 `{sessionId, ownerUserId, expiresAt}` / 409 `SESSION_OCCUPIED`), `…/{sessionId}/heartbeat`, `…/takeover`(`{expectedOwnerUserId, idempotencyKey}`), `…/release`(`{reason:'cancel'}`, 204). 변경 요청은 모두 `Idempotency-Key` 처리 → 수락: T055가 통과한다.
- [x] T059 [US4] `supabase/migrations/20261101000550_realtime_auth.sql`: Realtime 채널 인가 — 인증 주체가 구성원인 `space_id`의 채널만 구독 가능, payload에는 현재 방 버전 ID/번호·변경 종류·변경자·시각·session owner/expiry·message/preview ID만(내용 금지) → 수락: `supabase/tests/realtime_auth.test.sql`에서 제3자 구독이 거부된다.
- [x] T060 [US4] `apps/mobile/src/features/prompt/useSession.ts`(acquire/heartbeat 타이머(포그라운드·입력 활동 때만)/takeover/release, 만료 30초 전 경고 이벤트), `apps/mobile/src/ui/OccupancyChip.tsx` 사용, 비점유자 읽기 전용 모드(`design/components.md` §3.2·§7), takeover 흐름(`prompt.takeover.*` 키) → 수락: T056가 통과한다.

**체크포인트**: 방 편집 없이도 두 기기에서 점유·읽기 전용·만료·takeover가 검증된다.

---

## Phase 5: User Story 2 — 프롬프트로 둘만의 방 꾸미기 (P1)

**목표**: 고정 마스코트가 있는 방 → 동의 → 프롬프트 → 검증된 미리 보기 → 점유자만 적용(되돌릴 수 없음 확인) → 두 사람에게 같은 방. 열린 대화 안 되돌리기, 하루 3회 한도, 마스코트 되살림. (FR-008~FR-018c, FR-025~FR-031)

**독립 테스트**: 서로 다른 프롬프트가 서로 다른 미리 보기를 만들고, 동의 없으면 AI 호출 0회, 4번째 성공 요청은 429, 적용은 점유자만, 적용 뒤 undo는 `ALREADY_APPLIED`.

> **MVP 데모 조각은 이 단계가 끝나면 완성된다(아래 "MVP 컷 라인").**

### 테스트 먼저

- [x] T061 [P] [US2] `supabase/functions/decoration-previews/__tests__/previews.test.ts`(Anthropic **provider spy**/mock 사용): ① **동의 없는 계정·한 사람만 동의한 커플·철회한 사용자·종료 공간**에서 요청 → 네트워크 호출 0회 ② 정상·부적절·금지 IP 지칭·prompt injection·잘못된 JSON·폐기된 ID·보호 영역 충돌 응답 mock ③ repair **최대 1회**(성공/실패 각각) ④ **하루 3번째 성공한 요청 허용·4번째 `429 DAILY_LIMIT_REACHED`**(거절·검증 실패·제공자 오류는 횟수를 쓰지 않음), 병렬 요청에서도 초과 불가, 방 시간대 자정 이후 초기화, 마일스톤 제안은 계수 안 함 ⑤ 모델에 **날짜 원본·이메일·카카오 식별자·초대 코드·계정 세부를 보내지 않음**(spy가 받은 payload 검사) ⑥ 마스코트를 바꾸라는 프롬프트(`옷·색·표정·교체·새로 그리기`)는 `422 UNSUPPORTED_REQUEST`로 거절 ⑦ 오류·로그에 키·원문 없음 → 수락: 구현 전 실패.
- [x] T062 [P] [US2] `supabase/functions/decoration-previews/__tests__/confirm.test.ts` + `supabase/tests/confirm.test.sql`: ① 점유자만 confirm ② confirm = 새 불변 버전 저장 + current pointer 이동 + lease 해제가 **한 트랜잭션** ③ 같은 `Idempotency-Key` 재시도는 한 번만 적용 ④ stale `baseVersion`·동시 apply는 `409 VERSION_CONFLICT`/`SESSION_CONFLICT`, 중복 저장 없음 ⑤ cancel은 공유 방을 바꾸지 않고 lease 해제 ⑥ preview 직후 강제 종료해도 current version 불변 ⑦ **적용된 요청의 undo는 `409 ALREADY_APPLIED`** → 수락: 구현 전 실패.
- [x] T063 [P] [US2] `supabase/functions/prompt-session/__tests__/undo.test.ts`: 열린 대화의 최신 미리 보기를 `reverted`로 바꾸고 바로 앞 미리 보기(없으면 `previewId:null` = 현재 방 보기) 반환, 방 버전 불변, **lease 유지**, 되돌릴 후보 없으면 `409 NOTHING_TO_UNDO`, 이미 바뀌었으면 `409 PREVIEW_CHANGED`, 연속 undo는 이 대화의 미리 보기 범위에서 멈춤, 두 구성원이 같은 미리 보기를 봄 → 수락: 구현 전 실패.
- [x] T064 [P] [US2] `supabase/functions/room/__tests__/mascot_recall.test.ts`: 마스코트가 없을 때만 기본 자리에 1개 추가한 새 방 버전(`source: mascot_recall`), 이미 있으면 200 멱등, 16개 가득이면 `422 ROOM_FULL`, 점유 세션이 활성이면 `409 SESSION_OCCUPIED`, 오래된 `expectedVersion`은 `409 VERSION_CONFLICT`, AI·점유·미리 보기 없이 동작 → 수락: 구현 전 실패.
- [x] T065 [P] [US2] `apps/mobile/src/features/room/__tests__/room.test.tsx`: 새 방 첫 열기에 마스코트 1개, 방 도구 막대는 "꾸미기" 하나뿐(설정·삭제·나가기는 설정 탭 안), D-day 블록은 별도 네이티브 뷰이고 프롬프트로 위치·모양·색·크기만 바뀌며 날짜 값은 안 바뀜, 방에서 제거해도 홈 D-day 유지, 마스코트 제거 시 "아루미 다시 부르기" 컨트롤(점유 중인 상대가 있으면 비활성+이유), 동작 줄이기에서 서서 인사 정지 포즈 → 수락: 구현 전 실패.
- [x] T066 [P] [US2] `apps/mobile/src/features/prompt/__tests__/panel.test.tsx`: 입력 → 제출 → 미리 보기 → **적용 확인 다이얼로그에 "적용한 뒤에는 되돌릴 수 없어요"(키 `preview.confirm.*`)가 보이고 확인해야만 confirm 호출** → 적용 후 되돌리기 버튼 없음, 취소, 미리 보기 되돌리기(열린 대화 안), 동의 필요 상태, 하루 3회 소진 상태(`prompt.quota.title/body`, "하루 3번까지"), 오프라인(입력 비활성·큐 없음·"인터넷에 연결되어야 꾸밀 수 있어요"), 키보드 완료 키 = **줄바꿈**(보내기는 버튼으로만) → 수락: 구현 전 실패.

### 서버 구현

- [x] T067 [US2] `supabase/migrations/20261101000600_room.sql`: `asset_catalog_entry`(`asset_id` PK, `catalog_version`, `asset_kind` check in (`room_object`,`mascot_pose`), `uri`, `format`, `width_px`, `height_px`, `byte_size`, `sha256`, `license_kind`, `license_text_version`, `creator`, `rights_record_ref`, `status` check in (`active`,`retired`)), `room_theme`(`space_id` PK, `current_version_id`, `version_counter`, `updated_at`, `updated_by_user_id`), `room_theme_version`(`id`, `space_id`, `version_number` 공간 내 고유 증가, `schema_version`, `scene_document jsonb`(카탈로그 오브젝트+텍스트만), `room_presentation jsonb`, `room_theme_document jsonb`(방 모드 `day|night|follow_time`, IANA `timeZone`), `source` check in (`initial`,`prompt`,`manual_migration`,`mascot_recall`,`milestone_preset`,`room_mode`), `provenance`(`model_provider`,`model_id`,`model_snapshot`,`request_id`,`created_at`,`created_by_user_id`), `content_hash`; **확정 후 불변(update/delete 금지 트리거)**), `decoration_request`(`id`, `space_id`, `session_id`, `requested_by_user_id`, `base_version_id`, `base_version_number`, `prompt_text`, `source` check in (`ai`,`milestone_preset`), `state` check in (`queued`,`generated`,`rejected`,`previewed`,`reverted`,`applied`,`cancelled`,`expired`,`failed`), `result_candidate jsonb`, `failure_code`, `repair_count` check ≤ 1, `created_at`, `expires_at`, `applied_version_id`). 카탈로그 24개를 `supabase/seed/catalog.sql`로 적재(T028 매니페스트에서 생성) → 수락: `supabase/tests/room_schema.test.sql`이 버전 불변·`repair_count ≤ 1`·`state` 값 제한을 단언한다.
- [x] T068 [US2] `supabase/migrations/20261101000650_init_room.sql`: `create_space` RPC가 같은 트랜잭션에서 초기 방 버전(`source: initial`, **`app_mascot` 정확히 1개** 기본 배치, `room_theme_document.mode = 'follow_time'`, `timeZone` = 생성자 IANA)을 만들도록 수정하고, 이미 있는 공간에는 `ensure_initial_room(space_id)` 백필 함수 제공 → 수락: pgTAP이 새 공간의 초기 장면이 T013 스키마를 통과함(서버 측 같은 검증기)을 단언한다.
- [x] T069 [US2] `supabase/functions/_shared/sceneValidate.ts`(Deno): `@couple/scene-contract`의 `validateScene/Theme/Presentation`과 보호 영역 검사를 Deno에서 import해 쓰고 T016 공용 픽스처로 앱과 같은 결과를 단언하는 `supabase/functions/_shared/__tests__/parity.test.ts` 작성 → 수락: 앱·서버 결과 동일.
- [x] T070 [P] [US2] `supabase/functions/ai-consent/index.ts`: `PUT /spaces/{id}/ai-consent`(`{state:'granted'|'revoked', noticeVersion:'ai-overseas-v1'}`), 인증 사용자 본인 동의만 기록, 상태 변경 감사 이벤트, **철회 시 대기 요청과 미적용 preview 무효화**. AI 요청은 **두 구성원 모두 `granted`일 때만** 허용 → 수락: T061 ①이 통과한다.
- [x] T071 [US2] `supabase/functions/_shared/anthropic.ts`: Claude Messages API **구조화 출력** 호출 래퍼. 키는 `Deno.env.get('ANTHROPIC_API_KEY')`(서버 비밀)만 사용, 로그에 키·프롬프트·모델 원문 금지. 모델 정책: **기본 Haiku 5.5**(`claude-haiku-5-5`), 품질 실패 사례에 한해 **Sonnet 5.5**(`claude-sonnet-5-5`)로 제한 승급 — 승급 기준은 실제 prompt fixture 결과로 정하므로(G8) 승급은 설정 플래그 `AI_ESCALATE_TO_SONNET=false`가 기본인 **훅**으로만 만든다. 요청에는 프롬프트 + 최소한의 현재 scene JSON, 낮/밤 허용 토큰, D-day 표현 허용 토큰, 장면 검증 규칙만 넣는다(날짜 원본 금지) → 수락: T061 ⑤⑦이 통과한다.
- [x] T072 [US2] `supabase/functions/decoration-previews/index.ts`: `POST /spaces/{id}/decoration-previews`(요청 `{prompt, sessionId, baseVersion, idempotencyKey}`; 순서: 구성원·활성 공간·**두 사람 동의**·**일일 한도 예약(`reserve_daily_request`, 3; 성공한 미리 보기를 돌려줄 때만 `finalize_daily_request`로 센다)**·유효 session owner·현재 버전·프롬프트 길이 → T071 → T013+보호 영역+카탈로그 ID 검증 → repair 최대 1회 → `decoration_request`·`prompt_message` 저장 → Realtime(ID·상태만)), 응답 201 `{previewId, baseVersion, sceneDocument, roomPresentation, roomThemeDocument, expiresAt, validation}`; `422 UNSUPPORTED_REQUEST`/`422 INVALID_CANDIDATE`; **프롬프트가 데이터·기능·권한·고정 컨트롤을 변경하려 하면 거절**(FR-014, FR-015), 마스코트 모습 변경 거절(FR-018) → 수락: T061가 통과한다.
- [x] T073 [US2] 같은 함수 폴더에서 `POST …/{previewId}/confirm`(요청 `{baseVersion, sessionId, idempotencyKey}`)과 `DELETE …/{previewId}?sessionId=`: DB RPC `confirm_preview`로 점유자·preview·유효기간·base version 확인, idempotency 처리, 새 불변 버전 저장, `room_theme.current_version_id` 이동, lease 해제를 **한 트랜잭션**으로 수행. 응답 201 `{appliedVersion, source:'prompt', updatedAt}`. cancel은 후보를 반영하지 않고 lease 해제 → 수락: T062이 통과한다.
- [x] T074 [US2] `supabase/functions/prompt-session/index.ts`에 `POST …/{sessionId}/undo`(요청 `{expectedPreviewId, idempotencyKey}`) 추가: 최신 미리 보기를 `reverted`로 바꾸고 앞 후보 반환, lease·방 버전 불변, 적용된 요청은 `ALREADY_APPLIED` → 수락: T063가 통과한다.
- [x] T075 [US2] `supabase/functions/room/index.ts`: `POST /spaces/{id}/room/mascot-recall`(요청 `{expectedVersion, idempotencyKey}`) 구현 → 수락: T064이 통과한다.
- [x] T076 [P] [US2] `supabase/functions/lifecycle-sweep/index.ts`(스케줄 실행 `pg_cron` 또는 Supabase Scheduled Function, 재실행 가능): 취소/만료·미적용 후보와 `prompt_message`는 **24시간 후 삭제**, 적용된 prompt/status 메시지는 **30일 후 삭제** → 수락: 고정 시계 Deno 테스트가 경계(24시간·30일)에서 삭제하고 재실행해도 결과가 같음을 단언.
- [x] T077 [P] [US2] `supabase/functions/decoration-previews/__fixtures__/prompts.json`: 서로 다른 꾸밈 의도 프롬프트 10개(ko/en/ja 포함)와 기대 속성(SC-003 검증용; 목표 수치는 임시 가정) + 승급 기준 평가 스크립트 `tools/ai/eval-fixtures.mjs`(실제 키 없이 mock 모드, 키가 있을 때만 호출) → 수락: mock 모드에서 스크립트가 실행되고 보고서를 출력한다. 실제 호출 평가와 승급 기준 확정은 출시 게이트 G8.

### 앱 구현

- [x] T078 [US2] `apps/mobile/src/scene/RoomScene.tsx`(Skia 캔버스: 장식 오브젝트·텍스트, 낮/밤 variant, 회전·레이어), `apps/mobile/src/scene/protectedZones.ts`(T014의 보호 영역을 실제 측정값(시스템 안전 영역 + 방 도구 막대 + D-day 위젯 + 시스템 탭 바)으로 계산, 글자 확대 시 재계산), 장식은 hit target을 가로채지 않는다(`pointerEvents="none"`), D-day·고정 컨트롤은 네이티브 접근성 트리에 남는다 → 수락: `apps/mobile/src/scene/__tests__/render.test.tsx`가 보호 영역 침범 노드 비침범·접근성 트리 유지를 단언.
- [x] T079 [US2] `apps/mobile/src/scene/MascotRoam.tsx`: 전체 크기 방 화면에서 포즈 이미지 6장을 **40초 주기**로 인사→걷기→신나게 인사→올려다보기→엎드리기→잠자기→걸어 돌아와 인사 반복(걷기 구간 좌우 반전·위아래 흔들림), 누르는 동안 `mascot_cheer`, **동작 줄이기에서는 서서 인사(`mascot_wave_main`) 정지 포즈**, 축소된 방(방 카드·미리 보기 축소)에서는 정지 포즈. 포즈는 앱이 정하며 서버·장면 데이터에 저장하지 않는다(`design/interaction-notes.md` §11) → 수락: `MascotRoam.test.tsx`(가짜 타이머)가 주기·정지 조건을 단언.
- [x] T080 [US2] `apps/mobile/src/app/(tabs)/room.tsx`, `apps/mobile/src/features/room/RoomScreen.tsx`: 방 장면 + 네이티브 D-day 위젯(`design/components.md` §8) + 방 도구 막대(위쪽, "꾸미기" 하나), 로딩·오프라인 읽기 전용(꾸미기 비활성 배너)·동기화 오류, **"아루미 다시 부르기" 고정 컨트롤**과 방을 다시 열 때(점유자 없을 때) 자동 1회 `mascot-recall` 호출(**정확한 자동 시점은 가정 — 조정 가능**, 한 곳 `apps/mobile/src/features/room/recallPolicy.ts`에 둠) → 수락: T065가 통과한다.
- [x] T081 [P] [US2] `apps/mobile/src/app/prompt/consent.tsx`, `apps/mobile/src/features/consent/ConsentScreen.tsx`: 해외 AI 처리 동의(처리 주체·전송 데이터·목적·보관 안내 키 `consent.*`; **보관 기간 문구는 `[법무 확인 후 입력]` 자리표시 — G1**), 구성원별 동의/철회, 동의 전·철회 후 프롬프트 전송 차단 → 수락: `consent.test.tsx`가 동의 전 제출 비활성과 철회 시 미적용 preview 폐기 표시를 단언.
- [x] T082 [US2] `apps/mobile/src/app/prompt/index.tsx`(모달 시트, 탭 바를 덮음), `apps/mobile/src/features/prompt/PromptPanel.tsx`: 공유 대화·미리 보기, 점유 상태 6가지(비어 있음/내가 점유/상대 점유(쓰는 중·만드는 중)/내 점유 만료 임박/내 점유 만료/상대 만료 후 이어받기), 이어받기 경합, 동의 필요, **하루 3회 소진**, 오프라인, 미지원 요청, 실패·재시도(US8에서 거절·생성 실패·킬 스위치·보관함 가득 상태 추가), 되돌리기(열린 대화 안, 키 `undo.*`), 적용 확인 다이얼로그(**"적용한 뒤에는 되돌릴 수 없어요"**). 입력칸 완료 키 = 줄바꿈, 보내기는 버튼으로만. 마스코트 꾸미기 UI(탭·슬롯·팔레트)는 **없다** → 수락: T066가 통과한다.
- [x] T083 [US2] `apps/mobile/src/features/room/useRoom.ts`: 방 버전 동기화(앱 열기·포그라운드 복귀·Realtime 알림 후 재조회), 오프라인에서는 마지막 확정 방·D-day 읽기 전용, **오프라인 편집·AI·confirm 요청을 큐에 쌓아 나중에 자동 적용하지 않는다**(명확한 온라인 안내) → 수락: `useRoom.test.tsx`가 오프라인 동작과 재연결 후 최신 버전 반영을 단언.

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

## Phase 7: User Story 5 — 커플 공간 종료(소프트 삭제), 연결 끊기, 신고 (P2)

**목표**: 어느 구성원이든 공간을 종료하면 두 사람 모두 **즉시** 접근할 수 없고(소프트 삭제), 서버가 내부적으로 30일 뒤 모든 데이터와 파일을 완전히 삭제한다. **복구 기능은 없고** 앱은 기간이나 복구를 알리지 않는다(결정·가정 `spec.md` Decided 33~36; 앞서의 복구 규칙 Decided 23·24는 대체됨). 종료한 사람은 바로 새 공간을 시작할 수 있다("한 공간만"은 활성 공간만 센다). **연결 끊기**(예전 "차단")는 같은 종료에 상대의 접근 차단을 더하고 결과를 분명히 알린다. **신고**는 별개 기능이다. (FR-022~FR-024, FR-059, FR-069)

**독립 테스트**: 종료 직후 두 사람의 접근이 모두 막히고 종료된 공간이 모든 클라이언트 호출에서 보이지 않는지, 종료 알림이 한 번 보이고 확인하면 사라지는지, 30일 경계에서 행과 Storage 파일이 부분 삭제 없이 지워지는지, 연결 끊기 확인 창이 결과를 말하는지(기간·복구 언급 없음), 신고가 연결 끊기 없이 접수되는지를 고정 시계로 검증한다.

### 테스트 먼저

- [ ] T090 [P] [US5] `supabase/tests/lifecycle.test.sql`과 `supabase/functions/spaces/__tests__/end.test.ts`(고정 시계 `app_now()`): ① 종료 즉시 `status=ended`, `ended_at`, `purge_after` = 서버 시각 + 30일(서버 설정값, **클라이언트에 내려가지 않음**), `ended_reason`, `ended_by_user_id`, 두 구성원 `space_active=false`가 **같은 트랜잭션**, 진행 중 점유 해제·활성 초대 폐기 ② **종료된 공간은 모든 클라이언트 호출에서 없는 공간**: snapshot·prompt-conversation·session acquire·decoration-previews·confirm·generated-objects·home-cover(upload-url·GET·PUT)·milestones·reports·Realtime 채널 구독·Storage 서명 URL이 `404`/빈 결과/구독 거부(RLS는 공간 상태가 `active`일 때만 허용) ③ 종료 직후 **두 사람 모두 새 공간을 만들거나 초대를 수락할 수 있음**(FR-057: 활성 공간만 셈) ④ **종료 알림**: `GET /spaces/mine`이 `ended: {kind, by, at}`만 돌려주고(공간 데이터·사용 가능한 공간 ID·삭제 예정일 없음), `POST /spaces/mine/ended/ack` 뒤 사라지며(멱등), 알림이 여러 개면 최신 하나만 ⑤ 이벤트 `ended`·`disconnected`에 종료자 저장 → 수락: 구현 전 실패.
- [ ] T091 [P] [US5] `supabase/functions/spaces/__tests__/block.test.ts`: `POST /spaces/{id}/block`(**화면 이름은 연결 끊기, 엔드포인트 이름은 `block` 유지**) 호출 시 공간이 즉시 `ended`(종료 이유 `disconnect`, 이벤트 `disconnected`)가 되고, **상대의 읽기·쓰기가 즉시 막히며**(RLS), 상대의 종료 알림은 `kind:'disconnect', by:'partner'`, 호출자는 `by:'me'`, 신고 행은 만들어지지 않음, 비구성원은 403, 응답에 기간·삭제 예정일 없음 → 수락: 구현 전 실패.
- [ ] T092 [P] [US5] `supabase/tests/purge.test.sql`(pgTAP)과 `supabase/functions/lifecycle-sweep/__tests__/purge.test.ts`(고정 시계, Storage 모의): ① `purge_after` 직전에는 그대로, 직후에는 완전 삭제(시간대 영향 없음) ② 삭제 범위: 공간·구성원·초대·방 테마·버전·요청·점유 세션·대화·홈 커버 행과 **Storage 객체(현재 사진 + 삭제 대기 목록)**·`generated_object`·`generation_attempt`·신고 행·마일스톤·종료 알림·일일 계수·예약 — 개인 정보 없는 `generation_block` 지문은 유지(가정) ③ 재실행해도 결과 동일(멱등) ④ **부분 삭제 없음**: Storage 단계에 실패를 주입하면 행은 그대로 `ended`로 남고 다음 실행에서 재시도, DB 단계에 실패를 주입하면 트랜잭션이 롤백되고 재시도되며, 어느 경우에도 클라이언트에 일부만 보이는 상태가 없음 ⑤ 완료 이벤트는 개인 내용 없이 `deletion_started`/`deletion_completed`만 ⑥ 종료되지 않은 공간과 `purge_after` 전의 공간은 건드리지 않음 ⑦ 한 공간의 삭제 실패가 다른 공간의 삭제를 막지 않음 ⑧ 종료한 두 사람이 이후 새 공간에 있어도 이전 공간 삭제가 새 공간 데이터를 건드리지 않음 → 수락: 구현 전 실패.
- [ ] T093 [P] [US5] `supabase/functions/reports/__tests__/reports.test.ts`: `POST /spaces/{id}/reports`(`target: partner|shared_text|room_scene`, `reason: harass|inappropriate|privacy|other`, `detail?`, `messageId?`) 201, **홈 커버 사진은 대상이 아니다**(대상 값 거절), 신고자 본인만 자기 신고를 읽음, 처리 결과를 앱에 알리지 않음, 연결 끊기 없이도 접수 → 수락: 구현 전 실패.
- [ ] T094 [P] [US5] `apps/mobile/src/features/lifecycle/__tests__/lifecycle.test.tsx`: 설정의 "공간 종료" 확인 단계(`end.body`·`end.b1~b3`·`set.end.help`: **일수·복구 언급 없음**), 종료 안내 화면(`end.done.*`, "새 공간 시작하기" → 공간 만들기·초대 코드 입력, **복구 버튼·날짜·남은 일수·진행 막대 없음**), 상대가 종료했거나 연결을 끊거나 계정을 삭제한 경우의 안내(`end.byPartner`/`end.byPartnerDisconnect`/`end.byPartnerDeleted`(이름 없이) + `end.done.body`), 안내를 확인하면 다시 보이지 않음, **연결 끊기 확인 다이얼로그가 `report.block.body`("연결을 끊으면 ○○님은 이 공간의 방과 대화를 볼 수 없고, 이 공간이 종료돼요. 함께 쓰던 데이터는 삭제돼요")를 확인 전에 보여 줌**, **번역 리소스 검사: 종료·연결 끊기 키(`end.*`, `set.end.*`, `report.block*`)에 '복구'·'restore'·'30일'·'days' 같은 보관 기간·복구 문구가 없음**(허용 예외: 프롬프트 보관 안내 `consent.keep.body`, 장면 불러오기 `room.recover.*`), 신고 흐름(대상→이유→자세한 내용(선택)→제출 성공/실패·입력 유지), 대화 메시지 ⋯ → "이 메시지 신고" 시트, 신고 대상 목록에 사진 없음 → 수락: 구현 전 실패.

### 서버 구현

- [ ] T095 [US5] `supabase/migrations/20261101000700_lifecycle_report.sql`: `report`(`id`, `space_id`, `reporter_user_id`, `target` check in (`partner`,`shared_text`,`room_scene`), `reason` check in (`harass`,`inappropriate`,`privacy`,`other`), `detail`, `message_id`, `created_at`, `status` check in (`received`,`reviewed`); RLS: 신고자 본인 읽기), RPC `end_space(space_id, reason)`(`ended|disconnect|account_deletion`; `status='ended'`, `ended_at`, `purge_after` = now + 30일(설정값), `ended_reason`, `ended_by_user_id` = 호출자, 두 구성원 `space_active=false`를 **같은 트랜잭션**에서, 진행 중 `prompt_session` 해제, 활성 `invitation` 폐기, 두 구성원의 `space_end_notice` 생성), `space_end_notice`(`user_id`, `kind` check in (`ended`,`disconnect`,`account_deleted`), `by_user_id`, `at`, `acked_at`, 구성원당 최신 한 행만 의미; RLS: 본인 읽기; 공간 데이터·삭제 예정일을 담지 않음), `purge_expired_spaces()`(공간 단위 멱등 배치: `purge_after <= now`인 공간마다 Storage 객체를 먼저 지우고 한 트랜잭션에서 모든 관련 행을 삭제, 실패하면 `ended`로 남겨 재시도) → 수락: T090·T092의 DB 부분이 통과한다.
- [ ] T096 [US5] `supabase/functions/spaces/index.ts`에 `POST /spaces/{id}/end`(`{confirm:true}`, 응답 200 `{status:'ended'}`), `POST /spaces/{id}/block`(`{confirm:true}`; 응답은 `/end`와 같음), `POST /spaces/mine/ended/ack`(204, 멱등)와 `GET /spaces/mine`의 `ended` 알림을 추가한다. **복구 엔드포인트는 없다** → 수락: T090·T091가 통과한다.
- [ ] T097 [P] [US5] `supabase/functions/reports/index.ts`: `POST /spaces/{id}/reports` 구현 → 수락: T093가 통과한다. 신고 연락처 **공개 지원 이메일은 아직 없다(G10)** — 응답·화면에 임의 주소를 넣지 않는다.
- [ ] T098 [US5] `supabase/functions/lifecycle-sweep/index.ts`에 `purge_expired_spaces()` 호출(스케줄: 하루 1회 이상, 재실행 가능)과 `deletion_started`/`deletion_completed` 이벤트 기록을 추가(T076 확장) → 수락: T092가 통과한다.

### 앱 구현

- [ ] T099 [US5] `apps/mobile/src/app/settings/end-space.tsx`, `apps/mobile/src/features/lifecycle/EndSpaceScreen.tsx`: 공간 종료(2단계 확인; 결과는 "삭제되고 되돌릴 수 없음"이며 **기간·복구를 말하지 않는다**) → 수락: T094의 종료 확인 부분이 통과한다.
- [ ] T100 [US5] `apps/mobile/src/features/lifecycle/EndedScreen.tsx`: 종료 안내 화면 3가지(내가 종료 / 상대가 종료 / 상대가 연결을 끊음 / **상대가 계정을 삭제함**(`end.byPartnerDeleted`, 이름 없이); 본문 `end.done.body`)와 **"새 공간 시작하기"**(`end.newSpace`: 공간 만들기·초대 코드 입력으로 이동하면서 `POST /spaces/mine/ended/ack` 호출). 앱을 열 때 `GET /spaces/mine`에서 활성 공간이 없고 `ended` 알림이 있으면 이 화면을 먼저 보인다. 복구 버튼·날짜·남은 일수는 없다 → 수락: T094의 종료 안내 부분이 통과한다.
- [ ] T101 [US5] `apps/mobile/src/app/settings/report.tsx`, `apps/mobile/src/features/report/ReportScreen.tsx`, `apps/mobile/src/features/report/DisconnectDialog.tsx`: 화면 제목 **"신고 · 연결 끊기"**(`report.title`), 신고 흐름과 별개 버튼 "○○님과 연결 끊기"(`report.block`, 위험 외곽선 버튼), 확인 다이얼로그(`report.block.title/body/confirm`), 성공 후 종료 상태 화면, 대화 메시지 신고 시트. 키 이름은 `report.block*` 그대로(번역 문구만 '연결 끊기') → 수락: T094의 연결 끊기·신고 부분이 통과한다.
- [ ] T102 [US5] 설정 탭의 계정·방 섹션 항목 연결(`apps/mobile/src/features/settings/`): 문의·신고(푸시), 공간 종료, **계정 삭제**(위험 구역, 푸시, 탭 바 숨김), AI 처리 동의 관리(푸시, 탭 바 숨김) — 되돌리기 어렵거나 중요한 작업 흐름은 탭 바를 숨긴다(`design/interaction-notes.md` §2) → 수락: 라우트 테스트가 해당 화면에서 탭 바 숨김을 단언.

**체크포인트**: US5는 US1~US4 위에서 단독 검증 가능. **계정 삭제**는 스펙에 아직 없는 기능이다(스토어 규칙상 필요, 출시 게이트 G18).

---

## Phase 8: User Story 6 — 홈 배경 사진 정하기 (P2)

**목표**: 시스템 사진 선택기로 사진 한 장 → 커버 비율로 자르기 → 올리기 → 표시·바꾸기·없애기, 마지막 변경 우선, 비공개 저장, AI·장면으로 새지 않음. (FR-032~FR-039)

**독립 테스트**: quickstart A5 전체.

### 테스트 먼저

- [ ] T103 [P] [US6] `supabase/functions/home-cover/__tests__/cover.test.ts`와 `supabase/tests/home_cover.test.sql`: ① 허용 형식 `image/jpeg|png|heic`, 원본 **20MB 이하**, 위반은 `400 COVER_FORMAT_UNSUPPORTED`/`400 COVER_TOO_LARGE` ② 깨진 이미지·**이미지 헤더만 위장한 파일**은 `422 COVER_INVALID_IMAGE` ③ GPS 등 EXIF/XMP가 있는 사진을 올린 뒤 저장 객체를 내려받아 **메타데이터 없음** ④ 비구성원·종료 공간의 읽기/쓰기 거절(RLS), 공개 URL 없음, **서명된 URL 만료 뒤 열리지 않음** ⑤ 두 기기가 거의 동시에 교체해도 한 장만 남고 마지막 변경 우선(`version` 증가, 409로 막지 않음), 먼저 올린 객체는 **24시간 뒤 정리** ⑥ 업로드 중 오류·앱 종료에도 기존 사진 유지, 새 사진 저장이 끝나기 전에는 기존 사진을 바꾸지 않음 ⑦ 공간 종료 즉시 읽기·쓰기·서명 URL 거부, 서버 내부 삭제(`purge_after`, 고정 시계) 때 객체·행 삭제(T092) ⑧ **provider spy**로 사진 URL·경로가 프롬프트·씬·AI 요청·로그에 없음 ⑨ 사진 변경에 점유 세션·미리 보기 확인 불필요 ⑩ 감사 이벤트는 `cover_changed`/`cover_removed` 종류만(경로·파일명 없음) → 수락: 구현 전 실패.
- [ ] T104 [P] [US6] `apps/mobile/src/features/cover/__tests__/cover.test.tsx`: 사진 없음→선택(**사진 보관함 권한 요청 0회**)→자르기(커버 비율 고정)→올리는 중→표시, 바꾸기·없애기, 형식 오류·크기 초과·업로드 실패(다시 시도, 기존 사진 유지), 오프라인(마지막 사진 표시·변경 막힘+이유), 상대가 바꿨을 때 "누가 마지막으로 바꿨는지" 표시, 매우 밝은/어두운/흰 단색 사진에서 일수·날짜·상태 표시줄 글자 대비 4.5:1(받침 막), 사진은 장식(읽기 순서 제외)·변경 컨트롤은 접근성 이름 → 수락: 구현 전 실패.

### 구현

- [ ] T105 [US6] `supabase/migrations/20261101000800_home_cover.sql`: `home_cover_photo`(`space_id` PK, `status` check in (`none`,`uploading`,`ready`,`failed`), `current_object_path`, `content_type`, `byte_size`, `width_px`, `height_px`, `sha256`, `crop jsonb`(정규화 `x`,`y`,`width`,`height`), `version`, `uploaded_by_user_id`(마지막으로 바꾸거나 없앤 사람), `uploaded_at`, `updated_at`, `pending_delete jsonb`(이전 객체 경로+삭제 예정 시각 = 새 사진 저장 확인 후 24시간)), Storage 비공개 버킷 `home-covers`와 RLS(읽기·쓰기·교체·삭제: 활성 공간 구성원만, `ended`이면 읽기도 새 업로드도 차단; 파일은 완전 삭제 때 지움). **URL은 저장하지 않는다** → 수락: T103 ④⑦의 DB 부분이 통과한다.
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

- [ ] T110 [P] [US7] `supabase/functions/_shared/__tests__/milestones.test.ts`(Deno, 고정 시계)와 `supabase/tests/milestone.test.sql`: ① 일수 마일스톤 날짜 = 함께한 날짜 + `milestone_days` − 1(당일=1일째) 50/100/200/300/500/1000 ② 주년 = 함께한 날짜 + N년의 **같은 월·일**(1·2·3주년, **365/730일 아님**), **2월 29일 시작의 평년 주년은 2월 28일** ③ 주년과 일수가 같은 날이면 하나만, `anniversary` > `day` ④ 방 시간대 자정 경계(`Asia/Seoul`·`America/Los_Angeles`)와 **기기 시계 무관(서버 계산)** ⑤ 보이는 기간 = 당일 포함 7일, 8일째는 `passed`로 바꾸고 안 보임, 더 늦으면 지난 것으로만 기록 ⑥ 여러 개가 7일 안에 있으면 가장 최근 하나만(같은 날이면 주년 우선) ⑦ `GET current` 호출이 `MilestoneCelebration` 행을 **멱등** 생성(유일 `(space_id, milestone_key)`) ⑧ 두 구성원이 모두 참여한 활성 공간에서만 생성·표시, 종료된 공간은 안 보임 ⑨ **함께한 날짜 수정**: 기록된 마일스톤은 날짜가 바뀌어도 다시 축하하지 않되 새 `milestone_date`가 오늘보다 뒤면 행과 `MilestoneSeen`을 지워 새 날짜에 한 번 더(`milestonesReset`), 이미 지난 날짜로 바뀌면 기록 없는 것만 7일 규칙 ⑩ `upcoming`은 아직 안 온 것을 날짜순 최대 3개 → 수락: 구현 전 실패.
- [ ] T111 [P] [US7] `supabase/tests/milestone_seen.test.sql`: `MilestoneSeen`(`celebration_id`, `member_user_id` 복합 PK, `seen_at`, `via: home|room`) — 한쪽이 닫아도 상대는 자기 첫 열기에서 한 번 봄, 같은 요청 재전송 멱등, **RLS로 본인 행만 읽음**(상대가 봤는지 안 읽음) → 수락: 구현 전 실패.
- [ ] T112 [P] [US7] `supabase/functions/milestones/__tests__/preset.test.ts`: `POST …/milestone-preview`는 점유(`acquire`) 필요, **AI 호출 0회·동의 불필요·일일 한도 미계수**, 소품 5~6개(케이크·풍선·리본·반짝이 2, 주년은 선물 추가)+기념 문구 1개, 우선순위 케이크→리본→풍선→반짝이→선물→문구로 **자리 있는 만큼만** 놓고 `placed`/`requested` 반환, 자리가 전혀 없으면 `422 ROOM_FULL`, 상대가 점유 중이면 `409 SESSION_OCCUPIED`, 기간 지남 `410 MILESTONE_PASSED`, 오래된 버전 `409 VERSION_CONFLICT`, 기념 문구는 시작한 구성원의 앱 언어로 저장(번역 안 함)·문구 3개 한도 준수, 적용은 기존 confirm 경로(`source: milestone_preset`, 자동 적용 없음), 적용되면 `preset_applied_version_id` 기록, **AI 요청 이력에 안 남고 감사 이벤트 `milestone_preset_previewed/applied`(키만)** → 수락: 구현 전 실패.
- [ ] T113 [P] [US7] `apps/mobile/src/features/milestone/__tests__/notifications.test.ts`(`expo-notifications` mock): ① **앱 첫 실행에서 알림 권한을 묻지 않음** ② 첫 축하 카드를 닫은 직후 사전 안내 시트가 한 번 뜨고 "다음에"면 다시 뜨지 않음(설정에서만) ③ "알림 켜기" 후 OS 권한 허용 → `upcoming` 최대 3개를 **당일 오전 9시(방 시간대)**로 예약, 알림 식별자 = 마일스톤 키(중복 예약 없음) ④ 재예약 트리거: 함께한 날짜 변경·방 시간대 변경·앱 업데이트·앱 열 때 목록 확인 ⑤ 취소 트리거: 공간 종료·연결 끊기·로그아웃·알림 끄기·상대 이탈로 인한 종료, 상대 초대 중에는 예약 안 함 ⑥ 권한 거절/해제 → 설정 행 "기기에서 알림이 꺼져 있어요"+기기 설정 열기 ⑦ **알림 문구는 제목 = 앱 이름, 본문 "아루미가 축하할 일이 생겼어요."(ko/en/ja) 하나이고 이름·날짜·일수·주년 수가 없음** ⑧ 알림을 누르면 홈으로 열려 축하 카드(이미 본 마일스톤이면 카드 없이 홈만) ⑨ 알림을 켜지 않은 기기는 예약 0건 ⑩ **서버에 푸시 토큰·알림 설정을 저장하는 코드 경로 없음**(`getExpoPushTokenAsync`/`registerForPushNotificationsAsync` 사용 금지 grep 테스트) ⑪ 탭 바 배지 없음 → 수락: 구현 전 실패.
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

## Phase 10: User Story 8 — 프롬프트로 새 배경·말풍선·소품 장식 만들기 (P2, MVP 바로 다음 단계)

**목표**: 프롬프트가 카탈로그 배치에 더해 **새 2D 벡터 장식**(방 배경 조각, 말풍선 틀, **방 소품**)을 만들어 커플 보관함에 저장하고 미리 보기 → 적용 흐름으로 방에 반영한다. 허용목록 JSON 형식·서버 검증·2차 검사·입력 정책·남용 한도·킬 스위치가 함께 있어야 한다. (FR-060~FR-066, FR-028, FR-063)

**우선순위와 MVP**: P2이고 **MVP 컷 라인(Phase 1~5)에 들어가지 않는다**. MVP 바로 다음 단계이며 US2(미리 보기·적용)와 US4(점유)에만 의존하므로 소유자가 원하면 앞당길 수 있다. **신고(US9)와 함께 출시해야 한다**(Apple 1.2·Google Play 기대, `research.md` 9.3). 모든 한도·임계값은 가정이고 서버 설정값이다.

**독립 테스트**: 모의 모델로 정상 생성·거절·검증 실패·2차 검사 실패·킬 스위치·횟수 의미를 검증하고, 형식 샘플(valid/invalid)과 레드팀 44개를 통과시키며, RLS·보관함 상한·후보 24시간 정리를 DB 테스트로 확인한다. 실제 모델 평가는 출시 게이트 G17.

### 테스트 먼저

- [ ] T123 [P] [US8] `packages/scene-contract/tests/generated-object.contract.test.ts`와 픽스처 `packages/scene-contract/fixtures/generated-object/{valid,invalid}/`(= `specs/001-couple-prompt-todo/contracts/samples/generated-object/`를 복사하는 스크립트 `tools/contract/sync-samples.mjs`): ① `valid/*`는 통과하고 같은 입력은 같은 결과 ② `invalid/*`는 각각 `_expectations.json`의 오류 코드로 거부(스크립트·URL·`data:`·참조·텍스트/이미지 도형·`A`/상대/`S`/`T` 경로 명령·지수·NaN·범위 초과·팔레트 위반·도형 41개·12KB 초과·말풍선 영역/덮개/대비 위반·`__proto__` 등) ③ 시드 고정 변형 200개가 검증기를 죽이지 않음 ④ 서버(Deno)와 앱(Jest)이 같은 픽스처로 **같은 결과** ⑤ 최대 허용 문서 검증이 50ms 미만 → 수락: 구현 전 실패.
- [ ] T124 [P] [US8] `packages/scene-contract/tests/scene-generated.test.ts`: 장면 스키마의 `gen:UUID` 참조(오브젝트)와 텍스트의 `frameObjectId`, 생성 오브젝트도 **16개 한도에 포함**, `bubble_frame`은 텍스트 틀로만·`background_piece`는 오브젝트로만(종류 불일치 거부), 같은 공간의 `active`/`candidate`만 허용(다른 공간 ID·존재하지 않는 ID 거부), 장면에 원본 도형 데이터·URL을 넣으면 거부, 렌더 순서 배경 조각 < 카탈로그·마스코트 < 텍스트 → 수락: 구현 전 실패.
- [ ] T125 [P] [US8] `supabase/functions/_shared/__tests__/input_policy.test.ts`와 `supabase/functions/decoration-previews/__fixtures__/redteam.json`(`ai-guardrails.md` 부록 A 44개를 JSON으로): ① 결정론 필터가 길이·URL·전화번호·`@`·QR 요청·마크업·`{`구조를 잡음 ② 분류 스텁이 7범주(`ip`·`people`·`unsafe`·`personal`·`photo_like`·`off_purpose`·`injection`)를 돌려줌 ③ 혼합 요청은 전체 거절 ④ 분류 호출 오류·형식 오류는 거절이 아니라 `GENERATION_FAILED` ⑤ `generation_block` 지문 요청은 거절 ⑥ 레드팀 거절 대상 100% 거절·허용 대상 ≥90% 허용(SC-008, 모의 판정 스텁) ⑦ 마스코트·캐릭터 요청은 `off_purpose`(작은 방 소품은 허용; 마스코트·앱 캐릭터를 닮은 소품·글자·로고·브랜드 소품은 거절) → 수락: 구현 전 실패.
- [ ] T126 [P] [US8] `supabase/functions/decoration-previews/__tests__/generation.test.ts`(Anthropic **provider spy**): ① 순서(권한·동의·공간 활성·킬 스위치·보관함 여유·시도 한도 → 입력 정책 → 생성 → 형식 검증 → 2차 검사 → 후보 저장 → **성공 때만 횟수 증가**) ② 정상: 후보 `candidate` 최대 2개 저장, 응답의 `generatedObjects`, 두 구성원 읽기, 점유자 confirm 때 `active` ③ 입력 거절은 제공자 호출 0회·횟수 안 씀·`422 GENERATION_REFUSED`(`category`) ④ 검증 실패는 **오류 코드만** 모델에 되돌려(프롬프트 원문 재전송 없음) 1회 재시도 → 성공/`503 GENERATION_FAILED` ⑤ 2차 검사 실패·호출 오류·형식 오류는 fail-closed ⑥ 같은 멱등 키는 한 번만 생성·한 번만 계수 ⑦ 동의 없음·철회·종료 공간·킬 스위치에서는 모든 호출(분류·생성·2차 검사) 0회 ⑧ 모델 입력에 날짜·이메일·초대 코드·**상대의 공유 대화 메시지**가 없음(spy payload) ⑨ 성공 3회 뒤 4번째 `429 DAILY_LIMIT_REACHED`, 거절·실패 10번 뒤에도 성공 3회 남음, 시도 30/일·분당 4회·1시간 연속 거절 5번 쿨다운(`429 RATE_LIMITED`+`retryAfterSeconds`)·일일 거절 15번 잠금 ⑩ 로그에 프롬프트·모델 출력·키 없음 → 수락: 구현 전 실패.
- [ ] T127 [P] [US8] `supabase/tests/generated_object.test.sql`(pgTAP): ① RLS: 활성 공간 구성원만 읽기, 클라이언트 직접 insert/update/delete 거부, 다른 커플·비구성원·종료된(`ended`) 공간 읽기 거부 ② `generation_attempt`·`app_config`·`generation_block` 클라이언트 읽기/쓰기 거부 ③ 상한(`app_config.generation_library_cap`, 기본 40; 서버 설정값)에서 삽입 거부, 설정값을 올리면 바로 반영 ④ 상태 전이(`candidate→active`는 confirm 트랜잭션에서만, 취소·만료·되돌림 24시간 뒤 삭제) ⑤ **방에 놓인 장식도 구성원이 지울 수 있고**(점유 불필요) 장면 버전은 바뀌지 않으며 읽을 때 걸러내고(두 사람 화면에서 사라짐) 다음 후보 장면은 삭제된 참조를 제거함 ⑥ 공간 종료 즉시 읽기 거부, 서버 내부 삭제(T092) 때 `generated_object`·`generation_attempt` 함께 삭제, `generation_attempt` 프롬프트 30일 뒤 정리 ⑦ 다른 공간의 `gen:` 참조가 장면에 들어가면 거부 → 수락: 구현 전 실패.
- [ ] T128 [P] [US8] `supabase/functions/decoration-previews/__tests__/killswitch.test.ts`: `generation_enabled=false`면 새 요청이 `503 GENERATION_DISABLED`(카탈로그 꾸미기는 계속), `generated_render_enabled=false`면 스냅샷 `generatedObjects`가 비고 `features`가 반영, `generation_min_validator_version` 상향 시 낮은 버전 문서가 재검증되고 실패한 장식은 응답에서 빠짐, 커플 단위 `generation_blocked_until`은 그 커플만 막음, 값 변경이 앱 업데이트 없이 다음 요청에 반영 → 수락: 구현 전 실패.
- [ ] T129 [P] [US8] `apps/mobile/src/features/generation/__tests__/generation.test.tsx`: ① 도형 → Skia 호출 스냅샷(결정적, 같은 입력 같은 결과, 윤곽선·크림 림 규칙) ② 말풍선 틀 + 글 영역, 글자·채움 대비 ≥4.5:1 ③ 배경 조각이 마스코트·카탈로그·텍스트 아래 ④ 미리 보기에 "새로 만든 장식" 표시(`gen.badge`)와 개수 ⑤ 거절 7범주가 `gen.refuse.*` 키로 매핑되고 대안 문구·"횟수에 들어가지 않았어요"(`gen.refuse.note`)가 보임 ⑥ 실패(`gen.fail.*`)·킬 스위치(`gen.disabled.*`)·보관함 가득(`gen.lib.full`)·하루 3회 소진 상태 ⑦ 우리 장식 보관함 시트(목록·다시 쓰기 칩·지우기 확인(방에 놓인 장식은 "방에서도 사라져요" 안내)·`n/상한`·상한 도달 상태) ⑧ 렌더 전 재검증 실패 장식은 그려지지 않음 ⑨ 새 키가 ko/en/ja 세 언어에 있음 ⑩ 접근성(장식은 읽기 순서에서 제외, 터치 ≥44pt, 동작 줄이기·큰 글자) → 수락: 구현 전 실패.
- [ ] T130 [P] [US8] `tools/reference-library/__tests__/reference.test.mjs`: `design/reference-library/objects/*.json` 전부가 검증기를 통과하고 스타일 적합도 기준(0.7 가정)을 넘으며 `examples-dont/*`는 기준 미달, 서버 번들 `supabase/functions/_shared/reference-library/`의 해시가 원본과 일치하고 `style_reference_version`이 번들과 함께 올라감, 번들 크기(프롬프트 예산)가 한도 안 → 수락: 구현 전 실패.

### 서버 구현

- [ ] T131 [US8] `supabase/migrations/20261101000900_generated_objects.sql`: `generated_object`(`id`, `space_id`, `kind` check in (`background_piece`,`bubble_frame`,`prop`), `layer_hint` check in (`wall`,`floor`,`backdrop`,`window_view`,`shelf`) 단 `bubble_frame`이면 null(`prop`은 `floor|wall|shelf`), `label` 1~24자, `schema_version`, `format`, `document jsonb`, `doc_sha256`, `validator_version`, `style_reference_version`, `style_score`, `status` check in (`candidate`,`active`,`deleted`,`removed_by_operator`), `parent_id`, `created_by_user_id`, `source_request_id`, `model_id`, `created_at`, `activated_at`, `deleted_at`, `removed_at`, `removed_reason`), `generation_attempt`(`data-model.md` 필드 그대로, RLS 사용자 읽기 없음), `app_config`(`key` PK, `value jsonb`, 시드: `generation_enabled=true`, `generated_render_enabled=true`, `generation_min_validator_version`, `generation_attempt_limits`), `generation_block`, `couple_space.generation_blocked_until`·`generation_blocked_reason`, `daily_request_count` 의미 변경은 T022에서 처리. RLS는 읽기만 활성 공간 구성원, 쓰기는 서버 함수만. 상한 검사(설정값 `generation_library_cap`)와 `app_config` 시드(`generation_library_cap=40`), 후보·시도 정리 함수 → 수락: T127가 통과한다.
- [ ] T132 [US8] `packages/scene-contract/src/generatedObject.ts`와 스키마 복사본 `generated-object.schema.json`: `design/tools/aroomi-shape/validate.mjs`(참고 구현)를 TypeScript로 옮긴 `validateGeneratedObject`(서버·앱 공유, 안정 오류 코드, 키 허용목록, 경로 문법 파서, 팔레트 허용목록, 복잡도, 말풍선 영역·덮개·대비, **소품 한도(viewBox 256 이하·도형 30개 이하)와 얼굴 닮음 휴리스틱 `PROP_FACE_LIKE`**), `normalizeGeneratedObject`(소수점 정리·키 순서·해시), `validateScene` 확장(T124) → 수락: T123·T124가 통과한다.
- [ ] T133 [US8] `supabase/functions/_shared/generation/inputPolicy.ts`(결정론 필터 + 분류 호출 스키마 `{decision, category, mixed}`, 한국어·영어·일본어 패턴), `secondCheck.ts`(별도 호출·fail-closed), `styleCheck.ts`(스타일 적합도, 임계값은 설정), `attemptLimits.ts`(시도 30/일·분당 4·연속 거절 쿨다운·일일 거절 잠금, 값은 `app_config`) → 수락: T125·T126 ⑨가 통과한다.
- [ ] T134 [US8] `supabase/functions/_shared/generation/prompt.ts`와 `tools/reference-library/bundle.mjs`(`design/reference-library/` → `supabase/functions/_shared/reference-library/` 복사 + 해시 + `style_reference_version`): 시스템 지시(범위 두 종류, 형식 규칙, 금지 목록, 스타일 규칙 요약), 구조화 출력 스키마, 프롬프트 캐시 블록(기준 라이브러리), 검증 실패 재시도 메시지(오류 코드만), 모델에 **보내지 않는 것**(날짜·이메일·초대 코드·상대 대화·다른 공간 데이터) 명시 → 수락: T130·T126 ⑧이 통과한다.
- [ ] T135 [US8] `supabase/functions/decoration-previews/index.ts` 확장(T072를 건드려 파이프라인 단계를 더함): 의도 분류(`catalog|generate|mixed`), 킬 스위치·보관함·시도 한도 검사, 입력 정책, 생성 호출(T071 재사용, 모델 정책 그대로 Haiku 기본), 형식 검증·정규화, 2차 검사, 후보 `generated_object` 저장(최대 2개), `decoration_request.intent/generated_object_ids/quota_consumed`, 응답의 `generatedObjects`, 오류 `422 GENERATION_REFUSED`·`503 GENERATION_FAILED`·`503 GENERATION_DISABLED`·`409 LIBRARY_FULL`·`429 RATE_LIMITED`, `GenerationAttempt` 기록(원문 모델 출력 저장 금지), 성공 때만 `finalize_daily_request` → 수락: T126가 통과한다.
- [ ] T136 [US8] `supabase/functions/generated-objects/index.ts`: `GET /spaces/{id}/generated-objects`, `GET …/{objectId}`, `DELETE …/{objectId}`(방에 놓여 있어도 허용; 장면 버전은 바꾸지 않고 읽을 때 걸러냄), 스냅샷 확장(`features`, 현재 장면이 참조하는 `generatedObjects`, 호출자가 신고해 숨긴 것·운영자 제거분 걸러내기) → 수락: T127·T128가 통과한다.
- [ ] T137 [US8] T073 확장: confirm 트랜잭션에서 후보 장식을 `active`로 바꾸고 상한(설정값)을 다시 검사(`409 LIBRARY_FULL`이면 적용 안 함), 취소·되돌림·만료 후보의 24시간 뒤 삭제 예약, 감사 이벤트 `generated_object_applied` → 수락: T126 ②와 T127 ④가 통과한다.
- [ ] T138 [US8] `supabase/functions/lifecycle-sweep/index.ts` 확장(T076 계속): 24시간 지난 후보·`deleted` 정리, `generation_attempt` 프롬프트 30일 뒤 삭제, 공간 삭제 때 생성 데이터 함께 삭제 → 수락: T127 ⑥이 통과한다.
- [ ] T139 [US8] `supabase/functions/_shared/config.ts`와 서버 전용 SQL 함수 `set_app_config`·`set_generation_block`(anon·사용자 권한으로 호출 불가): 요청마다 설정 읽기(짧은 캐시), 킬 스위치 로직, 스냅샷 `features` 값. 변경 절차는 T149 문서에 적는다 → 수락: T128가 통과한다.

### 앱 구현

- [ ] T140 [US8] `apps/mobile/src/scene/GeneratedShape.tsx`와 `apps/mobile/src/scene/generatedRender.ts`: 검증된 도형 목록을 Skia로 그린다. `path`는 SVG 문자열 파서에 넘기지 않고 허용 명령을 직접 파싱해 경로를 만든다, 윤곽선·크림 림 규칙(`design/reference-library/style-spec.md` 수치), 층 순서(배경 조각 < 카탈로그 오브젝트·소품·마스코트 < 텍스트; 소품은 `zIndex`로 마스코트 앞뒤 가능하되 보호 영역은 피함), 말풍선 틀 + 글 영역, **렌더 직전 재검증**(T132), `generated_render_enabled=false`면 그리지 않음 → 수락: T129 ①②③⑧이 통과한다.
- [ ] T141 [US8] 프롬프트 화면(S08)과 미리 보기(S09) 확장 `apps/mobile/src/features/prompt/`·`apps/mobile/src/features/generation/`: 거절 화면(7범주 `gen.refuse.*`, 대안, "횟수에 들어가지 않았어요"), 실패(`gen.fail.*`), 킬 스위치(`gen.disabled.*`), 보관함 가득(`gen.lib.full`), 하루 3회 소진, 미리 보기의 "새로 만든 장식" 표시와 개수(`gen.badge`·`gen.preview.*`). 새 화면 번호는 만들지 않는다 → 수락: T129 ④⑤⑥이 통과한다.
- [ ] T142 [US8] `apps/mobile/src/features/generation/LibrarySheet.tsx`: 프롬프트 화면 안 "우리 장식" 시트(목록·썸네일·만든 사람·`n/상한`), 다시 쓰기 칩(프롬프트에 "‘{라벨}’ 놓기"를 넣음), 지우기 확인(`gen.lib.delete.*`; 방에 놓인 장식이면 `gen.lib.delete.inuse` 안내), 비어 있음 → 수락: T129 ⑦이 통과한다.
- [ ] T143 [US8] `design/i18n-copy.md`의 새 키(`gen.*`, `obj.*`, `report.obj.*`, 키 수 표기)를 T024로 `ko/en/ja` 리소스에 반영하고 T023의 키 수·보간 일치 검사가 새 키를 포함해 통과하게 한다. 영어·일본어는 원어민 검수 전 초안(G4) → 수락: T023과 T129 ⑨가 통과한다.
- [ ] T144 [P] [US8] `tools/ai/eval-generation.mjs`: 레드팀 44개와 허용 프롬프트 30개(ko/en/ja)를 파이프라인에 돌려 거절율·허용율·검증 실패율·재시도율·평균 토큰·비용·스타일 점수 분포를 보고서로 출력(키 없이 mock 모드, 실제 키가 있을 때만 호출) → 수락: mock 모드에서 실행되고 보고서가 나온다. 실제 호출 평가와 품질 기준 확정·옵션 B 후퇴 결정은 출시 게이트 G17.

**체크포인트**: US8은 US2·US4 위에서 단독 검증 가능(모의 모델). 공개 출시는 US9와 함께.

---

## Phase 11: User Story 9 — 생성된 장식·방 신고하기 (P2, US8과 함께 출시)

**목표**: 구성원이 생성 장식과 방 전체를 신고하고, 신고자 화면에서 즉시 숨기며, 운영자가 수동으로 제거·재생성 차단을 할 수 있다. 신고자는 상태를 본다. (FR-067, FR-059)

**독립 테스트**: 신고 → 신고자 숨김 → 운영자 `review_report` → 두 사람 화면 반영 → 재생성 차단의 전이와 한도·권한·노출 범위를 계약·RLS 테스트로 검증한다.

### 테스트 먼저

- [ ] T145 [P] [US9] `supabase/functions/reports/__tests__/object_reports.test.ts`와 `supabase/tests/report_objects.test.sql`: ① `target=generated_object`는 `objectId` 필요·다른 공간의 ID는 `404`·사유 enum(`copyright|inappropriate|privacy|other`)·메모 200자 ② 201 `{reportId, hiddenForReporter:true}`와 **신고자 읽기에서만 즉시 숨김**(상대 읽기는 그대로, 방 버전 불변) ③ 같은 사용자의 같은 장식 신고는 멱등 ④ 사용자당 하루 10건 초과 `429 REPORT_RATE_LIMITED` ⑤ `GET /reports/mine`은 본인 것만, 상대의 신고·사유·메모는 어떤 경로로도 노출 안 됨 ⑥ `review_report(removed)`: 장식 `removed_by_operator`·`generation_block` 생성·두 사람 읽기에서 걸러짐·같은 프롬프트 지문 재생성 거절·두 구성원에게 제거 안내가 한 번씩 ⑦ `review_report(kept)`: 신고자 숨김 유지·신고자에게만 "검토를 마쳤어요" ⑧ `POST …/reports/{id}/seen` 멱등 ⑨ 방 전체 신고(`room_scene`) 접수 ⑩ 신고만으로 공간이 종료되지 않음(연결 끊기와 별개) ⑪ 운영 함수(`review_report`·`set_generation_block`)는 anon·사용자 권한으로 호출 불가 → 수락: 구현 전 실패.
- [ ] T146 [P] [US9] `apps/mobile/src/features/report/__tests__/object_report.test.tsx`: 방의 생성 장식 탭 → 장식 상세 시트(`obj.*`) → 신고하기 → 사유 4가지(`report.obj.reason.*`) → 선택 메모 → 확인 → 성공(내 화면에서 장식이 바로 사라지고 "내 화면에서만 숨겼어요") / 실패(입력 유지·다시 시도) / 한도 초과, "신고했어요 · 접수됨 / 검토를 마쳤어요" 상태 표시, 운영 제거 안내 한 번, 방 전체 신고 진입, 홈 사진은 신고 대상이 아님, 접근성(터치 ≥44pt, 접근성 이름) → 수락: 구현 전 실패.

### 서버 구현

- [ ] T147 [US9] `supabase/migrations/20261101001000_report_objects.sql`: `report` 확장(`target`에 `generated_object`, `reason`에 `copyright`, `generated_object_id`, `hidden_for_reporter`, `outcome`, `reviewed_at`, `reviewer_note`, `reporter_notified_at`), 신고자 읽기 필터(뷰/함수), 서버 전용 `review_report(report_id, outcome, note)`(`removed`이면 `generated_object.status=removed_by_operator`와 `generation_block` 생성을 한 트랜잭션에서, `report_reviewed`·`generated_object_removed` 이벤트), 사용자당 하루 10건 한도, 제거 안내용 구성원별 확인 기록 → 수락: T145의 DB 부분이 통과한다.
- [ ] T148 [US9] T097 확장 `supabase/functions/reports/index.ts`: 생성 장식 신고(`objectId`), `GET /spaces/{id}/reports/mine`, `POST …/reports/{id}/seen`, 스냅샷 필터와 연동(숨김·제거 걸러내기), 신고 연락처 **공개 지원 이메일은 아직 없다(G10)** → 수락: T145가 통과한다.
- [ ] T149 [P] [US9] `docs/operator-review-runbook.md`: PoC 수동 처리 절차 — 대기열 조회 SQL, 판단 기준표(저작권을 닮음·불쾌·개인정보), `review_report` 호출 예와 제거·재생성 차단 절차, 킬 스위치(`set_app_config`)와 커플 단위 차단(`set_generation_block`) 절차, 비상 대응 순서(`ai-guardrails.md` 8장), 기록 남기기, 신고 내용 취급(상대에게 비노출), 에스컬레이션. **목표 응답 시간·담당자·스위치 권한자는 소유자 결정 전이라 비워 둔다** → 수락: 문서가 있고 SQL 예가 로컬 DB에서 실행된다.

### 앱 구현

- [ ] T150 [US9] `apps/mobile/src/features/room/ObjectDetailSheet.tsx`(S07: 방의 생성 장식 탭 → 시트: 라벨·만든 사람·"신고하기"·"방 전체 신고"·상태 라벨), `apps/mobile/src/features/report/ObjectReportFlow.tsx`(S15 확장: 사유 → 메모 → 확인 → 성공/실패), 신고 후 숨김 처리와 안내 배너(제거 알림 한 번), 키 `obj.*`·`report.obj.*` → 수락: T146가 통과한다.

**체크포인트**: US9는 US8·US5(`report` 테이블) 위에서 단독 검증 가능.

---

## Phase 12: User Story 10 — 계정 삭제 (P1, 출시 필수 · MVP 컷에는 없음)

**목표**: 계정이 있는 앱은 앱 안에서 계정 삭제를 제공해야 한다(Apple 5.1.1(v), Google Play 계정 삭제 요구). 삭제하면 **즉시 로그아웃**되고 계정·프로필·로그인 식별자가 지워진다. 활성 공간이 있으면 공간 종료·연결 끊기와 같은 **소프트 삭제**로 종료되어 두 사람 모두 즉시 접근할 수 없고 서버가 내부적으로 30일 뒤 완전히 삭제한다(복구 없음, 앱은 기간을 말하지 않음). 상대에게는 이름 없이 "상대가 계정을 삭제했어요"가 종료 안내로 보인다(결정·가정 `spec.md` Decided 41~). (FR-070~FR-074, SC-011)

**MVP와 출시**: P1이지만 데모 가능한 조각(Phase 1~5)에는 넣지 않는다. 그러나 **이 단계가 없으면 스토어 심사와 공개 출시가 막힌다**(출시 게이트 G18). US1(계정·공간)과 US5(소프트 삭제·퍼지) 위에서 만들고, 공개 출시 전에 반드시 끝낸다.

**독립 테스트**: 활성 공간이 있는/없는 사용자, 초대 대기 중인 사용자, 점유 중인 사용자의 삭제, 공급자(Apple·Kakao) 해제 모의, 같은 계정으로 즉시 재가입, 퍼지와의 경합, 단계 중 서버 재시작을 고정 시계와 모의 공급자로 검증한다.

### 테스트 먼저

- [ ] T151 [P] [US10] `supabase/functions/account/__tests__/delete.test.ts`와 `supabase/tests/account_deletion.test.sql`: ① 재인증(최근 5분 이내, 가정)이 없으면 `401 REAUTH_REQUIRED`, 있으면 `202` ② **공간이 없거나 초대 대기 중인** 사용자: 대기 초대 코드 폐기, 계정 삭제 완료 ③ **활성 공간이 있는** 사용자: 같은 트랜잭션에서 공간 `ended`(`ended_reason=account_deletion`, `ended_by_user_id`), **남은 상대에게만** 종료 알림 `kind=account_deleted`(**이름·사유 외 정보 없음**, 삭제한 본인에게는 알림 없음, 혼자였던 공간은 알림 없음), 두 사람 접근 즉시 차단, `purge_after` +30일, 점유·열린 프롬프트 세션 해제와 진행 중 생성 요청 폐기 ④ 다른 기기를 포함한 **모든 세션·리프레시 토큰 무효** ⑤ 개인 데이터: **접수 트랜잭션에서** 프로필 개인 필드·동의 기록(법률 검토 전 기본값: 삭제)을 비우고 로그인 식별자는 마지막 단계에서 삭제하며, 종료된 공간의 구성원 행이 가리키는 `user_profile`은 개인 필드가 비워진 **껍데기**로 남았다가 마지막 참조 공간이 퍼지될 때 삭제 ⑥ 같은 이메일·소셜 계정으로 바로 다시 가입하면 **새 `user_id`의 빈 계정**(이전 공간·데이터 없음, 로그인 식별자 연결 없음) ⑦ 멱등: 같은 요청 재시도·이미 삭제 중이면 같은 결과 ⑧ 접수된 뒤 그 사용자의 모든 호출은 `401`이고 `409 ACCOUNT_DELETING`은 접수 트랜잭션과 겹친 변경 요청에만 쓰이며(앱은 둘 다 로컬 로그아웃으로 처리, `202` 본문은 고정 `{state:'requested'}`) ⑨ **이미 발급된 JWT는 만료 전이어도 서버가 요청마다 계정 상태를 확인해 거부**(`401`) ⑩ 서버 업로드 Storage 객체(홈 사진)가 사용자 소유가 아니어서 **`deleteUser`가 Storage 소유 때문에 막히지 않음** → 수락: 구현 전 실패.
- [ ] T152 [P] [US10] `supabase/functions/account/__tests__/providers.test.ts`(공급자 모의): ① **Apple**: 재인증 때 받은 `authorizationCode`를 서버가 **접수 트랜잭션 앞에서** 토큰으로 바꾸고(교환 실패면 아무것도 바뀌지 않고 `401 REAUTH_REQUIRED`) 그 뒤 **revoke** 호출(성공 확인 전에는 `provider_revoked` 단계를 끝내지 않음, 재시도를 위해 교환한 토큰을 암호화해 최대 24시간만 보관하고 로그에는 없음) ② **Kakao**: 연결 해제(unlink) API를 서버 비밀 키로 호출 ③ 이메일 계정: 공급자 단계 없음 ④ 공급자 호출 실패는 지수 백오프로 재시도하고(최대 횟수는 설정값) 그동안 계정은 이미 로그아웃·접근 불가이며, 계속 실패하면 개인정보 없는 운영 경고 로그만 남김 ⑤ 키·토큰·코드가 로그·오류에 없음 → 수락: 구현 전 실패.
- [ ] T153 [P] [US10] `supabase/tests/account_deletion_race.test.sql`: ① 계정 삭제와 퍼지가 같은 공간에서 동시에 실행돼도 한 번만 처리(같은 행 잠금), 이미 `ended`이거나 퍼지된 공간에서는 `end_space`가 아무 일도 하지 않음 ② 한쪽이 계정을 지우는 동시에 상대가 종료·연결 끊기를 눌러도 공간은 한 번만 종료되고 종료 알림은 먼저 성공한 쪽의 이유를 따름 ③ 단계 중간(공간 종료 후·공급자 해제 전·인증 삭제 전)에 서버가 죽어도 재시작 때 `account_deletion.state`에서 이어서 끝냄 ④ 상대 계정 삭제로 `ended`된 공간에서 남은 한 사람이 바로 새 공간을 만들 수 있음 → 수락: 구현 전 실패.
- [ ] T154 [P] [US10] `apps/mobile/src/features/account/__tests__/delete.test.tsx`: 설정 > 위험 구역에 "계정 삭제"(`set.account.delete`) 행 → 결과 설명(`acct.delete.*`, 체크 전엔 버튼 비활성) → 본인 확인(카카오·Apple·이메일 재로그인, 기존 로그인 UI 재사용) → 진행·실패(`acct.delete.fail.*`, 아무것도 지워지지 않음)·본인 확인 실패·**오프라인은 요청을 보내지 않고 안내만(큐 없음)**, 성공하면 즉시 로그아웃·**로컬 예약 알림 전부 취소·로컬 캐시(공간·사진·장식·임시 파일) 삭제**·로그인 화면 + `acct.delete.done`, 상대 기기에서 종료 안내 `end.byPartnerDeleted`(이름 없음), 번역 리소스 검사에 `acct.*`·`end.byPartnerDeleted` 포함(기간·복구 문구 없음), 접근성(터치 ≥44pt, 큰 글자) → 수락: 구현 전 실패.

### 서버 구현

- [ ] T155 [US10] `supabase/migrations/20261101001100_account_deletion.sql`: `user_profile.status` check in (`active`,`deleting`,`shell`)와 `deleted_at`, `account_deletion`(`user_id` PK, `state`(마지막으로 끝난 단계) check in (`requested`,`space_ended`,`provider_revoked`,`auth_deleted`,`done`), `provider` check in (`kakao`,`apple`,`email`), `requested_at`, `updated_at`, `attempts`, `last_error_code`, `provider_credential_enc?`(Apple revoke 재시도용 암호화 토큰, 서버 전용, 최대 24시간); **개인 내용 없음**, RLS: 클라이언트 접근 없음), `space_end_notice.kind`의 `account_deleted`와 `end_space`의 `account_deletion` 이유는 T095에 이미 포함, 함수 `begin_account_deletion(user_id)`(한 트랜잭션: 상태 `deleting`, **개인 필드·동의 기록 비우기**, 활성 공간 종료, 초대 폐기, 점유·세션 해제, 세션 무효화)·`finish_account_deletion(user_id)`(껍데기 전환과 보관 자격 삭제), FK 규칙(`user_profile.user_id`는 `auth.users`에 FK 없음, 다른 테이블의 `*_user_id`는 `user_profile`을 `ON DELETE RESTRICT`로 참조, 공간이 없던 사용자는 껍데기 없이 프로필 행을 바로 삭제, `SpaceLifecycleEvent.actor_user_id`는 껍데기 삭제 때 null), `purge_expired_spaces()` 확장(참조가 없어진 `shell` 프로필 삭제) → 수락: T151·T153의 DB 부분이 통과한다.
- [ ] T156 [US10] `supabase/functions/account/index.ts`와 `supabase/functions/_shared/providers/{apple,kakao}.ts`: `DELETE /account`(`{confirm:true, reauth:{provider, authorizationCode?}}` + `Idempotency-Key`; 응답 `202 {state:'requested'}`(고정), 오류 `401 REAUTH_REQUIRED`·`409 ACCOUNT_DELETING`·`400`; 일부 프록시가 DELETE 본문을 버리면 `POST /account/deletion` 대안 사용), 단계 실행기(요청 → 공간 종료 → 공급자 해제(Apple revoke, Kakao unlink) → 인증 삭제(Supabase admin deleteUser) → 완료)를 단계마다 `account_deletion.state`에 기록하며 재시작·재시도 안전하게, T098의 스케줄 작업(삭제 실행기는 15분 주기, 설정값 가정)이 멈춘 단계를 이어서 처리, 공급자 키는 서버 비밀. **구현 때 확인할 것(미확인)**: Supabase에 사용자 ID로 전체 세션을 끊는 관리 API가 없어 `auth.sessions` 직접 삭제를 쓸지, 재인증 "최근 5분"을 JWT의 `amr` 시각으로 확인할 수 있는지, Kakao admin 키 unlink와 Apple revoke의 요청 형식·"이미 해제됨" 오류 → 수락: T151·T152·T153가 통과한다.
- [ ] T157 [P] [US10] `docs/account-deletion-web.md`: 소유자가 `aroom.jinjinstar.com`에 만들 **계정 삭제 안내 웹 페이지**(Google Play가 요구하는 앱 밖 링크, 한국어·영어·일본어 본문: 앱에서 삭제하는 방법, 삭제되는 것·남는 것, 앱을 쓸 수 없을 때의 요청 방법) + 앱 밖 삭제 요청 처리 절차(운영 런북 `docs/operator-review-runbook.md`에 절 추가; 본인 확인 방법은 법률·운영 검토 전 가정: 가입에 쓴 이메일로 회신). **공개 지원 이메일은 아직 없어 G10이 필요하고 URL은 소유자가 만든다** → 수락: 문서가 있고 페이지에 들어갈 본문이 3개 언어로 있다.

### 앱 구현

- [ ] T158 [US10] `apps/mobile/src/app/settings/delete-account.tsx`, `apps/mobile/src/features/account/`: 설정 위험 구역의 "계정 삭제" 행(T102에 연결), 결과 설명·체크·재로그인·진행·실패·오프라인 상태(`acct.delete.*`), 성공 뒤 로컬 정리(세션·예약 알림 취소·캐시 삭제)와 로그인 화면 이동, 상대 종료 안내(`end.byPartnerDeleted`는 T100) → 수락: T154가 통과한다.

**체크포인트**: US10은 US1·US5 위에서 단독 검증 가능. **공개 출시는 이 단계와 게이트 G18 확인 없이는 못 한다.**

---

## Phase 13: Polish & Cross-Cutting (구현 마무리, 출시 게이트와 별개)

- [ ] T159 [P] 모든 공유 테이블에 대한 RLS 총점검 `supabase/tests/rls_all.test.sql`: A·B 구성원, C 제3자로 `space_member`, `invitation`, `room_*`, `decoration_request`, `prompt_*`, `home_cover_photo`, `milestone_*`, `report`, `generated_object`, `generation_attempt`, `generation_block`, `app_config`, `account_deletion`, `space_end_notice`, Storage `home-covers`, Realtime 채널을 순회해 읽기/쓰기/구독 거부를 단언 → 수락: 통과.
- [ ] T160 [P] 로그·오류 allowlist 총점검 `supabase/functions/_shared/__tests__/log_allowlist.test.ts`: 모든 Edge Function을 mock 입력으로 실행해 키·프롬프트 원문·서명 URL·초대 코드·모델 출력이 로그/오류에 없음을 단언, `gitleaks` CI 통과 → 수락: 통과.
- [ ] T161 [P] 접근성 총점검 `apps/mobile/src/__tests__/a11y.test.tsx`: 모든 라우트에서 터치 ≥44pt, 접근성 이름, 큰 글자 130%/200%, 동작 줄이기 정지, 마스코트 낭독 한 번 → 수락: 통과.
- [ ] T162 [P] 리뷰용 고정 샘플 공간 `supabase/seed/review_space.sql`과 `docs/review-account.md`: 반복 사용 가능한 고정 샘플 장면, 신고/연결 끊기 경로 포함. **실제 초대 코드를 포함하지 않는다**(`quickstart.md` 준비 3번). 샘플 장면에는 기준 라이브러리에서 고른 생성 장식 예시 1~2개와 신고 경로를 넣는다(US8·US9 이후). 심사 노트 초안(고정 렌더러는 데이터만 처리) → 수락: 시드 적용 후 리뷰 계정으로 방·신고·연결 끊기 화면이 열린다.
- [ ] T163 [P] 실기기 점검표 `docs/device-checklist.md`(실행은 사람): 안전 영역 값(iOS 47/34, Android 32/24 가정), 시스템 탭 바·키보드·공유 시트, 스크린 리더 낭독, dynamic type, 화면 회전, 사진 선택기 권한 팝업 없음·HEIC, 알림 권한 흐름과 알림 배너 실제 모양, 통통·반짝임·되살림 움직임, Kakao·Apple·이메일 redirect(EAS 내부 빌드), 아이콘 29px 가독성(A는 29px에서 "경계") → 수락: 항목별 합격/불합격 기록 칸이 있다.
- [ ] T164 [P] quickstart 검증 실행 `docs/validation-report.md`: `specs/001-couple-prompt-todo/quickstart.md`의 A, A2~A7, B~H 시나리오를 자동 테스트와 수동 단계로 구분해 결과 기록. SC-001~005와 SC-008(실제 모델)·SC-010은 별도 제품 계측·평가라 "미측정"으로 둔다(SC-001~003은 PoC 동안 측정하지 않기로 결정·가정, Decided 26)(저장소 검사 통과를 사용자 성공 기준 입증으로 표시하지 않는다) → 수락: 보고서에 시나리오별 상태가 있다.
- [ ] T165 [P] EAS `preview` 내부 배포 빌드 한 번(iOS·Android) 성공 확인과 SDK 58 / RN 0.88 / Skia 호환 행렬 고정(`docs/compat-matrix.md`), 번들 크기 실측 기록(**글꼴 크기 실측은 G6의 입력**) → 수락: 빌드 링크·크기 기록.
- [ ] T166 [P] `README.md`(루트)와 `docs/architecture.md`: 저장소 구조·실행 방법·테스트 명령·비밀 규칙·게이트 목록 링크. `design/README.md`/`handoff.md`의 구현 포인터는 이미 있으므로 구현 결과로 달라진 점만 반영 → 수락: 새 기여자가 README만으로 로컬에서 앱과 Supabase 로컬 스택을 띄운다.

---

## Phase 14: 출시 게이트 (구현을 막지 않는다 — 출시 전에 사람이 닫는다)

> 위 구현 태스크는 **자리표시 값으로 끝까지 진행할 수 있다.** 아래 게이트는 코드가 아니라 확인·결정·검수 항목이고 모두 [P]다. 닫히기 전에는 **스토어 등록·공개 출시만** 막힌다.

- [ ] T167 [P] **G1 법률 검토**: **보관·삭제 문구**(개인정보 처리방침과 스토어 데이터 안전 양식에 "공간이 종료되면 서버가 내부적으로 최대 30일 보관한 뒤 삭제하며 이용자가 직접 복구할 수 없다"는 사실을 어떻게 쓸지), **운영자 도움 복원을 요청 시 약속할지 여부(V1에서는 약속하지 않음)**, 연령 문구("만 14세 이상") 최종 표현, 해외 AI 처리 동의와 **보관 기간 문구**(`[법무 확인 후 입력]`), 사진 개인정보 처리방침 최종 문구와 국외 처리 범위, 알림, 스토어 UGC 설명, AI 표시 의무, 꾸밈 결과의 개인적·비상업적 이용 허용과 소유권 비보장 문구(FR-025, 이용약관), "AI 제안이 틀릴 수 있다" 앱 안 안내 문구(Commercial Terms D.3; 현재 화면·키에는 없음 — 결정되면 `apps/mobile/src/i18n/locales/*.json`에 키 추가) → 닫는 방법: 법률 의견 기록을 `docs/legal/`에 저장하고 해당 번역 키 값 교체.
- [ ] T168 [P] **G2 이름 확인**: 상표(아룸/Aroom/アルーム, 아루미/Aroomi/アルーミ), 앱스토어·Google Play 이름 사용 가능 여부, 도메인 `aroom.jinjinstar.com` 생성, 한국어 '아룸' ~ '아름'(아름다움)·영어 'a room' 소리 근접 맥락. **확인 전에는 bundle ID `com.jinjinstar.aroom`를 스토어에 등록하지 않는다** → 닫는 방법: T005의 `PLACEHOLDER: false`와 최종 값, `docs/name-clearance.md`.
- [ ] T169 [P] **G3 스토어 규칙 재확인**: 이름(30자 안팎)·부제 글자 수와 심사 규칙, 스토어 연령 등급 설문(최소 연령 14세와 일치), **"연결 끊기 + 신고"가 악성 이용자 차단·신고 기대를 충족하는지**, 사진 UGC 설명, 알림 심사 메모(사용자가 켠 로컬 알림, 마케팅 아님, 토큰 저장 없음), 신고 연락처 → 닫는 방법: `docs/store-submission.md`에 확인 결과.
- [ ] T170 [P] **G4 원어민 검수**: 영어·일본어 전체 문구(특히 'Disconnect'·'つながりを終了' 초안, 일본어 표기 アルーム·アルーミ) → 닫는 방법: 검수본을 T024 입력(`design/i18n-copy.md`)에 반영하고 재생성.
- [ ] T171 [P] **G5 카카오·Apple 공식 에셋/SDK**: T048의 자리표시 버튼을 공식 SDK·에셋으로 교체 → 닫는 방법: 교체 PR과 EAS 내부 빌드에서 redirect 확인. **개정(2026-10-27)**: Apple은 이미 공식 `AppleAuthenticationButton`을 쓰므로 카카오만 남는다.
- [ ] T172 [P] **G6 글꼴 번들 크기 실측**: T165의 실측으로 9파일(≈16.4MB 압축 전)/최소 구성(≈10MB) 중 선택, `OFL` 고지 포함 확인 → 닫는 방법: T027 갱신.
- [ ] T173 [P] **G7 에셋 최종 포맷**: PNG-8 또는 WebP 무손실 결정, 일러스트레이터가 18개 일반 오브젝트 최종 그림을 납품(자리표시 스케치 교체, `design/assets-spec.md` §9) → 닫는 방법: T029 재실행과 manifest 갱신.
- [ ] T174 [P] **G8 AI 이용 약관·비용·승급 기준**: ① 크레딧 연결 때 보이는 프로그램 약관 원문과 현재 Commercial Terms를 읽고 포함 크레딧을 공개 소비자 앱에 써도 되는지 Anthropic 지원팀에 **서면 문의**(답 전에는 PoC 전용) ② 만 14세 이상 사용자 앱의 Usage Policy 확인 ③ **유료 API 크레딧/결제 설정으로 전환**(포함 크레딧은 주기마다 소멸하고 잔액 0이면 요청 정지), workspace 지출 한도·커플당 하루 3회 재확인 ④ T077 실측 평가로 Haiku→Sonnet 승급 기준 결정(T071의 `AI_ESCALATE_TO_SONNET` 규칙으로 반영) → 닫는 방법: `docs/ai-terms.md`.
- [ ] T175 [P] **G9 서버 푸시 필요 여부**: 기기 로컬 알림으로 충분한지 사용 후 결정(더하면 토큰 저장·서버 예약·APNs/FCM 키·처리방침 항목 필요) → 닫는 방법: 결정 기록, 필요 시 새 스펙.
- [ ] T176 [P] **G10 공개 지원 이메일**: 소유자가 주소를 만든다(임의로 만들지 않는다). 신고 화면·스토어 등록·개인정보 처리방침에 반영 → 닫는 방법: T005의 `supportEmail`과 `report.contact` 번역 값.
- [ ] T177 [P] **G11 마스코트·아이콘 닮음 검사와 법률 검토**(출시 전 권장, 출시를 막지 않음): 마스코트 마스터(소유자가 생성형 AI 도구로 만든 원본)의 유사성 검사, 선택 생성 기록(도구 이름·날짜·프롬프트: owner to supply), 아이콘 A 29px 가독성(경계) 실기기 확인 → 닫는 방법: 기록을 `design/mascot/README.md`에 반영.
- [ ] T178 [P] **G12 개인 개발자 계정과 Supabase 운영 설정**: Apple·Google Play 개인 계정 등록(스토어 판매자 이름이 개인 이름, 법인 이전은 가능하나 절차 필요), Supabase 무료 프로젝트의 비활동 일시 정지 동작 확인과 서울 리전 유지, 운영 요금제 결정 → 닫는 방법: `docs/accounts.md`.
- [ ] T179 [P] **G13 기준 라이브러리 최종 승인**: 소유자가 `design/reference-library/approval-checklist.md`로 최종 레퍼런스 세트(배경 6·말풍선 4 이상)를 승인(스타일 일관성·제3자 작품과 닮지 않음(역이미지 검색)·권리/출처 기록·낮밤 방에서의 가독성), 일러스트레이터 납품 또는 자체 제작 확정 → 닫는 방법: 승인 서명과 T134의 번들 재생성(`style_reference_version` 증가), T130 통과.
- [ ] T180 [P] **G14 생성 콘텐츠 스토어 규칙**: Apple App Review 1.2·5.1.2(i)·연령 등급 설문(AI/UGC 문항 포함), Google Play AI-Generated Content·UGC·콘텐츠 등급(IARC)·Data safety를 **현재 공식 문서**로 다시 확인(`research.md` 9.2의 미확인 항목), "연결 끊기 + 신고"가 차단·신고 기대를 충족하는지, 심사 노트(생성 장식은 데이터이고 고정 렌더러가 그림, 신고·운영 제거·킬 스위치) → 닫는 방법: 확인 기록과 심사 노트 최종본.
- [ ] T181 [P] **G15 약관·개인정보·법률(생성 장식)**: 이용약관(프롬프트 책임·앱의 제거 권한·결과 비보증·소유권 비보장·AI 오류 가능), 개인정보 처리방침(AI 처리, 남용 대응용 프롬프트·판정 기록 30일), AI 결과물 권리와 표시 의무("새로 만든 장식" 표시가 충분한지, AI 배지 불필요 결정과의 관계)의 **법률 검토**, 연령 등급 설문 갱신 → 닫는 방법: 최종 문구를 번역 값과 T143에 반영.
- [ ] T182 [P] **G16 Anthropic 사용 정책(생성 콘텐츠)**: 현재 시행 중인 Usage Policy 본문과 2026-11-12 시행 개정판을 영어 원문으로 읽고 생성 장식 서비스·만 14세 이상 이용자(미성년자 가이드 적용 여부)·소비자 대상 고지 요건을 확인하며 G8의 지원팀 서면 문의에 이 항목을 포함 → 닫는 방법: 확인 기록(`research.md` 9.2 갱신).
- [ ] T183 [P] **G17 생성 품질·가드레일 실제 모델 평가와 운영 결정**: T144을 실제 키로 실행해 SC-008(거절 100%·허용 ≥90%)·검증 실패율·재시도율·스타일 일관성·평균 토큰·실비용을 측정하고 Sonnet 승급 필요 여부를 정하며, 품질이 모자라면 **옵션 B(매개변수형 템플릿)로 후퇴**할지 결정한다. 신고 처리 담당자·목표 응답 시간·킬 스위치 권한자·렌더 이미지 기반 2차 검사 도입 여부를 소유자가 정한다 → 닫는 방법: `docs/validation-report.md`에 결과, 결정 기록.
- [ ] T184 [P] **G18 계정 삭제 출시 점검**: 기능은 US10(T158·T156)으로 설계했다(결정·가정 `spec.md` Decided 41~). 남은 확인: ① 개인정보 처리방침에 계정 삭제 시 삭제·익명화되는 항목, 공간 종료 뒤 내부 보관(최대 30일)과 이용자 직접 복구 불가, 동의 기록·남용 방지 기록의 보관을 쓰는 법률 검토 ② **Apple** 심사 노트(계정 삭제 위치: 설정 > 계정 삭제, 재로그인 확인, Sign in with Apple 토큰 해제)와 App Privacy 항목 ③ **Google Play** 데이터 보안(Data safety) 양식의 삭제 항목과 **앱 밖 삭제 링크**(T157의 페이지를 소유자가 `aroom.jinjinstar.com`에 만들어 URL 입력) ④ Kakao 연결 해제 API 사용 승인 범위와 서버 비밀 키 준비 ⑤ 앱 밖 삭제 요청의 본인 확인·응답 절차 승인 → 닫는 방법: 확인 기록과 심사 노트·양식 최종본, 페이지 URL을 T005에 반영.

---

## FR → 태스크 대응표

모든 기능 요구사항(FR-001~FR-074, 77개 항목)이 하나 이상의 태스크로 구현·검증된다. 사용자 성공 기준 SC-001~SC-005와 SC-010(생성 장식 운영)은 별도 계측·평가이며 전용 측정 태스크가 없다(SC-008은 `tools/ai/eval-generation.mjs`와 G17이 맡는다. SC-001~003은 PoC 동안 측정하지 않기로 결정·가정, `spec.md` Decided 26).

| FR | 태스크 |
|---|---|
| FR-001 | T046, T048 |
| FR-002 | T036, T043, T049 |
| FR-003 | T035, T040, T041, T044, T050 |
| FR-004 | T035, T040, T044, T053 |
| FR-005 | T018, T020, T159 |
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
| FR-021 | T010, T107, T124 |
| FR-022 | T090, T096, T099, T100 |
| FR-023 | T090, T092, T096, T100 |
| FR-024 | T092, T098 |
| FR-025 | T167 |
| FR-026 | T065, T078, T014 |
| FR-027 | T080, T014 |
| FR-028 | T022, T061, T072, T082, T126 |
| FR-029 | T013, T010, T072 |
| FR-030 | T054, T057, T058, T060 |
| FR-031 | T054, T073 |
| FR-032 | T109, T107 |
| FR-033 | T103, T104, T107 |
| FR-034 | T103, T105 |
| FR-035 | T103, T109 |
| FR-036 | T104 |
| FR-037 | T104, T109 |
| FR-038 | T103, T092, T098 |
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
| FR-059 | T091, T096, T101, T093, T097, T092, T100, T145, T150 |
| FR-060 | T124, T125, T135, T141 |
| FR-061 | T123, T132, T140, T129 |
| FR-062 | T131, T127, T136, T142, T138 |
| FR-063 | T124, T126, T137, T140 |
| FR-064 | T130, T134, T179 |
| FR-065 | T125, T133, T141 |
| FR-066 | T126, T128, T133, T139, T144, T183 |
| FR-067 | T145, T146, T147, T148, T149, T150 |
| FR-068 | T143, T181, T180 |
| FR-069 | T090, T094, T096, T100 |
| FR-070 | T154, T158, T151 |
| FR-071 | T151, T155, T154 |
| FR-072 | T151, T153, T155, T095 |
| FR-073 | T152, T156, T153 |
| FR-074 | T157, T184, T167 |


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
5. 동의 → 프롬프트 → 검증된 미리 보기 → 점유자만 "되돌릴 수 없어요" 확인 후 적용 → 양쪽 같은 방, 하루 3회 한도, 열린 대화 안 되돌리기

이 컷 라인에 **들어가지 않는 것**: 설정 화면의 언어·방 모드·앱 모양(US3), 종료·연결 끊기·신고(US5), 홈 사진(US6), 마일스톤·알림(US7), **프롬프트로 새 장식을 만드는 US8과 생성 장식 신고 US9**(MVP 바로 다음 P2). 언어는 기기 언어를 따르는 기본 동작만 Foundational에 들어 있다.

### 단계별 컷

1. **MVP 데모**: Phase 1~5 (위).
2. **P1 완성**: + US3(Phase 6) — 언어·방 낮/밤·앱 모양 설정.
3. **V1 완성**: + US5·US6·US7(Phase 7~9) + Polish(Phase 13). **공개 출시에는 US10(계정 삭제, Phase 12, P1)이 필수**다(스토어 요구, 게이트 G18); 데모 가능한 MVP 컷에는 들어가지 않는다.
4. **생성 장식 포함 V1**: + US8·US9(Phase 10~11, 둘이 함께 출시).
5. **출시**: + 게이트 G1~G18(Phase 14)을 사람이 닫은 뒤.

**P2 우선순위 권고**: US8(새 배경·말풍선 장식 생성)은 **MVP 바로 다음 단계**다. US2·US4에만 의존하므로 MVP 직후 US3과 나란히 시작할 수 있고, 소유자가 앞당기고 싶으면 US5~US7보다 먼저 한다. 단 US9(신고)가 US5의 `report` 테이블(T095)을 쓰므로 US8을 먼저 하면 T095의 `report` 부분과 T097를 함께 당겨야 하고, **US8은 US9 없이 공개 출시하지 않는다**.

### 점진 전달

한 스토리를 끝낼 때마다 해당 스토리의 "독립 테스트"를 실행하고, quickstart의 대응 시나리오(US1→C, US4→C, US2→A·B·D·A7, US3→A2·A3, US5→E, US6→A5, US7→A6, US8→F, US9→G)를 확인한 뒤 다음으로 넘어간다.

## 결정된 질문 (2026-10-27, 소유자가 "계속 진행하자"고 답함 — 권고안을 **가정으로 표시해** 반영)

분석에서 올라온 네 질문의 처리다. **Q1·Q2는 같은 날 이어진 소유자의 결정("복구 기능은 빼고 소프트 삭제만")으로 복구 기능이 없어져 무효(대체됨)**이고 기록으로 남긴다. Q3·Q4는 유효하다(`spec.md` Decided 23~26, 33).

- ~~**Q1 복구 대기 중에도 새 공간(가정)**~~ — **대체됨**: 복구가 없으므로 "복구 막힘" 규칙도 없다. 종료한 공간은 소프트 삭제라 "한 공간만"에 세어지지 않아 **종료 직후 새 공간**은 그대로 가능하다(T090 ③, T019).
- ~~**Q2 연결 끊기 뒤 복구는 끊은 사람만(가정)**~~ — **대체됨**: 복구 기능 자체가 없다.
- **Q3 → 순환 로더의 창문은 로더 전용(가정)**: 카탈로그 24개 그대로, `obj_decor_window`는 만들지 않는다. 반영: T034.
- **Q4 → SC-001~003 수치는 그대로, PoC 동안 측정하지 않는다(가정)**: 측정 태스크를 만들지 않는다. 반영: T164, T077(fixture와 모의 실행만, 목표 달성 판정은 하지 않음).

## 결정된 질문 2 (2026-10-27, 소유자의 추가 답변 · 해석은 가정)

- **방 소품도 생성 대상(결정)**: 생성 대상은 배경 조각 + 말풍선 틀 + **방 소품**이다. 소품은 마스코트·앱 캐릭터를 닮으면 안 되고 글자·로고·브랜드가 없어야 하며 장면의 오브젝트 16개 한도에 센다. 반영: T123, T125, T131, T132, T140.
- **홈 커버 사진은 신고 대상이 아님(결정)**: 사진은 업로드된 사진이고 AI 생성물이 아니다. 사진 신고·검수는 없다. 신고는 생성 장식과 방 장면에만 있다. 반영: T093, T145.
- **보관함 상한은 있다(결정) · 기본 40개는 가정**: 서버 설정값(`app_config.generation_library_cap`, 앱에 하드코딩하지 않음)이라 나중에 올릴 수 있다. 상한에 닿으면 새 생성 요청을 모델 호출 전에 `LIBRARY_FULL`로 막고, 구성원은 자기들의 장식을 지워 자리를 만든다(방에 놓인 장식도 지울 수 있고 방에서도 사라진다). 요금제·결제·권한은 설계하지 않는다. 반영: T131, T127, T136, T142.
- **하루 3회 유지(결정) · 거절·실패는 세지 않음(가정, 소유자가 따로 확인하지는 않음)**: 성공한 미리 보기만 센다. 반영: T022, T126.

## 결정된 질문 3 (2026-10-27, 복구 기능 제거 · 해석은 가정)

- **복구 기능 제거**: 종료·연결 끊기는 소프트 삭제이고 서버가 내부적으로 30일 뒤 완전히 삭제한다. 앱은 기간이나 복구를 알리지 않는다. 반영: T090, T092, T095, T096, T098, T099, T100, T094.

## 열린 질문 (가정으로 구현하는 작은 것 — 소유자가 바꾸면 따른다)

- **R-계정 삭제(US10로 설계됨)**: 계정 삭제는 P1로 넣었다(결정·가정 `spec.md` Decided 41~46). 남은 열린 질문은 유예 삭제 옵션(cooling-off), 상대 안내 문구 대안(이름 없는 사실 vs 중립), 같은 계정 즉시 재가입 허용(썸원은 30일 막음), 계정 삭제 때 공간을 30일 대신 즉시 완전 삭제할지, 동의 기록 보관, 신고 증거 보관(퍼지 보류), 앱 밖 요청의 본인 확인이다.
- **R-신고 증거 보관**: 신고 행은 공간과 함께 완전 삭제하는 것으로 가정했다. 남용 대응 증거를 더 보관할지는 열린 질문(`spec.md` Open Decisions).
- **R-생성 장식**: 마일스톤 방 말풍선에 생성 틀 적용 여부(지금 앱 고정) · 기준 라이브러리 최종 그림 승인·제작 주체(G13) · 렌더 이미지 기반 2차 검사와 신고 처리 담당·응답 시간(G17) · 프롬프트·판정 보관 30일.
- 출시 게이트 G1~G18(Phase 14)은 별개로 계속 열려 있다.
