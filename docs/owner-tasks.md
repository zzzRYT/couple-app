# 소유자가 직접 해야 하는 일

코드 구현(Phase 1~5, MVP 컷)은 로컬 Supabase와 가짜 AI 모델로 진행하므로 아래 항목을 기다리지 않는다. 아래는 **사람(소유자)만 할 수 있는 일**이며, 위쪽일수록 MVP 데모를 실제 기기·실제 서비스로 확인하는 데 먼저 필요하다. 키와 비밀 값은 저장소·PR·채팅에 붙이지 말고 `supabase secrets set`(서버)이나 EAS 환경 변수(앱 공개 값)로만 넣는다(`docs/secrets.md`).

## A. MVP 데모를 실제 환경에서 돌리기 위해 (지금 병렬로)

로그인은 2026-10-27 결정대로 **Sign in with Apple만** 연다(카카오 보류, 이메일은 개발 빌드 전용 테스트 로그인).

1. ~~Expo 계정과 EAS 프로젝트~~ — 완료: `@zzzryt/aroom` 생성·연결(projectId `99310e9a-4aee-4116-b9da-b6a26460f7e3`, `apps/mobile/src/config/identity.ts`).
2. **Apple Developer Program 가입 → App ID `com.jinjinstar.aroom.dev` 등록(Sign In with Apple capability) → `eas device:create`로 iPhone 등록** — `docs/apple-sign-in-setup.md` 1장. 운영 ID `com.jinjinstar.aroom`은 이름 확인(G2) 전 등록 금지.
3. **Supabase 원격 프로젝트 만들기**(개인 계정, Seoul, 무료) → `supabase link` → `db push` → 카탈로그 시드 1회 → `functions deploy` → `lifecycle-sweep` 하루 1회 예약 — `docs/remote-supabase-setup.md`.
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
