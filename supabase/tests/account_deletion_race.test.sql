-- T153: account deletion against the purge job, a partner's end/disconnect, and a restart part-way.
-- pgTAP runs in one transaction, so the races are checked as both orderings; the row lock on couple_space (end_space,
-- purge_space) and the per-account advisory lock (begin_account_deletion, guard_account) serialize the real concurrent case.
begin;
select plan(16);
insert into auth.users (id,aud,role,email) values
 ('00000000-0000-0000-0000-0000000000b1','authenticated','authenticated','race-a@example.invalid'),
 ('00000000-0000-0000-0000-0000000000b2','authenticated','authenticated','race-b@example.invalid'),
 ('00000000-0000-0000-0000-0000000000b3','authenticated','authenticated','race-c@example.invalid'),
 ('00000000-0000-0000-0000-0000000000b4','authenticated','authenticated','race-d@example.invalid');
create temp table ctx (k text primary key, v uuid);
insert into ctx select 'first', ((public.create_space('00000000-0000-0000-0000-0000000000b1','2025-01-01','Asia/Seoul'))->>'spaceId')::uuid;
select public.create_invitation('00000000-0000-0000-0000-0000000000b1',(select v from ctx where k='first'),'race-hash-1');
select public.accept_invitation('00000000-0000-0000-0000-0000000000b2','race-hash-1');
insert into ctx select 'second', ((public.create_space('00000000-0000-0000-0000-0000000000b3','2025-01-01','Asia/Seoul'))->>'spaceId')::uuid;
select public.create_invitation('00000000-0000-0000-0000-0000000000b3',(select v from ctx where k='second'),'race-hash-2');
select public.accept_invitation('00000000-0000-0000-0000-0000000000b4','race-hash-2');

-- ② the partner disconnects first, then the account deletion arrives: the space ends once and the first reason stays
select public.end_space('00000000-0000-0000-0000-0000000000b2',(select v from ctx where k='first'),'disconnect');
select is(public.begin_account_deletion('00000000-0000-0000-0000-0000000000b1','email','app',null,null),'{"state":"requested"}'::jsonb,'the deletion is still accepted');
select is((select ended_reason from public.couple_space where id=(select v from ctx where k='first')),'disconnect','the reason of whoever succeeded first stays');
select is((select ended_by_user_id from public.couple_space where id=(select v from ctx where k='first')),'00000000-0000-0000-0000-0000000000b2'::uuid,'and so does who ended it');
select is((select count(*) from public.space_end_notice where space_id=(select v from ctx where k='first') and kind='account_deleted'),0::bigint,'no second notice is created');
select is((select purge_after <= now() from public.couple_space where id=(select v from ctx where k='first')),true,'an already ended space of the deleter is still purged right away');

-- ② the other ordering: the deletion first, then the partner presses end: a no-op that cannot change the reason
select public.begin_account_deletion('00000000-0000-0000-0000-0000000000b3','email','app',null,null);
select set_config('app.deleting_actor', '', true);
select throws_ok($$select public.end_space('00000000-0000-0000-0000-0000000000b4',(select v from ctx where k='second'),'ended')$$,'P0001','NOT_FOUND','ending an ended space does nothing');
select is((select kind from public.space_end_notice where user_id='00000000-0000-0000-0000-0000000000b4'),'account_deleted','the partner keeps the account_deleted notice');

-- ① the purge job and the deletion runner on the same space: only one deletes, the other sees nothing to do
select is(public.purge_space((select v from ctx where k='second'),now()),true,'the sweep, seeing the space due, purges it');
select is(public.purge_space((select v from ctx where k='second'),'infinity'),false,'the runner afterwards finds nothing to purge');
select is((select count(*) from public.space_lifecycle_event where space_id=(select v from ctx where k='second') and event_type='deletion_completed'),1::bigint,'the space was deleted once');
select is((select count(*) from public.space_end_notice where user_id='00000000-0000-0000-0000-0000000000b4' and space_id is null),1::bigint,'whoever purges, the partner notice survives');

-- ④ the remaining person can start a new space at once
select ok((public.create_space('00000000-0000-0000-0000-0000000000b4','2025-03-03','Asia/Seoul'))->>'spaceId' is not null,'the partner creates a new space right away');

-- ③ a runner that died holding the lease mid-way: the row waits, then the sweep resumes from the recorded step
select ok(public.claim_account_deletion('00000000-0000-0000-0000-0000000000b3',now()) is not null,'a runner claims the deletion');
select public.advance_account_deletion('00000000-0000-0000-0000-0000000000b3','requested','space_ended',null);
select is(public.due_account_deletions(now(),20) @> to_jsonb('00000000-0000-0000-0000-0000000000b3'::text),false,'while the lease is live nothing else picks it up');
select is(public.due_account_deletions(now() + interval '10 minutes',20) @> to_jsonb('00000000-0000-0000-0000-0000000000b3'::text),true,'after the lease lapses the sweep resumes it');
select is((public.claim_account_deletion('00000000-0000-0000-0000-0000000000b3',now() + interval '10 minutes'))->>'state','space_ended','and continues from the step that had finished');
select * from finish();
rollback;
