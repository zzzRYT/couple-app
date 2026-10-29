-- rollback: Restore a verified database backup before removing this RPC; room mode versions are shared history.
create function public.update_room_mode(actor uuid, target uuid, new_mode text, new_time_zone text, expected_version integer)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare space public.couple_space%rowtype; current public.room_theme_version%rowtype; next_theme jsonb; created public.room_theme_version%rowtype;
begin
  if new_mode not in ('day','night','follow_time') or length(new_time_zone) > 64 or not exists (select 1 from pg_catalog.pg_timezone_names where name=new_time_zone) then
    raise exception 'INVALID_REQUEST';
  end if;
  select * into space from public.couple_space where id=target and status='active' for update;
  if not found or not exists (select 1 from public.space_member where space_id=target and user_id=actor and space_active) then raise exception 'NOT_FOUND'; end if;
  perform public.ensure_initial_room(target);
  select v.* into current from public.room_theme t join public.room_theme_version v on v.id=t.current_version_id where t.space_id=target for update of t;
  if not found then raise exception 'NOT_FOUND'; end if;
  if current.version_number <> expected_version then raise exception 'VERSION_CONFLICT'; end if;
  next_theme := jsonb_set(jsonb_set(current.room_theme_document, '{mode}', to_jsonb(new_mode), true), '{timeZone}', to_jsonb(new_time_zone), true);
  update public.couple_space set time_zone=new_time_zone, updated_at=public.app_now() where id=target;
  created := public.append_room_version(actor, target, current.scene_document, current.room_presentation, next_theme, 'room_mode', '{}'::jsonb);
  return jsonb_build_object('versionNumber', created.version_number, 'mode', new_mode, 'timeZone', new_time_zone);
end $$;
revoke all on function public.update_room_mode(uuid,uuid,text,text,integer) from public, anon, authenticated;
grant execute on function public.update_room_mode(uuid,uuid,text,text,integer) to service_role;
