-- Seed data is added by later tasks.
-- Local mail goes to Mailpit, so the local stack runs with email sign-up open. Production stays closed until mail is connected.
update public.app_settings set value = 'true' where key = 'auth_email_enabled';
