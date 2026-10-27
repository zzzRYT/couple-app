# 데이터 모델

이 문서는 구현 전 제안이다. 모든 공유 행은 `space_id`로 범위를 제한하고 RLS 정책을 적용한다. 외래 키/고유 조건/삭제 정책은 서버 DB에서도 강제한다. API 상세는 [contracts/api.md](./contracts/api.md), 장면 문서는 [contracts/room-scene.schema.json](./contracts/room-scene.schema.json), 낮/밤 테마 문서는 [contracts/room-theme.schema.json](./contracts/room-theme.schema.json), 점유권 계약은 [contracts/room-prompt-session.schema.json](./contracts/room-prompt-session.schema.json)을 따른다.

## 엔티티와 관계

### UserProfile

- `user_id` (UUID, 인증 사용자 PK)
- `created_at`, `updated_at`
- `ui_theme`: `system | light | dark` (기본 `system`, 사용자별 앱 모양 설정; API `PATCH /profile/preferences`의 `uiTheme`).
- `locale`, `time_zone` (선택적 개인 설정). `locale`은 앱 언어 재정의를 저장하며 비어 있으면 기기 언어를 사용한다. V1 지원 언어는 `ko-KR`, `en-US`, `ja-JP`다. 커플 방의 시간대는 room theme document에 저장한다.
- 공급자 식별자는 Auth 공급자 저장소가 관리하며 앱 도메인 데이터나 AI 문맥에 복제하지 않는다.
- 사용자 개인 설정은 공유 장면/프롬프트가 변경할 수 없다.

### CoupleSpace

- `id` (UUID PK)
- `status`: `active | ended` (2026-10-27 5차 답변, 가정: 복구 기능이 없어 `recovery_pending`·`deleted` 상태는 없다. 완전 삭제된 공간은 행이 없다. `spec.md` Decided 33)
- `anniversary_date` (날짜; AI로 보내지 않음)
- `created_at`, `updated_at`, `ended_at?`, `purge_after?` (= `ended_at` + 내부 보관 30일, 서버 설정값. **이용자에게 보이거나 API로 나가지 않는다**)
- `generation_blocked_until?` (운영자가 이 커플의 새 장식 생성을 막은 기한 또는 무기한 표시; 남용 대응, FR-066), `generation_blocked_reason?` (운영자만 읽음)
- `ended_reason?`: `ended | disconnect | account_deletion` (종료할 때만 채워진다. `disconnect` = "연결 끊기"(API `block`), `account_deletion`은 계정 삭제 가정으로 계정 삭제 기능이 설계되기 전에는 쓰이지 않는다), `ended_by_user_id?` (종료·연결 끊기를 한 사용자). 종료 관련 열(`ended_at`, `purge_after`, `ended_reason`, `ended_by_user_id`)은 한 번 채워지면 바뀌지 않는다(복구 없음).
- 활성 공간은 최대 두 구성원만 가진다. 종료 요청 시 같은 트랜잭션에서 `status = ended`로 바꿔 즉시 초대/AI/편집/조회를 막는다. 모든 RLS와 서버 함수는 `status = 'active'`인 공간만 존재하는 것으로 본다(종료된 공간을 이용자 호출이 읽는 경로는 없다).
- `purge_after`가 지나면 예약 작업(`purge_expired_spaces()`, 아래 "완전 삭제 작업")이 공간 관련 모든 행과 홈 커버 사진 객체를 완전히 지운다.

### SpaceMember

- `space_id`, `user_id` (복합 PK)
- `role`: `member` (V1 두 사람 동일 권한)
- `joined_at`, `left_at?`
- `space_active` (boolean): 이 구성원이 속한 공간이 `active`일 때만 true. 공간이 종료·연결 끊기로 `ended`가 될 때 **같은 트랜잭션에서** false로 바꾼다(되돌리지 않는다). "한 사용자는 활성 공간 하나만" 규칙의 부분 고유 인덱스를 걸기 위해서**만** 남긴 비정규화 열이다(아래 "검증 및 동시성 규칙"). 접근 통제는 이 열이 아니라 공간의 `status = active`로 한다.
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
- `asset_kind`: `room_object | mascot_pose`; `variant_group?`, `variant_id?` (조명의 낮/밤 변형처럼 에셋 자체가 낮밤 두 파일일 때만)
- `uri` (앱 내 번들/검증된 manifest 경로; 모델은 임의 URI를 생성할 수 없음)
- `format`, `width_px`, `height_px`, `byte_size`, `sha256`
- `license_kind`, `license_text_version`, `creator`, `source_url?`, `attribution?`, `rights_record_ref`
- `status`: `active | retired`; 기존 장면의 은퇴 에셋은 레거시 렌더 허용 또는 교체 마이그레이션 필요.
- 앱 기본 카탈로그 24~36개를 목표로 하며 방 안 마스코트 포즈도 이 수에 포함한다. 현재 디자인이 내놓은 구성은 마스코트 방 안 포즈 6개 + 일반 소품 18개 = 24개다(`design/assets-manifest.csv`의 `mascot_*` 방 안 6종과 `obj_*` 18종). 소품 포즈 일러스트 5종은 방 밖 용도라 이 엔트리에 두지 않는다.
- 장면 문서는 마스코트를 `asset_id=app_mascot` 오브젝트 **하나**로만 참조한다. 방 안 포즈 6장(`mascot_*`)은 `mascot_pose` 카탈로그 엔트리이고 어떤 포즈를 보일지는 클라이언트가 정한다(장면·서버 데이터가 아님).
- 마스코트는 앱이 소유한 고정 캐릭터라 착용 아이템·슬롯·색 변형 엔트리를 두지 않는다. 기본 디자인과 사용 권리는 앱이 관리한다.

