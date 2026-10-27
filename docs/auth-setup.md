# Auth setup

**Owner decision (2026-10-27): product sign-in is OAuth only, Sign in with Apple first.** Kakao stays in the code behind `KAKAO_ENABLED = false` (`apps/mobile/src/config/auth.ts`); email OTP was removed from the product login.

- **Apple (product)**: native sheet on iOS (`expo-apple-authentication`) exchanged with Supabase `signInWithIdToken` using a hashed nonce. Supabase needs only the bundle ids in the Apple provider's Client IDs; no Services ID or `.p8` key for the native flow. Step-by-step owner guide (Korean): `docs/apple-sign-in-setup.md`.
- **Android**: no Apple button for now. Web OAuth for Apple needs a Services ID and signing secret and is behind `APPLE_WEB_OAUTH_ENABLED = false`.
- **Email OTP (development only, an assumption the owner may reject)**: shown only when the build has `EXPO_PUBLIC_APP_VARIANT=development` and `EXPO_PUBLIC_DEV_EMAIL_LOGIN=true` (the `development` EAS profile). Both values are inlined at build time, and `app.config.ts` refuses to build a production variant with the flag set. It lets two devices and the integration tests sign in without two Apple IDs. Local mail is captured in Mailpit at `http://127.0.0.1:54324`; the template is `supabase/templates/otp.html`.
- **Local stack**: `supabase/config.toml` enables Apple (client id `com.jinjinstar.aroom.dev`, no secret) and Email; Kakao is disabled.
- **Kakao (deferred)**: when re-enabled, create a Kakao Developers app with Redirect URI `https://<project-ref>.supabase.co/auth/v1/callback`, enter the REST API key and Client Secret in Supabase, and replace the placeholder button with the official asset (G5).
- **Invite code pepper**: `supabase secrets set INVITE_CODE_PEPPER=<long random value>`.

Remote project wiring (link, db push, seed, functions deploy, secrets, app env): `docs/remote-supabase-setup.md`.
