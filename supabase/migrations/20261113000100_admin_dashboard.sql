-- rollback: Drop public.admin_dashboard(), restore PUBLIC EXECUTE on the three existing functions below, then drop both admin roles after removing dependent grants. No application data is deleted.
create role admin_aggregate_owner nologin noinherit bypassrls;
grant admin_aggregate_owner to postgres;
create role admin_dashboard_reader login noinherit;
-- These existing routines were executable through PUBLIC. The app's client roles
-- already have explicit EXECUTE grants, which remain unchanged. Trigger routines
-- cannot be invoked as ordinary functions, but must not be granted to the reader.
revoke execute on function public.app_now(), public.set_room_version_source(), public.track_milestone_preset_request() from public;
grant usage on schema public to admin_aggregate_owner;
grant select (status) on public.user_profile, public.couple_space to admin_aggregate_owner;
grant select (deleted_at) on public.space_anniversary to admin_aggregate_owner;
grant select (target, reason, status) on public.report to admin_aggregate_owner;
grant select (target, reason) on public.report_fingerprint to admin_aggregate_owner;
grant select (state) on public.account_deletion to admin_aggregate_owner;

-- The entire breakdown is suppressed if any occupied cell has fewer than five rows.
-- This avoids leaking a small complementary cell via the published cells.
create function public.admin_dashboard() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare result jsonb;
begin
  select jsonb_build_object(
    'active_profiles', (select case when count(*) >= 5 then count(*) end from public.user_profile where status = 'active'),
    'active_anniversaries', (select case when count(*) >= 5 then count(*) end from public.space_anniversary where deleted_at is null),
    'spaces', (select case when bool_and(n >= 5) then jsonb_object_agg(status,n) end from (select status,count(*) n from public.couple_space where status in ('active','ended') group by status) x),
    'reports', (select case when bool_and(n >= 5) then jsonb_agg(jsonb_build_object('target',target,'reason',reason,'status',status,'count',n)) end from (select target,reason,status,count(*) n from public.report where target in ('partner','shared_text','room_scene') and reason in ('harass','inappropriate','privacy','other') and status in ('received','reviewed') group by target,reason,status) x),
    'fingerprints', (select case when bool_and(n >= 5) then jsonb_agg(jsonb_build_object('target',target,'reason',reason,'count',n)) end from (select target,reason,count(*) n from public.report_fingerprint where target in ('partner','shared_text','room_scene') and reason in ('harass','inappropriate','privacy','other') group by target,reason) x),
    'deletions', (select case when bool_and(n >= 5) then jsonb_object_agg(state,n) end from (select state,count(*) n from public.account_deletion where state in ('requested','space_ended','provider_revoked','auth_deleted') group by state) x)
  ) into result;
  return result;
end $$;
grant create on schema public to admin_aggregate_owner;
alter function public.admin_dashboard() owner to admin_aggregate_owner;
revoke create on schema public from admin_aggregate_owner;
revoke all on function public.admin_dashboard() from public, anon, authenticated, service_role;
grant execute on function public.admin_dashboard() to admin_dashboard_reader;
