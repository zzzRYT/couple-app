# H07 — Email and password sign-in, password identity check (slice S7)

| | |
|---|---|
| Slice | S7 · tasks T701–T709 in `../tasks.md` |
| Requirements | V0-F15, V0-F16, V0-F17, V0-F18, V0-F12-AC-01/-08, V0-NF-04 |
| Design source | artifact https://claude.ai/artifact/M2WFQCFnVzoWbHNhJPCz5X, version `1793952106-add4`; boards V0-08-auth, V0-09-security, V0-00, V0-01, V0-07 (`design/canvas/project/`) |
| Branch / PR | `fm/cpl-v0-auth` → PR to `main`, non-draft, do not merge |

The board is canonical. Copy keys are in the generated `./design/copy-v0.md`.

## Decisions that shape the code

1. **Passwords live only in Supabase Auth.** The app sends them to `auth-password` over TLS; that function hands them to Auth and to nothing else. No idempotency store, no log field, no error detail, no device storage.
2. **The lock is counted before the check.** `password_attempt_take` raises the count first, so parallel requests cannot pass five. A success clears it; a provider outage refunds it. Keys are an HMAC of the email, so an unknown email behaves the same and no email is stored. Every login answer takes at least the same minimum time, because Auth runs bcrypt only for known emails.
3. **Known limit of the lock.** Auth's own `POST /auth/v1/token?grant_type=password` stays reachable with the public key, and Auth has no per-account lock. The provider's closing tool is the Password Verification Hook, which is Team or Enterprise only; this project is on the free plan. That path is bounded only by Auth's per-IP limit. See `docs/password-auth-operations.md`.
4. **Sign-up is closed by data, not by the screen.** A trigger on `auth.users` refuses new email accounts while `auth_email_enabled` is off, so the migration alone closes `POST /auth/v1/signup`. `enable_signup` could not be used: `auth.email.enable_signup` turns the whole email provider off, and `auth.enable_signup` also stops new Apple accounts.
5. **Automatic linking was checked.** Auth links a new Apple identity to a user with the same email when the incoming email is verified, or always when email confirmation is off (`email.Verified || Mailer.Autoconfirm` in `internal/models/linking.go`). With confirmation off, someone could register a victim's address with a password and keep access after the victim signs in with Apple. Sign-up therefore stays closed until confirmation is on, and `GET /auth-password/config` reports `mail: false` while Auth auto-confirms.
6. **`current_password` is not enforced by Auth** (v2.197.0 accepted a wrong one), so `set` checks it itself. Changing a password through the user's own token ends the other sessions and keeps this one (checked on the local stack), which is default 6.
7. **Apple tokens are sealed with the existing `credentialBox`.** No new key. A token that cannot be opened after a key rotation is treated as missing, which leads to `V0-del-apple-more`.

8. **AutoFill needs a native change.** `webcredentials:aroom.jinjinstar.com` in `app.config.ts` and the matching block in `site/.well-known/apple-app-site-association`. It changes the runtime fingerprint, so this slice reaches phones through a Release iOS build, not OTA.
9. **Local confirmation is on**, so `supabase/seed.sql` now creates the two quick-login accounts, which used to sign themselves up on first use.

## Mail

One value: `update public.app_settings set value = 'true' where key = 'auth_email_enabled'`. Until then `V0-auth-signup-nomail`, `V0-auth-reset-nomail` and `V0-del-email-nomail` are the real screens. The mail-connected screens are built and tested behind the same value.
