begin;
select plan(11);
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
insert into public.user_profile(user_id, display_name, birth_month, birth_day, birth_year) values
 ('00000000-0000-0000-0000-000000000051','하루',2,29,2000)
 on conflict(user_id) do update set display_name=excluded.display_name,birth_month=excluded.birth_month,birth_day=excluded.birth_day,birth_year=excluded.birth_year;
insert into public.user_profile(user_id, display_name, birth_month, birth_day, birth_year) values
 ('00000000-0000-0000-0000-000000000052','도담',3,14,1998)
 on conflict(user_id) do update set display_name=excluded.display_name,birth_month=excluded.birth_month,birth_day=excluded.birth_day,birth_year=excluded.birth_year;
select public.accept_invitation('00000000-0000-0000-0000-000000000052','snap-hash');
select is(public.space_snapshot('00000000-0000-0000-0000-000000000051',(select v from ctx where k='a'))->'me'->'birthday'->>'year','2000','own birth year visible');
select is(public.space_snapshot('00000000-0000-0000-0000-000000000052',(select v from ctx where k='a'))->'me'->'birthday'->>'year','1998','each member sees only own birth year');
select ok(not (public.space_snapshot('00000000-0000-0000-0000-000000000051',(select v from ctx where k='a'))->'members' @> '[{"birthday":{"year":1998}}]'::jsonb),'partner birth year not exposed');
select ok((select bool_and(member->'birthday' <> 'null'::jsonb and member->'hasBirthday' = 'true'::jsonb and not (member->'birthday' ? 'year')) from jsonb_array_elements(public.space_snapshot('00000000-0000-0000-0000-000000000051',(select v from ctx where k='a'))->'members') member),'S3 reveals month and day after both enter birthdays, never the year');
select is(public.space_snapshot('00000000-0000-0000-0000-000000000051',(select v from ctx where k='a'))->'anniversaries','[]'::jsonb,'no custom anniversaries yet');
update public.couple_space set status='ended' where id=(select v from ctx where k='a');
select is(public.space_snapshot('00000000-0000-0000-0000-000000000051',(select v from ctx where k='a')),null,'ended space looks like a missing space');
select * from finish();
rollback;
