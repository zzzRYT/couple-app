begin;
select plan(11);
insert into auth.users (id,aud,role,email) values
  ('00000000-0000-0000-0000-000000000091','authenticated','authenticated','mode-a@example.invalid'),
  ('00000000-0000-0000-0000-000000000092','authenticated','authenticated','mode-outsider@example.invalid');
create temp table mode_ctx (k text primary key, v uuid);
insert into mode_ctx select 'space', ((public.create_space('00000000-0000-0000-0000-000000000091','2025-01-01','Asia/Seoul'))->>'spaceId')::uuid;
select is((public.update_room_mode('00000000-0000-0000-0000-000000000091',(select v from mode_ctx where k='space'),'night','America/Los_Angeles',1)->>'versionNumber')::integer,2,'room mode creates the next immutable version');
select is((select time_zone from public.couple_space where id=(select v from mode_ctx where k='space')),'America/Los_Angeles','space time zone is the shared source of truth');
select is((select room_theme_document->>'mode' from public.current_room((select v from mode_ctx where k='space'))),'night','new room mode is in current version');
select is((select room_theme_document->>'timeZone' from public.current_room((select v from mode_ctx where k='space'))),'America/Los_Angeles','room document uses the same time zone');
select is((select source from public.current_room((select v from mode_ctx where k='space'))),'room_mode','version records its source');
select throws_ok($$select public.update_room_mode('00000000-0000-0000-0000-000000000091',(select v from mode_ctx where k='space'),'day','Asia/Tokyo',1)$$,'P0001','VERSION_CONFLICT','stale version is rejected');
select throws_ok($$select public.update_room_mode('00000000-0000-0000-0000-000000000091',(select v from mode_ctx where k='space'),'day','Mars/Olympus',2)$$,'P0001','INVALID_REQUEST','unknown IANA zone is rejected');
select throws_ok($$select public.update_room_mode('00000000-0000-0000-0000-000000000092',(select v from mode_ctx where k='space'),'day','Asia/Tokyo',2)$$,'P0001','NOT_FOUND','non-member cannot change shared settings');
select is((select count(*) from public.room_theme_version where space_id=(select v from mode_ctx where k='space')),2::bigint,'exactly one new history row was written');
insert into public.prompt_session (space_id, owner_user_id, status, expires_at) select v,'00000000-0000-0000-0000-000000000091','occupied',public.app_now() + interval '3 minutes' from mode_ctx where k='space';
select throws_like($$select public.update_room_mode('00000000-0000-0000-0000-000000000091',(select v from mode_ctx where k='space'),'day','Asia/Tokyo',2)$$,'SESSION_OCCUPIED:%','an occupied prompt session blocks room mode changes');
select is((select count(*) from public.room_theme_version where space_id=(select v from mode_ctx where k='space')),2::bigint,'the blocked change wrote no history row');
select * from finish();
rollback;
