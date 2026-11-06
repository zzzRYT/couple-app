# Data Model: 커플 D+Day V0

기존 스키마(`supabase/migrations/20261101000100_base_schema.sql` 등)에 더하는 것만 적는다. 모든 새 마이그레이션은 첫 10줄 안에 `-- rollback:` 헤더가 있어야 한다(`tools/ci/check-migrations.mjs`). RPC는 기존 관례대로 `security definer set search_path = ''`, `public.require_member(actor, target)`로 구성원 확인, `revoke all ... from public, anon, authenticated; grant execute ... to service_role`.

## 1. 서버 (Postgres)

### 1.1 `user_profile` 확장 — `20261103000100_v0_member_profile.sql` (S2)

| 열 | 타입 | 제약 | 뜻 |
|---|---|---|---|
| `display_name` | `text` | null 또는 `char_length(btrim(display_name)) between 1 and 20`(코드 포인트; 앱이 grapheme 10자를 먼저 막음), 앞뒤 공백 없음 | 상대에게 보이는 이름 |
| `birth_month` | `smallint` | null 또는 1~12 | 생일 월 |
| `birth_day` | `smallint` | null 또는 1~31, `make_date(2000, birth_month, birth_day)`가 유효(2월 29일 허용) | 생일 일 |
| `birth_year` | `smallint` | null 또는 1900 이상, 월·일이 있을 때만(현재 연도 이하·그 해에 유효한 날짜인지는 RPC가 검사; `now()`를 쓰는 CHECK는 다시 검사되지 않으므로 쓰지 않음) | 본인에게만 보이는 연도 |
| `profile_updated_at` | `timestamptz` | | 마지막 프로필 수정 |

- 제약: `(birth_month is null) = (birth_day is null)`, `birth_year is null or birth_month is not null`.
- `char_length`는 코드 포인트 수다. 앱은 사용자 인지 문자(grapheme) 기준 10자를 먼저 막고, 서버는 코드 포인트 20 이하 + trim 후 1자 이상으로 느슨하게 검사한다(이모지 결합 문자 대비). — 이 숫자는 구현 판단이며 디자인 사실이 아니다.
- RPC `set_member_profile(actor uuid, p_name text, p_month smallint, p_day smallint, p_year smallint) returns jsonb`: upsert, 검증 실패 `INVALID_REQUEST`, 결과 `{displayName, birthday: {month, day, year} | null}`. 활성 공간이 있으면 `notify_space(space_id, 'member', '{"kind":"profile"}')`.
- 계정 삭제: `user_profile`은 `auth.users` cascade(기존). 삭제 요청 순간 `begin_account_deletion`이 `user_profile`을 비우는 update(`20261102000900_account_deletion.sql:120`)에 `display_name`, `birth_*`도 null로 넣도록 같은 마이그레이션에서 재정의한다. `set_member_profile`은 `status='deleting'`이면 `ACCOUNT_DELETING`.

### 1.2 공간 시간대·사귄 날 변경 기록 — `20261103000200_v0_space_time_zone.sql` (S2)

- `couple_space`에 `anniversary_changed_by uuid references auth.users(id) on delete set null`, `anniversary_changed_at timestamptz` 추가.
- `update_anniversary(actor, target, anniversary, expected)` 재정의: 기존 동작(`20261102000700_milestones.sql:101-121`) + 두 열 채우기. 시간대는 `couple_space.time_zone`만 사용.
- `milestone_context`, `record_milestones`, `mark_milestone_seen` 재정의: `room_theme_document->>'timeZone'` coalesce를 없애고 `couple_space.time_zone`만 쓴다(S2에서 시간대를 바꿔도 서버 축하가 같은 시간대를 쓰게).
- 새 RPC `update_space_time_zone(actor uuid, target uuid, tz text, expected timestamptz) returns jsonb`: `pg_timezone_names` 검증, `date_trunc('milliseconds', updated_at)` 비교로 `VERSION_CONFLICT`, `couple_space.time_zone`과 `updated_at` 갱신, `notify_space(target, 'member', '{"kind":"timezone"}')`. prompt session 잠금을 쓰지 않는다. 방 테마 문서는 바꾸지 않는다(V0에서 방은 숨김).

### 1.3 snapshot 확장 — `20261103000300_v0_snapshot.sql` (S2) → `…500` (S3)

`space_snapshot(actor, target)`의 결과에 더한다(기존 키는 유지):

