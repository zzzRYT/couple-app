# Operator runbook

Manual procedures for the person operating Aroom. Every step here is an assumption until the legal and operational review (G1, G18) and the public support email (G10) are settled.

## Account deletion requests from outside the app

For people who can no longer open the app (FR-074, `site/delete-account/`). The in-app path stays the primary one.

1. **Receive** the request at the public support email. Do not ask for passwords, codes or screenshots of the app.
2. **Verify** by replying to the email address the person signed up with and waiting for their answer from that address. For Sign in with Apple accounts that used "Hide My Email", reply to the relay address. If the address does not match any account, answer that no matching account was found and stop.
3. **Find the user id** in the Supabase dashboard (Authentication → Users) by that email. Copy only the id; do not export or keep any other field.
4. **Start the deletion** with the service-role key, from a trusted machine, never from chat or a shared document:

   ```sh
   curl -X POST "$SUPABASE_URL/functions/v1/account/account/operator-deletion" \
     -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" -H 'Content-Type: application/json' \
     -d '{"userId":"<uuid>"}'
   ```

   `202 {"state":"requested"}` means accepted: the same state machine as the in-app path runs (sessions revoked, spaces purged at once, auth user deleted). `503 PROVIDER_NOT_CONFIGURED` means a Kakao account while Kakao unlink is still disabled; nothing was changed.
5. **Apple accounts**: this path has no re-authentication code, so Apple tokens cannot be revoked; the run records `APPLE_TOKEN_UNAVAILABLE`. Tell the person they can remove Aroom under Apple ID → Sign in with Apple.
6. **Confirm** in SQL (read-only) that `select state from public.account_deletion where user_id = '<uuid>'` is `done`. If it stays below `done`, the lifecycle sweep resumes it with backoff; repeated failures appear as `account-deletion-alert` log lines with a code only.
7. **Reply** to the person that the account was deleted, and delete the request email thread according to the retention rule decided at legal review.
