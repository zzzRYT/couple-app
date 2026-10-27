# Sign in with Apple 설정과 개발 빌드 테스트

2026-10-27 소유자 결정으로 제품 로그인은 **OAuth만**, 그중 우선 **Sign in with Apple만** 연다. 카카오는 코드에 남아 있지만 `apps/mobile/src/config/auth.ts`의 `KAKAO_ENABLED = false`로 숨겨져 있고, 이메일 로그인은 제품에서 빠졌다. 이메일 코드 로그인은 **개발 빌드와 로컬 스택에서만** 테스트용으로 남겨 두었다(Apple ID 두 개 없이 두 기기를 시험하기 위한 가정이며, 원하지 않으면 지울 수 있다).

## 앱이 하는 일 (구현됨)

- iOS: `expo-apple-authentication`의 Apple 공식 버튼과 네이티브 시트로 로그인한다. 앱이 임의의 nonce를 만들어 SHA-256 해시를 Apple에 보내고, Apple이 준 identity token과 **원래 nonce**를 Supabase `signInWithIdToken({ provider: 'apple', token, nonce })`로 넘겨 세션을 받는다.
- 이름은 요청하지 않는다(`EMAIL` 범위만). 데이터 모델에 표시 이름이 없어서 저장할 곳도 없다. Apple은 이름을 첫 로그인 때만 주므로, 나중에 이름이 필요해지면 첫 로그인에서 받아 `updateUser`로 저장하는 단계를 더해야 한다.
- 취소는 `login.cancelled.*`, 실패는 `login.error.*` 문구로 보여 준다.
- Android: 지금은 Apple 버튼이 없다. Android에서 Apple을 쓰려면 웹 OAuth가 필요하고, 그러려면 아래 "나중에" 항목의 Services ID와 서명 비밀이 있어야 한다(`APPLE_WEB_OAUTH_ENABLED` 플래그로 켠다). 그래서 Android 제품 빌드에는 아직 로그인 수단이 없다. 개발 빌드는 이메일 테스트 로그인으로 쓸 수 있다.
- 엔타이틀먼트: `app.config.ts`의 `ios.usesAppleSignIn: true`와 `expo-apple-authentication` 플러그인이 `com.apple.developer.applesignin`을 넣는다(`npx expo config --type introspect`로 확인함).

## 번들 ID

| 빌드 | `APP_VARIANT` | iOS 번들 ID | 상태 |
|---|---|---|---|
| `development`, `development-simulator`, `preview` | development / preview | `com.jinjinstar.aroom.dev` | **지금 Apple에 등록해도 되는 ID** |
| `production` | production | `com.jinjinstar.aroom` | 자리표시. 이름 확인(G2) 전에는 등록하지 않는다 |

값은 `apps/mobile/src/config/identity.ts` 한 곳에만 있고 `app.config.ts`가 `APP_VARIANT`로 고른다(`eas.json`의 빌드 프로필이 넣어 준다). EAS 프로젝트는 `@zzzryt/aroom`(projectId `99310e9a-4aee-4116-b9da-b6a26460f7e3`)으로 만들어 연결해 두었다.

## 1. Apple Developer에서 할 일

1. **Apple Developer Program 가입**(유료, 개인 계정). 무료 계정으로는 Sign in with Apple capability를 가진 App ID와 내부 배포 빌드를 만들 수 없다.
2. **App ID 등록**: Certificates, Identifiers & Profiles → Identifiers → `+` → App IDs → App → Bundle ID `com.jinjinstar.aroom.dev`(Explicit) → Capabilities에서 **Sign In with Apple** 체크 → Register.
   - EAS가 자격 증명을 관리하게 두면 첫 `eas build` 때 Apple 계정으로 로그인해서 같은 App ID와 capability를 자동으로 맞춰 줄 수도 있다. 직접 만들어 두면 확실하다.
3. **테스트 iPhone 등록**: 터미널에서 `cd apps/mobile && eas device:create` → 안내대로 iPhone에서 링크를 열어 프로필을 설치하면 기기 UDID가 등록된다. 내부 배포(ad hoc) 빌드는 등록된 기기에서만 설치된다.
4. **필요 없는 것(지금)**: 네이티브 id token 방식만 쓰면 Services ID, Sign in with Apple 키(`.p8`), 서명 비밀(client secret)은 필요 없다. 이것은 Supabase 공식 문서 "Login with Apple"(2026-10-27 확인)의 "If you're building a native app only, you do not need to configure the OAuth settings." 문장과 Client IDs 안내에 근거한다. 같은 문서는 웹 OAuth를 쓸 때만 Services ID를 Client IDs 맨 앞에 넣으라고 한다.
5. **나중에(Android·웹 로그인을 열 때만)**: Services ID 생성, 도메인과 return URL `https://<project-ref>.supabase.co/auth/v1/callback` 등록, `.p8` 키 생성 후 Supabase에서 서명 비밀 생성(6개월마다 갱신 필요). `.p8`은 저장소에 넣지 않는다.

