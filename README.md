# couple-app

커플이 메인 D-day를 확인하고 프롬프트로 둘만의 방을 꾸미는 모바일 앱입니다.

## 현재 상태

V0(커플 D+Day) 앱 코드가 이 저장소에 있습니다. 모바일 앱은 `apps/mobile`(Expo), 관리자 화면은 `apps/admin`, 백엔드는 `supabase/`(마이그레이션과 Edge Functions)에 있습니다. 검증 명령과 규칙은 [AGENTS.md](AGENTS.md)에 있습니다.

## 문서 안내

`specs/002-couple-dday-v0/`에는 V0(첫 출시: 커플 D+Day, iOS·TestFlight) 명세·계획·작업과 Codex용 슬라이스별 handoff(`handoffs/`)가 있습니다. 다음 버전 V1은 [AI Couple Planet 정책](specs/003-ai-couple-planet-v1/policy.md)을 따릅니다(오너 2026-11-19).

`specs/001-couple-prompt-todo/`에는 기능 명세와 설계 자료가 있습니다.

- `spec.md`: 제품 범위, 사용자 시나리오, 요구사항, 가정
- `checklists/requirements.md`: 명세 품질 점검
- `plan.md`: 구현 계획과 제안 기술 구성
- `research.md`: 기술 조사와 선택 근거
- `data-model.md`: 데이터 모델
- `contracts/`: API 및 방 장면·표현 스키마
- `quickstart.md`: 설계 검증을 위한 빠른 확인 절차
- `design-brief.md`: Claude Design 입력 및 산출물 안내
- `design/`: 완성된 시각·상호작용 설계와 구현 인계 자료(캔버스 원본, 토큰, 화면·컴포넌트·문구 문서, 에셋 사양)

## 작업 방식

이 저장소는 GitHub spec-kit을 사용하는 spec-first 프로젝트입니다. 명세와 설계를 먼저 관리하고, 확정된 설계를 바탕으로 구현합니다.
