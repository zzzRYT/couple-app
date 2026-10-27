# 서비스 계약 제안 (V1)

모든 API는 TLS 및 인증을 요구한다. 앱은 Supabase의 공개 anon key만 사용할 수 있으며 DB의 모든 직접 접근은 RLS로 제한한다. Anthropic·service-role 자격 증명은 앱에 전달하지 않는다. URL은 예시 논리 라우트이며 구현 단계에서 Supabase Edge Function 이름으로 매핑한다.

## 공통 응답 / 오류

- JSON UTF-8. 성공은 2xx, 잘못된 입력은 `400`, 미인증은 `401`, 권한 없음은 정보 누설 없는 `403`, stale version은 `409`, 한도 초과는 `429`, 일시적 장애는 `503`. 이미 다른 **활성** 공간에 속한 사용자의 가입·생성 시도는 `409 ALREADY_IN_SPACE`. 복구 요청은 `403 RESTORE_NOT_ALLOWED`(권한 없음, 정보 누설 없는 코드)·`409 RESTORE_BLOCKED_OTHER_SPACE`(두 사람 중 누군가 다른 활성 공간에 있음)로 거절된다.
- 오류 형태: `{ "error": { "code": "VERSION_CONFLICT", "retryable": true } }`. `code`는 언어 중립 안정 코드이며 앱이 현재 locale의 번역 리소스에서 사용자 메시지를 찾는다.
- 오류 응답에 사용자 표시용 자연어 문구나 locale별 메시지 키를 넣지 않고 원문 프롬프트를 되풀이하지 않는다. 화면·설정·오류 문구는 앱 번역 리소스에서 제공한다.
- 모든 변경 요청은 `Idempotency-Key` UUID를 받아 중복 tap/retry로 이중 적용되지 않게 한다.

## Auth / 초대

인증 방식은 카카오·Apple OAuth 및 이메일 OTP(6자리 코드가 기본)/magic link(허용)로 Supabase Auth에 위임한다. 최소 연령 만 14세는 가입 시작 화면의 확인 문구로 알리고 서버는 생년월일을 받지 않는다(FR-058, 가정). OAuth redirect는 Expo universal link로 복귀한다.

### `POST /spaces`

공간 및 첫 구성원을 하나의 트랜잭션으로 만든다. **한 사용자는 한 번에 하나의 공간에만 속한다(FR-057)**: 이미 **활성** 공간의 구성원이면 `409 ALREADY_IN_SPACE`로 거절한다. **복구 대기(종료·연결 끊기 후 30일) 공간은 세지 않으므로** 그 사용자는 새 공간을 만들 수 있다(가정, `spec.md` Decided 23). 새 공간을 쓰는 동안에는 이전 공간을 복구할 수 없다(`POST /recover` 참고).

요청: `{ "anniversaryDate": "YYYY-MM-DD" }`

응답 201: `{ "spaceId": "uuid", "status": "active", "memberCount": 1, "anniversaryDate": "YYYY-MM-DD" }`

### `POST /spaces/{spaceId}/invitations`

구성원만 호출 가능. 원문 코드는 응답에서 딱 한 번만 돌려준다.

요청: `{ "expiresInSeconds": 86400 }` (서버는 24시간으로 고정)

응답 201: `{ "invitationId": "uuid", "code": "one-time-secret", "expiresAt": "RFC3339" }`

초대는 발급 시점부터 24시간 후 만료한다. 재발급 시 기존 미사용 초대 코드를 무효화한다. 앱은 OS 공유 시트를 열고 코드/보편 링크를 사용자가 선택해 전달한다.

### `POST /invitations/accept`

요청: `{ "code": "one-time-secret" }`

서버는 해시 대조, 미만료·미사용, 대상 공간 활성·멤버 1명 조건과 **호출한 사용자가 다른 활성 공간의 구성원이 아님**(복구 대기 공간은 제외)을 원자적으로 확인하고 가입 후 코드를 즉시 소비한다. 사용자가 이미 다른 활성 공간에 있으면 `409 ALREADY_IN_SPACE`로 거절하고 **코드는 소모하지 않는다**(공간에서 나온 뒤 같은 코드로 다시 시도할 수 있다). 코드 형식은 8자(4-4 표시), 혼동 문자(0/O, 1/I) 제외.

응답 200: `{ "spaceId": "uuid", "status": "active", "memberCount": 2 }`.

## D-day 및 조회

### `GET /spaces/mine`

