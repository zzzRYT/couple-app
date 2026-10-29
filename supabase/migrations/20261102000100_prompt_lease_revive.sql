-- rollback: Re-create the previous bodies from 20261101000500_prompt_session.sql and 20261101000600_room.sql, then drop latest_session and expire_stale_sessions; no table or column is added, so no data is lost.
-- Prompt lease fixes: the lease carries its session id on conflicts, an expired lease with a live preview is continued instead of replaced,
-- store_preview and undo extend the lease, the snapshot exposes expired leases, and an expiry function can run without any RPC traffic.
-- The pg_cron schedule for expire_stale_sessions is an owner action (docs/remote-supabase-setup.md); nothing is scheduled here.

create or replace function public.occupied_error(s public.prompt_session) returns text language sql stable set search_path = '' as $$
  select 'SESSION_OCCUPIED:' || jsonb_build_object('sessionId', s.id, 'ownerUserId', s.owner_user_id, 'expiresAt', s.expires_at)::text;
$$;
-- idleSeconds and warnSeconds let clients use the server settings instead of constants (warnAt stays for the absolute time).
create or replace function public.session_json(s public.prompt_session) returns jsonb language sql stable set search_path = '' as $$
  select case when s.id is null then null else jsonb_build_object('sessionId', s.id, 'ownerUserId', s.owner_user_id, 'status', s.status,
    'expiresAt', s.expires_at, 'warnAt', s.expires_at - make_interval(secs => public.setting_int('session_warn_seconds', 30)),
    'idleSeconds', public.setting_int('session_idle_seconds', 180), 'warnSeconds', public.setting_int('session_warn_seconds', 30)) end;
$$;
-- The newest lease of a space as readers should see it: an occupied row past its expiry reads as expired, released leases and
-- expired leases older than the preview lifetime read as nothing (there is nothing left to continue).
create function public.latest_session(target uuid) returns public.prompt_session
language plpgsql stable set search_path = '' as $$
declare s public.prompt_session%rowtype;
begin
  select * into s from public.prompt_session where space_id = target order by acquired_at desc limit 1;
  if not found then return null; end if;
  if s.status = 'occupied' and s.expires_at <= public.app_now() then s.status := 'expired'; end if;
  if s.status = 'released' or (s.status = 'expired' and s.expires_at <= public.app_now() - make_interval(secs => public.setting_int('preview_ttl_seconds', 1800))) then
    return null;
  end if;
  return s;
