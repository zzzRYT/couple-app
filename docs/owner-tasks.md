# 소유자가 직접 해야 하는 일

코드 구현(Phase 1~5, MVP 컷)은 로컬 Supabase와 가짜 AI 모델로 진행하므로 아래 항목을 기다리지 않는다. 아래는 **사람(소유자)만 할 수 있는 일**이며, 위쪽일수록 MVP 데모를 실제 기기·실제 서비스로 확인하는 데 먼저 필요하다. 키와 비밀 값은 저장소·PR·채팅에 붙이지 말고 `supabase secrets set`(서버)이나 EAS 환경 변수(앱 공개 값)로만 넣는다(`docs/secrets.md`).

## A. MVP 데모를 실제 환경에서 돌리기 위해 (지금 병렬로)

1. **Supabase 원격 프로젝트 만들기** — 개인 계정, 리전 Seoul `ap-northeast-2`, 무료 플랜(비활동 시 일시 정지됨). 만든 뒤 프로젝트 URL과 publishable(anon) 키만 앱 설정에 쓰고, service-role 키는 어디에도 붙이지 않는다. 마이그레이션 적용은 준비되면 `supabase link` → `supabase db push`로 소유자가 실행한다.
2. **Claude Console API 키** — Claude Max 요금제 포함 월 크레딧에 연결된 **Console API 키**(채팅 로그인·Claude Code 토큰 아님). 이 프로젝트 전용 Console workspace를 만들고 지출 한도를 건다. 키는 `supabase secrets set ANTHROPIC_API_KEY=…`로만 넣는다.
3. **초대 코드 pepper 비밀** — 임의의 긴 무작위 문자열을 만들어 `supabase secrets set INVITE_CODE_PEPPER=…`로 넣는다(초대 코드 해시용, 원격 프로젝트마다 하나).
4. **Expo 계정과 EAS** — Expo 계정을 만들고 `eas login` → `apps/mobile`에서 `eas init`으로 프로젝트 ID를 받는다. 무료 플랜 한도는 월 15 iOS + 15 Android 빌드. `development` 프로필로 내부 개발 클라이언트를 빌드해 두 기기에 설치한다(스토어 제출은 하지 않는다).
5. **이메일 OTP 발송 설정(원격)** — 원격 Supabase Auth에서 이메일 OTP 6자리를 켜고, 필요하면 SMTP를 연결한다(무료 기본 메일은 발송 한도가 낮음). 로컬에서는 Mailpit(`http://127.0.0.1:54324`)으로 확인된다.
6. **카카오 로그인 앱** — Kakao Developers 앱 생성, REST API 키·Client Secret, Redirect URI(`https://<project>.supabase.co/auth/v1/callback`), 동의항목 설정 후 Supabase Auth의 Kakao 공급자에 입력. 자세한 순서는 `docs/auth-setup.md`.
7. **Apple 로그인** — Apple Developer 계정, Services ID·Key(.p8)·redirect domain 설정 후 Supabase Auth의 Apple 공급자에 입력. `.p8` 파일은 저장소에 넣지 않는다.
8. **두 기기 실측** — 개발 클라이언트로 두 기기(또는 에뮬레이터 2대)에서 초대 → 수락 → 같은 D-day → 점유 → 프롬프트 → 미리 보기 → 적용 → 양쪽 같은 방을 확인한다. 이 PR은 이 실기기·실서비스 확인을 하지 않았다.

## B. 출시 전에 소유자가 닫는 게이트 (구현을 막지 않음)

`specs/001-couple-prompt-todo/tasks.md` Phase 14(T167~T184)의 사람 확인 항목이다.

- **G1 법률 검토**(T167): 만 14세 문구, 해외 AI 처리 동의와 보관 기간(`[법무 확인 후 입력]` 자리), 사진·알림·UGC·AI 오류 가능 고지.
- **G2 이름 확인**(T168): 상표 Aroom/아룸 (이전 이름 Mopiru/모피루), 스토어 이름, 도메인 `aroom.jinjinstar.com`, bundle ID. 확인 전에는 스토어에 등록하지 않는다.
- **G3 스토어 규칙**(T169): 글자 수·연령 등급 설문·"연결 끊기 + 신고"·알림 심사 메모.
- **G4 원어민 검수**(T170): 영어·일본어 문구 전체.
- **G5 카카오·Apple 공식 SDK/에셋**(T171): 자리표시 버튼 교체.
- **G6 글꼴 번들 크기 실측**(T172): EAS 산출물로 9파일/최소 구성 선택.
- **G7 에셋 최종 그림·포맷**(T173): 일러스트레이터가 일반 오브젝트 18개 최종 그림 납품, PNG-8/WebP 결정.
- **G8 AI 약관·비용·승급**(T174): 포함 크레딧의 공개 앱 사용 가능 여부를 Anthropic에 서면 문의, 유료 크레딧 전환, Haiku→Sonnet 승급 기준.
- **G9 서버 푸시 필요 여부**(T175).
- **G10 공개 지원 이메일**(T176): 주소를 소유자가 만든다.
- **G11 마스코트·아이콘 닮음 검사**(T177, 권장).
- **G12 개인 개발자 계정과 Supabase 운영 요금제**(T178): Apple·Google Play 개인 계정.
- **G13~G18**(T179~T184): 기준 라이브러리 승인, 생성 콘텐츠 스토어 규칙, 약관·개인정보(생성), Anthropic 사용 정책, 실제 모델 품질 평가, 계정 삭제 출시 점검 — MVP 다음 단계(US8~US10)와 함께 닫는다.
