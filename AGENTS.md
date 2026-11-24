# Aroom repository notes for agents

## Verify

- `corepack pnpm verify` runs every check that needs no Docker: lint, typecheck, `deno lint` and `deno check` on `supabase/functions`, unit tests, the admin build, and the repo checks in the table below. `pnpm install` provides Deno, so do not install it separately.
- `corepack pnpm verify:db` starts the local Supabase stack (Docker) and runs pgTAP, the Deno tests, and the Edge Function boot check.
- CI (`.github/workflows/ci.yml`) runs both commands, so a change that passes them locally passes the same gates in CI.
- Runtime verification on a simulator is not in the repo yet. When it lands, its command goes in this section.

## Rules and what enforces them

Every row is enforced by a deterministic check that fails the build. A rule with no check does not belong here. When an agent is corrected for a new mistake, add the check first, then the row.

| Rule | Enforced by | Runs in |
| --- | --- | --- |
| The lockfile matches `package.json` (use pnpm, never npm) | `pnpm install --frozen-lockfile` | `pnpm verify` |
| Display text in `features/` and `ui/` comes from `t()` keys (FR-019) | ESLint `no-restricted-syntax` in `eslint.config.mjs` | `pnpm verify` |
| `apps/mobile/src/lib`, `ui` and `theme` never import `features/` | ESLint `no-restricted-imports` in `eslint.config.mjs` | `pnpm verify` |
| Edge Functions type-check and pass `deno lint` | `deno check` and `deno lint` on `supabase/functions` | `pnpm verify` |
| An Edge Function imports only its own folder and `_shared/`, and has an `import_map` in `supabase/config.toml` | `tools/ci/check-functions-imports.mjs` | `pnpm verify` |
| Remote Supabase commands in Markdown go through `tools/supabase/remote.mjs`, never `npx supabase` | `tools/ci/check-docs-supabase.mjs` | `pnpm verify` |
| Each migration header states a rollback or deletion policy | `tools/ci/check-migrations.mjs` | `pnpm verify` |
| Each V0 scenario ID in the spec appears in a test name | `tools/tests/traceability.test.mjs` | `pnpm verify` |
| Every Edge Function boots in the Edge Runtime | `tools/ci/check-functions-boot.mjs` | `pnpm verify:db` |
| A PR that changes UI declares it and attaches current evidence | `.github/scripts/design-review-check.mjs` | `design-review` workflow |
| No secrets in commits | gitleaks | `secret-scan` workflow |
