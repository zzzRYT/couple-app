# 서비스 계약 제안 (V1)

모든 API는 TLS 및 인증을 요구한다. 앱은 Supabase의 공개 anon key만 사용할 수 있으며 DB의 모든 직접 접근은 RLS로 제한한다. Anthropic·service-role 자격 증명은 앱에 전달하지 않는다. URL은 예시 논리 라우트이며 구현 단계에서 Supabase Edge Function 이름으로 매핑한다.

## 공통 응답 / 오류

- JSON UTF-8. 성공은 2xx, 잘못된 입력은 `400`, 미인증은 `401`, 권한 없음은 정보 누설 없는 `403`, stale version은 `409`, 한도 초과는 `429`, 일시적 장애는 `503`. 이미 다른 **활성** 공간에 속한 사용자의 가입·생성 시도는 `409 ALREADY_IN_SPACE`. 생성·신고 확장(2026-10-27, 가정)의 오류: `422 GENERATION_REFUSED`(입력 정책 거절, `category` 필드는 언어 중립 코드: `ip | people | unsafe | personal | photo_like | off_purpose | injection`), `503 GENERATION_FAILED`(검증·2차 검사·제공자 실패; `retryable: true`, 횟수를 쓰지 않음), `503 GENERATION_DISABLED`(킬 스위치), `409 LIBRARY_FULL`, `429 RATE_LIMITED`(남용 한도·쿨다운, `retryAfterSeconds`), `429 REPORT_RATE_LIMITED`. 계정 삭제(2026-10-27 7차 답변, 가정)의 오류: `401 REAUTH_REQUIRED`(`DELETE /account`에 최근 재인증이 없음), `409 ACCOUNT_DELETING`(삭제가 접수된 계정의 변경 요청). 계정 삭제가 접수된 사용자는 **모든 요청에서 서버가 계정 상태를 확인**해 `401`(읽기 포함)을 받고, 앱은 `401`과 `409 ACCOUNT_DELETING`을 모두 "로컬 로그아웃"으로 처리한다(아래 "계정"). **종료된 공간(`ended`)을 대상으로 한 모든 공간 호출은 존재하지 않는 공간이나 비구성원과 구별되지 않는 `404`로 거절한다**(2026-10-27 5차 답변, 가정: 복구 기능이 없으므로 복구 관련 오류 코드는 없다). 종료된 공간에 대해 클라이언트가 읽을 수 있는 것은 `GET /spaces/mine`의 `ended` 알림뿐이다.
- 오류 형태: `{ "error": { "code": "VERSION_CONFLICT", "retryable": true } }`. `code`는 언어 중립 안정 코드이며 앱이 현재 locale의 번역 리소스에서 사용자 메시지를 찾는다.
- 오류 응답에 사용자 표시용 자연어 문구나 locale별 메시지 키를 넣지 않고 원문 프롬프트를 되풀이하지 않는다. 화면·설정·오류 문구는 앱 번역 리소스에서 제공한다.
- 모든 변경 요청은 `Idempotency-Key` UUID를 받아 중복 tap/retry로 이중 적용되지 않게 한다.
- 구현 중 추가한 공통 코드(2026-10-27): `400 INVALID_REQUEST`, `401 UNAUTHORIZED`, `404 NOT_FOUND`, `403 CONSENT_REQUIRED`(두 구성원 동의 전 AI 요청), `409 SESSION_EXPIRED`(만료된 점유의 heartbeat·요청). `409 SESSION_OCCUPIED` 오류 본문에는 `sessionId`, `ownerUserId`, `expiresAt`이 함께 온다. `409 IN_PROGRESS`(재시도 가능)는 같은 `Idempotency-Key`의 요청이 아직 처리 중일 때다. 서버는 변경 요청을 실행하기 전에 키를 먼저 선점하고, 실패한 요청의 키는 풀어 준다.
- Edge Function 매핑: 앱은 `/functions/v1/{함수}{논리 경로}`를 호출한다. 함수는 `spaces`, `invitations`, `profile`, `prompt-session`, `ai-consent`, `decoration-previews`, `room`이다(`apps/mobile/src/lib/routes.ts`).

## Auth / 초대

인증 방식은 OAuth로 Supabase Auth에 위임한다. 2026-10-27 소유자 결정: 제품 로그인은 Sign in with Apple만(iOS 네이티브 id token → `signInWithIdToken`, 해시 nonce), 카카오는 비활성으로 보류, 이메일 OTP는 제품에서 제거하고 개발 빌드·로컬 스택 전용 테스트 로그인으로만 둔다(가정). API 계약은 Supabase 세션 JWT만 받으므로 공급자가 바뀌어도 바뀌지 않는다. 최소 연령 만 14세는 가입 시작 화면의 확인 문구로 알리고 서버는 생년월일을 받지 않는다(FR-058, 가정). OAuth redirect는 Expo universal link로 복귀한다.

### `POST /spaces`

공간 및 첫 구성원을 하나의 트랜잭션으로 만든다. **한 사용자는 한 번에 하나의 공간에만 속한다(FR-057)**: 이미 **활성** 공간의 구성원이면 `409 ALREADY_IN_SPACE`로 거절한다. **종료된 공간은 소프트 삭제되어 세지 않으므로** 그 사용자는 종료 직후 바로 새 공간을 만들 수 있다(가정, `spec.md` Decided 33).

요청: `{ "anniversaryDate": "YYYY-MM-DD", "timeZone": "Asia/Seoul" }` (`timeZone`은 생성자 기기의 IANA 시간대로 방 시간대의 초기값이다; 구현 중 추가, 2026-10-27. 형식이 틀리거나 미래 날짜·없는 시간대는 `400 INVALID_REQUEST`)

응답 201: `{ "spaceId": "uuid", "status": "active", "memberCount": 1, "anniversaryDate": "YYYY-MM-DD" }`

### `POST /spaces/{spaceId}/invitations`

구성원만 호출 가능. 원문 코드는 응답에서 딱 한 번만 돌려준다.

요청: `{ "expiresInSeconds": 86400 }` (서버는 24시간으로 고정)

응답 201: `{ "invitationId": "uuid", "code": "one-time-secret", "expiresAt": "RFC3339" }`

초대는 발급 시점부터 24시간 후 만료한다. 재발급 시 기존 미사용 초대 코드를 무효화한다. 앱은 OS 공유 시트를 열고 코드/보편 링크를 사용자가 선택해 전달한다.

### `POST /invitations/accept`

요청: `{ "code": "one-time-secret" }`

