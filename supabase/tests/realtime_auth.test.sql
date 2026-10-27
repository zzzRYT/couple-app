begin;
select plan(4);
insert into auth.users (id,aud,role,email) values
 ('00000000-0000-0000-0000-000000000071','authenticated','authenticated','rt-a@example.invalid'),
 ('00000000-0000-0000-0000-000000000073','authenticated','authenticated','rt-c@example.invalid');
insert into public.couple_space (id,anniversary_date) values ('10000000-0000-0000-0000-000000000071','2025-01-01');
insert into public.space_member (space_id,user_id) values ('10000000-0000-0000-0000-000000000071','00000000-0000-0000-0000-000000000071');
insert into realtime.messages (topic,extension,event,payload,private) values ('space:10000000-0000-0000-0000-000000000071','broadcast','member','{"kind":"joined"}',true);
set local role authenticated;
select set_config('realtime.topic','space:10000000-0000-0000-0000-000000000071',true);
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000071',true);
select is((select count(*) from realtime.messages where topic='space:10000000-0000-0000-0000-000000000071'),1::bigint,'member can join the space channel');
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000073',true);
select is((select count(*) from realtime.messages where topic='space:10000000-0000-0000-0000-000000000071'),0::bigint,'third party cannot join the space channel');
select set_config('realtime.topic','space:not-a-uuid',true);
select is((select count(*) from realtime.messages),0::bigint,'malformed topics are refused');
select throws_ok($$insert into realtime.messages (topic,extension,event,payload,private) values ('space:10000000-0000-0000-0000-000000000071','broadcast','x','{}',true)$$,'42501',null,'clients cannot broadcast to the space channel');
select * from finish();
rollback;
