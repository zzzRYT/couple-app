-- deletion-policy: Session rows and prompt messages are transient; lifecycle-sweep deletes unapplied messages after 24 hours and applied ones after 30 days. Dropping the tables loses only open conversations.
insert into public.app_settings (key, value) values ('session_idle_seconds', '180'), ('session_warn_seconds', '30') on conflict (key) do nothing;
create table public.prompt_session (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.couple_space(id) on delete cascade,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'occupied' check (status in ('occupied','released','expired')),
  acquired_at timestamptz not null default public.app_now(), last_activity_at timestamptz not null default public.app_now(),
  expires_at timestamptz not null, heartbeat_at timestamptz, released_at timestamptz,
  release_reason text check (release_reason in ('cancel','confirm','space_ended','consent_revoked')),
  takeover_count integer not null default 0
);
create unique index one_occupied_session_per_space on public.prompt_session (space_id) where status='occupied';
create table public.prompt_message (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.couple_space(id) on delete cascade,
  session_id uuid references public.prompt_session(id) on delete set null,
  decoration_request_id uuid,
  author_user_id uuid references auth.users(id) on delete set null,
  kind text not null check (kind in ('user_prompt','preview','status')),
  body_text text, created_at timestamptz not null default public.app_now()
);
create index prompt_message_space_time on public.prompt_message (space_id, created_at);
alter table public.prompt_session enable row level security;
alter table public.prompt_message enable row level security;
alter table public.app_settings enable row level security;
create policy session_read on public.prompt_session for select to authenticated using (public.is_space_member(space_id));
create policy message_read on public.prompt_message for select to authenticated using (public.is_space_member(space_id));

create function public.session_json(s public.prompt_session) returns jsonb language sql stable set search_path = '' as $$
  select case when s.id is null then null else jsonb_build_object('sessionId', s.id, 'ownerUserId', s.owner_user_id, 'status', s.status,
    'expiresAt', s.expires_at, 'warnAt', s.expires_at - make_interval(secs => public.setting_int('session_warn_seconds', 30))) end;
$$;
create function public.occupied_error(s public.prompt_session) returns text language sql stable set search_path = '' as $$
  select 'SESSION_OCCUPIED:' || jsonb_build_object('ownerUserId', s.owner_user_id, 'expiresAt', s.expires_at)::text;
