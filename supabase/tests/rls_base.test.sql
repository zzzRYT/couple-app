begin;
select plan(9);
insert into auth.users (id, aud, role, email) values
 ('00000000-0000-0000-0000-000000000001','authenticated','authenticated','a@example.invalid'),
 ('00000000-0000-0000-0000-000000000002','authenticated','authenticated','b@example.invalid'),
 ('00000000-0000-0000-0000-000000000003','authenticated','authenticated','c@example.invalid');
insert into public.couple_space (id, anniversary_date) values ('10000000-0000-0000-0000-000000000001','2025-01-01');
insert into public.space_member (space_id,user_id) values
 ('10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001'),
 ('10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000002');
set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',true);
select is((select count(*) from public.couple_space),1::bigint,'A reads active space');
select is((select count(*) from public.space_member),2::bigint,'A reads both members');
select lives_ok($$update public.space_member set ai_consent_state='granted' where user_id='00000000-0000-0000-0000-000000000001'$$,'A can change own consent');
with updated as (update public.space_member set ai_consent_state='granted' where user_id='00000000-0000-0000-0000-000000000002' returning 1) select is((select count(*) from updated),0::bigint,'A cannot change B consent');
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000002',true);
select is((select count(*) from public.couple_space),1::bigint,'B reads active space');
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000003',true);
select is((select count(*) from public.couple_space),0::bigint,'C cannot read space');
select is((select count(*) from public.space_member),0::bigint,'C cannot read members');
with updated as (update public.couple_space set anniversary_date='2025-02-01' returning 1) select is((select count(*) from updated),0::bigint,'C cannot update space');
reset role;
update public.couple_space set status='ended' where id='10000000-0000-0000-0000-000000000001';
set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',true);
select is((select count(*) from public.couple_space),0::bigint,'ended space is hidden from A');
select * from finish();
rollback;
