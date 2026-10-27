begin;
select plan(18);
insert into auth.users (id,aud,role,email) values
 ('00000000-0000-0000-0000-000000000061','authenticated','authenticated','ps-a@example.invalid'),
 ('00000000-0000-0000-0000-000000000062','authenticated','authenticated','ps-b@example.invalid'),
 ('00000000-0000-0000-0000-000000000063','authenticated','authenticated','ps-c@example.invalid');
create temp table ctx (k text primary key, v uuid);
grant all on ctx to public;
insert into ctx select 's', ((public.create_space('00000000-0000-0000-0000-000000000061','2025-01-01','Asia/Seoul'))->>'spaceId')::uuid;
insert into public.space_member (space_id,user_id) select v,'00000000-0000-0000-0000-000000000062' from ctx where k='s';
create table public.test_clock (t timestamptz not null);
insert into public.test_clock values ('2026-10-27T00:00:00Z');
create or replace function public.app_now() returns timestamptz language sql stable set search_path = '' as $$ select t from public.test_clock $$;
-- ① a single winner (concurrency is enforced by the partial unique index and the space row lock)
insert into ctx select 'a', ((public.acquire_session('00000000-0000-0000-0000-000000000061',(select v from ctx where k='s')))->>'sessionId')::uuid;
select is((select status from public.prompt_session where id=(select v from ctx where k='a')),'occupied','first acquire occupies');
select throws_like($$select public.acquire_session('00000000-0000-0000-0000-000000000062',(select v from ctx where k='s'))$$,'SESSION_OCCUPIED:%00000000-0000-0000-0000-000000000061%','second acquire is occupied with owner');
select throws_like($$select public.acquire_session('00000000-0000-0000-0000-000000000062',(select v from ctx where k='s'))$$,'SESSION_OCCUPIED:%expiresAt%','occupied error carries expiry');
select throws_ok($$insert into public.prompt_session (space_id,owner_user_id,status,expires_at) select v,'00000000-0000-0000-0000-000000000062','occupied',now() from ctx where k='s'$$,'23505',null,'database allows one occupied row per space');
select is((public.acquire_session('00000000-0000-0000-0000-000000000061',(select v from ctx where k='s')))->>'sessionId',(select v::text from ctx where k='a'),'owner re-acquire returns the same lease');
-- ② heartbeat extends only with activity
update public.test_clock set t = t + interval '2 minutes';
select is((public.heartbeat_session('00000000-0000-0000-0000-000000000061',(select v from ctx where k='s'),(select v from ctx where k='a'),false))->>'expiresAt',
  to_jsonb('2026-10-27T00:03:00Z'::timestamptz)#>>'{}','idle heartbeat does not extend');
select is((public.heartbeat_session('00000000-0000-0000-0000-000000000061',(select v from ctx where k='s'),(select v from ctx where k='a'),true))->>'expiresAt',
  to_jsonb('2026-10-27T00:05:00Z'::timestamptz)#>>'{}','active heartbeat extends to server now + 3 minutes');
select throws_like($$select public.heartbeat_session('00000000-0000-0000-0000-000000000062',(select v from ctx where k='s'),(select v from ctx where k='a'),true)$$,'SESSION_OCCUPIED%','only the owner heartbeats');
-- ④ takeover is refused while the lease is valid
select throws_like($$select public.takeover_session('00000000-0000-0000-0000-000000000062',(select v from ctx where k='s'),(select v from ctx where k='a'),'00000000-0000-0000-0000-000000000061')$$,'SESSION_OCCUPIED%','takeover of a valid lease is refused');
-- ③ expiry after 3 idle minutes
update public.test_clock set t = '2026-10-27T00:05:00Z';
select is((public.session_state('00000000-0000-0000-0000-000000000062',(select v from ctx where k='s')))->>'status','expired','lease expires 3 minutes after the last activity');
select throws_like($$select public.heartbeat_session('00000000-0000-0000-0000-000000000061',(select v from ctx where k='s'),(select v from ctx where k='a'),true)$$,'SESSION_EXPIRED%','expired owner cannot heartbeat');
select throws_like($$select public.takeover_session('00000000-0000-0000-0000-000000000062',(select v from ctx where k='s'),(select v from ctx where k='a'),'00000000-0000-0000-0000-000000000063')$$,'SESSION_CONFLICT%','takeover compares the expected owner');
select is((public.takeover_session('00000000-0000-0000-0000-000000000062',(select v from ctx where k='s'),(select v from ctx where k='a'),'00000000-0000-0000-0000-000000000061'))->>'ownerUserId','00000000-0000-0000-0000-000000000062','takeover keeps the session and swaps the owner');
select is((select takeover_count from public.prompt_session where id=(select v from ctx where k='a')),1,'takeover is counted');
-- ⑤ release
select lives_ok($$select public.release_session('00000000-0000-0000-0000-000000000062',(select v from ctx where k='s'),(select v from ctx where k='a'),'cancel')$$,'owner releases on cancel');
select is((select status||':'||release_reason from public.prompt_session where id=(select v from ctx where k='a')),'released:cancel','release is recorded');
-- ⑥ outsiders and ended spaces
select throws_ok($$select public.acquire_session('00000000-0000-0000-0000-000000000063',(select v from ctx where k='s'))$$,'P0001','NOT_FOUND','non-member is refused');
update public.couple_space set status='ended' where id=(select v from ctx where k='s');
select throws_ok($$select public.acquire_session('00000000-0000-0000-0000-000000000061',(select v from ctx where k='s'))$$,'P0001','NOT_FOUND','ended space is refused');
select * from finish();
rollback;
