-- deletion-policy: password_attempt keeps only an HMAC of an email and a count, and rows a day old are trimmed by password_attempt_take. apple_credential keeps one sealed Apple refresh token per person and begin_account_deletion deletes it when a deletion is accepted; auth.users cascade removes any row left. Passwords are never stored here: only Supabase Auth holds them, as hashes. Rollback: drop trigger guard_email_signup_trigger on auth.users, drop the new functions and both tables (dropping apple_credential loses the tokens, so those Apple accounts fall back to V0-del-apple-more), drop user_profile.password_prompt_seen_at, delete the four app_settings keys, restore begin_account_deletion from 20261103000100.
insert into public.app_settings (key, value) values ('auth_email_enabled', 'false'), ('review_login_email', '""'), ('password_attempt_limit', '5'), ('password_lock_seconds', '600')
  on conflict (key) do nothing;

alter table public.user_profile add column password_prompt_seen_at timestamptz;

create table public.password_attempt (
  key_hash text primary key check (key_hash ~ '^[0-9a-f]{64}$'),
  failures integer not null default 0 check (failures >= 0),
  locked_until timestamptz,
  updated_at timestamptz not null default public.app_now()
);
alter table public.password_attempt enable row level security;
revoke all on public.password_attempt from anon, authenticated;

create table public.apple_credential (
  user_id uuid primary key references auth.users(id) on delete cascade,
  sealed text not null,
  stored_at timestamptz not null default public.app_now()
);
alter table public.apple_credential enable row level security;
revoke all on public.apple_credential from anon, authenticated;

-- Spends one attempt before the password is checked, so parallel requests cannot get past the limit.
-- 'locked' = refused without checking, 'last' = this check may run and a wrong password locks the email, 'open' = may run.
create function public.password_attempt_take(key text) returns text
language plpgsql security definer set search_path = '' as $$
declare row public.password_attempt%rowtype; attempts integer := public.setting_int('password_attempt_limit', 5); lock_seconds integer := public.setting_int('password_lock_seconds', 600);
begin
  delete from public.password_attempt where updated_at < public.app_now() - interval '1 day' and key_hash <> key;
  insert into public.password_attempt (key_hash) values (key) on conflict (key_hash) do nothing;
  select * into row from public.password_attempt where key_hash=key for update;
  if row.locked_until > public.app_now() then return 'locked'; end if;
  if row.locked_until is not null then row.failures := 0; end if;
  row.failures := row.failures + 1;
  update public.password_attempt set failures=row.failures, updated_at=public.app_now(),
      locked_until=case when row.failures >= attempts then public.app_now() + make_interval(secs => lock_seconds) end
    where key_hash=key;
  return case when row.failures >= attempts then 'last' else 'open' end;
end $$;

-- A right password ends the run of failures.
create function public.password_attempt_clear(key text) returns void
language sql security definer set search_path = '' as $$
  delete from public.password_attempt where key_hash=key;
$$;

-- The provider failed before judging the password, so that attempt does not count.
create function public.password_attempt_refund(key text) returns void
language sql security definer set search_path = '' as $$
  update public.password_attempt set failures=greatest(failures-1, 0), locked_until=null, updated_at=public.app_now() where key_hash=key;
$$;

create function public.auth_email_enabled() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce((select value = 'true'::jsonb from public.app_settings where key='auth_email_enabled'), false);
$$;

