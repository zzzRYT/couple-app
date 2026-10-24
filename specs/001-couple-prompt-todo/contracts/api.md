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

요청: `{ "expiresInSeconds": 172800 }` (서버가 허용 범위로 clamp)

응답 201: `{ "invitationId": "uuid", "code": "one-time-secret", "expiresAt": "RFC3339" }`

재발급 시 기존 미사용 초대 코드를 무효화한다(권장). 앱은 OS 공유 시트를 열고 코드/보편 링크를 사용자가 선택해 전달한다.

### `POST /invitations/accept`

요청: `{ "code": "one-time-secret" }`

서버는 해시 대조, 미만료·미사용, 대상 공간 활성·멤버 1명 조건을 원자적으로 확인하고 가입 후 코드를 즉시 소비한다.

응답 200: `{ "spaceId": "uuid", "status": "active", "memberCount": 2 }`.

## D-day 및 조회

### `PATCH /profile/preferences`

요청: `{ "locale": "ko-KR" | null, "uiTheme": "system" | "light" | "dark" }`.

`locale: null`은 기기 언어 기본값을 뜻한다. `uiTheme` 기본값은 `system`이며 사용자별 설정이다. 지원 locale 목록은 앱 번역 리소스 manifest와 일치해야 한다.

### `GET /spaces/{spaceId}/snapshot`

구성원만 접근 가능. 응답은 공간 요약, 현재 버전의 `sceneDocument`, `roomPresentation`, `roomThemeDocument`(낮/밤 자산·색 variant와 모드), 버전 번호, 카탈로그 버전, 서버 시간으로 구성한다. 사용자별 `locale` 및 `system | light | dark` UI 테마 설정은 프로필 설정 API로 읽고 저장한다. 인증 사용자는 해당 공간 구성원이 아니면 공간 존재 여부도 확인할 수 없다.

### `PATCH /spaces/{spaceId}/anniversary`

요청: `{ "anniversaryDate": "YYYY-MM-DD", "expectedUpdatedAt": "RFC3339" }`.

D-day 값은 모델 입력으로 보내지 않는다. 변경을 두 구성원에게 sync한다. 잘못된 날짜 또는 stale state는 거절한다.

### `PATCH /spaces/{spaceId}/room-mode`

요청: `{ "mode": "day" | "night" | "follow_time", "expectedUpdatedAt": "RFC3339" }`.

방 모드는 커플 공유 설정이다. 기본값 `follow_time`은 제품 가정이며 캡틴 확인이 필요하다. 시간대 자동 모드에서 사용할 커플 시간대 기준은 미결정이다.

## 동의 및 AI 미리보기

### `PUT /spaces/{spaceId}/ai-consent`

요청: `{ "state": "granted" | "revoked", "noticeVersion": "ai-overseas-v1" }`.

인증 사용자의 동의만 기록한다. 권장 정책은 **두 멤버 모두 granted**일 때 AI 요청 허용. 상태 변경 시 감사 이벤트를 남긴다. 철회 시 대기 요청과 미적용 preview를 무효화한다.

### `POST /spaces/{spaceId}/decoration-previews`

요청:

```json
{
  "prompt": "따뜻하고 편안한 방, 작은 별과 책을 놓아 줘",
  "baseVersion": 12,
  "idempotencyKey": "uuid"
}
```

서버가 구성원/활성공간/동의/일일 한도/현재 버전/프롬프트 길이를 확인한 뒤 Anthropic을 부른다. 지원되는 어느 언어의 prompt든 허용하며 결과 문구도 요청 언어를 보존한다. prompt 외 최소한의 현재 scene JSON, 낮/밤 테마 허용 토큰, D-day 표현 허용 토큰, 장면 viewport profile, 카탈로그의 ID/설명만 보낸다. 날짜, 사용자 식별자, 초대 코드, 이메일, 기타 공간 데이터는 보내지 않는다.

성공 201: `{ "previewId": "uuid", "baseVersion": 12, "sceneDocument": {}, "roomPresentation": {}, "expiresAt": "RFC3339", "validation": { "status": "passed", "warnings": [] } }`.

거절/검증 실패는 공유방을 건드리지 않고, `422 UNSUPPORTED_REQUEST` 또는 `422 INVALID_CANDIDATE`로 응답한다. 출력 검증 repair는 최대 1회. 모델/repair 원문은 오류나 일반 로그에 포함하지 않는다.

### `POST /spaces/{spaceId}/decoration-previews/{previewId}/confirm`

요청: `{ "baseVersion": 12, "idempotencyKey": "uuid" }`.

서버는 preview owner/space/유효기간과 현재 version을 다시 확인한 후 원자적으로 새 불변 버전을 저장한다. stale base이면 `409 VERSION_CONFLICT`와 최신 version 번호를 돌려주며, 자동 적용하지 않는다.

응답 201: `{ "appliedVersion": 13, "source": "prompt", "updatedAt": "RFC3339" }`.

### `DELETE /spaces/{spaceId}/decoration-previews/{previewId}`

요청자만 취소할 수 있다. 응답 204. 취소/만료된 후보는 현재 테마에 영향이 없다.

## 기록 및 되돌리기

### `GET /spaces/{spaceId}/theme-versions?limit=20&before={cursor}`

구성원만 version 메타데이터/복원 관계를 읽는다. 프롬프트 원문은 기록 응답에 포함하지 않는다.

### `POST /spaces/{spaceId}/theme-versions/{versionId}/restore`

요청: `{ "expectedCurrentVersion": 13, "idempotencyKey": "uuid" }`.

지정 버전의 scene/presentation을 새 복원 스냅샷으로 복사한다. 원본 이력은 덮어쓰지 않는다. 충돌 시 409. 성공한 변경은 같은 RLS Realtime 채널로 전달한다.

### `POST /spaces/{spaceId}/theme-versions/undo`

요청: `{ "expectedCurrentVersion": 13, "idempotencyKey": "uuid" }`.

직전 적용 전 상태를 새 복원 스냅샷으로 저장한다. undo 가능한 전 버전이 없으면 `409 NOTHING_TO_UNDO`.

## 공간 종료 / 복구

### `POST /spaces/{spaceId}/end`

공간 구성원 중 누구나 호출 가능. `{ "confirm": true }`. 상태를 `recovery_pending`으로 전환하고 `deleteAfter`를 서버 시각 + 30일로 지정한다. 초대·AI·편집을 즉시 막는다. 두 멤버가 앱을 열거나 공간 상태를 동기화할 때 종료 상태와 복구 기한을 확인할 수 있다.

### `POST /spaces/{spaceId}/recover`

30일 이내 공간 구성원이 호출한다. `{ "confirm": true }`. 공간과 저장 데이터를 다시 활성화한다. 캡틴은 복구 시 상대 동의가 필요한지 결정해야 한다.

## 실시간 업데이트

채널은 인증 주체가 구성원인 `space_id`만 구독 가능하다. 이벤트 payload에는 현재 테마 버전 ID/번호, 변경 종류, 변경자, 시각만 둔다. 프롬프트·AI 출력·개인 식별자는 broadcast에 넣지 않으며, 클라이언트는 snapshot을 다시 가져온다. 탈퇴/종료/삭제/토큰 만료 시 구독을 끊는다.
