-- rollback: Restore a verified backup; dropping these tables deletes all associated user and space data.
create table public.user_profile (
  user_id uuid primary key references auth.users(id) on delete cascade,
  locale text check (locale in ('ko-KR','en-US','ja-JP')),
  time_zone text not null default 'UTC',
  ui_theme text not null default 'system' check (ui_theme in ('system','light','dark')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.couple_space (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'active' check (status in ('active','ended')),
  anniversary_date date not null,
  time_zone text not null default 'UTC',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  ended_at timestamptz, purge_after timestamptz,
  ended_reason text check (ended_reason in ('ended','disconnect','account_deletion')),
  ended_by_user_id uuid references auth.users(id)
);
create table public.space_member (
  space_id uuid not null references public.couple_space(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role = 'member'),
  joined_at timestamptz not null default now(), left_at timestamptz,
  space_active boolean not null default true,
  ai_consent_state text not null default 'not_given' check (ai_consent_state in ('not_given','granted','revoked')),
  ai_consent_at timestamptz, ai_consent_text_version text, ai_consent_revoked_at timestamptz,
  primary key (space_id,user_id)
);
create unique index one_active_space_per_user on public.space_member (user_id) where space_active;
create table public.idempotency_key (
  key uuid not null, user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null, response jsonb not null, created_at timestamptz not null default now(),
  unique (user_id,key,endpoint)
);
create table public.space_lifecycle_event (
  id uuid primary key default gen_random_uuid(), space_id uuid not null references public.couple_space(id) on delete cascade,
  event_type text not null check (event_type in ('ended','disconnected','deletion_started','deletion_completed','cover_changed','cover_removed','milestone_preset_previewed','milestone_preset_applied')),
  actor_user_id uuid references auth.users(id), occurred_at timestamptz not null default now(), metadata jsonb not null default '{}'::jsonb
);
