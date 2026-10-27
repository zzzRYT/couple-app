begin;
select plan(14);
insert into auth.users (id,aud,role,email) values
 ('00000000-0000-0000-0000-000000000041','authenticated','authenticated','cs-a@example.invalid'),
 ('00000000-0000-0000-0000-000000000042','authenticated','authenticated','cs-b@example.invalid'),
 ('00000000-0000-0000-0000-000000000043','authenticated','authenticated','cs-c@example.invalid'),
 ('00000000-0000-0000-0000-000000000044','authenticated','authenticated','cs-d@example.invalid');
create temp table ctx (k text primary key, v uuid);
insert into ctx select 'a', ((public.create_space('00000000-0000-0000-0000-000000000041','2025-01-01','Asia/Seoul'))->>'spaceId')::uuid;
select is((select count(*) from public.space_member where space_id=(select v from ctx where k='a')),1::bigint,'space and first member are created together');
select is((select time_zone from public.couple_space where id=(select v from ctx where k='a')),'Asia/Seoul','room time zone comes from the creator');
select throws_ok($$select public.create_space('00000000-0000-0000-0000-000000000041','2025-01-01','Asia/Seoul')$$,'P0001','ALREADY_IN_SPACE','active member cannot create another space');
select throws_ok($$select public.create_space('00000000-0000-0000-0000-000000000042','2999-01-01','Asia/Seoul')$$,'P0001','INVALID_REQUEST','future date is rejected');
select throws_ok($$select public.create_space('00000000-0000-0000-0000-000000000042','2025-01-01','Mars/Base')$$,'P0001','INVALID_REQUEST','unknown time zone is rejected');
-- none
select is(public.my_spaces('00000000-0000-0000-0000-000000000044'),'{"active":null,"ended":null}'::jsonb,'no space and no notice');
-- active only
select is(public.my_spaces('00000000-0000-0000-0000-000000000041'),jsonb_build_object('active',jsonb_build_object('spaceId',(select v from ctx where k='a')),'ended',null),'active only');
-- ended only (fixture)
insert into public.couple_space (id,anniversary_date,status,ended_at,ended_reason,ended_by_user_id) values ('10000000-0000-0000-0000-000000000042','2024-01-01','ended','2026-01-02T00:00:00Z','disconnect','00000000-0000-0000-0000-000000000043');
insert into public.space_member (space_id,user_id,space_active) values ('10000000-0000-0000-0000-000000000042','00000000-0000-0000-0000-000000000042',false),('10000000-0000-0000-0000-000000000042','00000000-0000-0000-0000-000000000043',false);
insert into public.space_end_notice (user_id,space_id,kind,by_user_id,at) values
 ('00000000-0000-0000-0000-000000000042','10000000-0000-0000-0000-000000000042','disconnect','00000000-0000-0000-0000-000000000043','2026-01-02T00:00:00Z'),
 ('00000000-0000-0000-0000-000000000043','10000000-0000-0000-0000-000000000042','disconnect','00000000-0000-0000-0000-000000000043','2026-01-02T00:00:00Z'),
 ('00000000-0000-0000-0000-000000000042','10000000-0000-0000-0000-000000000042','ended','00000000-0000-0000-0000-000000000042','2025-06-01T00:00:00Z');
select is(public.my_spaces('00000000-0000-0000-0000-000000000042'),'{"active":null,"ended":{"kind":"disconnect","by":"partner","at":"2026-01-02T00:00:00+00:00"}}'::jsonb,'ended only returns the latest notice relative to the caller');
select is(public.my_spaces('00000000-0000-0000-0000-000000000043')->'ended'->>'by','me','the disconnecting member sees by=me');
select is(public.my_spaces('00000000-0000-0000-0000-000000000042')::text like '%10000000-0000-0000-0000-000000000042%',false,'notice carries no space identifier');
-- both
select lives_ok($$select public.create_space('00000000-0000-0000-0000-000000000042','2025-01-01','Asia/Seoul')$$,'user with only an ended space can create a new space');
select is((select (public.my_spaces('00000000-0000-0000-0000-000000000042'))->'active' is not null and (public.my_spaces('00000000-0000-0000-0000-000000000042'))->'ended' is not null),true,'both active and ended are returned');
select lives_ok($$select public.ack_ended_notice('00000000-0000-0000-0000-000000000042')$$,'ack notice');
select is(public.my_spaces('00000000-0000-0000-0000-000000000042')->'ended','null'::jsonb,'acked notices are hidden (all older ones too)');
select * from finish();
rollback;
