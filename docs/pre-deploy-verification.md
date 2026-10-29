# Aroom-prod 배포 전 로컬 스택 검증 (2026-10-29)

PR #15(점유 리스), #16(설정·방 모드), #17(기념일 축하), #18(홈 배경 사진), #19(계정 삭제)는 "서버를 띄우지 말고 코드 검사만" 규칙으로 만들어져 SQL·Deno·실제 시나리오는 CI에서만 돌았다. 소유자가 허락한 1회 로컬 검증을 이 문서에 남긴다. **로컬 스택만 썼고 Aroom-prod에는 아무것도 하지 않았다**(link·db push·functions deploy·secrets·원격 SQL 없음).

환경: OrbStack, supabase CLI 2.122.0(`supabase start`, edge-runtime 1.77.8), deno 2.9.6, node 24, pnpm 10.18.2.

## 1. 결과 요약

- CI와 같은 전체 스위트는 처음부터 모두 통과했다.
- 그런데 함수를 **Edge Runtime에서 실제로 띄우니 두 함수가 부팅조차 못 했다**(아래 3장). CI는 Deno 테스트에서 핸들러를 직접 import해서 부르기만 하고 런타임에서 함수를 띄우지 않아서 둘 다 놓쳤다. 이 상태로 배포했다면 홈 배경 사진 기능 전체와 매일 정리 작업(계정 삭제 재개 포함)이 500이었다.
- 두 결함을 고친 뒤 HTTP 시나리오 23개 중 22개가 통과했고, 1개는 출시된 일수 목록으로는 실제로 일어날 수 없는 조합이라 실행할 수 없었다(단위 테스트로 대신 확인).

## 2. 전체 스위트 (로컬 스택)

| 검사 | 명령 | 결과 |
|---|---|---|
| 마이그레이션 처음부터 적용 | `supabase db reset` | 18개가 순서대로 깨끗하게 적용, 시드 2개 적용 |
| pgTAP | `supabase test db` | 20 files, 285 tests, PASS |
| Edge Function 테스트 | `deno test -A supabase/functions` | 107 passed, 0 failed (수정 전·후 모두) |
| 모바일 | `pnpm --filter mobile test` | 49 suites, 268 tests passed |
| scene-contract | `pnpm --filter @couple/scene-contract test` | 5 files, 29 tests passed |
| lint / typecheck | `pnpm lint`, `pnpm typecheck` | 통과 |
| 동시성 쿼터 | `node --test tools/tests/quota-concurrency.test.mjs` | pass 1 |
| 프롬프트 픽스처 | `deno run -A tools/ai/eval-fixtures.mjs` | 통과 |
| 스키마·마이그레이션 규칙 | `node tools/ci/check-schemas.mjs`, `node tools/ci/check-migrations.mjs` | 통과 |
| node 테스트 | `node --test assets/catalog/__tests__/manifest.test.mjs tools/tests/font-glyphs.test.mjs tools/tests/account-deletion.test.mjs` | pass 22 |
| 함수 부팅(새로 추가) | `node tools/ci/check-functions-boot.mjs` | 수정 전: home-cover·lifecycle-sweep 500 `WORKER_ERROR`. 수정 후: 통과(약 4초). 단, 이 실행은 인증 헤더 없이 불러서 `verify_jwt = true`인 9개 함수는 게이트웨이 401에서 멈췄고 실제로 부팅을 확인한 것은 `verify_jwt = false`인 3개뿐이다. 스크립트는 이후 로컬 anon 키를 붙이도록 고쳤고, 12개 전체 재실행은 CI에서 확인한다 |

## 3. 찾아서 고친 결함

### 3.1 home-cover가 Edge Runtime에서 부팅하지 못함 (P0)

- 증상: `supabase functions serve`에서 `home-cover`의 모든 요청(업로드 URL·조회·확정)이 500 `WORKER_ERROR`. 로그: `Error: unsupported arch/platform: Not supported at …/imagescript/1.3.1/codecs/node/index.js`.
- 원인: `npm:imagescript@1.3.1`의 진입점이 네이티브 `.node` 애드온을 불러온다. Edge Runtime은 네이티브 애드온을 지원하지 않는다. 로컬 `deno test`에서는 macOS용 바이너리가 그대로 로드돼서 통과했다.
- 수정: 같은 라이브러리의 Deno 빌드(`https://deno.land/x/imagescript@1.3.0/mod.ts`, wasm만 씀)로 import를 바꿨다. `deno.lock`에 원격 모듈 해시를 고정했다. API(`Image.decode`, `crop`, `encodeJPEG`)는 같다.
- 참고: 이 빌드는 콜드 스타트 때 모듈 평가 중에 wasm 파일을 `deno.land`에서 받는다. 콜드 스타트 첫 요청은 약 2~3.7초였다(아래 5장). `deno.lock`은 `.js` 모듈만 고정하고 받아 오는 wasm 바이트는 고정·검증하지 않으므로, `deno.land`가 느리거나 내려가면 `home-cover` 전체(업로드 URL·조회·확정)가 부팅하지 못한다. 출시 전 미해결 항목으로 `docs/owner-tasks.md` D와 `docs/remote-supabase-setup.md` 4장에 남겼다.

