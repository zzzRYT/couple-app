# Database migrations

Apply migrations forward in order. Every migration starts with a `-- rollback:` or `-- deletion-policy:` comment describing how to recover or delete affected data. Before destructive changes such as dropping columns or narrowing types, verify a restorable backup. Shared rows require `space_id` and row-level security. Run `supabase db reset` locally and `node tools/ci/check-migrations.mjs` before review.
