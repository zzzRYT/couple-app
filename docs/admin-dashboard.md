# Aroom 관리자 대시보드

관리자 웹은 Google 계정으로 로그인하고 잔존 데이터의 고정 집계만 표시한다. 앱 사용자 계정과 `auth.users`에 관리자를 추가하지 않는다. 관리자 계정에 **Google 2단계 인증을 켜야 한다**. Google의 2단계 인증 여부는 이 앱이 직접 검증할 수 없으므로 계정 소유자가 설정과 복구 수단을 관리한다.

## 보안 모델

Google OAuth/OIDC의 검증된 이메일만 허용하고 `ADMIN_ALLOWLIST_EMAILS`와 매 요청마다 비교한다. 세션은 서버에서 검증하는 암호화된 httpOnly 쿠키이며 1시간 후 만료된다. 허용 목록에서 삭제하면 다음 페이지 요청부터 거절된다. 인증 시작과 콜백 엔드포인트는 로그인 절차를 위해 공개되며 통계는 반환하지 않는다. OAuth 세션 응답에는 프로필을 포함하지 않는다. `NEXTAUTH_SECRET`을 교체하면 기존 세션이 무효화된다.

서버는 별도 DB 로그인 역할 `admin_dashboard_reader`로 `public.admin_dashboard()`만 호출한다. 이 역할에는 영구 데이터 테이블의 행이나 열에 대한 읽기·쓰기 권한이 없다. PostgreSQL의 기본 PUBLIC TEMP 권한은 유지되므로 자기 세션의 임시 객체는 만들 수 있다. 함수는 NOLOGIN 소유자의 최소 열 권한으로 고정 집계를 계산하며 `search_path`가 고정되어 있다. anon, authenticated, service_role에는 실행 권한이 없다. 마이그레이션은 기존 함수 세 개에 대한 `PUBLIC` 실행 권한을 철회한다. 이 함수들은 기존 anon/authenticated/service_role의 명시적 권한을 유지한다. 배포 전 별도 DB 역할이나 외부 SQL 클라이언트가 이 세 함수의 PUBLIC 권한에 의존하는지 확인한다. PostgreSQL 시스템 카탈로그와 기본 제공 함수는 PostgreSQL 기본 공개 권한의 영향을 받는다. 이 역할 자격은 서버에서만 보관하며 범용 SQL 인터페이스를 웹에 제공하지 않는다.

집계는 현재 남은 행 기준이다. 5 미만은 반환하지 않고, 분류표에 5 미만의 셀이 하나라도 있으면 전체 분류표를 숨겨 보완 셀 추론을 줄인다. 잔존 신고와 계정 삭제 지문은 별개이며 후자에 처리 상태는 없다. 작은 집계 억제는 연속 조회에 의한 차분 추론을 완전히 막지 않는다. 운영에서는 관리자 수를 최소화하고 별도의 Vercel/WAF 요청 빈도 제한을 설정하고 실제 적용을 검증한다. 이 앱 자체에는 여러 서버 인스턴스를 아우르는 강제 속도 제한이 없다. 응답은 private/no-store이고 실패 값은 `확인 불가`다. 원시 사용자 데이터, 식별자, 내용, 로그, 토큰은 대시보드에 표시하거나 기록하지 않는다. OTA 카드는 공개 Worker 버전만 읽으며 배포 성공이나 사용자 체감 건강을 의미하지 않는다.

## 로컬 실행

1. 로컬 Supabase를 시작하고 마이그레이션을 적용한다. `npx supabase start` 또는 기존 프로젝트의 로컬 개발 절차를 사용한다. 운영 프로젝트를 연결하거나 초기화하지 않는다.
2. 로컬 DB 관리자 연결에서 `\password admin_dashboard_reader`로 테스트 전용 비밀번호를 설정한다. 프롬프트로 입력하고 비밀번호를 터미널 기록, 저장소, 문서, 채팅에 남기지 않는다. 이 역할은 로그인 가능하지만 마이그레이션에는 비밀번호가 없다.
3. 쉘에 다음 환경 변수를 설정한다. `ADMIN_DATABASE_URL`은 로컬 DB의 해당 역할 접속 문자열이다. 비밀번호에 예약 문자가 있으면 URL 인코딩한다. `NEXTAUTH_SECRET`은 로컬 전용의 충분히 긴 무작위 값이다. `ADMIN_ALLOWLIST_EMAILS`는 쉼표로 구분한다.
4. 실제 Google 로그인을 테스트하려면 `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`을 로컬 OAuth 클라이언트에서 설정하고 `NEXTAUTH_URL=http://localhost:3000`, Google의 승인된 리디렉션 URI에 `http://localhost:3000/api/auth/callback/google`을 등록한다. `corepack pnpm --filter @couple/admin dev`로 실행한다.
5. OAuth 클라이언트가 없을 때만 로컬 DB에 대해 `ADMIN_TEST_BYPASS=1`, `ADMIN_TEST_EMAIL`을 허용 목록의 테스트 주소로 설정할 수 있다. 개발 서버는 기본적으로 loopback에만 바인딩한다. 이 우회는 `NODE_ENV=development`이고 Vercel production이 아니며 DB 호스트가 localhost일 때만 작동한다. 운영 빌드에서는 활성화되지 않는다. Google 실제 로그인 검증을 대체하지 않는다.
6. `corepack pnpm --filter @couple/admin test`, `corepack pnpm --filter @couple/admin typecheck`, `npx supabase test db`를 실행한다. Google 인증을 검증할 때는 허용 계정, 허용되지 않은 계정, 만료 세션 및 허용 목록 제거를 각각 확인한다.

