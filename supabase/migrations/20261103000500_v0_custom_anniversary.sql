-- rollback: restore space_snapshot from 20261103000300, then drop these functions and space_anniversary. Soft-deleted rows live until the space is purged.
create table public.space_anniversary (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.couple_space(id) on delete cascade,
  title text not null check (title=btrim(title) and char_length(title) between 1 and 40),
  memo text check (memo is null or char_length(memo)<=200),
  event_date date not null,
  repeat text not null check (repeat in ('yearly','once')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default public.app_now(),
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default public.app_now(),
  version integer not null default 1,
  deleted_at timestamptz
);
create index space_anniversary_active on public.space_anniversary(space_id) where deleted_at is null;
alter table public.space_anniversary enable row level security;
create policy space_anniversary_member_read on public.space_anniversary for select to authenticated using (public.is_space_member(space_id) and deleted_at is null);
revoke all on public.space_anniversary from anon, authenticated;
grant select on public.space_anniversary to authenticated;

create function public.custom_anniversary_json(a public.space_anniversary) returns jsonb
language sql immutable set search_path = '' as $$
  select jsonb_build_object('id',a.id,'title',a.title,'memo',a.memo,'date',a.event_date,'repeat',a.repeat,
    'createdBy',a.created_by,'createdAt',a.created_at,'updatedBy',a.updated_by,'updatedAt',a.updated_at,'version',a.version)
$$;
create function public.create_custom_anniversary(actor uuid, target uuid, p_title text, p_memo text, p_date date, p_repeat text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare a public.space_anniversary%rowtype;
begin
  perform public.require_member(actor,target);
  perform 1 from public.couple_space where id=target for update;
  if p_title is null or char_length(btrim(p_title)) not between 1 and 40 or (p_memo is not null and char_length(p_memo)>200) or p_date is null or p_repeat is null or p_repeat not in ('yearly','once') then raise exception 'INVALID_REQUEST'; end if;
  if (select count(*) from public.space_anniversary where space_id=target and deleted_at is null)>=200 then raise exception 'INVALID_REQUEST'; end if;
  insert into public.space_anniversary(space_id,title,memo,event_date,repeat,created_by,updated_by) values(target,btrim(p_title),p_memo,p_date,p_repeat,actor,actor) returning * into a;
  perform public.notify_space(target,'anniversary',jsonb_build_object('id',a.id));
  return public.custom_anniversary_json(a);
end $$;
create function public.update_custom_anniversary(actor uuid, target uuid, p_id uuid, p_expected_version integer, p_title text, p_memo text, p_date date, p_repeat text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare a public.space_anniversary%rowtype;
begin
  perform public.require_member(actor,target);
  select * into a from public.space_anniversary where space_id=target and id=p_id for update;
  if not found then raise exception 'NOT_FOUND'; end if;
  if a.deleted_at is not null then raise exception 'NOT_FOUND:{"gone":true}'; end if;
  if p_expected_version is null or a.version<>p_expected_version then raise exception 'VERSION_CONFLICT'; end if;
  if p_title is null or char_length(btrim(p_title)) not between 1 and 40 or (p_memo is not null and char_length(p_memo)>200) or p_date is null or p_repeat is null or p_repeat not in ('yearly','once') then raise exception 'INVALID_REQUEST'; end if;
  update public.space_anniversary set title=btrim(p_title),memo=p_memo,event_date=p_date,repeat=p_repeat,updated_by=actor,updated_at=public.app_now(),version=version+1 where id=p_id returning * into a;
  perform public.notify_space(target,'anniversary',jsonb_build_object('id',a.id));
  return public.custom_anniversary_json(a);
end $$;
create function public.delete_custom_anniversary(actor uuid, target uuid, p_id uuid, p_expected_version integer) returns void
language plpgsql security definer set search_path = '' as $$
declare a public.space_anniversary%rowtype;
begin
  perform public.require_member(actor,target);
  select * into a from public.space_anniversary where space_id=target and id=p_id for update;
  if not found then raise exception 'NOT_FOUND'; end if;
  if a.deleted_at is not null then raise exception 'NOT_FOUND:{"gone":true}'; end if;
  if p_expected_version is null or a.version<>p_expected_version then raise exception 'VERSION_CONFLICT'; end if;
  update public.space_anniversary set deleted_at=public.app_now(),updated_at=public.app_now(),updated_by=actor,version=version+1 where id=p_id;
  perform public.notify_space(target,'anniversary',jsonb_build_object('id',p_id));
end $$;
revoke all on function public.custom_anniversary_json(public.space_anniversary), public.create_custom_anniversary(uuid,uuid,text,text,date,text), public.update_custom_anniversary(uuid,uuid,uuid,integer,text,text,date,text), public.delete_custom_anniversary(uuid,uuid,uuid,integer) from public,anon,authenticated;
grant execute on function public.create_custom_anniversary(uuid,uuid,text,text,date,text), public.update_custom_anniversary(uuid,uuid,uuid,integer,text,text,date,text), public.delete_custom_anniversary(uuid,uuid,uuid,integer) to service_role;

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
    'features', jsonb_build_object('generation', false, 'generatedRender', false),
    'generatedObjects', '[]'::jsonb, 'homeCover', jsonb_build_object('status', 'none'),
    'versionNumber', room.version_number, 'sceneDocument', room.scene_document,
    'roomPresentation', room.room_presentation, 'roomThemeDocument', room.room_theme_document,
    'promptSession', public.session_json(s),
    'catalogVersion', (select max(catalog_version) from public.asset_catalog_entry),
    'serverTime', public.app_now());
end $$;
