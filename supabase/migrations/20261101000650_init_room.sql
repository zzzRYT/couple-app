-- rollback: Restore the previous create_space by renaming create_space_only back; initial room versions already created stay valid.
-- Initial room in the same transaction as the space (T068); existing spaces are backfilled.
alter function public.create_space(uuid,date,text) rename to create_space_only;
create function public.create_space(actor uuid, anniversary date, tz text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare created jsonb := public.create_space_only(actor, anniversary, tz);
begin
  perform public.ensure_initial_room((created->>'spaceId')::uuid);
  return created;
end $$;
select public.ensure_initial_room(id) from public.couple_space;

revoke all on function public.create_space_only(uuid,date,text), public.create_space(uuid,date,text) from public, anon, authenticated;
grant execute on function public.create_space(uuid,date,text) to service_role;