```jsonc
{
  "space": { /* 기존 */ "anniversaryChangedBy": "uuid|null", "anniversaryChangedAt": "timestamptz|null" },
  "members": [ { "userId": "…", "aiConsentState": "…", "displayName": "하루|null",
                 "birthday": { "month": 3, "day": 14 } | null,       // S3: 상대 생일은 둘 다 있을 때만, 연도 없음
                 "hasBirthday": true } ],                           // S3: 날짜 없이 "넣었는지"만(V0-set-me·bwait 안내용)
  "me": { "userId": "…", "displayName": "도담|null",
          "birthday": { "month": 7, "day": 2, "year": 1998 | null } | null },
  "anniversaries": [ /* S3, 1.5의 공개 형태 */ ]
}
```

S2 단계에서는 `members[].birthday`를 항상 `null`로, `hasBirthday`를 `false`로, `anniversaries`를 `[]`로 둔다(S3가 채운다). 이렇게 하면 앱 타입이 S2부터 고정된다.

### 1.4 축하 목록 변경 — `20261103000400_v0_milestones.sql` (S3)

- `milestone_celebration`의 check 제약 두 개(`20261102000700_milestones.sql:5`, `:15`)를 지우고 `d(50|100|150|200|300|500|1000)`과 `milestone_days in (50,100,150,200,300,500,1000)`으로 다시 만든다. 500·1000 옛 기록은 남기고, 새로 기록하지 않는다(서버 목록에서 뺐기 때문).
- 시간대 단일화는 §1.2(S2)에서 이미 했다. 이 마이그레이션은 제약과 서버 목록만 바꾼다. 제약 이름은 자동 이름 `milestone_celebration_milestone_key_check`, `milestone_celebration_check`(pg_constraint로 확인).
- `supabase/functions/_shared/milestones.ts`: `DAY_MILESTONES = [50, 100, 150, 200, 300]`.

### 1.5 직접 추가 기념일 — `20261103000500_v0_custom_anniversary.sql` (S3)

테이블 `public.space_anniversary`:

| 열 | 타입 | 제약 |
|---|---|---|
| `id` | `uuid` pk default `gen_random_uuid()` | |
| `space_id` | `uuid not null references couple_space(id) on delete cascade` | |
| `title` | `text not null` | trim 후 1자 이상, 코드 포인트 40 이하(앱이 20자 grapheme 검사) |
| `memo` | `text` | null 또는 코드 포인트 200 이하(앱이 100자 grapheme 검사) |
| `event_date` | `date not null` | 원래 날짜(매년이면 월·일만 의미, 연도는 처음 해) |
| `repeat` | `text not null` | `in ('yearly','once')` |
| `created_by` | `uuid references auth.users(id) on delete set null` | |
| `created_at` | `timestamptz not null default app_now()` | |
| `updated_by` | `uuid references auth.users(id) on delete set null` | |
| `updated_at` | `timestamptz not null default app_now()` | |
| `version` | `integer not null default 1` | 수정마다 +1 |
| `deleted_at` | `timestamptz` | 소프트 삭제 |

- 인덱스: `(space_id) where deleted_at is null`.
- 공간당 활성 기념일 최대 200개(남용 방지, 구현 판단) — 넘으면 `INVALID_REQUEST`.
- RLS: `enable row level security`; 정책 `space_anniversary_member_read for select to authenticated using (public.is_space_member(space_id) and deleted_at is null)`; `revoke insert, update, delete ... from authenticated, anon`.
- RPC:
  - `create_custom_anniversary(actor, target, p_title, p_memo, p_date, p_repeat) returns jsonb` → 공개 형태.
  - `update_custom_anniversary(actor, target, p_id, p_expected_version, p_title, p_memo, p_date, p_repeat) returns jsonb` → `deleted_at` 있음: `raise exception 'NOT_FOUND:{"gone":true}'`(`_shared/db.ts`가 `:` 뒤 JSON을 extra로 넘김), 없음: `NOT_FOUND`, 버전 다름: `VERSION_CONFLICT`.
  - `delete_custom_anniversary(actor, target, p_id, p_expected_version) returns void` → 소프트 삭제(`deleted_at`, `updated_by`, `version+1`). 이미 삭제됨: `NOT_FOUND`(gone). 버전 다름: `VERSION_CONFLICT`.
  - 모든 변경 뒤 `notify_space(target, 'anniversary', jsonb_build_object('id', id))`.
- 공개 형태(snapshot·응답): `{ id, title, memo, date: "YYYY-MM-DD", repeat, createdBy, createdAt, updatedBy, updatedAt, version }`.
- 정리: 공간 종료 후 purge(`lifecycle-sweep`)는 `couple_space` 삭제로 cascade. 소프트 삭제 행은 30일 뒤 지워도 되지만 V0에서는 공간 수명과 같이 둔다(rollback 헤더에 적음).
- 생일 공개 규칙(같은 마이그레이션에서 `space_snapshot` 재정의): 상대의 `birthday`는 `me`와 상대 모두 `birth_month is not null`일 때만 `{month, day}`, 아니면 `null`. 연도는 상대에게 절대 보내지 않는다.