end $$;
-- Expired events now say whose lease ended and when, so a partner screen can offer the takeover without another round trip.
create or replace function public.expire_sessions(target uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare gone record;
begin
  for gone in update public.prompt_session set status='expired' where space_id=target and status='occupied' and expires_at <= public.app_now()
    returning id, owner_user_id, expires_at loop
    perform public.notify_space(target, 'session', jsonb_build_object('sessionId', gone.id, 'status', 'expired', 'ownerUserId', gone.owner_user_id, 'expiresAt', gone.expires_at));
  end loop;
end $$;
-- Active expiry: marks every lease past its time as expired and sends the event, whether or not anyone calls the API.
-- Meant for pg_cron at one-minute intervals; spaces locked by a running RPC are skipped because that RPC expires them itself.
create function public.expire_stale_sessions() returns integer
language plpgsql security definer set search_path = '' as $$
declare stale uuid; due integer;
begin
  select count(*) into due from public.prompt_session where status='occupied' and expires_at <= public.app_now();
  for stale in select distinct space_id from public.prompt_session where status='occupied' and expires_at <= public.app_now() loop
    perform 1 from public.couple_space where id=stale for update skip locked;
    if found then perform public.expire_sessions(stale); end if;
  end loop;
  return due;
end $$;

-- "Start" picks the right transition: a free space gets a new lease; an expired lease with a live preview is revived for its owner or
-- taken over by the partner, keeping the same session so the conversation and preview continue.
create or replace function public.acquire_session(actor uuid, target uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare s public.prompt_session%rowtype; latest public.prompt_session%rowtype;
begin
  perform public.lock_space_session(actor, target);
  select * into s from public.prompt_session where space_id=target and status='occupied';
  if found then
    if s.owner_user_id=actor then return public.session_json(s); end if;
    raise exception '%', public.occupied_error(s);
  end if;
  select * into latest from public.prompt_session where space_id=target order by acquired_at desc limit 1;
  if found and latest.status='expired' and exists (select 1 from public.decoration_request d
      where d.session_id=latest.id and d.state='previewed' and d.expires_at > public.app_now()) then
    update public.prompt_session set owner_user_id=actor, status='occupied', last_activity_at=public.app_now(), heartbeat_at=public.app_now(),
      expires_at=public.app_now() + make_interval(secs => public.setting_int('session_idle_seconds', 180)),
      takeover_count=takeover_count + case when latest.owner_user_id=actor then 0 else 1 end
      where id=latest.id returning * into s;
  else
    insert into public.prompt_session (space_id, owner_user_id, expires_at)
      values (target, actor, public.app_now() + make_interval(secs => public.setting_int('session_idle_seconds', 180))) returning * into s;
  end if;
  perform public.notify_space(target, 'session', jsonb_build_object('sessionId', s.id, 'status', 'occupied', 'ownerUserId', actor, 'expiresAt', s.expires_at));
  return public.session_json(s);
end $$;

-- A finished preview counts as activity: the owner gets a full idle window to read and apply it.
create or replace function public.store_preview(request uuid, candidate jsonb, repairs integer, prov jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare r public.decoration_request%rowtype; lease public.prompt_session%rowtype;
begin
  perform 1 from public.couple_space s join public.decoration_request d on d.space_id=s.id where d.id=request for update of s;
  update public.decoration_request set state='previewed', result_candidate=candidate, repair_count=least(repairs, 1),
    expires_at=public.app_now() + make_interval(secs => public.setting_int('preview_ttl_seconds', 1800)),
    failure_code=null where id=request and state='queued' returning * into r;
  if not found then raise exception 'PREVIEW_CHANGED'; end if;
  perform public.finalize_daily_request(request, true);
  update public.decoration_request set result_candidate = result_candidate || jsonb_build_object('provenance', prov) where id=request;
  insert into public.prompt_message (space_id, session_id, decoration_request_id, author_user_id, kind) values (r.space_id, r.session_id, r.id, r.requested_by_user_id, 'preview');
  update public.prompt_session set last_activity_at=public.app_now(),
    expires_at=public.app_now() + make_interval(secs => public.setting_int('session_idle_seconds', 180))
    where id=r.session_id and status='occupied' and expires_at > public.app_now() returning * into lease;
  if found then
    perform public.notify_space(r.space_id, 'session', jsonb_build_object('sessionId', lease.id, 'status', 'occupied', 'ownerUserId', lease.owner_user_id, 'expiresAt', lease.expires_at));
  end if;
  perform public.notify_space(r.space_id, 'preview', jsonb_build_object('previewId', r.id, 'status', 'previewed'));
  return public.preview_json(r);
end $$;

create or replace function public.undo_preview(actor uuid, target uuid, session uuid, expected uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare latest public.decoration_request%rowtype; previous uuid; lease public.prompt_session%rowtype;
begin
  perform public.lock_space_session(actor, target);
  if exists (select 1 from public.decoration_request where id=expected and space_id=target and state='applied') then raise exception 'ALREADY_APPLIED'; end if;
  perform public.owned_session(actor, target, session);
  select * into latest from public.decoration_request where session_id=session and state='previewed' order by created_at desc, id desc limit 1 for update;
  if not found then raise exception 'NOTHING_TO_UNDO'; end if;
  if latest.id is distinct from expected then raise exception 'PREVIEW_CHANGED'; end if;
  update public.decoration_request set state='reverted' where id=latest.id;
  select id into previous from public.decoration_request where session_id=session and state='previewed' order by created_at desc, id desc limit 1;
  insert into public.prompt_message (space_id, session_id, decoration_request_id, author_user_id, kind) values (target, session, latest.id, actor, 'status');
  update public.prompt_session set last_activity_at=public.app_now(),
    expires_at=public.app_now() + make_interval(secs => public.setting_int('session_idle_seconds', 180)) where id=session returning * into lease;
  perform public.notify_space(target, 'session', jsonb_build_object('sessionId', lease.id, 'status', 'occupied', 'ownerUserId', lease.owner_user_id, 'expiresAt', lease.expires_at));
  perform public.notify_space(target, 'preview', jsonb_build_object('previewId', previous, 'status', 'reverted'));
  return jsonb_build_object('previewId', previous);
end $$;

-- The open preview stays visible while its lease is expired, so a returning owner or a partner sees what "continue" resumes.
create or replace function public.prompt_conversation(actor uuid, target uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare s public.prompt_session%rowtype; preview public.decoration_request%rowtype;
begin
  perform public.lock_space_session(actor, target);
  s := public.latest_session(target);
  if s.status in ('occupied','expired') then
    select * into preview from public.decoration_request where session_id=s.id and state='previewed' and expires_at > public.app_now() order by created_at desc, id desc limit 1;
  end if;
  return jsonb_build_object(
    'messages', coalesce((select jsonb_agg(jsonb_build_object('id', m.id, 'kind', m.kind, 'authorUserId', m.author_user_id, 'bodyText', m.body_text,
      'previewId', m.decoration_request_id, 'state', d.state, 'failureCode', d.failure_code, 'createdAt', m.created_at) order by m.created_at, m.id)
      from public.prompt_message m left join public.decoration_request d on d.id=m.decoration_request_id where m.space_id=target), '[]'::jsonb),
    'session', public.session_json(s), 'currentPreview', public.preview_json(preview), 'serverTime', public.app_now());
end $$;

create or replace function public.space_snapshot(actor uuid, target uuid) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare space public.couple_space%rowtype; room public.room_theme_version%rowtype; s public.prompt_session%rowtype;
begin
  select s2.* into space from public.couple_space s2 join public.space_member m on m.space_id=s2.id
    where s2.id=target and s2.status='active' and m.user_id=actor and m.space_active;
  if not found then return null; end if;
  room := public.current_room(target);
  s := public.latest_session(target);
  return jsonb_build_object(
    'space', jsonb_build_object('spaceId', space.id, 'status', space.status, 'anniversaryDate', space.anniversary_date,
      'timeZone', space.time_zone, 'updatedAt', space.updated_at,
      'memberCount', (select count(*) from public.space_member where space_id=target and space_active),
      'invitation', (select jsonb_build_object('status', case when i.expires_at <= public.app_now() and i.status='active' then 'expired' else i.status end, 'expiresAt', i.expires_at)
        from public.invitation i where i.space_id=target and i.status in ('active','accepted') order by i.created_at desc limit 1)),
    'members', (select jsonb_agg(jsonb_build_object('userId', user_id, 'aiConsentState', ai_consent_state) order by joined_at)
      from public.space_member where space_id=target and space_active),
    'me', jsonb_build_object('userId', actor),
    'features', jsonb_build_object('generation', false, 'generatedRender', false),
    'generatedObjects', '[]'::jsonb, 'homeCover', jsonb_build_object('status', 'none'),
    'versionNumber', room.version_number, 'sceneDocument', room.scene_document,
    'roomPresentation', room.room_presentation, 'roomThemeDocument', room.room_theme_document,
    'promptSession', public.session_json(s),
    'catalogVersion', (select max(catalog_version) from public.asset_catalog_entry),
    'serverTime', public.app_now());
end $$;

revoke all on function public.latest_session(uuid), public.expire_stale_sessions() from public, anon, authenticated;
grant execute on function public.latest_session(uuid), public.expire_stale_sessions() to service_role;
