-- rollback: Restore a verified backup before dropping these objects; dropping invitation or space_end_notice deletes pending codes and unread end notices.
create table public.invitation (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.couple_space(id) on delete cascade,
  created_by_user_id uuid not null references auth.users(id) on delete cascade,
  token_hash text not null unique,
  status text not null default 'active' check (status in ('active','accepted','expired','revoked')),
  created_at timestamptz not null default public.app_now(),
  expires_at timestamptz not null default public.app_now() + interval '24 hours',
  accepted_at timestamptz, accepted_by_user_id uuid references auth.users(id) on delete set null, revoked_at timestamptz
);
create table public.space_end_notice (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  space_id uuid not null references public.couple_space(id) on delete cascade,
  kind text not null check (kind in ('ended','disconnect','account_deleted')),
  by_user_id uuid, at timestamptz not null default public.app_now(), acked_at timestamptz
);
alter table public.invitation enable row level security;
alter table public.space_end_notice enable row level security;
create policy invitation_read on public.invitation for select to authenticated using (public.is_space_member(space_id));

-- Broadcast only identifiers and states to the private space channel.
create function public.notify_space(target uuid, event text, payload jsonb) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform realtime.send(payload, event, 'space:' || target::text, true);
exception when others then null;
end $$;

create function public.require_member(actor uuid, target uuid) returns void
language plpgsql stable security definer set search_path = '' as $$
begin
  if not exists (select 1 from public.space_member m join public.couple_space s on s.id=m.space_id
    where m.space_id=target and m.user_id=actor and m.space_active and s.status='active') then
    raise exception 'NOT_FOUND';
  end if;
end $$;

