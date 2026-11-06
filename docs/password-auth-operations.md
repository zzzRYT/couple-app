# 이메일·비밀번호 로그인 운영

대상: V0-F15~F18(디자인 V0-08, V0-09, 아티팩트 `1793952106-add4`). 이 문서의 어떤 단계도 아직 운영에 실행하지 않았다. 코드 쪽 결정은 `specs/002-couple-dday-v0/handoffs/H07-password-auth.md`.

## 배포에 필요한 것

순서를 지킨다. 함수가 먼저 올라가면 표가 없어서 실패한다.

1. `supabase db push` — `20261106000100_v0_password_auth.sql`. 트리거 때문에 이 순간부터 이메일 계정은 `review_login_email` 주소만 만들 수 있다. Apple 로그인은 영향이 없다.
2. `supabase functions deploy auth-password --no-verify-jwt` 와 `supabase functions deploy account`. `auth-password`는 로그인 전 경로가 있어 `verify_jwt = false`다.
3. Supabase Dashboard → Authentication:
   - Sign In / Providers → **Email** 켬. 꺼져 있으면 비밀번호 로그인 전체가 막힌다(`email_provider_disabled`). "Allow new users to sign up"은 켠 채로 둔다. 끄면 새 Apple 계정도 막힌다.
   - **Confirm email** 켬. 메일 연결 전에도 켜 둔다. 꺼져 있으면 앱은 메일이 연결되지 않은 것으로 다룬다.
   - Password: 최소 8자, Letters and digits. 이메일과 다른지는 함수가 검사한다.
4. `site/`를 배포해 `.well-known/apple-app-site-association`의 `webcredentials`를 올린다.
5. Release iOS로 새 빌드를 만든다. `webcredentials` 도메인이 네이티브 설정이라 OTA로는 갈 수 없다(EAS가 Associated Domains를 맞추는지 첫 빌드 로그에서 확인한다).

`ACCOUNT_CREDENTIAL_KEY`를 넣지 않았으면 봉인 키와 시도 카운터 키가 service-role 키에서 나온다. 그 키를 바꾸면 봉인한 Apple 토큰은 읽을 수 없게 되고 해당 계정은 `V0-del-apple-more`로 간다. 시도 횟수는 초기화된다.

## 메일 연결

코드 변경은 필요 없다. 제공자와 보내는 주소는 오너가 정한다. 그 전까지 `V0-auth-signup-nomail`, `V0-auth-reset-nomail`, `V0-del-email-nomail`이 실제 화면이다.

1. Dashboard → Authentication → SMTP Settings에 제공자 값을 넣는다.
2. Email Templates의 Confirm signup·Reset password에 기본값처럼 `{{ .ConfirmationURL }}`이 있는지 확인한다.
3. URL Configuration → Redirect URLs에 `aroom://auth-callback`을 더한다(개발 빌드는 `aroom-dev://auth-callback`).
4. 가림 주소로 재설정 메일을 보내려면 보내는 도메인을 Apple Developer의 Sign in with Apple for Email Communication에 등록한다. 등록 전에는 `@privaterelay.appleid.com`으로 메일이 전달되지 않는다. 구현 시점에 Apple 문서로 다시 확인한다.
5. 메일 제공자를 처리방침의 처리를 맡기는 곳에 세 언어 모두 더하고, 심사 메모의 "Email sign-up and password reset are not open yet" 단락을 지운다.
6. Confirm email이 켜져 있는지 다시 본 뒤 값 하나를 켠다.

```sql
update public.app_settings set value = 'true' where key = 'auth_email_enabled';
```

되돌리려면 `'false'`로 바꾼다. 앱은 다음 화면부터 닫힌 상태를 보여 준다.

## App Review 데모 계정

심사자는 Apple 계정 없이 `V0-auth-login`으로 들어온다. 메일이 없으므로 운영자가 만든다. 비밀번호는 저장소·채팅·이 문서에 적지 않는다. ASC의 Sign-in information과 Notes에만 넣는다.

상대가 연결되어 있어야 홈까지 볼 수 있어서 계정이 두 개 필요하다. 아래 `review@…`와 `review-partner@…` 자리에 실제 주소를 넣는다. 받을 수 있는 주소가 아니어도 된다.

### 처음 만들기

SQL Editor에서 첫 번째 주소를 허용한다. 값은 언제나 주소 하나이므로 두 번째 계정을 만들 때 다시 바꾼다.

```sql
update public.app_settings set value = to_jsonb('review-partner@example.com'::text) where key = 'review_login_email';
```

1. Dashboard → Authentication → Users → **Add user** → **Create new user**: 주소, 비밀번호(8자 이상, 영문+숫자), **Auto Confirm User** 켬.
2. 첫 줄 SQL의 주소를 `review@…`로 바꿔 다시 실행하고 같은 방법으로 만든다. 이 값은 그대로 둔다(심사자가 삭제한 뒤 다시 만들 때 쓴다).
3. 앱(TestFlight)에서 `review@…`로 로그인 → 새로 시작하기 → 사귄 날·이름 → 초대 코드를 복사한다.
4. 다른 기기나 시뮬레이터에서 `review-partner@…`로 로그인 → 초대 코드가 있어요 → 코드 입력 → 참여 → 이름.
5. `review@…`로 다시 열어 홈에 D+N과 상대 이름이 보이는지 확인한다.
6. `docs/app-store/README.md`의 심사 경로대로 ASC에 `review@…`와 비밀번호를 넣는다.

### 심사자가 삭제한 뒤 다시 만들기

앱 안의 계정 삭제를 시험하면 `review@…`가 지워지고 공간도 함께 끝난다. `review-partner@…`는 남고 공간 종료 안내를 본다.

1. `review-partner@…`로 로그인해 공간 종료 안내를 확인한다.
2. Authentication → Users → Add user로 `review@…`를 같은 방법으로 다시 만든다. `review_login_email` 값이 그대로면 SQL은 필요 없다.
3. 위 3~5단계를 반복한다.

심사자가 계정 삭제를 눌렀는지는 다음으로 확인한다.

```sql
select id, email, created_at from auth.users where email in ('review@example.com', 'review-partner@example.com');
```

## 잠금의 한계

5회 10분 잠금은 `auth-password` 함수에서 센다. 앱의 모든 비밀번호 경로가 이 함수를 지나고, 없는 이메일도 똑같이 잠긴다.

공개 키로 Auth의 `POST /auth/v1/token?grant_type=password`를 직접 부르면 함수를 지나지 않는다. Auth에는 계정별 잠금이 없다. 이 경로를 닫는 제공자 기능은 Password Verification Hook인데 Team 이상 요금제에서만 쓸 수 있고, 이 프로젝트는 무료 요금제다. 그래서 이 경로는 Auth의 IP별 제한(기본 5분 30회)으로만 제한된다. 요금제를 올리면 이 훅을 붙이는 작업을 따로 잡는다.

함수에서 Auth로 가는 요청도 같은 IP 제한을 받는다. 동시 로그인이 많아지면 `RATE_LIMITED`로 답하고 시도 횟수는 세지 않는다.
