begin;
select plan(8);
insert into auth.users(id,aud,role,email) values
 ('00000000-0000-0000-0000-000000000091','authenticated','authenticated','milestone-a@example.invalid'),
 ('00000000-0000-0000-0000-000000000092','authenticated','authenticated','milestone-b@example.invalid'),
 ('00000000-0000-0000-0000-000000000093','authenticated','authenticated','milestone-c@example.invalid');
create temp table ctx(k text primary key,v uuid);
insert into ctx select 'space',((public.create_space('00000000-0000-0000-0000-000000000091','2025-01-01','Asia/Seoul'))->>'spaceId')::uuid;
insert into public.space_member(space_id,user_id,space_active) select v,'00000000-0000-0000-0000-000000000092',true from ctx where k='space';
insert into public.milestone_celebration(space_id,milestone_key,kind,milestone_days,milestone_date,priority,status)
 select v,'d50','day',50,'2025-02-19',1,'active' from ctx where k='space';
insert into public.milestone_seen(celebration_id,member_user_id,via)
 select id,'00000000-0000-0000-0000-000000000091','home' from public.milestone_celebration where milestone_key='d50';
select is((select count(*)::int from public.milestone_seen),'1','first member can acknowledge once');
insert into public.milestone_seen(celebration_id,member_user_id,via)
 select id,'00000000-0000-0000-0000-000000000092','room' from public.milestone_celebration where milestone_key='d50'
 on conflict do nothing;
select is((select count(*)::int from public.milestone_seen),'2','partner acknowledgement is independent');
insert into public.milestone_seen(celebration_id,member_user_id,via)
 select id,'00000000-0000-0000-0000-000000000092','home' from public.milestone_celebration where milestone_key='d50'
 on conflict do nothing;
select is((select count(*)::int from public.milestone_seen),'2','replayed acknowledgement is idempotent');
select is((select count(*)::int from public.milestone_celebration where space_id=(select v from ctx where k='space')),'1','one milestone record per space and key');
select throws_ok($$insert into public.milestone_celebration(space_id,milestone_key,kind,milestone_days,milestone_date,priority,status) select v,'d50','day',50,'2025-02-19',1,'active' from ctx where k='space'$$,null,null,'duplicate milestone key is rejected');
select is((select count(*)::int from public.milestone_seen where member_user_id='00000000-0000-0000-0000-000000000093'),'0','third party has no acknowledgement row');
set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000091',true);
select is((select count(*)::int from public.milestone_seen where celebration_id=(select id from public.milestone_celebration where milestone_key='d50')),1,'RLS exposes only my own seen row');
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000093',true);
select is((select count(*)::int from public.milestone_seen where celebration_id=(select id from public.milestone_celebration where milestone_key='d50')),0,'RLS hides milestone seen rows from a non-member');
reset role;
select * from finish();
rollback;
