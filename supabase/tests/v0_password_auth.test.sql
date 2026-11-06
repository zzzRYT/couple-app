-- S7: the attempt counter, the closed email sign-up and the stored Apple token.
begin;
select plan(19);
create temp table key (v text);
insert into key values (repeat('a', 64));

select is((select value from public.app_settings where key='password_attempt_limit'),'5'::jsonb,'V0-F15-AC-03 five attempts');
select is((select value from public.app_settings where key='password_lock_seconds'),'600'::jsonb,'V0-F15-AC-03 ten minutes');
select is(public.password_attempt_take((select v from key)),'open','attempt 1');
select is(public.password_attempt_take((select v from key)),'open','attempt 2');
select is(public.password_attempt_take((select v from key)),'open','attempt 3');
select is(public.password_attempt_take((select v from key)),'open','attempt 4');
select is(public.password_attempt_take((select v from key)),'last','attempt 5 is the last one');
select is(public.password_attempt_take((select v from key)),'locked','V0-F15-AC-03 the sixth is refused');
update public.password_attempt set locked_until=now() - interval '1 second';
select is(public.password_attempt_take((select v from key)),'open','a finished lock starts a new run');
select is((select failures from public.password_attempt),1,'the count restarted');
select public.password_attempt_refund((select v from key));
select is((select failures from public.password_attempt),0,'a refund gives the attempt back');
select public.password_attempt_clear((select v from key));
select is((select count(*) from public.password_attempt),0::bigint,'a right password clears the row');

-- V0-F15-AC-05 the trigger: email accounts need mail or the review address; Apple accounts always pass.
update public.app_settings set value='false' where key='auth_email_enabled';
select throws_ok($$insert into auth.users (id,aud,role,email,raw_app_meta_data) values ('00000000-0000-0000-0000-0000000000e1','authenticated','authenticated','closed@example.invalid','{"provider":"email"}')$$,'EMAIL_SIGNUP_CLOSED','V0-F15-AC-05 an email account is refused');
select lives_ok($$insert into auth.users (id,aud,role,email,raw_app_meta_data) values ('00000000-0000-0000-0000-0000000000e2','authenticated','authenticated','apple@privaterelay.appleid.com','{"provider":"apple"}')$$,'V0-F15-AC-05 an Apple account is not');
update public.app_settings set value='"Review@Example.invalid"' where key='review_login_email';
select lives_ok($$insert into auth.users (id,aud,role,email,raw_app_meta_data) values ('00000000-0000-0000-0000-0000000000e3','authenticated','authenticated','review@example.invalid','{"provider":"email"}')$$,'V0-F15-AC-05 the review address passes, whatever its case');

-- V0-F18-AC-01 accepting a deletion destroys the stored token; the sealed retry copy moves to account_deletion.
select public.store_apple_credential('00000000-0000-0000-0000-0000000000e2','sealed-one');
select public.store_apple_credential('00000000-0000-0000-0000-0000000000e2','sealed-two');
select is(public.apple_credential_of('00000000-0000-0000-0000-0000000000e2'),'sealed-two','the newest sign-in replaces the token');
select public.begin_account_deletion('00000000-0000-0000-0000-0000000000e2','apple','app','sealed-two',86400);
select is((select count(*) from public.apple_credential),0::bigint,'V0-F18-AC-01 the stored token is gone');
select is((select provider_credential_enc from public.account_deletion where user_id='00000000-0000-0000-0000-0000000000e2'),'sealed-two','the retry copy lasts at most a day');

select public.mark_password_prompt_seen('00000000-0000-0000-0000-0000000000e3');
select is(public.account_password_state('00000000-0000-0000-0000-0000000000e3'),'{"hasPassword": false, "promptSeen": true}'::jsonb,'the state says whether, never what');
select * from finish();
rollback;
