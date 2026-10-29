# 원격 Supabase 프로젝트 연결과 배포

모든 명령은 **소유자 본인의 터미널**에서 실행한다. 비밀 값은 저장소·PR·채팅에 붙이지 않는다. 앱에는 **publishable(anon) 키와 URL만** 들어가고, service-role 키는 앱·`.env`·EAS 어디에도 넣지 않는다.

## 1. 프로젝트 만들기

Supabase 대시보드에서 개인 계정으로 새 프로젝트를 만든다: 리전 Seoul(`ap-northeast-2`), 무료 플랜. 무료 프로젝트는 일정 기간 활동이 없으면 일시 정지된다. Project Settings → API에서 **Project URL**과 **publishable key**를 확인한다.

## 2. 저장소와 연결하고 스키마 올리기

```bash
npx supabase login                          # 브라우저로 로그인
npx supabase link --project-ref <project-ref>
npx supabase db push                        # supabase/migrations 전부 적용
psql "<대시보드의 Connection string(URI)>" -f supabase/seed/catalog.sql   # 카탈로그 24개, 1회 (db push는 시드를 돌리지 않음)
```

## 3. 서버 비밀 넣기

```bash
npx supabase secrets set INVITE_CODE_PEPPER="$(openssl rand -hex 32)"
npx supabase secrets set ANTHROPIC_API_KEY=<Console API 키>      # 전용 workspace, 지출 한도 설정
# 선택: npx supabase secrets set AI_ESCALATE_TO_SONNET=false
```

`SUPABASE_URL`과 `SUPABASE_SERVICE_ROLE_KEY`는 Edge Function 런타임이 자동으로 넣으므로 따로 설정하지 않는다. `INVITE_CODE_PEPPER`를 바꾸면 발급된 초대 코드가 모두 무효가 된다.

## 4. 함수 배포와 정리 작업 예약

```bash
npx supabase functions deploy               # 8개 함수 (supabase/config.toml의 import_map 설정을 함께 씀)
```

`lifecycle-sweep`은 하루 1회 이상 불러야 한다. 대시보드 Integrations → Cron(pg_cron)에서 HTTP 요청 작업을 만들고, `POST https://<project-ref>.supabase.co/functions/v1/lifecycle-sweep`에 `Authorization: Bearer <service-role 키>` 헤더를 단다(이 키는 대시보드 안의 작업 설정에만 둔다).

점유 만료 처리(`public.expire_stale_sessions()`)는 1분마다 불러야 한다. 이 함수는 시간이 지난 점유를 `expired`로 바꾸고 상대 화면에 `session` 이벤트를 보내서, 앱이 꺼진 점유자 때문에 상대가 "이어서 꾸미기"를 늦게 보지 않게 한다. 마이그레이션은 함수만 만들고 일정은 만들지 않으므로 오너가 한 번 예약한다(대시보드 Integrations → Cron의 SQL 작업, 또는 SQL 편집기):

```sql
select cron.schedule('expire-prompt-sessions', '* * * * *', $$select public.expire_stale_sessions()$$);
```

이 작업을 예약하지 않아도 앱은 동작한다. 점유 관련 API가 호출될 때와 스냅샷을 읽을 때 만료가 반영되지만, 만료 이벤트는 다음 호출까지 늦어진다.

## 5. 인증 공급자

Apple 설정은 `docs/apple-sign-in-setup.md`. 카카오는 지금 비활성이라 설정하지 않아도 된다.

## 6. 앱을 원격 프로젝트에 연결

앱은 빌드 때 `EXPO_PUBLIC_SUPABASE_URL`과 `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`를 읽는다(공개 값이지만 저장소에는 커밋하지 않는다).

- **로컬 개발 서버**(`npx expo start --dev-client`): `apps/mobile/.env.local` 파일을 만들어 두 값을 적는다. `.env*`는 git에서 무시되고 `.env.example`만 추적된다.
- **EAS 빌드**: 빌드 프로필이 `development`/`preview`/`production` 환경을 쓰도록 `eas.json`에 정해 두었다. 환경별로 값을 넣는다.

```bash
cd apps/mobile
eas env:create --environment development --name EXPO_PUBLIC_SUPABASE_URL --value https://<project-ref>.supabase.co --visibility plaintext
eas env:create --environment development --name EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY --value <publishable key> --visibility plaintext
# preview·production도 같은 방식 (운영 프로젝트를 따로 만들면 그 값으로)
```

## 7. 확인

1. 개발 빌드를 설치하고 Apple로 로그인 → 공간 만들기 → 초대 코드 발급.
2. 두 번째 기기(다른 Apple ID 또는 개발 빌드의 이메일 테스트 로그인)로 코드 입력 → 두 화면의 D-day가 같은지 확인.
3. 두 사람 모두 AI 동의 → 한 명이 꾸미기 시작 → 미리 보기 → 적용 → 두 화면의 방이 같은지 확인. 상대 화면은 읽기 전용이어야 한다.
