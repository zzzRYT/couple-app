begin;
select plan(6);
insert into auth.users (id,aud,role,email) values
 ('00000000-0000-0000-0000-000000000051','authenticated','authenticated','snap-a@example.invalid'),
 ('00000000-0000-0000-0000-000000000052','authenticated','authenticated','snap-c@example.invalid');
create temp table ctx (k text primary key, v uuid);
insert into ctx select 'a', ((public.create_space('00000000-0000-0000-0000-000000000051','2025-01-01','Asia/Seoul'))->>'spaceId')::uuid;
select lives_ok($$select public.create_invitation('00000000-0000-0000-0000-000000000051',(select v from ctx where k='a'),'snap-hash')$$,'issue code');
select is(public.space_snapshot('00000000-0000-0000-0000-000000000051',(select v from ctx where k='a'))->'space'->>'anniversaryDate','2025-01-01','member sees the date');
select is((public.space_snapshot('00000000-0000-0000-0000-000000000051',(select v from ctx where k='a'))->'space'->>'memberCount')::int,1,'member sees member count');
select is(public.space_snapshot('00000000-0000-0000-0000-000000000051',(select v from ctx where k='a'))->'space'->'invitation'->>'status','active','member sees invitation state');
select is(public.space_snapshot('00000000-0000-0000-0000-000000000052',(select v from ctx where k='a')),null,'non-member gets nothing');
update public.couple_space set status='ended' where id=(select v from ctx where k='a');
select is(public.space_snapshot('00000000-0000-0000-0000-000000000051',(select v from ctx where k='a')),null,'ended space looks like a missing space');
select * from finish();
rollback;
