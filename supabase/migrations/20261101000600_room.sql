-- rollback: Restore a verified backup before dropping these tables; room versions are the shared room history and cannot be rebuilt.
insert into public.app_settings (key, value) values ('preview_ttl_seconds', '1800'), ('prompt_max_chars', '500'), ('room_max_objects', '16')
  on conflict (key) do nothing;
create table public.asset_catalog_entry (
  asset_id text primary key, catalog_version integer not null,
  asset_kind text not null check (asset_kind in ('room_object','mascot_pose')),
  uri text not null, format text not null, width_px integer not null, height_px integer not null, byte_size integer not null,
  sha256 text not null, license_kind text not null, license_text_version text, creator text, rights_record_ref text not null,
  status text not null check (status in ('active','retired'))
);
create table public.room_theme (
  space_id uuid primary key references public.couple_space(id) on delete cascade,
  current_version_id uuid, version_counter integer not null default 0,
  updated_at timestamptz not null default public.app_now(), updated_by_user_id uuid references auth.users(id) on delete set null
);
create table public.room_theme_version (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.couple_space(id) on delete cascade,
  version_number integer not null, schema_version integer not null default 1,
  scene_document jsonb not null, room_presentation jsonb not null, room_theme_document jsonb not null,
  source text not null check (source in ('initial','prompt','manual_migration','mascot_recall','milestone_preset','room_mode')),
  provenance jsonb not null default '{}'::jsonb, content_hash text not null,
  created_at timestamptz not null default public.app_now(),
  unique (space_id, version_number)
);
alter table public.room_theme add constraint room_theme_current_fk foreign key (current_version_id) references public.room_theme_version(id) deferrable initially deferred;
create table public.decoration_request (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.couple_space(id) on delete cascade,
  session_id uuid references public.prompt_session(id) on delete set null,
  requested_by_user_id uuid references auth.users(id) on delete set null,
  base_version_id uuid references public.room_theme_version(id) on delete set null, base_version_number integer not null,
  prompt_text text, source text not null default 'ai' check (source in ('ai','milestone_preset')),
  state text not null default 'queued' check (state in ('queued','generated','rejected','previewed','reverted','applied','cancelled','expired','failed')),
  result_candidate jsonb, failure_code text, repair_count integer not null default 0 check (repair_count between 0 and 1),
  created_at timestamptz not null default public.app_now(), expires_at timestamptz,
  applied_version_id uuid references public.room_theme_version(id) on delete set null
);
create index decoration_request_session on public.decoration_request (session_id, created_at);
alter table public.prompt_message add constraint prompt_message_request_fk foreign key (decoration_request_id) references public.decoration_request(id) on delete cascade;
create table public.ai_consent_event (
  id bigint generated always as identity primary key,
  space_id uuid not null references public.couple_space(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  state text not null check (state in ('granted','revoked')), notice_version text not null,
  occurred_at timestamptz not null default public.app_now()
);
alter table public.asset_catalog_entry enable row level security;
alter table public.room_theme enable row level security;
alter table public.room_theme_version enable row level security;
alter table public.decoration_request enable row level security;
alter table public.ai_consent_event enable row level security;
create policy catalog_read on public.asset_catalog_entry for select to authenticated using (true);
create policy room_read on public.room_theme for select to authenticated using (public.is_space_member(space_id));
create policy room_version_read on public.room_theme_version for select to authenticated using (public.is_space_member(space_id));
create policy request_read on public.decoration_request for select to authenticated using (public.is_space_member(space_id));

-- Confirmed versions are immutable; only the space purge may delete them.
create function public.forbid_version_change() returns trigger language plpgsql set search_path = '' as $$
begin
  if tg_op = 'DELETE' and current_setting('app.purging', true) = 'on' then return old; end if;
  raise exception 'IMMUTABLE_VERSION';
end $$;
create trigger room_theme_version_immutable before update or delete on public.room_theme_version
  for each row execute function public.forbid_version_change();

create function public.default_mascot() returns jsonb language sql immutable set search_path = '' as $$
  select '{"assetId":"app_mascot","x":0.5,"y":0.72,"width":0.2,"height":0.2,"rotationDeg":0,"zIndex":1,"opacity":1}'::jsonb;
$$;
create function public.append_room_version(actor uuid, target uuid, scene jsonb, presentation jsonb, theme jsonb, src text, prov jsonb)
returns public.room_theme_version language plpgsql security definer set search_path = '' as $$
declare created public.room_theme_version%rowtype; next_number integer;
begin
  update public.room_theme set version_counter=version_counter+1, updated_at=public.app_now(), updated_by_user_id=actor
    where space_id=target returning version_counter into next_number;
  if next_number is null then
    insert into public.room_theme (space_id, version_counter, updated_by_user_id) values (target, 1, actor);
    next_number := 1;
  end if;
  insert into public.room_theme_version (space_id, version_number, scene_document, room_presentation, room_theme_document, source, provenance, content_hash)
    values (target, next_number, scene, presentation, theme, src, prov || jsonb_build_object('created_by_user_id', actor, 'created_at', public.app_now()),
      encode(extensions.digest(convert_to(scene::text || presentation::text || theme::text, 'UTF8'), 'sha256'), 'hex'))
    returning * into created;
  update public.room_theme set current_version_id=created.id where space_id=target;
  perform public.notify_space(target, 'room_version', jsonb_build_object('versionId', created.id, 'versionNumber', next_number, 'kind', src, 'changedBy', actor, 'at', public.app_now()));
  return created;
end $$;
create function public.ensure_initial_room(target uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare space public.couple_space%rowtype;
begin
  select * into space from public.couple_space where id=target;
  if not found or exists (select 1 from public.room_theme where space_id=target) then return; end if;
  perform public.append_room_version(null, target,
    jsonb_build_object('schemaVersion', 1, 'canvasProfile', 'room-portrait-v1', 'objects', jsonb_build_array(public.default_mascot()), 'texts', '[]'::jsonb),
    '{"schemaVersion":1,"visible":true,"x":0.5,"y":0.17,"width":0.84,"height":0.14,"styleToken":"day.default","textScale":1}'::jsonb,
    jsonb_build_object('schemaVersion', 1, 'mode', 'follow_time', 'timeZone', space.time_zone,
      'day', '{"backgroundToken":"room.day","paletteToken":"room.day","assetVariants":[]}'::jsonb,
      'night', '{"backgroundToken":"room.night","paletteToken":"room.night","assetVariants":[]}'::jsonb),
    'initial', '{}'::jsonb);
end $$;
create function public.current_room(target uuid) returns public.room_theme_version
language sql stable security definer set search_path = '' as $$
  select v.* from public.room_theme t join public.room_theme_version v on v.id=t.current_version_id where t.space_id=target;
$$;
create function public.active_asset_ids() returns text[] language sql stable security definer set search_path = '' as $$
  select coalesce(array_agg(asset_id order by asset_id), '{}') from public.asset_catalog_entry where status='active' and asset_kind='room_object';
$$;
create function public.both_consented(target uuid) returns boolean language sql stable security definer set search_path = '' as $$
  select count(*) = 2 and bool_and(ai_consent_state='granted') from public.space_member where space_id=target and space_active;
$$;
create function public.preview_json(r public.decoration_request) returns jsonb language sql stable set search_path = '' as $$
  select case when r.id is null then null else jsonb_build_object('previewId', r.id, 'baseVersion', r.base_version_number,
    'sceneDocument', r.result_candidate->'sceneDocument', 'roomPresentation', r.result_candidate->'roomPresentation',
    'roomThemeDocument', r.result_candidate->'roomThemeDocument', 'generatedObjects', '[]'::jsonb, 'expiresAt', r.expires_at,
    'validation', jsonb_build_object('status', 'passed', 'warnings', '[]'::jsonb)) end;
$$;

-- Step 1 of a preview: every check that must pass before the model is called, plus the quota reservation.
create function public.begin_decoration(actor uuid, target uuid, session uuid, base_version integer, prompt text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare current public.room_theme_version%rowtype; request public.decoration_request%rowtype;
begin
  perform public.lock_space_session(actor, target);
  if not public.both_consented(target) then raise exception 'CONSENT_REQUIRED'; end if;
  perform public.owned_session(actor, target, session);
  current := public.current_room(target);
  if current.id is null or current.version_number <> base_version then raise exception 'VERSION_CONFLICT'; end if;
  if prompt is null or length(btrim(prompt)) = 0 or length(prompt) > public.setting_int('prompt_max_chars', 500) then raise exception 'INVALID_REQUEST'; end if;
  insert into public.decoration_request (space_id, session_id, requested_by_user_id, base_version_id, base_version_number, prompt_text)
    values (target, session, actor, current.id, current.version_number, prompt) returning * into request;
  perform public.reserve_daily_request(target, request.id, 3);
  insert into public.prompt_message (space_id, session_id, decoration_request_id, author_user_id, kind, body_text)
    values (target, session, request.id, actor, 'user_prompt', prompt);
  update public.prompt_session set last_activity_at=public.app_now(),
    expires_at=public.app_now() + make_interval(secs => public.setting_int('session_idle_seconds', 180)) where id=session;
  perform public.notify_space(target, 'message', jsonb_build_object('previewId', request.id, 'status', 'queued'));
  return jsonb_build_object('requestId', request.id, 'sceneDocument', current.scene_document,
    'roomPresentation', current.room_presentation, 'roomThemeDocument', current.room_theme_document);
end $$;
-- Rejections and failures release the reservation and never touch the shared room.
create function public.fail_decoration(request uuid, code text, rejected boolean, repairs integer) returns void
language plpgsql security definer set search_path = '' as $$
declare r public.decoration_request%rowtype;
begin
  -- Lock order everywhere: space row, then the quota advisory lock.
  perform 1 from public.couple_space s join public.decoration_request d on d.space_id=s.id where d.id=request for update of s;
  update public.decoration_request set state=case when rejected then 'rejected' else 'failed' end, failure_code=code, repair_count=least(repairs, 1)
    where id=request and state='queued' returning * into r;
  if not found then return; end if;
  perform public.finalize_daily_request(request, false);
  insert into public.prompt_message (space_id, session_id, decoration_request_id, kind) values (r.space_id, r.session_id, r.id, 'status');
  perform public.notify_space(r.space_id, 'message', jsonb_build_object('previewId', r.id, 'status', r.state));
end $$;
create function public.store_preview(request uuid, candidate jsonb, repairs integer, prov jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare r public.decoration_request%rowtype;
begin
  perform 1 from public.couple_space s join public.decoration_request d on d.space_id=s.id where d.id=request for update of s;
  update public.decoration_request set state='previewed', result_candidate=candidate, repair_count=least(repairs, 1),
    expires_at=public.app_now() + make_interval(secs => public.setting_int('preview_ttl_seconds', 1800)),
    failure_code=null where id=request and state='queued' returning * into r;
  if not found then raise exception 'PREVIEW_CHANGED'; end if;
  perform public.finalize_daily_request(request, true);
  update public.decoration_request set result_candidate = result_candidate || jsonb_build_object('provenance', prov) where id=request;
  insert into public.prompt_message (space_id, session_id, decoration_request_id, author_user_id, kind) values (r.space_id, r.session_id, r.id, r.requested_by_user_id, 'preview');
  perform public.notify_space(r.space_id, 'preview', jsonb_build_object('previewId', r.id, 'status', 'previewed'));
  return public.preview_json(r);
end $$;
create function public.confirm_preview(actor uuid, target uuid, preview uuid, session uuid, base_version integer) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare r public.decoration_request%rowtype; current public.room_theme_version%rowtype; created public.room_theme_version%rowtype;
begin
  perform public.lock_space_session(actor, target);
  select * into r from public.decoration_request where id=preview and space_id=target for update;
  if not found then raise exception 'NOT_FOUND'; end if;
  if r.state='applied' then raise exception 'ALREADY_APPLIED'; end if;
  perform public.owned_session(actor, target, session);
  if r.session_id is distinct from session or r.state<>'previewed' then raise exception 'PREVIEW_CHANGED'; end if;
  if r.expires_at <= public.app_now() then
    update public.decoration_request set state='expired' where id=preview;
    raise exception 'PREVIEW_CHANGED';
  end if;
  current := public.current_room(target);
  if current.version_number <> base_version or r.base_version_number <> base_version then raise exception 'VERSION_CONFLICT'; end if;
  created := public.append_room_version(actor, target, r.result_candidate->'sceneDocument', r.result_candidate->'roomPresentation',
    r.result_candidate->'roomThemeDocument', 'prompt', coalesce(r.result_candidate->'provenance', '{}'::jsonb) || jsonb_build_object('request_id', r.id));
  update public.decoration_request set state='applied', applied_version_id=created.id where id=preview;
  update public.decoration_request set state='cancelled' where session_id=session and state='previewed';
  update public.prompt_session set status='released', released_at=public.app_now(), release_reason='confirm' where id=session;
  perform public.notify_space(target, 'session', jsonb_build_object('sessionId', session, 'status', 'released'));
  return jsonb_build_object('appliedVersion', created.version_number, 'source', 'prompt', 'updatedAt', created.created_at);
end $$;
create function public.cancel_preview(actor uuid, target uuid, preview uuid, session uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform public.lock_space_session(actor, target);
  if not exists (select 1 from public.decoration_request where id=preview and space_id=target) then raise exception 'NOT_FOUND'; end if;
  perform public.owned_session(actor, target, session);
  update public.decoration_request set state='cancelled' where session_id=session and state in ('previewed','queued');
  update public.prompt_session set status='released', released_at=public.app_now(), release_reason='cancel' where id=session;
  perform public.notify_space(target, 'session', jsonb_build_object('sessionId', session, 'status', 'released'));
end $$;
create function public.undo_preview(actor uuid, target uuid, session uuid, expected uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare latest public.decoration_request%rowtype; previous uuid;
begin
  perform public.lock_space_session(actor, target);
  if exists (select 1 from public.decoration_request where id=expected and space_id=target and state='applied') then raise exception 'ALREADY_APPLIED'; end if;
  perform public.owned_session(actor, target, session);
  select * into latest from public.decoration_request where session_id=session and state='previewed' order by created_at desc, id desc limit 1 for update;
  if not found then raise exception 'NOTHING_TO_UNDO'; end if;
  if latest.id is distinct from expected then raise exception 'PREVIEW_CHANGED'; end if;
  update public.decoration_request set state='reverted' where id=latest.id;
  select id into previous from public.decoration_request where session_id=session and state='previewed' order by created_at desc, id desc limit 1;
  insert into public.prompt_message (space_id, session_id, decoration_request_id, author_user_id, kind) values (target, session, latest.id, actor, 'status');
  perform public.notify_space(target, 'preview', jsonb_build_object('previewId', previous, 'status', 'reverted'));
  return jsonb_build_object('previewId', previous);
end $$;
create function public.mascot_recall(actor uuid, target uuid, expected_version integer) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare current public.room_theme_version%rowtype; created public.room_theme_version%rowtype; occupied public.prompt_session%rowtype;
begin
  perform public.lock_space_session(actor, target);
  select * into occupied from public.prompt_session where space_id=target and status='occupied';
  if found then raise exception '%', public.occupied_error(occupied); end if;
  current := public.current_room(target);
  if current.version_number <> expected_version then raise exception 'VERSION_CONFLICT'; end if;
  if exists (select 1 from jsonb_array_elements(current.scene_document->'objects') o where o->>'assetId'='app_mascot') then
    return jsonb_build_object('versionNumber', current.version_number, 'source', current.source, 'recalled', false);
  end if;
  if jsonb_array_length(current.scene_document->'objects') >= public.setting_int('room_max_objects', 16) then raise exception 'ROOM_FULL'; end if;
  created := public.append_room_version(actor, target,
    jsonb_set(current.scene_document, '{objects}', (current.scene_document->'objects') || jsonb_build_array(public.default_mascot())),
    current.room_presentation, current.room_theme_document, 'mascot_recall', '{}'::jsonb);
  return jsonb_build_object('versionNumber', created.version_number, 'source', 'mascot_recall', 'recalled', true);
end $$;
create function public.set_ai_consent(actor uuid, target uuid, new_state text, notice text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare r uuid;
begin
  if new_state not in ('granted','revoked') or notice is distinct from 'ai-overseas-v1' then raise exception 'INVALID_REQUEST'; end if;
  perform public.require_member(actor, target);
  update public.space_member set ai_consent_state=new_state, ai_consent_text_version=notice,
    ai_consent_at=case when new_state='granted' then public.app_now() else ai_consent_at end,
    ai_consent_revoked_at=case when new_state='revoked' then public.app_now() else null end
    where space_id=target and user_id=actor;
  insert into public.ai_consent_event (space_id, user_id, state, notice_version) values (target, actor, new_state, notice);
  if new_state='revoked' then
    for r in update public.decoration_request set state='cancelled' where space_id=target and state in ('queued','previewed') returning id loop
      update public.daily_request_reservation set status='released' where request_id=r and status='reserved';
      perform public.notify_space(target, 'preview', jsonb_build_object('previewId', r, 'status', 'cancelled'));
    end loop;
  end if;
  perform public.notify_space(target, 'member', jsonb_build_object('kind', 'consent'));
  return jsonb_build_object('state', new_state, 'bothGranted', public.both_consented(target));
end $$;

create or replace function public.prompt_conversation(actor uuid, target uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare s public.prompt_session%rowtype; preview public.decoration_request%rowtype;
begin
  perform public.lock_space_session(actor, target);
  select * into s from public.prompt_session where space_id=target order by acquired_at desc limit 1;
  if s.status='occupied' then
    select * into preview from public.decoration_request where session_id=s.id and state='previewed' order by created_at desc, id desc limit 1;
  end if;
  return jsonb_build_object(
    'messages', coalesce((select jsonb_agg(jsonb_build_object('id', m.id, 'kind', m.kind, 'authorUserId', m.author_user_id, 'bodyText', m.body_text,
      'previewId', m.decoration_request_id, 'state', d.state, 'failureCode', d.failure_code, 'createdAt', m.created_at) order by m.created_at, m.id)
      from public.prompt_message m left join public.decoration_request d on d.id=m.decoration_request_id where m.space_id=target), '[]'::jsonb),
    'session', public.session_json(s), 'currentPreview', public.preview_json(preview));
end $$;
create or replace function public.space_snapshot(actor uuid, target uuid) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare space public.couple_space%rowtype; room public.room_theme_version%rowtype; s public.prompt_session%rowtype;
begin
  select s2.* into space from public.couple_space s2 join public.space_member m on m.space_id=s2.id
    where s2.id=target and s2.status='active' and m.user_id=actor and m.space_active;
  if not found then return null; end if;
  room := public.current_room(target);
  select * into s from public.prompt_session where space_id=target and status='occupied' and expires_at > public.app_now();
  return jsonb_build_object(
    'space', jsonb_build_object('spaceId', space.id, 'status', space.status, 'anniversaryDate', space.anniversary_date,
      'timeZone', space.time_zone, 'updatedAt', space.updated_at,
      'memberCount', (select count(*) from public.space_member where space_id=target and space_active),
      'invitation', (select jsonb_build_object('status', case when i.expires_at <= public.app_now() and i.status='active' then 'expired' else i.status end, 'expiresAt', i.expires_at)
        from public.invitation i where i.space_id=target and i.status in ('active','accepted') order by i.created_at desc limit 1)),
    'members', (select jsonb_agg(jsonb_build_object('userId', user_id, 'aiConsentState', ai_consent_state) order by joined_at)
      from public.space_member where space_id=target and space_active),
    'me', jsonb_build_object('userId', actor),
    'features', jsonb_build_object('generation', false, 'generatedRender', false),
    'generatedObjects', '[]'::jsonb, 'homeCover', jsonb_build_object('status', 'none'),
    'versionNumber', room.version_number, 'sceneDocument', room.scene_document,
    'roomPresentation', room.room_presentation, 'roomThemeDocument', room.room_theme_document,
    'promptSession', public.session_json(s),
    'catalogVersion', (select max(catalog_version) from public.asset_catalog_entry),
    'serverTime', public.app_now());
end $$;

revoke all on function public.forbid_version_change(), public.default_mascot(), public.append_room_version(uuid,uuid,jsonb,jsonb,jsonb,text,jsonb),
  public.ensure_initial_room(uuid), public.current_room(uuid), public.active_asset_ids(), public.both_consented(uuid),
  public.preview_json(public.decoration_request), public.begin_decoration(uuid,uuid,uuid,integer,text), public.fail_decoration(uuid,text,boolean,integer),
  public.store_preview(uuid,jsonb,integer,jsonb), public.confirm_preview(uuid,uuid,uuid,uuid,integer), public.cancel_preview(uuid,uuid,uuid,uuid),
  public.undo_preview(uuid,uuid,uuid,uuid), public.mascot_recall(uuid,uuid,integer), public.set_ai_consent(uuid,uuid,text,text),
  public.space_snapshot(uuid,uuid) from public, anon, authenticated;
grant execute on function public.ensure_initial_room(uuid), public.active_asset_ids(), public.begin_decoration(uuid,uuid,uuid,integer,text),
  public.fail_decoration(uuid,text,boolean,integer), public.store_preview(uuid,jsonb,integer,jsonb), public.confirm_preview(uuid,uuid,uuid,uuid,integer),
  public.cancel_preview(uuid,uuid,uuid,uuid), public.undo_preview(uuid,uuid,uuid,uuid), public.mascot_recall(uuid,uuid,integer),
  public.set_ai_consent(uuid,uuid,text,text) to service_role;
