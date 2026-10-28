-- deletion-policy: end_space is a soft delete; purge_space (called by lifecycle-sweep after the Storage objects are removed) deletes every row of an ended space once purge_after has passed. Reports are deleted with their space. Dropping these objects deletes no data, but ended spaces would then never be purged.
insert into public.app_settings (key, value) values ('purge_after_days', '30'), ('report_daily_limit', '10') on conflict (key) do nothing;

-- Deletion events must outlive the space they describe; they carry ids and times only.
alter table public.space_lifecycle_event drop constraint space_lifecycle_event_space_id_fkey;

create table public.report (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.couple_space(id) on delete cascade,
  reporter_user_id uuid not null references auth.users(id) on delete cascade,
  target text not null check (target in ('partner','shared_text','room_scene')),
  reason text not null check (reason in ('harass','inappropriate','privacy','other')),
  detail text check (detail is null or char_length(detail) <= 200),
  message_id uuid,
  created_at timestamptz not null default public.app_now(),
  status text not null default 'received' check (status in ('received','reviewed'))
);
create index report_reporter_recent on public.report (reporter_user_id, created_at);
alter table public.report enable row level security;
-- Reporters read only their own reports, and only while the space is active; nothing about review is sent to the app.
create policy report_read on public.report for select to authenticated
  using (reporter_user_id = auth.uid() and public.is_space_member(space_id));

-- Soft delete shared by "end space", "disconnect" and account deletion: one transaction closes access for both members.
create function public.end_space(actor uuid, target uuid, reason text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare space public.couple_space%rowtype; member_id uuid; released uuid;
begin
  if reason is null or reason not in ('ended','disconnect','account_deletion') then raise exception 'INVALID_REQUEST'; end if;
  perform public.require_member(actor, target);
  select * into space from public.couple_space where id=target for update;
  if space.status <> 'active' then raise exception 'NOT_FOUND'; end if;
  update public.couple_space set status='ended', ended_at=public.app_now(),
    purge_after=public.app_now() + make_interval(days => public.setting_int('purge_after_days', 30)),
    ended_reason=reason, ended_by_user_id=actor, updated_at=public.app_now() where id=target;
  for member_id in select user_id from public.space_member where space_id=target and space_active loop
    -- The member who deletes their own account is signed out, so only the partner gets a notice.
    if reason <> 'account_deletion' or member_id <> actor then
      insert into public.space_end_notice (user_id, space_id, kind, by_user_id)
        values (member_id, target, case reason when 'ended' then 'ended' when 'disconnect' then 'disconnect' else 'account_deleted' end, actor);
    end if;
  end loop;
  update public.space_member set space_active=false where space_id=target and space_active;
  for released in update public.prompt_session set status='released', released_at=public.app_now(), release_reason='space_ended'
      where space_id=target and status='occupied' returning id loop
    perform public.notify_space(target, 'session', jsonb_build_object('sessionId', released, 'status', 'released'));
  end loop;
  update public.invitation set status='revoked', revoked_at=public.app_now() where space_id=target and status='active';
  insert into public.space_lifecycle_event (space_id, event_type, actor_user_id)
    values (target, case reason when 'disconnect' then 'disconnected' else 'ended' end, actor);
  perform public.notify_space(target, 'member', jsonb_build_object('kind', 'ended'));
  return jsonb_build_object('status', 'ended');
end $$;

create function public.submit_report(actor uuid, target uuid, report_target text, report_reason text, report_detail text, report_message uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare created uuid; recent integer;
begin
  perform public.require_member(actor, target);
  if report_target is null or report_target not in ('partner','shared_text','room_scene')
    or report_reason is null or report_reason not in ('harass','inappropriate','privacy','other')
    or (report_detail is not null and char_length(report_detail) > 200)
    or (report_message is not null and report_target <> 'shared_text') then raise exception 'INVALID_REQUEST'; end if;
  if report_message is not null and not exists (select 1 from public.prompt_message where id=report_message and space_id=target) then raise exception 'NOT_FOUND'; end if;
  -- Serialize per reporter so parallel submissions cannot slip past the daily limit.
  perform pg_advisory_xact_lock(hashtextextended('report:' || actor::text, 0));
  select count(*) into recent from public.report where reporter_user_id=actor and created_at > public.app_now() - interval '24 hours';
  if recent >= public.setting_int('report_daily_limit', 10) then raise exception 'REPORT_RATE_LIMITED'; end if;
  insert into public.report (space_id, reporter_user_id, target, reason, detail, message_id)
    values (target, actor, report_target, report_reason, nullif(btrim(report_detail), ''), report_message) returning id into created;
  return jsonb_build_object('reportId', created, 'hiddenForReporter', false);
end $$;

-- Ended spaces whose retention has run out, oldest first. The caller removes Storage objects, then calls purge_space per space.
create function public.due_purge_spaces(at timestamptz, max_count integer default 50) returns jsonb
language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(id), '[]'::jsonb) from (
    select id from public.couple_space where status='ended' and purge_after is not null and purge_after <= at order by purge_after, id limit max_count) due;
$$;

create function public.mark_purge_started(target uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if exists (select 1 from public.couple_space where id=target and status='ended')
    and not exists (select 1 from public.space_lifecycle_event where space_id=target and event_type='deletion_started') then
    insert into public.space_lifecycle_event (space_id, event_type) values (target, 'deletion_started');
  end if;
end $$;

-- One transaction per space: either every row goes (cascading from the space) or none does. Returns false when the space is not due.
create function public.purge_space(target uuid, at timestamptz) returns boolean
language plpgsql security definer set search_path = '' as $$
declare space public.couple_space%rowtype;
begin
  select * into space from public.couple_space where id=target for update;
  if not found or space.status <> 'ended' or space.purge_after is null or space.purge_after > at then return false; end if;
  -- Keep only content-free fingerprints of the lifecycle: no actor, no metadata.
  update public.space_lifecycle_event set actor_user_id=null, metadata='{}'::jsonb where space_id=target;
  insert into public.space_lifecycle_event (space_id, event_type) values (target, 'deletion_completed');
  -- Confirmed room versions are immutable except for this purge (see forbid_version_change); the flag lasts for this transaction only.
  perform set_config('app.purging', 'on', true);
  delete from public.couple_space where id=target;
  perform set_config('app.purging', 'off', true);
  return true;
end $$;

revoke all on function public.end_space(uuid,uuid,text), public.submit_report(uuid,uuid,text,text,text,uuid),
  public.due_purge_spaces(timestamptz,integer), public.mark_purge_started(uuid), public.purge_space(uuid,timestamptz) from public, anon, authenticated;
grant execute on function public.end_space(uuid,uuid,text), public.submit_report(uuid,uuid,text,text,text,uuid),
  public.due_purge_spaces(timestamptz,integer), public.mark_purge_started(uuid), public.purge_space(uuid,timestamptz) to service_role;
