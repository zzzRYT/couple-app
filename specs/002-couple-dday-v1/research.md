# Research: 커플 D+Day V1

조사 원본은 firstmate 작업 기록 `cpl-v1-feasibility/report.md`(2026-11-02)이며 아래는 계획에 필요한 결정과 대안만 옮긴 것이다. 결정 주인은 표의 "결정"이 오너면 오너, "제안"이면 구현 담당이 PoC 결과로 바꿀 수 있다.

| # | 주제 | 결정/제안 | 대안 | 근거 | 결정 주인 |
|---|---|---|---|---|---|
| R1 | 위젯 구현 | 제안: Expo SDK 58 `expo-widgets`(config plugin, App Group, `updateTimeline`/`reload`) | `@bacons/apple-targets` + Swift `TimelineProvider`; 수동 Xcode 타깃(CNG에서 유지 어려움) | 공식 SDK, JS만으로 레이아웃. 단, 위젯 런타임은 hooks·비동기·앱 상태를 못 쓰고 Expo UI SwiftUI 컴포넌트만 쓴다. 장기 미실행 정확성은 Swift가 유리 | 구현(PoC T401 결과) |
| R2 | 위젯 timeline 길이 | 제안: 공간 시간대 자정 35개 이상 미리 기록 | Swift provider가 App Group 원본으로 매번 재생성 | 앱을 한 달 안 열어도 D+N이 맞음. WidgetKit reload는 OS 예산에 따름 | 구현 |
| R3 | 알림 | 결정: 로컬 예약만, 공간 시간대 09:00, 최대 50개 | 서버 푸시(+4~7일), 매년 반복 trigger | iOS는 가장 이른 64개만 유지. 반복 trigger로는 윤일·편집·삭제를 다루기 어려움 | 오너(A-05, A-18) |
| R4 | OTA | 결정(가정): EAS Update, runtimeVersion `fingerprint` | Hot Updater(Cloudflare), `appVersion` 정책 | 한 공급자 구성, native 변경 시 runtime 자동 분리 | 오너(A-04) |
| R5 | TestFlight 배포 | 결정(가정): 내부 테스터, `.dev` bundle id의 별도 ASC 레코드, store 배포 프로필 | 외부 테스터 + Beta App Review, ad hoc(현 preview) | 기존 preview는 ad hoc라 TestFlight 불가 | 오너(A-02, A-03) |
| R6 | 기념일 계산 위치 | 제안: 앱 순수 모듈 + 서버는 일수·주년 축하 기록만, 공유 fixture | 서버 목록 API 확장(1년치) | 위젯·알림·오프라인이 앱 계산을 필요로 함. 서버 `upcoming`은 3개뿐 | 구현 |
| R7 | V1 문구 저장 | 제안: `locales/v1/*.json` overlay | 생성기 입력(`design/i18n-copy.md`) 수정 | 이번 작업은 `design/`을 고치지 않음(PR 25 대기) | 구현, PR 25 뒤 정리 |
| R8 | 브랜드 이름 | 결정(가정): i18n 키 `app.name`·`mascot.name` + nesting | 문구마다 리터럴 | 이름 미정(A-01) | 오너 |
| R9 | 시간대 저장 | 제안: `couple_space.time_zone` 하나, 새 RPC로 변경 | 방 테마 문서 `timeZone` 유지 | 방은 숨김. 기존 RPC는 prompt session 잠금을 거침 | 구현 |
| R10 | 동시 편집 | 결정(가정): `version` 정수 + `VERSION_CONFLICT` | 마지막 저장 승리 | 보드 `V0-edit-conflict` | 오너(A-10) |