(제안 · 일관성 점검에서 찾은 빈칸을 메운 것) 앱을 열 때 호출자가 어느 공간으로 들어갈지 정한다. 응답 200: `{ "active": { "spaceId": "uuid" } | null, "ended": { "spaceId": "uuid", "lifecycle": { ... } } | null }`. `active`는 호출자의 활성 공간 하나(없으면 null). `ended`는 호출자가 구성원인 복구 대기 공간 중 `ended_at`이 **가장 최근인 하나**(없으면 null; 가정). `lifecycle`은 아래 스냅샷의 `lifecycle`과 같다. 앱은 `active`가 있으면 그 공간으로 열고, 없고 `ended`가 있으면 종료 화면(S14)을, 둘 다 없으면 공간 만들기(S03)·초대 코드 입력(S05)을 연다. 그 밖의 공간 정보는 응답에 없다.

### `GET /profile/preferences`

응답 200: `{ "locale": "ko-KR" | "en-US" | "ja-JP" | null, "uiTheme": "system" | "light" | "dark" }`. 본인 설정만 읽는다(스냅샷에는 사용자별 설정이 들어 있지 않다).

### `PATCH /profile/preferences`

요청: `{ "locale": "ko-KR" | "en-US" | "ja-JP" | null, "uiTheme": "system" | "light" | "dark" }`.

`locale: null`은 기기 언어 기본값을 뜻한다. `uiTheme` 기본값은 `system`이며 사용자별 설정이다. 지원 locale 목록은 앱 번역 리소스 manifest와 일치해야 한다.

### `GET /spaces/{spaceId}/snapshot`

구성원만 접근 가능. 응답은 공간 요약, 홈 커버 사진 요약(`homeCover`: `status`, `version`, `uploadedBy`, `updatedAt`; 주소는 별도 요청), 현재 버전의 `sceneDocument`, `roomPresentation`, `roomThemeDocument`(낮/밤 자산·색 variant, 모드와 시간대), 현재 `promptSession` owner/expiry 상태, 버전 번호, 카탈로그 버전, 서버 시간으로 구성한다. 사용자별 `locale` 및 `system | light | dark` UI 테마 설정은 프로필 설정 API로 읽고 저장한다. 인증 사용자는 해당 공간 구성원이 아니면 공간 존재 여부도 확인할 수 없다. 공간이 `recovery_pending`이면 구성원 누구에게나 **`lifecycle`만** 돌려준다(방 장면·홈 사진·대화는 포함하지 않고, 연결 끊기로 끝난 경우 끊긴 쪽도 이 요약은 읽는다): `{ "status": "recovery_pending", "endedAt": "…", "deleteAfter": "…", "endedReason": "ended" | "disconnect", "endedBy": "me" | "partner", "canRestore": true | false }`. `canRestore`는 **요청자의 권한**만 뜻한다(보통 종료는 항상 true, 연결 끊기는 끊은 사람만 true). 다른 활성 공간 때문에 막히는지는 여기에 담지 않고 복구를 실제로 요청할 때 `409 RESTORE_BLOCKED_OTHER_SPACE`로 알린다(상대의 새 공간 사용 여부가 노출되지 않도록).

### `PATCH /spaces/{spaceId}/anniversary`

요청: `{ "anniversaryDate": "YYYY-MM-DD", "expectedUpdatedAt": "RFC3339" }`.

D-day 값은 모델 입력으로 보내지 않는다. 변경을 두 구성원에게 sync한다. 잘못된 날짜 또는 stale state는 거절한다. 응답에 `milestonesReset`(다시 축하하게 된 `milestone_key` 목록, 보통 빈 배열)을 포함한다(FR-043).

### `PATCH /spaces/{spaceId}/room-mode`

요청: `{ "mode": "day" | "night" | "follow_time", "timeZone": "Asia/Seoul", "expectedCurrentVersion": 13, "idempotencyKey": "uuid" }`.

방 모드는 커플 공유 설정이며 새 공간 기본은 `follow_time`과 공간 생성자의 저장된 IANA 시간대다. 구성원은 설정에서 모드와 시간대를 변경할 수 있고 변경은 새 version으로 저장된다(`source: room_mode`, 오래된 `expectedCurrentVersion`은 `409 VERSION_CONFLICT`).

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

요청: `{ "celebrationId": "uuid", "idempotencyKey": "uuid" }`. 먼저 기존 `acquire`로 점유를 얻어야 한다. 응답은 `POST decoration-previews`의 성공 응답과 같은 모양(`previewId`, `baseVersionNumber`, 후보 장면)에 `placed`·`requested`(놓은 소품 수/원래 5~6개)를 더한다. AI를 호출하지 않고 동의·일일 한도도 확인하지 않는다.
- 오류: `409 SESSION_OCCUPIED`(상대가 점유 중이거나 내가 점유자가 아님), `410 MILESTONE_PASSED`(보이는 기간이 지남), `422 ROOM_FULL`(자리가 전혀 없음), `409 VERSION_CONFLICT`.
- 적용은 기존 `POST decoration-previews/{previewId}/confirm`을 그대로 쓴다. 자동 적용은 없다. 적용되면 `preset_applied_version_id`가 기록된다.

