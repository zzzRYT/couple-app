# 소유자가 직접 해야 하는 일

코드 구현(Phase 1~5, MVP 컷)은 로컬 Supabase와 가짜 AI 모델로 진행하므로 아래 항목을 기다리지 않는다. 아래는 **사람(소유자)만 할 수 있는 일**이며, 위쪽일수록 MVP 데모를 실제 기기·실제 서비스로 확인하는 데 먼저 필요하다. 키와 비밀 값은 저장소·PR·채팅에 붙이지 말고 `supabase secrets set`(서버)이나 EAS 환경 변수(앱 공개 값)로만 넣는다(`docs/secrets.md`).

## A. MVP 데모를 실제 환경에서 돌리기 위해 (지금 병렬로)

로그인은 2026-10-27 결정대로 **Sign in with Apple만** 연다(카카오 보류, 이메일은 개발 빌드 전용 테스트 로그인).

1. ~~Expo 계정과 EAS 프로젝트~~ — 완료: `@zzzryt/aroom` 생성·연결(projectId `99310e9a-4aee-4116-b9da-b6a26460f7e3`, `apps/mobile/src/config/identity.ts`).
2. **Apple Developer Program 가입 → App ID `com.jinjinstar.aroom.dev` 등록(Sign In with Apple capability) → `eas device:create`로 iPhone 등록** — `docs/apple-sign-in-setup.md` 1장. 운영 ID `com.jinjinstar.aroom`은 이름 확인(G2) 전 등록 금지.
3. **Supabase 원격 프로젝트 만들기**(개인 계정, Seoul, 무료) → `supabase link` → `db push` → 카탈로그 시드 1회 → `functions deploy` → `lifecycle-sweep` 하루 1회 예약(공간 종료 30일 뒤 완전 삭제도 이 함수가 하므로 **아래 C 확인 뒤에** 걸 것) — `docs/remote-supabase-setup.md`.
4. **Supabase Apple 공급자 켜기**, Client IDs = `com.jinjinstar.aroom.dev` — `docs/apple-sign-in-setup.md` 2장. 개발 빌드의 이메일 테스트 로그인을 원격에서 쓰려면 개발용 프로젝트에서만 Email 공급자를 켜 둔다.
5. **서버 비밀**: `supabase secrets set INVITE_CODE_PEPPER=…`, `supabase secrets set ANTHROPIC_API_KEY=…`(Claude Max 포함 크레딧에 연결된 Console API 키, 전용 workspace에 지출 한도).
6. **앱에 원격 값 넣기**: `eas env:create`로 `EXPO_PUBLIC_SUPABASE_URL`·`EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`(publishable 키만), 로컬 개발은 `apps/mobile/.env.local`.
7. **개발 빌드 설치와 실측**: `eas build --profile development --platform ios` → 등록된 iPhone에 설치 → `npx expo start --dev-client` → Apple 로그인 → 두 번째 기기(다른 Apple ID 또는 이메일 테스트 로그인)로 초대 수락 → 같은 D-day → 점유 → 프롬프트 → 미리 보기 → 적용 → 양쪽 같은 방. 이 PR은 실기기·실서비스 확인을 하지 않았다.
8. **결정 확인**: 개발 빌드 전용 이메일 테스트 로그인을 남길지(가정). 원하지 않으면 알려 주면 지운다.

## B. 출시 전에 소유자가 닫는 게이트 (구현을 막지 않음)

`specs/001-couple-prompt-todo/tasks.md` Phase 14(T167~T184)의 사람 확인 항목이다.