서버는 해시 대조, 미만료·미사용, 대상 공간 활성·멤버 1명 조건과 **호출한 사용자가 다른 활성 공간의 구성원이 아님**(종료된 공간은 세지 않는다)을 원자적으로 확인하고 가입 후 코드를 즉시 소비한다. 사용자가 이미 다른 활성 공간에 있으면 `409 ALREADY_IN_SPACE`로 거절하고 **코드는 소모하지 않는다**(공간에서 나온 뒤 같은 코드로 다시 시도할 수 있다). 코드 형식은 8자(4-4 표시), 혼동 문자(0/O, 1/I) 제외.

응답 200: `{ "spaceId": "uuid", "status": "active", "memberCount": 2 }`.

초대 실패 코드(구현 중 확정, 2026-10-27; `design/i18n-copy.md`의 대응 표와 같은 이름): `404 INVITE_INVALID`(없는·폐기된·위조 코드), `410 INVITE_EXPIRED`, `409 INVITE_USED`, `409 SPACE_FULL`(이미 두 사람), `409 ALREADY_IN_SPACE`, `429 RATE_LIMITED`(`retryAfterSeconds`, `unlockAt`; 사용자당 시간당 실패 10회, 서버 설정값). 잠금 동안에는 올바른 코드도 거절한다.

### `POST /invitations/preview`

(구현 중 추가, 2026-10-27) 요청: `{ "code": "..." }`. 코드를 소비하지 않고 수락 전 확인 화면(`join.found.*`)에 필요한 값만 돌려준다. 응답 200: `{ "anniversaryDate": "YYYY-MM-DD", "memberCount": 1 }`. 오류와 시도 제한은 `accept`와 같다. 데이터 모델에 표시 이름이 없으므로 상대 이름은 돌려주지 않는다.

## D-day 및 조회

### `GET /spaces/mine`

(제안 · 일관성 점검에서 찾은 빈칸을 메운 것, 2026-10-27 5차 답변으로 개정 · 가정) 앱을 열 때 호출자가 어느 공간으로 들어갈지 정한다. 응답 200: `{ "active": { "spaceId": "uuid" } | null, "ended": { "kind": "ended" | "disconnect" | "account_deleted", "by": "me" | "partner", "at": "RFC3339" } | null }`. `active`는 호출자의 활성 공간 하나(없으면 null). `ended`는 **종료 알림**이다: 호출자가 아직 확인하지 않은 가장 최근 종료 하나(없으면 null; 여럿이면 가장 최근 하나만, 가정). `ended`에는 **공간 데이터도, 사용할 수 있는 공간 식별자도, 삭제 일정도 없고**, 클라이언트가 종료된 공간에 대해 읽을 수 있는 유일한 정보다. `by`는 종료·연결 끊기를 한 사람이 호출자(`me`)인지 상대(`partner`)인지다. `kind = account_deleted`는 상대가 계정을 삭제해 공간이 끝난 경우이며 `by`는 항상 `partner`이고 **삭제한 사람의 이름·식별자는 어디에도 없다**(앱 문구 "상대가 계정을 삭제했어요", 키 `end.byPartnerDeleted`). 삭제한 본인은 로그아웃되므로 이 알림을 받지 않는다. 앱은 `active`가 있으면 그 공간으로 열고, 없고 `ended`가 있으면 종료 화면(S14)을, 둘 다 없으면 공간 만들기(S03)·초대 코드 입력(S05)을 연다. `active`와 `ended`가 둘 다 있으면(종료 직후 새 공간을 시작한 경우) 활성 공간으로 열고 `ended` 안내는 한 번 보인 뒤 확인으로 지운다.

### `POST /spaces/mine/ended/ack`

호출자가 종료 알림을 확인(닫기)했다고 기록한다. 요청 본문 없음. 응답 204, 멱등(확인할 알림이 없어도 204). 이후 `GET /spaces/mine`의 `ended`는 null이 되고 앱은 공간 만들기·코드 입력으로 간다. 상대의 알림에는 영향이 없다. 알림은 늦어도 그 공간의 완전 삭제 때 함께 지워진다.

### `GET /profile/preferences`

응답 200: `{ "locale": "ko-KR" | "en-US" | "ja-JP" | null, "uiTheme": "system" | "light" | "dark" }`. 서버 프로필 설정 API다. 현재 앱의 화면 언어·화면 모드 설정은 계정이 아닌 이 기기에 저장하며 이 API를 읽거나 쓰지 않는다.

### `PATCH /profile/preferences`

요청: `{ "locale": "ko-KR" | "en-US" | "ja-JP" | null, "uiTheme": "system" | "light" | "dark" }`.

레거시 호환 API. 현재 앱은 언어 명시 선택과 `system | light | dark` 화면 모드를 이 기기의 로컬 저장소에 저장한다. 언어 `system`은 기기 언어를 따르고 화면 모드 `system`은 기기 모양을 따른다. 이 값들은 파트너나 다른 기기와 동기화하지 않는다.

### `GET /spaces/{spaceId}/snapshot`

구성원만 접근 가능. 응답은 공간 요약, **`features`**(`{ "generation": true|false, "generatedRender": true|false }`, 원격 설정에서 오며 앱은 이 값으로 화면만 맞춘다), 현재 장면이 참조하는 **생성 오브젝트 문서들**(`generatedObjects`: 검증된 `{id, kind, layerHint, label, createdBy, createdAt, document}`; 운영자가 제거한 것과 호출자가 신고해 숨긴 것(`hiddenObjectIds`)은 걸러서 준다. `generatedRender`가 false이면 비어 있다), 홈 커버 사진 요약(`homeCover`: `status`, `version`, `uploadedBy`, `updatedAt`; 주소는 별도 요청), 현재 버전의 `sceneDocument`, `roomPresentation`, `roomThemeDocument`(낮/밤 자산·색 variant, 모드와 시간대), 현재 `promptSession` owner/expiry 상태, 버전 번호, 카탈로그 버전, 서버 시간으로 구성한다. 기기별 UI 언어·화면 모드는 스냅샷에 포함되지 않는다. 인증 사용자는 해당 공간 구성원이 아니면 공간 존재 여부도 확인할 수 없다. **종료된 공간(`ended`)의 스냅샷은 비구성원과 같은 `404`다**(요약도 없다. 종료 사실은 `GET /spaces/mine`의 `ended` 알림으로만 알린다).

### `PATCH /spaces/{spaceId}/anniversary`

요청: `{ "anniversaryDate": "YYYY-MM-DD", "expectedUpdatedAt": "RFC3339" }`.

