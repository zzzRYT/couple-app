-- rollback: restore from a verified backup before dropping milestone history.
create table public.milestone_celebration (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.couple_space(id) on delete cascade,
  milestone_key text not null check (milestone_key ~ '^(d(50|100|200|300|500|1000)|y[1-9][0-9]*)$'),
  kind text not null check (kind in ('day','anniversary')),
  milestone_days integer,
  anniversary_n integer,
  milestone_date date not null,
  priority integer not null check (priority in (1,2)),
  status text not null default 'active' check (status in ('active','passed')),
  preset_applied_version_id uuid references public.room_theme_version(id) on delete set null,
  created_at timestamptz not null default public.app_now(),
  unique (space_id, milestone_key),
  check ((kind='day' and milestone_days in (50,100,200,300,500,1000) and anniversary_n is null and priority=1)
      or (kind='anniversary' and milestone_days is null and anniversary_n >= 1 and priority=2))
);
create index milestone_celebration_active on public.milestone_celebration(space_id, milestone_date desc) where status='active';
create table public.milestone_seen (
  celebration_id uuid not null references public.milestone_celebration(id) on delete cascade,
  member_user_id uuid not null references auth.users(id) on delete cascade,
  seen_at timestamptz not null default public.app_now(),
  via text not null check (via in ('home','room')),
  primary key (celebration_id, member_user_id)
);
alter table public.milestone_celebration enable row level security;
alter table public.milestone_seen enable row level security;
create policy milestone_celebration_member_read on public.milestone_celebration for select to authenticated
  using (public.is_space_member(space_id));
create policy milestone_seen_self_read on public.milestone_seen for select to authenticated
  using (member_user_id=auth.uid() and exists (
    select 1 from public.milestone_celebration c where c.id=celebration_id and public.is_space_member(c.space_id)));
revoke all on public.milestone_celebration, public.milestone_seen from anon, authenticated;
grant select on public.milestone_celebration, public.milestone_seen to authenticated;

