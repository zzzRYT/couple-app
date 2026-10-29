# Secrets

Set server secrets only with `supabase secrets set`. Never put keys in the app, repository, logs, pull requests, or chat. The example environment file contains empty values only. Use a dedicated Console workspace with a spending limit for the Anthropic key.

## Account deletion (US10)

The `account` function refuses a deletion with `503 PROVIDER_NOT_CONFIGURED`, before anything is deleted, when the secrets for the person's sign-in provider are missing. They are not required for development; they are required before release (gate G18).

- Sign in with Apple token revoke: `APPLE_TEAM_ID`, `APPLE_KEY_ID`, `APPLE_PRIVATE_KEY` (the `.p8` key with Sign in with Apple enabled, PEM text) and `APPLE_CLIENT_ID` (the app's bundle ID). Without them every Apple account deletion is refused.
- Kakao unlink (hidden like Kakao sign-in): `KAKAO_UNLINK_ENABLED=true` and `KAKAO_ADMIN_KEY`. Off by default.
- Optional `ACCOUNT_CREDENTIAL_KEY`: seals the Apple token kept up to 24 hours for revoke retries. Without it the key is derived from the service-role key, so rotating that key makes in-flight retries record `APPLE_TOKEN_EXPIRED` instead of revoking.