D-day 값은 모델 입력으로 보내지 않는다. 변경을 두 구성원에게 sync한다. 잘못된 날짜 또는 stale state는 거절한다. 응답에 `milestonesReset`(다시 축하하게 된 `milestone_key` 목록, 보통 빈 배열)을 포함한다(FR-043).

### `PATCH /spaces/{spaceId}/room-mode`

요청: `{ "mode": "day" | "night" | "follow_time", "timeZone": "Asia/Seoul", "expectedCurrentVersion": 13, "idempotencyKey": "uuid" }`.

방 모드는 커플 공유 설정이며 새 공간 기본은 `follow_time`과 공간 생성자의 저장된 IANA 시간대다. 구성원은 설정에서 모드와 시간대를 변경할 수 있고 변경은 새 version으로 저장된다(`source: room_mode`, 오래된 `expectedCurrentVersion`은 `409 VERSION_CONFLICT`, 프롬프트 세션이 점유 중이면(본인 포함) `mascot-recall`처럼 `409 SESSION_OCCUPIED`). `timeZone`은 `couple_space.time_zone` 하나를 그대로 바꾼다: 방 낮/밤, 일일 요청 한도의 날짜 키, D-day·마일스톤 날짜가 모두 이 값을 쓰므로 변경하면 이 경계들이 함께 이동한다(설계된 동작, 별도 컬럼 없음).

## 마일스톤 축하

앱 안 축하와 기기 로컬 알림 예약에 필요한 목록을 다룬다. **서버 푸시와 푸시 토큰 API는 없다.** 문구는 서버가 보내지 않고 클라이언트의 번역 템플릿을 쓴다.

### `GET /spaces/{spaceId}/milestones/current`

응답 200: `{ "dayCount": 100, "timezone": "Asia/Seoul", "celebration": null | { "id": "uuid", "key": "d100", "kind": "day|anniversary", "days": 100, "anniversaryN": null, "milestoneDate": "YYYY-MM-DD", "daysAgo": 0, "seenByMe": false, "presetAvailable": true, "presetId": "milestone-day" }, "upcoming": [ { "key": "d200", "kind": "day", "milestoneDate": "YYYY-MM-DD" } ] }`.
- 방 시간대 기준 오늘이 마일스톤 당일부터 7일 안인 가장 최근 하나만 준다. 없으면 `celebration: null`. 필요하면 `MilestoneCelebration` 행을 이 호출에서 만든다(멱등).
- `upcoming`은 아직 오지 않은 마일스톤을 날짜순으로 최대 3개 준다. 기기는 이 목록으로 **오전 9시(방 시간대)** 로컬 알림을 예약하고 키를 알림 식별자로 쓴다. 날짜·시간대가 바뀌면 다시 받아 재예약한다. 알림을 켜지 않은 기기도 호출은 같다(예약만 하지 않는다).
- 구성원이 둘이고 공간이 활성일 때만 값이 있다. `seenByMe`가 참이면 카드·말풍선은 보이지 않고, `presetAvailable`(적용 전, 보이는 기간 안)이 참인 동안 방의 제안 입구는 남는다.

### `POST /spaces/{spaceId}/milestones/{celebrationId}/seen`

요청: `{ "via": "home | room" }`. 응답 204. 호출한 구성원의 `MilestoneSeen` 한 행만 만든다(멱등, 오프라인 큐에서 다시 보내도 안전). 상대에게 영향이 없다.

### `POST /spaces/{spaceId}/prompt-session/{sessionId}/milestone-preview`

요청: `{ "celebrationId": "uuid", "locale": "ko-KR | en-US | ja-JP", "idempotencyKey": "uuid" }`(`locale`은 기념 문구 언어이고 알 수 없는 값은 `en-US`). 먼저 기존 `acquire`로 점유를 얻어야 한다. 응답은 `POST decoration-previews`의 성공 응답과 같은 모양(`previewId`, `baseVersion`, 후보 장면)에 `placed`·`requested`(놓은 소품 수/원래 5~6개)를 더한다. AI를 호출하지 않고 동의·일일 한도도 확인하지 않는다.
- 오류: `409 SESSION_OCCUPIED`(상대가 점유 중이거나 내가 점유자가 아님), `410 MILESTONE_PASSED`(보이는 기간이 지났거나 제안이 이미 적용됨), `422 ROOM_FULL`(자리가 전혀 없음), `409 VERSION_CONFLICT`.
- 적용은 기존 `POST decoration-previews/{previewId}/confirm`을 그대로 쓴다. 자동 적용은 없다. 적용되면 `preset_applied_version_id`가 기록된다.

## 마스코트 되살림

### `POST /spaces/{spaceId}/room/mascot-recall`

요청: `{ "expectedVersion": 12, "idempotencyKey": "uuid" }`. 현재 장면에 마스코트가 없을 때만 기본 자리에 하나 추가한 새 방 버전(`source: mascot_recall`)을 만든다. AI·점유·미리 보기 없이 동작하지만, 점유 세션이 활성이면 `409 SESSION_OCCUPIED`로 막는다. 이미 있으면 200으로 현재 버전을 돌려주고(멱등), 16개 한도가 가득이면 `422 ROOM_FULL`. 오래된 `expectedVersion`은 `409 VERSION_CONFLICT`.

## 홈 커버 사진

공간당 최대 한 장. 점유 세션이 필요 없다. 사진은 `sceneDocument`, 프롬프트, AI 요청에 포함되지 않는다. **마지막으로 바꾼 사용자의 사진이 반영**되고(마지막 변경 우선) 홈에는 누가 바꿨는지를 보여 준다. 검수·신고 API는 없다. 형식·크기·주소 수명 값은 제안이며 구현 때 조정한다.

### `POST /spaces/{spaceId}/home-cover/upload-url`

활성 공간 구성원만. 요청: `{ "contentType": "image/jpeg" | "image/png" | "image/heic", "byteSize": 1234567 }`. 허용 형식·크기(20MB 이하) 위반은 `400 COVER_FORMAT_UNSUPPORTED` / `400 COVER_TOO_LARGE`. 응답 201: `{ "uploadId": "uuid", "uploadUrl": "signed-url", "expiresAt": "RFC3339" }` (일회용, 5분 수명). `uploadUrl`은 `home-cover` 함수의 서명된 `PUT …/home-cover/upload/{uploadId}` 주소이고, 요청한 `contentType`과 정확히 `byteSize` 바이트만 받는다. 확정 단계는 JPEG·PNG만 받으므로 HEIC는 앱이 올리기 전에 JPEG로 바꾼다(`docs/spikes/heic.md`). 공간이 `ended`이면 `404`(종료된 공간).

