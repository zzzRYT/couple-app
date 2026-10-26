# 서비스 계약 제안 (V1)

모든 API는 TLS 및 인증을 요구한다. 앱은 Supabase의 공개 anon key만 사용할 수 있으며 DB의 모든 직접 접근은 RLS로 제한한다. Anthropic·service-role 자격 증명은 앱에 전달하지 않는다. URL은 예시 논리 라우트이며 구현 단계에서 Supabase Edge Function 이름으로 매핑한다.

## 공통 응답 / 오류

- JSON UTF-8. 성공은 2xx, 잘못된 입력은 `400`, 미인증은 `401`, 권한 없음은 정보 누설 없는 `403`, stale version은 `409`, 한도 초과는 `429`, 일시적 장애는 `503`.
- 오류 형태: `{ "error": { "code": "VERSION_CONFLICT", "retryable": true } }`. `code`는 언어 중립 안정 코드이며 앱이 현재 locale의 번역 리소스에서 사용자 메시지를 찾는다.
- 오류 응답에 사용자 표시용 자연어 문구나 locale별 메시지 키를 넣지 않고 원문 프롬프트를 되풀이하지 않는다. 화면·설정·오류 문구는 앱 번역 리소스에서 제공한다.
- 모든 변경 요청은 `Idempotency-Key` UUID를 받아 중복 tap/retry로 이중 적용되지 않게 한다.

## Auth / 초대

인증 방식은 카카오·Apple OAuth 및 이메일 OTP/magic link로 Supabase Auth에 위임한다. OAuth redirect는 Expo universal link로 복귀한다.

### `POST /spaces`

공간 및 첫 구성원을 하나의 트랜잭션으로 만든다.

요청: `{ "anniversaryDate": "YYYY-MM-DD" }`

응답 201: `{ "spaceId": "uuid", "status": "active", "memberCount": 1, "anniversaryDate": "YYYY-MM-DD" }`

### `POST /spaces/{spaceId}/invitations`

구성원만 호출 가능. 원문 코드는 응답에서 딱 한 번만 돌려준다.

요청: `{ "expiresInSeconds": 86400 }` (서버는 24시간으로 고정)

응답 201: `{ "invitationId": "uuid", "code": "one-time-secret", "expiresAt": "RFC3339" }`

초대는 발급 시점부터 24시간 후 만료한다. 재발급 시 기존 미사용 초대 코드를 무효화한다. 앱은 OS 공유 시트를 열고 코드/보편 링크를 사용자가 선택해 전달한다.

### `POST /invitations/accept`

요청: `{ "code": "one-time-secret" }`

서버는 해시 대조, 미만료·미사용, 대상 공간 활성·멤버 1명 조건을 원자적으로 확인하고 가입 후 코드를 즉시 소비한다.

응답 200: `{ "spaceId": "uuid", "status": "active", "memberCount": 2 }`.

## D-day 및 조회

### `PATCH /profile/preferences`

요청: `{ "locale": "ko-KR" | "en-US" | "ja-JP" | null, "uiTheme": "system" | "light" | "dark" }`.

`locale: null`은 기기 언어 기본값을 뜻한다. `uiTheme` 기본값은 `system`이며 사용자별 설정이다. 지원 locale 목록은 앱 번역 리소스 manifest와 일치해야 한다.

### `GET /spaces/{spaceId}/snapshot`

구성원만 접근 가능. 응답은 공간 요약, 홈 커버 사진 요약(`homeCover`: `status`, `version`, `uploadedBy`, `updatedAt`; 주소는 별도 요청), 현재 버전의 `sceneDocument`, `roomPresentation`, `roomThemeDocument`(낮/밤 자산·색 variant, 모드와 시간대), 현재 `promptSession` owner/expiry 상태, 버전 번호, 카탈로그 버전, 서버 시간으로 구성한다. 사용자별 `locale` 및 `system | light | dark` UI 테마 설정은 프로필 설정 API로 읽고 저장한다. 인증 사용자는 해당 공간 구성원이 아니면 공간 존재 여부도 확인할 수 없다.

### `PATCH /spaces/{spaceId}/anniversary`

요청: `{ "anniversaryDate": "YYYY-MM-DD", "expectedUpdatedAt": "RFC3339" }`.

D-day 값은 모델 입력으로 보내지 않는다. 변경을 두 구성원에게 sync한다. 잘못된 날짜 또는 stale state는 거절한다.

### `PATCH /spaces/{spaceId}/room-mode`

요청: `{ "mode": "day" | "night" | "follow_time", "timeZone": "Asia/Seoul", "expectedCurrentVersion": 13, "idempotencyKey": "uuid" }`.

방 모드는 커플 공유 설정이며 새 공간 기본은 `follow_time`과 공간 생성자의 저장된 IANA 시간대다. 구성원은 설정에서 모드와 시간대를 변경할 수 있고 변경은 새 version으로 저장된다.

## 홈 커버 사진

공간당 최대 한 장. 점유 세션이 필요 없다. 사진은 `sceneDocument`, 프롬프트, AI 요청에 포함되지 않는다. 값(형식·크기·주소 수명)은 가정이며 구현 때 조정한다.

