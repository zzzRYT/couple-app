# 데이터 모델

이 문서는 구현 전 제안이다. 모든 공유 행은 `space_id`로 범위를 제한하고 RLS 정책을 적용한다. 외래 키/고유 조건/삭제 정책은 서버 DB에서도 강제한다. API 상세는 [contracts/api.md](./contracts/api.md), 장면 문서는 [contracts/room-scene.schema.json](./contracts/room-scene.schema.json)을 따른다.

## 엔티티와 관계

### UserProfile

- `user_id` (UUID, 인증 사용자 PK)
- `created_at`, `updated_at`
- `locale`, `time_zone` (선택적 개인 설정)
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
- 권장 초대 만료는 48시간이며 캡틴 확인 전 제안값이다.

### AssetCatalogEntry

- `asset_id` (영구 문자열 ID PK), `catalog_version`
- `uri` (앱 내 번들/검증된 manifest 경로; 모델은 임의 URI를 생성할 수 없음)
- `format`, `width_px`, `height_px`, `byte_size`, `sha256`
- `license_kind`, `license_text_version`, `creator`, `source_url?`, `attribution?`, `rights_record_ref`
- `status`: `active | retired`; 기존 장면의 은퇴 에셋은 레거시 렌더 허용 또는 교체 마이그레이션 필요.
- 앱 기본 카탈로그 24~36개를 목표로 한다.

### RoomTheme

- `space_id` (PK), `current_version_id`, `version_counter`
- `updated_at`, `updated_by_user_id`
- 현재 확정 테마 버전만 가리킨다. `current_version_id`와 counter 변경은 트랜잭션으로 한다.

### RoomThemeVersion

- `id`, `space_id`, `version_number` (공간 내 고유 증가값)
- `schema_version`, `scene_document` (JSONB: 카탈로그 오브젝트 + 텍스트만)
- `room_presentation` (JSONB: D-day 별도 네이티브 뷰 표현/표시 여부)
- `source`: `initial | prompt | undo | restore | manual_migration`
- `provenance`: `model_provider?`, `model_id?`, `model_snapshot?`, `request_id?`, `created_at`, `created_by_user_id`
- `restores_version_id?`, `content_hash`
- 확정 후 불변. AI 출처는 내부 감사용이며 캔버스에 배지를 렌더링하지 않는다.
- 버전 수 상한은 명세에서 결정하지 않았다. 보관 상한/정리기간은 캡틴이 정한다. 복구 가능 범위에 있는 버전은 보존한다.

### DecorationRequest

- `id`, `space_id`, `requested_by_user_id`, `base_version_id`, `base_version_number`
- `prompt_text` (전송 전 동의 확인, 데이터 최소화; 암호화/보관 기간 필요)
- `state`: `queued | generated | rejected | previewed | applied | cancelled | expired | failed`
- `result_candidate` (스키마 검증된 후보; 원문 모델 출력은 별도 저장하지 않음)
- `failure_code?`, `repair_count` (최대 1), `created_at`, `expires_at`, `applied_version_id?`
- 후보는 사용자가 적용을 누르기 전 공유 테마를 바꾸지 않는다.
- 원문 프롬프트와 미적용 후보의 만료 기간은 캡틴이 정한다. 권장: 취소/만료 후보 24시간 후 삭제, 적용된 요청 원문은 짧은 지원 보관기간 뒤 삭제.

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
- 장면 오브젝트의 ID는 현재/레거시 허용 목록과 일치해야 한다. 외부 URL 및 임의 필드는 거부한다.
- D-day의 날짜는 `anniversary_date`로부터 앱 규칙에 따라 계산한다. AI/장면 입력은 숫자·날짜 원본을 덮어쓸 수 없다.
- 보호 영역은 네이티브 화면의 실제 뷰 측정과 사용자의 글자 크기 설정에서 계산한다. 서버는 기준 viewport에서도 확인하고, 기기 렌더 직전에 클라이언트가 같은 규칙으로 재검사한다.