### `PUT /spaces/{spaceId}/home-cover`

업로드 완료 확정. 요청: `{ "uploadId": "uuid", "crop": { "x": 0.0, "y": 0.1, "width": 1.0, "height": 0.6 } }` + `Idempotency-Key`. 서버가 실제 이미지 헤더·크기·형식을 검사하고 EXIF/XMP를 제거한 사본으로 재인코딩해 저장한 뒤 `version`을 올린다. 응답 200: `{ "status": "ready", "version": 4, "uploadedBy": "uuid", "updatedAt": "RFC3339" }`. 검사·변환 실패는 `422 COVER_INVALID_IMAGE`. **마지막 변경 우선**이라 동시에 올려도 `409`로 막지 않고 나중에 확정된 쪽이 반영되며 `version`이 올라간다(먼저 올린 쪽은 다음 동기화 때 바뀐 사진과 변경자를 본다). 실패해도 기존 사진은 그대로다.

### `GET /spaces/{spaceId}/home-cover`

구성원만. 응답 200: `{ "status": "ready" | "none", "version": 4, "signedUrl": "short-lived-url", "signedUrlExpiresAt": "RFC3339", "crop": {…}, "uploadedBy": "uuid", "updatedAt": "RFC3339" }`(`uploadedBy`는 마지막으로 바꾸거나 없앤 사용자). `none`이면 기본 바탕이다. 서명된 URL은 로그에 남기지 않는다.

### `DELETE /spaces/{spaceId}/home-cover`

사진을 없앤다(`status: none`, 없앤 사용자를 `uploadedBy`에 기록). 응답 204. 이전 객체는 삭제 대기 목록에 들어가 24시간 뒤 삭제된다. 공간이 종료되면 사진은 즉시 읽을 수 없고(`GET`·서명 주소 `404`), 서버의 완전 삭제 작업이 객체도 함께 지운다.

오류 코드는 언어 중립이며 앱 번역 리소스가 문구를 고른다(`i18n-copy.md`의 `cover.*`).

## 공유 프롬프트 세션 및 AI 미리보기

두 구성원은 공유 prompt conversation과 preview를 읽는다. 한 명만 입력·요청·적용을 점유할 수 있다. 유휴 lease는 3분(만료 30초 전 경고, 서버 설정값)이며 최근의 의미 있는 사용자 활동에 맞춰 heartbeat를 갱신한다. 앱이 닫히거나 유휴 상태면 만료 후 takeover 가능하다.

### `GET /spaces/{spaceId}/prompt-conversation`

두 구성원 모두 사용자 prompt, preview 및 status 메시지를 시간 순서대로 읽는다. 권한이 있는 API는 메시지 ID, author, content, preview reference, 현재 점유 상태(`session`: `sessionId`, `ownerUserId`, `status`, `expiresAt`, `warnAt`, `idleSeconds`, `warnSeconds`), 현재 미리 보기, 서버 시각(`serverTime`; 앱이 시계 차이를 보정하는 데 쓴다)을 반환한다. 아직 생성 중인 요청의 `preview` 메시지에는 `stage`(`generating` | `repairing`)가 붙는다.

### `POST /spaces/{spaceId}/prompt-session/acquire`

요청: `{ "idempotencyKey": "uuid" }`.

활성 점유가 없을 때 lease를 만든다. 가장 최근 session이 만료됐고 아직 유효한 미리 보기가 있으면 새 session을 만들지 않고 **같은 session을 이어 간다**(원래 owner는 되살리기, 다른 구성원은 takeover와 같은 결과로 `takeoverCount` +1). 201 응답: `{ "sessionId": "uuid", "ownerUserId": "uuid", "expiresAt": "RFC3339", "warnAt": "RFC3339", "idleSeconds": 180, "warnSeconds": 30 }`. 다른 구성원이 유효하게 점유 중이면 `409 SESSION_OCCUPIED`와 session/owner/expiry를 반환한다. 동시 요청은 단일 DB 원자 연산으로 한 명만 승자로 선택한다.

### `POST /spaces/{spaceId}/prompt-session/{sessionId}/heartbeat`

현재 owner만 호출할 수 있다. 최근 입력/생성 활동이 있으면 서버 시각 기준으로 lease를 3분 연장한다. 서버도 미리 보기 요청 시작·결과 저장(`store_preview`)·되돌리기에서 lease를 연장한다. 앱은 입력, 현재/후보 전환, 확인 창 열기, "계속하기"를 활동으로 보내고, 열린 미리 보기를 보고 있는 동안에는 시트가 보이는 한 heartbeat를 계속 보낸다. heartbeat가 멈추면 expiry 후 점유권은 만료된다. 만료는 API 호출이 없어도 `expire_stale_sessions()`(1분 주기 pg_cron, 오너 설정)가 `session` 이벤트(`status: expired`)와 함께 처리한다. 스냅샷의 `promptSession`은 만료된 lease를 `status: "expired"`로 돌려주고(미리 보기 유효 시간이 지나면 사라진다), 시트를 닫을 때 미리 보기나 진행 중인 요청이 없으면 앱이 `release`를 호출한다.

### `POST /spaces/{spaceId}/prompt-session/{sessionId}/takeover`

요청: `{ "expectedOwnerUserId": "uuid", "idempotencyKey": "uuid" }`.

lease 만료 후 다른 구성원이 호출한다. 서버는 만료와 예상 owner를 원자적으로 확인하고 같은 session ID의 owner를 요청자로 교체한다. 대화/preview는 유지된다. lease가 유효하면 `409 SESSION_OCCUPIED`다.

### `POST /spaces/{spaceId}/prompt-session/{sessionId}/release`

현재 owner만 cancel 사유로 호출한다. `{ "reason": "cancel" }`. 응답 204. confirm endpoint는 성공한 저장과 함께 같은 transaction에서 session을 해제한다. 열린 대화 안의 되돌리기(undo)는 session을 해제하지 않는다.

## 동의 및 AI 미리보기

### `PUT /spaces/{spaceId}/ai-consent`

요청: `{ "state": "granted" | "revoked", "noticeVersion": "ai-overseas-v1" }`.

인증 사용자의 동의만 기록한다. 권장 정책은 **두 멤버 모두 granted**일 때 AI 요청 허용. 상태 변경 시 감사 이벤트를 남긴다. 철회 시 대기 요청과 미적용 preview를 무효화한다.

