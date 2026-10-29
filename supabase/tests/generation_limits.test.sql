begin;
select plan(14);
insert into auth.users (id,aud,role,email) values
 ('00000000-0000-0000-0000-0000000000b1','authenticated','authenticated','gl-a@example.invalid'),
 ('00000000-0000-0000-0000-0000000000b2','authenticated','authenticated','gl-b@example.invalid');
create temp table ctx (k text primary key, v uuid);
insert into ctx select 's', ((public.create_space('00000000-0000-0000-0000-0000000000b1','2025-01-01','Asia/Seoul'))->>'spaceId')::uuid;
insert into public.space_member (space_id,user_id) select v,'00000000-0000-0000-0000-0000000000b2' from ctx where k='s';
update public.space_member set ai_consent_state='granted' where space_id=(select v from ctx where k='s');
create table public.test_clock (t timestamptz not null);
insert into public.test_clock values ('2026-10-27T00:00:00Z');
create or replace function public.app_now() returns timestamptz language sql stable set search_path = '' as $$ select t from public.test_clock $$;
insert into ctx select 'a', ((public.acquire_session('00000000-0000-0000-0000-0000000000b1',(select v from ctx where k='s')))->>'sessionId')::uuid;
insert into ctx select 'r', ((public.begin_decoration('00000000-0000-0000-0000-0000000000b1',(select v from ctx where k='s'),(select v from ctx where k='a'),1,'stars'))->>'requestId')::uuid;
-- B10/C7: generation stages are announced and stored while the request is queued
select is(public.mark_decoration_stage((select v from ctx where k='r'), 'generating'), true, 'a queued request takes a stage');
select is((public.prompt_conversation('00000000-0000-0000-0000-0000000000b2',(select v from ctx where k='s')))->'messages'->0->>'stage', 'generating', 'both members read the stage from the conversation');
-- B4: cancelling during generation returns the quota slot
select lives_ok($$select public.cancel_preview('00000000-0000-0000-0000-0000000000b1',(select v from ctx where k='s'),(select v from ctx where k='r'),(select v from ctx where k='a'))$$, 'owner cancels while the request is queued');
select is((select status from public.daily_request_reservation where request_id=(select v from ctx where k='r')), 'released', 'the reservation is released with the cancel');
select is(public.mark_decoration_stage((select v from ctx where k='r'), 'repairing'), false, 'a cancelled request reports false so the model call is skipped');
select throws_ok($$select public.store_preview((select v from ctx where k='r'), '{}'::jsonb, 0, '{}')$$, 'P0001', 'PREVIEW_CHANGED', 'a late result of a cancelled request is refused');
-- the sweep also repairs reservations stranded before this fix
update public.daily_request_reservation set status='reserved' where request_id=(select v from ctx where k='r');
select is((public.sweep_prompt_data(public.app_now()))->>'releasedAfterCancel', '1', 'sweep releases a reservation stranded by a cancelled request');
select is((select status from public.daily_request_reservation where request_id=(select v from ctx where k='r')), 'released', 'the stranded reservation is released');
-- B7: idempotency keys are claimed before the work runs
select is((public.idempotency_claim('00000000-0000-0000-0000-0000000000b1','POST /x','11111111-1111-4111-8111-111111111111'))->>'status', 'claimed', 'the first caller claims the key');
select is((public.idempotency_claim('00000000-0000-0000-0000-0000000000b1','POST /x','11111111-1111-4111-8111-111111111111'))->>'status', 'pending', 'an overlapping caller sees the work in progress');
select public.idempotency_complete('00000000-0000-0000-0000-0000000000b1','POST /x','11111111-1111-4111-8111-111111111111','{"ok":1}');
select is((public.idempotency_claim('00000000-0000-0000-0000-0000000000b1','POST /x','11111111-1111-4111-8111-111111111111'))->>'status', 'done', 'a finished key replays');
select is((public.idempotency_claim('00000000-0000-0000-0000-0000000000b1','POST /x','11111111-1111-4111-8111-111111111111'))->'response', '{"ok":1}'::jsonb, 'with the stored response');
select public.idempotency_claim('00000000-0000-0000-0000-0000000000b1','POST /x','22222222-2222-4222-8222-222222222222');
select public.idempotency_release('00000000-0000-0000-0000-0000000000b1','POST /x','22222222-2222-4222-8222-222222222222');
select is((public.idempotency_claim('00000000-0000-0000-0000-0000000000b1','POST /x','22222222-2222-4222-8222-222222222222'))->>'status', 'claimed', 'a released key can run again');
update public.test_clock set t = t + interval '151 seconds';
select is((public.idempotency_claim('00000000-0000-0000-0000-0000000000b1','POST /x','22222222-2222-4222-8222-222222222222'))->>'status', 'claimed', 'a pending row from a crashed worker is claimed again after the stale window');
select * from finish();
rollback;
