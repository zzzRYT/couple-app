begin;
select plan(21);
insert into auth.users (id,aud,role,email) values
 ('00000000-0000-0000-0000-000000000031','authenticated','authenticated','inv-a@example.invalid'),
 ('00000000-0000-0000-0000-000000000032','authenticated','authenticated','inv-b@example.invalid'),
 ('00000000-0000-0000-0000-000000000033','authenticated','authenticated','inv-c@example.invalid'),
 ('00000000-0000-0000-0000-000000000034','authenticated','authenticated','inv-d@example.invalid'),
 ('00000000-0000-0000-0000-000000000035','authenticated','authenticated','inv-e@example.invalid');
create temp table ctx (k text primary key, v uuid);
insert into ctx select 'space', ((public.create_space('00000000-0000-0000-0000-000000000031','2025-01-01','Asia/Seoul'))->>'spaceId')::uuid;
-- issue and reissue (5)
select is((public.create_invitation('00000000-0000-0000-0000-000000000031',(select v from ctx where k='space'),'hash-old'))->>'expiresAt' is not null,true,'invitation is issued with expiry');
select is((select expires_at - created_at from public.invitation where token_hash='hash-old'),interval '24 hours','expiry is fixed at 24 hours');
select lives_ok($$select public.create_invitation('00000000-0000-0000-0000-000000000031',(select v from ctx where k='space'),'hash-new')$$,'reissue succeeds');
select is((select status from public.invitation where token_hash='hash-old'),'revoked','reissue revokes the unused code');
select is((select count(*) from public.invitation where status='active' and space_id=(select v from ctx where k='space')),1::bigint,'only one active code per space');
select is(public.accept_invitation('00000000-0000-0000-0000-000000000032','hash-old')->'error'->>'code','INVITE_INVALID','revoked code is rejected');
-- forged hash (3)
select is(public.accept_invitation('00000000-0000-0000-0000-000000000032','forged')->'error'->>'code','INVITE_INVALID','forged code is rejected');
select is(public.preview_invitation('00000000-0000-0000-0000-000000000032','hash-new')->>'anniversaryDate','2025-01-01','preview shows the space date');
select is((select status from public.invitation where token_hash='hash-new'),'active','preview does not consume the code');
-- already in another active space keeps code active (6)
insert into ctx select 'other', ((public.create_space('00000000-0000-0000-0000-000000000033','2024-05-05','Asia/Seoul'))->>'spaceId')::uuid;
select is(public.accept_invitation('00000000-0000-0000-0000-000000000033','hash-new')->'error'->>'code','ALREADY_IN_SPACE','member of another active space is rejected');
select is((select status from public.invitation where token_hash='hash-new'),'active','rejected acceptance does not consume the code');
update public.couple_space set status='ended', ended_at=now(), ended_reason='ended' where id=(select v from ctx where k='other');
update public.space_member set space_active=false where space_id=(select v from ctx where k='other');
select is(public.accept_invitation('00000000-0000-0000-0000-000000000033','hash-new')->>'memberCount','2','user with only an ended space can join with the same code');
select is((select status from public.invitation where token_hash='hash-new'),'accepted','accepted code is consumed');
-- reuse (2)
select is(public.accept_invitation('00000000-0000-0000-0000-000000000034','hash-new')->'error'->>'code','INVITE_USED','used code cannot be reused');
-- full space (4)
select throws_ok($$select public.create_invitation('00000000-0000-0000-0000-000000000031',(select v from ctx where k='space'),'hash-full')$$,'P0001','SPACE_FULL','a full space cannot issue codes');
insert into public.invitation (space_id,created_by_user_id,token_hash) values ((select v from ctx where k='space'),'00000000-0000-0000-0000-000000000031','hash-third');
select is(public.accept_invitation('00000000-0000-0000-0000-000000000034','hash-third')->'error'->>'code','SPACE_FULL','a third member is rejected');
select is((select count(*) from public.space_member where space_id=(select v from ctx where k='space')),2::bigint,'space keeps two members');
-- expiry (1)
insert into ctx select 'solo', ((public.create_space('00000000-0000-0000-0000-000000000034','2025-03-03','Asia/Seoul'))->>'spaceId')::uuid;
select lives_ok($$select public.create_invitation('00000000-0000-0000-0000-000000000034',(select v from ctx where k='solo'),'hash-exp')$$,'issue code to expire');
create or replace function public.app_now() returns timestamptz language sql stable set search_path = '' as $$ select now() + interval '24 hours 1 second' $$;
select is(public.accept_invitation('00000000-0000-0000-0000-000000000035','hash-exp')->'error'->>'code','INVITE_EXPIRED','code expires after 24 hours');
-- members only issue codes and read invitations (2)
select throws_ok($$select public.create_invitation('00000000-0000-0000-0000-000000000035',(select v from ctx where k='solo'),'hash-x')$$,'P0001','NOT_FOUND','non-member cannot issue codes');
set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000035',true);
select is((select count(*) from public.invitation),0::bigint,'non-member reads no invitations');
select * from finish();
rollback;
