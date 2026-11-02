# V0 API Contract (Edge Functions)

All routes follow the existing conventions in `supabase/functions/_shared/http.ts`: bearer auth required, JSON bodies, mutations are idempotent (client sends `Idempotency-Key` header or `idempotencyKey` in the body — `api.json(..., { keyInBody: true })` in `apps/mobile/src/lib/api.ts`), errors are `{ "error": { "code": <ErrorCode>, "retryable": bool, ...extra } }` with the codes in `supabase/functions/_shared/errors.ts`. No new error codes.

The app reaches them through `apps/mobile/src/lib/routes.ts` (`<function>/<path>`) and `apps/mobile/src/lib/client.ts`.

## Existing routes reused unchanged

`POST /spaces`, `GET /spaces/mine`, `POST /spaces/mine/ended/ack`, `POST /spaces/:spaceId/block` (disconnect), `PATCH /spaces/:spaceId/anniversary` (start date), invitations (`POST /spaces/:spaceId/invitations`, `POST /invitations/preview`, `POST /invitations/accept`), `GET|PATCH /profile/preferences`, `POST /account/deletion`, `POST /spaces/:spaceId/milestones/:celebrationId/seen`.

## Changed

### `GET /spaces/:spaceId/snapshot` (S2, S3)

Adds fields; never removes. See `data-model.md` §1.3.

```jsonc
{
  "space": { "spaceId": "…", "status": "active", "anniversaryDate": "2025-06-29", "timeZone": "Asia/Seoul",
             "memberCount": 2, "updatedAt": "…", "invitation": null,
             "anniversaryChangedBy": "uuid|null", "anniversaryChangedAt": "…|null" },
  "members": [ { "userId": "…", "aiConsentState": "not_given", "displayName": "하루", "birthday": { "month": 3, "day": 14 }, "hasBirthday": true } ],
  "me": { "userId": "…", "displayName": "도담", "birthday": { "month": 7, "day": 2, "year": null } },
  "anniversaries": [ { "id": "…", "title": "처음 만난 날", "memo": null, "date": "2025-05-03", "repeat": "yearly",
                       "createdBy": "…", "createdAt": "…", "updatedBy": "…", "updatedAt": "…", "version": 3 } ],
  "...": "existing keys (versionNumber, sceneDocument, roomThemeDocument, promptSession, serverTime, …)"
}
```

- `members[].birthday` is the partner's `{month, day}` only when both members have a birthday; otherwise `null`. Never a year. `members[].hasBirthday` says only whether that member entered one (drives `anniv.birthday.wait` and `set.me.birthday.partnerWait`).
- `anniversaries` excludes soft-deleted rows. Ordered by `date, id`.
- S2 ships `birthday: null` for members and `anniversaries: []`; S3 fills them.

### `GET /spaces/:spaceId/milestones/current` (S3)

Same response shape (`MilestoneResponse` in `client.ts`). Day milestones are now 50, 100, 150, 200, 300; the time zone is `couple_space.time_zone`.

## New

### `PUT /profile/member` (S2)

Body: `{ "displayName": "도담", "birthday": { "month": 7, "day": 2, "year": 1998 } | null }`

- `displayName`: string, trimmed, 1..10 graphemes (server: 1..20 code points after trim).
- `birthday.month` 1..12, `birthday.day` valid for that month in a leap year (Feb 29 allowed); `year` optional integer 1900..current year and must make a valid date.
- 200: `{ "displayName": "도담", "birthday": { … } | null }`. Errors: `INVALID_REQUEST`.
- Side effect: Realtime `member` event `{ kind: 'profile' }` on the caller's active space.

### `PATCH /spaces/:spaceId/time-zone` (S2)

Body: `{ "timeZone": "Asia/Seoul", "expectedUpdatedAt": "<space.updatedAt>" }`

- 200: `{ "timeZone": "Asia/Seoul", "updatedAt": "…" }`. Errors: `INVALID_REQUEST` (unknown zone), `VERSION_CONFLICT` (stale `expectedUpdatedAt`), `NOT_FOUND` (not a member / ended).
- Does not touch the room theme or the prompt session lease.

### `POST /spaces/:spaceId/anniversaries` (S3)

Body: `{ "title": "처음 만난 날", "date": "2025-05-03", "repeat": "yearly" | "once", "memo": "…" | null }`

- 201: the public anniversary object (`version: 1`). Errors: `INVALID_REQUEST`, `NOT_FOUND`.
- Replaying the same idempotency key returns the stored 201 without a second row (V0-F07-AC-10).

### `PATCH /spaces/:spaceId/anniversaries/:anniversaryId` (S3)

Body: `{ "title", "date", "repeat", "memo", "expectedVersion": 3 }`

- 200: updated object (`version` + 1).
- 409 `VERSION_CONFLICT` → the app refreshes the snapshot and shows `V0-edit-conflict` with the latest values.
- 404 `NOT_FOUND` with `extra: { gone: true }` when the row is soft-deleted → `V0-edit-gone`. Plain `NOT_FOUND` (no `gone`) when the caller is not a member.

### `DELETE /spaces/:spaceId/anniversaries/:anniversaryId` (S3)

Body: `{ "expectedVersion": 3 }` (use `api.json(..., { method: 'DELETE', body, keyInBody: true })` as `removeHomeCover` does).

- 204. Errors: `VERSION_CONFLICT`, `NOT_FOUND` (`gone: true` if already deleted).

## Realtime hints

Private channel `space:<spaceId>` (existing `notify_space`). New/used events: `member` with `{kind: 'profile' | 'timezone' | 'anniversary'}` (start date already sends `{kind:'anniversary'}`), `anniversary` with `{id}`. The app treats every non-`session` event as "refresh the snapshot" (`useSnapshotSync.ts:58`), so no client change is needed beyond the new fields.