## 마스코트 되살림

### `POST /spaces/{spaceId}/room/mascot-recall`

요청: `{ "expectedVersion": 12, "idempotencyKey": "uuid" }`. 현재 장면에 마스코트가 없을 때만 기본 자리에 하나 추가한 새 방 버전(`source: mascot_recall`)을 만든다. AI·점유·미리 보기 없이 동작하지만, 점유 세션이 활성이면 `409 SESSION_OCCUPIED`로 막는다. 이미 있으면 200으로 현재 버전을 돌려주고(멱등), 16개 한도가 가득이면 `422 ROOM_FULL`. 오래된 `expectedVersion`은 `409 VERSION_CONFLICT`.

## 홈 커버 사진

공간당 최대 한 장. 점유 세션이 필요 없다. 사진은 `sceneDocument`, 프롬프트, AI 요청에 포함되지 않는다. **마지막으로 바꾼 사용자의 사진이 반영**되고(마지막 변경 우선) 홈에는 누가 바꿨는지를 보여 준다. 검수·신고 API는 없다. 형식·크기·주소 수명 값은 제안이며 구현 때 조정한다.

### `POST /spaces/{spaceId}/home-cover/upload-url`

활성 공간 구성원만. 요청: `{ "contentType": "image/jpeg" | "image/png" | "image/heic", "byteSize": 1234567 }`. 허용 형식·크기(20MB 이하) 위반은 `400 COVER_FORMAT_UNSUPPORTED` / `400 COVER_TOO_LARGE`. 응답 201: `{ "uploadId": "uuid", "uploadUrl": "signed-url", "expiresAt": "RFC3339" }` (일회용, 짧은 수명). 공간이 `recovery_pending`이면 `403`.

### `PUT /spaces/{spaceId}/home-cover`

업로드 완료 확정. 요청: `{ "uploadId": "uuid", "crop": { "x": 0.0, "y": 0.1, "width": 1.0, "height": 0.6 } }` + `Idempotency-Key`. 서버가 실제 이미지 헤더·크기·형식을 검사하고 EXIF/XMP를 제거한 사본으로 재인코딩해 저장한 뒤 `version`을 올린다. 응답 200: `{ "status": "ready", "version": 4, "uploadedBy": "uuid", "updatedAt": "RFC3339" }`. 검사·변환 실패는 `422 COVER_INVALID_IMAGE`. **마지막 변경 우선**이라 동시에 올려도 `409`로 막지 않고 나중에 확정된 쪽이 반영되며 `version`이 올라간다(먼저 올린 쪽은 다음 동기화 때 바뀐 사진과 변경자를 본다). 실패해도 기존 사진은 그대로다.

### `GET /spaces/{spaceId}/home-cover`

구성원만. 응답 200: `{ "status": "ready" | "none", "version": 4, "signedUrl": "short-lived-url", "signedUrlExpiresAt": "RFC3339", "crop": {…}, "uploadedBy": "uuid", "updatedAt": "RFC3339" }`(`uploadedBy`는 마지막으로 바꾸거나 없앤 사용자). `none`이면 기본 바탕이다. 서명된 URL은 로그에 남기지 않는다.

### `DELETE /spaces/{spaceId}/home-cover`

사진을 없앤다(`status: none`, 없앤 사용자를 `uploadedBy`에 기록). 응답 204. 이전 객체는 삭제 대기 목록에 들어가 24시간 뒤 삭제된다. 공간 삭제(30일 복구 기간 종료) 때 객체도 함께 지운다.

오류 코드는 언어 중립이며 앱 번역 리소스가 문구를 고른다(`i18n-copy.md`의 `cover.*`).

## 공유 프롬프트 세션 및 AI 미리보기

두 구성원은 공유 prompt conversation과 preview를 읽는다. 한 명만 입력·요청·적용을 점유할 수 있다. 유휴 lease는 3분(만료 30초 전 경고, 서버 설정값)이며 최근의 의미 있는 사용자 활동에 맞춰 heartbeat를 갱신한다. 앱이 닫히거나 유휴 상태면 만료 후 takeover 가능하다.

### `GET /spaces/{spaceId}/prompt-conversation`

두 구성원 모두 사용자 prompt, preview 및 status 메시지를 시간 순서대로 읽는다. 권한이 있는 API는 메시지 ID, author, content, preview reference와 현재 점유 상태를 반환한다.