### 3.2 lifecycle-sweep이 Edge Runtime에서 모듈 평가 중 멈춤 (P0)

- 증상: `POST /functions/v1/lifecycle-sweep`가 항상 500. 로그: `Top-level await promise never resolved at lifecycle-sweep/index.ts:134`.
- 원인: `lifecycle-sweep/index.ts`가 진입점에서 top-level await로 `account/ports.ts`를 불러오는데, `ports.ts`는 `bucketStorage`를 받으려고 다시 `lifecycle-sweep/index.ts`를 import한다. 아직 평가 중인 모듈을 기다리는 순환이라 영원히 끝나지 않는다. 테스트는 이 파일을 진입점으로 실행하지 않아서 드러나지 않았다.
- 영향: 매일 정리(프롬프트 데이터 정리, 종료 30일 뒤 공간 삭제, 이전 커버 객체·만료 업로드 정리)와 **중간에 멈춘 계정 삭제의 재개**가 전부 동작하지 않는다.
- 수정: `SpaceStorage`·`HOME_COVER_BUCKET`·`bucketStorage`를 `supabase/functions/_shared/spaceStorage.ts`로 옮기고 `account/ports.ts`·`account/runner.ts`가 거기서 가져온다. `lifecycle-sweep/index.ts`는 기존 export를 그대로 다시 내보낸다(동작 변화 없음).

### 3.3 재발 방지

- `tools/ci/check-functions-boot.mjs`를 추가하고 CI의 `deno test` 다음 단계에 넣었다. `supabase functions serve`로 `supabase/functions`의 모든 함수를 띄우고 없는 경로를 로컬 anon 키(`supabase status -o json`의 `ANON_KEY`)를 붙여 한 번씩 불러서, 부팅된 함수의 4xx와 부팅 실패의 5xx를 구분한다. 키가 없으면 `verify_jwt = true` 함수는 워커를 만들기 전에 게이트웨이가 401로 답해서 부팅 여부를 알 수 없다. 수정 전 코드에서 두 함수를 잡고 수정 뒤에는 통과하는 것을 확인했다.
- `docs/remote-supabase-setup.md`의 "8개 함수"를 실제 개수인 12개로 고쳤다.

## 4. 시나리오별 결과 (HTTP, `supabase functions serve` 경유)

스크립트는 저장소 밖(firstmate `data/cpl-predeploy/scenarios/run.ts`)에 두었다. 앱이 쓰는 경로 그대로 HTTP로 부르고, 확인은 서비스 키 조회·`psql`로 했다. 날짜가 걸린 기념일 시나리오는 로컬 DB의 `public.app_now()`를 고정 시각으로 바꿔 돌린 뒤 `now()`로 되돌렸다. "단위/pgTAP"은 이번 실행에서 같은 로컬 스택으로 통과한 테스트를 뜻한다.

### 계정 삭제 (#19)

