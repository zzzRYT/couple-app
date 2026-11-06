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

### `auth-password` function (S7, `verify_jwt = false`)

No route uses the idempotency store, and none logs its body. Errors use the usual `{ error: { code, retryable } }`.

| Route | Auth | Body | Success | Errors |
|---|---|---|---|---|
| `GET /auth-password/config` | none | — | `{ mail: boolean }`; false when the value is off or Auth auto-confirms email | — |
| `POST /auth-password/login` | none | `{ email, password }` | `{ accessToken, refreshToken }` | `INVALID_LOGIN` 401, `LOGIN_LOCKED` 429, `RATE_LIMITED` 429 |
| `POST /auth-password/signup` | none | `{ email, password, termsAccepted: true, redirectTo? }` | 202 `{ state: 'sent' }`, also for an existing email | `MAIL_NOT_CONNECTED` 503, `WEAK_PASSWORD` 422, `INVALID_REQUEST` 400 |
| `GET /auth-password/state` | user | — | `{ hasPassword, email, promptSeen }` | — |
| `POST /auth-password/verify` | user | `{ password }` | `{ accessToken, refreshToken }`; the old session is revoked, the new token's `amr` proves the password | `WRONG_PASSWORD` 403, `LOGIN_LOCKED` 429, `EMAIL_REQUIRED` 409 |
| `POST /auth-password/set` | user | `{ newPassword, currentPassword? }` | `{ state: 'saved' }`; this session stays, others end | `WRONG_PASSWORD` 403, `LOGIN_LOCKED` 429, `WEAK_PASSWORD` 422, `EMAIL_REQUIRED` 409, `REAUTH_REQUIRED` 401 (a password exists, no current password and no fresh non-password sign-in) |
| `POST /auth-password/prompt-seen` | user | — | `{ state: 'seen' }` | — |

### `POST /account/apple-token` (S7)

Body `{ authorizationCode }`. Exchanges the code and stores the sealed refresh token. Always 200 `{ stored: boolean }` for a signed-in user: a missing secret or a refused code never fails a sign-in.

## Changed in S7

`POST /account/deletion`: `reauth.provider` also accepts `'password'`, proved by a fresh `password` `amr` entry whatever the account's provider. An Apple account confirmed by password with no readable stored token gets 409 `APPLE_CONFIRM_REQUIRED` and nothing changes; the app then asks for Apple and sends `{ provider: 'apple', authorizationCode }` as before.

## Realtime hints

Private channel `space:<spaceId>` (existing `notify_space`). New/used events: `member` with `{kind: 'profile' | 'timezone' | 'anniversary'}` (start date already sends `{kind:'anniversary'}`), `anniversary` with `{id}`. The app treats every non-`session` event as "refresh the snapshot" (`useSnapshotSync.ts:58`), so no client change is needed beyond the new fields.
