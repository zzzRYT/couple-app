# Tasks: 커플 D+Day V1

**Input**: [spec.md](./spec.md), [plan.md](./plan.md), [data-model.md](./data-model.md), [contracts/](./contracts/)

**구성**: 조사 보고서의 6개 슬라이스(S1~S6) 순서. 슬라이스 하나 = handoff 하나 = PR 하나(`handoffs/H0N-*.md`). `[P]` = 같은 슬라이스 안에서 다른 파일이라 병렬 가능. 테스트를 먼저 쓴다(실패 확인 → 구현).

**모든 작업의 공통 완료 조건(DoD)**: (1) 표시된 시나리오 ID 테스트가 plan §10 추적표의 계층에서 통과, (2) 화면 작업은 시뮬레이터 화면이 handoff 디자인 발췌의 보드 프레임(화면 ID)과 레이아웃·문구·상태가 같음(밝게·어둡게, ko 기준 + en/ja 넘침 없음), (3) `pnpm lint && pnpm typecheck && pnpm --filter mobile test` 통과, 서버 작업은 `supabase test db`와 `deno test -A supabase/functions`도 통과, (4) 새 문구는 키로만, (5) `design/`·`specs/001-*` 수정 없음.

## 의존 관계

```text
S1 (출시) ──► S2 (V1 셸·홈) ──► S3 (기념일) ──► S4 (위젯) ──► S5 (알림) ──► S6 (마무리)
                     │                └──────────────► S5도 S3의 계산 엔진에 의존
                     └─ S2의 snapshot 타입·i18n overlay·플래그를 S3~S6이 씀
```

S1과 S2는 코드가 겹치지 않아 동시에 진행할 수 있다(S2의 TestFlight 확인만 S1 뒤). S4의 App Group PoC(T401)는 S1 빌드 경로가 필요하다.

---

## S1 — 출시 파이프라인과 빈 TestFlight 빌드 (H01) · V0-F14

- [ ] **T101** [P] 정적 검사 테스트 먼저: `tools/tests/release-config.test.mjs` — eas.json에 `testflight` 프로필(store, channel preview, autoIncrement), `production` channel, submit 프로필, app.config의 `runtimeVersion.policy === 'fingerprint'`·`updates.url`, 워크플로 두 개 존재·`workflow_dispatch`만·비밀 리터럴 없음. CI 마지막 `node --test` 줄에 추가. — 시나리오 V0-F14-AC-01, -05
- [ ] **T102** `apps/mobile/package.json`에 `expo-updates`(SDK 58 버전, `npx expo install`), `pnpm-lock.yaml` 갱신. — V0-F14-AC-03
- [ ] **T103** `apps/mobile/app.config.ts`: `version: '1.0.0'`, `runtimeVersion: { policy: 'fingerprint' }`, `updates: { url: \`https://u.expo.dev/${EAS_PROJECT.projectId}\` }`. 기존 가드 유지. — V0-F14-AC-03
- [ ] **T104** `apps/mobile/eas.json`: `testflight`, `production.channel`, `submit.testflight`(ascAppId 자리는 오너 값, 없으면 워크플로가 submit 단계에서 명확한 오류). — V0-F14-AC-01, -02
- [ ] **T105** [P] `.github/workflows/release-ios.yml`(build + auto-submit, concurrency, 실패 시 제출 없음). — V0-F14-AC-01
- [ ] **T106** [P] `.github/workflows/ota.yml`(preview 게시, production 승격·롤백 republish). — V0-F14-AC-03, -04
- [ ] **T107** `apps/mobile/README.md` "Release" 절: 오너 단계, 프로필·채널·runtime 설명. 기존 문장 "no store submission is configured"는 사실이 바뀌므로 고친다. — V0-F14-AC-06
- [ ] **T108** 설정 화면의 버전 행이 마케팅 버전과 빌드 번호를 보이게 한다. 빌드 번호는 원격 관리라 `app.config`에 없으므로 `expo-application`(`nativeApplicationVersion`, `nativeBuildVersion`)을 추가해 읽는다(지금은 `app/(tabs)/settings/index.tsx`가 `Constants.expoConfig?.version`만 넘김). 문자열은 `src/config/version.ts`의 `appVersionLabel()`로 만들어 H02가 재사용한다. — V0-F12-AC-09 일부, V0-F14-AC-03
- [ ] **T109** 오너 단계(H01 "owner-only steps") 실행 후 첫 TestFlight 빌드와 preview OTA 확인 기록을 PR에 남긴다. — V0-F14-AC-02, -03

**체크포인트**: 빈(현재 기능 그대로) 앱이 두 폰에 TestFlight로 깔리고 OTA 문구 변경이 보인다.

