# 원격 Supabase 프로젝트: Aroom-dev와 Aroom-prod

호스팅 프로젝트는 둘이고 같은 조직(`jinjinstar4 Org`, 무료 플랜)에 있다. 무료 프로젝트는 일정 기간 활동이 없으면 일시 정지된다. ref는 공개 설정이라 `apps/mobile/src/config/supabase.ts`에 있다.

| 프로젝트 | ref | 리전 | 쓰는 곳 | 액세스 토큰 파일 |
|---|---|---|---|---|
| Aroom-dev | `opwtvlqpkrwgbjbmkqcw` | Sydney (`ap-southeast-2`) | development·preview 빌드(TestFlight 포함), preview 채널 OTA | `~/.config/aroom/supabase-dev.env` |
| Aroom-prod | `mhyctlxweuwznenrdsrl` | Seoul (`ap-northeast-2`) | production 빌드(App Store)와 production으로 promote된 OTA 번들 | `~/.config/aroom/supabase.env` |

비밀 값은 저장소·PR·채팅에 붙이지 않는다. 앱에는 **publishable(anon) 키와 URL만** 들어가고, service-role 키는 앱·`.env`·EAS 어디에도 넣지 않는다. 운영 비밀 값과 운영 데이터는 dev로 복사하지 않는다.

## 1. 대상 정하기

원격 명령은 대상을 적어서 `tools/supabase/remote.mjs`로만 실행한다.

```bash
node tools/supabase/remote.mjs dev db push
node tools/supabase/remote.mjs prod functions deploy account   # prod는 ref를 입력해야 실행된다
```

- 스크립트는 대상의 토큰 파일에서 `SUPABASE_ACCESS_TOKEN`만 읽고, 모든 명령에 `--remote=<ref>`를 붙인다. `supabase link`로 저장된 프로젝트(`supabase/.temp`)는 대상을 정하지 않는다. 비대화형으로 prod를 실행할 때만 `AROOM_CONFIRM_PROD=mhyctlxweuwznenrdsrl`을 준다.
- 토큰은 프로젝트 하나로 범위를 좁힌 Supabase 액세스 토큰이다(Account → Access Tokens → Generate new token → Resource access: Project). dev 토큰은 Aroom-dev만, prod 토큰은 Aroom-prod만 볼 수 있어서 짝이 틀리면 권한 오류로 끝나고 아무것도 바뀌지 않는다. dev 토큰 `Aroom-dev-access-token`은 조직 설정·멤버·애드온·브랜치 권한 없이 만들었다.
- 파일 형식은 `SUPABASE_ACCESS_TOKEN=sbp_…` 한 줄이고 권한은 `600`이다. CLI 3은 토큰으로 임시 로그인 역할을 만들어 DB에 붙으므로 DB 비밀번호는 필요 없다.
- Supabase CLI 3부터 `db push`·`db query`는 로컬이 기본이다. 대상 없이 `npx supabase db push`를 실행하면 원격에 닿지 않는다.

## 2. 스키마와 시드

```bash
node tools/supabase/remote.mjs dev db push                                  # supabase/migrations 전부
node tools/supabase/remote.mjs dev db query -f supabase/seed/catalog.sql    # 카탈로그 24개 (upsert라 다시 실행해도 된다)
```

`db push`는 시드를 돌리지 않는다. `supabase/seed.sql`은 로컬 전용(빠른 로그인 계정과 고정 비밀번호)이라 원격에 넣지 않고, `--include-seed`도 쓰지 않는다.

## 3. 서버 비밀

`SUPABASE_URL`과 `SUPABASE_SERVICE_ROLE_KEY`는 Edge Function 런타임이 넣는다. 나머지는 프로젝트마다 따로 정한다.

```bash
node tools/supabase/remote.mjs dev secrets set INVITE_CODE_PEPPER="$(openssl rand -hex 32)"
```