### `POST /spaces/{spaceId}/prompt-session/acquire`

요청: `{ "idempotencyKey": "uuid" }`.

활성 점유가 없을 때 lease를 만든다. 201 응답: `{ "sessionId": "uuid", "ownerUserId": "uuid", "expiresAt": "RFC3339" }`. 다른 구성원이 유효하게 점유 중이면 `409 SESSION_OCCUPIED`와 owner/expiry를 반환한다. 동시 요청은 단일 DB 원자 연산으로 한 명만 승자로 선택한다.

### `POST /spaces/{spaceId}/prompt-session/{sessionId}/heartbeat`

현재 owner만 호출할 수 있다. 최근 입력/생성 활동이 있으면 서버 시각 기준으로 lease를 3분 연장한다. heartbeat가 멈추면 expiry 후 점유권은 만료된다.

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

요청:

```json
{
  "prompt": "따뜻하고 편안한 방, 작은 별과 책을 놓아 줘",
  "sessionId": "uuid",
  "baseVersion": 12,
  "idempotencyKey": "uuid"
}
```

현재 점유자만 호출할 수 있다. 서버가 구성원/활성공간/동의/일일 한도/유효 session owner/현재 버전/프롬프트 길이를 확인한 뒤 Anthropic을 부른다. 한국어·영어·일본어 prompt를 허용하고 결과 문구도 요청 언어를 보존한다. 사용자 prompt, preview, status message는 공유 대화에 저장하고 두 구성원에게 Realtime 갱신을 보낸다. 상대 구성원은 대화와 preview를 live read-only로 보고 입력·제출·적용할 수 없다. Realtime payload에는 message/preview ID와 상태만 보내며 내용은 권한 확인된 conversation API에서 읽는다. 모델에는 prompt 외 최소한의 현재 scene JSON, 낮/밤 테마 허용 토큰, D-day 표현 허용 토큰, 장면 viewport profile, 카탈로그의 ID/설명만 보낸다. 날짜, 사용자 식별자, 초대 코드, 이메일, 기타 공간 데이터는 보내지 않는다.

성공 201: `{ "previewId": "uuid", "baseVersion": 12, "sceneDocument": {}, "roomPresentation": {}, "roomThemeDocument": {}, "expiresAt": "RFC3339", "validation": { "status": "passed", "warnings": [] } }`. 상대도 같은 preview를 읽기 전용으로 실시간 확인한다.

거절/검증 실패는 공유방을 건드리지 않고, `422 UNSUPPORTED_REQUEST` 또는 `422 INVALID_CANDIDATE`로 응답한다. 출력 검증 repair는 최대 1회. 모델/repair 원문은 오류나 일반 로그에 포함하지 않는다.

### `POST /spaces/{spaceId}/decoration-previews/{previewId}/confirm`

요청: `{ "baseVersion": 12, "sessionId": "uuid", "idempotencyKey": "uuid" }`.

현재 점유자만 적용할 수 있다. 서버는 space/session owner/preview/유효기간/base version을 확인하고 idempotency와 현재 version 비교, 새 불변 버전 저장, session release를 하나의 원자적 transaction으로 처리한다. 동시 apply 또는 stale retry는 `409 SESSION_CONFLICT` 또는 `409 VERSION_CONFLICT`이며 중복 저장하지 않는다. 점유 규칙은 정상 흐름을 직렬화하고 version guard는 서버 최종 안전장치다.

응답 201: `{ "appliedVersion": 13, "source": "prompt", "updatedAt": "RFC3339" }`.

### `DELETE /spaces/{spaceId}/decoration-previews/{previewId}?sessionId={sessionId}`

현재 점유자만 취소할 수 있다. cancel 요청은 후보를 공유 장면에 적용하지 않고 session을 release한다. 다른 구성원은 취소/적용 컨트롤이 없는 읽기 전용 preview를 본다.

## 되돌리기 (열린 대화 안에서만)

되돌리기는 지금 열린 프롬프트 대화(점유 세션) 안에서 **아직 적용하지 않은 변경**을 바로 앞 미리 보기로 돌리는 것뿐이다. 적용한 변경은 되돌릴 수 없고 다시 적용(redo)도 없다. 이전 설계의 방 버전 되돌리기(`POST theme-versions/undo`)와 버전 목록 조회·지정 버전 복구(`GET theme-versions`, `POST theme-versions/{versionId}/restore`)는 V1에 없다. 서버는 감사 기록으로 버전 스냅샷을 계속 저장하지만 이를 읽거나 되돌리는 API는 두지 않는다.