---

## S2 — V1 셸: 숨김, 3탭, 연결 흐름, D+Day 홈 (H02) · V0-F01, F02, F03, F13, F12(일부)

### 기반
- [ ] **T201** [P] `src/config/features.ts` + `src/config/__tests__/features.test.ts`, `src/app/__tests__/routes.test.tsx` 갱신(방·프롬프트·신고·커버 경로로 못 감). — V0-NF-06, V0-F03-AC-05
- [ ] **T202** [P] i18n overlay: `handoffs/design/copy-v0.md`를 `apps/mobile/src/i18n/locales/v1/copy-v0.md`로 복사하고 생성기 `tools/i18n/build-v1-overlay.mjs`가 V0 문구 278개 전부를 `src/i18n/locales/v1/{ko-KR,en-US,ja-JP}.json`으로 만든다(브랜드 이름 → `$t(app.name)`/`$t(mascot.name)` 치환, `mascot.name` 추가). `src/i18n/index.ts` 병합, `src/i18n/v1Keys.d.ts`, `src/i18n/__tests__/v1Overlay.test.ts`(세 언어 키 일치, 브랜드 리터럴 금지, `$t(app.name)` 해석). — V0-NF-02
- [ ] **T203** 서버: 마이그레이션 `20261103000100_v1_member_profile.sql`, `…200_v1_space_time_zone.sql`, `…300_v1_snapshot.sql` + pgTAP `supabase/tests/v1_member_profile.test.sql`, `v1_space_time_zone.test.sql`, `rls_snapshot.test.sql` 확장. — V0-F02-AC-03, V0-F12-AC-04, -05
- [ ] **T204** 서버: `functions/profile/index.ts` `PUT /profile/member`, `functions/spaces/index.ts` `PATCH /spaces/:id/time-zone` + Deno 테스트(`profile/__tests__/profile.test.ts` 확장, `spaces/__tests__/time_zone.test.ts`). — V0-F02-AC-03, V0-F12-AC-04, -05
- [ ] **T205** 앱 클라이언트: `client.ts` 타입(`Snapshot.members[].displayName/birthday`, `me`, `anniversaries`, `space.anniversaryChangedBy/At`), `routes.ts` 경로, `saveMemberProfile`, `updateTimeZone`. `lib/__tests__/api.test.ts` 확장.
- [ ] **T206** `src/lib/anniversaries.ts` 1단계(일수·주년·다음 기념일·다가오는 3개, V1 목록 50/100/150/200/300) + `__fixtures__/anniversaries.json` 시작 + `lib/__tests__/anniversaries.test.ts`. — V0-DR-01~03, V0-DR-05

### 화면
- [ ] **T207** `appGate.ts`에 `needsProfile`·연결 완료 1회 흐름, `_layout.tsx` 라우팅. `lib/__tests__/appGate.test.ts`. — V0-F02-AC-08, -10
- [ ] **T208** `V0-start-intro`(Apple만) — `features/auth/*`, `app/(auth)/*`. 테스트 `features/auth/__tests__/login.test.tsx`. — V0-F01-AC-01~03
- [ ] **T209** `V0-start-choose`, `V0-start-date`(+picker, future) — `features/onboarding/{SpaceChoiceScreen,CreateSpaceScreen}.tsx`. — V0-F02-AC-01, -02, -09
- [ ] **T210** 새 `V0-start-profile`(+err) — `features/onboarding/ProfileScreen.tsx`, `app/(onboarding)/profile.tsx`, 공간 생성은 이 화면의 "다음"에서. — V0-F02-AC-03, -04, -07, -10
- [ ] **T211** `V0-start-invite`, `V0-start-enter`, `V0-start-found`, `V0-start-connected` — 기존 Invite/Join 화면 V0화. — V0-F02-AC-04~07
- [ ] **T212** 탭 3개 `(tabs)/_layout.tsx` + `(tabs)/anniversaries/index.tsx` 자리(빈 목록·로딩, S3가 채움). — V0-F03-AC-05
- [ ] **T213** `V1HomeScreen`(`V0-home`, `-pending`, `-partner-edited`, 축하 카드 `-today`, `-late`는 일수·주년만) — `features/home/V1HomeScreen.tsx`, `app/(tabs)/home.tsx`(커버 코드 제거), 기존 `MilestoneCard` 대체. 테스트 `features/home/__tests__/V1HomeScreen.test.tsx`. — V0-F03-AC-01~04, V0-F09-AC-01, -03, -05
- [ ] **T214** 상태 `V0-state-loading`, `-error`, `-offline`, `-offline-empty`, `-ended`, `-ended-deleted` — `features/home/states.tsx`, `features/lifecycle/EndedScreen.tsx`. 테스트 `features/home/__tests__/states.test.tsx`. — V0-F13-AC-01~05
- [ ] **T215** 설정 1단계: `V0-set-main`(V1 행 구성, 숨긴 행 제거), `V0-set-start` + `-start-confirm`(사귄 날 이동), 기준 시간대(S13 시트 재사용), `V0-set-me`(이름·생일 편집, `PUT /profile/member`), `V0-set-lang`, `V0-set-mode`, 로그아웃, `V0-set-disconnect`, `V0-set-delete`(기존 흐름 V0 문구). 알림 행은 S5까지 플래그로 숨김. — V0-F12-AC-01~-08, -10
- [ ] **T216** 마지막 V1 데이터 로컬 저장(A-22) — `features/space/v1Cache.ts`, `useSnapshotSync`가 시작 시 읽음. — V0-F13-AC-03, -04

