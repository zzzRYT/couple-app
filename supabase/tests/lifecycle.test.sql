begin;
select plan(29);
insert into auth.users (id,aud,role,email) values
 ('00000000-0000-0000-0000-000000000051','authenticated','authenticated','life-a@example.invalid'),
 ('00000000-0000-0000-0000-000000000052','authenticated','authenticated','life-b@example.invalid'),
 ('00000000-0000-0000-0000-000000000053','authenticated','authenticated','life-c@example.invalid'),
 ('00000000-0000-0000-0000-000000000054','authenticated','authenticated','life-d@example.invalid');
create temp table ctx (k text primary key, v uuid);
grant all on ctx to authenticated;
insert into ctx select 'space', ((public.create_space('00000000-0000-0000-0000-000000000051','2025-01-01','Asia/Seoul'))->>'spaceId')::uuid;
select public.create_invitation('00000000-0000-0000-0000-000000000051',(select v from ctx where k='space'),'life-hash');
select public.accept_invitation('00000000-0000-0000-0000-000000000052','life-hash');
select public.acquire_session('00000000-0000-0000-0000-000000000051',(select v from ctx where k='space'));
insert into public.invitation (space_id,created_by_user_id,token_hash) values ((select v from ctx where k='space'),'00000000-0000-0000-0000-000000000051','life-open');

-- not a member / bad reason
select throws_ok($$select public.end_space('00000000-0000-0000-0000-000000000053',(select v from ctx where k='space'),'ended')$$,'P0001','NOT_FOUND','outsiders cannot end the space');
select throws_ok($$select public.end_space('00000000-0000-0000-0000-000000000051',(select v from ctx where k='space'),'restore')$$,'P0001','INVALID_REQUEST','unknown reasons are refused');
select is((select status from public.couple_space where id=(select v from ctx where k='space')),'active','a refused call changes nothing');

-- one transaction closes everything
select is(public.end_space('00000000-0000-0000-0000-000000000051',(select v from ctx where k='space'),'ended'),'{"status":"ended"}'::jsonb,'end_space returns only the status');
select is((select status||'/'||ended_reason||'/'||ended_by_user_id from public.couple_space where id=(select v from ctx where k='space')),'ended/ended/00000000-0000-0000-0000-000000000051','status, reason and ender are stored');
select is((select purge_after - ended_at from public.couple_space where id=(select v from ctx where k='space')),interval '30 days','purge_after is ended_at plus the server setting');
select is((select count(*) from public.space_member where space_id=(select v from ctx where k='space') and space_active),0::bigint,'both members lose access in the same step');
select is((select status||'/'||release_reason from public.prompt_session where space_id=(select v from ctx where k='space')),'released/space_ended','the open lease is released');
select is((select count(*) from public.invitation where space_id=(select v from ctx where k='space') and status='active'),0::bigint,'open invitations are revoked');
select is((select event_type from public.space_lifecycle_event where space_id=(select v from ctx where k='space')),'ended','an ended event is recorded');
select is((select count(*) from public.space_end_notice where space_id=(select v from ctx where k='space')),2::bigint,'both members get a notice');
select throws_ok($$select public.end_space('00000000-0000-0000-0000-000000000052',(select v from ctx where k='space'),'ended')$$,'P0001','NOT_FOUND','the partner cannot end it again');

-- notices
select is(public.my_spaces('00000000-0000-0000-0000-000000000051')->'ended'->>'by','me','the ender sees by=me');
select is(public.my_spaces('00000000-0000-0000-0000-000000000052')->'ended'->>'by','partner','the partner sees by=partner');
select is(public.my_spaces('00000000-0000-0000-0000-000000000052')->'ended'->>'kind','ended','kind is ended');
select is(public.my_spaces('00000000-0000-0000-0000-000000000052')->'active','null'::jsonb,'no active space once ended');
select is((select array_agg(k order by k) from jsonb_object_keys(public.my_spaces('00000000-0000-0000-0000-000000000052')->'ended') k),array['at','by','kind'],'the notice carries no space data or schedule');
select public.ack_ended_notice('00000000-0000-0000-0000-000000000051');
select public.ack_ended_notice('00000000-0000-0000-0000-000000000051');
select is(public.my_spaces('00000000-0000-0000-0000-000000000051')->'ended','null'::jsonb,'ack hides the notice and is idempotent');
select is(public.my_spaces('00000000-0000-0000-0000-000000000052')->'ended'->>'kind','ended','the partner notice is untouched');

-- RLS: nothing is readable once the space is ended
set local role authenticated;
set local request.jwt.claims to '{"sub":"00000000-0000-0000-0000-000000000051","role":"authenticated"}';
select is((select count(*) from public.couple_space),0::bigint,'ended space is invisible through RLS');
select is((select count(*) from public.space_member),0::bigint,'members are invisible through RLS');
select is((select count(*) from public.space_lifecycle_event),0::bigint,'events are invisible through RLS');
reset role;

-- a fresh start works at once for both people
select lives_ok($$select public.create_space('00000000-0000-0000-0000-000000000051','2025-02-02','Asia/Seoul')$$,'the ender can create a new space');
select lives_ok($$select public.create_space('00000000-0000-0000-0000-000000000052','2025-02-03','Asia/Seoul')$$,'the partner can create a new space');
select is((select count(*) from public.space_end_notice where user_id='00000000-0000-0000-0000-000000000051' and acked_at is null),0::bigint,'no stray notices for the ender');

-- disconnect and account deletion
insert into ctx select 'third', ((public.create_space('00000000-0000-0000-0000-000000000053','2025-03-03','Asia/Seoul'))->>'spaceId')::uuid;
select public.end_space('00000000-0000-0000-0000-000000000053',(select v from ctx where k='third'),'disconnect');
select is((select event_type from public.space_lifecycle_event where space_id=(select v from ctx where k='third')),'disconnected','disconnect records its own event');
select is((select kind from public.space_end_notice where user_id='00000000-0000-0000-0000-000000000053' and space_id=(select v from ctx where k='third')),'disconnect','disconnect notice kind');
insert into ctx select 'fourth', ((public.create_space('00000000-0000-0000-0000-000000000053','2025-04-04','Asia/Seoul'))->>'spaceId')::uuid;
select public.create_invitation('00000000-0000-0000-0000-000000000053',(select v from ctx where k='fourth'),'life-hash-4');
select public.accept_invitation('00000000-0000-0000-0000-000000000054','life-hash-4');
select public.end_space('00000000-0000-0000-0000-000000000053',(select v from ctx where k='fourth'),'account_deletion');
select is((select kind||'/'||user_id from public.space_end_notice where space_id=(select v from ctx where k='fourth')),'account_deleted/00000000-0000-0000-0000-000000000054','only the partner of a deleted account gets a notice, without a name');
select is((select ended_reason from public.couple_space where id=(select v from ctx where k='fourth')),'account_deletion','account deletion has its own reason');
select * from finish();
rollback;
