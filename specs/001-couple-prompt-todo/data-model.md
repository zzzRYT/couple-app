# 데이터 모델

이 문서는 구현 전 제안이다. 모든 공유 행은 `space_id`로 범위를 제한하고 RLS 정책을 적용한다. 외래 키/고유 조건/삭제 정책은 서버 DB에서도 강제한다. API 상세는 [contracts/api.md](./contracts/api.md), 장면 문서는 [contracts/room-scene.schema.json](./contracts/room-scene.schema.json), 낮/밤 테마 문서는 [contracts/room-theme.schema.json](./contracts/room-theme.schema.json), 점유권 계약은 [contracts/room-prompt-session.schema.json](./contracts/room-prompt-session.schema.json)을 따른다.

## 엔티티와 관계

### UserProfile

- `user_id` (UUID, 인증 사용자 PK)
- `created_at`, `updated_at`
- `locale`, `time_zone` (선택적 개인 설정). `locale`은 앱 언어 재정의를 저장하며 비어 있으면 기기 언어를 사용한다. V1 지원 언어는 `ko-KR`, `en-US`, `ja-JP`다. 커플 방의 시간대는 room theme document에 저장한다.
- 공급자 식별자는 Auth 공급자 저장소가 관리하며 앱 도메인 데이터나 AI 문맥에 복제하지 않는다.
- 사용자 개인 설정은 공유 장면/프롬프트가 변경할 수 없다.

### CoupleSpace

- `id` (UUID PK)
- `status`: `active | recovery_pending | deleted`
- `anniversary_date` (날짜; AI로 보내지 않음)
- `created_at`, `updated_at`, `ended_at?`, `delete_after?`
- 활성 또는 복구 대기 공간은 최대 두 구성원만 가진다. 종료 요청 시 즉시 초대/AI/편집을 막는다.
- 30일 후 배치 삭제 작업이 공간 관련 복구 대상 데이터를 지운다.

### SpaceMember

- `space_id`, `user_id` (복합 PK)
- `role`: `member` (V1 두 사람 동일 권한)
- `joined_at`, `left_at?`
- `ai_consent_state`: 사용자 단위 `not_given | granted | revoked`
- `ai_consent_at?`, `ai_consent_text_version?`, `ai_consent_revoked_at?`
- 공간에 속한 해당 사용자만 구성원 데이터와 동의를 읽을 수 있다.

### Invitation

- `id`, `space_id`, `created_by_user_id`
- `token_hash` (고엔트로피 코드 원문 저장 금지)
- `status`: `active | accepted | expired | revoked`
- `created_at`, `expires_at`, `accepted_at?`, `accepted_by_user_id?`, `revoked_at?`
- 일회 수락은 DB 트랜잭션에서 처리하며 공간이 이미 2명인 경우 거절한다.
- 초대는 생성 후 24시간에 만료한다. 재발급은 기존 미사용 초대를 원자적으로 무효화한다.

### AssetCatalogEntry

- `asset_id` (영구 문자열 ID PK), `catalog_version`
- `asset_kind`: `room_object | mascot_base | mascot_pose | wearable`; `wearable_slot?`: `head | face | neck | hand`; `variant_group?`, `variant_id?`
- `uri` (앱 내 번들/검증된 manifest 경로; 모델은 임의 URI를 생성할 수 없음)
- `format`, `width_px`, `height_px`, `byte_size`, `sha256`
- `license_kind`, `license_text_version`, `creator`, `source_url?`, `attribution?`, `rights_record_ref`
- `status`: `active | retired`; 기존 장면의 은퇴 에셋은 레거시 렌더 허용 또는 교체 마이그레이션 필요.
- 앱 기본 카탈로그 24~36개를 목표로 하며 마스코트 기본 모습/포즈 variant 및 착용 아이템도 이 수에 포함한다. 초기 30개 가정은 마스코트 기본 포즈 포함 포즈 4개, 착용 아이템 8개, 일반 소품 18개다.
- 마스코트 착용 아이템은 `slot`: `head | face | neck | hand`를 가지며 해당 슬롯에서만 장착한다. 기본 디자인과 사용 권리는 앱이 관리한다.

### RoomTheme

- `space_id` (PK), `current_version_id`, `version_counter`
- `updated_at`, `updated_by_user_id`
- 현재 확정 테마 버전만 가리킨다. `current_version_id`와 counter 변경은 트랜잭션으로 한다.

### RoomThemeVersion