| 시나리오 | 결과 | 근거 |
|---|---|---|
| 재인증 불일치 거부: 이메일 계정이 apple/kakao로 재인증 주장 → 401 `REAUTH_REQUIRED`, `confirm` 없음·모르는 공급자 → 400, 아무것도 안 바뀜 | pass | 각 401/400, `account_deletion` 행 0, 스냅샷 200 유지 |
| 오래된 로그인(5분 초과) 거부 | pass (단위) | 시계를 주입하는 Deno 테스트 ①. HTTP로는 토큰 나이를 조작할 수 없음 |
| Apple 비밀 없음: Apple 계정 삭제 요청 → 503 `PROVIDER_NOT_CONFIGURED`, 삭제 시작 안 함 | pass | 토큰 `app_metadata.provider=apple`, 503, `account_deletion` 0행, auth 사용자 유지 |
| 202 엔드포인트와 러너 순서: Storage purge → 공간 행 purge → `space_ended` → `provider_revoked` → 프로필 삭제(finish) → auth 사용자 삭제 → `auth_deleted` → `done` | pass | `POST /account/deletion` 202 `{"state":"requested"}` 68ms. 임시 트리거 기록: `storage.objects:DELETE > couple_space:DELETE > …space_ended > …provider_revoked > … > user_profile:DELETE > auth.users:DELETE > …auth_deleted > …done` |
| 파트너 안내: 이름·id 없이 `ended.kind=account_deleted`, `by=partner`, 기간·복구 정보 없음 | pass | `/spaces/mine` 응답에 삭제자 id 없음. 앱 문구(ko/en/ja `acct.delete.*`, `end.byPartnerDeleted`)에도 기간·복구·유예 표현 없음("되돌릴 수 없어요"만) |
| 삭제된 사용자의 이전 토큰 거부 | pass | 401 |
| 삭제 중 계정의 create_space / accept_invitation 거부 | pass | HTTP 둘 다 401(토큰 단계 차단), `create_space` RPC 직접 호출 → `ACCOUNT_DELETING` |
| 늦게 생긴 공간: 첫 purge 뒤에 커밋된 공간을 `provider_revoked` 단계에서 다시 purge하고 끝까지 완료 | pass | 공간을 직접 넣고 상태를 `space_ended`로 둔 뒤 `lifecycle-sweep` 호출 → 공간 0행, 상태 `done`, auth 사용자 없음 (수정 전에는 sweep 500으로 실패) |
| 운영자 경로는 service-role 키만 | pass | 사용자 토큰 401, 서비스 키 202 |
| 다른 계정으로 실제 Apple/Kakao 재인증 시 로그아웃 | 기기 필요 | 실제 Apple 로그인 필요 |
| 앱 화면(체크 전 비활성, 재인증, "계정이 삭제되었어요") | 기기 필요 | jest만 통과 |

### 홈 배경 사진 (#18)

| 시나리오 | 결과 | 근거 |
|---|---|---|
| 업로드 URL → 서명 PUT → 확정 → 파트너 조회 | pass | 201 → 204 → 200 v1. 파트너 서명 URL GET 200 `image/jpeg` 1200x1200, 원본 EXIF(Artist) 제거됨 |
| 교체 시 version 증가, 이전 객체는 24시간 뒤 삭제 큐 | pass | v4, 큐 3개, `deleteAfter` = 확정 + 24h. 지금 sweep → 이전 객체 유지. `deleteAfter`를 과거로 옮긴 뒤 sweep → 이전 객체 삭제, 현재 객체 유지, 큐 비움 |
| 변조된 signature·space·user·expires → `NOT_FOUND` | pass | 4가지 모두 404 `NOT_FOUND`, 원래 URL은 204 |
| 만료된 URL | pass | 같은 HMAC로 정상 서명하되 과거 `expires` → 404 `NOT_FOUND` |
| 크기: 20MB+1 → `COVER_TOO_LARGE`, 선언보다 긴 본문 → `COVER_TOO_LARGE`, 짧은 본문 → `COVER_INVALID_IMAGE` | pass | 각 코드 확인 |
| 포맷: `image/gif` → `COVER_FORMAT_UNSUPPORTED`, 발급과 다른 Content-Type → `COVER_FORMAT_UNSUPPORTED`, JPEG로 선언한 PNG 바이트 → `COVER_INVALID_IMAGE`, HEIC 그대로 → 확정에서 `COVER_INVALID_IMAGE`(앱이 JPEG로 바꿔 올림), 4.2MP JPEG → `COVER_INVALID_IMAGE`, 정상 PNG → 200 | pass | 실패한 요청은 version을 올리지 않음 |
| crop: 범위 밖·음수·필드 누락 → `INVALID_REQUEST`, 정사각형 아님 → `COVER_INVALID_IMAGE`, 커버 그대로 | pass | version 그대로 |
| 비멤버: REST로 `home_cover_photo`·`home_cover_upload` 0행, Storage 직접 읽기 거부, 함수 조회·발급 404 | pass | REST 200·0행(멤버는 같은 쿼리에 1행), Storage 직접 읽기 비멤버 400·멤버 200, 함수 404 `NOT_FOUND` |
| `commit_home_cover` 등 커버 RPC를 authenticated 키로 직접 호출 불가 | pass | `commit_home_cover`·`create_home_cover_upload`·`remove_home_cover`·`get_home_cover`·`due_home_cover_deletes` 모두 403 `42501 permission denied` |
| 커버 정리 실패가 공간 purge를 막지 않음 | pass | `due_home_cover_deletes` 실행 권한을 잠시 빼고 sweep → 200, `purged≥1`, 공간 행·객체 삭제. 권한은 바로 되돌림 |
| HEIC 실기기 변환, 홈 시트·오프라인 비활성·파트너 알림 | 기기 필요 | |