- **G1 법률 검토**(T167): 만 14세 문구, 해외 AI 처리 동의와 보관 기간(`[법무 확인 후 입력]` 자리), 사진·알림·UGC·AI 오류 가능 고지.
- **G2 이름 확인**(T168): 상표 Aroom/아룸 (이전 이름 Mopiru/모피루), 스토어 이름, 도메인 `aroom.jinjinstar.com`, bundle ID. 확인 전에는 스토어에 등록하지 않는다.
- **G3 스토어 규칙**(T169): 글자 수·연령 등급 설문·"연결 끊기 + 신고"·알림 심사 메모.
- **G4 원어민 검수**(T170): 영어·일본어 문구 전체.
- **G5 카카오 공식 SDK/에셋**(T171): 카카오를 다시 켤 때 자리표시 버튼 교체(Apple은 이미 공식 버튼).
- **G6 글꼴 번들 크기 실측**(T172): EAS 산출물로 9파일/최소 구성 선택.
- **G7 에셋 최종 그림·포맷**(T173): 일러스트레이터가 일반 오브젝트 18개 최종 그림 납품, PNG-8/WebP 결정.
- **G8 AI 약관·비용·승급**(T174): 포함 크레딧의 공개 앱 사용 가능 여부를 Anthropic에 서면 문의, 유료 크레딧 전환, Haiku→Sonnet 승급 기준.
- **G9 서버 푸시 필요 여부**(T175).
- **G10 공개 지원 이메일**(T176): 주소를 소유자가 만든다.
- **G11 마스코트·아이콘 닮음 검사**(T177, 권장).
- **G12 개인 개발자 계정과 Supabase 운영 요금제**(T178): Apple·Google Play 개인 계정.
- **G13~G18**(T179~T184): 기준 라이브러리 승인, 생성 콘텐츠 스토어 규칙, 약관·개인정보(생성), Anthropic 사용 정책, 실제 모델 품질 평가, 계정 삭제 출시 점검 — MVP 다음 단계(US8~US10)와 함께 닫는다.

## C. 공간 종료·연결 끊기·신고(US5) 검토 뒤 배포하기

PR을 검토·머지한 뒤에만 원격에 올린다(이 작업은 Aroom-prod에 아무것도 배포하지 않았다).

1. `supabase db push` — 새 마이그레이션 `20261101000750_lifecycle_report.sql` 하나가 적용된다(`report` 표, `end_space`·`submit_report`·삭제 함수들).
2. `supabase functions deploy spaces reports lifecycle-sweep` — `reports`는 새 함수다.
3. **`lifecycle-sweep` 예약은 아직 걸지 않는다**(결정 대기). 걸면 종료 후 30일이 지난 공간의 모든 행과 사진이 되돌릴 수 없게 지워진다. 걸기 전에 한 번 `POST …/lifecycle-sweep`을 손으로 불러 응답의 `purged`·`failed`를 본다.
4. 앱은 새 개발 빌드가 필요하다(JS만 바뀌었으면 업데이트로 충분하지만, 화면이 새로 생겼으니 빌드를 새로 받는 게 안전하다).

**실기기 두 대로 확인할 것** (A·B 두 사람, 같은 공간)
- 설정 → "문의 · 신고": 대상·이유를 고르기 전에는 보내기가 눌리지 않고, 보내면 "신고를 보냈어요"가 보이며 공간은 그대로다. 프롬프트 대화에서 상대 메시지의 "⋯" → "이 메시지 신고"로도 보내 본다.
- 설정 → "공간 종료": 체크를 해야 버튼이 켜지고, 종료하면 A에 "공간을 종료했어요"가 뜨며 "새 공간 시작하기"로 만들기/코드 입력 선택 화면에 간다. **B는 앱이 켜져 있으면 곧바로**, 꺼져 있었다면 다음에 열 때 "상대님이 공간을 종료했어요"를 한 번 보고, 확인하면 다시 보이지 않는다. 화면 어디에도 기간·복구 문구가 없어야 한다.
- 신고 화면의 "상대님과 연결 끊기": 확인 창이 결과를 먼저 말하고, 확인하면 A는 종료 안내, B는 "상대님이 연결을 끊었어요"를 본다. 신고는 접수되지 않는다.
- 종료한 두 사람이 곧바로 각자 새 공간을 만들거나 한쪽이 만든 코드로 다시 합칠 수 있는지, 프롬프트 점유 중에 종료해도 상대 화면의 점유 표시가 풀리는지 본다.
- 확인하지 못한 것: 실기기, 원격 프로젝트, 실제 Storage 사진 삭제(사진 기능은 US6), 예약된 완전 삭제(로컬에서 고정 시계로만 검증).

