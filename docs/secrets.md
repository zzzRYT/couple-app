# Secrets

Set server secrets only with `supabase secrets set`, per project through `node tools/supabase/remote.mjs dev|prod secrets set …`. Never put keys in the app, repository, logs, pull requests, or chat. The example environment file contains empty values only. Use a dedicated Console workspace with a spending limit for the Anthropic key.

## Supabase projects

Aroom-dev and Aroom-prod each have their own values ([remote Supabase setup](remote-supabase-setup.md#3-서버-비밀)). Generate dev values fresh; never copy a production secret into Aroom-dev.

- Access tokens live only in untracked files with mode `600`: `~/.config/aroom/supabase-dev.env` (Aroom-dev) and `~/.config/aroom/supabase.env` (Aroom-prod), one `SUPABASE_ACCESS_TOKEN=` line each. Each token is scoped to its own project, so neither can change the other project.
- The `lifecycle-sweep` cron job reads its key from each project's Vault (`lifecycle_sweep_service_role_key`), not from a file.

## Account deletion (US10)

The `account` function refuses a deletion with `503 PROVIDER_NOT_CONFIGURED`, before anything is deleted, when the secrets for the person's sign-in provider are missing. They are not required for development; they are required before release (gate G18).

- Sign in with Apple token revoke: `APPLE_TEAM_ID`, `APPLE_KEY_ID`, `APPLE_PRIVATE_KEY` (the `.p8` key with Sign in with Apple enabled, PEM text) and `APPLE_CLIENT_ID` (the app's bundle ID). Without them every Apple account deletion is refused.
- Kakao unlink (hidden like Kakao sign-in): `KAKAO_UNLINK_ENABLED=true` and `KAKAO_ADMIN_KEY`. Off by default.
- Optional `ACCOUNT_CREDENTIAL_KEY`: seals the Apple refresh token kept from sign-in until account deletion (and its 24-hour retry copy), and keys the password attempt counter. Without it the key is derived from the service-role key, so rotating that key makes stored tokens unreadable: those accounts confirm with Apple again (`V0-del-apple-more`), in-flight retries record `APPLE_TOKEN_EXPIRED`, and attempt counts restart.

## OTA updates

Hot Updater ([ota.md](ota.md)) keeps its credentials in the EAS `preview` environment as sensitive variables, where `eas env:exec preview` hands them to the CLI and the OTA workflow. They never go into the app, the repository or a GitHub secret.

- `HOT_UPDATER_CLOUDFLARE_API_TOKEN`: Cloudflare account API token `aroom-hot-updater-d1`, D1 Edit.
- `HOT_UPDATER_CLOUDFLARE_R2_ACCESS_KEY_ID`, `HOT_UPDATER_CLOUDFLARE_R2_SECRET_ACCESS_KEY`: R2 token `aroom-hot-updater-r2`, object read and write on the `aroom-hot-updater` bucket only. The Worker holds the same pair as its secrets `R2_ACCESS_KEY_ID` and `R2_SECRET_ACCESS_KEY`; rotate both places together.
- `EXPO_PUBLIC_HOT_UPDATER_API_KEY` (`preview` and `production`): the client key every update request sends in `x-api-key`. It ships inside the app, so it only gates the Worker; revoke or add keys with `hot-updater api-key`. EAS builds of preview and production fail without it.

A local `apps/mobile/.env.hotupdater` with the first three also works; `.env*` is ignored.