### 기념일 축하 (#17)

| 시나리오 | 결과 | 근거 |
|---|---|---|
| 방 시간대 자정: 서울 10-28 23:59:59 카드 없음, 10-29 00:00 50일 카드(daysAgo 0, presetAvailable true). 같은 순간 LA는 없음, LA 자정에 생김 | pass | DB 시계 고정 후 `GET milestones/current` |
| 7일 catch-up: 6일째 daysAgo 6, 7일째 사라짐 | pass | 동일 |
| 2/29 기념일: 평년 2/27 없음·2/28 3주년, 윤년 2/28 없음·2/29 4주년 | pass | 동일 |
| 커플당 기록 1건, 멤버별 seen 독립 | pass | `milestone_celebration` 1행. A가 home으로 seen 204 → A `seenByMe=true`, B `false` |
| 적대적 seen: `via:'chat'` 400, 외부인 404, 다른 공간 id는 아무것도 기록 안 함, `mark_milestone_seen`·`update_anniversary` 직접 RPC 거부 | pass | 다른 공간의 축하 id는 204지만 행이 생기지 않는 무시 동작(데이터 변화 없음) |
| 기념일과 일수 마일스톤 겹침 | 실행 불가 | 출시된 일수 목록(50/100/200/300/500/1000)으로는 어떤 날짜도 기념일과 7일 안에 겹치지 않는다. 우선순위는 단위 테스트 "anniversary takes priority over a day mark on the same date"로 통과 |
| 오프라인 닫기 큐, 홈 카드·방 버블·프리셋 버튼 화면 | 기기 필요 | jest만 통과 |

### 설정·방 모드 (#16)

| 시나리오 | 결과 | 근거 |
|---|---|---|
| 방 모드 변경: version 계약, 같은 Idempotency-Key 재전송은 같은 응답, 오래된 version → `VERSION_CONFLICT`, 잘못된 시간대 → 400, 외부인 → 404, 파트너 스냅샷에 반영 | pass | 첫 요청 200, 재전송 동일 본문, 409/400/404, 파트너 `mode=night tz=America/Los_Angeles` |
| 파트너가 점유 중이면 `SESSION_OCCUPIED`, 해제 뒤 성공 | pass | 409 → release 204 → 200 |
| 낮/밤 06–18 경계·LA 서머타임, 이 기기 설정, 큰 글씨 잘림, 고대비 | 기기 필요 / 단위 | jest `followTime.test.ts` 등 통과 |

### 점유 리스 (#15, 실시간 리뷰 B.3/B.5)

| 시나리오 | 결과 | 근거 |
|---|---|---|
| `SESSION_OCCUPIED`에 sessionId 포함 (B1) | pass | 오류의 sessionId = 점유 세션 |
| 닫을 때 미리 보기가 없으면 해제 → 파트너가 바로 시작 (D2) | pass | release 204, 파트너 acquire 201 |
| 만료 후 스냅샷이 `status:'expired'`를 보여 줌 | pass | `expire_stale_sessions()` 1 → 파트너 스냅샷 `expired` |
| 만료 후 원래 점유자가 시작 → 같은 세션 되살림, 미리 보기 유지 (B3) | pass | 같은 sessionId, 대화에 `previewed` 유지 |
| 만료 후 파트너가 시작 → 같은 세션 이어받기 (B3) | pass | 같은 sessionId, owner=B |
| `store_preview`가 리스 연장 (B2) | pass (pgTAP) | `prompt_lease.test.sql` "store_preview extends the lease by a full idle window". HTTP로는 AI 키 없이 `store_preview` 경로를 탈 수 없음. 참고: 기념일 프리셋 미리 보기(`store_milestone_preset`)는 리스를 연장하지 않는다. 즉시 끝나는 경로라 리스가 막 살아 있는 상태이고 미리 보기를 보는 동안은 클라이언트 heartbeat(D1)가 유지하므로 결함으로 보지 않았다 |
| 같은 키 동시 요청 1회 처리 (B7) | pass (Deno) | "an atomic store claims the key before the work: overlapping calls get IN_PROGRESS" |
| 두 기기 실시간 화면(지켜보기, 토스트, 시계 보정) | 기기 필요 | jest만 통과 |

## 5. Edge Function 실측 (로컬)

