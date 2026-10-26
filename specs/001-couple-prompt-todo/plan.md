# 구현 계획: 프롬프트로 꾸미는 커플 D-day와 우리 방

**작업 브랜치**: `fm/cpl-plan` | **작성일**: 2026-10-24 | **명세**: [spec.md](./spec.md)

**입력**: `specs/001-couple-prompt-todo/spec.md` 및 제공된 제품·시각·장면 배치 조사 보고서

## 요약

Expo / React Native 모바일 앱에 메인 D-day 화면과 둘만의 자유 배치 방을 제공한다. 장식 2D 오브젝트와 짧은 문구만 2D 장면 그래프에 저장하고, D-day 의미 위젯과 조작 컨트롤은 장면 캔버스 밖의 네이티브 뷰로 렌더링한다. 서버 함수가 동의와 공간 권한을 확인한 뒤 Claude 구조화 출력을 검증해 미리보기 후보를 만들며, 사용자가 확인한 불변 버전만 공유 방에 반영한다. Supabase(Postgres, Auth, Realtime, Edge Functions)를 권장안으로 제안한다.

## 고정 결정

- 앱은 모바일 전용이며 Expo / React Native로 만든다. 작성일의 최신 안정 기준은 Expo SDK 58(2026-10-15), React Native 0.88(2026-10-19), React Native Skia 3.7.4(2026-10-23)이다. Skia는 장식 씬 렌더링에만 사용하고, Expo SDK 58에서의 네이티브 호환성을 구현 시작 시 다시 확인한다.
- 방은 보호 영역을 적용한 자유 배치 2D 장면 그래프다. 장면 그래프에는 라이선스가 확인된 카탈로그 오브젝트와 짧은 텍스트만 둔다.
- D-day 의미 위젯과 고정 컨트롤은 장면 캔버스 밖의 네이티브 뷰로 그린다. D-day 위젯은 별도 표현 데이터로 이동·크기·스타일을 바꾸거나 방에서 숨길 수 있지만, 날짜·정확성·접근성은 앱이 소유한다.
- V1은 생성 이미지, 임의 SVG, 외부 코드를 제공하지 않고, 사용자 사진 업로드는 **커플당 홈 커버(배경) 사진 한 장**만 예외로 허용한다. 갤러리·타임라인·방 장면·프롬프트에 쓰는 사진은 제외한다. 홈 커버 사진은 장면 데이터와 분리되어 AI에도 보내지 않는다(아래 "홈 커버 사진"). 장면 데이터는 고정 앱의 렌더러가 읽는 값이며 코드·스크립트·액션·URL을 포함하지 않는다.
- AI 호출은 서버 함수에서만 한다. API 키는 서버 비밀 저장소와 개발자의 비밀 환경에만 두며 저장소, 로그, 앱 번들, PR 문구, 채팅에 넣지 않는다. 개발은 캡틴이 제공하는 Anthropic API 크레딧을 쓴다.
- AI 처리 전에 해외 처리·전송 데이터·목적을 안내하고 명시적 동의를 받는다. 동의 전·철회 후에는 전송하지 않는다. 프롬프트에는 장면을 꾸미는 데 필요한 최소 데이터만 포함한다.
- 커플당 하루 10회는 남용 방지 상한이다. 결제·가격 상품과 연결하지 않는다.
- 카카오·Apple·이메일 로그인을 지원하고, 만료되는 공유 초대 코드로 두 번째 구성원을 초대한다.
- 어느 구성원이든 공간을 종료할 수 있다. 종료 후 30일간 복구 가능하게 보관하고 만료 시 삭제한다.
- UI에는 AI 배지를 넣지 않는다. 내부 이력에 생성 출처를 기록한다. 법률상 고지·표시 의무는 출시 전 검토한다.
- 캘린더, 할 일, 홈 커버 사진 한 장을 제외한 사진 업로드는 제외한다.
- Backend는 Supabase Postgres/Auth/Realtime/Edge Functions로 결정한다. 프로젝트 DB는 Supabase Northeast Asia (Seoul, `ap-northeast-2`)를 권장 기본 region으로 사용한다.
- AI 모델 정책은 Haiku 5.5 기본, 품질 실패 사례에 제한적으로 Sonnet 5.5 승급이며 개발에는 제공된 Anthropic credit을 사용한다.
- 초대 코드는 24시간 후 만료하고 한 번만 수락 가능하며, 재발급은 이전 미사용 코드를 무효화한다.
- 한 커플 공간에 prompt session owner는 한 명만 둔다. 두 구성원은 shared conversation/preview를 실시간 확인하며, 비점유자는 읽기 전용이고 점유자만 입력·요청·적용한다. 기본 idle lease 가정은 3분이다.
- 출시 언어는 한국어(`ko-KR`), 영어(`en-US` 기본 locale variant 제안), 일본어(`ja-JP`) 세 가지다. 모든 UI 문구는 번역 리소스 기반이며, locale은 기기 언어 기본값과 앱 내 재정의를 지원한다.
- 앱의 독창적인 마스코트는 앱 소유 고정 캐릭터이며 새 방의 기본 오브젝트다(메인 페이지에는 표시하지 않고 온보딩 히어로 한 곳에만 쓴다). 이용자는 마스코트를 꾸미거나 변형할 수 없다(착용 슬롯·팔레트·표정 선택·생성 변형 없음, 첫 버전 범위 밖). 포즈와 움직임은 앱이 정한 고정 동작이다.
- 방 테마는 낮/밤 variant를 모두 저장한다. `follow_time`을 기본으로 하고 커플 공간 생성자의 IANA 시간대를 사용하며 설정에서 모드나 시간대를 바꾼다. UI 다크 모드는 별도 사용자 설정이며 `system` 기본값에 수동 light/dark override를 제공한다.

