-- rollback: re-create space_event_json, create_space_event and update_space_event from 20261125000100 (dropping the p_owner versions), then drop space_event.owner_id. Owner values are lost; every event reads as 함께.
alter table public.space_event add column owner_id uuid references auth.users(id) on delete set null;

create or replace function public.space_event_json(e public.space_event) returns jsonb
language sql stable set search_path = '' as $$
  select jsonb_build_object('id',e.id,'title',e.title,'date',e.start_date,'time',to_char(e.start_time,'HH24:MI'),'endTime',to_char(e.end_time,'HH24:MI'),'alert',e.alert,
    'ownerId',e.owner_id,'createdBy',e.created_by,'createdAt',e.created_at,'updatedBy',e.updated_by,'updatedAt',e.updated_at,'version',e.version)
$$;

drop function public.create_space_event(uuid,uuid,text,date,time,time,text);
drop function public.update_space_event(uuid,uuid,uuid,integer,text,date,time,time,text);
create function public.create_space_event(actor uuid, target uuid, p_title text, p_date date, p_time time, p_end_time time, p_alert text, p_owner uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare e public.space_event%rowtype;
begin
  perform public.require_member(actor,target);
  perform 1 from public.couple_space where id=target for update;
  if p_title is null or char_length(btrim(p_title)) not between 1 and 40 or p_date is null or p_alert is null or p_alert not in ('none','at','5m','15m','30m','1h','1d') or extract(second from p_time)<>0 or extract(second from p_end_time)<>0 or (p_end_time is not null and (p_time is null or p_end_time<=p_time)) or (p_time is null and p_alert not in ('none','at','1d')) then raise exception 'INVALID_REQUEST'; end if;
  if p_owner is not null and not exists (select 1 from public.space_member where space_id=target and user_id=p_owner and space_active) then raise exception 'INVALID_REQUEST'; end if;
  if (select count(*) from public.space_event where space_id=target and deleted_at is null)>=500 then raise exception 'INVALID_REQUEST'; end if;
  insert into public.space_event(space_id,title,start_date,start_time,end_time,alert,owner_id,created_by,updated_by) values(target,btrim(p_title),p_date,p_time,p_end_time,p_alert,p_owner,actor,actor) returning * into e;
  perform public.notify_space(target,'event',jsonb_build_object('id',e.id));
  return public.space_event_json(e);
end $$;
create function public.update_space_event(actor uuid, target uuid, p_id uuid, p_expected_version integer, p_title text, p_date date, p_time time, p_end_time time, p_alert text, p_owner uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare e public.space_event%rowtype;
begin
  perform public.require_member(actor,target);
  select * into e from public.space_event where space_id=target and id=p_id for update;
  if not found then raise exception 'NOT_FOUND'; end if;
  if e.deleted_at is not null then raise exception 'NOT_FOUND:{"gone":true}'; end if;
  if p_expected_version is null or e.version<>p_expected_version then raise exception 'VERSION_CONFLICT'; end if;
  if p_title is null or char_length(btrim(p_title)) not between 1 and 40 or p_date is null or p_alert is null or p_alert not in ('none','at','5m','15m','30m','1h','1d') or extract(second from p_time)<>0 or extract(second from p_end_time)<>0 or (p_end_time is not null and (p_time is null or p_end_time<=p_time)) or (p_time is null and p_alert not in ('none','at','1d')) then raise exception 'INVALID_REQUEST'; end if;
  if p_owner is not null and not exists (select 1 from public.space_member where space_id=target and user_id=p_owner and space_active) then raise exception 'INVALID_REQUEST'; end if;
  update public.space_event set title=btrim(p_title),start_date=p_date,start_time=p_time,end_time=p_end_time,alert=p_alert,owner_id=p_owner,updated_by=actor,updated_at=public.app_now(),version=version+1 where id=p_id returning * into e;
  perform public.notify_space(target,'event',jsonb_build_object('id',e.id));
  return public.space_event_json(e);
end $$;
revoke all on function public.create_space_event(uuid,uuid,text,date,time,time,text,uuid), public.update_space_event(uuid,uuid,uuid,integer,text,date,time,time,text,uuid) from public,anon,authenticated;
grant execute on function public.create_space_event(uuid,uuid,text,date,time,time,text,uuid), public.update_space_event(uuid,uuid,uuid,integer,text,date,time,time,text,uuid) to service_role;