| 항목 | 값 |
|---|---|
| home-cover 확정(재인코딩 포함), 1600x1200 JPEG → 1200x1200 | HTTP 137~187ms (warm) |
| home-cover 확정, 1600x1600 JPEG → 1600x1600 | HTTP 200ms (warm) |
| 재인코딩 CPU 시간 (같은 `image.ts`를 deno로 3회) | 1600x1200: 230~261ms, 1600x1600: 273~323ms |
| 재인코딩 메모리 증가 (같은 측정) | RSS +54~57MiB(1600x1200), +67~68MiB(1600x1600) |
| edge-runtime 컨테이너 전체 메모리 | 138.5MiB → 227.3MiB, peak 246.9MiB (여러 함수 워커 합계) |
| home-cover 콜드 스타트 첫 요청 | 2.0~3.7초 (wasm을 `deno.land`에서 받는 시간 포함) |
| 로컬 런타임 경고 | 확정 여러 번 뒤 home-cover isolate에서 "CPU time soft limit reached" 2회. 실패한 요청은 없고 isolate가 교체됨 |

측정 기기는 Apple Silicon 노트북이다. Supabase 원격의 CPU는 더 느릴 수 있으니 개발용 원격 프로젝트에서 12MP 사진(앱이 긴 변 1600px로 줄인 것)으로 확정이 성공하는지 한 번 더 본다(`docs/owner-tasks.md` D).

## 6. Aroom-prod 배포 순서

이 문서의 PR이 머지된 뒤에만 진행한다. 아래는 소유자 본인 터미널에서 실행한다(`docs/remote-supabase-setup.md`).

1. `npx supabase db push` — 아직 안 올라간 마이그레이션이 순서대로 적용된다. 이번 다섯 PR과 그 앞 단계에서 새로 생긴 것:
   1. `20261101000750_lifecycle_report.sql` (C, 아직 안 올렸다면)
   2. `20261102000100_prompt_lease_revive.sql` (#15)
   3. `20261102000150_generation_limits.sql` (#15)
   4. `20261102000300_room_mode.sql` (#16)
   5. `20261102000500_home_cover.sql` (#18, 비공개 `home-cover` 버킷 생성)
   6. `20261102000700_milestones.sql` (#17)
   7. `20261102000900_account_deletion.sql` (#19)
   원격이 처음이라면 `20261101000100_base_schema.sql`부터 18개 전부가 적용되고, 그 뒤 카탈로그 시드를 1회 넣는다.
2. 비밀(`npx supabase secrets set …`, 값은 어디에도 붙이지 않는다):
   - 필수: `INVITE_CODE_PEPPER`, `ANTHROPIC_API_KEY`(없으면 생성 기능은 꺼진 상태로 동작).
   - **아직 없음**: `APPLE_TEAM_ID`, `APPLE_KEY_ID`, `APPLE_PRIVATE_KEY`, `APPLE_CLIENT_ID`. 없으면 Apple 계정 삭제가 503 `PROVIDER_NOT_CONFIGURED`로 거부되고 아무것도 지워지지 않는다(이번에 확인). Apple 로그인만 여는 계획이라 출시 전 필수다.
   - 선택: `ACCOUNT_CREDENTIAL_KEY`(없으면 service-role 키에서 파생), `AI_ESCALATE_TO_SONNET`. 카카오(`KAKAO_UNLINK_ENABLED`, `KAKAO_ADMIN_KEY`)는 보류 중이라 넣지 않는다.
3. `npx supabase functions deploy` — 마이그레이션 뒤에 12개 모두: `account`, `ai-consent`, `decoration-previews`, `home-cover`, `invitations`, `lifecycle-sweep`, `milestones`, `profile`, `prompt-session`, `reports`, `room`, `spaces`. 이번 수정이 들어간 `home-cover`·`lifecycle-sweep`·`account`가 빠지면 안 된다.
4. 배포 직후 확인: `POST …/functions/v1/lifecycle-sweep`(service-role 키)를 한 번 불러 200과 `purged`·`failed`를 본다. `GET …/functions/v1/home-cover/x`가 5xx가 아니라 401인지 본다.
5. 예약: `expire_stale_sessions()`는 1분마다(`docs/remote-supabase-setup.md` 4장). `lifecycle-sweep` 하루 1회 예약은 소유자 결정대로 출시 전까지 보류(Vault 키 + pg_cron 방식).
6. 앱: `expo-image-manipulator`가 들어가서 새 개발 빌드가 필요하다(`eas build --profile development --platform ios`).