### `POST /spaces/{spaceId}/decoration-previews`

생성 요청은 자동 재시도하지 않는다. 앱은 75초 안에 응답이 없거나 연결이 끊기면 대화를 다시 읽어 결과를 확인한다. 서버는 모델 호출 단계를 `message` 이벤트(`generating`, `repairing`)로 알리고, 생성 중에 취소하면 그 요청의 하루 한도 예약을 돌려준다.

요청:

```json
{
  "prompt": "따뜻하고 편안한 방, 작은 별과 책을 놓아 줘",
  "sessionId": "uuid",
  "baseVersion": 12,
  "idempotencyKey": "uuid"
}
```

현재 점유자만 호출할 수 있다. 서버가 구성원/활성공간/동의/**킬 스위치/보관함 여유/시도 한도**/일일 한도(남은 성공 횟수 확인)/유효 session owner/현재 버전/프롬프트 길이를 확인한 뒤 **입력 정책 검사**(결정론 필터 + 분류 호출)를 통과한 요청만 Anthropic에 보낸다. 요청에 새 장식 생성이 필요하면(서버가 의도를 분류: `catalog | generate | mixed`) 기준 라이브러리를 스타일 앵커로 함께 주고, 결과를 형식 검증·정규화한 뒤 별도 호출로 2차 검사한다(`ai-guardrails.md`). 한국어·영어·일본어 prompt를 허용하고 결과 문구도 요청 언어를 보존한다. 사용자 prompt, preview, status message는 공유 대화에 저장하고 두 구성원에게 Realtime 갱신을 보낸다. 상대 구성원은 대화와 preview를 live read-only로 보고 입력·제출·적용할 수 없다. Realtime payload에는 message/preview ID와 상태만 보내며 내용은 권한 확인된 conversation API에서 읽는다. 모델에는 prompt 외 최소한의 현재 scene JSON, 낮/밤 테마 허용 토큰, D-day 표현 허용 토큰, 장면 viewport profile, 카탈로그의 ID/설명만 보낸다. 날짜, 사용자 식별자, 초대 코드, 이메일, 기타 공간 데이터는 보내지 않는다.

성공 201: `{ "previewId": "uuid", "baseVersion": 12, "sceneDocument": {}, "roomPresentation": {}, "roomThemeDocument": {}, "generatedObjects": [ { "id": "uuid", "kind": "background_piece", "layerHint": "wall", "label": "구름 줄무늬", "document": {} } ], "expiresAt": "RFC3339", "validation": { "status": "passed", "warnings": [] } }`(`generatedObjects`는 새로 만든 후보만, 최대 2개; `candidate` 상태로 저장되어 두 구성원이 읽는다). **성공한 미리 보기만 하루 3회에 센다**(가정): 이 응답을 돌려주는 트랜잭션에서 횟수를 올린다. 상대도 같은 preview를 읽기 전용으로 실시간 확인한다.

거절/검증 실패는 공유방을 건드리지 않고, `422 UNSUPPORTED_REQUEST`(지원하지 않는 카탈로그 요청), `422 INVALID_CANDIDATE`(카탈로그 장면 검증 실패), `422 GENERATION_REFUSED`(생성 입력 정책 거절; 한 프롬프트에 허용 부분과 위반 부분이 섞이면 전체 거절), `503 GENERATION_FAILED`(재시도 1회 뒤에도 실패), `503 GENERATION_DISABLED`, `409 LIBRARY_FULL`, `429 RATE_LIMITED`로 응답한다. **거절·실패·제한은 하루 횟수를 쓰지 않는다**(`quota_consumed=false`, 가정). 출력 검증 repair는 최대 1회. 모델/repair 원문은 오류나 일반 로그에 포함하지 않는다.

### `POST /spaces/{spaceId}/decoration-previews/{previewId}/confirm`

요청: `{ "baseVersion": 12, "sessionId": "uuid", "idempotencyKey": "uuid" }`.

현재 점유자만 적용할 수 있다. 서버는 space/session owner/preview/유효기간/base version을 확인하고 idempotency와 현재 version 비교, 새 불변 버전 저장, session release를 하나의 원자적 transaction으로 처리한다. 동시 apply 또는 stale retry는 `409 SESSION_CONFLICT` 또는 `409 VERSION_CONFLICT`이며 중복 저장하지 않는다. 점유 규칙은 정상 흐름을 직렬화하고 version guard는 서버 최종 안전장치다.

응답 201: `{ "appliedVersion": 13, "source": "prompt", "updatedAt": "RFC3339" }`. 후보가 만든 생성 오브젝트는 같은 트랜잭션에서 `candidate → active`가 되고 보관함 상한(서버 설정값 `generation_library_cap`, 기본 40)을 다시 검사한다(넘으면 `409 LIBRARY_FULL`로 적용하지 않는다). 취소·되돌림·만료된 후보 장식은 24시간 뒤 삭제된다.

### `DELETE /spaces/{spaceId}/decoration-previews/{previewId}?sessionId={sessionId}`

현재 점유자만 취소할 수 있다. cancel 요청은 후보를 공유 장면에 적용하지 않고 session을 release한다. 다른 구성원은 취소/적용 컨트롤이 없는 읽기 전용 preview를 본다.

## 생성 오브젝트 보관함 (2026-10-27 · 가정)

### `GET /spaces/{spaceId}/generated-objects`

활성 공간 구성원만. 커플 보관함의 `active` 장식 목록 `[{ id, kind, layerHint, label, createdBy: "me"|"partner", createdAt, inUse: boolean, reportState: null | "received" | "reviewed", document }]`(호출자가 신고해 숨긴 것과 운영자가 제거한 것은 `hidden`/`removed`로 걸러서 주지 않는다). `document`는 검증된 데이터이며 썸네일을 그리는 데 쓴다. 다른 공간의 장식은 어떤 경우에도 나오지 않는다.

### `GET /spaces/{spaceId}/generated-objects/{objectId}`

한 장식의 상세(위 항목 + 만든 사람·시각). 장식 상세 시트가 쓴다. 다른 공간의 ID는 `404`(존재 여부를 알리지 않는다).

### `DELETE /spaces/{spaceId}/generated-objects/{objectId}`

활성 공간 구성원만. `active` 장식을 지운다(`status=deleted`). **방(현재 장면)에 놓여 있어도 지울 수 있고** 장면 버전은 바뀌지 않으며 읽을 때 걸러낸다(두 사람 화면에서 사라짐; 앱의 확인 창이 "방에서도 사라져요"를 알린다). 응답 204. 점유 세션은 필요 없다.