### `POST /spaces/{spaceId}/home-cover/upload-url`

활성 공간 구성원만. 요청: `{ "contentType": "image/jpeg" | "image/png" | "image/heic", "byteSize": 1234567 }`. 허용 형식·크기(20MB 이하) 위반은 `400 COVER_FORMAT_UNSUPPORTED` / `400 COVER_TOO_LARGE`. 응답 201: `{ "uploadId": "uuid", "uploadUrl": "signed-url", "expiresAt": "RFC3339" }` (일회용, 짧은 수명). 공간이 `recovery_pending`이면 `403`.

### `PUT /spaces/{spaceId}/home-cover`

업로드 완료 확정. 요청: `{ "uploadId": "uuid", "crop": { "x": 0.0, "y": 0.1, "width": 1.0, "height": 0.6 }, "expectedVersion": 3 }` + `Idempotency-Key`. 서버가 실제 이미지 헤더·크기·형식을 검사하고 EXIF/XMP를 제거한 사본으로 재인코딩해 저장한 뒤 `version`을 올린다. 응답 200: `{ "status": "ready", "version": 4, "updatedAt": "RFC3339" }`. 검사·변환 실패는 `422 COVER_INVALID_IMAGE`, 오래된 `expectedVersion`은 `409 VERSION_CONFLICT`(마지막 반영 우선 정책 확정 전 가정). 실패해도 기존 사진은 그대로다.

### `GET /spaces/{spaceId}/home-cover`

구성원만. 응답 200: `{ "status": "ready" | "none", "version": 4, "signedUrl": "short-lived-url", "signedUrlExpiresAt": "RFC3339", "crop": {…}, "uploadedBy": "uuid", "updatedAt": "RFC3339" }`. `none`이면 기본 바탕이다. 서명된 URL은 로그에 남기지 않는다.

### `DELETE /spaces/{spaceId}/home-cover?expectedVersion=4`

사진을 없앤다(`status: none`). 응답 204. 이전 객체는 삭제 대기 목록에 들어간다. 공간 삭제 때 객체도 함께 지운다.

오류 코드는 언어 중립이며 앱 번역 리소스가 문구를 고른다(`i18n-copy.md`의 `cover.*`).

## 공유 프롬프트 세션 및 AI 미리보기

두 구성원은 공유 prompt conversation과 preview를 읽는다. 한 명만 입력·요청·적용을 점유할 수 있다. 기본 유휴 lease는 3분이며 최근의 의미 있는 사용자 활동에 맞춰 heartbeat를 갱신한다. 앱이 닫히거나 유휴 상태면 만료 후 takeover 가능하다.

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

현재 owner만 cancel 사유로 호출한다. `{ "reason": "cancel" }`. 응답 204. confirm 및 undo endpoint는 성공한 저장과 함께 같은 transaction에서 session을 해제한다.

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

## 되돌리기

버전 목록 조회(`GET theme-versions`)와 지정 버전 복구(`POST theme-versions/{versionId}/restore`)는 기록 기능과 함께 V1에서 뺐다. 서버는 undo와 감사를 위해 버전 스냅샷을 계속 저장하지만 이용자용 목록 API는 두지 않는다. 연속 되돌리기 깊이와 다시 적용(redo) 여부는 정해지지 않았다(spec.md Open Decisions 8).

### `POST /spaces/{spaceId}/theme-versions/undo`

요청: `{ "expectedCurrentVersion": 13, "sessionId": "uuid", "idempotencyKey": "uuid" }`.

현재 점유자가 직전 적용 전 상태를 새 복원 스냅샷으로 저장한다. 저장 성공과 session release는 원자적이다. undo 가능한 전 버전이 없으면 `409 NOTHING_TO_UNDO`.

## 공간 종료 / 복구

### `POST /spaces/{spaceId}/end`

공간 구성원 중 누구나 호출 가능. `{ "confirm": true }`. 상태를 `recovery_pending`으로 전환하고 `deleteAfter`를 서버 시각 + 30일로 지정한다. 초대·AI·편집을 즉시 막는다. 두 멤버가 앱을 열거나 공간 상태를 동기화할 때 종료 상태와 복구 기한을 확인할 수 있다.

### `POST /spaces/{spaceId}/recover`

30일 이내 공간 구성원이 호출한다. `{ "confirm": true }`. 공간과 저장 데이터를 다시 활성화한다. 캡틴은 복구 시 상대 동의가 필요한지 결정해야 한다.

## 실시간 업데이트

채널은 인증 주체가 구성원인 `space_id`만 구독 가능하다. 홈 커버 변경은 `cover_version`과 변경 종류(`changed | removed`)만 알리고 상대가 서명된 URL을 다시 요청한다. 이벤트 payload에는 현재 테마 버전 ID/번호, 변경 종류, 변경자, 시각, session owner/expiry, message/preview ID만 둔다. prompt/AI 출력 본문과 개인 식별자는 broadcast에 넣지 않는다. 두 구성원은 권한검사된 conversation API로 shared text/preview를 읽는다. 탈퇴/종료/삭제/토큰 만료 시 구독을 끊는다.
