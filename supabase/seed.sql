-- Seed data is added by later tasks.
-- Local mail goes to Mailpit, so the local stack runs with email sign-up open. Production stays closed until mail is connected.
update public.app_settings set value = 'true' where key = 'auth_email_enabled';
-- The development quick-login accounts. Email confirmation is on, so they can no longer sign themselves up on first use. Local stack only.
insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change, email_change_token_new, email_change_token_current, phone_change, phone_change_token, reauthentication_token)
select '00000000-0000-0000-0000-000000000000', id, 'authenticated', 'authenticated', email, extensions.crypt('local-only-aroom-pair-test-2026', extensions.gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', '', '', '', '', ''
from (values ('00000000-0000-4000-8000-00000000a001'::uuid, 'paira@example.test'), ('00000000-0000-4000-8000-00000000a002'::uuid, 'pairb@example.test')) as pair(id, email);
insert into auth.identities (provider_id, user_id, identity_data, provider, created_at, updated_at, last_sign_in_at)
select id::text, id, jsonb_build_object('sub', id::text, 'email', email, 'email_verified', true), 'email', now(), now(), now() from auth.users where email in ('paira@example.test', 'pairb@example.test');