| 비밀 | Aroom-prod | Aroom-dev |
|---|---|---|
| `INVITE_CODE_PEPPER` | 운영 값 | 따로 만든 값(2026-11-09). 바꾸면 그 프로젝트의 초대 코드가 모두 무효가 된다 |
| `APPLE_TEAM_ID` | `43ZASDF2J7` | 같은 값(공개 ID) |
| `APPLE_CLIENT_ID` | 운영 번들 ID | `.dev` 번들 ID |
| `APPLE_KEY_ID`, `APPLE_PRIVATE_KEY` | 있음 | 없음. dev에서 Apple 계정 삭제는 `503 PROVIDER_NOT_CONFIGURED`로 거절된다. dev 전용 Sign in with Apple 키(`.p8`)를 만들면 넣는다 |
| `ANTHROPIC_API_KEY` | 있음 | 2026-10-27에 넣은 값이 운영 키와 같다. dev 전용 Console 키로 바꾸거나 지울지는 소유자가 정한다(V0에서는 AI 기능이 숨겨져 있다) |

## 4. 함수 배포

```bash
node tools/supabase/remote.mjs dev functions deploy   # 13개 함수 (supabase/config.toml의 import_map·verify_jwt 설정을 함께 씀)
```

**출시 전 미해결: `home-cover`의 wasm 런타임 다운로드.** `home-cover`가 쓰는 `https://deno.land/x/imagescript@1.3.0/mod.ts`는 콜드 스타트마다 모듈 평가 중에 코덱 wasm 파일을 `deno.land`에서 `fetch`로 받는다. `deno.lock`은 `.js` 모듈만 고정하고 이 wasm 바이트는 고정하지도 무결성을 검사하지도 않는다. 그래서 `deno.land`가 느리거나 내려가면 `home-cover` 전체(업로드 URL·조회·확정)가 부팅하지 못하고, 실행되는 코드가 검증 없이 바뀔 수 있다. 해결 방법은 둘 중 하나이고 둘 다 새 벤더링 산출물이 생기므로 소유자 승인 뒤에 한다: (1) wasm 파일을 함수 옆에 벤더링하고 `file:` URL로 불러오기, (2) wasm을 패키지 안에 묶어 둔 다른 코덱으로 바꾸기.

## 5. 예약 작업

두 프로젝트에 같은 pg_cron 작업 두 개가 있다(Aroom-dev는 2026-11-09에 만들었다). 마이그레이션은 함수만 만들고 일정은 만들지 않으므로 새 프로젝트에서는 SQL 편집기에서 한 번 만든다.

- `expire-prompt-sessions`(1분마다): `public.expire_stale_sessions()`가 시간이 지난 점유를 `expired`로 바꾸고 상대 화면에 `session` 이벤트를 보낸다. 없어도 앱은 동작하지만 만료 이벤트가 다음 호출까지 늦어진다.
- `lifecycle-sweep-daily`(매일 18:00 UTC): `lifecycle-sweep`을 부른다. 공간 종료 30일 뒤 완전 삭제도 이 함수가 한다.

```sql
create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net;
select vault.create_secret('<함수가 SUPABASE_SERVICE_ROLE_KEY로 받는 키>', 'lifecycle_sweep_service_role_key', 'Service-role key for the daily lifecycle-sweep cron job');
select cron.schedule('expire-prompt-sessions', '* * * * *', $$select public.expire_stale_sessions()$$);
select cron.schedule('lifecycle-sweep-daily', '0 18 * * *', $$select net.http_post(url := 'https://<ref>.supabase.co/functions/v1/lifecycle-sweep', headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'lifecycle_sweep_service_role_key')), body := '{}'::jsonb, timeout_milliseconds := 60000) as request_id$$);
```

키는 Vault에만 둔다. `lifecycle-sweep`은 `Authorization`이 런타임의 `SUPABASE_SERVICE_ROLE_KEY`와 정확히 같아야 받는다. Aroom-dev에서는 그 값이 legacy JWT가 아니라 기본 secret 키(`sb_secret_…`)라서, 다른 키를 넣으면 401이 난다. 넣은 뒤에는 작업을 한 번 돌려 `net._http_response`의 상태가 200인지 본다.

## 6. 인증

