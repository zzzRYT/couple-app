-- rollback: Drop these policies to close every private space channel; no data is stored here.
create function public.can_join_space_topic(topic text) returns boolean
language plpgsql stable security definer set search_path = '' as $$
begin
  if topic !~ '^space:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then return false; end if;
  return public.is_space_member(substring(topic from 7)::uuid);
end $$;
revoke all on function public.can_join_space_topic(text) from public, anon;
grant execute on function public.can_join_space_topic(text) to authenticated;
-- Members may receive broadcasts on their space channel; only server functions (realtime.send) publish.
create policy space_channel_receive on realtime.messages for select to authenticated
  using (extension = 'broadcast' and public.can_join_space_topic(realtime.topic()));
