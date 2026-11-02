# S01 온보딩 / 시작

승인자: 미승인
승인일: 미정

## 목적, ID, 경로

ID: S01
Route: /(auth)/welcome

## 디자인 원본

- [S01-onboarding.dc.html](../../../canvas/project/S01-onboarding.dc.html)

## 이미지

- [S01-3__ios-light-ko.png](../../../exports/S01-3__ios-light-ko.png)
- [S01-1__ios-light-ko.png](../../../exports/S01-1__ios-light-ko.png)

## 상태와 상호작용

- **캔버스 보드**: `S01-onboarding`
- **목적**: 제품 소개 3장(함께한 날 세기 · 프롬프트로 방 꾸미기 · 마스코트 — 3번째 장이 앱 전체에서 유일한 캐릭터 히어로), 로그인 시작, 약관·개인정보·연령 문구, 재실행 상태.
- **이동**: 앱 첫 실행 → 소개 1~3 → 시작하기 → S02. 이미 계정이 있어요 → S02. 재실행(로그아웃 후) → 최근 사용한 방법 강조된 로그인.
- 연령: 가입 시작 화면의 약관 줄이 "계속하면 만 14세 이상이며 아래 내용에 동의하는 것으로 봐요"라고 해요(최소 연령 14세는 결정, 정확한 문구는 법무 검토 필요). 연령은 이 문구로만 확인하고 생년월일을 묻지 않아요(가정).
- 스토어 정책 문구 자리는 약관 링크 아래 한 줄이에요(법무 확정 후 교체).
- 소개 1장 맨 위에 앱 이름(아룸)과 슬로건("Our little world, together.")을 보여 줘요(`brand.tagline`, 영어 원문만 결정이라 세 언어 모두 영어). 글자 크기 130% 이상에서는 이 묶음을 숨겨요.
- 소개 3의 캐릭터 이름은 아루미예요(일본어 표기는 초안(G4 원어민 검수 전)).
- 탭 바 없음(탭 구조 앞의 흐름).
- **긴 문구·언어 사례**: 영어 "Count the days you've had together"처럼 제목이 길어도 두 줄로 줄바꿈돼요. 일본어 본문은 line-break: strict.

| 상태 ID | 설명 | 사용하는 키 | 그린 조합 |
|---|---|---|---|
| `S01-1` | 소개 1: 둘이 함께한 날 | `onb.skip` `main.appName` `brand.tagline` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `onb.p1.title` `onb.p1.body` `onb.pageOf` `common.next` | iOS·밝게·ko, Android·어둡게·ko |
| `S01-2` | 소개 2: 프롬프트로 방 꾸미기 | `onb.skip` `onb.p2.title` `onb.p2.body` `onb.pageOf` `common.next` | iOS·밝게·ko, Android·어둡게·ko |
| `S01-3` | 소개 3: 마스코트 + 시작, 약관·연령 문구 위치 | `a11y.pose.wave_main` `a11y.mascot` `onb.p3.title` `onb.p3.body` `onb.pageOf` `onb.start` `onb.hasAccount` `onb.legal.lead` `onb.legal.links` `onb.age` | iOS·밝게·ko, Android·어둡게·ko, iOS·밝게·en, Android·어둡게·ja 외 4 |
| `S01-return` | 재실행: 최근 사용 로그인 표시 | `onb.back.title` `onb.back.body` `onb.lastUsed` `login.kakao` `login.apple` `login.email` `onb.legal.lead` `onb.legal.links` `onb.age` | iOS·밝게·ko, Android·어둡게·ko, iOS·밝게·en, Android·어둡게·ja |

## 이동 및 뒤로

F01: 앱 시작 → S01 → S02 → 공간 선택 S03 또는 S05. 뒤로: 로그인 → 소개; 인증 취소 → 로그인. 진입: 앱 시작. 나가기: 인증 후 공간 선택 또는 홈.

## 접근성

상태 표에 나열된 `a11y.*` 키를 스크린 리더 이름으로 사용합니다. 공통 접근성 및 200% 글자 규칙은 [interaction notes](../../../interaction-notes.md#10-접근성-상호작용)를 참조하세요. TODO: 해당 상태에 명시되지 않은 역할과 이름을 확인하세요.

## 수락 시나리오

- [ ] S01-AC-01: 소개 화면에서 시작하기 또는 기존 계정을 선택하면 S02로 이동한다.

## 열린 질문 / 추적

TODO: 명세에 없는 disabled/offline 상태의 적용 여부와 정확한 뒤로 대상을 확인하세요. 시나리오와 요구사항·테스트·실행 결과는 [추적표](../../traceability.md)에 연결하세요.
