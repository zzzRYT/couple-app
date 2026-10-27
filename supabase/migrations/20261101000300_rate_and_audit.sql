-- rollback: Restore a verified backup of quota rows before removing these tables and functions; deleting them resets daily limits.
create function public.app_now() returns timestamptz language sql stable set search_path = '' as $$ select now(); $$;
create table public.daily_request_count (
  space_id uuid not null references public.couple_space(id) on delete cascade,
  local_date date not null, count integer not null default 0 check (count >= 0), primary key (space_id,local_date)
);
create table public.daily_request_reservation (
  request_id uuid primary key, space_id uuid not null references public.couple_space(id) on delete cascade,
  local_date date not null, status text not null check (status in ('reserved','succeeded','released')),
  created_at timestamptz not null default now()
);
alter table public.daily_request_count enable row level security;
alter table public.daily_request_reservation enable row level security;
create function public.reserve_daily_request(target_space uuid, request_id uuid, request_limit integer default 3) returns void
language plpgsql security definer set search_path = '' as $$
declare local_day date; used integer; reserved integer; existing public.daily_request_reservation%rowtype;
begin
  if request_limit < 1 or request_limit > 3 then raise exception 'INVALID_LIMIT'; end if;
  select (public.app_now() at time zone time_zone)::date into local_day from public.couple_space where id=target_space and status='active';
  if local_day is null then raise exception 'SPACE_NOT_ACTIVE'; end if;
  perform pg_advisory_xact_lock(hashtextextended(target_space::text || ':' || local_day::text,0));
  select * into existing from public.daily_request_reservation r where r.request_id=reserve_daily_request.request_id;
  if found then
    if existing.space_id = target_space and existing.status='reserved' then return; end if;
    raise exception 'REQUEST_ALREADY_USED';
  end if;
  select coalesce((select c.count from public.daily_request_count c where c.space_id=target_space and c.local_date=local_day),0) into used;
  select count(*) into reserved from public.daily_request_reservation r where r.space_id=target_space and r.local_date=local_day and r.status='reserved';
  if used + reserved >= request_limit then raise exception 'DAILY_LIMIT_REACHED'; end if;
  insert into public.daily_request_reservation(request_id,space_id,local_date,status) values (request_id,target_space,local_day,'reserved');
end $$;
create function public.finalize_daily_request(target_request uuid, succeeded boolean) returns void
language plpgsql security definer set search_path = '' as $$
declare reservation public.daily_request_reservation%rowtype;
begin
  select * into reservation from public.daily_request_reservation where request_id=target_request for update;
  if not found then raise exception 'RESERVATION_NOT_FOUND'; end if;
  if reservation.status <> 'reserved' then return; end if;
  perform pg_advisory_xact_lock(hashtextextended(reservation.space_id::text || ':' || reservation.local_date::text,0));
  if succeeded then
    insert into public.daily_request_count(space_id,local_date,count) values(reservation.space_id,reservation.local_date,1)
      on conflict (space_id,local_date) do update set count=public.daily_request_count.count+1;
  end if;
  update public.daily_request_reservation set status=case when succeeded then 'succeeded' else 'released' end where request_id=target_request;
end $$;
revoke all on function public.reserve_daily_request(uuid,uuid,integer), public.finalize_daily_request(uuid,boolean) from public, anon, authenticated;
grant execute on function public.reserve_daily_request(uuid,uuid,integer), public.finalize_daily_request(uuid,boolean) to service_role;