**체크포인트**: 두 시뮬레이터에서 연결 → 홈 D+N, 방·커버 없음, 3탭, 상태 화면이 보드와 같다. TestFlight preview OTA 또는 새 빌드로 두 폰 확인.

---

## S3 — 기념일 모델과 화면 (H03) · V0-F04~F09, F05 설정

- [ ] **T301** [P] 서버: `20261103000400_v1_milestones.sql`(150 허용, 시간대 단일화) + `_shared/milestones.ts` V1 목록 + Deno `milestones.test.ts`·`parity.test.ts` + pgTAP `milestone.test.sql` 확장. — V0-F04-AC-01, V0-DR-02, -03
- [ ] **T302** [P] 서버: `20261103000500_v1_custom_anniversary.sql`(테이블·RLS·RPC·snapshot 생일 공개 규칙) + pgTAP `v1_custom_anniversary.test.sql`. — V0-F05-AC-01, -02, V0-F07-AC-08, -09, -12
- [ ] **T303** 서버: `functions/spaces/index.ts` 기념일 CRUD 경로 + `spaces/__tests__/anniversaries.test.ts`(멱등·충돌·gone·검증). — V0-F07-AC-03, -08~-10, -12
- [ ] **T304** `anniversaries.ts` 완성(생일·시즌·직접·범위·우선순위·늦은 축하·사귄 날 이전 제외) + fixture 120개 이상(윤일·DST·겹침) + Deno에서 같은 fixture. — V0-DR-01~06, V0-EC-01, -05, -08, V0-F08-AC-04
- [ ] **T305** `V0-anniv-list`(+past, today, custom, empty, bwait) — `features/anniversaries/AnniversaryList.tsx`, `app/(tabs)/anniversaries/index.tsx`. — V0-F05-AC-01, -04, V0-F06-AC-01, V0-F08-AC-01~03
- [ ] **T306** 상세 `V0-anniv-detail-years`, `-season`, `-birthday`, `-custom` — `features/anniversaries/AnniversaryDetail.tsx`, 루트 라우트 `app/anniversary/[key].tsx`(탭 밖, 활성 Stack에 등록). — V0-F04-AC-02, V0-F05-AC-03, V0-F06-AC-01, V0-F07-AC-05
- [ ] **T307** 편집 `V0-edit-*` 13개 — `features/anniversaries/AnniversaryEdit.tsx`, `app/anniversary-edit.tsx`(활성 Stack의 full-screen modal). 알림 칸은 S5 전까지 값만 저장(기기 설정 저장소 인터페이스). — V0-F07-AC-01~11
- [ ] **T308** 홈을 전체 엔진으로: 다음 기념일·다가오는 3개에 생일·시즌·직접 포함, 축하 카드 생일·시즌·직접(`-today-season`) + 우선순위 + 이 기기 닫기 기록. — V0-F09-AC-02, -04, -05
- [ ] **T309** `V0-set-me`의 상대 미입력 안내(`set.me.birthday.partnerWait`, snapshot `hasBirthday`)와 목록 "내 생일 넣기" → `V0-set-me` 연결. — V0-F12-AC-02, V0-F05-AC-04

**체크포인트**: 두 계정으로 기념일 추가·편집·충돌·삭제, 생일 공개 규칙, 150일·시즌이 목록·홈에 보드대로.

---

## S4 — iOS 위젯 (H04) · V0-F11

