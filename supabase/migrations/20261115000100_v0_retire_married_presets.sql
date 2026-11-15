-- rollback: restore the 7-argument create_custom_anniversary from 20261111000100, then drop the constraint anniversary_preset_retired_not_auto and the column anniversary_preset.offered.
-- Aroom is for couples before marriage. Retired presets keep their rows so existing space_anniversary rows keep a valid preset_id.
alter table public.anniversary_preset add column offered boolean not null default true,
  add constraint anniversary_preset_retired_not_auto check (offered or not auto);
update public.anniversary_preset set offered=false where id in ('married','goodCouple');

create or replace function public.create_custom_anniversary(actor uuid, target uuid, p_title text, p_memo text, p_date date, p_repeat text, p_preset text default null) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare a public.space_anniversary%rowtype;
begin
  perform public.require_member(actor,target);
  perform 1 from public.couple_space where id=target for update;
  if p_title is null or char_length(btrim(p_title)) not between 1 and 40 or (p_memo is not null and char_length(p_memo)>200) or p_date is null or p_repeat is null or p_repeat not in ('yearly','once') then raise exception 'INVALID_REQUEST'; end if;
  if p_preset is not null then
    if not exists (select 1 from public.anniversary_preset where id=p_preset and offered) then raise exception 'INVALID_REQUEST'; end if;
    perform public.adopt_anniversary_preset(target,p_preset);
    select * into a from public.space_anniversary where space_id=target and preset_id=p_preset for update;
    if found and a.deleted_at is null then return public.custom_anniversary_json(a); end if;
  end if;
  if (select count(*) from public.space_anniversary where space_id=target and deleted_at is null)>=200 then raise exception 'INVALID_REQUEST'; end if;
  if a.id is not null then
    update public.space_anniversary set title=btrim(p_title),memo=p_memo,event_date=p_date,repeat=p_repeat,deleted_at=null,updated_by=actor,updated_at=public.app_now(),version=version+1 where id=a.id returning * into a;
  else
    insert into public.space_anniversary(space_id,title,memo,event_date,repeat,created_by,updated_by,preset_id) values(target,btrim(p_title),p_memo,p_date,p_repeat,actor,actor,p_preset) returning * into a;
  end if;
  perform public.notify_space(target,'anniversary',jsonb_build_object('id',a.id));
  return public.custom_anniversary_json(a);
end $$;
