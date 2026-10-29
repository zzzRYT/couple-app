-- deletion-policy: Account deletion (US10, spec Decided 41-51). begin_account_deletion clears personal fields, ends the active space and revokes sessions in one transaction; every space the person belonged to is then hard-deleted at once through purge_space (no 30-day wait, on this path only); finish_account_deletion removes the remaining references and the profile row right before the auth user is deleted. account_deletion keeps only states and content-free codes; report_fingerprint keeps only the target, reason and time of reports purged on this path. Rollback: drop the new functions and tables only after every account_deletion row is done, otherwise deletions in progress are stranded; restore the previous require_member and purge_space from 20261101000400 and 20261101000750.
insert into public.app_settings (key, value) values ('account_deletion_max_backoff_seconds', '3600'), ('account_deletion_lease_seconds', '300')
  on conflict (key) do nothing;

alter table public.user_profile add column status text not null default 'active' check (status in ('active','deleting')),
  add column deleted_at timestamptz;

-- One row per person, never any personal content: the last finished step, the provider, retry bookkeeping and an encrypted Apple token kept at most 24 hours.
create table public.account_deletion (
  user_id uuid primary key,
  state text not null default 'requested' check (state in ('requested','space_ended','provider_revoked','auth_deleted','done')),
  provider text not null check (provider in ('kakao','apple','email')),
  origin text not null default 'app' check (origin in ('app','operator')),
  requested_at timestamptz not null default public.app_now(),
  updated_at timestamptz not null default public.app_now(),
  attempts integer not null default 0 check (attempts >= 0),
  last_error_code text check (last_error_code ~ '^[A-Z][A-Z0-9_]{0,63}$'),
  next_attempt_at timestamptz not null default public.app_now(),
  locked_until timestamptz,
  provider_credential_enc text,
  credential_expires_at timestamptz,
  check ((provider_credential_enc is null) = (credential_expires_at is null))
);
alter table public.account_deletion enable row level security;
revoke all on public.account_deletion from anon, authenticated;

-- Reports of spaces purged by an account deletion leave only this: no person, no space, no text.
create table public.report_fingerprint (
  id bigint generated always as identity primary key,
  target text not null check (target in ('partner','shared_text','room_scene')),
  reason text not null check (reason in ('harass','inappropriate','privacy','other')),
  reported_at timestamptz not null,
  recorded_at timestamptz not null default public.app_now()
);
alter table public.report_fingerprint enable row level security;
revoke all on public.report_fingerprint from anon, authenticated;

-- The partner's "your partner deleted their account" notice must outlive the space, which is now purged at once.
alter table public.space_end_notice alter column space_id drop not null;
alter table public.space_end_notice drop constraint space_end_notice_space_id_fkey;
alter table public.space_end_notice add constraint space_end_notice_space_id_fkey foreign key (space_id) references public.couple_space(id) on delete set null;

-- Every request checks this, so a JWT issued before the deletion is refused even before it expires.
create function public.account_blocked(actor uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.account_deletion where user_id=actor);
$$;

