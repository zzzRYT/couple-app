-- rollback: Drop the idempotency_* and mark_decoration_stage functions, drop the two added columns, and re-create cancel_preview, sweep_prompt_data and prompt_conversation from their earlier migrations; pending idempotency rows are transient and can be deleted.
-- Generation holes: cancelling during generation returns the quota slot, idempotency keys are claimed atomically before the work starts,
-- and the model stages (generating, repairing) are stored and announced so both screens can show them.

alter table public.idempotency_key add column state text not null default 'done' check (state in ('pending','done'));
alter table public.decoration_request add column generation_stage text check (generation_stage in ('generating','repairing'));

-- Claims a key before any work runs: 'claimed' (this caller runs it), 'done' (replay the stored response) or 'pending' (another call is
-- running it right now). A pending row older than the stale window belongs to a crashed worker and is claimed again.
create function public.idempotency_claim(p_user uuid, p_endpoint text, p_key uuid, stale_seconds integer default 150) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare existing public.idempotency_key%rowtype;
begin
  insert into public.idempotency_key (user_id, key, endpoint, response, state, created_at)
    values (p_user, p_key, p_endpoint, '{}'::jsonb, 'pending', public.app_now()) on conflict (user_id, key, endpoint) do nothing;
  if found then return jsonb_build_object('status', 'claimed'); end if;
  select * into existing from public.idempotency_key where user_id=p_user and key=p_key and endpoint=p_endpoint for update;
  if not found then return public.idempotency_claim(p_user, p_endpoint, p_key, stale_seconds); end if;
  if existing.state = 'done' then return jsonb_build_object('status', 'done', 'response', existing.response); end if;
  if existing.created_at <= public.app_now() - make_interval(secs => stale_seconds) then
    update public.idempotency_key set created_at=public.app_now() where user_id=p_user and key=p_key and endpoint=p_endpoint;
    return jsonb_build_object('status', 'claimed');
  end if;
  return jsonb_build_object('status', 'pending');
end $$;
create function public.idempotency_complete(p_user uuid, p_endpoint text, p_key uuid, p_response jsonb) returns void
language sql security definer set search_path = '' as $$
  update public.idempotency_key set response=coalesce(p_response, 'null'::jsonb), state='done' where user_id=p_user and key=p_key and endpoint=p_endpoint;
$$;
-- A failed call stores nothing: dropping its pending row lets the same key run again.
create function public.idempotency_release(p_user uuid, p_endpoint text, p_key uuid) returns void
language sql security definer set search_path = '' as $$
  delete from public.idempotency_key where user_id=p_user and key=p_key and endpoint=p_endpoint and state='pending';
$$;

-- Returns false when the request is no longer queued (cancelled, failed), so the caller can skip the model call.
create function public.mark_decoration_stage(request uuid, stage text) returns boolean
language plpgsql security definer set search_path = '' as $$
declare r public.decoration_request%rowtype;
begin
  if stage not in ('generating','repairing') then raise exception 'INVALID_REQUEST'; end if;
  update public.decoration_request set generation_stage=stage where id=request and state='queued' returning * into r;
  if not found then return false; end if;
  perform public.notify_space(r.space_id, 'message', jsonb_build_object('previewId', r.id, 'status', stage));
  return true;
end $$;

-- Cancelling while a request is still being generated cancels that request and gives its quota slot back.
create or replace function public.cancel_preview(actor uuid, target uuid, preview uuid, session uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare cancelled uuid;
begin
  perform public.lock_space_session(actor, target);
  if not exists (select 1 from public.decoration_request where id=preview and space_id=target) then raise exception 'NOT_FOUND'; end if;
  perform public.owned_session(actor, target, session);
  for cancelled in update public.decoration_request set state='cancelled' where session_id=session and state in ('previewed','queued') returning id loop
    update public.daily_request_reservation set status='released' where request_id=cancelled and status='reserved';
  end loop;
  update public.prompt_session set status='released', released_at=public.app_now(), release_reason='cancel' where id=session;
  perform public.notify_space(target, 'session', jsonb_build_object('sessionId', session, 'status', 'released'));
end $$;

-- Same sweep as before, plus reservations still marked reserved for requests that ended without a result.
create or replace function public.sweep_prompt_data(at timestamptz) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare expired integer; stranded integer; orphaned integer; unapplied integer; applied integer;
begin
  update public.decoration_request set state='expired' where state='previewed' and expires_at <= at;
  get diagnostics expired = row_count;
  with stuck as (update public.decoration_request set state='failed', failure_code='GENERATION_FAILED'
      where state='queued' and created_at <= at - interval '10 minutes' returning id)
    update public.daily_request_reservation set status='released' where request_id in (select id from stuck) and status='reserved';
  get diagnostics stranded = row_count;
  update public.daily_request_reservation r set status='released' from public.decoration_request d
    where d.id=r.request_id and r.status='reserved' and d.state in ('cancelled','failed','rejected');
  get diagnostics orphaned = row_count;
  delete from public.prompt_message m where m.created_at <= at - interval '24 hours'
    and not exists (select 1 from public.decoration_request d where d.id=m.decoration_request_id and d.state='applied');
  delete from public.decoration_request d where d.state <> 'applied' and d.created_at <= at - interval '24 hours';
  get diagnostics unapplied = row_count;
  delete from public.prompt_message m where m.created_at <= at - interval '30 days';
  update public.decoration_request set prompt_text=null where state='applied' and prompt_text is not null and created_at <= at - interval '30 days';
  get diagnostics applied = row_count;
  return jsonb_build_object('expired', expired, 'released', stranded, 'releasedAfterCancel', orphaned, 'deletedUnapplied', unapplied, 'clearedApplied', applied);
end $$;

-- Messages carry the model stage of a request that is still being generated.
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
      'previewId', m.decoration_request_id, 'state', d.state, 'failureCode', d.failure_code,
      'stage', case when d.state='queued' then d.generation_stage end, 'createdAt', m.created_at) order by m.created_at, m.id)
      from public.prompt_message m left join public.decoration_request d on d.id=m.decoration_request_id where m.space_id=target), '[]'::jsonb),
    'session', public.session_json(s), 'currentPreview', public.preview_json(preview), 'serverTime', public.app_now());
end $$;

revoke all on function public.idempotency_claim(uuid,text,uuid,integer), public.idempotency_complete(uuid,text,uuid,jsonb),
  public.idempotency_release(uuid,text,uuid), public.mark_decoration_stage(uuid,text) from public, anon, authenticated;
grant execute on function public.idempotency_claim(uuid,text,uuid,integer), public.idempotency_complete(uuid,text,uuid,jsonb),
  public.idempotency_release(uuid,text,uuid), public.mark_decoration_stage(uuid,text) to service_role;