- [ ] **T401** **App Group PoC 먼저**: `expo-widgets` 설치·plugin(`app.config.ts`), extension id `com.jinjinstar.aroom.dev.widgets`, App Group `group.com.jinjinstar.aroom.dev`(`identity.ts` 매개변수), 숫자 하나 쓰기 → small·circular 표시. TestFlight 빌드로 오너 기기 확인. 실패 시 `@bacons/apple-targets` 경로로 전환하고 PR에 이유 기록. — V0-F11-AC-01
- [ ] **T402** [P] `features/widgets/snapshot.ts`(순수: V1 데이터 → 스키마 JSON, 35일 entries, 상태 4종, 개인 정보 규칙) + `__tests__/snapshot.test.ts`(JSON Schema 검증 포함). — V0-F11-AC-05~07, -09, V0-NF-04
- [ ] **T403** `features/widgets/writer.ts`(원자적 쓰기 + reload, 호출 지점: 동기화 성공·변경·포그라운드·로그아웃·종료·탈퇴·언어). — V0-F11-AC-09, V0-F13-AC-05, V0-F12-AC-07, -08, -10
- [ ] **T404** 위젯 레이아웃: systemSmall(기본·다음·모피), systemMedium, systemLarge, accessoryCircular(+gauge), accessoryRectangular, accessoryInline × 외관 — `apps/mobile/widgets/`(expo-widgets) 또는 `targets/widget/`(Swift). 글꼴 번들(A-11). — V0-F11-AC-02, -03, -05, -06, -08
- [ ] **T405** 딥링크와 위젯 갤러리 문구, 기기 체크리스트(quickstart §위젯) 수행 기록. — V0-F11-AC-04, -08

---

## S5 — 로컬 알림 (H05) · V0-F10, F12(알림)

- [ ] **T501** [P] `features/notifications/preferences.ts`(기기 저장, 기본값 D-02) + 테스트.
- [ ] **T502** [P] `features/notifications/plan.ts`(순수: 발생 → 알림 목록, 50개, 공간 시간대 절대 시각, 미리 알림, 종류·기념일별 끄기, 문구 키) + `__tests__/plan.test.ts`(DST·윤일·직접 추가 제목 숨김). — V0-F10-AC-02, -03, -04, V0-NF-04
- [ ] **T503** `features/notifications/scheduler.ts`(diff 예약·취소, 식별자 규칙, 호출 지점) + `__tests__/scheduler.test.ts`(expo-notifications 모킹). — V0-F10-AC-06, -07
- [ ] **T504** `V0-start-notify` 사전 안내 + 권한 요청(연결 완료 뒤 1회) — `features/notifications/PrePromptScreen.tsx`. — V0-F10-AC-01
- [ ] **T505** `V0-set-notify`, `V0-set-notify-denied` + 편집 화면·상세의 기념일별 알림 칸 연결. — V0-F10-AC-04, -05
- [ ] **T506** 기기 체크리스트(quickstart §알림) 수행 기록. — V0-F10-AC-08

---

## S6 — 마무리: i18n·접근성·계정 삭제·스토어 메타·회귀 (H06) · V0-NF, F12

- [ ] **T601** en/ja 전체 화면 넘침 점검(보드 en/ja 프레임 기준), 200% 글자, VoiceOver 라벨, 동작 줄이기. — V0-NF-01, -02
- [ ] **T602** 도움 행: 문의하기(`supportEmail`, null이면 숨김), 개인정보 처리방침·이용약관 URL(`site/`의 정적 페이지 경로를 확인해 연결), 버전. — V0-F12-AC-09
- [ ] **T603** 계정 삭제·연결 끊기·종료 회귀: 위젯 `none/ended`, 알림 0개, 로컬 키·파일 삭제(`v1.invite.*`, `v1.connected.seen.*`, `v1.celebration.seen.*`, `v1.partnerEdited.seen.*`, `v1-notify-*.json`, `v1-cache-*.json`) — 테스트 `features/account/__tests__/delete.test.tsx`, `lifecycle.test.tsx` 확장, `tools/tests/account-deletion.test.mjs` 확인. — V0-F12-AC-07, -08, SC-006
- [ ] **T604** 스토어 메타·개인정보: ASC 앱 개인정보(수집 항목: 이름·생일 월일·사용자 콘텐츠·식별자), 암호화 문답(표준 HTTPS만), TestFlight "테스트할 내용" 문구 초안을 `apps/mobile/README.md`에. 공개 출시는 범위 밖. — V0-F14-AC-06
- [ ] **T605** 회귀: 전체 테스트, 두 시뮬레이터 XCUITest, quickstart 전체 체크리스트, 추적표의 모든 시나리오 ID가 테스트 이름에 있는지 스크립트로 확인(`tools/tests/traceability.test.mjs`). — SC-004
- [ ] **T606** PR 25(design-sync)가 병합되었으면 overlay 문구를 정본 문구 파일로 옮기는 후속 이슈 작성(직접 옮기지 않음). — V0-NF-02