create function public.milestone_context(actor uuid, target uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare s public.couple_space%rowtype; members integer; tz text; room jsonb;
begin
  perform public.require_member(actor,target);
  select * into s from public.couple_space where id=target and status='active';
  if not found then raise exception 'NOT_FOUND'; end if;
  select count(*) into members from public.space_member where space_id=target and space_active;
  if members < 2 then return jsonb_build_object('eligible',false); end if;
  select v.room_theme_document into room from public.room_theme t join public.room_theme_version v on v.id=t.current_version_id where t.space_id=target;
  tz := coalesce(room->>'timeZone',s.time_zone);
  return jsonb_build_object('eligible',true,'anniversaryDate',s.anniversary_date,'timeZone',tz,
    'serverTime',public.app_now(),'today',(public.app_now() at time zone tz)::date);
end $$;

create function public.record_milestones(actor uuid, target uuid, items jsonb, expected_anniversary date, expected_timezone text, expected_today date) returns void
language plpgsql security definer set search_path = '' as $$
declare item jsonb; s public.couple_space%rowtype; tz text;
begin
  perform public.require_member(actor,target);
  select * into s from public.couple_space where id=target and status='active' for update;
  if not found or (select count(*) from public.space_member where space_id=target and space_active)<2 then return; end if;
  select coalesce(v.room_theme_document->>'timeZone',s.time_zone) into tz from public.room_theme t
    join public.room_theme_version v on v.id=t.current_version_id where t.space_id=target;
  tz := coalesce(tz,s.time_zone);
  if s.anniversary_date is distinct from expected_anniversary or tz is distinct from expected_timezone or
      (public.app_now() at time zone tz)::date is distinct from expected_today then raise exception 'VERSION_CONFLICT'; end if;
  for item in select value from jsonb_array_elements(items) loop
    insert into public.milestone_celebration(space_id,milestone_key,kind,milestone_days,anniversary_n,milestone_date,priority,status)
      values(target,item->>'key',item->>'kind',nullif(item->>'days','null')::integer,nullif(item->>'anniversaryN','null')::integer,
        (item->>'milestoneDate')::date,case when item->>'kind'='anniversary' then 2 else 1 end,item->>'status')
      on conflict(space_id,milestone_key) do update set status=excluded.status,milestone_date=excluded.milestone_date;
  end loop;
end $$;

create function public.read_current_milestone(actor uuid, target uuid, p_key text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare c public.milestone_celebration%rowtype;
begin
  perform public.require_member(actor,target);
  select * into c from public.milestone_celebration where space_id=target and milestone_celebration.milestone_key=p_key;
  if not found then return null; end if;
  return jsonb_build_object('id',c.id,'key',c.milestone_key,'kind',c.kind,'days',c.milestone_days,'anniversaryN',c.anniversary_n,
    'milestoneDate',c.milestone_date,'seenByMe',exists(select 1 from public.milestone_seen where celebration_id=c.id and member_user_id=actor),
    'presetApplied',c.preset_applied_version_id is not null);
end $$;

create function public.mark_milestone_seen(actor uuid, target uuid, celebration uuid, via text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform public.require_member(actor,target);
  if via not in ('home','room') then raise exception 'INVALID_REQUEST'; end if;
  if not public.is_space_active(target) then raise exception 'NOT_FOUND'; end if;
  insert into public.milestone_seen(celebration_id,member_user_id,via)
    select c.id,actor,via from public.milestone_celebration c where c.id=celebration and c.space_id=target
      and c.status='active' and c.milestone_date <= (public.app_now() at time zone coalesce((select v.room_theme_document->>'timeZone'
        from public.room_theme t join public.room_theme_version v on v.id=t.current_version_id where t.space_id=target),
        (select time_zone from public.couple_space where id=target)))::date
      and c.milestone_date >= (public.app_now() at time zone coalesce((select v.room_theme_document->>'timeZone'
        from public.room_theme t join public.room_theme_version v on v.id=t.current_version_id where t.space_id=target),
        (select time_zone from public.couple_space where id=target)))::date - 6
    on conflict(celebration_id,member_user_id) do nothing;
end $$;

-- Preserve old celebration records; only milestones moved into the future become eligible again.
create or replace function public.update_anniversary(actor uuid, target uuid, anniversary date, expected timestamptz) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare s public.couple_space%rowtype; today date; reset_keys jsonb; tz text;
begin
  perform public.require_member(actor,target);
  select * into s from public.couple_space where id=target for update;
  select coalesce(v.room_theme_document->>'timeZone',s.time_zone) into tz from public.room_theme t
    join public.room_theme_version v on v.id=t.current_version_id where t.space_id=target;
  today := (public.app_now() at time zone coalesce(tz,s.time_zone))::date;
  if anniversary is null or anniversary > today then raise exception 'INVALID_REQUEST'; end if;
  if expected is null or date_trunc('milliseconds',s.updated_at) <> date_trunc('milliseconds',expected) then raise exception 'VERSION_CONFLICT'; end if;
  select coalesce(jsonb_agg(c.milestone_key order by c.milestone_key),'[]'::jsonb) into reset_keys
  from public.milestone_celebration c where c.space_id=target and
    case when c.kind='day' then anniversary + (c.milestone_days-1)
      else make_date(extract(year from anniversary)::integer+c.anniversary_n,extract(month from anniversary)::integer,
        least(extract(day from anniversary)::integer,extract(day from (make_date(extract(year from anniversary)::integer+c.anniversary_n,extract(month from anniversary)::integer,1)+interval '1 month - 1 day'))::integer)) end > today;
  delete from public.milestone_celebration c where c.space_id=target and c.milestone_key in (select jsonb_array_elements_text(reset_keys));
  update public.couple_space set anniversary_date=anniversary,updated_at=public.app_now() where id=target returning * into s;
  perform public.notify_space(target,'member',jsonb_build_object('kind','anniversary'));
  return jsonb_build_object('anniversaryDate',s.anniversary_date,'updatedAt',s.updated_at,'milestonesReset',reset_keys);
end $$;

revoke all on function public.milestone_context(uuid,uuid),public.record_milestones(uuid,uuid,jsonb,date,text,date),public.read_current_milestone(uuid,uuid,text),public.mark_milestone_seen(uuid,uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.milestone_context(uuid,uuid),public.record_milestones(uuid,uuid,jsonb,date,text,date),public.read_current_milestone(uuid,uuid,text),public.mark_milestone_seen(uuid,uuid,uuid,text) to service_role;
revoke all on function public.update_anniversary(uuid,uuid,date,timestamptz) from public,anon;
grant execute on function public.update_anniversary(uuid,uuid,date,timestamptz) to authenticated,service_role;

-- The existing confirmation RPC remains the only path that changes the room. Its
-- source and preset audit are derived from the saved request, never from the client.
create function public.set_room_version_source() returns trigger language plpgsql security definer set search_path = '' as $$
declare request_source text;
begin
  if new.source='prompt' and new.provenance ? 'request_id' then
    select source into request_source from public.decoration_request where id=(new.provenance->>'request_id')::uuid;
    if request_source='milestone_preset' then new.source := 'milestone_preset'; end if;
  end if;
  return new;
end $$;
create trigger room_version_milestone_source before insert on public.room_theme_version
  for each row execute function public.set_room_version_source();

create function public.track_milestone_preset_request() returns trigger language plpgsql security definer set search_path = '' as $$
declare celebration uuid; key text;
begin
  if new.source='milestone_preset' and new.state='applied' and new.applied_version_id is not null and
      (old.state is distinct from new.state or old.applied_version_id is distinct from new.applied_version_id) then
    celebration := nullif(new.result_candidate->>'milestoneCelebrationId','')::uuid;
    key := nullif(new.result_candidate->>'milestoneKey','');
    update public.milestone_celebration set preset_applied_version_id=new.applied_version_id where id=celebration and space_id=new.space_id;
    insert into public.space_lifecycle_event(space_id,event_type,actor_user_id,metadata)
      values(new.space_id,'milestone_preset_applied',new.requested_by_user_id,jsonb_build_object('milestone_key',key));
  end if;
  return new;
end $$;
create trigger milestone_preset_applied_audit after update of state,applied_version_id on public.decoration_request
  for each row execute function public.track_milestone_preset_request();

create function public.milestone_preview_source(actor uuid, target uuid, preview uuid) returns text
language plpgsql security definer set search_path = '' as $$
declare result text;
begin
  perform public.require_member(actor,target);
  select source into result from public.decoration_request where id=preview and space_id=target;
  return result;
end $$;
revoke all on function public.milestone_preview_source(uuid,uuid,uuid) from public,anon,authenticated;
grant execute on function public.milestone_preview_source(uuid,uuid,uuid) to service_role;

create function public.begin_milestone_preset(actor uuid, target uuid, session uuid, celebration uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare current public.room_theme_version%rowtype; c public.milestone_celebration%rowtype; owned public.prompt_session%rowtype; s public.couple_space%rowtype;
begin
  perform public.lock_space_session(actor,target);
  select * into s from public.couple_space where id=target and status='active';
  if not found or (select count(*) from public.space_member where space_id=target and space_active)<2 then raise exception 'NOT_FOUND'; end if;
  owned := public.owned_session(actor,target,session);
  select * into c from public.milestone_celebration where id=celebration and space_id=target and status='active' for update;
  if not found or c.milestone_date < (public.app_now() at time zone coalesce((select v.room_theme_document->>'timeZone'
      from public.room_theme t join public.room_theme_version v on v.id=t.current_version_id where t.space_id=target),s.time_zone))::date - 6
      or c.preset_applied_version_id is not null then raise exception 'MILESTONE_PASSED'; end if;
  current := public.current_room(target);
  if current.id is null then raise exception 'NOT_FOUND'; end if;
  return jsonb_build_object('celebrationId',c.id,'key',c.milestone_key,'kind',c.kind,'days',c.milestone_days,'anniversaryN',c.anniversary_n,
    'baseVersion',current.version_number,'sceneDocument',current.scene_document,'roomPresentation',current.room_presentation,'roomThemeDocument',current.room_theme_document,
    'activeAssetIds',public.active_asset_ids());
end $$;

create function public.store_milestone_preset(actor uuid, target uuid, session uuid, celebration uuid, base_version integer, candidate jsonb, placed integer, requested integer) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare current public.room_theme_version%rowtype; c public.milestone_celebration%rowtype; request public.decoration_request%rowtype;
begin
  perform public.lock_space_session(actor,target);
  perform public.owned_session(actor,target,session);
  select * into c from public.milestone_celebration where id=celebration and space_id=target and status='active' for update;
  if not found or c.preset_applied_version_id is not null then raise exception 'MILESTONE_PASSED'; end if;
  current := public.current_room(target);
  if current.version_number <> base_version then raise exception 'VERSION_CONFLICT'; end if;
  if placed < 1 then raise exception 'ROOM_FULL'; end if;
  insert into public.decoration_request(space_id,session_id,requested_by_user_id,base_version_id,base_version_number,source,state,result_candidate,
    expires_at)
    values(target,session,actor,current.id,current.version_number,'milestone_preset','previewed',candidate || jsonb_build_object('milestoneCelebrationId',c.id,'milestoneKey',c.milestone_key,'placed',placed,'requested',requested),
      public.app_now()+make_interval(secs=>public.setting_int('preview_ttl_seconds',1800))) returning * into request;
  insert into public.prompt_message(space_id,session_id,decoration_request_id,author_user_id,kind)
    values(target,session,request.id,actor,'preview');
  insert into public.space_lifecycle_event(space_id,event_type,actor_user_id,metadata)
    values(target,'milestone_preset_previewed',actor,jsonb_build_object('milestone_key',c.milestone_key));
  perform public.notify_space(target,'preview',jsonb_build_object('previewId',request.id,'status','previewed'));
  return public.preview_json(request) || jsonb_build_object('placed',placed,'requested',requested);
end $$;
revoke all on function public.begin_milestone_preset(uuid,uuid,uuid,uuid),public.store_milestone_preset(uuid,uuid,uuid,uuid,integer,jsonb,integer,integer) from public,anon,authenticated;
grant execute on function public.begin_milestone_preset(uuid,uuid,uuid,uuid),public.store_milestone_preset(uuid,uuid,uuid,uuid,integer,jsonb,integer,integer) to service_role;

create or replace function public.preview_json(r public.decoration_request) returns jsonb language sql stable set search_path = '' as $$
  select case when r.id is null then null else jsonb_build_object('previewId',r.id,'baseVersion',r.base_version_number,
    'sceneDocument',r.result_candidate->'sceneDocument','roomPresentation',r.result_candidate->'roomPresentation',
    'roomThemeDocument',r.result_candidate->'roomThemeDocument','generatedObjects','[]'::jsonb,'expiresAt',r.expires_at,
    'validation',jsonb_build_object('status','passed','warnings','[]'::jsonb)) ||
    case when r.source='milestone_preset' then jsonb_build_object('placed',(r.result_candidate->>'placed')::integer,'requested',(r.result_candidate->>'requested')::integer)
      else '{}'::jsonb end end;
$$;