### 1.7 비밀번호·봉인 토큰 — `20261106000100_v0_password_auth.sql` (S7)

- 비밀번호는 Supabase Auth의 `auth.users.encrypted_password`(bcrypt)에만 있다. 우리 테이블에는 어떤 형태로도 없다. `account_has_password(actor)`는 값이 있는지만 답한다.
- `password_attempt(key_hash text pk, failures int, locked_until timestamptz, updated_at timestamptz)`: `key_hash`는 정규화한 이메일의 HMAC-SHA256(서버 키)이라 표만으로 이메일을 알 수 없다. RLS 켜고 anon·authenticated 권한 없음. 없는 이메일도 같은 행을 만든다. `password_attempt_take`가 검사 전에 횟수를 먼저 올려서 동시 요청도 5회를 넘지 못하고, 성공하면 `password_attempt_clear`, 제공자 장애면 `password_attempt_refund`로 되돌린다. 하루 지난 행은 `take`가 지운다.
- `apple_credential(user_id uuid pk → auth.users cascade, sealed text, stored_at timestamptz)`: `credentialBox`로 봉인한 Apple refresh token. `begin_account_deletion`이 삭제를 받아들일 때 지운다(재시도용 사본은 기존대로 `account_deletion`에 최대 24시간).
- `user_profile.password_prompt_seen_at timestamptz`: 비밀번호 안내를 본 시각(기기를 바꿔도 다시 묻지 않게).
- `app_settings`: `auth_email_enabled`(false, 메일 연결 값 하나), `review_login_email`(App Review 데모 주소), `password_attempt_limit`(5), `password_lock_seconds`(600).
- 트리거 `guard_email_signup`(`auth.users` before insert): `raw_app_meta_data.provider = 'email'`이고 `auth_email_enabled`가 꺼져 있으면 `review_login_email`과 같은 주소만 통과시킨다. Apple 등 다른 제공자는 막지 않는다.

### 1.6 상태 전이

- 직접 추가 기념일: `active(version n)` →(수정)→ `active(n+1)` →(삭제)→ `deleted(n+2)`. `deleted`에서 되살리기 없음.
- 공간: 기존(`active` → `ended` → purge). 연결 끊기 = `end_space(reason='disconnect')`.

## 2. 기기 로컬

| 이름 | 저장소 | 키 | 내용 | 지우는 때 |
|---|---|---|---|---|
| 알림 설정 | 앱 문서 디렉터리 JSON(`expo-file-system`) | `v0-notify-<userId>.json` | 객체 `{ enabled, time, early, kinds, offIds, prePromptSeen }`(S3는 `offIds`만 씀, 배열 단독 저장 금지) | 로그아웃·탈퇴 |
| 초대 코드(평문) | `expo-secure-store` | `v0.invite.<spaceId>` | `{ code, expiresAt }`(서버는 해시만 저장하므로 홈 대기 카드용) | 상대 참여·종료·로그아웃·탈퇴 |
| 축하 닫기(생일·직접·시즌) | `expo-secure-store` | `v0.celebration.seen.<spaceId>.<userId>` | 발생 키 배열(최근 50개) | 로그아웃·종료·탈퇴 |
| 연결 완료를 봄 | `expo-secure-store` | `v0.connected.seen.<spaceId>.<userId>` | `true` | 로그아웃·종료 |
| 상대 사귄 날 변경 안내를 봄 | `expo-secure-store` | `v0.partnerEdited.seen.<spaceId>.<userId>` | 마지막으로 본 `anniversaryChangedAt` | 로그아웃·종료 |
| 마지막 V0 데이터(A-22) | 앱 문서 디렉터리(`expo-file-system`) | `v0-cache-<userId>.json`(`{ savedAt, userId, spaceId, snapshotV0Part }`) | 마지막 snapshot의 V0 부분(이름·생일 월일·기념일·사귄 날·시간대, 토큰 없음) | 로그아웃·종료·탈퇴 |
| 위젯 스냅샷 | App Group 컨테이너 | `widget-v0.json`(expo-widgets면 `updateTimeline`/`updateSnapshot` API) | [contracts/widget-snapshot.schema.json](./contracts/widget-snapshot.schema.json) | 로그아웃·종료·탈퇴 시 `state: none/ended`로 덮어씀 |

`expo-secure-store` 값은 작게 유지한다(2KB 안). 축하 닫기 배열은 최근 50개만 둔다. 커질 수 있는 알림 설정은 파일에 둔다.