## 운영 배포 순서 — 소유자가 수행

1. 개인정보 처리방침과 공급자 계약을 검토한다. 현재 공개 정책에는 Vercel이 처리업체로 명시되지 않는다. Google 로그인에 따른 관리자 계정 정보 및 Vercel 접속 로그도 검토하고 필요한 경우 한국어·영어·일본어 정책을 갱신한 뒤 공개한다. Vercel 요금제의 이용 조건도 확인한다.
2. 별도 관리자 Google 계정을 정하고 Google 2단계 인증을 켠다. Google Cloud에서 웹 애플리케이션 OAuth 클라이언트를 생성하고 OAuth 동의 화면과 사용자 범위를 설정한다. 승인된 원본에 선택한 Vercel HTTPS 도메인을, 승인된 리디렉션 URI에 `https://<관리자-도메인>/api/auth/callback/google`을 등록한다. 로컬 테스트용 URI는 위와 같으며 운영과 개발의 클라이언트는 분리한다. 도메인이 확정된 뒤 URI를 정확히 등록한다.
3. 운영 변경 승인 후 `node tools/supabase/remote.mjs prod db push --dry-run`으로 대상과 **모든** 대기 마이그레이션을 검토한다. 예상하지 못한 마이그레이션이 있다면 중단해 별도 검토한다. 승인된 경우에만 소유자가 `node tools/supabase/remote.mjs prod db push`를 실행한다. 관리자 마이그레이션은 비밀번호 없는 `admin_dashboard_reader` 역할을 생성한다.
4. 운영 DB 관리자가 안전한 관리자 연결의 `\password admin_dashboard_reader` 프롬프트에서 새 무작위 비밀번호를 설정한다. 공개 인터넷에 비밀번호를 붙여 넣거나 service-role 키를 사용하지 않는다. Supabase Connect 화면에서 운영 프로젝트의 공유 pooler 호스트와 포트를 확인하고 사용자 이름을 `admin_dashboard_reader.<프로젝트-ref>`로 바꾼다. 비밀번호를 URL 인코딩한 DB 연결 문자열을 안전한 비밀 저장 경로로 준비한다. [Supabase 연결 문서](https://supabase.com/docs/guides/database/connecting-to-postgres)는 사용자 지정 역할과 pooler 사용자 이름을 설명한다. TLS 인증서 검증이 필요하며 연결 문자열의 옵션은 앱이 무시한다.
5. Vercel 계정/팀에서 Git 저장소를 연결해 새 Next.js 프로젝트를 만들고 Root Directory를 `apps/admin`으로 설정한다. 모노레포의 루트 lockfile 및 workspace 패키지에 접근하도록 Vercel 프로젝트 설정을 확인한다. Production 환경에만 다음 변수를 비밀 설정 화면에서 입력한다. 값은 채팅이나 저장소에 넣지 않는다.
   - `ADMIN_DATABASE_URL`: 4단계의 **운영 전용 reader 역할** 연결 문자열.
   - `ADMIN_ALLOWLIST_EMAILS`: 2단계에서 승인한 Google 이메일을 쉼표로 구분한 목록.
   - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`: 2단계 운영 OAuth 클라이언트에서 받은 값.
   - `NEXTAUTH_URL`: 최종 관리자 사이트의 HTTPS 원본(경로와 마지막 `/` 제외).
   - `NEXTAUTH_SECRET`: 해당 프로젝트 전용의 충분히 긴 무작위 비밀값.
6. Preview에는 운영 DB URL과 운영 OAuth 비밀을 제공하지 않는다. 필요한 경우 별도 개발 DB, 개발 OAuth 클라이언트, 비밀 및 preview URI를 사용하고 Vercel 배포 보호를 설정한다. `ADMIN_TEST_BYPASS`를 Vercel에 설정하지 않는다. 원하면 별도 관리자 도메인과 DNS를 연결한다.
7. 운영에서 [Vercel WAF](https://vercel.com/docs/vercel-firewall/vercel-waf/rate-limiting)의 고정 윈도 규칙을 `/` 경로에 적용한다. 초기값으로 IP당 10분에 10회 제한과 429 응답을 설정하고 실제 차단을 검증한다. 여러 IP를 사용하는 조회를 완전히 막지는 못한다. 요금과 팀 정책을 확인한다. 배포 후 허용 계정 로그인과 2단계 인증, 비허용 계정 거절, 허용 목록 제거 및 세션 만료, reader 역할의 원본 읽기·쓰기 거절, 오류 시 `확인 불가`, 로그/번들의 비밀 미노출을 확인한다. 기능 연동 없이 콘솔 링크만 있는 항목을 실제 상태로 간주하지 않는다.

## 개발 DB 현황

이 작업의 Aroom-dev dry run에는 관리자 마이그레이션 외에 `20261111000100_v0_anniversary_preset.sql`도 대기 중이었다. 단독 적용 조건을 충족하지 않아 개발 DB는 변경하지 않았다. 선행 마이그레이션의 상태를 담당자가 확인한 후 다시 dry run한다.