-- While mail is off no email account can be created through any Auth path. Only the App Review address passes, for the operator.
create function public.guard_email_signup() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.raw_app_meta_data->>'provider' = 'email' and not public.auth_email_enabled()
    and lower(coalesce(new.email, '')) is distinct from nullif((select lower(value #>> '{}') from public.app_settings where key='review_login_email'), '') then
    raise exception 'EMAIL_SIGNUP_CLOSED';
  end if;
  return new;
end $$;
create trigger guard_email_signup_trigger before insert on auth.users for each row execute function public.guard_email_signup();

-- Whether a password exists, never the hash.
create function public.account_password_state(actor uuid) returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('hasPassword', coalesce((select coalesce(encrypted_password, '') <> '' from auth.users where id=actor), false),
    'promptSeen', coalesce((select password_prompt_seen_at is not null from public.user_profile where user_id=actor), false));
$$;

create function public.mark_password_prompt_seen(actor uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform public.guard_account(actor);
  insert into public.user_profile (user_id, password_prompt_seen_at) values (actor, public.app_now())
    on conflict (user_id) do update set password_prompt_seen_at=coalesce(public.user_profile.password_prompt_seen_at, public.app_now());
end $$;

create function public.store_apple_credential(actor uuid, sealed_token text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform public.guard_account(actor);
  insert into public.apple_credential (user_id, sealed) values (actor, sealed_token)
    on conflict (user_id) do update set sealed=excluded.sealed, stored_at=public.app_now();
end $$;

create function public.apple_credential_of(actor uuid) returns text
language sql stable security definer set search_path = '' as $$
  select sealed from public.apple_credential where user_id=actor;
$$;

-- Same as 20261103000100 plus destroying the stored Apple token; the sealed copy for revoke retries stays on account_deletion for at most 24 hours.
create or replace function public.begin_account_deletion(actor uuid, reauth_provider text, request_origin text, credential text, credential_ttl_seconds integer) returns jsonb
language plpgsql security definer set search_path = '' as $$
begin
  if actor is null or reauth_provider is null or reauth_provider not in ('kakao','apple','email') or request_origin is null or request_origin not in ('app','operator')
    or (credential is not null and (credential_ttl_seconds is null or credential_ttl_seconds < 1 or credential_ttl_seconds > 86400)) then
    raise exception 'INVALID_REQUEST';
  end if;
  perform pg_advisory_xact_lock(hashtextextended('account:' || actor::text, 0));
  if exists (select 1 from public.account_deletion where user_id=actor) then return jsonb_build_object('state', 'requested'); end if;
  perform public.close_spaces_for_deletion(actor);
  update public.user_profile set display_name=null, birth_month=null, birth_day=null, birth_year=null, status='deleting', deleted_at=public.app_now(), locale=null, time_zone='UTC', ui_theme='system', updated_at=public.app_now()
    where user_id=actor;
  -- Consent records go with the account (default until legal review, Open Decisions 27).
  delete from public.ai_consent_event where user_id=actor;
  update public.space_member set ai_consent_state='not_given', ai_consent_at=null, ai_consent_text_version=null, ai_consent_revoked_at=null where user_id=actor;
  delete from public.space_end_notice where user_id=actor;
  update public.invitation set status='revoked', revoked_at=public.app_now() where created_by_user_id=actor and status='active';
  delete from public.apple_credential where user_id=actor;
  -- Server-side sign-out on every device. Where this role may not touch auth.sessions, the Edge Function's global sign-out and the per-request check still apply.
  begin
    delete from auth.sessions where user_id=actor;
  exception when insufficient_privilege or undefined_table then null;
  end;
  insert into public.account_deletion (user_id, provider, origin, provider_credential_enc, credential_expires_at)
    values (actor, reauth_provider, request_origin, credential, case when credential is null then null else public.app_now() + make_interval(secs => credential_ttl_seconds) end);
  return jsonb_build_object('state', 'requested');
end $$;

revoke all on function public.password_attempt_take(text), public.password_attempt_clear(text), public.password_attempt_refund(text), public.auth_email_enabled(),
  public.guard_email_signup(), public.account_password_state(uuid), public.mark_password_prompt_seen(uuid), public.store_apple_credential(uuid,text), public.apple_credential_of(uuid)
  from public, anon, authenticated;
grant execute on function public.password_attempt_take(text), public.password_attempt_clear(text), public.password_attempt_refund(text), public.auth_email_enabled(),
  public.account_password_state(uuid), public.mark_password_prompt_seen(uuid), public.store_apple_credential(uuid,text), public.apple_credential_of(uuid)
  to service_role;
