-- The App Review path (docs/app-store/README.md): an operator extends one demo invite from the SQL editor. App code cannot.
begin;
select plan(8);
insert into auth.users (id,aud,role,email) values
 ('00000000-0000-0000-0000-000000000081','authenticated','authenticated','review-demo@example.invalid'),
 ('00000000-0000-0000-0000-000000000082','authenticated','authenticated','review-a@example.invalid'),
 ('00000000-0000-0000-0000-000000000083','authenticated','authenticated','review-b@example.invalid');
create temp table ctx (k text primary key, v uuid);
grant select on ctx to authenticated;
insert into ctx select 'space', ((public.create_space('00000000-0000-0000-0000-000000000081','2025-06-29','Asia/Seoul'))->>'spaceId')::uuid;
select public.create_invitation('00000000-0000-0000-0000-000000000081',(select v from ctx where k='space'),'hash-review');
-- issuing never gets longer than 24 hours
select is((select expires_at - created_at from public.invitation where token_hash='hash-review'),interval '24 hours','the app path still issues 24 hour codes');
-- signed-in people cannot extend a code, not even the member who issued it
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-000000000081","role":"authenticated"}',true);
select lives_ok($$update public.invitation set expires_at=now() + interval '30 days' where token_hash='hash-review'$$,'no policy lets the update reach the row');
reset role;
select is((select expires_at - created_at from public.invitation where token_hash='hash-review'),interval '24 hours','the issuing member cannot extend a code');
select ok(not has_function_privilege('authenticated','public.create_invitation(uuid,uuid,text)','execute'),'clients cannot issue codes directly');
-- the operator statement from the runbook, after the normal 24 hours would have passed
update public.invitation set expires_at=public.app_now() + interval '30 days'
  where created_by_user_id='00000000-0000-0000-0000-000000000081' and status='active';
create or replace function public.app_now() returns timestamptz language sql stable set search_path = '' as $$ select now() + interval '2 days' $$;
select is(public.preview_invitation('00000000-0000-0000-0000-000000000082','hash-review')->>'anniversaryDate','2025-06-29','an extended code still previews after 24 hours');
select is(public.accept_invitation('00000000-0000-0000-0000-000000000082','hash-review')->>'memberCount','2','an extended code joins the demo space');
select is(public.accept_invitation('00000000-0000-0000-0000-000000000083','hash-review')->'error'->>'code','INVITE_USED','an extended code is still single use');
create or replace function public.app_now() returns timestamptz language sql stable set search_path = '' as $$ select now() + interval '31 days' $$;
select is(public.preview_invitation('00000000-0000-0000-0000-000000000083','hash-review')->'error'->>'code','INVITE_USED','a used code stays used after its extended expiry');
select * from finish();
rollback;