### RoomTheme

- `space_id` (PK), `current_version_id`, `version_counter`
- `updated_at`, `updated_by_user_id`
- 현재 확정 테마 버전만 가리킨다. `current_version_id`와 counter 변경은 트랜잭션으로 한다.

### RoomThemeVersion

- `id`, `space_id`, `version_number` (공간 내 고유 증가값)
- `schema_version`, `scene_document` (JSONB: 카탈로그 오브젝트, **생성 오브젝트 참조**(`assetId = gen:<uuid>`; 데이터는 `GeneratedObject` 행에 있고 장면에는 참조와 배치만 둔다), 텍스트(말풍선 틀 참조 `frameObjectId` 가능). 코드·SVG·URL·원본 도형 데이터는 장면에 넣지 않는다)
- `room_presentation` (JSONB: D-day 별도 네이티브 뷰 표현/표시 여부)
- `room_theme_document` (JSONB: 방 모드 `day | night | follow_time`, IANA `timeZone`, 낮/밤별 배경색·팔레트 및 카탈로그 에셋 variant)
- `source`: `initial | prompt | manual_migration | mascot_recall | milestone_preset | room_mode` (`room_mode`: 방 모드·시간대 변경이 새 버전으로 저장되는 경우, `PATCH /room-mode`) (적용 후 되돌리기 `undo`와 목록에서 고르는 `restore`는 V1에 없다)
- `provenance`: `model_provider?`, `model_id?`, `model_snapshot?`, `request_id?`, `created_at`, `created_by_user_id`
- `content_hash`
- 확정 후 불변. AI 출처는 내부 감사용이며 캔버스에 배지를 렌더링하지 않는다.
- 마스코트는 `asset_id=app_mascot`인 카탈로그 오브젝트로 표현하며 방 초기 문서에 정확히 하나 포함한다. 사용자는 프롬프트로 위치·크기를 정하거나 방에서 제거할 수 있고(결정), 제거되어도 방에는 항상 하나가 있어야 하므로 되살림 규칙(FR-018c)을 따른다: 장면에 없으면 `POST /spaces/{spaceId}/room/mascot-recall`(또는 방을 다시 열 때의 자동 호출)이 기본 자리에 하나를 추가한 새 방 버전(`source: mascot_recall`)을 만든다. 기본 디자인을 교체하거나 그려 넣을 수는 없다.
- 마스코트의 **이용자 설정 상태는 저장하지 않는다**. 이전 문서에 있던 `mascot_state`(슬롯 아이템·팔레트 색·표정·포즈 ID)는 없앴다. 마스코트가 어떤 포즈를 보일지는 앱이 시각·화면·누름 반응에 따라 정하는 클라이언트 동작이며 서버 데이터가 아니다. 크기와 위치는 일반 오브젝트의 좌표 필드를 사용한다.
- UI theme preference는 사용자 설정 `system | light | dark`이며 기본값은 `system`이다. room theme document의 기본 `mode`는 `follow_time`, 기본 `timeZone`은 공간 생성자의 시간대이며 설정에서 둘 다 변경 가능하다.
- 이용자에게 보여 주는 버전 목록(기록)과 적용 후 되돌리기는 V1에 없다. 버전 스냅샷은 **감사 기록(AI 출처·작성자·시각)과 충돌 검사**를 위해서만 서버에 append-only로 저장하고 이용자에게 보이지 않는다. 현재 버전만 방에 쓰인다. 보관 상한과 정리 기간은 이용자 기능이 걸려 있지 않아 감사·남용 조사에 필요한 만큼으로 정하면 되며(plan.md 결정 3), 종료된 공간의 버전은 내부 보관 기간 동안 두었다가 공간의 완전 삭제 때 함께 삭제한다.

### DecorationRequest

