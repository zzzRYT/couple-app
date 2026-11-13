begin;
select plan(13);
insert into auth.users(id,aud,role,email) values
 ('00000000-0000-0000-0000-0000000000a1','authenticated','authenticated','custom-a@example.invalid'),
 ('00000000-0000-0000-0000-0000000000a2','authenticated','authenticated','custom-b@example.invalid'),
 ('00000000-0000-0000-0000-0000000000a3','authenticated','authenticated','custom-c@example.invalid');
create temp table ctx(k text primary key,v uuid);
insert into ctx select 'space',(public.create_space('00000000-0000-0000-0000-0000000000a1','2025-01-01','Asia/Seoul')->>'spaceId')::uuid;
insert into public.space_member(space_id,user_id,space_active) select v,'00000000-0000-0000-0000-0000000000a2',true from ctx where k='space';
select public.set_member_profile('00000000-0000-0000-0000-0000000000a2','Partner',2::smallint,29::smallint,2000::smallint);
select is((select m->>'hasBirthday' from jsonb_array_elements(public.space_snapshot('00000000-0000-0000-0000-0000000000a1',(select v from ctx where k='space'))->'members') m where m->>'userId'='00000000-0000-0000-0000-0000000000a2'),'true','hasBirthday reveals presence');
select is((select m->'birthday' from jsonb_array_elements(public.space_snapshot('00000000-0000-0000-0000-0000000000a1',(select v from ctx where k='space'))->'members') m where m->>'userId'='00000000-0000-0000-0000-0000000000a2'),'null'::jsonb,'V0-F05-AC-01 partner date hidden until both entered');
select public.set_member_profile('00000000-0000-0000-0000-0000000000a1','Me',3::smallint,1::smallint,null);
select is((select m->'birthday' from jsonb_array_elements(public.space_snapshot('00000000-0000-0000-0000-0000000000a1',(select v from ctx where k='space'))->'members') m where m->>'userId'='00000000-0000-0000-0000-0000000000a2'),'{"month":2,"day":29}'::jsonb,'V0-F05-AC-02 partner date visible without year');
insert into ctx select 'item',(public.create_custom_anniversary('00000000-0000-0000-0000-0000000000a1',(select v from ctx where k='space'),'  Our day  ',null,'2025-05-03','yearly')->>'id')::uuid;
select is((select title from public.space_anniversary where id=(select v from ctx where k='item')),'Our day','title trimmed');
select is(jsonb_array_length(public.space_snapshot('00000000-0000-0000-0000-0000000000a1',(select v from ctx where k='space'))->'anniversaries'),3,'V0-F07-AC-03 snapshot includes active item next to the two seeded couple days');
select is((public.update_custom_anniversary('00000000-0000-0000-0000-0000000000a2',(select v from ctx where k='space'),(select v from ctx where k='item'),1,'Changed',null,'2025-05-03','once')->>'version')::integer,2,'partner updates and increments version');
select throws_ok($$select public.update_custom_anniversary('00000000-0000-0000-0000-0000000000a1',(select v from ctx where k='space'),(select v from ctx where k='item'),1,'Stale',null,'2025-05-03','once')$$,'P0001','VERSION_CONFLICT','V0-EC-04 V0-F07-AC-08 stale update rejected');
select throws_ok($$select public.create_custom_anniversary('00000000-0000-0000-0000-0000000000a3',(select v from ctx where k='space'),'X',null,'2025-05-03','once')$$,'P0001','NOT_FOUND','V0-F07-AC-12 non-member rejected');
select ok(not has_table_privilege('authenticated','public.space_anniversary','insert'),'direct insert denied');
select ok(not has_table_privilege('authenticated','public.space_anniversary','update'),'direct update denied');
select public.delete_custom_anniversary('00000000-0000-0000-0000-0000000000a1',(select v from ctx where k='space'),(select v from ctx where k='item'),2);
select is(jsonb_array_length(public.space_snapshot('00000000-0000-0000-0000-0000000000a1',(select v from ctx where k='space'))->'anniversaries'),2,'deleted item excluded');
select throws_ok($$select public.delete_custom_anniversary('00000000-0000-0000-0000-0000000000a1',(select v from ctx where k='space'),(select v from ctx where k='item'),2)$$,'P0001','NOT_FOUND:{"gone":true}','V0-F07-AC-09 deleted item reports gone');
select ok(not has_table_privilege('authenticated','public.space_anniversary','delete'),'direct delete denied');
select * from finish();
rollback;
