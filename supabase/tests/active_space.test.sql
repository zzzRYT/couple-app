begin;
select plan(3);
insert into auth.users (id,aud,role,email) values ('00000000-0000-0000-0000-000000000011','authenticated','authenticated','active@example.invalid');
insert into public.couple_space (id,anniversary_date) values
 ('10000000-0000-0000-0000-000000000011','2025-01-01'),
 ('10000000-0000-0000-0000-000000000012','2025-01-01');
insert into public.space_member (space_id,user_id) values ('10000000-0000-0000-0000-000000000011','00000000-0000-0000-0000-000000000011');
select throws_ok($$insert into public.space_member (space_id,user_id) values ('10000000-0000-0000-0000-000000000012','00000000-0000-0000-0000-000000000011')$$,'23505',null,'one active space per user');
update public.space_member set space_active=false where space_id='10000000-0000-0000-0000-000000000011';
select lives_ok($$insert into public.space_member (space_id,user_id) values ('10000000-0000-0000-0000-000000000012','00000000-0000-0000-0000-000000000011')$$,'ended membership does not prevent a new active space');
select is((select count(*) from public.space_member where space_active),1::bigint,'one active membership remains');
select * from finish();
rollback;