create function public.create_space(actor uuid, anniversary date, tz text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare created uuid;
begin
  if tz is null or not exists (select 1 from pg_catalog.pg_timezone_names where name=tz) then raise exception 'INVALID_REQUEST'; end if;
  if anniversary is null or anniversary > (public.app_now() at time zone tz)::date then raise exception 'INVALID_REQUEST'; end if;
  if exists (select 1 from public.space_member where user_id=actor and space_active) then raise exception 'ALREADY_IN_SPACE'; end if;
  insert into public.couple_space (anniversary_date, time_zone) values (anniversary, tz) returning id into created;
  insert into public.space_member (space_id, user_id) values (created, actor);
  insert into public.user_profile (user_id, time_zone) values (actor, tz) on conflict (user_id) do nothing;
  return jsonb_build_object('spaceId', created, 'status', 'active', 'memberCount', 1, 'anniversaryDate', anniversary);
exception when unique_violation then raise exception 'ALREADY_IN_SPACE';
end $$;

create function public.create_invitation(actor uuid, target uuid, hash text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare created public.invitation%rowtype;
begin
  perform public.require_member(actor, target);
  perform 1 from public.couple_space where id=target for update;
  if (select count(*) from public.space_member where space_id=target and space_active) >= 2 then raise exception 'SPACE_FULL'; end if;
  update public.invitation set status='revoked', revoked_at=public.app_now() where space_id=target and status='active';
  insert into public.invitation (space_id, created_by_user_id, token_hash) values (target, actor, hash) returning * into created;
  perform public.notify_space(target, 'member', jsonb_build_object('kind', 'invitation_issued'));
  return jsonb_build_object('invitationId', created.id, 'expiresAt', created.expires_at);
end $$;

-- Returns {error:{code}} instead of raising so the caller can record the failed attempt in the same call.
create function public.check_invitation(actor uuid, hash text, lock boolean) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare inv public.invitation%rowtype; members integer;
begin
  if lock then select * into inv from public.invitation where token_hash=hash for update;
  else select * into inv from public.invitation where token_hash=hash; end if;
  if not found or inv.status='revoked' then return '{"error":{"code":"INVITE_INVALID"}}'; end if;
  if inv.status='accepted' then return '{"error":{"code":"INVITE_USED"}}'; end if;
  if inv.status='expired' or inv.expires_at <= public.app_now() then return '{"error":{"code":"INVITE_EXPIRED"}}'; end if;
  if not public.is_space_active(inv.space_id) then return '{"error":{"code":"INVITE_INVALID"}}'; end if;
  if exists (select 1 from public.space_member where user_id=actor and space_active) then return '{"error":{"code":"ALREADY_IN_SPACE"}}'; end if;
  select count(*) into members from public.space_member where space_id=inv.space_id and space_active;
  if members >= 2 then return '{"error":{"code":"SPACE_FULL"}}'; end if;
  return jsonb_build_object('invitationId', inv.id, 'spaceId', inv.space_id, 'memberCount', members,
    'anniversaryDate', (select anniversary_date from public.couple_space where id=inv.space_id));
end $$;

create function public.preview_invitation(actor uuid, hash text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare checked jsonb := public.check_invitation(actor, hash, false);
begin
  if checked ? 'error' then return checked; end if;
  return jsonb_build_object('anniversaryDate', checked->>'anniversaryDate', 'memberCount', (checked->>'memberCount')::int);
end $$;

create function public.accept_invitation(actor uuid, hash text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare checked jsonb := public.check_invitation(actor, hash, true); target uuid;
begin
  if checked ? 'error' then return checked; end if;
  target := (checked->>'spaceId')::uuid;
  perform 1 from public.couple_space where id=target for update;
  if (select count(*) from public.space_member where space_id=target and space_active) >= 2 then return '{"error":{"code":"SPACE_FULL"}}'; end if;
  begin
    insert into public.space_member (space_id, user_id) values (target, actor);
  exception when unique_violation then return '{"error":{"code":"ALREADY_IN_SPACE"}}';
  end;
  update public.invitation set status='accepted', accepted_at=public.app_now(), accepted_by_user_id=actor where id=(checked->>'invitationId')::uuid;
  perform public.notify_space(target, 'member', jsonb_build_object('kind', 'joined', 'memberCount', 2));
  return jsonb_build_object('spaceId', target, 'status', 'active', 'memberCount', 2);
end $$;

create function public.update_anniversary(actor uuid, target uuid, anniversary date, expected timestamptz) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare space public.couple_space%rowtype;
begin
  perform public.require_member(actor, target);
  select * into space from public.couple_space where id=target for update;
  if anniversary is null or anniversary > (public.app_now() at time zone space.time_zone)::date then raise exception 'INVALID_REQUEST'; end if;
  if expected is null or date_trunc('milliseconds', space.updated_at) <> date_trunc('milliseconds', expected) then raise exception 'VERSION_CONFLICT'; end if;
  update public.couple_space set anniversary_date=anniversary, updated_at=public.app_now() where id=target returning * into space;
  perform public.notify_space(target, 'member', jsonb_build_object('kind', 'anniversary'));
  return jsonb_build_object('anniversaryDate', space.anniversary_date, 'updatedAt', space.updated_at, 'milestonesReset', '[]'::jsonb);
end $$;

create function public.my_spaces(actor uuid) returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'active', (select jsonb_build_object('spaceId', m.space_id) from public.space_member m join public.couple_space s on s.id=m.space_id
      where m.user_id=actor and m.space_active and s.status='active' limit 1),
    'ended', (select jsonb_build_object('kind', n.kind, 'by', case when n.by_user_id=actor then 'me' else 'partner' end, 'at', n.at)
      from public.space_end_notice n where n.user_id=actor and n.acked_at is null order by n.at desc limit 1));
$$;

create function public.ack_ended_notice(actor uuid) returns void
language sql security definer set search_path = '' as $$
  update public.space_end_notice set acked_at=public.app_now() where user_id=actor and acked_at is null;
$$;

create function public.space_snapshot(actor uuid, target uuid) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare space public.couple_space%rowtype;
begin
  select s.* into space from public.couple_space s join public.space_member m on m.space_id=s.id
    where s.id=target and s.status='active' and m.user_id=actor and m.space_active;
  if not found then return null; end if;
  return jsonb_build_object(
    'space', jsonb_build_object('spaceId', space.id, 'status', space.status, 'anniversaryDate', space.anniversary_date,
      'timeZone', space.time_zone, 'updatedAt', space.updated_at,
      'memberCount', (select count(*) from public.space_member where space_id=target and space_active),
      'invitation', (select jsonb_build_object('status', case when i.expires_at <= public.app_now() then 'expired' else i.status end, 'expiresAt', i.expires_at)
        from public.invitation i where i.space_id=target and i.status in ('active','accepted') order by i.created_at desc limit 1)),
    'members', (select jsonb_agg(jsonb_build_object('userId', user_id, 'aiConsentState', ai_consent_state) order by joined_at)
      from public.space_member where space_id=target and space_active),
    'me', jsonb_build_object('userId', actor),
    'serverTime', public.app_now());
end $$;

revoke all on function public.notify_space(uuid,text,jsonb), public.require_member(uuid,uuid), public.create_space(uuid,date,text),
  public.create_invitation(uuid,uuid,text), public.check_invitation(uuid,text,boolean), public.preview_invitation(uuid,text),
  public.accept_invitation(uuid,text), public.update_anniversary(uuid,uuid,date,timestamptz), public.my_spaces(uuid),
  public.ack_ended_notice(uuid), public.space_snapshot(uuid,uuid) from public, anon, authenticated;
grant execute on function public.create_space(uuid,date,text), public.create_invitation(uuid,uuid,text), public.preview_invitation(uuid,text),
  public.accept_invitation(uuid,text), public.update_anniversary(uuid,uuid,date,timestamptz), public.my_spaces(uuid),
  public.ack_ended_notice(uuid), public.space_snapshot(uuid,uuid) to service_role;
