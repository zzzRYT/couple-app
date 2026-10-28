begin;
select plan(17);
insert into auth.users (id,aud,role,email) values
 ('00000000-0000-0000-0000-000000000061','authenticated','authenticated','purge-a@example.invalid'),
 ('00000000-0000-0000-0000-000000000062','authenticated','authenticated','purge-b@example.invalid');
create temp table ctx (k text primary key, v uuid);
insert into ctx select 'old', ((public.create_space('00000000-0000-0000-0000-000000000061','2025-01-01','Asia/Seoul'))->>'spaceId')::uuid;
select public.create_invitation('00000000-0000-0000-0000-000000000061',(select v from ctx where k='old'),'purge-hash');
select public.accept_invitation('00000000-0000-0000-0000-000000000062','purge-hash');
select public.acquire_session('00000000-0000-0000-0000-000000000061',(select v from ctx where k='old'));
insert into public.prompt_message (space_id,kind,author_user_id,body_text) values ((select v from ctx where k='old'),'user_prompt','00000000-0000-0000-0000-000000000061','secret words');
insert into public.report (space_id,reporter_user_id,target,reason,detail) values ((select v from ctx where k='old'),'00000000-0000-0000-0000-000000000061','partner','other','secret detail');
select public.reserve_daily_request((select v from ctx where k='old'),gen_random_uuid());
select public.end_space('00000000-0000-0000-0000-000000000061',(select v from ctx where k='old'),'ended');
update public.couple_space set purge_after='2030-06-01T00:00:00Z' where id=(select v from ctx where k='old');
-- a newer space for the same person plus a space that is still active and one that is not due
select public.create_space('00000000-0000-0000-0000-000000000061','2025-05-05','Asia/Seoul');
insert into ctx select 'new', space_id from public.space_member where user_id='00000000-0000-0000-0000-000000000061' and space_active;

select is(public.due_purge_spaces('2030-05-31T23:59:59Z',50) @> to_jsonb((select v from ctx where k='old')),false,'not due one second before purge_after');
select is(public.due_purge_spaces('2030-06-01T00:00:00Z',50) @> to_jsonb((select v from ctx where k='old')),true,'due exactly at purge_after');
select is(public.due_purge_spaces('2030-06-01T00:00:00Z',50) @> to_jsonb((select v from ctx where k='new')),false,'active spaces are never due');
select is(public.purge_space((select v from ctx where k='old'),'2030-05-31T23:59:59Z'),false,'purge_space refuses a space that is not due');
select is((select count(*) from public.space_member where space_id=(select v from ctx where k='old')),2::bigint,'nothing was deleted early');
select is(public.purge_space((select v from ctx where k='new'),'2031-01-01T00:00:00Z'),false,'purge_space refuses an active space');
select public.mark_purge_started((select v from ctx where k='old'));
select public.mark_purge_started((select v from ctx where k='old'));
select is((select count(*) from public.space_lifecycle_event where space_id=(select v from ctx where k='old') and event_type='deletion_started'),1::bigint,'the started event is recorded once');

-- failure injection: a trigger that refuses the delete must roll the whole purge back
create function pg_temp.refuse() returns trigger language plpgsql as $$ begin raise exception 'injected failure'; end $$;
create trigger refuse_report_delete before delete on public.report for each row execute function pg_temp.refuse();
select throws_ok($$select public.purge_space((select v from ctx where k='old'),'2030-06-02T00:00:00Z')$$,'P0001','injected failure','a database failure aborts the purge');
select is((select count(*) from public.space_member where space_id=(select v from ctx where k='old')),2::bigint,'no partial deletion: members remain');
select is((select count(*) from public.prompt_message where space_id=(select v from ctx where k='old')),1::bigint,'no partial deletion: messages remain');
select is((select count(*) from public.space_lifecycle_event where space_id=(select v from ctx where k='old') and event_type='deletion_completed'),0::bigint,'no completed event after a failed purge');
drop trigger refuse_report_delete on public.report;

select is(public.purge_space((select v from ctx where k='old'),'2030-06-02T00:00:00Z'),true,'the retry deletes the space');
select is((select count(*) from public.couple_space where id=(select v from ctx where k='old')),0::bigint,'the space is gone');
select is((select count(*) from public.space_member where space_id=(select v from ctx where k='old'))
  + (select count(*) from public.prompt_message where space_id=(select v from ctx where k='old'))
  + (select count(*) from public.report where space_id=(select v from ctx where k='old'))
  + (select count(*) from public.space_end_notice where space_id=(select v from ctx where k='old'))
  + (select count(*) from public.daily_request_reservation where space_id=(select v from ctx where k='old'))
  + (select count(*) from public.room_theme_version where space_id=(select v from ctx where k='old')),0::bigint,'every related row is gone, including immutable room versions');
select is((select array_agg(event_type order by event_type) from public.space_lifecycle_event where space_id=(select v from ctx where k='old')),array['deletion_completed','deletion_started','ended'],'only content-free lifecycle events remain');
select is((select count(*) from public.space_lifecycle_event where space_id=(select v from ctx where k='old') and (actor_user_id is not null or metadata <> '{}'::jsonb)),0::bigint,'remaining events name no person and carry no content');
select is((select count(*) from public.space_member where space_id=(select v from ctx where k='new') and space_active),1::bigint,'the newer space is untouched');
select * from finish();
rollback;
