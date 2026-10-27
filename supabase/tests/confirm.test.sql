begin;
select plan(11);
insert into auth.users (id,aud,role,email) values
 ('00000000-0000-0000-0000-000000000091','authenticated','authenticated','cf-a@example.invalid'),
 ('00000000-0000-0000-0000-000000000092','authenticated','authenticated','cf-b@example.invalid');
create temp table ctx (k text primary key, v uuid);
insert into ctx select 's', ((public.create_space('00000000-0000-0000-0000-000000000091','2025-01-01','Asia/Seoul'))->>'spaceId')::uuid;
insert into public.space_member (space_id,user_id) select v,'00000000-0000-0000-0000-000000000092' from ctx where k='s';
update public.space_member set ai_consent_state='granted' where space_id=(select v from ctx where k='s');
insert into ctx select 'sess', ((public.acquire_session('00000000-0000-0000-0000-000000000091',(select v from ctx where k='s')))->>'sessionId')::uuid;
create function pg_temp.candidate() returns jsonb language sql as $$
  select jsonb_build_object('sceneDocument', jsonb_build_object('schemaVersion',1,'canvasProfile','room-portrait-v1','objects',jsonb_build_array(public.default_mascot(),
    '{"assetId":"obj_sky_star","x":0.2,"y":0.3,"width":0.1,"height":0.1,"rotationDeg":0,"zIndex":2,"opacity":1}'::jsonb),'texts','[]'::jsonb),
    'roomPresentation', (select room_presentation from public.current_room((select v from ctx where k='s'))),
    'roomThemeDocument', (select room_theme_document from public.current_room((select v from ctx where k='s'))));
$$;
insert into ctx select 'p', ((public.begin_decoration('00000000-0000-0000-0000-000000000091',(select v from ctx where k='s'),(select v from ctx where k='sess'),1,'stars'))->>'requestId')::uuid;
select lives_ok($$select public.store_preview((select v from ctx where k='p'), pg_temp.candidate(), 0, '{}')$$,'preview stored');
-- ⑥ a preview leaves the current version unchanged
select is((select version_number from public.current_room((select v from ctx where k='s'))),1,'preview does not change the room');
-- ① owner only
select throws_like($$select public.confirm_preview('00000000-0000-0000-0000-000000000092',(select v from ctx where k='s'),(select v from ctx where k='p'),(select v from ctx where k='sess'),1)$$,'SESSION_OCCUPIED%','only the lease owner confirms');
-- ④ stale base version
select throws_ok($$select public.confirm_preview('00000000-0000-0000-0000-000000000091',(select v from ctx where k='s'),(select v from ctx where k='p'),(select v from ctx where k='sess'),0)$$,'P0001','VERSION_CONFLICT','stale base version is rejected');
-- ② version + pointer + release together
select is((public.confirm_preview('00000000-0000-0000-0000-000000000091',(select v from ctx where k='s'),(select v from ctx where k='p'),(select v from ctx where k='sess'),1))->>'appliedVersion','2','confirm stores a new version');
select is((select version_number from public.current_room((select v from ctx where k='s'))),2,'pointer moved');
select is((select status||':'||release_reason from public.prompt_session where id=(select v from ctx where k='sess')),'released:confirm','lease released in the same transaction');
-- ④ second apply never duplicates
select throws_ok($$select public.confirm_preview('00000000-0000-0000-0000-000000000091',(select v from ctx where k='s'),(select v from ctx where k='p'),(select v from ctx where k='sess'),2)$$,'P0001','ALREADY_APPLIED','re-applying is refused');
select is((select count(*) from public.room_theme_version where space_id=(select v from ctx where k='s')),2::bigint,'no duplicate version');
-- ⑦ undo after apply
select throws_ok($$select public.undo_preview('00000000-0000-0000-0000-000000000091',(select v from ctx where k='s'),(select v from ctx where k='sess'),(select v from ctx where k='p'))$$,'P0001','ALREADY_APPLIED','applied changes cannot be undone');
-- ⑤ cancel leaves the room alone
insert into ctx select 'sess2', ((public.acquire_session('00000000-0000-0000-0000-000000000091',(select v from ctx where k='s')))->>'sessionId')::uuid;
select public.cancel_preview('00000000-0000-0000-0000-000000000091',(select v from ctx where k='s'),(select v from ctx where k='p'),(select v from ctx where k='sess2'));
select is((select version_number::text||':'||(select status from public.prompt_session where id=(select v from ctx where k='sess2')) from public.current_room((select v from ctx where k='s'))),'2:released','cancel releases without changing the room');
select * from finish();
rollback;
