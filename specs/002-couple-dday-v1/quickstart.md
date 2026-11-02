# Quickstart: V1 검증 순서

## 로컬 (매 PR)

```sh
pnpm install --frozen-lockfile
pnpm lint && pnpm typecheck
pnpm --filter mobile test
supabase start -x studio,imgproxy,vector,logflare,supavisor   # 마이그레이션·seed 적용
supabase test db                                              # pgTAP
deno test -A supabase/functions                               # Edge Functions(로컬 스택)
node tools/ci/check-migrations.mjs && node tools/ci/check-functions-boot.mjs
```

두 시뮬레이터 연결 흐름은 firstmate 작업 기록 `cpl-pairtest/`의 `start-local.sh`(환경 변수 `AROOM_LOCAL_REPO`로 작업 worktree 지정), `PairUITest.swift`, `stop-local.sh` 패턴을 쓴다. 스크립트는 기존 컨테이너·포트·`.env.local`이 있으면 멈추고 아무것도 지우지 않는다.

## 기기 체크리스트 (TestFlight, 오너·여자친구 폰)

### TestFlight (S1)
- [ ] `release-ios` 실행 → ASC에 새 빌드 번호 → 처리 완료 → 두 폰에 설치(V0-F14-AC-01, -02).
- [ ] 설정 > 버전 행에 마케팅 버전·빌드 번호가 보인다.

### OTA (S1)
- [ ] `ota` preview 게시 → 앱 두 번 재실행 → 바뀐 문구 확인(V0-F14-AC-03).
- [ ] 같은 그룹 production 승격 → production 채널 빌드에서 확인(있을 때)(V0-F14-AC-04). 이전 그룹 republish로 롤백.

### 위젯 (S4)
- [ ] App Group PoC: 앱에서 숫자 쓰기 → 홈 small·잠금 circular에 보임(V0-F11-AC-01).
- [ ] 6개 family × full color·dark·tinted(iOS 18)·clear(iOS 26)·잠금 vibrant가 보드와 같다(V0-F11-AC-03).
- [ ] 기기 날짜를 공간 시간대 자정 직전으로 → 자정 뒤 D+N 증가(앱 안 열기)(V0-F11-AC-04). 비행기 모드, 재부팅, 7일 미실행 뒤에도 확인.
- [ ] 기념일 당일 "오늘" 상태, 대기·공간 없음·끝남 상태(V0-F11-AC-05, -06).
- [ ] 잠금 화면에 이름 없음, 직접 추가 제목은 잠금 상태에서 가려짐(V0-F11-AC-07).
- [ ] 탭하면 앱 홈으로(V0-F11-AC-08).

### 알림 (S5)
- [ ] 연결 직후 사전 안내 → 알림 켜기 → iOS 권한 창(V0-F10-AC-01).
- [ ] 기기 시각을 기념일 전날 08:59(공간 시간대)로 → 09:00 미리 알림, 당일 09:00 알림 문구 확인(V0-F10-AC-02, -03).
- [ ] 상대 폰이 닫힌 상태에서 기념일을 지움 → 상대 폰에 옛 알림이 울릴 수 있음 → 앱을 열면 사라짐(V0-F10-AC-08).
- [ ] 로그아웃 뒤 예약 0개(V0-F10-AC-07, SC-006).

### 접근성 (S6)
- [ ] 글자 크기 200%에서 모든 V1 화면 잘림 없음, VoiceOver로 탭·D+N·기념일 행·위젯 읽기, 동작 줄이기에서 모피 정지(V0-NF-01).