### `POST /spaces/{spaceId}/prompt-session/{sessionId}/undo`

요청: `{ "expectedPreviewId": "uuid", "idempotencyKey": "uuid" }`.

현재 owner만 호출한다. 열린 대화의 최신 미리 보기(`expectedPreviewId`)를 `reverted`로 바꾸고 바로 앞 미리 보기를 현재 후보로 돌려준다. 앞 후보가 없으면 `previewId: null`(현재 방 보기)이다. 방 버전은 바뀌지 않고 점유도 풀지 않는다. 응답 200: `{ "previewId": "uuid" | null }`. 되돌릴 후보가 없으면 `409 NOTHING_TO_UNDO`, 이미 되돌려졌거나 미리 보기가 바뀌었으면 `409 PREVIEW_CHANGED`(최신 미리 보기를 응답에 담지 않고 대화를 다시 읽게 한다). 두 구성원은 같은 미리 보기를 Realtime으로 본다. 적용된(`applied`) 요청에는 호출할 수 없다(`409 ALREADY_APPLIED`).

## 공간 종료 / 복구

### `POST /spaces/{spaceId}/end`

공간 구성원 중 누구나 호출 가능. `{ "confirm": true }`. 상태를 `recovery_pending`으로 전환하고 `deleteAfter`를 서버 시각 + 30일로 지정한다. 초대·AI·편집을 즉시 막는다. 두 멤버가 앱을 열거나 공간 상태를 동기화할 때 종료 상태와 복구 기한을 확인할 수 있다.

### `POST /spaces/{spaceId}/recover`

30일 이내 공간 구성원이 호출한다. `{ "confirm": true }`. 공간과 저장 데이터를 다시 활성화하고 두 구성원의 `space_active`를 true로 되돌린다(가정, `spec.md` Decided 23·24):

- 종료 이유가 `ended`이면 **어느 구성원이든**, `disconnect`이면 **연결을 끊은 사람만** 호출할 수 있다. 권한이 없으면 `403 RESTORE_NOT_ALLOWED`. 상대 동의는 필요하지 않다.
- 복구하는 순간 **두 구성원 중 누구라도 다른 활성 공간에 있으면** `409 RESTORE_BLOCKED_OTHER_SPACE`로 거절하고 공간은 복구 대기 그대로다(응답에 누가 쓰는지 담지 않는다). 새 공간을 종료한 뒤 `deleteAfter` 전에 다시 호출할 수 있다.
- 기한(`deleteAfter`)이 지나 삭제된 공간은 `404`이고 앱은 `end.expired.*`를 보인다.
- 응답 200: `{ "spaceId": "uuid", "status": "active" }`.

## 신고와 연결 끊기 (FR-059)

### `POST /spaces/{spaceId}/reports`

구성원이 호출한다. `{ "target": "partner" | "shared_text" | "room_scene", "reason": "harass" | "inappropriate" | "privacy" | "other", "detail?": "string", "messageId?": "uuid" }`. 응답 201. 홈 커버 사진은 신고 대상이 아니다. 신고 접수·처리는 운영 연락처(공개 지원 이메일, 아직 없음)로 이어진다.

### `POST /spaces/{spaceId}/block`

**화면 이름은 "연결 끊기"(예전 "차단")이고 엔드포인트 이름은 `block`을 유지한다**(계약 이름을 불필요하게 바꾸지 않기 위해). 구성원이 호출한다. `{ "confirm": true }`. 상대의 접근을 끊고 공간을 `recovery_pending`으로 전환한다(`POST /end`와 같은 종료·30일 복구, 종료 이유 `disconnect`, `ended_by_user_id` = 호출자). **복구는 30일 안에 연결을 끊은 사람만** 할 수 있다(`POST /recover`, 가정). 이 호출은 신고와 별개이고 신고를 만들지 않는다. 응답은 `/end`와 같다(`deleteAfter` 포함)이며 앱은 확인 창에서 이 결과를 미리 알린다.

## 실시간 업데이트

채널은 인증 주체가 구성원인 `space_id`만 구독 가능하다. 홈 커버 변경은 `cover_version`과 변경 종류(`changed | removed`)만 알리고 상대가 서명된 URL을 다시 요청한다. 이벤트 payload에는 현재 테마 버전 ID/번호, 변경 종류, 변경자, 시각, session owner/expiry, message/preview ID만 둔다. prompt/AI 출력 본문과 개인 식별자는 broadcast에 넣지 않는다. 두 구성원은 권한검사된 conversation API로 shared text/preview를 읽는다. 탈퇴/종료/삭제/토큰 만료 시 구독을 끊는다.