## 되돌리기 (열린 대화 안에서만)

되돌리기는 지금 열린 프롬프트 대화(점유 세션) 안에서 **아직 적용하지 않은 변경**을 바로 앞 미리 보기로 돌리는 것뿐이다. 적용한 변경은 되돌릴 수 없고 다시 적용(redo)도 없다. 이전 설계의 방 버전 되돌리기(`POST theme-versions/undo`)와 버전 목록 조회·지정 버전 복구(`GET theme-versions`, `POST theme-versions/{versionId}/restore`)는 V1에 없다. 서버는 감사 기록으로 버전 스냅샷을 계속 저장하지만 이를 읽거나 되돌리는 API는 두지 않는다.

### `POST /spaces/{spaceId}/prompt-session/{sessionId}/undo`

요청: `{ "expectedPreviewId": "uuid", "idempotencyKey": "uuid" }`.

현재 owner만 호출한다. 열린 대화의 최신 미리 보기(`expectedPreviewId`)를 `reverted`로 바꾸고 바로 앞 미리 보기를 현재 후보로 돌려준다. 앞 후보가 없으면 `previewId: null`(현재 방 보기)이다. 방 버전은 바뀌지 않고 점유도 풀지 않는다. 응답 200: `{ "previewId": "uuid" | null }`. 되돌릴 후보가 없으면 `409 NOTHING_TO_UNDO`, 이미 되돌려졌거나 미리 보기가 바뀌었으면 `409 PREVIEW_CHANGED`(최신 미리 보기를 응답에 담지 않고 대화를 다시 읽게 한다). 두 구성원은 같은 미리 보기를 Realtime으로 본다. 적용된(`applied`) 요청에는 호출할 수 없다(`409 ALREADY_APPLIED`).

## 공간 종료 (소프트 삭제 · 복구 없음)

(2026-10-27 5차 답변, 가정, `spec.md` Decided 33~35) 이용자용 복구 API는 없다.

### `POST /spaces/{spaceId}/end`

공간 구성원 중 누구나 호출 가능. `{ "confirm": true }` + `Idempotency-Key`. 한 트랜잭션에서 공간 `status`를 `ended`로 바꾸고(`ended_at`, 내부 `purge_after`, `ended_reason = ended`, `ended_by_user_id`), 두 구성원의 `space_active`를 false로 바꾸고, 두 구성원의 종료 알림을 만든다. 초대·AI·편집·조회를 **즉시** 모두 막는다(두 구성원 모두 스냅샷·프롬프트·생성 장식·홈 커버·마일스톤·신고·실시간 구독이 끊긴다). 응답 200: `{ "status": "ended" }`. **삭제 일정이나 기간은 응답에 없다.** 이미 종료된 공간(또는 상대가 먼저 종료한 공간)에 호출하면 `404`이고 앱은 종료 알림(`GET /spaces/mine`)으로 이동한다. 이후 호출자는 곧바로 새 공간을 만들거나 초대를 수락할 수 있다. 계정 삭제(`DELETE /account`)도 같은 서버 함수(`end_space`)로 활성 공간을 종료한다(`ended_reason = account_deletion`).

## 신고와 연결 끊기 (FR-059)

### `POST /spaces/{spaceId}/reports`

구성원이 호출한다. `{ "target": "partner" | "shared_text" | "room_scene" | "generated_object", "reason": "harass" | "inappropriate" | "privacy" | "copyright" | "other", "detail?": "string(≤200)", "messageId?": "uuid", "objectId?": "uuid" }`. `target=generated_object`이면 `objectId`가 필요하고(같은 공간의 장식이 아니면 `404`) 사유는 `copyright | inappropriate | privacy | other`만 쓴다. 응답 201: `{ "reportId": "uuid", "hiddenForReporter": true|false }`(생성 장식 신고는 true: 신고자의 읽기에서 그 장식이 바로 걸러진다. 상대의 읽기는 운영 검토 전까지 그대로다). 같은 사용자의 같은 장식 신고는 멱등(기존 신고를 돌려준다). 사용자당 하루 10건을 넘으면 `429 REPORT_RATE_LIMITED`(가정). 홈 커버 사진은 신고 대상이 아니다(Open Decisions 12). 신고 접수·처리는 운영 연락처(공개 지원 이메일, 아직 없음)와 PoC의 수동 검토(`docs/operator-review-runbook.md`)로 이어진다.

구현 메모(US5): 지금은 `target = partner | shared_text | room_scene`, `reason = harass | inappropriate | privacy | other`만 받는다(`generated_object`·`copyright`는 US9에서 확장). 응답은 `201 { reportId, hiddenForReporter: false }`이다. `messageId`는 `shared_text`에서만 허용되고 같은 공간의 메시지여야 한다(아니면 `404`). 하루 한도는 사용자당 최근 24시간 10건(서버 설정 `report_daily_limit`)이고 넘으면 `429 REPORT_RATE_LIMITED`(재시도 불가). 비구성원·종료된 공간은 둘 다 `404`다(위 공통 규칙대로 비구성원과 구별되지 않는다). 신고자는 RLS로 자기 신고만 읽는다.

### `GET /spaces/{spaceId}/reports/mine`

호출자 본인의 신고만 `[{ reportId, target, objectId?, status: "received" | "reviewed", outcome: null | "removed" | "kept", createdAt, notified: boolean }]`로 돌려준다(상대의 신고·사유·메모는 절대 노출하지 않는다). 앱은 이 값으로 장식 상세의 "신고했어요 · 접수됨 / 검토를 마쳤어요" 상태를 그린다.

### `POST /spaces/{spaceId}/reports/{reportId}/seen`

신고자가 "검토를 마쳤어요" 안내를 한 번 봤다고 기록한다(`reporter_notified_at`). 응답 204, 멱등. 운영자가 제거를 결정해 장식이 방에서 빠진 경우 **두 구성원**에게 "검토 결과 이 장식은 방에서 빠졌어요" 안내가 한 번씩 보이며(구성원별 확인 기록, 마일스톤 확인과 같은 방식), 신고자가 누구인지는 상대에게 알리지 않는다.

### 운영자 내부 계약 (클라이언트 API 아님)

운영자 조치는 앱·anon 키로 호출할 수 없는 서버 전용 함수(`review_report(report_id, outcome, note)` → 신고 `reviewed`, `outcome=removed`이면 `GeneratedObject.status=removed_by_operator`와 `GenerationBlock` 생성을 한 트랜잭션으로, `set_generation_block(space_id, until, reason)`, `set_app_config(key, value)`)로만 한다. PoC에서는 Supabase 대시보드 SQL과 `docs/operator-review-runbook.md` 절차로 수동 실행한다.