- `id`, `space_id`, `session_id`, `requested_by_user_id`, `base_version_id`, `base_version_number`
- `prompt_text` (두 구성원이 보는 공유 대화; 전송 전 동의 확인, 데이터 최소화; 암호화/보관 기간 필요)
- `source`: `ai | milestone_preset` (`milestone_preset`은 AI를 호출하지 않는 앱 프리셋 미리 보기이고 `prompt_text`는 없으며 `preset_id`·`milestone_key`를 가진다. AI 요청 이력과 일일 한도에 세지 않는다)
- `state`: `queued | generated | rejected | previewed | reverted | applied | cancelled | expired | failed` (`reverted`: 열린 대화 안에서 점유자가 이전 미리 보기로 되돌려 더 이상 보이지 않는 후보. 적용된 요청은 되돌릴 수 없다)
- `result_candidate` (스키마 검증된 후보; 원문 모델 출력은 별도 저장하지 않음)
- `failure_code?`, `repair_count` (최대 1), `created_at`, `expires_at`, `applied_version_id?`
- `intent`: `catalog | generate | mixed` (서버가 입력 정책 단계에서 분류), `generation_attempt_id?`, `generated_object_ids[]` (이 후보가 만든 `GeneratedObject` 후보, 최대 2개), `quota_consumed` (boolean, 기본 false; 성공한 미리 보기가 만들어질 때만 true, 아래 "일일 요청 계수")
- 후보와 대화 메시지는 두 구성원에게 공유되지만, 현재 session owner만 후보를 적용할 수 있다. 다른 구성원은 같은 후보를 읽기 전용으로 본다.
- 취소/만료 미적용 후보는 24시간 후 삭제한다. 적용된 prompt 원문은 30일 지원 보관 후 삭제하며, 공간이 종료되면 남은 내용은 공간의 완전 삭제 때 함께 삭제한다.

### GeneratedObject (생성 오브젝트, 2026-10-27 · 가정)

프롬프트로 만든 새 2D 벡터 장식. 커플 전용이며 다른 커플에게 절대 보이지 않는다.

- `id` (UUID PK), `space_id`, `kind`: `background_piece | bubble_frame | prop`, `layer_hint?`: `wall | floor | backdrop | window_view`(배경 조각), `floor | wall | shelf`(소품), 말풍선 틀은 없음
- `label` (1~24자; 한글·영문·가나·숫자·공백·`. , ' -`만, URL·`@`·`<`·`>`·연속 5자리 이상 숫자 금지), `schema_version` (1), `format` (`mopi-shape-v1`)
- `document` (JSONB: 검증·정규화된 도형 목록 — `contracts/generated-object.schema.json`. 도형 ≤40, JSON ≤12KB, viewBox ≤512, 채움색 ≤4가지, 팔레트 허용목록. 원본 모델 출력은 저장하지 않는다), `doc_sha256`, `validator_version`, `style_reference_version` (기준 라이브러리 버전), `style_score?` (스타일 적합도 0~1)
- `status`: `candidate | active | deleted | removed_by_operator` (아래 상태 전이), `parent_id?` (고쳐 만든 경우 이전 행)
- `created_by_user_id`, `source_request_id` (`DecorationRequest`), `model_id?`, `created_at`, `activated_at?`, `deleted_at?`, `removed_at?`, `removed_reason?` (운영자만 읽음)
- 불변: `document`는 저장 뒤 바꾸지 않는다(고치면 새 행). `candidate`는 미리 보기 후보라서 요청한 커플의 두 구성원만 읽고, 적용 확인 시 같은 트랜잭션에서 `active`가 된다. 취소·만료·되돌린 후보는 24시간 뒤 삭제한다(`DecorationRequest` 후보와 같은 기준).
- 커플당 `active + candidate` 합계 상한은 **서버 설정값** `app_config.generation_library_cap`(기본 40, 가정; 앱에 하드코딩하지 않아 나중에 올릴 수 있고 요금제와 연결할 수 있다 — 지금은 설계하지 않음). 상한에 닿으면 새 생성 요청을 모델 호출 전에 `409 LIBRARY_FULL`로 막는다.
- 구성원은 `active` 장식을 지울 수 있다(`deleted`; 점유 불필요). **방(현재 장면)에 놓인 장식도 지울 수 있고**, 이때 장면 버전은 바뀌지 않으며 읽을 때 걸러낸다(두 사람 화면에서 사라짐). 다음 꾸미기 후보 장면은 삭제되거나 운영자가 제거한 참조를 뺀 상태로 만든다(가정). 운영자가 `removed_by_operator`로 바꾸면 같은 방식으로 걸러지고 그 `doc_sha256`·프롬프트 지문은 재생성 차단 목록에 들어간다.
- 읽기: 해당 공간의 활성 구성원(공간이 `ended`이면 읽기도 막는다). 쓰기는 서버 함수만(클라이언트는 직접 쓰지 못한다, RLS는 insert/update/delete를 거부). 공간이 완전 삭제될 때(`purge_after` 이후 예약 작업) 행을 함께 지운다. 장면 버전의 참조(`gen:<uuid>`)는 감사용 스냅샷에 남지만 데이터는 없다.
- 장면에서의 참조 규칙: 대상은 같은 공간의 `active`(미리 보기 후보라면 `candidate`) 행이어야 하고, `bubble_frame`은 텍스트의 `frameObjectId`로만, `background_piece`는 오브젝트로만 쓴다. 배경 조각은 카탈로그 오브젝트와 마스코트 아래 층에 그린다.

