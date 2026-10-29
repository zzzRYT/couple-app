begin;
select plan(15);
insert into auth.users (id,aud,role,email) values
 ('00000000-0000-0000-0000-0000000000a1','authenticated','authenticated','pl-a@example.invalid'),
 ('00000000-0000-0000-0000-0000000000a2','authenticated','authenticated','pl-b@example.invalid');
create temp table ctx (k text primary key, v uuid);
insert into ctx select 's', ((public.create_space('00000000-0000-0000-0000-0000000000a1','2025-01-01','Asia/Seoul'))->>'spaceId')::uuid;
insert into public.space_member (space_id,user_id) select v,'00000000-0000-0000-0000-0000000000a2' from ctx where k='s';
update public.space_member set ai_consent_state='granted' where space_id=(select v from ctx where k='s');
create table public.test_clock (t timestamptz not null);
insert into public.test_clock values ('2026-10-27T00:00:00Z');
create or replace function public.app_now() returns timestamptz language sql stable set search_path = '' as $$ select t from public.test_clock $$;
create function pg_temp.candidate() returns jsonb language sql as $$
  select jsonb_build_object('sceneDocument', jsonb_build_object('schemaVersion',1,'canvasProfile','room-portrait-v1','objects',jsonb_build_array(public.default_mascot(),
    '{"assetId":"obj_sky_star","x":0.2,"y":0.3,"width":0.1,"height":0.1,"rotationDeg":0,"zIndex":2,"opacity":1}'::jsonb),'texts','[]'::jsonb),
    'roomPresentation', (select room_presentation from public.current_room((select v from ctx where k='s'))),
    'roomThemeDocument', (select room_theme_document from public.current_room((select v from ctx where k='s'))));
$$;
insert into ctx select 'a', ((public.acquire_session('00000000-0000-0000-0000-0000000000a1',(select v from ctx where k='s')))->>'sessionId')::uuid;
-- B1: the losing side learns which session it lost to
select throws_like($$select public.acquire_session('00000000-0000-0000-0000-0000000000a2',(select v from ctx where k='s'))$$,
  '%"sessionId": "' || (select v::text from ctx where k='a') || '"%', 'SESSION_OCCUPIED carries the session id');
-- B2: a finished preview is activity (begin at t0, store two minutes later)
insert into ctx select 'p', ((public.begin_decoration('00000000-0000-0000-0000-0000000000a1',(select v from ctx where k='s'),(select v from ctx where k='a'),1,'stars'))->>'requestId')::uuid;
update public.test_clock set t = '2026-10-27T00:02:00Z';
select public.store_preview((select v from ctx where k='p'), pg_temp.candidate(), 0, '{}');
select is((select expires_at from public.prompt_session where id=(select v from ctx where k='a')), '2026-10-27T00:05:00Z'::timestamptz, 'store_preview extends the lease by a full idle window');
-- B3: past its time the lease reads as expired even though no RPC has marked the row yet
update public.test_clock set t = '2026-10-27T00:05:01Z';
select is((select status from public.prompt_session where id=(select v from ctx where k='a')), 'occupied', 'the row is still lazily occupied');
select is((public.space_snapshot('00000000-0000-0000-0000-0000000000a2',(select v from ctx where k='s')))->'promptSession'->>'status', 'expired', 'snapshot exposes the expired lease');
select is((public.space_snapshot('00000000-0000-0000-0000-0000000000a2',(select v from ctx where k='s')))->'promptSession'->>'sessionId', (select v::text from ctx where k='a'), 'the expired lease keeps its session id');
-- B5: active expiry marks it and announces it without any API call
select is(public.expire_stale_sessions(), 1, 'active expiry expires the stale lease');
select is(public.expire_stale_sessions(), 0, 'active expiry is idempotent');
select cmp_ok((select count(*) from realtime.messages where topic='space:'||(select v::text from ctx where k='s') and event='session' and payload->>'status'='expired'), '>=', 1::bigint, 'an expired event is broadcast');
-- B3: the original owner revives the same session; the preview is still there
select is((public.acquire_session('00000000-0000-0000-0000-0000000000a1',(select v from ctx where k='s')))->>'sessionId', (select v::text from ctx where k='a'), 'owner start revives the same session');
select is((select takeover_count from public.prompt_session where id=(select v from ctx where k='a')), 0, 'revival is not a takeover');
select is((public.prompt_conversation('00000000-0000-0000-0000-0000000000a1',(select v from ctx where k='s')))->'currentPreview'->>'previewId', (select v::text from ctx where k='p'), 'the open preview survives the revival');
-- B3: the partner starting after the next expiry takes over the same session
update public.test_clock set t = '2026-10-27T00:08:02Z';
select is((public.acquire_session('00000000-0000-0000-0000-0000000000a2',(select v from ctx where k='s')))->>'sessionId', (select v::text from ctx where k='a'), 'partner start continues the same session');
select is((select owner_user_id::text||':'||takeover_count from public.prompt_session where id=(select v from ctx where k='a')), '00000000-0000-0000-0000-0000000000a2:1', 'takeover swaps the owner and counts');
-- an expired lease nobody can continue reads as free, and start opens a new session
update public.test_clock set t = '2026-10-27T00:45:00Z';
select is((public.space_snapshot('00000000-0000-0000-0000-0000000000a1',(select v from ctx where k='s')))->'promptSession', 'null'::jsonb, 'old expired leases disappear from the snapshot');
select isnt((public.acquire_session('00000000-0000-0000-0000-0000000000a1',(select v from ctx where k='s')))->>'sessionId', (select v::text from ctx where k='a'), 'without a live preview start opens a new session');
select * from finish();
rollback;
