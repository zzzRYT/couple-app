-- rollback: Drop the four tester functions, tester_accounts table, and tester roles after removing their grants; tester list data is deleted.
create table public.tester_accounts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  added_at timestamptz not null default now(),
  added_by text not null
);
alter table public.tester_accounts enable row level security;
revoke all on public.tester_accounts from public, anon, authenticated, service_role;
create role tester_function_owner nologin noinherit bypassrls;
create role admin_tester_manager login noinherit;
grant tester_function_owner to postgres;
grant usage on schema public, auth to tester_function_owner;
grant select, insert, delete on public.tester_accounts to tester_function_owner;
grant select (id, email) on auth.users to tester_function_owner;

create function public.is_tester() returns boolean language plpgsql stable security definer set search_path = '' as $$
begin
  return exists(select 1 from public.tester_accounts where user_id = auth.uid());
end $$;
create function public.admin_list_testers() returns table(email text, added_at timestamptz) language plpgsql stable security definer set search_path = '' as $$
begin
  return query select u.email::text, t.added_at from public.tester_accounts t join auth.users u on u.id = t.user_id order by t.added_at desc;
end $$;
create function public.admin_add_tester(p_email text, p_added_by text) returns boolean language plpgsql security definer set search_path = '' as $$
declare target uuid;
begin
  if length(p_email) > 320 or length(p_added_by) > 320 or nullif(trim(p_added_by), '') is null then return false; end if;
  select id into target from auth.users where lower(email) = lower(trim(p_email));
  if target is null then return false; end if;
  insert into public.tester_accounts(user_id, added_by) values (target, p_added_by) on conflict (user_id) do nothing;
  return true;
end $$;
create function public.admin_remove_tester(p_email text) returns boolean language plpgsql security definer set search_path = '' as $$
begin
  delete from public.tester_accounts where user_id in (select id from auth.users where lower(email) = lower(trim(p_email)));
  return found;
end $$;
grant create on schema public to tester_function_owner;
-- The caller check uses auth.uid() under the existing privileged function owner.
alter function public.is_tester() owner to postgres;
alter function public.admin_list_testers() owner to tester_function_owner;
alter function public.admin_add_tester(text,text) owner to tester_function_owner;
alter function public.admin_remove_tester(text) owner to tester_function_owner;
revoke create on schema public from tester_function_owner;
revoke all on function public.is_tester(), public.admin_list_testers(), public.admin_add_tester(text,text), public.admin_remove_tester(text) from public, anon, authenticated, service_role;
grant execute on function public.is_tester() to authenticated;
grant execute on function public.admin_list_testers(), public.admin_add_tester(text,text), public.admin_remove_tester(text) to admin_tester_manager;
insert into public.tester_accounts(user_id, added_by) select id, 'migration' from auth.users where lower(email) = 'jinjinstar3@naver.com' on conflict do nothing;
