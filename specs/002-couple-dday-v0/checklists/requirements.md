# Specification Quality Checklist: 커플 D+Day V0

**Purpose**: spec.md가 계획 단계로 넘어갈 만큼 완전하고 품질이 충분한지 확인
**Created**: 2026-11-02
**Feature**: [spec.md](../spec.md)

## Content Quality

- [x] 구현 세부(언어·프레임워크·API)는 요구 사항이 아니라 Assumptions·plan에만 있다 — 예외: V0-F14(출시 자동화)는 도구 이름 자체가 오너 요구(EAS·TestFlight)라 그대로 둠
- [x] 사용자 가치와 오너 요구에 맞춰 쓰였다
- [x] 비개발자(오너)가 읽을 수 있다
- [x] 필수 섹션(User Scenarios, Requirements, Success Criteria)이 모두 있다

## Requirement Completeness

- [x] [NEEDS CLARIFICATION] 표시가 남아 있지 않다(미정 항목은 "가정한 기본값" 표 A-02~A-25)
- [x] 요구 사항은 테스트 가능하고 모호하지 않다(각각 AC ID가 있음)
- [x] 성공 기준은 측정 가능하다
- [x] 성공 기준은 기술 중립적이다(SC-001의 워크플로는 오너 요구)
- [x] 모든 수락 시나리오가 정의되었다
- [x] 엣지 케이스가 정의되었다(V0-EC-01~12: 윤일, 상대 삭제, 오프라인, 충돌, 시간대 등)
- [x] 범위가 명확하다(Out of Scope 목록)
- [x] 의존성과 가정이 드러나 있다

## Feature Readiness

- [x] 모든 기능 요구 사항(V0-F01~F14)에 수락 기준이 있다
- [x] 사용자 시나리오가 주요 흐름(연결, 홈, 기념일, 위젯, 알림, 설정, 출시)을 덮는다
- [x] 성공 기준에서 측정 가능한 결과를 낸다
- [x] 구현 세부가 spec 요구 사항으로 새지 않았다

## Notes

- 디자인 사실이 보드에서 읽히지 않는 곳은 handoff 디자인 발췌에 `verify against board <id>`로 남겼다.