### `POST /spaces/{spaceId}/block`

**화면 이름은 "연결 끊기"(예전 "차단")이고 엔드포인트 이름은 `block`을 유지한다**(계약 이름을 불필요하게 바꾸지 않기 위해). 구성원이 호출한다. `{ "confirm": true }`. 상대의 접근을 즉시 끊고 공간을 종료한다(`POST /end`와 같은 소프트 삭제, 종료 이유 `disconnect`, `ended_by_user_id` = 호출자). 복구는 없다. 이 호출은 신고와 별개이고 신고를 만들지 않는다. 응답은 `/end`와 같다(200 `{ "status": "ended" }`, 일정 없음)이며 앱은 확인 창에서 이 결과를 미리 알린다. 비구성원은 다른 모든 호출처럼 `404`이다(태스크 T091의 "403" 대신 공통 규칙을 따른다). 종료 순간 같은 비공개 채널로 `member` 이벤트 `{ kind: 'ended' }`가 나가 상대 앱이 바로 새로고침하고 종료 안내로 이동한다.

## 계정 (삭제, 2026-10-27 7차 답변 · 가정, FR-070~FR-074)

### `DELETE /account`

호출자 본인의 계정을 삭제한다(되돌릴 수 없음). 요청: `{ "confirm": true, "reauth": { "provider": "kakao" | "apple" | "email", "authorizationCode?": "string" } }` + `Idempotency-Key`. `authorizationCode`는 `provider = apple`일 때 필수다(재인증 때 Sign in with Apple로 받은 일회용 코드; 서버가 토큰으로 바꿔 revoke에 쓴다). 일부 클라이언트·프록시가 DELETE 본문을 버릴 수 있으므로 같은 계약을 `POST /account/deletion`으로도 받는다(앱은 이 경로를 쓴다, 2026-10-29 구현).

서버는 ① 호출자의 **최근 재인증**(최근 로그인 시각, 기본 5분, 가정; 인증 토큰의 인증 방법 시각을 확인하며 구현 전에 확인) ② `reauth.provider`가 계정의 로그인 공급자와 일치함 ③ Apple이면 코드 교환 성공을 확인한 뒤, 한 트랜잭션(`begin_account_deletion`)으로 접수한다(사용자 `deleting`, 활성 공간 종료 `account_deletion`, 대기 초대 폐기, 점유·열린 세션 해제와 생성 요청 폐기, 세션 무효화, 개인 필드·동의 기록 삭제). 이후 단계(이 사용자가 속했던 공간의 즉시 완전 삭제 → 공급자 해제 → 인증 사용자 삭제)는 서버가 이어서 처리한다(아래 "내부 작업", Decided 47). 최근 재인증은 검증된 JWT의 `amr` 중 가장 최근 시각(없으면 `iat`)이 5분 안인지로 보고, 공급자 일치는 JWT `app_metadata.provider`로 본다.

- 응답 `202`: `{ "state": "requested" }` — "접수됨"을 뜻하는 고정 값이며 내부 진행 단계를 알려 주지 않는다. 클라이언트는 **응답을 받으면 바로 로컬에서 로그아웃**하고(세션·예약 알림 전체 취소·로컬 캐시 삭제) 로그인 화면으로 간다. **접수 뒤에는 진행 상태를 묻는 API가 없다**(로그아웃 상태이므로).
- `400`: `confirm`이 true가 아님, 알 수 없는 `provider`, Apple인데 `authorizationCode` 없음.
- `401 REAUTH_REQUIRED`: 최근 재인증이 없음·만료·공급자 불일치·Apple 코드 교환 실패. 아무것도 바뀌지 않는다. 앱은 본인 확인 단계로 돌아간다(이 `401`은 세션 만료로 처리하지 않는다).
- `503 PROVIDER_NOT_CONFIGURED`: 공급자 해제에 필요한 서버 비밀이 없음(Apple 팀 ID·키 ID·개인 키, 카카오 admin 키 또는 숨김 플래그 꺼짐). 접수 전에 거절하므로 아무것도 바뀌지 않는다(앱: `acct.delete.fail.*`).
- `409 ACCOUNT_DELETING`: 삭제가 이미 접수된 계정이 **다른 변경 요청**(`POST`/`PUT`/`PATCH`/`DELETE`)을 보낸 경우(발급된 토큰이 아직 유효한 짧은 시간). 접수 트랜잭션 자체는 멱등이다(같은 사용자의 두 번째 접수는 같은 `{state:'requested'}`). 다만 접수 뒤의 재시도는 세션 무효화와 요청마다의 계정 확인 때문에 보통 `401`을 받는다(2026-10-29 구현). 앱은 접수 요청에 대한 `401`(`REAUTH_REQUIRED` 제외)을 로컬 로그아웃으로, `409 ACCOUNT_DELETING`을 접수 완료로 처리한다.
- 접수 전 서버·네트워크 오류는 `503` 등 일반 오류이고 아무것도 바뀌지 않는다(앱: `acct.delete.fail.*`). 오프라인에서는 호출하지 않는다.
- **접수 뒤 이 사용자의 다른 모든 호출은 `401`**이다: 세션·리프레시 토큰이 서버에서 무효가 되고, 이미 발급된 JWT가 만료 전이어도 서버가 요청마다 `account_deletion` 행 존재(`account_blocked`)를 확인해 거절한다(읽기 포함). 위 `409 ACCOUNT_DELETING`은 변경 요청이 접수 트랜잭션과 겹쳐 사용자 락을 늦게 잡은 경우의 정확한 응답이다. 앱은 둘 다 로컬 로그아웃으로 처리한다.
- 상대의 공간은 접수와 같은 순간에 종료된다: 상대의 모든 공간 호출은 종료된 공간으로서 `404`이고 `GET /spaces/mine`의 `ended`가 `{ "kind": "account_deleted", "by": "partner", "at": … }`가 된다. 공간 행은 곧바로 완전 삭제되지만 이 알림은 공간 식별자·삭제한 사람 없이 남는다(Decided 47).
- 개인정보: 요청·응답·로그에 인증 코드·토큰·이메일을 남기지 않는다.

## 내부 작업 (클라이언트 API 아님)

앱·anon 키로 호출할 수 없는 서버 전용 예약 작업이다. 위 운영자 내부 계약과 같이 service-role 서버 함수로만 돈다.