### GenerationAttempt (생성 시도 기록, 운영·남용 대응용)

- `id`, `space_id`, `user_id`, `decoration_request_id?`, `created_at`
- `prompt_text` (남용 대응용으로만 보관, 30일 가정 후 삭제, 이용자에게 보이지 않음), `prompt_fingerprint` (정규화한 프롬프트 의도 해시)
- `input_decision`: `allowed | refused`, `input_category?`: `ip | people | unsafe | personal | photo_like | off_purpose | injection | other`
- `output_decision?`: `passed | validator_failed | check_failed | provider_error`, `retry_count` (0~1), `validator_codes[]` (검증 실패 코드 목록), `second_check_decision?`
- `outcome`: `succeeded | refused | failed | blocked`(남용·킬 스위치·상한), `quota_consumed` (outcome=succeeded일 때만 true)
- `model_id?`, `input_tokens?`, `output_tokens?` (비용 추적; 원문 아님). 키·서명 URL·비밀은 저장하지 않는다.
- RLS: 이용자는 읽지 못한다(서버·운영자만). 공간이 완전 삭제되면 함께 지운다.

### AppConfig (원격 설정·킬 스위치)

- `key` (PK), `value` (JSONB), `updated_at`, `updated_by`
- 키: `generation_library_cap`(커플당 보관함 상한, 기본 40), `generation_enabled` (새 장식 생성 허용, 기본 true), `generated_render_enabled` (생성 장식을 방·보관함에서 보여 줄지, 기본 true; 비상 시 false), `generation_min_validator_version` (이보다 낮은 검증기로 저장된 장식은 렌더 전에 다시 검증), `generation_attempt_limits` (시도 한도 값), `daily_request_limit`(하루 성공 횟수, 기본 3; 이 값과 보관함 상한은 나중에 요금제와 연결할 수 있게 설정으로 둔다)
- 서버 함수가 요청마다 읽고, 앱은 스냅샷의 `features`로만 받아 화면을 맞춘다(앱이 직접 쓰지 않는다). 변경은 앱 업데이트 없이 반영된다.

### GenerationBlock (재생성 차단 목록)

- `id`, `space_id?` (null이면 모든 커플), `fingerprint_hash` (프롬프트 지문 또는 `doc_sha256`), `reason`, `created_by_operator`, `created_at`
- 운영자가 신고된 장식을 제거할 때 만든다. 같은 지문의 생성 요청은 입력 정책 단계에서 거절한다(`input_category: ip` 등으로 안내).

### PromptSession

- `id`, `space_id`, `owner_user_id`, `status`: `occupied | released | expired`
- `acquired_at`, `last_activity_at`, `expires_at`, `heartbeat_at?`, `released_at?`, `release_reason?`, `takeover_count`
- 점유권은 공간 단위로 하나만 active할 수 있다. acquire와 takeover는 DB 원자 연산으로 owner를 한 명으로 제한한다.
- 유휴 lease는 3분(만료 30초 전 경고)이며 서버 설정값이다. 의미 있는 사용자 입력/AI 생성 중 heartbeat로 갱신하고 background/닫힌 앱은 heartbeat를 보내지 않아 만료된다. 다른 구성원은 expected owner 및 expiry 검사 후 같은 shared session/preview를 takeover한다.
- confirm/cancel은 데이터 변경과 함께 점유를 해제한다. 열린 대화 안의 되돌리기는 점유를 풀지 않는다. 현재 점유자만 입력·제출·적용할 수 있고 비점유자는 공유 대화와 preview를 읽기 전용으로 본다.

### PromptMessage

- `id`, `space_id`, `session_id`, `decoration_request_id?`, `author_user_id?`
- `kind`: `user_prompt | preview | status`; `body_text?`, `created_at`
- 공유 기록이므로 구성원 두 명만 읽을 수 있다. realtime payload에는 메시지 ID와 변경 종류만 보내고 클라이언트가 권한검사된 endpoint에서 내용을 가져온다.
- 취소/만료 후보는 24시간 후 삭제하고 applied prompt/status message는 30일 후 삭제한다. 공간이 종료되면 남은 내용은 공간의 완전 삭제 때 함께 삭제한다.

### HomeCoverPhoto

공간당 최대 한 장의 홈 커버(배경) 사진. 장면 문서·AI 문맥과 분리된 별도 행이다.

