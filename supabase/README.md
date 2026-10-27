# Local Supabase

Run the local stack with `supabase start` and inspect it with `supabase status`.
The owner will create any remote project in Seoul (`ap-northeast-2`) on the free plan. Free projects can pause after inactivity. OAuth providers are disabled placeholders until the owner supplies their configuration.

Migrations are forward-only changes with a documented rollback or deletion policy. Verify backups before destructive changes; shared rows require space-scoped RLS. See `docs/migrations.md` and run `supabase db reset` locally.

## Tests

With the stack running: `supabase test db` (pgTAP), `deno test -A supabase/functions` (functions against the local stack; keys are read from `supabase status`, never from the repository), and `deno run -A tools/ai/eval-fixtures.mjs` (prompt fixtures; a deterministic mock unless `ANTHROPIC_API_KEY` is set). To try the functions over HTTP, run `supabase functions serve --env-file <file with INVITE_CODE_PEPPER>`.