$$;
-- Lazily marks leases whose idle time ran out; every session RPC calls this under the space row lock.
create function public.expire_sessions(target uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare expired_id uuid;
begin
  for expired_id in update public.prompt_session set status='expired' where space_id=target and status='occupied' and expires_at <= public.app_now() returning id loop
    perform public.notify_space(target, 'session', jsonb_build_object('sessionId', expired_id, 'status', 'expired'));
  end loop;
end $$;
create function public.lock_space_session(actor uuid, target uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform public.require_member(actor, target);
  perform 1 from public.couple_space where id=target for update;
  perform public.expire_sessions(target);
end $$;
create function public.owned_session(actor uuid, target uuid, session uuid) returns public.prompt_session
language plpgsql security definer set search_path = '' as $$
declare s public.prompt_session%rowtype;
begin
  select * into s from public.prompt_session where id=session and space_id=target for update;
  if not found then raise exception 'NOT_FOUND'; end if;
  if s.status='expired' and s.owner_user_id=actor then raise exception 'SESSION_EXPIRED'; end if;
  if s.status<>'occupied' then raise exception 'SESSION_CONFLICT'; end if;
  if s.owner_user_id<>actor then raise exception '%', public.occupied_error(s); end if;
  return s;
end $$;

create function public.session_state(actor uuid, target uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare s public.prompt_session%rowtype;
begin
  perform public.lock_space_session(actor, target);
  select * into s from public.prompt_session where space_id=target order by acquired_at desc limit 1;
  return public.session_json(s);
end $$;
create function public.acquire_session(actor uuid, target uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare s public.prompt_session%rowtype;
begin
  perform public.lock_space_session(actor, target);
  select * into s from public.prompt_session where space_id=target and status='occupied';
  if found then
    if s.owner_user_id=actor then return public.session_json(s); end if;
    raise exception '%', public.occupied_error(s);
  end if;
  insert into public.prompt_session (space_id, owner_user_id, expires_at)
    values (target, actor, public.app_now() + make_interval(secs => public.setting_int('session_idle_seconds', 180))) returning * into s;
  perform public.notify_space(target, 'session', jsonb_build_object('sessionId', s.id, 'status', 'occupied', 'ownerUserId', actor, 'expiresAt', s.expires_at));
  return public.session_json(s);
end $$;
create function public.heartbeat_session(actor uuid, target uuid, session uuid, active boolean) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare s public.prompt_session%rowtype;
begin
  perform public.lock_space_session(actor, target);
  s := public.owned_session(actor, target, session);
  if active then
    update public.prompt_session set heartbeat_at=public.app_now(), last_activity_at=public.app_now(),
      expires_at=public.app_now() + make_interval(secs => public.setting_int('session_idle_seconds', 180)) where id=session returning * into s;
    perform public.notify_space(target, 'session', jsonb_build_object('sessionId', s.id, 'status', 'occupied', 'ownerUserId', actor, 'expiresAt', s.expires_at));
  else
    update public.prompt_session set heartbeat_at=public.app_now() where id=session returning * into s;
  end if;
  return public.session_json(s);
end $$;
create function public.takeover_session(actor uuid, target uuid, session uuid, expected_owner uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare s public.prompt_session%rowtype;
begin
  perform public.lock_space_session(actor, target);
  select * into s from public.prompt_session where id=session and space_id=target for update;
  if not found then raise exception 'NOT_FOUND'; end if;
  if s.status='occupied' then raise exception '%', public.occupied_error(s); end if;
  if s.owner_user_id is distinct from expected_owner or s.status<>'expired' then raise exception 'SESSION_CONFLICT'; end if;
  if exists (select 1 from public.prompt_session where space_id=target and status='occupied') then
    raise exception '%', (select public.occupied_error(o) from public.prompt_session o where o.space_id=target and o.status='occupied');
  end if;
  update public.prompt_session set owner_user_id=actor, status='occupied', last_activity_at=public.app_now(), heartbeat_at=public.app_now(),
    expires_at=public.app_now() + make_interval(secs => public.setting_int('session_idle_seconds', 180)), takeover_count=takeover_count+1
    where id=session returning * into s;
  perform public.notify_space(target, 'session', jsonb_build_object('sessionId', s.id, 'status', 'occupied', 'ownerUserId', actor, 'expiresAt', s.expires_at));
  return public.session_json(s);
end $$;
create function public.release_session(actor uuid, target uuid, session uuid, reason text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if reason is distinct from 'cancel' then raise exception 'INVALID_REQUEST'; end if;
  perform public.lock_space_session(actor, target);
  perform public.owned_session(actor, target, session);
  update public.prompt_session set status='released', released_at=public.app_now(), release_reason=reason where id=session;
  perform public.notify_space(target, 'session', jsonb_build_object('sessionId', session, 'status', 'released'));
end $$;
-- Phase 4 conversation: messages and lease state; previews are added by the room migration.
create function public.prompt_conversation(actor uuid, target uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare s public.prompt_session%rowtype;
begin
  perform public.lock_space_session(actor, target);
  select * into s from public.prompt_session where space_id=target order by acquired_at desc limit 1;
  return jsonb_build_object(
    'messages', coalesce((select jsonb_agg(jsonb_build_object('id', m.id, 'kind', m.kind, 'authorUserId', m.author_user_id, 'bodyText', m.body_text,
      'previewId', m.decoration_request_id, 'createdAt', m.created_at) order by m.created_at, m.id) from public.prompt_message m where m.space_id=target), '[]'::jsonb),
    'session', public.session_json(s), 'currentPreview', null);
end $$;
revoke all on function public.session_json(public.prompt_session), public.occupied_error(public.prompt_session), public.expire_sessions(uuid),
  public.lock_space_session(uuid,uuid), public.owned_session(uuid,uuid,uuid), public.session_state(uuid,uuid), public.acquire_session(uuid,uuid),
  public.heartbeat_session(uuid,uuid,uuid,boolean), public.takeover_session(uuid,uuid,uuid,uuid), public.release_session(uuid,uuid,uuid,text),
  public.prompt_conversation(uuid,uuid) from public, anon, authenticated;
grant execute on function public.session_state(uuid,uuid), public.acquire_session(uuid,uuid), public.heartbeat_session(uuid,uuid,uuid,boolean),
  public.takeover_session(uuid,uuid,uuid,uuid), public.release_session(uuid,uuid,uuid,text), public.prompt_conversation(uuid,uuid) to service_role;
