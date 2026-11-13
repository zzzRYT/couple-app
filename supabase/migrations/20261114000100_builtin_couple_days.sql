-- deletion-policy: remove only untouched automatic rows; edited and user-created rows are retained. Restoring removed defaults requires the earlier seed function and registry flags.
update public.anniversary_preset set auto=false where id in ('valentine','white');

create or replace function public.create_space(actor uuid, anniversary date, tz text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare created jsonb;
begin
  perform public.guard_account(actor);
  created := public.create_space_only(actor, anniversary, tz);
  perform public.ensure_initial_room((created->>'spaceId')::uuid);
  return created;
end $$;

-- A deletion alone is not an edit to the original fields. Other updates preserve the row.
create or replace function public.cleanup_seeded_couple_days() returns void
language sql security definer set search_path = '' as $$
delete from public.space_anniversary a
using public.anniversary_preset p
where a.preset_id=p.id and p.id in ('valentine','white')
  and a.created_by is null
  and ((a.updated_by is null and a.version=1) or (a.deleted_at is not null and a.version=2))
  and a.title=p.title_ko and a.memo is null and a.repeat='yearly'
  and extract(month from a.event_date)=p.month and extract(day from a.event_date)=p.day;
$$;
revoke all on function public.cleanup_seeded_couple_days() from public, anon, authenticated;
select public.cleanup_seeded_couple_days();
