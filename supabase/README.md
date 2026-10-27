# Local Supabase

Run the local stack with `supabase start` and inspect it with `supabase status`.
The owner will create any remote project in Seoul (`ap-northeast-2`) on the free plan. Free projects can pause after inactivity. OAuth providers are disabled placeholders until the owner supplies their configuration.

Migrations are forward-only changes with a documented rollback or deletion policy. Verify backups before destructive changes; shared rows require space-scoped RLS. See `docs/migrations.md` and run `supabase db reset` locally.