- `space_id` (PK, `CoupleSpace` 참조) — 공간당 한 행
- `status`: `none | uploading | ready | failed`. `none`은 행 없음과 같으며 기본 바탕을 보여 준다.
- `current_object_path?` (Storage 비공개 버킷 `home-covers` 안의 경로, 서버 재인코딩 결과), `content_type`, `byte_size`, `width_px`, `height_px`, `sha256`
- `crop?` (자르기 영역: 정규화 `x`, `y`, `width`, `height`; 커버 비율은 앱이 고정)
- `version` (바뀔 때마다 증가, 마지막 변경 우선 판단), `uploaded_by_user_id`(홈에서 **누가 마지막으로 바꿨는지** 보여 줌, 사진을 없앤 사람도 같은 필드에 기록), `uploaded_at`, `updated_at`
- `pending_delete[]` (교체·삭제로 남은 이전 객체 경로와 삭제 예정 시각; 새 사진 저장 확인 후 24시간 뒤 삭제, plan.md)
- 주소(URL)는 저장하지 않는다. 앱은 RLS로 권한을 확인한 짧은 수명의 서명된 URL만 요청해 쓴다.
- 읽기·쓰기·교체·삭제: 활성 공간 구성원(점유 세션 불필요). 공간이 `ended`이면 읽기(서명 주소 발급)도 새 업로드도 막는다(사진 파일은 완전 삭제 때까지 서버에 남지만 이용자는 읽을 수 없다).
- 허용 형식·크기(승인): JPG·PNG·HEIC, 원본 20MB 이하. 저장본은 EXIF/XMP를 제거한 재인코딩 사본이다.
- 상태 전이: `none --upload ok--> ready`, `ready --replace ok--> ready (version+1)`, `ready --remove--> none`, `none/ready --upload fail--> (이전 상태 유지, 실패는 클라이언트 표시)`. 새 사진 저장이 끝나기 전에는 기존 사진을 바꾸지 않는다.
- 삭제(결정): 공간이 완전 삭제될 때(`purge_after` 이후 예약 작업) 객체(현재 객체와 `pending_delete[]`)를 먼저, 그다음 행을 지운다. 종료된 동안에는 이용자가 읽을 수 없다.
- `SpaceLifecycleEvent`와 달리 사진 변경은 감사 이벤트에 개인 내용(경로, 파일명)을 넣지 않고 `cover_changed`/`cover_removed` 종류만 남긴다(정형 속성).

### MilestoneCelebration

마일스톤마다 한 번 만드는 기록. 장면 문서와 AI 문맥과 분리된 별도 행이다.

- `id`, `space_id`, `milestone_key` (`d50 | d100 | d200 | d300 | d500 | d1000 | y1 | y2 | y3 …`), `kind`: `day | anniversary`, `milestone_days?` (일수 마일스톤만: 50, 100, 200, 300, 500, 1000), `anniversary_n?` (주년만: 1, 2, 3 …)
- `milestone_date` (방 시간대 기준 달력 날짜. 일수 마일스톤 = 함께한 날짜 + `milestone_days` − 1, 주년 = 함께한 날짜 + N년의 같은 달·일. 2월 29일 시작의 평년 주년은 2월 28일), `priority` (`anniversary` > `day`; 같은 날짜가 겹치면 하나만 만들고 우선순위가 높은 쪽), `status`: `active | passed`
- `preset_applied_version_id?` (기념 제안이 적용되어 새 방 버전이 만들어졌을 때), `created_at`
- 유일: `(space_id, milestone_key)` — 커플당 한 번. 서버가 `GET /milestones/current`에서 필요할 때 만든다(별도 스케줄러 없음).
- 보이는 기간: `milestone_date`부터 7일 이내(결정). 그 뒤에는 `passed`로 바꾸고 보이지 않는다.
- 두 구성원이 모두 참여한 활성 공간에서만 만든다. 공간이 종료되면 만들지도 보이지도 않는다. 공간이 완전 삭제되면 함께 지운다.

### MilestoneSeen

- `celebration_id`, `member_user_id` (복합 PK), `seen_at`, `via`: `home | room`
- 구성원이 카드나 말풍선을 닫으면 한 행. 상대에게 영향 없음. 같은 요청을 다시 보내도 그대로(멱등). 오프라인에서 닫은 기록은 연결 후 전달한다.
- 읽기: 본인 행과 "상대가 봤는지"는 필요 없으므로 상대 행은 읽지 않는다(RLS로 본인 행만).

### Report (신고)

- `id`, `space_id`, `reporter_user_id`, `target`: `partner | shared_text | room_scene | generated_object` (홈 커버 사진은 대상이 아니다; 사진 신고는 Open Decisions 12), `reason`: `harass | inappropriate | privacy | copyright | other` (`copyright`는 생성 장식 신고용), `detail?` (선택 메모, 200자 이내; 상대에게 보이지 않는다), `message_id?`, `generated_object_id?` (target=generated_object일 때), `created_at`, `status`: `received | reviewed`
- `hidden_for_reporter` (boolean; target=generated_object이면 접수 즉시 true — 신고자의 읽기에서만 그 장식을 걸러 숨긴다), `outcome?`: `removed | kept` (운영자 검토 결과), `reviewed_at?`, `reviewer_note?` (운영자만 읽음), `reporter_notified_at?` (검토를 마쳤다는 안내를 신고자에게 한 번 보인 시각)
- 연결 끊기와 별개다. 신고는 운영자가 읽는 접수 기록이다. 이용자(신고자)는 자기 신고의 `status`·`outcome`만 읽는다(앱에는 "접수됨"과 "검토를 마쳤어요"로 보이고 사유·메모는 상대에게 노출되지 않는다). 운영자가 `removed`로 정하면 `GeneratedObject.status = removed_by_operator`와 `GenerationBlock`이 같은 트랜잭션에서 생긴다. 사용자당 하루 10건 한도(가정, `429 REPORT_RATE_LIMITED`). 보관 기간은 개인정보 검토 후 정한다.

