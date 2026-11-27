-- deletion-policy: A profile photo is one object at profile-photo/<userId>/<uuid>.jpg. Replacing or removing it deletes the old object (a failed delete can orphan one under the same prefix), and account deletion purges the whole <userId>/ prefix before the auth user is deleted; the auth.users cascade drops photo_path with the user_profile row.
-- rollback: drop set_profile_photo and space_member_photos, drop user_profile.photo_path, then empty and delete the profile-photo bucket (the photos are lost).
alter table public.user_profile
  add column photo_path text,
  add constraint profile_photo_path check (photo_path is null or (split_part(photo_path,'/',1)=user_id::text
    and photo_path ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.jpg$'));

-- No storage.objects policy: only the service role reads and writes, and the app receives signed URLs from the snapshot.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('profile-photo','profile-photo',false,1048576,array['image/jpeg']);

create function public.set_profile_photo(actor uuid, p_path text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare active_space uuid; old_path text;
begin
  perform public.guard_account(actor);
  if exists (select 1 from public.user_profile p where p.user_id=actor and p.status='deleting') then raise exception 'ACCOUNT_DELETING'; end if;
  if p_path is not null and (split_part(p_path,'/',1) <> actor::text
    or p_path !~ '^[0-9a-f-]{36}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.jpg$') then raise exception 'INVALID_REQUEST'; end if;
  select p.photo_path into old_path from public.user_profile p where p.user_id=actor for update;
  insert into public.user_profile (user_id, photo_path) values (actor, p_path)
    on conflict (user_id) do update set photo_path=excluded.photo_path;
  select m.space_id into active_space from public.space_member m where m.user_id=actor and m.space_active limit 1;
  if active_space is not null then perform public.notify_space(active_space,'member',jsonb_build_object('kind','profile')); end if;
  return jsonb_build_object('previous', old_path);
end $$;

-- Paths only; the spaces function signs them, so a non-member (or an ended space) gets an empty object.
create function public.space_member_photos(actor uuid, target uuid) returns jsonb
language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_object_agg(m.user_id::text, p.photo_path), '{}'::jsonb)
  from public.space_member m join public.user_profile p on p.user_id=m.user_id
  where m.space_id=target and m.space_active and p.photo_path is not null
    and exists (select 1 from public.space_member mine join public.couple_space s on s.id=mine.space_id
      where mine.space_id=target and mine.user_id=actor and mine.space_active and s.status='active');
$$;

revoke all on function public.set_profile_photo(uuid,text), public.space_member_photos(uuid,uuid) from public,anon,authenticated;
grant execute on function public.set_profile_photo(uuid,text), public.space_member_photos(uuid,uuid) to service_role;
