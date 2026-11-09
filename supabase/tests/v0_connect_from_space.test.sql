-- V0-F02-AC-12, V0-F02-AC-13: the existing calls the app chains to move a person from a space they hold alone into the partner's
-- space (V0-10). No new server contract: preview → end_space → accept_invitation → ack_ended_notice.
begin;
select plan(14);
insert into auth.users (id,aud,role,email) values
 ('00000000-0000-0000-0000-0000000000c1','authenticated','authenticated','move-a@example.invalid'),
 ('00000000-0000-0000-0000-0000000000c2','authenticated','authenticated','move-b@example.invalid');
create temp table ctx (k text primary key, v uuid);
-- Both started alone ("새로 시작하기" twice) and each issued a code.
insert into ctx select 'a', ((public.create_space('00000000-0000-0000-0000-0000000000c1','2025-06-29','Asia/Seoul'))->>'spaceId')::uuid;
insert into ctx select 'b', ((public.create_space('00000000-0000-0000-0000-0000000000c2','2025-07-01','Asia/Seoul'))->>'spaceId')::uuid;
select lives_ok($$select public.create_invitation('00000000-0000-0000-0000-0000000000c1',(select v from ctx where k='a'),'hash-move-a')$$,'A issues a code');
select lives_ok($$select public.create_invitation('00000000-0000-0000-0000-0000000000c2',(select v from ctx where k='b'),'hash-move-b')$$,'B issues a code');
-- What the app sees before moving (4)
select is(public.preview_invitation('00000000-0000-0000-0000-0000000000c2','hash-move-a')->'error'->>'code','ALREADY_IN_SPACE','V0-F02-AC-12 a valid partner code answers ALREADY_IN_SPACE to a person holding a space');
select is(public.preview_invitation('00000000-0000-0000-0000-0000000000c2','hash-move-unknown')->'error'->>'code','INVITE_INVALID','a wrong code is reported before the space check, so the app never ends a space for it');
select is(public.accept_invitation('00000000-0000-0000-0000-0000000000c2','hash-move-a')->'error'->>'code','ALREADY_IN_SPACE','accepting while holding a space is refused');
select is((select status from public.invitation where token_hash='hash-move-a'),'active','the refused attempt keeps the partner code usable');
-- Move: end the waiting space, then accept (5)
select is(public.end_space('00000000-0000-0000-0000-0000000000c2',(select v from ctx where k='b'),'ended')->>'status','ended','B ends the space held alone');
select is((select status from public.invitation where token_hash='hash-move-b'),'revoked','ending revokes the code B issued, which is why the app refuses its own code first');
select is(public.accept_invitation('00000000-0000-0000-0000-0000000000c2','hash-move-a')->>'memberCount','2','V0-F02-AC-12 B joins A with the same code');
select is(public.my_spaces('00000000-0000-0000-0000-0000000000c2')->'ended'->>'by','me','the end leaves a notice for B');
select lives_ok($$select public.ack_ended_notice('00000000-0000-0000-0000-0000000000c2')$$,'B acknowledges the notice');
-- Both land in one connected space (2)
select is(public.my_spaces('00000000-0000-0000-0000-0000000000c2'),jsonb_build_object('active',jsonb_build_object('spaceId',(select v from ctx where k='a')),'ended',null),'B opens A space with no ended screen');
select is(public.my_spaces('00000000-0000-0000-0000-0000000000c1')->'active'->>'spaceId',(select v from ctx where k='a')::text,'A stays in the same space, now with two members');
-- V0-F02-AC-13: when the code dies between the end and the join, the person has no space and no notice after the ack (1)
insert into auth.users (id,aud,role,email) values ('00000000-0000-0000-0000-0000000000c3','authenticated','authenticated','move-c@example.invalid');
insert into ctx select 'c', ((public.create_space('00000000-0000-0000-0000-0000000000c3','2025-08-01','Asia/Seoul'))->>'spaceId')::uuid;
select public.end_space('00000000-0000-0000-0000-0000000000c3',(select v from ctx where k='c'),'ended');
select public.accept_invitation('00000000-0000-0000-0000-0000000000c3','hash-move-a');
select public.ack_ended_notice('00000000-0000-0000-0000-0000000000c3');
select is(public.my_spaces('00000000-0000-0000-0000-0000000000c3'),'{"active":null,"ended":null}'::jsonb,'V0-F02-AC-13 a failed join after the end leads to onboarding, not the ended screen');
select * from finish();
rollback;
