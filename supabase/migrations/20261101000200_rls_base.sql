-- rollback: Restore the previous policies from a verified migration backup; do not expose shared tables without RLS.
create function public.is_space_active(target uuid) returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.couple_space where id=target and status='active');
$$;
create function public.is_space_member(target uuid) returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.space_member m join public.couple_space s on s.id=m.space_id
    where m.space_id=target and m.user_id=auth.uid() and m.space_active and s.status='active');
$$;
revoke all on function public.is_space_active(uuid), public.is_space_member(uuid) from public;
grant execute on function public.is_space_active(uuid), public.is_space_member(uuid) to authenticated;
alter table public.user_profile enable row level security;
alter table public.couple_space enable row level security;
alter table public.space_member enable row level security;
alter table public.idempotency_key enable row level security;
alter table public.space_lifecycle_event enable row level security;
create policy profile_read on public.user_profile for select to authenticated using (user_id=auth.uid());
create policy profile_insert on public.user_profile for insert to authenticated with check (user_id=auth.uid());
create policy profile_update on public.user_profile for update to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());
create policy space_read on public.couple_space for select to authenticated using (public.is_space_member(id));
create policy space_update on public.couple_space for update to authenticated using (public.is_space_member(id)) with check (public.is_space_member(id));
create policy member_read on public.space_member for select to authenticated using (public.is_space_member(space_id));
create policy member_update on public.space_member for update to authenticated using (user_id=auth.uid() and public.is_space_member(space_id)) with check (user_id=auth.uid() and public.is_space_member(space_id));
create policy event_read on public.space_lifecycle_event for select to authenticated using (public.is_space_member(space_id));
revoke update on public.couple_space, public.space_member from authenticated;
grant update (anniversary_date, updated_at) on public.couple_space to authenticated;
grant update (ai_consent_state, ai_consent_at, ai_consent_text_version, ai_consent_revoked_at) on public.space_member to authenticated;