-- A change that overlaps the deletion transaction waits for it, then gets ACCOUNT_DELETING. The deletion's own calls are exempt.
create function public.guard_account(actor uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if actor is null or current_setting('app.deleting_actor', true) = actor::text then return; end if;
  perform pg_advisory_xact_lock_shared(hashtextextended('account:' || actor::text, 0));
  if exists (select 1 from public.account_deletion where user_id=actor) then raise exception 'ACCOUNT_DELETING'; end if;
end $$;

-- Now volatile: the guard must see a deletion that committed while it waited for the lock.
create or replace function public.require_member(actor uuid, target uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform public.guard_account(actor);
  if not exists (select 1 from public.space_member m join public.couple_space s on s.id=m.space_id
    where m.space_id=target and m.user_id=actor and m.space_active and s.status='active') then
    raise exception 'NOT_FOUND';
  end if;
end $$;

-- Ends the person's active space (a partner who ended it first wins and this is a no-op), drops generation in flight and makes
-- every space they belong to due for purge now. Safe to repeat; it also catches a space created in a race with the deletion.
create function public.close_spaces_for_deletion(actor uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare active_space uuid; ids jsonb;
begin
  perform set_config('app.deleting_actor', actor::text, true);
  for active_space in select space_id from public.space_member where user_id=actor and space_active loop
    perform 1 from public.couple_space where id=active_space for update;
    if exists (select 1 from public.couple_space where id=active_space and status='active') then
      perform public.end_space(actor, active_space, 'account_deletion');
    end if;
  end loop;
  update public.decoration_request set state='cancelled' where state in ('queued','generated','previewed')
    and space_id in (select space_id from public.space_member where user_id=actor);
  update public.couple_space set purge_after=public.app_now(), updated_at=public.app_now()
    where status='ended' and id in (select space_id from public.space_member where user_id=actor)
      and (purge_after is null or purge_after > public.app_now());
  select coalesce(jsonb_agg(space_id order by space_id), '[]'::jsonb) into ids from public.space_member where user_id=actor;
  return ids;
end $$;

-- The accepting transaction (FR-073 step 1). Idempotent: a second call for the same person changes nothing and answers the same.
create function public.begin_account_deletion(actor uuid, reauth_provider text, request_origin text, credential text, credential_ttl_seconds integer) returns jsonb
language plpgsql security definer set search_path = '' as $$
begin
  if actor is null or reauth_provider is null or reauth_provider not in ('kakao','apple','email') or request_origin is null or request_origin not in ('app','operator')
    or (credential is not null and (credential_ttl_seconds is null or credential_ttl_seconds < 1 or credential_ttl_seconds > 86400)) then
    raise exception 'INVALID_REQUEST';
  end if;
  perform pg_advisory_xact_lock(hashtextextended('account:' || actor::text, 0));
  if exists (select 1 from public.account_deletion where user_id=actor) then return jsonb_build_object('state', 'requested'); end if;
  perform public.close_spaces_for_deletion(actor);
  update public.user_profile set status='deleting', deleted_at=public.app_now(), locale=null, time_zone='UTC', ui_theme='system', updated_at=public.app_now()
    where user_id=actor;
  -- Consent records go with the account (default until legal review, Open Decisions 27).
  delete from public.ai_consent_event where user_id=actor;
  update public.space_member set ai_consent_state='not_given', ai_consent_at=null, ai_consent_text_version=null, ai_consent_revoked_at=null where user_id=actor;
  delete from public.space_end_notice where user_id=actor;
  update public.invitation set status='revoked', revoked_at=public.app_now() where created_by_user_id=actor and status='active';
  -- Server-side sign-out on every device. Where this role may not touch auth.sessions, the Edge Function's global sign-out and the per-request check still apply.
  begin
    delete from auth.sessions where user_id=actor;
  exception when insufficient_privilege or undefined_table then null;
  end;
  insert into public.account_deletion (user_id, provider, origin, provider_credential_enc, credential_expires_at)
    values (actor, reauth_provider, request_origin, credential, case when credential is null then null else public.app_now() + make_interval(secs => credential_ttl_seconds) end);
  return jsonb_build_object('state', 'requested');
end $$;

-- Takes a short lease so the request handler and the sweep never run the same deletion at once. Null when held, done or unknown.
create function public.claim_account_deletion(actor uuid, at timestamptz) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare claimed jsonb;
begin
  update public.account_deletion set locked_until = at + make_interval(secs => public.setting_int('account_deletion_lease_seconds', 300))
    where user_id=actor and state <> 'done' and (locked_until is null or locked_until <= at)
    returning jsonb_build_object('state', state, 'provider', provider, 'origin', origin, 'attempts', attempts,
      'credential', case when credential_expires_at > at then provider_credential_enc end) into claimed;
  return claimed;
end $$;

-- Compare-and-set step transition; `note` keeps a content-free code (for example APPLE_TOKEN_UNAVAILABLE) on a step that finished without the provider.
create function public.advance_account_deletion(actor uuid, from_state text, to_state text, note text default null) returns boolean
language plpgsql security definer set search_path = '' as $$
begin
  update public.account_deletion set state=to_state, attempts=0, last_error_code=note, updated_at=public.app_now(), next_attempt_at=public.app_now(),
      provider_credential_enc=case when to_state in ('provider_revoked','auth_deleted','done') then null else provider_credential_enc end,
      credential_expires_at=case when to_state in ('provider_revoked','auth_deleted','done') then null else credential_expires_at end,
      locked_until=case when to_state='done' then null else locked_until end
    where user_id=actor and state=from_state;
  return found;
end $$;

-- Records a failed step with exponential backoff (30 s doubling, capped by a setting) and gives the lease back. Returns the attempt count.
create function public.record_account_deletion_failure(actor uuid, code text, at timestamptz) returns integer
language plpgsql security definer set search_path = '' as $$
declare tries integer;
begin
  update public.account_deletion set attempts=attempts+1, last_error_code=code, updated_at=public.app_now(), locked_until=null,
      next_attempt_at=at + make_interval(secs => least(public.setting_int('account_deletion_max_backoff_seconds', 3600), 30 * power(2, least(attempts, 16))::integer))
    where user_id=actor returning attempts into tries;
  return coalesce(tries, 0);
end $$;

create function public.release_account_deletion(actor uuid) returns void
language sql security definer set search_path = '' as $$
  update public.account_deletion set locked_until=null where user_id=actor and state <> 'done';
$$;

-- Deletions that stopped part-way (a crash, a provider outage), oldest first, for the sweep to resume.
create function public.due_account_deletions(at timestamptz, max_count integer default 20) returns jsonb
language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(user_id), '[]'::jsonb) from (
    select user_id from public.account_deletion where state <> 'done' and next_attempt_at <= at and (locked_until is null or locked_until <= at)
    order by next_attempt_at, user_id limit max_count) due;
$$;

-- Right before the auth user is deleted: nothing may still point at the person, and the profile row goes.
create function public.finish_account_deletion(actor uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not exists (select 1 from public.account_deletion where user_id=actor and state='provider_revoked') then raise exception 'INVALID_REQUEST'; end if;
  if exists (select 1 from public.space_member where user_id=actor) then raise exception 'SPACES_PENDING'; end if;
  update public.space_lifecycle_event set actor_user_id=null where actor_user_id=actor;
  update public.couple_space set ended_by_user_id=null where ended_by_user_id=actor;
  update public.space_end_notice set by_user_id=null where by_user_id=actor;
  delete from public.space_end_notice where user_id=actor;
  delete from public.user_profile where user_id=actor;
end $$;

-- purge_space as before, plus: when a member deleted their account, the other person's unread notice survives without the
-- space or the deleter, and each report leaves only a content-free fingerprint. Other purges still delete notices and reports.
create or replace function public.purge_space(target uuid, at timestamptz) returns boolean
language plpgsql security definer set search_path = '' as $$
declare space public.couple_space%rowtype;
begin
  select * into space from public.couple_space where id=target for update;
  if not found or space.status <> 'ended' or space.purge_after is null or space.purge_after > at then return false; end if;
  if exists (select 1 from public.space_member m join public.account_deletion d on d.user_id=m.user_id where m.space_id=target) then
    update public.space_end_notice n set space_id=null,
        by_user_id=case when exists (select 1 from public.account_deletion d where d.user_id=n.by_user_id) then null else n.by_user_id end
      where n.space_id=target and n.acked_at is null and not exists (select 1 from public.account_deletion d where d.user_id=n.user_id);
    insert into public.report_fingerprint (target, reason, reported_at) select r.target, r.reason, r.created_at from public.report r where r.space_id=target;
  end if;
  delete from public.space_end_notice where space_id=target;
  -- Keep only content-free fingerprints of the lifecycle: no actor, no metadata.
  update public.space_lifecycle_event set actor_user_id=null, metadata='{}'::jsonb where space_id=target;
  insert into public.space_lifecycle_event (space_id, event_type) values (target, 'deletion_completed');
  -- Confirmed room versions are immutable except for this purge (see forbid_version_change); the flag lasts for this transaction only.
  perform set_config('app.purging', 'on', true);
  delete from public.couple_space where id=target;
  perform set_config('app.purging', 'off', true);
  return true;
end $$;

revoke all on function public.account_blocked(uuid), public.guard_account(uuid), public.close_spaces_for_deletion(uuid),
  public.begin_account_deletion(uuid,text,text,text,integer), public.claim_account_deletion(uuid,timestamptz),
  public.advance_account_deletion(uuid,text,text,text), public.record_account_deletion_failure(uuid,text,timestamptz),
  public.release_account_deletion(uuid), public.due_account_deletions(timestamptz,integer), public.finish_account_deletion(uuid)
  from public, anon, authenticated;
grant execute on function public.account_blocked(uuid), public.close_spaces_for_deletion(uuid),
  public.begin_account_deletion(uuid,text,text,text,integer), public.claim_account_deletion(uuid,timestamptz),
  public.advance_account_deletion(uuid,text,text,text), public.record_account_deletion_failure(uuid,text,timestamptz),
  public.release_account_deletion(uuid), public.due_account_deletions(timestamptz,integer), public.finish_account_deletion(uuid)
  to service_role;
