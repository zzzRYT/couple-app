-- deletion-policy: Attempt rows only throttle code guessing; rows older than one day may be deleted at any time without changing behavior.
create table public.app_settings (key text primary key, value jsonb not null);
alter table public.app_settings enable row level security;
insert into public.app_settings (key, value) values ('invite_attempt_limit', '10'), ('invite_attempt_window_seconds', '3600');
create function public.setting_int(name text, fallback integer) returns integer
language sql stable security definer set search_path = '' as $$
  select coalesce((select (value #>> '{}')::integer from public.app_settings where key=name), fallback);
$$;
create table public.invitation_attempt (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  attempted_at timestamptz not null default public.app_now()
);
create index invitation_attempt_recent on public.invitation_attempt (user_id, attempted_at);
alter table public.invitation_attempt enable row level security;

-- Failed code checks per user per window; while locked, even a valid code is refused.
create function public.invitation_lock(actor uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare window_s integer := public.setting_int('invite_attempt_window_seconds', 3600); failures integer; oldest timestamptz;
begin
  perform pg_advisory_xact_lock(hashtextextended('invite:' || actor::text, 0));
  select count(*), min(attempted_at) into failures, oldest from public.invitation_attempt
    where user_id=actor and attempted_at > public.app_now() - make_interval(secs => window_s);
  if failures >= public.setting_int('invite_attempt_limit', 10) then
    return jsonb_build_object('error', jsonb_build_object('code', 'RATE_LIMITED',
      'retryAfterSeconds', greatest(1, ceil(extract(epoch from oldest + make_interval(secs => window_s) - public.app_now())))::integer,
      'unlockAt', oldest + make_interval(secs => window_s)));
  end if;
  return null;
end $$;
create function public.record_invitation_result(actor uuid, result jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
begin
  if result->'error'->>'code' in ('INVITE_INVALID','INVITE_EXPIRED','INVITE_USED') then
    insert into public.invitation_attempt (user_id) values (actor);
  end if;
  return result;
end $$;
alter function public.preview_invitation(uuid,text) rename to preview_invitation_unthrottled;
alter function public.accept_invitation(uuid,text) rename to accept_invitation_unthrottled;
create function public.preview_invitation(actor uuid, hash text) returns jsonb
language sql security definer set search_path = '' as $$
  select coalesce(public.invitation_lock(actor), public.record_invitation_result(actor, public.preview_invitation_unthrottled(actor, hash)));
$$;
create function public.accept_invitation(actor uuid, hash text) returns jsonb
language sql security definer set search_path = '' as $$
  select coalesce(public.invitation_lock(actor), public.record_invitation_result(actor, public.accept_invitation_unthrottled(actor, hash)));
$$;
revoke all on function public.setting_int(text,integer), public.invitation_lock(uuid), public.record_invitation_result(uuid,jsonb),
  public.preview_invitation_unthrottled(uuid,text), public.accept_invitation_unthrottled(uuid,text),
  public.preview_invitation(uuid,text), public.accept_invitation(uuid,text) from public, anon, authenticated;
grant execute on function public.preview_invitation(uuid,text), public.accept_invitation(uuid,text) to service_role;