- `id`, `space_id`, `version_number` (공간 내 고유 증가값)
- `schema_version`, `scene_document` (JSONB: 카탈로그 오브젝트 + 텍스트만)
- `room_presentation` (JSONB: D-day 별도 네이티브 뷰 표현/표시 여부)
- `room_theme_document` (JSONB: 방 모드 `day | night | follow_time`, IANA `timeZone`, 낮/밤별 배경색·팔레트 및 카탈로그 에셋 variant)
- `source`: `initial | prompt | undo | restore | manual_migration`
- `provenance`: `model_provider?`, `model_id?`, `model_snapshot?`, `request_id?`, `created_at`, `created_by_user_id`
- `restores_version_id?`, `content_hash`
- 확정 후 불변. AI 출처는 내부 감사용이며 캔버스에 배지를 렌더링하지 않는다.
- 마스코트는 `asset_id=app_mascot`인 카탈로그 오브젝트로 표현하며 방 초기 문서에 정확히 하나 포함한다. 사용자가 이후 방에서 제거할 수 있지만 기본 디자인을 교체하거나 그려 넣을 수는 없다. 메인 페이지에는 동일한 앱 소유 자산을 표시한다.
- 마스코트 상태는 `mascot_state`에 승인된 `head`, `face`, `neck`, `hand` 슬롯 아이템 ID, 팔레트 색 토큰, 제한된 `expression` 및 `pose` variant ID를 기록한다. 크기와 위치는 일반 오브젝트의 좌표 필드를 사용한다. base design은 교체할 수 없고 상태 variant는 앱 카탈로그에서만 선택한다.
- UI theme preference는 사용자 설정 `system | light | dark`이며 기본값은 `system`이다. room theme document의 기본 `mode`는 `follow_time`, 기본 `timeZone`은 공간 생성자의 시간대이며 설정에서 둘 다 변경 가능하다.
- 버전 수 상한은 명세에서 결정하지 않았다. 보관 상한/정리기간은 캡틴이 정한다. 복구 가능 범위에 있는 버전은 보존한다.

### DecorationRequest

- `id`, `space_id`, `session_id`, `requested_by_user_id`, `base_version_id`, `base_version_number`
- `prompt_text` (두 구성원이 보는 공유 대화; 전송 전 동의 확인, 데이터 최소화; 암호화/보관 기간 필요)
- `state`: `queued | generated | rejected | previewed | applied | cancelled | expired | failed`
- `result_candidate` (스키마 검증된 후보; 원문 모델 출력은 별도 저장하지 않음)
- `failure_code?`, `repair_count` (최대 1), `created_at`, `expires_at`, `applied_version_id?`
- 후보와 대화 메시지는 두 구성원에게 공유되지만, 현재 session owner만 후보를 적용할 수 있다. 다른 구성원은 같은 후보를 읽기 전용으로 본다.
- 취소/만료 미적용 후보는 24시간 후 삭제한다. 적용된 prompt 원문은 30일 지원 보관 후 삭제하며, 공간 종료 시에는 30일 복구 만료 시 복구 대상 내용을 삭제한다.

### PromptSession

- `id`, `space_id`, `owner_user_id`, `status`: `occupied | released | expired`
- `acquired_at`, `last_activity_at`, `expires_at`, `heartbeat_at?`, `released_at?`, `release_reason?`, `takeover_count`
- 점유권은 공간 단위로 하나만 active할 수 있다. acquire와 takeover는 DB 원자 연산으로 owner를 한 명으로 제한한다.
- 초기 유휴 lease는 3분 가정이며 캡틴이 조정할 수 있다. 의미 있는 사용자 입력/AI 생성 중 heartbeat로 갱신하고 background/닫힌 앱은 heartbeat를 보내지 않아 만료된다. 다른 구성원은 expected owner 및 expiry 검사 후 같은 shared session/preview를 takeover한다.
- confirm/cancel/undo는 데이터 변경과 함께 점유를 해제한다. 현재 점유자만 입력·제출·적용할 수 있고 비점유자는 공유 대화와 preview를 읽기 전용으로 본다.

### PromptMessage

- `id`, `space_id`, `session_id`, `decoration_request_id?`, `author_user_id?`
- `kind`: `user_prompt | preview | status`; `body_text?`, `created_at`
- 공유 기록이므로 구성원 두 명만 읽을 수 있다. realtime payload에는 메시지 ID와 변경 종류만 보내고 클라이언트가 권한검사된 endpoint에서 내용을 가져온다.
- 취소/만료 후보는 24시간 후 삭제하고 applied prompt/status message는 30일 후 삭제한다. 공간 종료 시 recovery data는 30일 복구 기간 종료 후 함께 삭제한다.

