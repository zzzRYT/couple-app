-- T151 (DB part): accepting transaction, immediate purge, notices, fingerprints, profile removal and re-signup.
begin;
select plan(38);
insert into auth.users (id,aud,role,email) values
 ('00000000-0000-0000-0000-0000000000a1','authenticated','authenticated','acct-a@example.invalid'),
 ('00000000-0000-0000-0000-0000000000a2','authenticated','authenticated','acct-b@example.invalid'),
 ('00000000-0000-0000-0000-0000000000a3','authenticated','authenticated','acct-solo@example.invalid'),
 ('00000000-0000-0000-0000-0000000000a4','authenticated','authenticated','acct-none@example.invalid');
create temp table ctx (k text primary key, v uuid);
insert into ctx select 'pair', ((public.create_space('00000000-0000-0000-0000-0000000000a1','2025-01-01','Asia/Seoul'))->>'spaceId')::uuid;
select public.create_invitation('00000000-0000-0000-0000-0000000000a1',(select v from ctx where k='pair'),'acct-hash');
select public.accept_invitation('00000000-0000-0000-0000-0000000000a2','acct-hash');
select public.acquire_session('00000000-0000-0000-0000-0000000000a1',(select v from ctx where k='pair'));
insert into public.ai_consent_event (space_id,user_id,state,notice_version) values ((select v from ctx where k='pair'),'00000000-0000-0000-0000-0000000000a1','granted','ai-overseas-v1');
update public.space_member set ai_consent_state='granted', ai_consent_at=now(), ai_consent_text_version='ai-overseas-v1' where user_id='00000000-0000-0000-0000-0000000000a1';
insert into public.decoration_request (space_id,requested_by_user_id,base_version_number,prompt_text,state) values ((select v from ctx where k='pair'),'00000000-0000-0000-0000-0000000000a1',1,'in flight','queued');
insert into public.report (space_id,reporter_user_id,target,reason,detail) values ((select v from ctx where k='pair'),'00000000-0000-0000-0000-0000000000a2','partner','harass','secret detail');
update public.user_profile set locale='ko-KR', ui_theme='dark', time_zone='Asia/Seoul' where user_id='00000000-0000-0000-0000-0000000000a1';
insert into ctx select 'solo', ((public.create_space('00000000-0000-0000-0000-0000000000a3','2025-02-02','Asia/Seoul'))->>'spaceId')::uuid;
select public.create_invitation('00000000-0000-0000-0000-0000000000a3',(select v from ctx where k='solo'),'acct-solo-hash');

-- ① accepting transaction for a member of an active shared space
select is(public.begin_account_deletion('00000000-0000-0000-0000-0000000000a1','email','app',null,null),'{"state":"requested"}'::jsonb,'accepted with the fixed body');
select is((select status from public.couple_space where id=(select v from ctx where k='pair')),'ended','the shared space ends in the same transaction');
select is((select ended_reason from public.couple_space where id=(select v from ctx where k='pair')),'account_deletion','with the account_deletion reason');
select is((select ended_by_user_id from public.couple_space where id=(select v from ctx where k='pair')),'00000000-0000-0000-0000-0000000000a1'::uuid,'and the deleter as ended_by');
select is((select count(*) from public.space_member where space_id=(select v from ctx where k='pair') and space_active),0::bigint,'both people lose access at once');
select is((select purge_after <= now() from public.couple_space where id=(select v from ctx where k='pair')),true,'the space is due for purge now, not in 30 days');
select is((select kind from public.space_end_notice where user_id='00000000-0000-0000-0000-0000000000a2'),'account_deleted','only the partner gets the account_deleted notice');
select is((select count(*) from public.space_end_notice where user_id='00000000-0000-0000-0000-0000000000a1'),0::bigint,'the deleter gets no notice');
select is((select status from public.prompt_session where space_id=(select v from ctx where k='pair')),'released','the prompt lease is released');
select is((select state from public.decoration_request where space_id=(select v from ctx where k='pair')),'cancelled','generation in flight is dropped');
select is((select status || ':' || coalesce(locale,'-') || ':' || ui_theme || ':' || time_zone from public.user_profile where user_id='00000000-0000-0000-0000-0000000000a1'),'deleting:-:system:UTC','profile personal fields are cleared at once');
select is((select count(*) from public.ai_consent_event where user_id='00000000-0000-0000-0000-0000000000a1'),0::bigint,'consent events are deleted with the account');
select is((select count(*) from public.space_member where user_id='00000000-0000-0000-0000-0000000000a1' and ai_consent_state <> 'not_given'),0::bigint,'consent state is cleared on every membership');
select is(public.account_blocked('00000000-0000-0000-0000-0000000000a1'),true,'every later request of the deleter is refused');
select is(public.account_blocked('00000000-0000-0000-0000-0000000000a2'),false,'the partner is not blocked');
-- The whole test is one transaction, so drop the deletion's own exemption before checking how others see the account.
select set_config('app.deleting_actor', '', true);
select throws_ok($$select public.require_member('00000000-0000-0000-0000-0000000000a1',(select v from ctx where k='pair'))$$,'P0001','ACCOUNT_DELETING','a change by the deleter is refused with ACCOUNT_DELETING');
select throws_ok($$select public.create_space('00000000-0000-0000-0000-0000000000a1','2025-04-04','Asia/Seoul')$$,'P0001','ACCOUNT_DELETING','the deleter cannot start a new space');
select throws_ok($$select public.accept_invitation('00000000-0000-0000-0000-0000000000a1','acct-solo-hash')$$,'P0001','ACCOUNT_DELETING','nor join one with an invite code');
-- ⑦ idempotent
select is(public.begin_account_deletion('00000000-0000-0000-0000-0000000000a1','email','app',null,null),'{"state":"requested"}'::jsonb,'a retry answers the same');
select is((select count(*) from public.account_deletion where user_id='00000000-0000-0000-0000-0000000000a1'),1::bigint,'and keeps one row');
select throws_ok($$select public.begin_account_deletion('00000000-0000-0000-0000-0000000000a4','google','app',null,null)$$,'P0001','INVALID_REQUEST','unknown providers are refused');

