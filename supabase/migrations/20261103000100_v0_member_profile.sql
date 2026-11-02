-- rollback: restore begin_account_deletion from 20261102000900 before dropping profile columns and set_member_profile.
alter table public.user_profile
  add column display_name text check (display_name is null or (display_name=btrim(display_name) and char_length(display_name) between 1 and 20)),
  add column birth_month smallint check (birth_month between 1 and 12),
  add column birth_day smallint check (birth_day between 1 and 31),
  add column birth_year smallint check (birth_year >= 1900),
  add column profile_updated_at timestamptz,
  add constraint v0_birthday_pair check ((birth_month is null) = (birth_day is null)),
  add constraint v0_birthday_year check (birth_year is null or birth_month is not null),
  add constraint v0_birthday_date check (birth_month is null or birth_day <= extract(day from (make_date(2000,birth_month,1) + interval '1 month - 1 day')));

create function public.set_member_profile(actor uuid, p_name text, p_month smallint, p_day smallint, p_year smallint) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare active_space uuid; clean_name text := btrim(p_name); max_day integer;
begin
  perform public.guard_account(actor);
  if exists (select 1 from public.user_profile where user_id=actor and status='deleting') then raise exception 'ACCOUNT_DELETING'; end if;
  if clean_name is null or char_length(clean_name) not between 1 and 20 or (p_month is null) <> (p_day is null)
    or (p_year is not null and (p_month is null or p_year < 1900 or p_year > extract(year from public.app_now()))) then raise exception 'INVALID_REQUEST'; end if;
  if p_month is not null then
    if p_month not between 1 and 12 or p_day not between 1 and 31 then raise exception 'INVALID_REQUEST'; end if;
    max_day := extract(day from (make_date(coalesce(p_year,2000),p_month,1) + interval '1 month - 1 day'));
    if p_day > max_day then raise exception 'INVALID_REQUEST'; end if;
  end if;
  insert into public.user_profile(user_id,display_name,birth_month,birth_day,birth_year,profile_updated_at)
    values(actor,clean_name,p_month,p_day,p_year,public.app_now())
    on conflict(user_id) do update set display_name=excluded.display_name,birth_month=excluded.birth_month,
      birth_day=excluded.birth_day,birth_year=excluded.birth_year,profile_updated_at=excluded.profile_updated_at;
  select space_id into active_space from public.space_member where user_id=actor and space_active limit 1;
  if active_space is not null then perform public.notify_space(active_space,'member',jsonb_build_object('kind','profile')); end if;
  return jsonb_build_object('displayName',clean_name,'birthday',case when p_month is null then null else jsonb_build_object('month',p_month,'day',p_day,'year',p_year) end);
end $$;
revoke all on function public.set_member_profile(uuid,text,smallint,smallint,smallint) from public,anon,authenticated;
grant execute on function public.set_member_profile(uuid,text,smallint,smallint,smallint) to service_role;
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
  -- Server-side sign-out on every device. Where this role may not touch auth.sessions, the Edge Function's global sign-out and the per-request check still apply.
  begin
    delete from auth.sessions where user_id=actor;
  exception when insufficient_privilege or undefined_table then null;
  end;
  insert into public.account_deletion (user_id, provider, origin, provider_credential_enc, credential_expires_at)
    values (actor, reauth_provider, request_origin, credential, case when credential is null then null else public.app_now() + make_interval(secs => credential_ttl_seconds) end);
  return jsonb_build_object('state', 'requested');
end $$;

-- A valid, unexpired invitation is the only pre-membership disclosure of its creator's display name.
create or replace function public.preview_invitation_unthrottled(actor uuid, hash text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare checked jsonb := public.check_invitation(actor, hash, false); target uuid;
begin
  if checked ? 'error' then return checked; end if;
  target := (checked->>'spaceId')::uuid;
  return jsonb_build_object('anniversaryDate', checked->>'anniversaryDate', 'memberCount', (checked->>'memberCount')::int,
    'timeZone', (select time_zone from public.couple_space where id=target),
    'displayName', (select p.display_name from public.space_member m left join public.user_profile p on p.user_id=m.user_id where m.space_id=target and m.space_active order by m.joined_at limit 1));
end $$;
