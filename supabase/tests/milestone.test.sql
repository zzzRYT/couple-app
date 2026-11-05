begin;
select plan(12);
insert into auth.users(id,aud,role,email) values
 ('00000000-0000-0000-0000-000000000081','authenticated','authenticated','milestone-record-a@example.invalid'),
 ('00000000-0000-0000-0000-000000000082','authenticated','authenticated','milestone-record-b@example.invalid');
create temp table ctx(k text primary key,v uuid);
insert into ctx select 'space',((public.create_space('00000000-0000-0000-0000-000000000081','2023-01-01','Asia/Seoul'))->>'spaceId')::uuid;
select is((public.milestone_context('00000000-0000-0000-0000-000000000081',(select v from ctx where k='space'))->>'eligible')::boolean,false,'pending invite is not eligible');
insert into public.space_member(space_id,user_id,space_active) select v,'00000000-0000-0000-0000-000000000082',true from ctx where k='space';
select is((public.milestone_context('00000000-0000-0000-0000-000000000081',(select v from ctx where k='space'))->>'eligible')::boolean,true,'two active members are eligible');
select public.record_milestones('00000000-0000-0000-0000-000000000081',(select v from ctx where k='space'),
  '[{"key":"d50","kind":"day","days":50,"anniversaryN":null,"milestoneDate":"2023-02-19","status":"passed"},{"key":"d1000","kind":"day","days":1000,"anniversaryN":null,"milestoneDate":"2025-09-26","status":"passed"}]'::jsonb,
  '2023-01-01','Asia/Seoul',(public.app_now() at time zone 'Asia/Seoul')::date);
select public.record_milestones('00000000-0000-0000-0000-000000000081',(select v from ctx where k='space'),
  '[{"key":"d50","kind":"day","days":50,"anniversaryN":null,"milestoneDate":"2023-02-19","status":"passed"},{"key":"d1000","kind":"day","days":1000,"anniversaryN":null,"milestoneDate":"2025-09-26","status":"passed"}]'::jsonb,
  '2023-01-01','Asia/Seoul',(public.app_now() at time zone 'Asia/Seoul')::date);
select is((select count(*)::int from public.milestone_celebration where space_id=(select v from ctx where k='space')),2,'repeated current reads keep one row per milestone');
insert into public.milestone_seen(celebration_id,member_user_id,via)
 select id,'00000000-0000-0000-0000-000000000081','home' from public.milestone_celebration where milestone_key in ('d50','d1000');
create temp table changed as select public.update_anniversary('00000000-0000-0000-0000-000000000081',(select v from ctx where k='space'),(public.app_now() at time zone 'Asia/Seoul')::date - 100,
  (select updated_at from public.couple_space where id=(select v from ctx where k='space')))->'milestonesReset' as reset_keys;
select ok((select reset_keys ? 'd1000' from changed),'date edit resets a recorded mark that moves into the future');
select is((select count(*)::int from public.milestone_celebration where space_id=(select v from ctx where k='space') and milestone_key='d1000'),0,'future record is deleted');
select is((select count(*)::int from public.milestone_seen s join public.milestone_celebration c on c.id=s.celebration_id where c.space_id=(select v from ctx where k='space') and c.milestone_key='d1000'),0,'future seen state is deleted with its record');
select is((select count(*)::int from public.milestone_celebration where space_id=(select v from ctx where k='space') and milestone_key='d50'),1,'past record is preserved');
select is((select count(*)::int from public.milestone_seen s join public.milestone_celebration c on c.id=s.celebration_id where c.space_id=(select v from ctx where k='space') and c.milestone_key='d50'),1,'past seen state is preserved');
select ok(position('150' in pg_get_constraintdef(oid)) > 0, 'milestone key constraint accepts 150') from pg_constraint where conrelid='public.milestone_celebration'::regclass and conname='milestone_celebration_milestone_key_check';
select ok(position('150' in pg_get_constraintdef(oid)) > 0, 'milestone day constraint accepts 150') from pg_constraint where conrelid='public.milestone_celebration'::regclass and conname='milestone_celebration_check';
insert into public.milestone_celebration(space_id,milestone_key,kind,milestone_days,milestone_date,priority) select v,'d150','day',150,'2023-05-30',1 from ctx where k='space';
select is((select milestone_days from public.milestone_celebration where space_id=(select v from ctx where k='space') and milestone_key='d150'),150,'d150 accepted');
insert into public.milestone_celebration(space_id,milestone_key,kind,milestone_days,milestone_date,priority) select v,'d500','day',500,'2024-05-14',1 from ctx where k='space';
select is((select milestone_days from public.milestone_celebration where space_id=(select v from ctx where k='space') and milestone_key='d500'),500,'historic d500 accepted');
select * from finish();
rollback;
