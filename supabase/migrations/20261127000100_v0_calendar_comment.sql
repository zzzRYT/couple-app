-- rollback: restore space_snapshot from 20261125000100, then drop these functions and space_event_comment. A writer's delete removes the row at once; other rows live until their event's space is purged, which cascades them.
create table public.space_event_comment (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.couple_space(id) on delete cascade,
  event_id uuid not null references public.space_event(id) on delete cascade,
  body text not null check (body=btrim(body) and char_length(body) between 1 and 400),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default public.app_now()
);
create index space_event_comment_event on public.space_event_comment(event_id,created_at);
alter table public.space_event_comment enable row level security;
create policy space_event_comment_member_read on public.space_event_comment for select to authenticated using (public.is_space_member(space_id) and exists (select 1 from public.space_event e where e.id=event_id and e.deleted_at is null));
revoke all on public.space_event_comment from anon, authenticated;
grant select on public.space_event_comment to authenticated;

create function public.space_event_comment_json(c public.space_event_comment) returns jsonb
language sql stable set search_path = '' as $$
  select jsonb_build_object('id',c.id,'eventId',c.event_id,'body',c.body,'createdBy',c.created_by,'createdAt',c.created_at)
$$;
create function public.create_space_event_comment(actor uuid, target uuid, p_event uuid, p_body text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare e public.space_event%rowtype; c public.space_event_comment%rowtype;
begin
  perform public.require_member(actor,target);
  select * into e from public.space_event where space_id=target and id=p_event for update;
  if not found then raise exception 'NOT_FOUND'; end if;
  if e.deleted_at is not null then raise exception 'NOT_FOUND:{"gone":true}'; end if;
  if p_body is null or char_length(btrim(p_body)) not between 1 and 400 then raise exception 'INVALID_REQUEST'; end if;
  if (select count(*) from public.space_event_comment where event_id=p_event)>=200 then raise exception 'INVALID_REQUEST'; end if;
  insert into public.space_event_comment(space_id,event_id,body,created_by) values(target,p_event,btrim(p_body),actor) returning * into c;
  perform public.notify_space(target,'event',jsonb_build_object('id',p_event));
  return public.space_event_comment_json(c);
end $$;
create function public.delete_space_event_comment(actor uuid, target uuid, p_event uuid, p_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform public.require_member(actor,target);
  perform 1 from public.space_event_comment where space_id=target and event_id=p_event and id=p_id and created_by=actor for update;
  if not found then raise exception 'NOT_FOUND'; end if;
  delete from public.space_event_comment where id=p_id;
  perform public.notify_space(target,'event',jsonb_build_object('id',p_event));
end $$;
revoke all on function public.space_event_comment_json(public.space_event_comment), public.create_space_event_comment(uuid,uuid,uuid,text), public.delete_space_event_comment(uuid,uuid,uuid,uuid) from public,anon,authenticated;
grant execute on function public.create_space_event_comment(uuid,uuid,uuid,text), public.delete_space_event_comment(uuid,uuid,uuid,uuid) to service_role;

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
    'eventComments', (select coalesce(jsonb_agg(public.space_event_comment_json(c) order by c.created_at,c.id),'[]'::jsonb) from public.space_event_comment c join public.space_event e on e.id=c.event_id where c.space_id=target and e.deleted_at is null),
    'features', jsonb_build_object('generation', false, 'generatedRender', false),
    'generatedObjects', '[]'::jsonb, 'homeCover', jsonb_build_object('status', 'none'),
    'versionNumber', room.version_number, 'sceneDocument', room.scene_document,
    'roomPresentation', room.room_presentation, 'roomThemeDocument', room.room_theme_document,
    'promptSession', public.session_json(s),
    'catalogVersion', (select max(catalog_version) from public.asset_catalog_entry),
    'serverTime', public.app_now());
end $$;
