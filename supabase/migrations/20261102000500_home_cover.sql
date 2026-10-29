-- deletion-policy: Cover rows and objects are removed with their space; prior cover objects are queued for deletion after replacement.
create table public.home_cover_photo (
  space_id uuid primary key references public.couple_space(id) on delete cascade,
  status text not null default 'none' check (status in ('none','ready')),
  current_object_path text,
  content_type text,
  byte_size bigint,
  width_px integer,
  height_px integer,
  sha256 text,
  crop jsonb,
  version bigint not null default 0,
  uploaded_by_user_id uuid references auth.users(id) on delete set null,
  uploaded_at timestamptz,
  updated_at timestamptz not null default now(),
  pending_delete jsonb not null default '[]'::jsonb,
  constraint home_cover_ready_fields check (status <> 'ready' or (current_object_path is not null and content_type = 'image/jpeg' and byte_size > 0 and crop is not null))
);
create table public.home_cover_upload (
  id uuid primary key,
  space_id uuid not null references public.couple_space(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  staging_path text not null unique,
  content_type text not null check (content_type in ('image/jpeg','image/png','image/heic')),
  byte_size bigint not null check (byte_size between 1 and 20971520),
  expires_at timestamptz not null,
  consumed_at timestamptz,
  uploaded_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.home_cover_photo enable row level security;
alter table public.home_cover_upload enable row level security;
create policy home_cover_member_read on public.home_cover_photo for select to authenticated using (public.is_space_member(space_id));
create policy home_cover_upload_owner_read on public.home_cover_upload for select to authenticated using (user_id=auth.uid() and public.is_space_member(space_id));
revoke all on public.home_cover_photo, public.home_cover_upload from anon, authenticated;
grant select on public.home_cover_photo to authenticated;
grant select on public.home_cover_upload to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('home-cover','home-cover',false,20971520,array['image/jpeg','image/png','image/heic']);
create policy home_cover_storage_read on storage.objects for select to authenticated
  using (bucket_id='home-cover' and (storage.foldername(name))[2] = 'cover' and public.is_space_member(((storage.foldername(name))[1])::uuid));
-- Writes and deletes go through the authenticated Edge Function using the service role, so raw originals can never become live cover objects.

create function public.create_home_cover_upload(target uuid, upload uuid, actor uuid, mime text, size_bytes bigint, expires timestamptz)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare object_path text;
begin
  if not public.is_space_active(target) or not exists(select 1 from public.space_member where space_id=target and user_id=actor and space_active) then return jsonb_build_object('error',jsonb_build_object('code','NOT_FOUND')); end if;
  if mime not in ('image/jpeg','image/png','image/heic') then return jsonb_build_object('error',jsonb_build_object('code','COVER_FORMAT_UNSUPPORTED')); end if;
  if size_bytes < 1 or size_bytes > 20971520 then return jsonb_build_object('error',jsonb_build_object('code','COVER_TOO_LARGE')); end if;
  object_path := target::text || '/incoming/' || upload::text;
  insert into public.home_cover_upload(id,space_id,user_id,staging_path,content_type,byte_size,expires_at)
    values(upload,target,actor,object_path,mime,size_bytes,expires);
  return jsonb_build_object('id',upload,'path',object_path);
end $$;
revoke all on function public.create_home_cover_upload(uuid,uuid,uuid,text,bigint,timestamptz) from public, anon, authenticated;
grant execute on function public.create_home_cover_upload(uuid,uuid,uuid,text,bigint,timestamptz) to service_role;

create function public.commit_home_cover(target uuid, upload uuid, actor uuid, final_path text, mime text, size_bytes bigint, width integer, height integer, digest text, crop_data jsonb, at timestamptz)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare ticket public.home_cover_upload%rowtype; previous_path text; next_version bigint;
begin
  select * into ticket from public.home_cover_upload where id=upload and space_id=target and user_id=actor and uploaded_at is not null and consumed_at is null and expires_at>at for update;
  if not found or not public.is_space_active(target) then return jsonb_build_object('error',jsonb_build_object('code','NOT_FOUND')); end if;
  if mime <> 'image/jpeg' or size_bytes < 1 or width < 1 or height < 1 then return jsonb_build_object('error',jsonb_build_object('code','COVER_INVALID_IMAGE')); end if;
  if crop_data is null or jsonb_typeof(crop_data) is distinct from 'object' or not (crop_data ?& array['x','y','width','height']) or jsonb_object_length(crop_data) <> 4 or
    jsonb_typeof(crop_data->'x') <> 'number' or jsonb_typeof(crop_data->'y') <> 'number' or jsonb_typeof(crop_data->'width') <> 'number' or jsonb_typeof(crop_data->'height') <> 'number' or
    (crop_data->>'x')::numeric < 0 or (crop_data->>'x')::numeric > 1 or (crop_data->>'y')::numeric < 0 or (crop_data->>'y')::numeric > 1 or
    (crop_data->>'width')::numeric <= 0 or (crop_data->>'height')::numeric <= 0 or (crop_data->>'x')::numeric+(crop_data->>'width')::numeric>1 or (crop_data->>'y')::numeric+(crop_data->>'height')::numeric>1 then
    return jsonb_build_object('error',jsonb_build_object('code','INVALID_REQUEST'));
  end if;
  insert into public.home_cover_photo(space_id,status,current_object_path,content_type,byte_size,width_px,height_px,sha256,crop,version,uploaded_by_user_id,uploaded_at,updated_at)
    values(target,'ready',final_path,mime,size_bytes,width,height,digest,crop_data,1,actor,at,at)
    on conflict(space_id) do update set status='ready',current_object_path=excluded.current_object_path,content_type=excluded.content_type,byte_size=excluded.byte_size,width_px=excluded.width_px,height_px=excluded.height_px,sha256=excluded.sha256,crop=excluded.crop,version=public.home_cover_photo.version+1,uploaded_by_user_id=actor,uploaded_at=at,updated_at=at,
      pending_delete=case when public.home_cover_photo.current_object_path is null then public.home_cover_photo.pending_delete else public.home_cover_photo.pending_delete || jsonb_build_array(jsonb_build_object('path',public.home_cover_photo.current_object_path,'deleteAfter',at+interval '24 hours')) end
    returning version into next_version;
  update public.home_cover_upload set consumed_at=at where id=upload;
  insert into public.space_lifecycle_event(space_id,event_type,actor_user_id,occurred_at,metadata) values(target,'cover_changed',actor,at,jsonb_build_object('version',next_version));
  perform public.notify_space(target,'home_cover',jsonb_build_object('cover_version',next_version,'change','changed'));
  return jsonb_build_object('status','ready','version',next_version,'uploadedBy',actor,'updatedAt',at);
end $$;
revoke all on function public.commit_home_cover(uuid,uuid,uuid,text,text,bigint,integer,integer,text,jsonb,timestamptz) from public, anon, authenticated;
grant execute on function public.commit_home_cover(uuid,uuid,uuid,text,text,bigint,integer,integer,text,jsonb,timestamptz) to service_role;

create function public.remove_home_cover(target uuid, actor uuid, at timestamptz) returns jsonb language plpgsql security definer set search_path = '' as $$
declare current_path text; next_version bigint;
begin
  if not public.is_space_active(target) or not exists(select 1 from public.space_member where space_id=target and user_id=actor and space_active) then return jsonb_build_object('error',jsonb_build_object('code','NOT_FOUND')); end if;
  insert into public.home_cover_photo(space_id,status,version,uploaded_by_user_id,updated_at) values(target,'none',1,actor,at)
    on conflict(space_id) do update set status='none',current_object_path=null,content_type=null,byte_size=null,width_px=null,height_px=null,sha256=null,crop=null,version=public.home_cover_photo.version+1,uploaded_by_user_id=actor,uploaded_at=at,updated_at=at,
      pending_delete=case when public.home_cover_photo.current_object_path is null then public.home_cover_photo.pending_delete else public.home_cover_photo.pending_delete || jsonb_build_array(jsonb_build_object('path',public.home_cover_photo.current_object_path,'deleteAfter',at+interval '24 hours')) end
    returning version into next_version;
  insert into public.space_lifecycle_event(space_id,event_type,actor_user_id,occurred_at,metadata) values(target,'cover_removed',actor,at,jsonb_build_object('version',next_version));
  perform public.notify_space(target,'home_cover',jsonb_build_object('cover_version',next_version,'change','removed'));
  return jsonb_build_object('status','none','version',next_version,'uploadedBy',actor,'updatedAt',at);
end $$;
revoke all on function public.remove_home_cover(uuid,uuid,timestamptz) from public, anon, authenticated;
grant execute on function public.remove_home_cover(uuid,uuid,timestamptz) to service_role;

create function public.get_home_cover_upload(target uuid, upload uuid, actor uuid, at timestamptz) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare ticket public.home_cover_upload%rowtype;
begin
  select * into ticket from public.home_cover_upload where id=upload and space_id=target and user_id=actor and uploaded_at is not null and consumed_at is null and expires_at>at;
  if not found or not public.is_space_active(target) then return jsonb_build_object('error',jsonb_build_object('code','NOT_FOUND')); end if;
  return jsonb_build_object('staging_path',ticket.staging_path,'content_type',ticket.content_type,'byte_size',ticket.byte_size);
end $$;
create function public.get_home_cover_upload_slot(target uuid, upload uuid, actor uuid, at timestamptz) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare ticket public.home_cover_upload%rowtype;
begin
  select * into ticket from public.home_cover_upload where id=upload and space_id=target and user_id=actor and uploaded_at is null and consumed_at is null and expires_at>at;
  if not found or not public.is_space_active(target) then return jsonb_build_object('error',jsonb_build_object('code','NOT_FOUND')); end if;
  return jsonb_build_object('staging_path',ticket.staging_path,'content_type',ticket.content_type,'byte_size',ticket.byte_size);
end $$;
create function public.mark_home_cover_uploaded(target uuid, upload uuid, actor uuid, at timestamptz) returns jsonb
language plpgsql security definer set search_path = '' as $$
begin
  update public.home_cover_upload set uploaded_at=at where id=upload and space_id=target and user_id=actor and consumed_at is null and uploaded_at is null and expires_at>at and public.is_space_active(target);
  if not found then return jsonb_build_object('error',jsonb_build_object('code','NOT_FOUND')); end if;
  return jsonb_build_object('uploaded',true);
end $$;
create function public.get_home_cover(target uuid, actor uuid) returns jsonb language plpgsql security definer set search_path = '' as $$
declare cover public.home_cover_photo%rowtype;
begin
  if not public.is_space_active(target) or not exists(select 1 from public.space_member where space_id=target and user_id=actor and space_active) then return jsonb_build_object('error',jsonb_build_object('code','NOT_FOUND')); end if;
  select * into cover from public.home_cover_photo where space_id=target;
  if not found then return jsonb_build_object('status','none','version',0,'uploadedBy',null,'updatedAt',null); end if;
  return jsonb_build_object('status',cover.status,'version',cover.version,'currentObjectPath',cover.current_object_path,'crop',cover.crop,'uploadedBy',cover.uploaded_by_user_id,'updatedAt',cover.updated_at);
end $$;
revoke all on function public.get_home_cover_upload(uuid,uuid,uuid,timestamptz), public.get_home_cover_upload_slot(uuid,uuid,uuid,timestamptz), public.mark_home_cover_uploaded(uuid,uuid,uuid,timestamptz), public.get_home_cover(uuid,uuid) from public, anon, authenticated;
grant execute on function public.get_home_cover_upload(uuid,uuid,uuid,timestamptz), public.get_home_cover_upload_slot(uuid,uuid,uuid,timestamptz), public.mark_home_cover_uploaded(uuid,uuid,uuid,timestamptz), public.get_home_cover(uuid,uuid) to service_role;

create function public.due_home_cover_deletes(at timestamptz, max_count integer default 100) returns table(space_id uuid, object_path text)
language sql security definer set search_path = '' as $$
  select h.space_id, item->>'path' from public.home_cover_photo h cross join lateral jsonb_array_elements(h.pending_delete) item
  where (item->>'deleteAfter')::timestamptz <= at order by (item->>'deleteAfter')::timestamptz limit max_count
$$;
create function public.finish_home_cover_delete(target uuid, object_path text) returns void language sql security definer set search_path = '' as $$
  update public.home_cover_photo set pending_delete=(select coalesce(jsonb_agg(item),'[]'::jsonb) from jsonb_array_elements(pending_delete) item where item->>'path' <> object_path) where space_id=target
$$;
create function public.due_home_cover_uploads(at timestamptz, max_count integer default 100) returns table(upload_id uuid, object_path text)
language sql security definer set search_path = '' as $$
  select u.id, u.staging_path from public.home_cover_upload u where u.expires_at<=at or u.consumed_at is not null order by u.expires_at limit max_count
$$;
create function public.finish_home_cover_upload(upload uuid, at timestamptz) returns void language sql security definer set search_path = '' as $$
  delete from public.home_cover_upload where id=upload and (expires_at<=at or consumed_at is not null)
$$;
revoke all on function public.due_home_cover_deletes(timestamptz,integer), public.finish_home_cover_delete(uuid,text), public.due_home_cover_uploads(timestamptz,integer), public.finish_home_cover_upload(uuid,timestamptz) from public, anon, authenticated;
grant execute on function public.due_home_cover_deletes(timestamptz,integer), public.finish_home_cover_delete(uuid,text), public.due_home_cover_uploads(timestamptz,integer), public.finish_home_cover_upload(uuid,timestamptz) to service_role;
