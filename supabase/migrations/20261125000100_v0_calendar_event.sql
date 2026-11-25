-- rollback: restore space_snapshot from 20261103000500, then drop these functions and space_event. Soft-deleted rows live until the space is purged; the space purge cascades them.
create table public.space_event (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.couple_space(id) on delete cascade,
  title text not null check (title=btrim(title) and char_length(title) between 1 and 40),
  start_date date not null,
  start_time time,
  end_time time,
  alert text not null default 'none' check (alert in ('none','at','5m','15m','30m','1h','1d')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default public.app_now(),
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default public.app_now(),
  version integer not null default 1,
  deleted_at timestamptz,
  check (end_time is null or (start_time is not null and end_time>start_time)),
  check (start_time is not null or alert in ('none','at','1d'))
);
create index space_event_active on public.space_event(space_id,start_date) where deleted_at is null;
alter table public.space_event enable row level security;
create policy space_event_member_read on public.space_event for select to authenticated using (public.is_space_member(space_id) and deleted_at is null);
revoke all on public.space_event from anon, authenticated;
grant select on public.space_event to authenticated;

create function public.space_event_json(e public.space_event) returns jsonb
language sql stable set search_path = '' as $$
  select jsonb_build_object('id',e.id,'title',e.title,'date',e.start_date,'time',to_char(e.start_time,'HH24:MI'),'endTime',to_char(e.end_time,'HH24:MI'),'alert',e.alert,
    'createdBy',e.created_by,'createdAt',e.created_at,'updatedBy',e.updated_by,'updatedAt',e.updated_at,'version',e.version)
$$;
create function public.create_space_event(actor uuid, target uuid, p_title text, p_date date, p_time time, p_end_time time, p_alert text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare e public.space_event%rowtype;
begin
  perform public.require_member(actor,target);
  perform 1 from public.couple_space where id=target for update;
  if p_title is null or char_length(btrim(p_title)) not between 1 and 40 or p_date is null or p_alert is null or p_alert not in ('none','at','5m','15m','30m','1h','1d') or extract(second from p_time)<>0 or extract(second from p_end_time)<>0 or (p_end_time is not null and (p_time is null or p_end_time<=p_time)) or (p_time is null and p_alert not in ('none','at','1d')) then raise exception 'INVALID_REQUEST'; end if;
  if (select count(*) from public.space_event where space_id=target and deleted_at is null)>=500 then raise exception 'INVALID_REQUEST'; end if;
  insert into public.space_event(space_id,title,start_date,start_time,end_time,alert,created_by,updated_by) values(target,btrim(p_title),p_date,p_time,p_end_time,p_alert,actor,actor) returning * into e;
  perform public.notify_space(target,'event',jsonb_build_object('id',e.id));
  return public.space_event_json(e);
end $$;
create function public.update_space_event(actor uuid, target uuid, p_id uuid, p_expected_version integer, p_title text, p_date date, p_time time, p_end_time time, p_alert text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare e public.space_event%rowtype;
begin
  perform public.require_member(actor,target);
  select * into e from public.space_event where space_id=target and id=p_id for update;
  if not found then raise exception 'NOT_FOUND'; end if;
  if e.deleted_at is not null then raise exception 'NOT_FOUND:{"gone":true}'; end if;
  if p_expected_version is null or e.version<>p_expected_version then raise exception 'VERSION_CONFLICT'; end if;
  if p_title is null or char_length(btrim(p_title)) not between 1 and 40 or p_date is null or p_alert is null or p_alert not in ('none','at','5m','15m','30m','1h','1d') or extract(second from p_time)<>0 or extract(second from p_end_time)<>0 or (p_end_time is not null and (p_time is null or p_end_time<=p_time)) or (p_time is null and p_alert not in ('none','at','1d')) then raise exception 'INVALID_REQUEST'; end if;
  update public.space_event set title=btrim(p_title),start_date=p_date,start_time=p_time,end_time=p_end_time,alert=p_alert,updated_by=actor,updated_at=public.app_now(),version=version+1 where id=p_id returning * into e;
  perform public.notify_space(target,'event',jsonb_build_object('id',e.id));
  return public.space_event_json(e);
end $$;
create function public.delete_space_event(actor uuid, target uuid, p_id uuid, p_expected_version integer) returns void
language plpgsql security definer set search_path = '' as $$
declare e public.space_event%rowtype;
begin
  perform public.require_member(actor,target);
  select * into e from public.space_event where space_id=target and id=p_id for update;
  if not found then raise exception 'NOT_FOUND'; end if;
  if e.deleted_at is not null then raise exception 'NOT_FOUND:{"gone":true}'; end if;
  if p_expected_version is null or e.version<>p_expected_version then raise exception 'VERSION_CONFLICT'; end if;
  update public.space_event set deleted_at=public.app_now(),updated_at=public.app_now(),updated_by=actor,version=version+1 where id=p_id;
  perform public.notify_space(target,'event',jsonb_build_object('id',p_id));
end $$;
revoke all on function public.space_event_json(public.space_event), public.create_space_event(uuid,uuid,text,date,time,time,text), public.update_space_event(uuid,uuid,uuid,integer,text,date,time,time,text), public.delete_space_event(uuid,uuid,uuid,integer) from public,anon,authenticated;
grant execute on function public.create_space_event(uuid,uuid,text,date,time,time,text), public.update_space_event(uuid,uuid,uuid,integer,text,date,time,time,text), public.delete_space_event(uuid,uuid,uuid,integer) to service_role;

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
      'timeZone', space.time_zone, 'updatedAt', space.updated_at, 'anniversaryChangedBy', space.anniversary_changed_by, 'anniversaryChangedAt', space.anniversary_changed_at,
      'memberCount', (select count(*) from public.space_member where space_id=target and space_active),
      'invitation', (select jsonb_build_object('status', case when i.expires_at <= public.app_now() and i.status='active' then 'expired' else i.status end, 'expiresAt', i.expires_at)
        from public.invitation i where i.space_id=target and i.status in ('active','accepted') order by i.created_at desc limit 1)),
    'members', (select jsonb_agg(jsonb_build_object('userId', m.user_id, 'aiConsentState', m.ai_consent_state, 'displayName', p.display_name, 'birthday', case when p.birth_month is not null and exists (select 1 from public.user_profile mine where mine.user_id=actor and mine.birth_month is not null) then jsonb_build_object('month',p.birth_month,'day',p.birth_day) else null end, 'hasBirthday', p.birth_month is not null) order by m.joined_at)
      from public.space_member m left join public.user_profile p on p.user_id=m.user_id where m.space_id=target and m.space_active),
    'me', (select jsonb_build_object('userId', actor, 'displayName', p.display_name, 'birthday', case when p.birth_month is null then null else jsonb_build_object('month', p.birth_month, 'day', p.birth_day, 'year', p.birth_year) end) from (select actor as id) a left join public.user_profile p on p.user_id=a.id),
    'anniversaries', (select coalesce(jsonb_agg(public.custom_anniversary_json(a) order by a.event_date,a.id),'[]'::jsonb) from public.space_anniversary a where a.space_id=target and a.deleted_at is null),
    'events', (select coalesce(jsonb_agg(public.space_event_json(e) order by e.start_date,e.start_time nulls first,e.id),'[]'::jsonb) from public.space_event e where e.space_id=target and e.deleted_at is null),
    'features', jsonb_build_object('generation', false, 'generatedRender', false),
    'generatedObjects', '[]'::jsonb, 'homeCover', jsonb_build_object('status', 'none'),
    'versionNumber', room.version_number, 'sceneDocument', room.scene_document,
    'roomPresentation', room.room_presentation, 'roomThemeDocument', room.room_theme_document,
    'promptSession', public.session_json(s),
    'catalogVersion', (select max(catalog_version) from public.asset_catalog_entry),
    'serverTime', public.app_now());
end $$;
