# 설계 조사: 커플 D-day와 프롬프트 방

조사 기준일: 2026-10-24. 제품 범위는 확정 명세에 한정했다. 아래에서 **사실**은 연결한 공식/1차 자료를 뜻하고, **제안**은 본 설계 판단이다. 가격은 USD이며 한국 세금·환율·초과 사용료를 포함하지 않는다.

## 0. 다국어 구조

**사실:** Expo의 공식 Localization 가이드는 `expo-localization`으로 기기 locale을 읽고 앱별 언어 선택을 설정할 수 있음을 설명하며, 날짜·숫자 등은 Hermes의 `Intl` API를 이용해 포맷할 수 있다고 안내한다. 가이드는 `i18n-js` 예시를 사용한다. `react-i18next`는 React 통합 API와 `changeLanguage` 흐름을 문서화한다.

**제안:** `i18next` + `react-i18next`의 key 기반 namespace 리소스, Expo locale 감지, JS `Intl.DateTimeFormat`/`Intl.NumberFormat` 포맷을 쓴다. D-day 어휘와 복수형은 locale resource key로 관리한다. 언어별 날짜 표기·숫자 grouping·plural 규칙을 확인한다: 한국어는 한국 관례, 영어는 `en-US`를 기본 변형으로 권장, 일본어는 일본어 D-day 문구/연월일 순서와 현지 숫자 관례를 사용한다. 한국어·영어·일본어가 출시 언어다. 언어별 번역 키 추가/누락 검사, 사람 검수, pseudo-localization, 텍스트 확장과 폰트 glyph 확인을 워크플로에 포함한다.