## D. 홈 배경 사진(패키지 C) 검토 뒤 배포하기

C와 마찬가지로 PR을 검토·머지한 뒤에만 원격에 올린다(이 작업은 Aroom-prod에 아무것도 배포하지 않았고, 서버를 켜서 실행해 보지도 않았다).

1. `supabase db push` — 새 마이그레이션 `20261102000500_home_cover.sql` 하나가 적용된다(`home_cover_photo`·`home_cover_upload` 표, 비공개 `home-cover` 버킷, 커버 함수들).
2. `supabase functions deploy home-cover lifecycle-sweep` — `home-cover`는 새 함수다(`verify_jwt = false`, 인증은 함수 안에서 한다). 마이그레이션보다 먼저 올리지 않는다.
3. 앱은 **새 개발 빌드가 꼭 필요하다**: 새 네이티브 모듈 `expo-image-manipulator`가 들어가서 JS 업데이트만으로는 동작하지 않는다(`eas build --profile development --platform ios`).
4. `lifecycle-sweep`은 이제 만료된 업로드와 교체·삭제 24시간 뒤의 이전 커버 객체도 지운다. 예약은 C 3번 결정을 따른다.

**배포 전에 서버에서 확인할 것** (개발용 원격 프로젝트에서 curl 등으로)
- **미해결(출시 전 결정 필요)**: `home-cover`는 콜드 스타트마다 `deno.land`에서 imagescript 코덱 wasm을 받는다. 이 바이트는 `deno.lock`으로 고정·검증되지 않아서 `deno.land` 장애 때 함수 전체가 부팅하지 못하고 무결성 검사도 없다. (1) wasm을 함수 옆에 벤더링해 `file:` URL로 불러오기, (2) wasm을 패키지에 묶은 다른 코덱으로 바꾸기 중 하나를 승인해야 한다(`docs/remote-supabase-setup.md` 4장).
- 재인코딩 부하: Edge Function이 사진을 디코드·크롭·JPEG 재인코딩할 때의 CPU 시간과 메모리는 **측정하지 못했다**. 출시 전에 실제 프로젝트에서 12MP 이상 사진(앱이 긴 변 1600px로 줄여 올리는 경로)으로 확정 PUT이 성공하는지 확인한다. 서버는 디코드 전에 400만 화소를 넘는 입력을 `COVER_INVALID_IMAGE`로 거부한다.
- 서명 URL: `upload-url`이 준 URL의 `signature`·`space`·`user`·`expires` 중 하나라도 바꾸거나, 5분이 지난 뒤 PUT하면 `NOT_FOUND`로 거부된다.
- 크기·포맷: `byteSize` 20MB 초과는 `COVER_TOO_LARGE`, JPEG·PNG·HEIC 외 `contentType`이나 발급 때와 다른 `Content-Type`은 `COVER_FORMAT_UNSUPPORTED`, 실제 바이트가 선언과 다르거나 헤더가 포맷과 맞지 않으면 `COVER_INVALID_IMAGE`이고 커버는 그대로다.
- crop: 0~1 범위를 벗어나거나 정사각형이 아닌 crop은 저장 전에 거부된다(`INVALID_REQUEST`/`COVER_INVALID_IMAGE`).
- RLS: 비멤버 계정으로 `home_cover_photo`·`home_cover_upload`를 select하면 행이 안 보이고, `home-cover` 버킷 객체도 읽지 못한다.
- 함수 권한: `authenticated` 키로 `commit_home_cover`(및 다른 커버 RPC)를 직접 부르면 권한 오류가 난다(실행 권한은 `service_role`에만 있다).

**실기기로 확인할 것**
- HEIC: iPhone에서 HEIC 사진을 골라 올리면 앱이 JPEG로 바꿔 올리고 홈에 보인다. Android도 확인한다(`docs/spikes/heic.md`, 아직 실기기 미확인).
- 홈에서 사진 추가·바꾸기·없애기 시트가 열리고, 오프라인에서는 바꿀 수 없으며, 상대가 바꾸거나 없애면 알림이 뜬다.