### 완전 삭제 작업 `purge_expired_spaces()` (Edge Function `lifecycle-sweep`)

- 스케줄러가 주기적으로(최소 하루 1회) 호출한다. `status = 'ended' and purge_after <= now()`인 공간마다 **공간 단위로** ① Storage 객체(홈 커버 현재 객체와 삭제 대기 목록)를 먼저 지우고 ② 그 공간의 모든 행(공간·구성원·초대·방 테마와 버전·꾸밈 요청·프롬프트 세션과 메시지·홈 커버 사진·마일스톤·생성 장식·생성 시도·그 공간의 신고·일일 요청 행·종료 알림)을 한 트랜잭션으로 지운다.
- 구현(US5): DB 쪽은 `due_purge_spaces(at)`(대상 목록) → `mark_purge_started` → (Edge Function이 Storage 객체를 비공개 버킷 `home-cover`의 `<spaceId>/…` 접두사로 찾아 지움) → `purge_space(spaceId, at)`(한 트랜잭션, 기한 전이면 `false`)로 나뉜다. Storage는 SQL 밖이라 단일 `purge_expired_spaces()` 대신 이 순서를 `lifecycle-sweep`이 돌린다. 한 번에 최대 50개 공간이고, 한 공간의 실패는 다른 공간을 막지 않는다. 방 버전 불변 트리거는 `purge_space` 안에서만 해제된다. 같은 실행에서 교체·삭제 뒤 24시간이 지난 이전 커버 객체와 만료된 업로드 임시 객체도 지우며, 이 정리가 실패해도 완전 삭제는 계속된다. 응답: 기존 정리 결과에 `coverObjectsDeleted`, `purged`, `failed`가 더해진다. **스케줄은 아직 걸지 않았다**(소유자 결정 대기).
- 멱등이고 재시도에 안전하다. 실패하면 공간은 `ended` 그대로(이미 클라이언트에 보이지 않음) 남아 다음 실행에서 다시 시도한다. 부분적으로 삭제되어 보이는 상태는 없다.
- 내용 없는 `deletion_started`/`deletion_completed` 이벤트만 남긴다(`space_lifecycle_event.space_id`의 외래 키를 없애 공간이 지워진 뒤에도 남고, 삭제 때 앞선 `ended` 이벤트의 `actor_user_id`와 `metadata`도 비운다). `generation_block` 지문(개인정보 없음)은 지우지 않는다. 신고 행을 증거로 오래 둘지는 열린 질문(기본 가정: 함께 삭제, `spec.md` Open Decisions 21).
- `purge_after`는 서버 설정값(종료 + 30일)이며 어떤 API 응답에도 나가지 않는다.

### 계정 삭제 실행기 (Edge Function `lifecycle-sweep` 확장 + `account` 함수의 백그라운드 단계)

- `DELETE /account` 핸들러는 접수(`begin_account_deletion`)까지 동기로 끝내고 나머지 단계를 같은 요청 안에서 한 번 시도한 뒤 결과와 상관없이 `202`를 낸다. 안전망으로 `lifecycle-sweep`이 실행될 때마다 `due_account_deletions(at)`의 행을 **지수 백오프**(`next_attempt_at`, 상한은 설정값)로 다시 실행한다(단계: `requested` → 속했던 공간 즉시 완전 삭제 → `space_ended` → 공급자 해제 → `provider_revoked` → 참조 정리·프로필 삭제·`deleteUser` → `auth_deleted` → 보관 자격 삭제 → `done`). 두 실행기가 겹치지 않도록 `claim_account_deletion`이 짧은 임대(`locked_until`)를 잡고, 단계 전이는 `advance_account_deletion(user, from, to)`의 비교 후 갱신이다. 스케줄 자체는 아직 걸지 않았다(소유자 결정: 출시 전에 Vault 키 + pg_cron). 단계마다 `state`·`attempts`·`last_error_code`만 기록하고 서버 재시작 후에도 그 상태에서 이어서 끝낸다(멱등: 이미 해제된 공급자 연결, 이미 지워진 인증 사용자는 성공으로 본다).
- **공급자 해제 재시도**: Apple은 `provider_credential_enc`(최대 24시간)로 revoke를 재시도하고 시간 초과·반복 실패는 내용 없는 운영 경고만 남긴다. 카카오는 인증 사용자 identity에서 대상 ID를 읽어 unlink를 재시도한다(`deleteUser`가 그 뒤 단계라서 identity가 남아 있다). 계속 실패해도 계정은 이미 접근 불가이며 이용자에게 보이는 상태는 바뀌지 않는다.
- **껍데기 없음(Decided 47)**: 속했던 공간이 모두 지워진 뒤 `finish_account_deletion`이 남은 참조(`actor_user_id`·`ended_by_user_id`·알림의 `by_user_id`)를 비우고 프로필 행을 지운 다음 `deleteUser`를 부른다. `account_deletion` 행은 개인 내용 없이 `done`으로 남는다(멱등 판단용).
- **앱 밖 요청(운영자)**: `POST /account/operator-deletion` `{ "userId": "uuid" }`는 service-role 키로만 호출한다(운영 런북). 같은 상태 기계를 `origin = operator`로 시작하며 Apple 재인증 코드가 없으므로 revoke 대신 `last_error_code = APPLE_TOKEN_UNAVAILABLE`만 남기고 다음 단계로 간다.
- 서비스 키는 서버 함수에만 있다. Apple 서비스 키·카카오 앱 비밀 키는 서버 비밀 저장소에만 두고 로그·응답에 넣지 않는다.

## 실시간 업데이트

채널은 인증 주체가 구성원인 `space_id`만 구독 가능하다. 홈 커버 변경은 `cover_version`과 변경 종류(`changed | removed`)만 알리고 상대가 서명된 URL을 다시 요청한다. 이벤트 payload에는 현재 테마 버전 ID/번호, 변경 종류, 변경자, 시각, session owner/expiry, message/preview ID만 둔다. prompt/AI 출력 본문과 개인 식별자는 broadcast에 넣지 않는다. 두 구성원은 권한검사된 conversation API로 shared text/preview를 읽는다. 탈퇴/종료/삭제/토큰 만료/계정 삭제 접수(세션 무효화) 시 구독을 끊는다.

### Invite URL contract (assumption)
`https://aroom.jinjinstar.com/i/<4-4 code>` and `aroom://invite/<4-4 code>` carry the existing invitation secret, not a new API token. The existing preview and accept endpoints remain authoritative for expiry, usage and membership. URLs are sensitive and must not be sent to analytics or logged.