### SpaceEndNotice (종료 알림, 테이블 `space_end_notice`)

- `user_id`, `kind`: `ended | disconnect`, `by_user_id` (응답의 `by: me | partner`는 읽는 사람 기준으로 서버가 계산), `at`, `acked_at?`, `space_id` (서버 내부 참조만; **API로 나가지 않는다**)
- 공간이 종료될 때 두 구성원 각자에게 한 행씩 만든다. `GET /spaces/mine`의 `ended`는 확인하지 않은 가장 최근 행 하나의 `{ kind, by, at }`만 돌려준다(여럿이면 가장 최근 하나, 가정). `POST /spaces/mine/ended/ack`가 `acked_at`을 채운다(멱등).
- 공간 데이터·사용할 수 있는 공간 식별자·삭제 일정을 담지 않는다. 공간의 완전 삭제 때 함께 지운다(늦어도 그때까지). RLS: 본인 행만 읽고, 쓰기는 서버 함수만.

### SpaceLifecycleEvent

- `id`, `space_id`, `event_type`: `ended | disconnected | deletion_started | deletion_completed | cover_changed | cover_removed | milestone_preset_previewed | milestone_preset_applied | generated_object_applied | generated_object_deleted | generated_object_removed | generation_blocked | report_reviewed` (마일스톤 두 종류는 정형 속성만: `milestone_key`, 생성·신고 이벤트는 객체·신고 ID와 종류만)
- `actor_user_id`, `occurred_at`, `metadata` (개인 내용을 넣지 않는 정형 속성)
- `disconnected`는 "연결 끊기"(API `block`)로 공간이 종료된 경우이고 `ended`와 같은 상태 전이를 만든다(`ended_reason: disconnect`).
- 공간 종료와 완전 삭제의 시작·완료를 **내용 없이** 감사한다. 이 이벤트는 공간 행이 지워진 뒤에도 남을 수 있도록 `space_id`를 외래 키 없이 보관한다(개인 내용 없음). 최소 이벤트 보관기간/법적 예외는 개인정보 검토 후 결정한다. `generation_block` 지문(개인정보 없음)은 공간이 지워져도 남긴다.

## 상태 전이

```text
CoupleSpace: active --end by either member--> ended (ended_reason=ended, purge_after=ended_at+30일[내부])
active --disconnect(block) by either member--> ended (ended_reason=disconnect, ended_by=호출자)
active --계정 삭제(가정, 설계 전)--> ended (ended_reason=account_deletion)
ended --purge_after 경과 + 예약 작업 성공--> (행 없음; 저장소 파일 먼저, 그다음 모든 행)
ended --예약 작업 실패--> ended (그대로 보이지 않음, 다음 실행에서 재시도)
  (ended에서 active로 돌아가는 전이는 없다 — 복구 없음)

GeneratedObject: (없음) --생성 성공--> candidate --적용 확인(같은 트랜잭션)--> active
candidate --취소/만료/되돌림 24시간 뒤--> deleted
active --구성원 삭제(장면에 없을 때만)--> deleted
active --운영자 제거--> removed_by_operator (장면 문서는 그대로, 읽을 때 걸러냄)
Report(generated_object): received(hidden_for_reporter=true) --운영자 검토--> reviewed(outcome=removed|kept)

Invitation: active --accept once--> accepted
active --expiry--> expired
active --reissue/revoke--> revoked

DecorationRequest: queued --valid candidate--> generated --> previewed
previewed --confirm at matching base version--> applied
previewed --cancel/expiry--> cancelled/expired
previewed --undo within the open session--> reverted (이전 후보 또는 현재 방 보기로, 점유 유지)
applied --(되돌리기 없음)
MilestoneCelebration: (없음) --처음 조회한 날 milestone_date부터 7일 이내--> active --7일 경과--> passed
active --함께한 날짜 변경으로 milestone_date가 미래가 됨--> (삭제, 새 날짜에 다시 생성)
MilestoneSeen: (없음) --구성원이 닫음--> seen (되돌리지 않음)
알림 예약(기기 안, 서버 저장 없음): (없음) --알림 켜고 권한 허용--> scheduled(다가오는 마일스톤 몇 개) --날짜/시간대 변경·업데이트--> rescheduled --공간 종료·연결 끊기·로그아웃·알림 끄기--> cancelled
queued/generated --invalid result/provider failure--> rejected/failed
```

## 검증 및 동시성 규칙