출처(접근 2026-10-24): [Expo Localization guide](https://docs.expo.dev/guides/localization/), [Expo Localization API](https://docs.expo.dev/versions/latest/sdk/localization/), [i18next getting started](https://www.i18next.com/overview/getting-started), [react-i18next quick start](https://react.i18next.com/guides/quick-start).

### 글꼴 계획과 배포 크기

**제안 family set:** 앱에 `Inter` (Latin/Latin-ext, 영어 및 혼합 숫자)와 locale별 `Noto Sans KR` 및 `Noto Sans JP`를 각각 번들한다. Noto KR glyph로 일본어를, Noto JP glyph로 한글을 대신한다고 가정하지 않는다. 한국어 화면은 Noto Sans KR, 일본어 화면은 Noto Sans JP, 영어 화면은 Inter를 우선하고 혼합 문자는 Inter/locale font fallback 순서를 확인한다. 각 언어의 본문·버튼·긴 날짜·이모지 대체 glyph를 기기에서 검수한다.

**라이선스:** Google Fonts 메타데이터는 Inter를 SIL Open Font License(OFL)로 표시한다. Noto CJK Sans의 공식 license는 OFL 1.1이며 폰트 배포 시 license/copyright notice를 동봉해야 한다. 실제 적용 전에는 각 사용 파일 및 version의 license, reserved font name 조건과 third-party notices를 manifest에 기록한다.

**크기 영향:** 공식 Noto CJK repository의 subset variable TTF 파일 metadata는 `NotoSansKR-VF.ttf` 약 9.93 MB, `NotoSansJP-VF.ttf` 약 9.15 MB로 표시한다(합계 약 19.1 MB, 원본 파일 기준, Inter family 추가 전). 전체 CJK font/전 weight 세트 대신 필요한 KR/JP variant만 고른다. Expo 문서는 폰트를 포함한 정적 에셋이 앱 용량을 늘리며 실제 배포 크기는 빌드 아티팩트에서 분석해야 한다고 권한다. 이 수치는 다운로드/압축 후 앱 크기가 아니다. EAS release artifact에서 iOS/Android별 실제 용량을 측정하고 stage 2/구현에서 weight subset 여부를 확정한다.

출처(접근 2026-10-24): [Inter official font metadata/license](https://github.com/google/fonts/blob/main/ofl/inter/METADATA.pb), [Noto Sans CJK format and regional variants](https://github.com/notofonts/noto-cjk/blob/main/Sans/README.md), [Noto Sans CJK OFL 1.1 license](https://github.com/notofonts/noto-cjk/blob/main/Sans/LICENSE), [Noto Sans KR subset variable TTF (9.93 MB)](https://github.com/notofonts/noto-cjk/blob/main/Sans/Variable/TTF/Subset/NotoSansKR-VF.ttf), [Noto Sans JP subset variable TTF (9.15 MB)](https://github.com/notofonts/noto-cjk/blob/main/Sans/Variable/TTF/Subset/NotoSansJP-VF.ttf), [Expo bundled font guidance](https://docs.expo.dev/develop/user-interface/fonts/), [Expo app-size guidance](https://docs.expo.dev/distribution/app-size/).

## 1. 모바일 프레임워크·장면 렌더링

**결정 — 고정 요구사항:** Expo / React Native. 작성일 기준 Expo SDK 58은 2026-10-15 공개되었고, React Native 0.88은 2026-10-19 안정 릴리스되어 SDK 58에서 지원된다. React Native Skia 최신 안정 릴리스는 3.7.4 (2026-10-23)다. Skia는 장식 씬 렌더링에만 사용한다. 최신 Skia와 Expo 네이티브 의존성 호환 여부는 구현 초기 spike에서 확인하고, 호환되지 않으면 SDK 58과 호환되는 안정 Skia 버전을 고정한다.

**제안:** Skia는 장식 그래프 전용 캔버스로 쓰고, 장면 밖에 네이티브 D-day 위젯/컨트롤을 쌓는다. 실제 화면 크기·안전 영역·접근성 글자 확대에서 계산한 보호 사각형과 오브젝트 경계 상자를 비교한다. 좌표는 정규화된 기준 캔버스에 저장하되 기기별 배율은 렌더 시 계산한다. 회전 오브젝트는 회전 경계 상자로 보수적으로 검사한다. 장식끼리의 겹침은 가능하지만 D-day·컨트롤·읽기 쉬워야 하는 텍스트 영역에는 겹치지 못한다.

**대안:** 모든 요소를 RN View로 만들면 네이티브 접근성과 터치 처리가 단순하지만 회전·레이어·다수 노드의 일관된 프레임 성능을 확인해야 한다. Flutter는 맞춤 캔버스가 강하지만 확정된 Expo/React Native 방향을 다시 뒤집으므로 채택하지 않는다.

출처(접근 2026-10-24): [Expo SDK 58 릴리스](https://expo.dev/changelog/sdk-58), [React Native 0.88 릴리스(2026-10-19)](https://reactnative.dev/blog/2026/10/19/react-native-0.88), [React Native 지원 버전](https://reactnative.dev/releases/), [React Native Skia 릴리스 목록(3.7.4, 2026-10-23)](https://github.com/Shopify/react-native-skia/releases).

## 2. 서버·데이터베이스 선택

### 권장: Supabase

Postgres의 외래 키·고유 제약·트랜잭션으로 공간에 구성원 2명 제한, 초대 코드 일회성 소비, 버전 포인터 갱신을 DB에서 원자화할 수 있다. RLS를 `space_id` 및 인증된 구성원 기준으로 모든 공유 테이블에 적용한다. Realtime은 `room_theme_versions` 또는 현재 테마 갱신 이벤트를 커플 구성원에게만 보낸다. 서버 함수는 동의·권한·일일 한도·스키마를 확인하고 Anthropic을 호출한다. 클라이언트에는 service-role 키나 Anthropic 키를 배포하지 않는다.

Supabase 공식 문서상 Free는 프로젝트 2개, 500MB DB/프로젝트, 월 50,000 MAU, 500,000 Edge Function 호출, 2M Realtime 메시지다. Pro는 월 $25부터이며 DB 8GB, 100,000 MAU, 2M Edge Function 호출, 5M Realtime 메시지가 포함된다. 운영 데이터에 장기 보관과 백업이 필요하면 출시 전 유료 플랜을 예산에 반영한다. Kakao Auth를 별도 문서화해 OAuth 설정 비용이 있다.

### 비교: Firebase

Firestore 모바일 SDK의 오프라인 캐시와 실시간 리스너는 강점이고, Spark 무료 한도는 일일 읽기 50,000회/쓰기 20,000회/저장 1GiB다. Blaze는 사용량 결제이며 Functions 호출 2M/월, 400K GB-sec, 200K CPU-sec, 5GB egress의 무료 한도가 있다. 하지만 계층형 문서 권한, 커플과 버전 연결, 복합 데이터 무결성은 Security Rules/Cloud Functions 설계에 더 의존한다. Kakao OAuth를 위해 custom token 교량이 필요할 수 있다. Supabase보다 SQL 제약과 내보내기 질의가 덜 직접적이다.

### 비교 판단

두 명만의 공유 데이터, 원자적 버전 확정, 임의의 장면 JSON 검증 이력을 위해 Supabase를 우선 제안한다. 팀이 Firebase 운영 경험을 갖고 있거나 오프라인 편집을 요구사항으로 확장하면 Firebase 재평가가 합리적이다. 장면 편집은 V1에서 온라인 전용이므로 Firestore의 오프라인 쓰기 강점은 필수 요건이 아니다.

출처(접근 2026-10-24): [Supabase 요금/포함량](https://supabase.com/docs/guides/platform/billing-on-supabase), [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [Supabase Realtime](https://supabase.com/docs/guides/realtime), [Realtime Authorization](https://supabase.com/docs/guides/realtime/authorization), [Supabase Edge Function 제한](https://supabase.com/docs/guides/functions/limits), [Supabase Kakao OAuth](https://supabase.com/docs/guides/auth/social-login/auth-kakao), [Firebase 가격](https://firebase.google.com/pricing), [Firestore 과금](https://firebase.google.com/docs/firestore/pricing), [Firebase Functions 과금](https://firebase.google.com/docs/functions/faq-and-troubleshooting).

**결정 — 소유자 승인:** backend는 Supabase. primary DB/Auth/Storage region은 대한민국 사용자를 위한 Seoul `ap-northeast-2`를 권장 기본값으로 한다. Supabase 공식 region 목록에 Seoul이 있다. region 선택은 DB/Auth/Storage의 위치를 고르는 것이며 규제 준수 보장을 뜻하지 않는다. Supabase는 운영 telemetry/일부 metadata가 선택 region 밖에서 처리될 수 있다고 설명하므로 국외 이전 동의/법률 검토는 계속 필요하다.

출처(접근 2026-10-24): [Supabase available regions](https://supabase.com/docs/guides/platform/regions), [Supabase regional Edge Function invocations](https://supabase.com/docs/guides/functions/regional-invocation), [Supabase Data Residency and Transfers FAQ (2026-10-06)](https://supabase.com/legal/privacy-resources/data-residency-and-transfers-faq).

## 3. 장면, 테마 버전, 서버·클라이언트 검증

**결정 — 고정 요구사항:** 장면 문서는 카탈로그 2D 오브젝트와 짧은 텍스트로 제한한다. 생성 이미지, SVG 문자열, URL, 컴포넌트 트리, 스크립트, 이벤트 핸들러를 허용하지 않는다. D-day는 별도 의미 뷰 모델로 저장·표시되며 장면 캔버스에 포함하지 않는다.

**제안:** 문서는 `schemaVersion`, `canvasProfile`, `objects[]`, `texts[]`를 갖는다. 노드는 `assetId`, 정규화 중심점/크기, 회전, 순서, 투명도만 허용한다. `assetId`는 서버 관리 카탈로그와 정확히 일치해야 한다. 텍스트는 UTF-8 유효성, 길이, 줄 수, 금칙 제어 문자, 대비와 최소 글자 크기 정책을 검사한다. D-day 표현은 `RoomPresentation`에 위치·크기·허용 팔레트·스타일 preset·표시 여부만 담고, 날짜 값은 `CoupleSpace.anniversaryDate`에서 계산한다.

서버는 Claude 응답을 JSON Schema로 구조화 출력하고, 이후 독립 검증기로 스키마·카탈로그·씬 수량·좌표·보호영역·겹침·텍스트 규칙을 확인한다. 실패 시 한 번만 제한된 repair prompt로 다시 요청하되, 실패가 반복되면 미리보기를 만들지 않고 현재 테마를 보존한다. 고정 규칙 검증이 모델의 자기 평가보다 권위가 있다. 클라이언트도 동일한 스키마/기하 규칙을 검증하고, 서버가 저장한 승인 후보의 해시/버전을 표시 직전에 확인한다.

적용은 prompt-session owner, 현재 버전 번호, idempotency key를 조건으로 한 transaction이다. confirm 시 새 `ThemeVersion` 전체 스냅샷을 추가하고 current pointer 이동 및 lease release를 함께 처리한다. 적용한 변경은 되돌릴 수 없다(적용 후 undo, 이용자용 버전 목록·선택 복구는 V1에 없고 스냅샷은 감사·충돌 검사용이다). 열린 대화 안에서는 마지막 미리 보기를 이전 후보로 되돌릴 수 있다(방은 바뀌지 않음). preview/cancel은 현재 테마를 변경하지 않는다. occupancy가 정상 prompt 편집을 직렬화하고 server version guard는 예외 동시 apply/늦은 retry를 `409`로 차단한다.

두 구성원이 같은 방을 동시에 편집하는 문제는 per-space lease로 직렬화한다. active lease owner만 입력·제출·적용하고, 상대는 shared transcript/preview를 Realtime으로 읽기 전용 구독한다. owner 활동이 멈추면 3분(결정) 후 lease가 만료되며 상대는 takeover할 수 있다. 서버는 session owner check와 expected version compare를 같은 transaction에서 수행해 드물게 도착한 동시 apply를 막는다. 일반 stale preview를 사용자 흐름의 기본 해결책으로 삼는 대신 독점 점유가 정상 경로를 직렬화하고, `409`는 만료/네트워크 지연 등 예외 경합의 최종 안전장치로 남긴다.

기존 조사들은 모델의 공간 관계·타이포그래피 실패를 보고하므로 실제 기기 비율과 dynamic type에서 결정론적 검사를 실행해야 한다. 보호 영역은 고정 좌표가 아니라 런타임 네이티브 뷰 측정으로 만든다. 보호 박스와 장면 오브젝트/문구가 겹치면 우선 규칙 기반 재배치를 한 번 수행하고, 불가능하면 후보를 거부한다.

출처(접근 2026-10-24): [FloorplanQA, ICML 2026](https://proceedings.mlr.press/v306/rodionov26a.html), [GraphicDesignBench](https://arxiv.org/abs/2604.04192), [GraphicBench](https://arxiv.org/abs/2504.11571), [Anthropic Structured Outputs](https://platform.claude.com/docs/en/build-with-claude/structured-outputs), [Anthropic Models](https://platform.claude.com/docs/en/about-claude/models/overview).

## 4. AI 호출 흐름, 모델, 비용

**흐름 제안:** 구성원이 prompt-session lease acquire → 서버가 한 명의 owner만 허용하고 상대에게 owner/expiry presence 전달 → owner가 prompt 입력 → 서버가 권한·동의·하루 5회 한도 검사 후 AI 구조화 출력 요청 → JSON Schema·정책·카탈로그·좌표/보호영역 검사 → shared conversation에 prompt/preview를 저장하고 둘에게 ID 기반 Realtime 이벤트 전달 → 상대는 live read-only로 대화/preview 확인, owner만 confirm/cancel/(열린 대화 안) undo → 서버가 session owner + expected version + idempotency를 transaction에서 검사, 적용 시 snapshot 저장과 lease release를 원자화. 활성 활동 heartbeat를 3분 idle 만료로 제한해 앱 종료 시 takeover가 가능하게 한다.

모델에는 날짜 원본, 이메일, 카카오 식별자, 초대 코드, 계정 세부를 보내지 않는다. 프롬프트 속 지시를 시스템 명령으로 승격하지 않고, 모델에는 도구·네트워크·DB 권한을 주지 않는다. 입력/출력 문자열을 로그에 남기지 않으며 키나 원문이 포함되지 않도록 로그 필드를 allowlist로 정한다. 동의는 사용자별로 기록하되 두 사람 모두 자신의 동의를 해야 AI가 호출되게 하는 방식을 권장한다(캡틴 확인). 동의 철회는 이후 요청을 차단한다.

**결정 — 소유자 승인:** Anthropic Haiku 5.5를 기본으로 하고, 품질 실패 사례에 한해 Sonnet 5.5로 제한 승급한다. 개발·PoC는 소유자의 Claude Max 요금제에 포함된 월 API 크레딧을 서버의 Console API 키로 쓴다(8장). 두 모델은 공식 가격표에서 각 $0.10/$0.50 및 $2/$10 per MTok(입력/출력, Haiku ≤100K 입력)이다. 예산 예시: 신규 입력 1,500 토큰 + 캐시 읽기 3,000 토큰 + 출력 1,000 토큰이면 Haiku 약 **$0.00068/요청**, Sonnet 약 **$0.0133/요청**이다. 커플당 하루 10회 전부 사용 시 약 $0.0068 / $0.133 per couple-day다. retry 1회, 캐시 쓰기, 세금, 저장소/전송, Anthropic 크레딧 조건은 제외했다. 실제 프롬프트 30개와 앱 렌더 결과로 승급 기준·지연·실비용을 측정한다. 비용은 사용자가 결제하는 상품이 아니다.

**안전:** OWASP LLM Prompt Injection 대응으로 출력 형식 강제, 최소 권한, 신뢰 불가 입력 분리, 모델 바깥 검증과 사람 확인을 사용한다. 단어 필터만으로 인젝션/위해 콘텐츠 차단이 보장된다고 보지 않는다. 위협 사례를 시스템/사용자 메시지 경계, 상대가 만든 장면 텍스트, 브랜드/실존 인물 요청, 자해·성적·폭력 요청 등으로 나눠 차단 규칙을 정한다. V1은 이미지 생성/공개 갤러리가 없지만 공유 UGC인 짧은 문구와 신고/차단 요구는 남는다. Apple 1.2의 필터·신고·대응·차단·연락처 요구와 Google Play UGC·AI 콘텐츠 정책의 출시 시점 문구를 재검토한다.

출처(접근 2026-10-24): [Haiku 5.5 모델/가격/출시일(2026-10-07)](https://platform.claude.com/docs/en/models/haiku-5-5/overview), [Sonnet 5.5 모델](https://platform.claude.com/docs/en/models/sonnet-5-5/overview), [Anthropic 가격표](https://platform.claude.com/docs/en/about-claude/pricing), [Anthropic 구조화 출력](https://platform.claude.com/docs/en/build-with-claude/structured-outputs), [Anthropic 데이터 보관 정책](https://platform.claude.com/docs/en/manage-claude/api-and-data-retention), [OWASP LLM01](https://genai.owasp.org/llmrisk/llm01-prompt-injection/), [Apple App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/), [Google Play UGC](https://support.google.com/googleplay/android-developer/answer/18258653?hl=en), [Google Play AI-generated content](https://support.google.com/googleplay/android-developer/answer/13985936?hl=en).

## 5. 로그인, 초대, 공간 종료

카카오/Apple OAuth와 이메일 로그인은 Supabase Auth 제안과 맞는다. 소셜 callback은 Expo universal link/deep link로 처리한다. 이메일은 짧은 수명의 링크/OTP 정책과 재전송 제한을 둔다. 초대 코드는 무작위 고엔트로피 값의 해시만 저장하며 원문은 발급 순간에 한 번만 보여 준다. 만료 시각과 consumed_at을 DB에서 원자적으로 검사한다. 공유 공간은 정확히 두 사용자만 허용하는 고유 제약과 RLS를 갖는다. 초대 수락으로 다른 사람의 기존 공간에 몰래 연결되는 것을 막고, 가입/수락 전 공간 구성원을 보여 주며 확인을 받는다.

종료 요청은 즉시 `recovery_pending` 상태로 바꾸고 초대·편집·AI 요청을 차단한다. 종료 이벤트, 종료자, 만료 시각을 저장한다. 30일 내 어느 기존 멤버든 명확히 복구를 요청할 수 있다는 계약을 권장하되, 상대가 명시적 이의/차단을 한 경우 복구를 허용할지 소유자 결정이 필요하다. 만료 후 사용자 프롬프트·장면·버전·초대·동의 이력을 포함한 복구 대상 데이터를 제거하고 삭제 결과를 감사한다. 법정 보존이 필요한 최소 거래/보안 기록 범위는 법률 검토한다.

초대 코드는 24시간에 만료되고 재발급 시 기존 미사용 코드를 무효화한다. 공간의 초대 수락은 DB transaction에서 한 번만 소비한다. 취소/만료 후보는 24시간 뒤 삭제하고, 적용된 prompt 원문과 대화 메시지는 30일 뒤 삭제하며, 종료된 공간은 30일 복구 기간 뒤 복구 대상 데이터를 삭제한다. 계정/동의 이력의 법적 삭제 범위와 공간 복구 경계는 법률 검토 후 세부화한다.

## 6. 오프라인, 캐시, 에셋 권리

오프라인에서는 마지막 서버 확정 장면/표현과 D-day를 읽기 전용으로 보여 준다. 확인되지 않은 preview는 앱 재시작 후 폐기하고, 복구 작업은 서버 연결과 최신 버전 확인이 필요하다. 프롬프트·confirm·invite·end/recover는 온라인 전용이다. 카탈로그는 버전 있는 manifest와 checksum을 갖고 앱 번들에 기본 세트를 포함해 첫 실행도 오프라인 렌더가 가능하도록 한다. 이후 manifest 갱신은 앱 검증 경로를 거치고 임의 URL을 문서가 직접 참조하지 않는다. 캐시는 LRU/용량 제한을 두며 장면 참조가 남은 에셋을 먼저 제거하지 않는다.

초기 24~36개 2D 오브젝트는 직접 의뢰한 그림 또는 CC0/상업 사용을 허용하는 명시적 라이선스를 우선한다. 계약서에는 앱 번들·캐시 전달·수정·홍보 이미지 사용권을 쓴다. CC BY는 앱 내 크레딧을 포함하고, share-alike·비상업·재배포 제한 스톡은 별도 법률 승인 전 채택하지 않는다. 각 에셋 레코드에 ID, 제작자, 원본 URL/계약, 라이선스 버전, 저작권/출처 표시, 포함 앱 버전, 파일 checksum, 크기, 포맷, 폐기 상태를 둔다.

**마스코트 원본의 출처(2026-10-26 소유자 확인) 및 결정**: 소유자는 이 마스터를 일러스트레이터 재작업 없이 그대로 쓰기로 하고 아래 위험을 수용했다. 마스코트 마스터는 소유자가 생성형 AI 대화 도구로 직접 만들었다(도구 이름·날짜·프롬프트는 소유자가 제공 예정). AI로 만든 이미지는 저작권 보호가 불확실하거나 약할 수 있다. 미국 저작권청의 2025년 1월 보고서(저작권과 인공지능 2부: 저작물성)는 프롬프트만으로는 저작자로 인정되기 어렵다고 보았고, 한국에서도 AI가 순수하게 만든 결과물은 등록이 어렵다는 입장이다. 이용 조건은 도구 제공사의 약관이 정하고, 기존 캐릭터와의 닮음 검수가 필요하다. 이 문서는 법률 판단이 아니며 법률 검토가 필요하다. 권장 완화책은 일러스트레이터가 마스터를 다시 그려 최종본으로 확정하고, 생성 기록(프롬프트·버전·날짜·도구 약관 사본)을 보관하는 것이다. 그림은 바꾸지 않았다.

출처: 제공된 시각 에셋·권리 조사(2026-10-24), [Kenney 라이선스](https://kenney.nl/support), [Creative Commons CC0](https://creativecommons.org/publicdomain/zero/1.0/), [Apple App Review Guidelines 2.5.2 / 1.2](https://developer.apple.com/app-store/review/guidelines/). URL은 접근 2026-10-24.

## 7. 빌드, 스토어 심사, 검증

EAS Build/Submit에서 iOS/Android 내부 QA 빌드를 만든 뒤 TestFlight 및 Play internal testing으로 심사 전 시험한다. EAS 무료 계획은 월 Android 15 + iOS 15 빌드와 Workflows 60분을 제공하고, Starter는 $19/월에 $45 빌드 크레딧을 제공한다(공식 가격, 2026-10-24). 조직은 Apple Developer Program($99/년) 및 Play Console($25 1회) 계정을 준비한다.

리뷰 제출은 스토어가 요구하는 신고·차단·연락처·부적절 콘텐츠 대응 동작을 설명하고, 검토자가 즉시 로그인할 수 있는 리뷰 계정과 **사전 고정 샘플 방**을 제공한다. 리뷰 메모에는 화면 데이터가 서버에서 내려와도 앱에 미리 컴파일된 고정 렌더러가 허용된 데이터만 표시하며 새 코드·스크립트·기능을 다운로드하지 않는다고 설명한다. Apple/Google의 정책상 1:1 비공개 공간이 예외라고 가정하지 않는다. 앱 설명 및 첫 AI 호출 전에 해외 제3자 처리 동의 UI를 보여 준다. 국내 AI 기본법 표시 요건과 AI 사용 고지 위치는 법률 검토 후 정한다. 내부 provenance 기록은 UI 배지 요구의 대체로 법적 준수를 보장하지 않는다.

검증 전략: JSON Schema 자체와 알 수 없는 필드 거부, 16/3 수량 경계, 정규화 좌표 경계, 허용 ID/폐기 ID, 회전 경계 상자, 2개 이상의 종횡비 및 동적 글자 크기 보호 영역, 최소 글자 대비/줄 수를 단위 테스트한다. 서버/클라이언트 공통 fixture로 검증 결과 동일성을 보장한다. 통합 테스트는 RLS에서 본인 공간/상대 공간/제3자 시도, 초대 만료·재사용, 두 confirm race, API timeout/유효하지 않은 모델 출력, 동의 철회, 10회 초과, 30일 보관/삭제를 다룬다. 테스트/스냅샷에 실제 키나 실제 사용자 프롬프트를 넣지 않는다.

출처(접근 2026-10-24): [EAS 가격](https://expo.dev/pricing), [EAS 계획](https://docs.expo.dev/billing/plans/), [Apple Developer Program](https://developer.apple.com/programs), [Google Play Console 등록](https://support.google.com/googleplay/android-developer/answer/6112435?hl=en), [Google Play 앱 콘텐츠 등급](https://support.google.com/googleplay/android-developer/answer/9859655?hl=en), [한국 AI 기본법 제31조](https://www.law.go.kr/lsLinkCommonInfo.do?chrClsCd=010202&lsJoLnkSeq=1031810715), [AI 기본법 시행령 제23조](https://www.law.go.kr/LSW/lsSideInfoP.do?docCls=jo&joBrNo=00&joNo=0023&lsiSeq=288781&urlMode=lsScJoRltInfoR).

## 7.1 홈 커버 사진 저장 (승인된 제안)

홈 상단에 커플이 올린 사진 한 장을 쓰기로 해서(spec FR-032) 사진 업로드가 처음 생긴다. 아래는 조사 결과가 아니라 **제안**이며, 링크의 세부(제한, 변환 기능, 가격)는 구현 시작 때 공식 문서로 다시 확인해야 한다(이 문서를 쓴 시점에는 확인하지 않았다).

- **저장**: 이미 쓰는 Supabase의 Storage 비공개 버킷에 두고 RLS로 구성원만 읽게 한다. 앱에는 짧은 수명의 서명된 URL만 준다. 공개 버킷과 난수 URL은 URL이 유출되면 막을 수 없어 쓰지 않는다.
- **업로드**: 시스템 사진 선택기(iOS PHPicker, Android Photo Picker)를 쓰면 사진 보관함 전체 권한이 필요 없다. 서버 함수가 구성원·공간 상태를 검사하고 업로드 주소를 발급하며, 서버가 이미지 헤더·형식·크기를 다시 검사해 재인코딩한 사본만 저장한다.
- **EXIF**: 휴대폰 사진에는 촬영 위치(GPS)가 들어 있을 수 있어서 저장본에서 EXIF/XMP를 제거한다. 앱의 재인코딩만 믿지 않고 서버에서 한 번 더 제거한다.
- **HEIC**: iOS 기본 사진 형식이다. 업로드 전에 앱에서 JPG로 바꿀지, 서버에서 바꿀지는 구현 단계에서 정한다.
- **검수·신고 없음(결정)**: 홈 사진에는 검수 단계와 사진 신고를 두지 않기로 했다. 다만 이용자가 올리는 콘텐츠라 Apple App Review Guidelines 1.2와 Google Play UGC 정책의 신고·차단·삭제 요구가 비공개 두 사람 공간의 사진에도 적용되는지는 별도 확인이 필요하다(1:1 비공개 공간이 예외라고 가정하지 않는다, 7장과 같은 원칙). 법률 검토 때 확인한다.
- **AI와 분리**: 사진은 AI 제공자에게 보내지 않는다. 방 꾸미기 프롬프트에 사진 정보를 넣지 않는다(spec FR-034).
- **개인정보**: 얼굴·장소가 담길 수 있어 처리방침 문구와 국외 처리(Supabase 운영 telemetry/일부 metadata) 범위를 법률 검토에 포함한다.

참고 문서(접근 미확인, 구현 때 재확인): [Supabase Storage](https://supabase.com/docs/guides/storage), [Storage access control](https://supabase.com/docs/guides/storage/security/access-control), [Apple App Review Guidelines 1.2](https://developer.apple.com/app-store/review/guidelines/), [Google Play UGC](https://support.google.com/googleplay/android-developer/answer/18258653?hl=en).

## 7.2 마일스톤 알림: 기기 로컬 예약 알림(결정) vs 서버 푸시(범위 밖)

결정: 첫 버전은 **옵트인 기기 로컬 예약 알림**만 쓴다. 서버 푸시는 쓰지 않는다. 아래는 두 방식의 비교이고 구현 때 Expo Notifications와 플랫폼 문서로 다시 확인한다(접근하지 않은 일반 지식).

| 항목 | 기기 로컬 예약 알림(채택) | 서버 푸시(범위 밖) |
|---|---|---|
| 화면 | 사전 안내 시트 + 설정 행 + 알림 문구 3개 언어 | 같음 |
| 권한 | iOS 알림 권한, Android 13+ POST_NOTIFICATIONS | 같음 |
| 일정 | 기기가 서버의 `upcoming` 목록을 받아 OS에 예약, 날짜·시간대 변경 때 재예약 | 서버 예약 작업이 매일 대상 계산 후 전송 |
| 서버 작업 | 없음(목록 계산 API만) | 예약 작업 + 푸시 토큰 저장 + APNs/FCM(또는 Expo 푸시) 키 관리 |
| 위험 | 앱 삭제·기기 변경·OS 정리로 예약 소실(앱을 열 때 다시 예약) | 전송 실패·토큰 만료 처리, 처리방침에 토큰 항목, 운영 비용·장애 대응 |
| 잠금 화면 | 이름·날짜 없는 짧은 문구 | 같음 |

iOS는 대기 중인 로컬 알림을 앱당 64개로 제한한다고 알려져 있어 기기당 3개만 예약하는 계획은 문제 없다. 스토어 심사에는 알림이 사용자가 켠 기념일 알림이고 마케팅이 아니라는 점, 서버에 토큰을 저장하지 않는다는 점을 적는다.

## 8. 소유자 준비물과 대략 비용

| 준비 항목 | 소유자가 만들거나 정할 것 | 대략 비용 / 기준 |
|---|---|---|
| Apple Developer | **개인 계정으로 시작(결정)**. 스토어에 보이는 판매자 이름이 개인 이름이 되고, 나중에 법인으로 옮길 수 있지만 절차가 필요하다 | $99/년; 적격 단체는 면제 가능 |
| Google Play Console | **개인 계정으로 시작(결정)**, 신원/연락처 인증 | $25 1회 |
| Expo/EAS | Expo 조직과 프로젝트, 빌드 비밀 변수 보관 담당 | 무료부터(15 iOS + 15 Android builds/월); Starter $19/월 |
| Anthropic | 소유자의 **Claude Max 요금제에 포함된 월 $100 API 크레딧**(Max 5x; 요금제에 Console 조직을 연결해 받음)을 개발·PoC 비용으로 쓴다. 이 프로젝트 전용 Console workspace에 지출 한도를 두고, Console **API 키**를 서버 secret store(Supabase Edge Function secret)에만 둔다. 크레딧은 결제 주기마다 지급되고 남은 것은 주기 끝에 **소멸**(이월 없음), 잔액이 0이면 다음 지급 때까지 요청이 멈추며(요금제에 청구되지 않음), 같은 조직의 모든 키·workspace가 한 잔액을 쓴다. 조직 연결은 소유자가 직접 바꿀 수 없다(지원팀 문의) — 프로젝트가 쓸 조직을 연결해야 한다. 채팅 로그인·Claude Code 한도·OAuth 토큰은 쓰지 않는다. **PoC 범위(테스트 사용자 몇 명)**; 소유자는 포함 크레딧이 상업 서비스용이 아니라고 이해하고 있다(Anthropic 공개 크레딧 페이지에서는 확인되지 않음 — 공개 출시 전 상업 약관·크레딧 약관 확인, 유료 API 크레딧 구매/결제 설정으로 전환). 공개 출시 전 약관 확인 항목(프로그램 약관 원문·Commercial Terms·Usage Policy·AI 제안 오류 가능 고지·유료 전환)은 `handoff.md` §19.2. 출처: [API credits for Max and Team plans](https://platform.claude.com/docs/en/about-claude/api-credits-for-subscribers), [credit terms](https://www.anthropic.com/legal/credit-terms) (접근 2026-10-26) | 키 생성 자체는 무료; 토큰 사용료 발생. 위 요청 모델 기준 Haiku 약 $0.00068, Sonnet 약 $0.0133/요청의 가정 예시 |
| Backend | Supabase 개인 계정, 서울 리전 프로젝트 | **개발은 무료 플랜**(무료 프로젝트는 비활동 시 일시 정지됨, 배포 전 확인). 운영 Pro $25/월 + 필요 추가 컴퓨트/사용량은 출시 때 결정 |
| 도메인·법률 페이지 | 소유자의 개인 도메인 `jinjinstar.com`을 쓴다(결정). 제안 주소 `mopiru.jinjinstar.com`(지원·개인정보 처리방침 페이지; 소유자가 만들어야 함)과 DNS, 개인정보 처리방침/약관/AI 해외 처리 문서 공개 위치 | 일반 `.com` 연 $10–20 대략값(등록기관/세금/갱신에 따라 다름); 법률 작성 비용 별도 견적 |
| 카카오 로그인 | 카카오 디벨로퍼 앱, 사업자/개인 정책 검토, Redirect URI 및 동의항목 | 카카오 정책에 따라 확인; 계정과 앱을 소유자가 생성 |
| Apple 로그인 | Services ID/앱 ID, redirect domain | Apple 계정과 개발자 프로그램 소유자 필요 |
| 에셋 제작 | 24–36개(현재 디자인은 24개: 방 안 마스코트 6 + 오브젝트 18) 권리 확정 원본과 제작 계약. 마스코트는 AI 생성 원본(그대로 사용, 닮음 검사·법률 검토는 출시 전 권장)과 일러스트레이터 재작업 | 범위·작가 견적 필요(현재 산정 불가) |
| 스토어 정책 운영 | 신고 접수 **공개 지원 이메일(아직 없음)**, 연결 끊기·신고 대응 운영자, 연령 등급(만 14세)/UGC 분류·법률 검토 | 운영 인력/법률 비용 산정 필요 |

가격은 접근일 기준 공식 페이지 또는 일반 도메인 범위의 참고치며, 실제 결제 전 소유자가 지역 통화·세금·사업자 조건을 확인해야 한다. [Squarespace 도메인 가격 안내](https://domains.squarespace.com/blog/how-much-does-a-domain-name-cost) (접근 2026-10-24)에서는 `.com` 일반 범위가 연 $10–20이라고 제시한다.
