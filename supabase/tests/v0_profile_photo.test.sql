begin;
select plan(11);
insert into auth.users(id,aud,role,email) values
 ('00000000-0000-0000-0000-0000000000f1','authenticated','authenticated','photo-a@example.invalid'),
 ('00000000-0000-0000-0000-0000000000f2','authenticated','authenticated','photo-b@example.invalid'),
 ('00000000-0000-0000-0000-0000000000f3','authenticated','authenticated','photo-c@example.invalid');
create temp table ctx(k text primary key,v uuid);
insert into ctx select 'space',(public.create_space('00000000-0000-0000-0000-0000000000f1','2025-01-01','Asia/Seoul')->>'spaceId')::uuid;
insert into public.space_member(space_id,user_id,space_active) select v,'00000000-0000-0000-0000-0000000000f2',true from ctx where k='space';

select is(public.set_profile_photo('00000000-0000-0000-0000-0000000000f1','00000000-0000-0000-0000-0000000000f1/10000000-0000-4000-8000-000000000001.jpg'),'{"previous":null}'::jsonb,'a first photo has no previous object');
select is(public.set_profile_photo('00000000-0000-0000-0000-0000000000f1','00000000-0000-0000-0000-0000000000f1/10000000-0000-4000-8000-000000000002.jpg')->>'previous','00000000-0000-0000-0000-0000000000f1/10000000-0000-4000-8000-000000000001.jpg','a replaced photo returns the old path to delete');
select throws_ok($$select public.set_profile_photo('00000000-0000-0000-0000-0000000000f1','00000000-0000-0000-0000-0000000000f2/10000000-0000-4000-8000-000000000003.jpg')$$,'P0001','INVALID_REQUEST','another person''s prefix is rejected');
select throws_ok($$select public.set_profile_photo('00000000-0000-0000-0000-0000000000f1','00000000-0000-0000-0000-0000000000f1/../x.jpg')$$,'P0001','INVALID_REQUEST','a path that is not <uuid>.jpg is rejected');
select cmp_ok((select count(*) from realtime.messages where topic='space:'||(select v::text from ctx where k='space') and event='member' and payload->>'kind'='profile'),'>=',1::bigint,'the partner is told to refresh');
select is(public.space_member_photos('00000000-0000-0000-0000-0000000000f2',(select v from ctx where k='space')),'{"00000000-0000-0000-0000-0000000000f1":"00000000-0000-0000-0000-0000000000f1/10000000-0000-4000-8000-000000000002.jpg"}'::jsonb,'the partner reads the current photo path; members without a photo are left out');
select is(public.space_member_photos('00000000-0000-0000-0000-0000000000f3',(select v from ctx where k='space')),'{}'::jsonb,'a non-member reads no photos');
update public.couple_space set status='ended' where id=(select v from ctx where k='space');
select is(public.space_member_photos('00000000-0000-0000-0000-0000000000f2',(select v from ctx where k='space')),'{}'::jsonb,'an ended space shows no photos');
select is(public.set_profile_photo('00000000-0000-0000-0000-0000000000f1',null)->>'previous','00000000-0000-0000-0000-0000000000f1/10000000-0000-4000-8000-000000000002.jpg','removing returns the path to delete');
select is(public.set_profile_photo('00000000-0000-0000-0000-0000000000f1',null),'{"previous":null}'::jsonb,'removing with no photo is a no-op');
insert into public.user_profile(user_id,status) values ('00000000-0000-0000-0000-0000000000f2','deleting') on conflict (user_id) do update set status='deleting';
select throws_ok($$select public.set_profile_photo('00000000-0000-0000-0000-0000000000f2',null)$$,'P0001','ACCOUNT_DELETING','a deleting account cannot change its photo');
select * from finish();
rollback;
