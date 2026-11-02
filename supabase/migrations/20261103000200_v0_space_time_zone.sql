-- rollback: restore milestone functions and update_anniversary from 20261102000700 before dropping columns.
alter table public.couple_space add column anniversary_changed_by uuid references auth.users(id) on delete set null, add column anniversary_changed_at timestamptz;

create or replace function public.milestone_context(actor uuid, target uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare s public.couple_space%rowtype; members integer; tz text; room jsonb;
begin
  perform public.require_member(actor,target);
  select * into s from public.couple_space where id=target and status='active';
  if not found then raise exception 'NOT_FOUND'; end if;
  select count(*) into members from public.space_member where space_id=target and space_active;
  if members < 2 then return jsonb_build_object('eligible',false); end if;
  tz := s.time_zone;
  return jsonb_build_object('eligible',true,'anniversaryDate',s.anniversary_date,'timeZone',tz,
    'serverTime',public.app_now(),'today',(public.app_now() at time zone tz)::date);
end $$;

create or replace function public.record_milestones(actor uuid, target uuid, items jsonb, expected_anniversary date, expected_timezone text, expected_today date) returns void
language plpgsql security definer set search_path = '' as $$
declare item jsonb; s public.couple_space%rowtype; tz text;
begin
  perform public.require_member(actor,target);
  select * into s from public.couple_space where id=target and status='active' for update;
  if not found or (select count(*) from public.space_member where space_id=target and space_active)<2 then return; end if;
  tz := s.time_zone;
  if s.anniversary_date is distinct from expected_anniversary or tz is distinct from expected_timezone or
      (public.app_now() at time zone tz)::date is distinct from expected_today then raise exception 'VERSION_CONFLICT'; end if;
  for item in select value from jsonb_array_elements(items) loop
    insert into public.milestone_celebration(space_id,milestone_key,kind,milestone_days,anniversary_n,milestone_date,priority,status)
      values(target,item->>'key',item->>'kind',nullif(item->>'days','null')::integer,nullif(item->>'anniversaryN','null')::integer,
        (item->>'milestoneDate')::date,case when item->>'kind'='anniversary' then 2 else 1 end,item->>'status')
      on conflict(space_id,milestone_key) do update set status=excluded.status,milestone_date=excluded.milestone_date;
  end loop;
end $$;

create or replace function public.mark_milestone_seen(actor uuid, target uuid, celebration uuid, via text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform public.require_member(actor,target);
  if via not in ('home','room') then raise exception 'INVALID_REQUEST'; end if;
  if not public.is_space_active(target) then raise exception 'NOT_FOUND'; end if;
  insert into public.milestone_seen(celebration_id,member_user_id,via)
    select c.id,actor,via from public.milestone_celebration c where c.id=celebration and c.space_id=target
      and c.status='active' and c.milestone_date <= (public.app_now() at time zone (select time_zone from public.couple_space where id=target))::date
      and c.milestone_date >= (public.app_now() at time zone (select time_zone from public.couple_space where id=target))::date - 6
    on conflict(celebration_id,member_user_id) do nothing;
end $$;

create or replace function public.update_anniversary(actor uuid, target uuid, anniversary date, expected timestamptz) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare s public.couple_space%rowtype; today date; reset_keys jsonb; tz text;
begin
  perform public.require_member(actor,target);
  select * into s from public.couple_space where id=target for update;
  today := (public.app_now() at time zone s.time_zone)::date;
  if anniversary is null or anniversary > today then raise exception 'INVALID_REQUEST'; end if;
  if expected is null or date_trunc('milliseconds',s.updated_at) <> date_trunc('milliseconds',expected) then raise exception 'VERSION_CONFLICT'; end if;
  select coalesce(jsonb_agg(c.milestone_key order by c.milestone_key),'[]'::jsonb) into reset_keys
  from public.milestone_celebration c where c.space_id=target and
    case when c.kind='day' then anniversary + (c.milestone_days-1)
      else make_date(extract(year from anniversary)::integer+c.anniversary_n,extract(month from anniversary)::integer,
        least(extract(day from anniversary)::integer,extract(day from (make_date(extract(year from anniversary)::integer+c.anniversary_n,extract(month from anniversary)::integer,1)+interval '1 month - 1 day'))::integer)) end > today;
  delete from public.milestone_celebration c where c.space_id=target and c.milestone_key in (select jsonb_array_elements_text(reset_keys));
  update public.couple_space set anniversary_date=anniversary,anniversary_changed_by=actor,anniversary_changed_at=public.app_now(),updated_at=public.app_now() where id=target returning * into s;
  perform public.notify_space(target,'member',jsonb_build_object('kind','anniversary'));
  return jsonb_build_object('anniversaryDate',s.anniversary_date,'updatedAt',s.updated_at,'milestonesReset',reset_keys);
end $$;

create function public.update_space_time_zone(actor uuid, target uuid, tz text, expected timestamptz) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare s public.couple_space%rowtype;
begin
  perform public.require_member(actor,target);
  if tz is null or not exists(select 1 from pg_catalog.pg_timezone_names where name=tz) then raise exception 'INVALID_REQUEST'; end if;
  select * into s from public.couple_space where id=target and status='active' for update;
  if not found then raise exception 'NOT_FOUND'; end if;
  if expected is null or date_trunc('milliseconds',s.updated_at) <> date_trunc('milliseconds',expected) then raise exception 'VERSION_CONFLICT'; end if;
  update public.couple_space set time_zone=tz,updated_at=public.app_now() where id=target returning * into s;
  perform public.notify_space(target,'member',jsonb_build_object('kind','timezone'));
  return jsonb_build_object('timeZone',s.time_zone,'updatedAt',s.updated_at);
end $$;
revoke all on function public.update_space_time_zone(uuid,uuid,text,timestamptz) from public,anon,authenticated;
grant execute on function public.update_space_time_zone(uuid,uuid,text,timestamptz) to service_role;
