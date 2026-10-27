# Auth setup

Local development needs nothing from the owner: `supabase start` enables email OTP (6-digit code, `otp_length = 6`; the email also carries the link, which is allowed) and captures mail in Mailpit at `http://127.0.0.1:54324`. The sign-in email template is `supabase/templates/otp.html` (placeholder copy until G1/G4). Kakao and Apple are disabled placeholders in `supabase/config.toml`; the app shows placeholder buttons until G5.

## What the owner does on the remote project

1. **Email OTP** — Authentication → Providers → Email: enable, OTP length 6, keep "Confirm email" off or on as preferred. Paste the template from `supabase/templates/otp.html` into the Magic Link and Confirm signup templates. Connect a custom SMTP sender before inviting real users; the built-in sender is heavily rate limited.
2. **Kakao** — Kakao Developers: create an app, enable Kakao Login, add the Redirect URI `https://<project-ref>.supabase.co/auth/v1/callback`, set consent items (account email if required by the product; profile nickname is not used). In Supabase → Providers → Kakao enter the REST API key as client ID and the Client Secret. Locally the secret is read from `SUPABASE_AUTH_EXTERNAL_KAKAO_SECRET`; never commit it.
3. **Apple** — Apple Developer: create a Services ID, register the domain and return URL `https://<project-ref>.supabase.co/auth/v1/callback`, create a Sign in with Apple key (`.p8`, never committed). Enter the Services ID and generated secret in Supabase → Providers → Apple.
4. **Redirects** — Authentication → URL Configuration: add the Expo app scheme and universal link for the placeholder identity in `apps/mobile/src/config/identity.ts` (for example `aroom://auth-callback`) once G2 confirms the name. Until then use the development client scheme only.
5. **Invite code pepper** — `supabase secrets set INVITE_CODE_PEPPER=<long random value>`; invitation hashes depend on it, so rotating it invalidates pending codes.

The official Kakao/Apple SDKs and button assets replace the placeholders at G5 (T171).