## 기술 맥락

**언어/버전**: TypeScript, Expo SDK 58 (2026-10-15), React Native 0.88 (2026-10-19; SDK 58 지원), React Native Skia 3.7.4 (2026-10-23). 출시 시점에 SDK/Skia 호환 행렬을 다시 고정한다.

**주요 의존성**: Expo Router, Expo Localization (`expo-localization`), `i18next` + `react-i18next` 제안, `@shopify/react-native-skia`, Supabase React Native 클라이언트, 서버 Edge Functions, Claude Messages API 구조화 출력.

### 다국어 구조 제안

- 화면 컴포넌트에는 표시 문자열을 직접 쓰지 않고 네임스페이스별 번역 키를 호출한다. 키는 `area.component.state` 형태(예: `room.prompt.submit`)로 관리하고 interpolation 변수와 plural 규칙을 번역 리소스에 정의한다.
- `expo-localization`으로 선호 locale을 읽고, `i18next`와 `react-i18next`로 한국어(`ko-KR`), 영어(`en-US`), 일본어(`ja-JP`) 리소스를 연결한다. 앱 내 선택은 기기 언어보다 우선한다. `Intl.DateTimeFormat` / `Intl.NumberFormat`으로 현지 날짜·숫자 형식을 쓰며 D-day 어휘와 일본어 연월일 순서/plural는 locale별 메시지 리소스로 관리한다.
- 언어 추가 절차: key manifest 갱신 → 번역 → 누락/미사용 키 및 interpolation 확인 → 폰트 glyph/license 확인 → pseudo-localization과 실제 번역으로 text expansion 측정 → 기기 언어/앱 내 언어 전환, layout 및 날짜/숫자 규칙 검수. 출시 지원 set은 ko-KR/en-US/ja-JP다.
- AI 프롬프트는 지원 언어 어느 것으로나 허용한다. AI는 요청 언어를 유지하며 커플이 쓴 방 문구는 입력 원문 그대로 저장한다. 서버 오류는 `VERSION_CONFLICT` 같은 언어 중립 코드만 반환하고 UI가 현재 locale 리소스에서 메시지를 선택한다.
- 권장 번들 font families: Inter (Latin/Latin-ext), Noto Sans KR (한글), Noto Sans JP (일본어). 언어 간 CJK glyph coverage를 추정하지 말고 각 locale의 한글/Latin/Japanese glyph fixture를 검증한다. Google Fonts metadata와 Noto 공식 repo는 family들을 SIL Open Font License로 표기한다. Noto Sans KR subset variable TTF는 약 9.93 MB, Noto Sans JP subset variable TTF는 약 9.15 MB이며 합계 약 19.1 MB로 Inter 파일과 앱 압축 전 크기는 별도다. 라이선스와 reserved name 고지를 번들에 포함하고, 실제 iOS/Android EAS artifact 크기를 측정해 필요한 weight/file subset만 확정한다. 크기 및 라이선스 근거는 [research.md](./research.md)의 공식 출처(접근 2026-10-24)를 따른다.
- 소스 확인일(2026-10-24): Expo 공식 [Localization 가이드](https://docs.expo.dev/guides/localization/)는 `expo-localization`, 앱 언어 선택, `Intl` 포맷을 안내하고 [expo-localization API](https://docs.expo.dev/versions/latest/sdk/localization/)에서 locale 정보를 제공한다. Expo 예시의 `i18n-js` 대신 키 기반 namespace와 React 통합을 위해 공식 [i18next 시작 문서](https://www.i18next.com/overview/getting-started) 및 [react-i18next 시작 문서](https://react.i18next.com/guides/quick-start)를 적용 후보로 제안한다.

### 마스코트와 방 테마

- 고정된 `app_mascot` 카탈로그 오브젝트는 앱 소유의 독창 디자인이다. 새 커플 방에 기본 1개 배치한다. 이용자 설정 상태(착용·색·표정·포즈 선택)는 저장하지 않으며 포즈는 앱이 정한다. 위치와 크기는 보통 씬 오브젝트 규칙을 따르고(조정 여부는 spec Open Decisions 2), 프롬프트로 모습을 바꿀 수 없다.
- 24–36개 자산 범위는 방 안 마스코트 포즈와 일반 방 오브젝트를 포함한다. 디자인이 실제로 내놓은 구성은 방 안 마스코트 포즈 6 + 일반 오브젝트 18 = 24다. 소품 포즈 일러스트 5종은 방 밖용이고 카탈로그에 세지 않는다. 마스코트는 씬 최대 16개 제한에 포함된다.
- **마스코트 동작(클라이언트 전용)**: 전체 크기 방 화면에서 포즈 이미지 6장을 40초 주기로 번갈아 보여 주며 걷는 구간에서는 좌우 반전과 위아래 흔들림을 쓴다. 누르는 동안 신나게 인사 포즈, 동작 줄이기에서는 서서 인사 포즈 한 장이다. 축소된 방 보기(방 카드·미리 보기)는 정지 포즈다. 이 동작은 장면 문서·서버 상태·AI 출력과 무관하게 앱이 정한 고정 동작이다(디자인 `interaction-notes.md` §11). 구현은 Skia/네이티브 애니메이션 중 성능 검토 후 고른다.
- **로딩 표시**: 화분 → 풍선 → 창문 → 책 순환 로더(4.8초)를 공용 컴포넌트로 만들어 전역 기본 로딩 표시로 쓴다. 창문은 아직 카탈로그에 없는 임시 그림이라 정식 오브젝트(`obj_decor_window`)가 필요하다. 동작 줄이기에서는 정지 그림이다(`components.md`).
- `RoomThemeDocument`는 `day`와 `night`의 배경/팔레트 토큰 및 catalog asset variant, mode와 IANA timezone을 보유한다. 기본 mode는 `follow_time`, timezone은 공간 생성자의 것으로 초기화하고 설정에서 변경한다. 사용자별 UI 모드는 `system | light | dark`, 기본 `system`이다.
- validator는 마스코트 기본 자산의 단일성을 검증하고 마스코트 교체·변형·상태 필드를 거부한다. 보호 영역, 대비, 글자 가독성은 day/night 방 변형과 light/dark UI의 네 조합에서 확인한다.

### 공유 프롬프트 세션

- 공간당 하나의 DB lease만 `occupied`일 수 있다. `PromptSession`에는 session ID, owner member, last activity, heartbeat 및 expiry를 둔다. 기본 idle timeout 3분은 조정 가능한 가정이다.
- prompt, status, preview는 shared conversation에 저장한다. Supabase Realtime은 두 구성원에게 message/preview ID, owner ID와 expiry만 알리고, 각 구성원은 RLS가 적용된 conversation endpoint에서 같은 대화와 preview를 불러온다.
- 점유자는 입력·제출·적용·취소·**세션 안 되돌리기**를 사용할 수 있다. 상대 화면은 live read-only로 대화와 preview를 보여 주고 owner/presence 및 expiry를 표시한다. 취소와 성공한 confirm은 DB transaction에서 저장/상태 전환과 함께 lease를 해제한다. 세션 안 되돌리기는 열린 대화의 마지막 후보를 `reverted`로 바꾸고 바로 앞 후보(없으면 현재 방 보기)를 다시 보여 줄 뿐이며 lease를 풀지 않고 방 버전도 바꾸지 않는다. **적용한 변경은 되돌릴 수 없고 다시 적용(redo)도 없다.** 앱은 적용 확인 단계에서 이를 알린다.
- heartbeat는 사용자 입력/모델 생성이 진행 중일 때 server clock 기준으로 연장한다. 앱이 background/닫힘 상태이거나 idle limit에 도달하면 만료된다. 다른 멤버의 takeover는 `expectedOwnerUserId`와 만료 시각을 비교해 원자적으로 owner를 갱신하며 shared preview를 이어서 볼 수 있다.
- confirm은 `session owner + expected version + idempotency key`를 서버 transaction에서 함께 검사한다. occupancy가 정상 입력을 직렬화하며 version guard는 두 기기의 동시 apply/늦은 retry로 인한 이중 적용을 막는 최종 보호다.
- **서버에 계속 저장하는 것(되돌리기·기록을 뺀 뒤에도)**: 적용된 버전 스냅샷(AI 출처·작성자·시각의 감사 기록, 적용 후 되돌리기나 열람은 없음), 요청 이력(하루 10회 한도·남용 조사), AI 처리 동의 기록, 공간 종료 후 30일 복구 데이터. 이용자 화면 기능이 아니라 안전·남용 방지·동의·복구를 위한 저장이다.
- 데이터 기본 보관값: cancel/expire된 미적용 preview는 그 시각부터 24시간 보관 후 삭제, 적용된 prompt/message 원문은 30일 보관 후 삭제, 삭제 대상 room data는 30일 복구 기간 종료 후 삭제한다.

### 홈 커버 사진

V1에서 허용하는 유일한 사용자 사진이다(spec FR-032~FR-039). 장면 문서·AI 문맥과 분리된 별도 경로로 다룬다. 공유(마지막 변경 우선, 변경자 표시)·공간 삭제 시 삭제·검수/신고 없음은 결정된 요구사항이고, 형식·크기 등 아래 수치는 디자인이 제안한 시작값이다.

- **저장**: Supabase Storage의 **비공개 버킷**(`home-covers`, Seoul 리전). 객체 경로는 `{space_id}/{cover_id}.jpg`처럼 공간 ID로 범위를 나눈다. 공개 URL은 만들지 않고, 앱은 RLS로 권한이 확인된 **서명된 URL**(짧은 수명, 예: 1시간)로만 이미지를 받는다. 서명된 URL은 로그·분석에 남기지 않는다.
- **접근 통제(RLS)**: `storage.objects` 정책은 해당 `space_id`의 활성 또는 복구 대기 공간 구성원에게만 읽기를 허용하고, 쓰기·삭제는 활성 공간 구성원에게만 허용한다. 클라이언트에 service-role 키를 두지 않는다. 업로드 전 서버 함수가 구성원·공간 상태를 확인하고 일회용 업로드 주소를 발급한다.
- **형식·크기 제한**: JPG·PNG·HEIC, 원본 20MB 이하(초기 가정). 시스템 사진 선택기(iOS PHPicker, Android Photo Picker)를 써서 사진 보관함 접근 권한을 받지 않는다. 앱은 자르기 영역(커버 비율 고정)을 적용해 긴 변을 제한한 JPG(또는 WebP)로 재인코딩한 뒤 올린다. 서버 함수가 형식·크기·실제 이미지 헤더를 다시 검사하고 다시 인코딩된 사본만 저장한다(HEIC 변환과 최대 해상도는 구현 단계에서 확정).
- **EXIF·메타데이터 제거**: 위치(GPS)·기기 정보·촬영 시각 등 EXIF/XMP를 저장본에서 제거한다. 앱 재인코딩과 서버 재인코딩 중 서버 결과만 신뢰한다.
- **교체·삭제**: 새 사진이 정상 저장된 뒤에만 `HomeCoverPhoto.current_object`를 바꾸는 트랜잭션을 실행하고 이전 객체를 삭제 대기 목록에 넣는다(실패해도 기존 사진 유지). 교체·삭제로 남은 이전 파일은 새 사진 저장이 확인된 뒤 삭제 대기 목록에 넣고 **24시간 뒤 삭제**한다(계획 값, 미적용 preview 보관과 같은 기준). 공간 삭제 배치가 30일 복구 기간 뒤 현재 객체와 대기 목록까지 지운다.
- **동기화**: 변경은 Realtime에 `cover_id` 변경 알림만 보내고 상대는 서명된 URL을 새로 요청한다. 마지막 변경 우선(결정)은 `version`과 서버 시각으로 판단하고, `uploaded_by_user_id`를 홈에 보여 준다(누가 바꿨는지).
- **오프라인**: 마지막으로 받은 사진을 캐시(용량·LRU 제한)해서 보여 주고, 변경은 온라인 전용이다.
- **AI·장면과 분리**: 사진 URL, 객체 경로, 픽셀은 프롬프트·장면 문서·`room-scene.schema.json`·AI 요청에 포함되지 않는다. 장면 검증기는 사진 참조 필드를 거부한다.
- **검수와 신고 없음(결정)**: 사진 검수(자동·수동)와 사진 신고 기능은 두지 않는다. 신고·차단 화면의 대상에 사진은 없다. 이용자 생성 콘텐츠 정책(Apple 1.2, Google Play UGC)에 비공개 두 사람 공간의 사진을 어떻게 설명할지는 법률 검토에서 확인한다(spec Open Decisions 3).
- **접근성·대비**: 사진 위 글자는 앱이 어두운 막과 면을 깔아 대비를 지킨다(디자인 `components.md` 홈 커버). 사진은 장식으로 취급한다.

**저장소**: 확정 — Supabase Postgres(관계형 데이터)와 Supabase Storage 비공개 버킷(홈 커버 사진 한 장). 커플 공간·초대·동의·테마 버전은 관계형 행으로, 확정 테마 스냅샷은 버전이 붙은 JSONB로 저장한다. 로컬은 마지막 확정 스냅샷과 필요한 라이선스 에셋을 캐시한다.

**테스트**: 구현 단계에서 장면/JSON Schema 단위 테스트, 보호 영역 기하 테스트, API 계약 테스트, 두 사용자 권한·동기화 통합 테스트, iOS/Android 기기 UI 및 EAS 내부 빌드 검증을 작성한다. 이 계획 단계에서는 테스트나 앱 코드를 만들거나 실행하지 않는다.

**대상 플랫폼**: iOS 및 Android 휴대전화. 태블릿/웹/PWA는 범위 밖이다.

**성능 목표(제안)**: 장식 16개와 문구 3개까지 60fps 목표를 중급 지원 기기에서 검증한다. 캐시된 장면 첫 표시 1초 이내를 목표로 하며, 서버 AI 응답에는 네트워크 변동이 있으므로 사용자에게 진행/실패 상태를 제공한다. 실제 성능 기준은 디자인 완료 후 프로토타입에서 확정한다.

**제약**: 공유 방은 서버 권한검사 및 동시 편집 제어가 필요하다. 앱은 오프라인에서 마지막 확정 장면과 D-day를 읽기 전용 표시한다. 모델 출력은 서버와 클라이언트가 동일한 스키마·안전 규칙으로 검사한다.

**규모/범위**: 커플 공간당 구성원 2명, 카탈로그 24~36개(현재 디자인은 24개, 마일스톤 제안도 새 오브젝트 0개), 씬당 오브젝트 최대 16개와 짧은 텍스트 최대 3개, 홈 커버 사진 최대 1장(원본 20MB 이하 가정), 마일스톤 보이는 기간 7일(제안). 요청 최대 10회/커플/일.

### 마일스톤 축하 (P2, 앱 안에서만)

- **계산**: 서버가 방의 시간대와 `anniversary_date`로 오늘의 일수를 구하고(당일 = 1일째) 마일스톤 목록(50·100·200·300·365·500·730·1000, 이후 365×N일째)과 비교한다. 별도 스케줄러를 두지 않고 `GET /milestones/current` 호출 때 필요한 `MilestoneCelebration` 행을 멱등하게 만든다(유일 `(space_id, milestone_key)`). 보이는 기간은 당일부터 7일(제안값 N)이고 지나면 `passed`다. 목록과 N은 서버 설정 상수다.
- **구성원별 확인**: `MilestoneSeen`(구성원 본인 행만 RLS). 클라이언트가 카드나 말풍선을 닫으면 `POST …/seen`을 보내고, 오프라인이면 기기에 큐로 저장했다가 연결 후 보낸다(멱등). 상대 확인 상태는 서로 읽지 않으므로 Realtime이 필요 없다. 앱을 열 때와 방 탭에 들어갈 때 `GET /milestones/current`를 한 번 호출한다.
- **함께한 날짜 변경**: `PATCH /anniversary` 트랜잭션 안에서 기록된 마일스톤의 새 `milestone_date`를 계산해 오늘보다 뒤인 것의 행과 확인 기록을 지운다(`milestonesReset`으로 알림). 나머지는 그대로 둔다.
- **기념 제안(프리셋)**: 서버 코드의 상수(`milestone-day`: 케이크·풍선·리본·반짝이 2 + 기념 문구 / `milestone-anniversary`: 선물 추가)이고 카탈로그 기존 오브젝트만 쓴다. 기존 배치 알고리즘과 장면 검증기(16/3 한도, 보호 영역)를 거쳐 후보 장면을 만들고, 기존 `DecorationRequest`(`source: milestone_preset`)로 저장해 confirm 경로를 그대로 쓴다. 우선순위: 케이크 → 리본 → 풍선 → 반짝이 → 선물 → 문구 순으로 자리가 있는 만큼만 놓는다.
- **AI·비용**: 호출하지 않는다. 동의 확인과 일일 10회 계수에 포함하지 않고 AI 요청 이력에도 남기지 않는다. 대신 정형 감사 이벤트(`milestone_preset_previewed`/`_applied`, 키만)를 남긴다.
- **클라이언트**: 홈 카드·방 말풍선·제안 입구 컴포넌트, 마스코트 `cheer` 포즈와 앱 고정 움직임(2.4초 통통, 1.4초 반짝임)은 앱 코드가 정하며 동작 줄이기에서 정지한다. 새 에셋은 없다(카탈로그 24개 그대로).
- **알림은 범위 밖**: 푸시와 로컬 예약 알림은 넣지 않는다. 더하는 경우의 비교는 `research.md` 7.2.

## 헌법 확인

### 설계 전 게이트

- 사용자 안전·개인정보: 동의와 최소 전송 데이터를 별도 엔티티로 보존한다. AI 자격 증명은 서버에만 둔다. 통과.
- 결정론적 경계: 모델은 도구 없이 구조화된 데이터만 반환하며 검증 전후 미리보기에 표시하지 않는다. 통과.
- 접근성·이해 가능성: D-day와 컨트롤은 네이티브 접근성 뷰이며, 미리보기/확인/취소 및 복구를 명시한다. 통과.
- 검증 가능한 변경: 장면 스키마, API, 상태 전이, 검증 계획을 계약 문서로 정한다. 통과.
- 단순한 설계: 적용은 되돌릴 수 없는 한 방향 동작으로 두고(적용 전 미리 보기·확인·취소가 안전장치), 열린 대화 안에서는 이전 후보로 되돌릴 수 있다. 마이그레이션 가능한 스키마 버전을 사용한다. 통과.

### 설계 후 재검토

엔티티와 API 계약은 별도 파일에 고정하며, 서버 검증·클라이언트 렌더 전 검증을 함께 요구한다. 데이터 계약에서 기능 코드나 외부 URL을 배제하고, 앱의 고정 기능과 모델의 표현 제안을 분리했다. 위 원칙과 충돌하지 않음 — 통과.

## 제안 항목과 대안

이 표는 기술 선택의 권고안과 결정 상태를 함께 정리한다. Supabase Seoul region과 Haiku/Sonnet 정책은 캡틴 승인 결정이며 나머지 항목은 별도 확인 전 제안이다. 비교·근거·접근일은 [research.md](./research.md)에 적었다.

| 결정 주제 | 권장안 | 대안 | 권장 이유 / 승인할 사람 |
|---|---|---|---|
| 백엔드·DB·동기화 | Supabase Postgres + RLS + Realtime + Edge Functions; Seoul `ap-northeast-2` | Firebase Auth/Firestore/Functions | 제품 결정으로 확정. Seoul은 사용자 근접성과 데이터 위치 선택을 위한 권장 region이며, data residency가 법률 준수를 단독 보장하지 않으므로 별도 검토한다. |
| 장면 렌더 | Skia 캔버스에 장식 씬, 네이티브 오버레이에 D-day·컨트롤 | RN 기본 View만으로 씬 렌더 | 회전·레이어·다수 오브젝트를 일정하게 처리하면서 접근성 뷰는 네이티브로 유지한다. 디자인 후 구현 적합성 검토. |
| 장면/버전 | 버전 스냅샷 + 현재 버전 포인터, 낙관적 버전 번호 검사. 적용 후 되돌리기와 이용자용 기록은 V1에 없고 스냅샷은 출처 기록·감사·동시성 검사를 위해서만 저장한다 | 현재 버전만 저장 | 제한된 장면 크기에서는 스냅샷이 감사·동시성 관리에 간단하다. 현재 버전만 두면 더 단순하지만 AI 출처·남용 조사 근거가 사라진다. |
| AI 모델 | Haiku 5.5 기본, 품질 실패 사례에 한해 Sonnet 5.5 제한 승급; 제공 개발 credit 사용 | 모든 요청 Sonnet 5.5 | 캡틴이 권장 정책과 개발 credit 사용을 승인했다. 실제 prompt fixture에서 승급 기준 및 운영 지출 상한을 구현 전 정한다. |
| 오프라인 | 마지막 확정 버전과 에셋 캐시, 편집은 온라인 전용 | 오프라인 편집 후 충돌 해결 | 작은 V1에서 동시 편집·복구를 단순하게 유지한다. |
| 자산 권리·전달 | 직접 의뢰한 원본 또는 검증된 CC0 중심, 카탈로그 manifest와 앱 번들/버전 캐시 | 상용 스톡 팩 | 제품이 에셋을 핵심 콘텐츠로 제공하므로 재배포·앱 내 포함 권한을 개별 확인한다. |
| 홈 커버 사진 저장 | Supabase Storage 비공개 버킷 + RLS + 서명된 URL, 서버 재인코딩과 EXIF 제거 | 공개 버킷 + 난수 URL, 별도 이미지 CDN 서비스 | 두 구성원 외에 노출되지 않아야 하고 이미 쓰는 Supabase 권한 모델을 재사용한다. 검수·신고 도구는 두지 않기로 했다. |
| 빌드·배포 | Expo EAS Build/Submit, 내부 테스트 채널, 단계적 스토어 출시 | 자체 CI 빌드 머신 | Expo 워크플로에 맞고 RN 네이티브 앱 배포를 지원한다. 무료 플랜부터 시작 가능. |

## 구현 전 필요한 결정

1. Supabase 조직/프로젝트 소유자 및 운영 지출 상한. Seoul `ap-northeast-2`를 선택 기본으로 확정했다.
2. Anthropic 개발 키를 developer/server secret store에 발급·관리하고 운영 지출 상한을 정한다. 제공된 개발 credit은 확정됐다. 키는 저장소·로그·앱에 기록하지 않는다.
3. 적용 이력(버전 스냅샷)의 보관 상한·정리 기간(이용자에게 보이지 않으므로 감사·남용 조사에 필요한 만큼만)과 공간 종료 때 연결 계정/동의 이력의 법적 삭제 범위. 적용된 prompt/message 원문 30일 보관, 취소/만료 미적용 preview 24시간 보관 후 삭제, room recovery 종료 후 복구 대상 삭제는 기본값이다.
4. 초대받은 사용자의 기존 공간 동시 가입 허용 여부와 로그인 연령/미성년자 제한.
5. 대한민국 AI 표시·개인정보 국외 이전 동의 법률 검토와 두 앱 스토어 신고/차단 운영 책임자.
6. 개발자 계정 소유 주체(개인/법인), bundle ID, 도메인, 연락처·개인정보 처리방침 URL, 그리고 앱 이름의 사용 가능 여부(상표, 앱스토어·Google Play 이름). 앱 이름은 모피루(Mopiru), 캐릭터 이름은 모피(Mopi)로 정해졌지만 이름 확인은 끝나지 않았다. 한국어 '모피'에는 털가죽이라는 뜻도 있어 한국어 카피·스토어 맥락을 확인한다.
7. 폰트 family/weight, 낮/밤 tokens와 license notices, 마스코트 최종 그림(원본이 생성형 AI 도구로 만든 것이라 법률 검토가 필요하고, 일러스트레이터 재작업과 생성 기록 — 프롬프트·버전·날짜·도구 약관 사본 — 보관을 권장)을 확정한다. 카탈로그는 방 안 마스코트 포즈 6 + 일반 오브젝트 18 = 24개로 디자인이 내놨다(`design/assets-spec.md`).
8. prompt session idle timeout 3분은 가정이며 캡틴이 조정할 수 있다. 비점유자의 대화/preview 읽기 전용 및 적용 버튼 점유자 전용도 기본 가정이며, 캡틴이 수정할 수 있다.
9. 홈 커버 사진: 형식·크기 한도(JPG·PNG·HEIC 20MB는 제안), 개인정보·국외 처리 문구(spec.md Open Decisions 1·3). 공유(마지막 변경 우선·변경자 표시), 공간 삭제 시 삭제, 검수·신고 없음은 결정됐다.
10. 마일스톤 축하: 목록(50·100·200·300·365·500·730·1000·이후 매년)과 보이는 기간 7일, 1주년을 365일째로 둘지 달력 날짜로 둘지(spec.md Open Decisions 6), 알림(푸시/로컬 예약)을 어느 버전에 넣을지(Open Decisions 7), 선택 에셋 가랜드 배너(Open Decisions 8).

## 저장소 구조 제안

```text
apps/mobile/                  Expo 앱 (src/app, src/features, src/scene, src/ui)
packages/scene-contract/      공유 JSON Schema와 순수 검증 규칙
supabase/functions/           AI 제안·세션 안 되돌리기·공간 종료/복구·초대 서버 함수
supabase/migrations/          공간·멤버·초대·동의·테마·버전·요청·세션·대화·홈 커버 사진 스키마와 Storage 정책
supabase/seed/                리뷰용 고정 샘플 공간/장면
assets/catalog/               manifest, 권리 기록, 최적화된 이미지
```

현재 저장소에 애플리케이션 코드가 없으므로 이 구조는 제안이며, 구현 시작 때 저장소 소유자가 확정한다.

## 범위 간극

초대 수락과 꾸밈 적용은 공유 공간에 저장한다. prompt-session lease는 보통의 동시 편집을 한 owner로 직렬화하고 상대방에게 shared conversation/preview를 Realtime read-only로 전달한다. 유휴 세션은 만료 후 takeover할 수 있다. version compare와 idempotency guard는 경합 시 중복 적용을 막는 서버 최종 안전장치다. 세션 유휴 제한 시간과 점유자의 read-only 화면 표현은 구현 시 조정 가능한 captain decision으로 남긴다.

## 복잡도 추적

헌법 위반 없음. 별도 서비스 경계는 AI 키를 앱 밖에 두고 공유 데이터의 서버 권한을 강제하기 위해 필요하다.