- 마일스톤: 일수는 방 시간대의 오늘 날짜와 `anniversary_date`로 서버에서 계산한다(기기 시계 불사용). 함께한 날짜 변경 시 기록된 `milestone_key`는 유지하되 새 `milestone_date`가 오늘보다 뒤이면 행과 `MilestoneSeen`을 지운다. 그 밖의 기록은 그대로 둔다.
- 마일스톤 알림: **서버에 저장하는 것이 없다**. 알림 켜짐 여부와 예약 목록은 기기 로컬 저장소에만 두고(구성원 기기마다), 서버는 `GET /milestones/current`의 `upcoming`(다가오는 마일스톤 목록)만 계산해서 준다. 푸시 토큰은 만들지도 저장하지도 않는다.
- 마일스톤 제안 미리 보기: 점유 세션 owner만, 현재 방 버전 기준(`base_version_number` 검사), 방 오브젝트 16개·문구 3개 한도 내에서만 만든다. confirm은 기존 경로와 같다.

- 공간 구성원 수 ≤ 2; 초대 수락은 단일 DB 트랜잭션.
- 요청 시 공간 활성, 사용자 구성원, 필요한 동의가 모두 유효해야 한다. 권장 정책은 두 명 모두 유효 동의가 있어야 외부 AI 호출 가능.
- **일일 요청 계수**(2026-10-27 개정): `space_id` 기준으로 **방 시간대의 날짜**(자정 초기화)를 키로 센다. 한도는 커플당 **3회**이고 초과 응답은 `429 DAILY_LIMIT_REACHED`. **성공한 미리 보기(유효한 후보가 만들어져 두 사람에게 보인 요청)만 센다**(가정): 요청 시작 때 `DecorationRequest`에 예약(`quota_consumed=false`)하고, 성공으로 끝나는 같은 트랜잭션에서 `daily_request_count`를 atomic increment하며 `quota_consumed=true`로 바꾼다. 입력 정책 거절, 검증 실패, 2차 검사 실패, 제공자 오류는 센 값을 바꾸지 않는다. 점유 lease로 한 커플의 동시 요청은 하나뿐이지만 한도 검사(`count < 3`)와 증가는 한 트랜잭션에서 한다. 마일스톤 제안(AI 호출 없음)은 계수하지 않는다.
- **남용 한도(별도)**: `GenerationAttempt` 기준으로 커플당 하루 시도 30회(거절·실패 포함), 사용자당 분당 4회, 거절이 1시간 안에 5번 연속이면 그 커플의 생성을 1시간 쉬게 하고(쿨다운, `429 RATE_LIMITED` + 다시 시도 시각), 하루 15번 거절되면 그날은 생성을 막고 운영자에게 표시한다. 이 값은 서버 설정(`generation_attempt_limits`)이다.
- **생성 장식 검증 규칙**: 장면의 `gen:<uuid>` 참조는 같은 공간의 `active`/`candidate` 행이어야 하고 종류가 맞아야 한다(`bubble_frame`은 텍스트의 틀로만, `background_piece`는 오브젝트로만). 생성 오브젝트는 장면의 오브젝트 16개 한도에 포함된다. 배경 조각의 `zIndex`와 상관없이 렌더 순서는 배경 조각 < 카탈로그 오브젝트·마스코트 < 텍스트다. 장면에 쓰인 생성 장식은 보관함에서 지울 수 없다. 렌더 직전에 `validator_version`이 `generation_min_validator_version`보다 낮으면 다시 검증하고, 실패한 장식은 그리지 않는다.
- **생성 요청 순서(서버)**: 권한·동의·공간 활성·킬 스위치·보관함 여유 → 시도 한도 → 입력 정책(결정론 필터 + 분류 호출) → 생성 호출 → 형식 검증·정규화 → 2차 검사 → 후보 저장 → 성공 때만 횟수 증가. 어느 단계든 실패하면 후보를 저장하지 않고 횟수도 쓰지 않는다. 멱등 키로 같은 요청은 같은 결과를 돌려준다.
- 한 사용자(`user_id`)는 **활성** 공간의 `SpaceMember`를 하나만 가진다(FR-057): 부분 고유 인덱스 `unique (user_id) where space_active`. 종료된 공간의 구성원 행은 `space_active = false`이므로 새 공간 생성·초대 수락을 막지 않는다(종료 직후 바로 가능). 종료·연결 끊기는 공간 `status`와 두 구성원의 `space_active`를 한 트랜잭션에서 바꾸며 이 열을 다시 true로 되돌리는 전이는 없다. 같은 사용자의 동시 요청은 사용자 단위 어드바이저리 락(`pg_advisory_xact_lock(hashtext(user_id))`)으로 직렬화한다.
- **종료 접근 차단(FR-023)**: 모든 읽기·쓰기 RLS와 서버 함수는 공간 `status = 'active'`를 조건에 둔다. 종료된 공간에 대한 호출은 비구성원과 구분되지 않게 `404`로 거절한다(예외: 종료 알림 `GET /spaces/mine`·`POST /spaces/mine/ended/ack`는 공간이 아니라 사용자 기준이다). Storage 정책도 같은 조건이다.
- **완전 삭제 작업(`purge_expired_spaces()`, 내부 예약 작업, 클라이언트 API 아님; FR-024)**: `status = 'ended' and purge_after <= now()`인 공간마다 ① Storage 객체(홈 커버 현재 객체와 `pending_delete[]`)를 먼저 지우고(없으면 성공으로 본다) ② 한 트랜잭션에서 그 공간의 모든 행을 지운다: `CoupleSpace`, `SpaceMember`, `Invitation`, `RoomTheme`과 버전, `DecorationRequest`, `PromptSession`과 `PromptMessage`, `HomeCoverPhoto`, `MilestoneCelebration`·`MilestoneSeen`, `GeneratedObject`, `GenerationAttempt`, 그 공간의 `Report`(기본 가정; Open Decisions 21), 일일 요청 계수 행, `SpaceEndNotice`, `SpaceLifecycleEvent`의 개인 내용 있는 `metadata`. 공간 단위로 멱등이고 재시도에 안전하다. 실패하면 공간은 `ended` 그대로(이미 보이지 않음)여서 부분 삭제로 보이는 상태가 없다. `deletion_started`/`deletion_completed` 이벤트만 내용 없이 남기고 `GenerationBlock` 지문은 지우지 않는다. 한 번 실행에서 처리할 공간 수는 상한을 두어 오래 걸리는 실행을 피한다.
- 후보/confirm은 `base_version_number`를 검사한다. 오래된 제안은 적용하지 않고 최신 테마로 재요청을 요구한다.
- scene document의 `objects.length ≤ 16`, `texts.length ≤ 3`; 각 노드는 스키마의 범위 제한을 만족해야 한다.
- `PromptSession`은 공간당 하나만 `occupied` 상태일 수 있다. heartbeat는 최근 사용자 활동이 있을 때만 `expires_at`을 갱신한다. 세션 만료 후 takeover는 만료된 session ID와 예상 owner를 조건으로 원자적으로 새 owner에게 양도한다.
- prompt, preview, confirm, cancel, 세션 안 undo endpoint는 유효한 session owner를 확인한다. confirm의 owner/session/expected version 검사, idempotency key 처리, 새 version 저장, lease release를 한 DB transaction에서 수행한다.
- 새 방의 초기 scene은 유효한 마스코트 오브젝트를 정확히 하나 포함한다. 이후 scene에서는 마스코트가 없거나 하나일 수 있으며(사용자가 제거한 상태, 되살림 대상), 중복은 거부한다. 마스코트가 있을 때 전체 16개 오브젝트 한도에 포함된다. validator는 본체 asset ID의 단일성을 검사하고 마스코트에 붙은 상태 필드(`mascotState` 등), 교체 본체, 사용자 이미지, 기존 캐릭터/브랜드 복제 요청을 거부한다.
- 홈 커버 사진은 scene 문서·room theme 문서·프롬프트 문맥 어디에도 참조되지 않는다. 사진 파일 참조나 URL이 scene에 들어오면 거부한다.
- 홈 커버 사진 업로드는 서버가 구성원·공간 `active` 상태·형식·크기·이미지 헤더를 검사한 뒤 재인코딩한 사본만 저장하고, 새 객체가 저장되기 전에는 `current_object_path`를 바꾸지 않는다. 같은 공간의 동시 교체는 `409`로 막지 않고 **마지막으로 확정된 하나만 남기며**(마지막 변경 우선, 결정) 먼저 확정된 쪽의 객체는 삭제 대기 목록에 넣는다.
- 보호 영역과 대비 validator는 day/night 방 모드와 light/dark 인터페이스의 네 조합 각각에서 가림과 글자 가독성을 검사한다. 색은 허용 토큰으로 제한하고 모든 조합에서 대비 기준을 충족해야 한다.
- 장면 오브젝트의 ID는 현재/레거시 허용 목록과 일치해야 한다. 외부 URL 및 임의 필드는 거부한다.
- D-day의 날짜는 `anniversary_date`로부터 앱 규칙에 따라 계산한다. AI/장면 입력은 숫자·날짜 원본을 덮어쓸 수 없다.
- 커플이 쓴 장면 문구는 입력된 원문 그대로 저장한다. 화면 UI 문자열은 번역 키를 사용하고 D-day, 날짜, 숫자 형식은 현재 locale로 렌더링한다.
- 보호 영역은 네이티브 화면의 실제 뷰 측정과 사용자의 글자 크기 설정에서 계산한다. 서버는 기준 viewport에서도 확인하고, 기기 렌더 직전에 클라이언트가 같은 규칙으로 재검사한다.
- Room theme validator와 대비 검사는 방 theme mode·저장된 IANA timezone, UI light/dark preference의 조합을 사용한다. timezone 변경은 새 RoomThemeVersion을 만들고 두 구성원에게 동기화한다.