## 2. Supabase 대시보드에서 할 일

1. Authentication → Sign In / Providers → **Apple** → Enable.
2. **Client IDs**에 `com.jinjinstar.aroom.dev`를 넣는다. 이름 확인(G2) 뒤 운영 빌드를 만들 때 `com.jinjinstar.aroom`를 쉼표로 덧붙인다. (Expo Go로 시험하고 싶을 때만 `host.exp.Exponent`도 덧붙인다. 아래 참고.)
3. Secret Key(OAuth) 칸은 비워 둔다(네이티브 전용).
4. **Email 공급자**: 제품에서는 쓰지 않는다. 다만 개발 빌드의 이메일 테스트 로그인으로 원격 프로젝트를 시험하려면 Email 공급자를 켜 둬야 한다. 개발용 원격 프로젝트에서만 켜 두고, 운영 프로젝트를 따로 만들면 그쪽은 끈다. 로컬 스택(`supabase start`)은 Apple과 Email이 둘 다 켜져 있다(`supabase/config.toml`).

## 3. 개발 빌드로 테스트하기

```bash
cd apps/mobile
eas build --profile development --platform ios        # 등록된 iPhone용 개발 클라이언트
# 빌드가 끝나면 EAS가 준 링크/QR로 iPhone에 설치
npx expo start --dev-client                           # 같은 Wi-Fi에서 앱을 열어 연결
```

- 앱에서 Apple 버튼 → 기기의 Apple ID로 로그인 → 공간 만들기 화면으로 가면 성공이다.
- 두 번째 사람은 다른 Apple ID가 있으면 두 번째 iPhone으로, 없으면 개발 빌드의 **이메일 테스트 로그인**(로그인 화면 아래쪽 버튼)으로 들어온다. 로컬 스택이면 코드 메일은 Mailpit `http://127.0.0.1:54324`에서 본다.
- 개발 서버가 로컬 Supabase를 쓰려면 iPhone이 접근할 수 있는 주소가 필요하다: `apps/mobile/.env.local`에 `EXPO_PUBLIC_SUPABASE_URL=http://<맥의 LAN IP>:54321`과 로컬 publishable 키(`supabase status`의 `PUBLISHABLE_KEY`)를 넣는다. 로컬 스택에서 Apple 로그인은 Apple 공개 키 확인 때문에 맥이 인터넷에 연결돼 있어야 한다.

### iOS 시뮬레이터

- `eas build --profile development-simulator --platform ios`로 시뮬레이터용 빌드를 받아 설치할 수 있다(기기 등록 불필요).
- 시뮬레이터에서도 설정 앱에서 Apple ID로 로그인해 두면 Apple 시트가 뜨지만, iOS·Xcode 버전에 따라 로그인이 끝나지 않거나 오류가 나는 경우가 있다. **최종 확인은 실기기**에서 한다. 시뮬레이터에서는 이메일 테스트 로그인이 가장 안정적이다.

### Expo Go를 쓰지 않는 이유

Expo Go 안에서는 번들 ID가 `host.exp.Exponent`라서 Apple이 그 ID로 토큰을 발급한다. Supabase Client IDs에 `host.exp.Exponent`를 넣으면 로그인 자체는 되지만, 실제 앱의 번들 ID·엔타이틀먼트와 다르고 이 앱의 네이티브 모듈 구성도 Expo Go와 맞지 않는다. 개발 클라이언트 빌드를 쓴다.

## 4. 자주 막히는 곳

- 로그인 시트는 끝났는데 앱이 오류를 보임: 가장 흔한 원인은 Supabase Client IDs에 빌드의 번들 ID(`com.jinjinstar.aroom.dev`)가 없어서 토큰의 audience 확인이 실패하는 경우다.
- nonce 확인 실패: 앱이 원래 nonce가 아니라 해시를 Supabase에 보내면 생긴다(현재 코드는 원래 값을 보내고, `apps/mobile/src/lib/__tests__/appleAuth.test.ts`가 확인한다).
- 버튼이 안 보임: Android이거나 iOS 13 미만이다.
- 빌드 서명 오류: App ID에 Sign In with Apple capability가 없거나 기기가 등록되지 않았다(`eas device:create` 후 다시 빌드).

원격 Supabase 연결과 배포는 `docs/remote-supabase-setup.md`를 본다.
