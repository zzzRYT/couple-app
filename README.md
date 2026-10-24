# couple-app

커플이 메인 D-day를 확인하고 프롬프트로 둘만의 방을 꾸미는 모바일 앱입니다.

## 현재 상태

제품 명세와 기술 설계를 마쳤습니다. 다음 단계는 Claude Design을 통한 시각 디자인이며, 이후 앱을 구현합니다. 저장소에는 아직 애플리케이션 코드가 없습니다.

## 문서 안내

`specs/001-couple-prompt-todo/`에는 기능 명세와 설계 자료가 있습니다.

- `spec.md`: 제품 범위, 사용자 시나리오, 요구사항, 가정
- `checklists/requirements.md`: 명세 품질 점검
- `plan.md`: 구현 계획과 제안 기술 구성
- `research.md`: 기술 조사와 선택 근거
- `data-model.md`: 데이터 모델
- `contracts/`: API 및 방 장면·표현 스키마
- `quickstart.md`: 설계 검증을 위한 빠른 확인 절차
- `design-brief.md`: Claude Design 입력 및 산출물 안내

## 작업 방식

이 저장소는 GitHub spec-kit을 사용하는 spec-first 프로젝트입니다. 명세와 설계를 먼저 관리하고, 확정된 설계를 바탕으로 구현합니다.