### SpaceLifecycleEvent

- `id`, `space_id`, `event_type`: `ended | recovered | deletion_started | deletion_completed`
- `actor_user_id`, `occurred_at`, `metadata` (개인 내용을 넣지 않는 정형 속성)
- 공간 복구 및 만료 삭제를 감사한다. 최소 이벤트 보관기간/법적 예외는 개인정보 검토 후 결정한다.

## 상태 전이

```text
CoupleSpace: active --end by either member--> recovery_pending
recovery_pending --restore by either member within 30 days--> active
recovery_pending --30 days elapsed--> deleted

Invitation: active --accept once--> accepted
active --expiry--> expired
active --reissue/revoke--> revoked

DecorationRequest: queued --valid candidate--> generated --> previewed
previewed --confirm at matching base version--> applied
previewed --cancel/expiry--> cancelled/expired
queued/generated --invalid result/provider failure--> rejected/failed
```

## 검증 및 동시성 규칙

- 공간 구성원 수 ≤ 2; 초대 수락은 단일 DB 트랜잭션.
- 요청 시 공간 활성, 사용자 구성원, 필요한 동의가 모두 유효해야 한다. 권장 정책은 두 명 모두 유효 동의가 있어야 외부 AI 호출 가능.
- 서버 일일 요청 계수는 `space_id` 기준의 시간대 정의(권장 UTC 날짜)로 atomic increment한다. 초과 응답은 `429 DAILY_LIMIT_REACHED`.
- 후보/confirm은 `base_version_number`를 검사한다. 오래된 제안은 적용하지 않고 최신 테마로 재요청을 요구한다.
- scene document의 `objects.length ≤ 16`, `texts.length ≤ 3`; 각 노드는 스키마의 범위 제한을 만족해야 한다.
- `PromptSession`은 공간당 하나만 `occupied` 상태일 수 있다. heartbeat는 최근 사용자 활동이 있을 때만 `expires_at`을 갱신한다. 세션 만료 후 takeover는 만료된 session ID와 예상 owner를 조건으로 원자적으로 새 owner에게 양도한다.
- prompt, preview, confirm, cancel, undo endpoint는 유효한 session owner를 확인한다. confirm의 owner/session/expected version 검사, idempotency key 처리, 새 version 저장, lease release를 한 DB transaction에서 수행한다.
- 새 방의 초기 scene은 유효한 마스코트 오브젝트를 정확히 하나 포함한다. 이후 scene에서는 마스코트가 없거나 하나일 수 있으며, 중복은 거부한다. 마스코트가 있을 때 전체 16개 오브젝트 한도에 포함된다. validator는 본체 asset ID, 슬롯별 아이템 허용 여부, 색 팔레트, 표정·포즈 variant를 검사하고 교체 본체, 사용자 이미지, 기존 캐릭터/브랜드 복제 요청을 거부한다.
- 보호 영역과 대비 validator는 day/night 방 모드와 light/dark 인터페이스의 네 조합 각각에서 가림과 글자 가독성을 검사한다. 색은 허용 토큰으로 제한하고 모든 조합에서 대비 기준을 충족해야 한다.
- 장면 오브젝트의 ID는 현재/레거시 허용 목록과 일치해야 한다. 외부 URL 및 임의 필드는 거부한다.
- D-day의 날짜는 `anniversary_date`로부터 앱 규칙에 따라 계산한다. AI/장면 입력은 숫자·날짜 원본을 덮어쓸 수 없다.
- 커플이 쓴 장면 문구는 입력된 원문 그대로 저장한다. 화면 UI 문자열은 번역 키를 사용하고 D-day, 날짜, 숫자 형식은 현재 locale로 렌더링한다.
- 보호 영역은 네이티브 화면의 실제 뷰 측정과 사용자의 글자 크기 설정에서 계산한다. 서버는 기준 viewport에서도 확인하고, 기기 렌더 직전에 클라이언트가 같은 규칙으로 재검사한다.
- Room theme validator와 대비 검사는 방 theme mode·저장된 IANA timezone, UI light/dark preference의 조합을 사용한다. timezone 변경은 새 RoomThemeVersion을 만들고 두 구성원에게 동기화한다.