두 프로젝트의 Authentication 설정은 Apple Client IDs만 빼고 같다.

- Email 공급자 켬, Confirm email 켬, "Allow new users to sign up" 켬(끄면 새 Apple 계정도 막힌다).
- Password: 최소 8자, Letters and digits. 이메일과 다른지는 `auth-password` 함수가 검사한다.
- Apple 켬, Secret Key 비움(네이티브 전용). Client IDs: Aroom-dev는 `.dev` 번들 ID만, Aroom-prod는 `.dev`와 운영 번들 ID 둘 다.
- Redirect URLs와 SMTP는 둘 다 비어 있다. 메일을 연결할 때 Aroom-dev에는 `aroom-dev://auth-callback`, Aroom-prod에는 `aroom://auth-callback`을 더한다(`docs/password-auth-operations.md`).

Apple 설정 절차는 `docs/apple-sign-in-setup.md`. 카카오는 지금 비활성이라 설정하지 않아도 된다.

## 7. 앱을 원격 프로젝트에 연결

앱은 빌드 때 `EXPO_PUBLIC_SUPABASE_*`를 읽는다(공개 값이지만 저장소에는 커밋하지 않는다). 키는 프로젝트의 legacy `anon` 키다.

| EAS 환경 | 쓰는 빌드 | `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `EXPO_PUBLIC_SUPABASE_PROD_URL`, `EXPO_PUBLIC_SUPABASE_PROD_PUBLISHABLE_KEY` |
|---|---|---|---|
| development | `development`, `development-simulator` | Aroom-dev | 없음 |
| preview | `preview`, `testflight`, preview 채널 OTA | Aroom-dev | Aroom-prod |
| production | `production` | Aroom-prod | 없음 |

preview에 Aroom-prod 값이 함께 있는 이유: OTA는 preview에서 확인한 번들을 그대로 production에 promote한다(`docs/ota.md`). 그래서 **어느 프로젝트를 쓸지는 번들이 아니라 네이티브 번들 ID가 정한다**(`src/config/supabase.ts`). App Store 바이너리는 언제나 Aroom-prod 값을 쓰고, 그 값이 없는 번들이면 시작하지 않는다(Hot Updater가 그 번들을 crash로 기록하고 이전 번들로 돌아간다). `.dev` 바이너리는 번들의 기본 값을 쓴다. 이중 안전장치도 있다. `hot-updater.config.ts`는 Aroom-prod 값이 없는 preview·production 번들을 거부하고, `app.config.ts`는 EAS production 빌드에 Aroom-prod가 아닌 값이 들어오면 빌드를 멈춘다.

preview가 Aroom-dev로 바뀐 뒤로, TestFlight(`.dev`) 테스터는 다음 preview 빌드나 OTA를 받는 순간부터 빈 Aroom-dev를 쓴다. Aroom-prod에 만든 계정과 공간은 그 앱에서 보이지 않는다.

```bash
cd apps/mobile
eas env:list --environment preview --format long
eas env:update --variable-name EXPO_PUBLIC_SUPABASE_URL --variable-environment preview --value https://<ref>.supabase.co --non-interactive
```

로컬 개발 서버(`npx expo start --dev-client`)는 `apps/mobile/.env.local`을 읽는다. `eas env:pull --environment development`로 Aroom-dev 값을 받거나 로컬 스택 값을 직접 적는다. `.env*`는 git에서 무시되고 `.env.example`만 추적된다.

## 8. 확인

1. 개발 빌드(시뮬레이터는 `development-simulator`)를 설치하고 Aroom-dev로 로그인 → 공간 만들기 → 초대 코드 발급. 행이 Aroom-dev에만 생기는지 대시보드에서 본다.
2. 두 번째 기기(다른 Apple ID 또는 개발 빌드의 이메일 테스트 로그인)로 코드 입력 → 두 화면의 D-day가 같은지 확인.
3. 두 사람 모두 AI 동의 → 한 명이 꾸미기 시작 → 미리 보기 → 적용 → 두 화면의 방이 같은지 확인. 상대 화면은 읽기 전용이어야 한다.