-- the runner: lease, immediate purge, partner notice survives, reports become fingerprints
select ok(public.claim_account_deletion('00000000-0000-0000-0000-0000000000a1',now()) is not null,'the first runner gets the lease');
select ok(public.claim_account_deletion('00000000-0000-0000-0000-0000000000a1',now()) is null,'a second runner does not');
select is(public.close_spaces_for_deletion('00000000-0000-0000-0000-0000000000a1'),jsonb_build_array((select v from ctx where k='pair')),'the spaces to purge are listed');
select is(public.purge_space((select v from ctx where k='pair'),'infinity'),true,'the shared space is hard-deleted right away');
select is((select count(*) from public.couple_space where id=(select v from ctx where k='pair')),0::bigint,'no space row remains');
select is((select count(*) from public.space_end_notice where user_id='00000000-0000-0000-0000-0000000000a2' and space_id is null and by_user_id is null and kind='account_deleted' and acked_at is null),1::bigint,'the partner notice survives without the space or the deleter');
select is(public.my_spaces('00000000-0000-0000-0000-0000000000a2')->'ended'->>'kind','account_deleted','the partner still sees "your partner deleted their account" once');
select is((select count(*) from public.report_fingerprint where target='partner' and reason='harass'),1::bigint,'the report left a content-free fingerprint');
select is((select count(*) from public.report where detail='secret detail'),0::bigint,'the report itself is gone');
select is(public.advance_account_deletion('00000000-0000-0000-0000-0000000000a1','requested','space_ended',null),true,'the step advances');
select is(public.advance_account_deletion('00000000-0000-0000-0000-0000000000a1','requested','space_ended',null),false,'a stale transition is a no-op');
select throws_ok($$select public.finish_account_deletion('00000000-0000-0000-0000-0000000000a1')$$,'P0001','INVALID_REQUEST','finish runs only after the provider step');
select public.advance_account_deletion('00000000-0000-0000-0000-0000000000a1','space_ended','provider_revoked',null);
select public.finish_account_deletion('00000000-0000-0000-0000-0000000000a1');
select is((select count(*) from public.user_profile where user_id='00000000-0000-0000-0000-0000000000a1'),0::bigint,'no profile shell remains');
select is((select count(*) from public.space_lifecycle_event where actor_user_id='00000000-0000-0000-0000-0000000000a1'),0::bigint,'no event names the deleter');
-- ⑩ nothing blocks deleting the auth user (what deleteUser does), and ⑥ the same login signs up again as a new, empty account
delete from auth.users where id='00000000-0000-0000-0000-0000000000a1';
insert into auth.users (id,aud,role,email) values ('00000000-0000-0000-0000-0000000000a9','authenticated','authenticated','acct-a@example.invalid');
select is(public.my_spaces('00000000-0000-0000-0000-0000000000a9'),'{"active":null,"ended":null}'::jsonb,'the new account has no space and no notice');

-- ② a person alone in a space with a pending invite: the code is revoked and nobody is notified
select public.begin_account_deletion('00000000-0000-0000-0000-0000000000a3','email','app',null,null);
select is((select string_agg(status, ',') from public.invitation where space_id=(select v from ctx where k='solo')),'revoked','the pending invite code is revoked');
select is((select count(*) from public.space_end_notice where space_id=(select v from ctx where k='solo')),0::bigint,'a solo space sends no notice');
select * from finish();
rollback;
