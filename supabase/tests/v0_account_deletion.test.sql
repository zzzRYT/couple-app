-- T603 (DB part): what account deletion leaves of V0 data — profile scrub, authorship of shared anniversaries, purge of the space's anniversaries.
begin;
select plan(15);
insert into auth.users (id,aud,role,email) values
 ('00000000-0000-0000-0000-0000000000b1','authenticated','authenticated','v0del-a@example.invalid'),
 ('00000000-0000-0000-0000-0000000000b2','authenticated','authenticated','v0del-b@example.invalid'),
 ('00000000-0000-0000-0000-0000000000c1','authenticated','authenticated','v0del-c@example.invalid'),
 ('00000000-0000-0000-0000-0000000000c2','authenticated','authenticated','v0del-d@example.invalid');
create temp table ctx (k text primary key, v uuid);

-- Space "pair": b1 and b2 each have a name and a birthday; b1 wrote an item, b2 changed it, and one more item is soft-deleted.
insert into ctx select 'pair', ((public.create_space('00000000-0000-0000-0000-0000000000b1','2025-01-01','Asia/Seoul'))->>'spaceId')::uuid;
insert into public.space_member (space_id,user_id,space_active) select v,'00000000-0000-0000-0000-0000000000b2',true from ctx where k='pair';
select public.set_member_profile('00000000-0000-0000-0000-0000000000b1','Ha-ru',3::smallint,14::smallint,1994::smallint);
select public.set_member_profile('00000000-0000-0000-0000-0000000000b2','Do-dam',8::smallint,2::smallint,1995::smallint);
insert into ctx select 'kept', (public.create_custom_anniversary('00000000-0000-0000-0000-0000000000b1',(select v from ctx where k='pair'),'Trip',null,'2026-11-20','once')->>'id')::uuid;
select public.update_custom_anniversary('00000000-0000-0000-0000-0000000000b2',(select v from ctx where k='pair'),(select v from ctx where k='kept'),1,'Trip 2','memo','2026-11-21','once');
insert into ctx select 'gone', (public.create_custom_anniversary('00000000-0000-0000-0000-0000000000b2',(select v from ctx where k='pair'),'Removed',null,'2026-12-01','once')->>'id')::uuid;
select public.delete_custom_anniversary('00000000-0000-0000-0000-0000000000b2',(select v from ctx where k='pair'),(select v from ctx where k='gone'),1);
select is((select count(*) from public.space_anniversary where space_id=(select v from ctx where k='pair') and preset_id is null),2::bigint,'setup: one live and one soft-deleted item');

-- ① the profile scrub at acceptance: name and the whole birthday are nulled, the partner's profile is untouched
select public.begin_account_deletion('00000000-0000-0000-0000-0000000000b2','email','app',null,null);
select is((select count(*) from public.user_profile where user_id='00000000-0000-0000-0000-0000000000b2'),1::bigint,'the profile row stays (as a scrubbed shell) while deletion runs');
select is((select count(*) from public.user_profile where user_id='00000000-0000-0000-0000-0000000000b2' and display_name is null and birth_month is null and birth_day is null and birth_year is null and status='deleting'),1::bigint,'display_name and birth_month/day/year are null at acceptance');
select is((select display_name || ':' || birth_month || '/' || birth_day from public.user_profile where user_id='00000000-0000-0000-0000-0000000000b1'),'Ha-ru:3/14','the partner keeps their own profile until their space is purged');

-- ② the shared space and its anniversaries are purged with the space (live and soft-deleted alike)
select ok(public.claim_account_deletion('00000000-0000-0000-0000-0000000000b2',now()) is not null,'the runner gets the lease');
select is(public.close_spaces_for_deletion('00000000-0000-0000-0000-0000000000b2'),jsonb_build_array((select v from ctx where k='pair')),'the shared space is listed for purge');
select is(public.purge_space((select v from ctx where k='pair'),'infinity'),true,'the space is hard-deleted');
select is((select count(*) from public.space_anniversary where space_id=(select v from ctx where k='pair')),0::bigint,'no anniversary of the space remains, including the soft-deleted one');
select is((select count(*) from public.space_anniversary where title in ('Trip','Trip 2','Removed')),0::bigint,'and no title survives anywhere');

-- ③ deleting the auth user removes the profile shell
select public.advance_account_deletion('00000000-0000-0000-0000-0000000000b2','requested','space_ended',null);
select public.advance_account_deletion('00000000-0000-0000-0000-0000000000b2','space_ended','provider_revoked',null);
select public.finish_account_deletion('00000000-0000-0000-0000-0000000000b2');
delete from auth.users where id='00000000-0000-0000-0000-0000000000b2';
select is((select count(*) from public.user_profile where user_id='00000000-0000-0000-0000-0000000000b2'),0::bigint,'no user_profile row remains after the auth user is deleted');

-- ④ authorship: a space that outlives its author keeps the item but loses the link to the person (created_by/updated_by set null)
insert into ctx select 'other', ((public.create_space('00000000-0000-0000-0000-0000000000c1','2025-02-02','Asia/Seoul'))->>'spaceId')::uuid;
insert into public.space_member (space_id,user_id,space_active) select v,'00000000-0000-0000-0000-0000000000c2',true from ctx where k='other';
select public.set_member_profile('00000000-0000-0000-0000-0000000000c2','Writer',5::smallint,5::smallint,null);
insert into ctx select 'theirs', (public.create_custom_anniversary('00000000-0000-0000-0000-0000000000c2',(select v from ctx where k='other'),'Written by them',null,'2026-12-25','yearly')->>'id')::uuid;
select is((select created_by from public.space_anniversary where id=(select v from ctx where k='theirs')),'00000000-0000-0000-0000-0000000000c2'::uuid,'setup: the item names its author');
delete from auth.users where id='00000000-0000-0000-0000-0000000000c2';
select is((select created_by || '/' || updated_by from public.space_anniversary where id=(select v from ctx where k='theirs')) is null,true,'created_by and updated_by become null with the author');
select is((select count(*) from public.space_anniversary where id=(select v from ctx where k='theirs')),1::bigint,'the item itself stays with the space');
select is((select count(*) from public.user_profile where user_id='00000000-0000-0000-0000-0000000000c2'),0::bigint,'the author profile is gone');
select is((select count(*) from public.user_profile where user_id='00000000-0000-0000-0000-0000000000c1'),1::bigint,'the other member profile is not touched');
select * from finish();
rollback;
