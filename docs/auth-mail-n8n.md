# 인증 메일: n8n

Aroom-dev에서 먼저 끝까지 시험하고, 그 후 별도 설정과 별도 비밀로 Aroom-prod를 진행한다. 이 저장소 변경은 원격 설정을 바꾸지 않는다. 훅은 Supabase의 SMTP를 대체한다. n8n이 중단되면 가입 확인과 비밀번호 재설정 메일도 중단된다.

## 준비 및 연결

1. n8n에 `tools/n8n/aroom-auth-mail.json`을 가져온다. 환경마다 독립된 워크플로와 고유한 webhook 경로를 사용한다. 발신 계정은 `aroom20261024@gmail.com`이다. 이 계정에서 Google 2단계 인증을 켜고 [앱 비밀번호를 만든다](https://support.google.com/mail/answer/185833). n8n의 SMTP credential에 Host `smtp.gmail.com`, Port `465`, SSL/TLS 켬, User `aroom20261024@gmail.com`, Password에 앱 비밀번호를 넣고 Send email 노드에 연결한다. 앱 비밀번호가 표시되지 않는 계정 설정이 있을 수 있으며 Google 계정 비밀번호를 바꾸면 앱 비밀번호는 폐기된다. 대안은 Gmail OAuth credential과 Gmail 노드로 교체하는 것이며, 이때도 모든 수신자 전송이 끝난 뒤 성공을 반환하고 오류를 500으로 전달하도록 구성하고 시험한다. 가져오기 작업은 오너가 직접 한다.
2. `Read profile locale` 노드에 해당 환경의 Postgres 자격증명을 연결한다. 로그인 전에도 프로필 언어를 조회해야 하므로 별도 읽기 전용 로그인 역할을 만들고 `public.user_profile`의 `user_id`, `locale` 열만 SELECT 허용한다. RLS가 켜져 있으므로 이 역할 전용 SELECT 정책도 필요하다. 예를 들어 오너가 각 프로젝트에서 다음을 실행한 뒤 역할에 별도의 강력한 비밀번호를 안전하게 설정하고 n8n credential에 넣는다. 서비스 역할이나 관리자 DB 비밀번호를 쓰지 않는다. DB 연결에 TLS를 사용하고 n8n에서 접근 가능한 해당 프로젝트의 연결 주소를 쓴다.

   ```sql
   create role aroom_auth_mail login;
   grant usage on schema public to aroom_auth_mail;
   grant select (user_id, locale) on public.user_profile to aroom_auth_mail;
   create policy auth_mail_locale_read on public.user_profile
     for select to aroom_auth_mail using (true);
   ```

   이 역할은 모든 사용자 ID와 언어를 읽을 수 있으므로 자격증명과 네트워크 접근을 제한한다. DB 조회 실패 시 메일 발송은 실패한다.
3. n8n 편집기에서 `Config` 노드의 값을 채운다. `hookSecret`에는 Dashboard에서 생성한 `v1,whsec_...` 전체, `supabaseAuthUrl`에는 `https://<해당 프로젝트 ref>.supabase.co/auth/v1`, `mailFrom`에는 `aroom20261024@gmail.com`을 넣는다. 저장소 JSON은 `PASTE_`로 시작하는 자리표시자만 담으며, 자리표시자 상태로는 모든 요청이 401로 거부된다. 서버 환경 변수나 `NODE_FUNCTION_ALLOW_BUILTIN` 같은 n8n 서버 설정은 필요 없다. 대신 훅 비밀이 워크플로 안에 저장되므로 이 워크플로를 열거나 편집할 수 있는 모든 n8n 사용자가 비밀을 볼 수 있다. 워크플로 공유 범위를 오너로 제한하고, 채운 워크플로를 내보내거나 저장소에 커밋하지 않는다. 환경마다 별도 워크플로에 각자의 값을 넣는다.
4. Webhook의 Raw Body 설정을 유지하고 워크플로를 활성화한다. Production webhook URL을 Supabase에서 접근 가능한 HTTPS 주소로 노출한다. 프록시가 본문과 `webhook-id`, `webhook-timestamp`, `webhook-signature` 헤더를 바꾸지 않아야 한다. n8n과 프록시의 시계를 동기화한다. 실행 데이터 저장은 끄고 접근 및 프록시 로그에 토큰이나 메일 본문이 남지 않게 한다.
5. Supabase Dashboard → Authentication → Hooks → **Send Email**에서 HTTP 훅을 켜고 해당 HTTPS production webhook URL을 넣는다. Dashboard가 생성한 훅 비밀을 안전하게 n8n의 `Config` 노드에만 복사한다. 노출되었으면 양쪽에서 교체한다. n8n SMTP 테스트를 포함해 실제 훅을 시험하고 비밀이나 링크를 기록하지 않는다.
6. Authentication → Sign In / Providers → Email 및 Allow new users to sign up 켬, Confirm email 켬. Password는 최소 8자, Letters and digits. URL Configuration의 Redirect URLs에 dev는 `aroom-dev://auth-callback`, prod는 `aroom://auth-callback`을 넣고 웹 계정 삭제 페이지에서 쓰는 URL도 유지한다. Site URL도 해당 환경의 웹 주소로 확인한다.
7. 시험 계정으로 가입 확인, 비밀번호 재설정과 앱 복귀를 확인하고 웹 삭제 페이지의 재설정 경로도 확인한다. 주소 변경을 사용한다면 Secure Email Change 양쪽 수신자도 확인한다. 잘못된 서명과 만료된 요청은 401, SMTP 오류는 500, 성공은 200 `{}`인지 확인한다. SMTP가 일부 수신자에게만 전송하고 실패할 수 있으므로 재시도 시 중복 메일이 생길 수 있다.
8. 메일 계정 제공자를 개인정보 처리방침 세 언어의 처리 수탁자에 추가하고 심사 메모를 갱신한 다음에만 SQL Editor에서 아래 스위치를 켠다. 필요하면 `'false'`로 되돌린다.

```sql
update public.app_settings set value = 'true' where key = 'auth_email_enabled';
```

이 개인 `aroom20261024@gmail.com` 발신 주소는 Apple의 Sign in with Apple for Email Communication에 도메인을 등록할 수 없으므로 Apple 비공개 릴레이 주소에 전달되지 않는다. 자체 도메인 메일 계정은 소유 도메인/발신 주소를 Apple에 등록하고 SPF/DKIM을 갖추면 전달할 수 있다. [Apple 설정 안내](https://developer.apple.com/documentation/xcode/configuring-sign-in-with-apple). 이 개인 Gmail 계정은 하루 500통을 넘으면 발송이 제한될 수 있으며 복구에 1~24시간 걸릴 수 있다. [Google 발송 한도](https://support.google.com/mail/answer/22839). 실제 계정 유형과 제공자의 한도를 확인한다.

## 동작과 로컬 검증

[Supabase Send Email Hook](https://supabase.com/docs/guides/auth/auth-hooks/send-email-hook)은 `user`, `email_data`를 보내고 200 빈 JSON을 성공으로 본다. 이메일 변경 시 `token_hash_new`는 기존 주소, `token_hash`는 새 주소에 쓴다. [Auth Hooks](https://supabase.com/docs/guides/auth/auth-hooks)의 오류 형식과 [Standard Webhooks 서명](https://github.com/standard-webhooks/standard-webhooks/blob/main/spec/standard-webhooks.md)을 따른다. 서명은 원문에 대해 검증하며 시간 차이가 5분을 넘으면 거부한다. HMAC-SHA256과 비교는 Code 노드 안의 순수 JavaScript로 계산한다. n8n [Crypto 노드](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.crypto/)의 Hmac 동작은 SHA256을 지원하지만 키를 Crypto credential의 Hmac Secret 텍스트로만 받는다. Standard Webhooks 키는 `whsec_` 뒤의 base64를 디코딩한 임의 바이트라 텍스트로 넣을 수 없으므로 Crypto 노드를 쓰지 않는다. 링크도 `url` 모듈 없이 `encodeURIComponent`로 만든다. [Supabase 이메일 템플릿](https://supabase.com/docs/guides/auth/auth-email-templates)의 `/auth/v1/verify?token=<token_hash>&type=<action>&redirect_to=<redirect>` 형식으로 연결하며 redirect가 없으면 페이로드의 site URL을 쓴다. 재인증은 링크 대신 코드를 보낸다.

언어는 서명 검증 후 `user_profile.locale`을 먼저 읽는다. 가입 시 프로필이 없거나 값이 없으면 `user_metadata.locale` 또는 `i18n`을 확인하고, 그것도 없으면 한국어다. 프로필 조회는 파라미터를 사용하며 DB 자격증명에는 읽기 권한만 필요하다.

`node --test tools/n8n/*.test.cjs`로 검증한다. 코드 수정 후 `node tools/n8n/build-workflow.cjs`를 실행해 JSON을 갱신한다. 로컬 훅 설정은 기본적으로 꺼져 있다. 격리된 프로젝트 ID와 포트를 가진 별도 임시 Supabase 작업 디렉터리에서만 설정을 켜고 `AROOM_LOCAL_AUTH_HOOK_SECRET`을 설정해 `node tools/n8n/local-receiver.cjs`로 검증한다. 공유 로컬 스택은 중지하거나 초기화하지 않는다.

격리 검증 재현: `supabase/` 전체를 임시 디렉터리의 `supabase/`로 복사하고 그 복사본의 `project_id`를 고유 값으로 바꾼다. API, DB, shadow DB, Studio, mail, pooler와 analytics 등 설정된 포트를 모두 사용하지 않는 포트로 바꾼다(예: 543xx → 553xx). 훅만 `enabled = true`로 바꾸고 테스트 전용 `AROOM_LOCAL_AUTH_HOOK_SECRET`을 수신기와 CLI 양쪽에 같은 `v1,whsec_...` 형식으로 설정한다. 저장소에서 수신기를 실행한 뒤 임시 디렉터리를 `--workdir`로 지정해 Supabase를 시작한다. 그 격리 DB에서만 `auth_email_enabled`를 켜고 가입 API를 호출하면 수신기의 `Verified auth mail hook`을 확인할 수 있다. 종료할 때도 반드시 같은 임시 `--workdir`을 지정해 그 프로젝트만 중지한다. 실제 발송과 n8n 노드 실행은 이 수신기 시험 범위에 포함되지 않는다.
