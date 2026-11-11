-- rollback: restore create_space from 20261102000900, custom_anniversary_json and the 6-argument create_custom_anniversary from 20261103000500 (drop the 7-argument one), drop seed_couple_presets and adopt_anniversary_preset, the index space_anniversary_preset, the column space_anniversary.preset_id and the table anniversary_preset. Seeded rows stay as ordinary custom anniversaries.
create table public.anniversary_preset (
  id text primary key check (id ~ '^[A-Za-z]{1,32}$'),
  month smallint not null check (month between 1 and 12),
  day smallint not null check (day between 1 and 31),
  auto boolean not null,
  title_ko text not null, title_en text not null, title_ja text not null
);
alter table public.anniversary_preset enable row level security;
revoke all on public.anniversary_preset from anon, authenticated;
insert into public.anniversary_preset(id,month,day,auto,title_ko,title_en,title_ja) values
 ('diary',1,14,false,'다이어리데이','Diary Day','ダイアリーデー'),
 ('valentine',2,14,true,'발렌타인데이','Valentine''s Day','バレンタインデー'),
 ('samgyeopsal',3,3,false,'삼겹살데이','Samgyeopsal Day','サムギョプサルデー'),
 ('white',3,14,true,'화이트데이','White Day','ホワイトデー'),
 ('rose',5,14,false,'로즈데이','Rose Day','ローズデー'),
 ('married',5,21,false,'부부의 날','Married Couples Day','夫婦の日'),
 ('kiss',6,14,false,'키스데이','Kiss Day','キスデー'),
 ('silver',7,14,false,'실버데이','Silver Day','シルバーデー'),
 ('wine',10,14,false,'와인데이','Wine Day','ワインデー'),
 ('movie',11,14,false,'무비데이','Movie Day','ムービーデー'),
 ('goodCouple',11,22,false,'좋은 부부의 날','Good Spouses Day','いい夫婦の日'),
 ('hug',12,14,false,'허그데이','Hug Day','ハグデー'),
 ('xmasEve',12,24,false,'크리스마스 이브','Christmas Eve','クリスマスイブ');

-- The index also holds soft-deleted rows: a deleted preset keeps its slot, so it is never seeded again and never doubled.
alter table public.space_anniversary add column preset_id text references public.anniversary_preset(id);
create unique index space_anniversary_preset on public.space_anniversary(space_id,preset_id) where preset_id is not null;

create or replace function public.custom_anniversary_json(a public.space_anniversary) returns jsonb
language sql immutable set search_path = '' as $$
  select jsonb_build_object('id',a.id,'title',a.title,'memo',a.memo,'date',a.event_date,'repeat',a.repeat,
    'createdBy',a.created_by,'createdAt',a.created_at,'updatedBy',a.updated_by,'updatedAt',a.updated_at,'version',a.version,'presetId',a.preset_id)
$$;

-- A row the couple made by hand for the same day (yearly, same month-day, one of the preset's titles) becomes the preset's row.
create function public.adopt_anniversary_preset(target uuid, p_preset text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare p public.anniversary_preset%rowtype; adopted uuid;
begin
  select * into p from public.anniversary_preset where id=p_preset;
  if not found or exists (select 1 from public.space_anniversary where space_id=target and preset_id=p.id) then return null; end if;
  update public.space_anniversary set preset_id=p.id where id=(select a.id from public.space_anniversary a where a.space_id=target and a.preset_id is null and a.repeat='yearly'
      and extract(month from a.event_date)=p.month and extract(day from a.event_date)=p.day and btrim(a.title) in (p.title_ko,p.title_en,p.title_ja)
      order by a.deleted_at is not null, a.created_at, a.id limit 1)
    returning id into adopted;
  return adopted;
end $$;

create function public.seed_couple_presets(target uuid) returns integer
language plpgsql security definer set search_path = '' as $$
declare p public.anniversary_preset%rowtype; today date; next_date date; changed uuid; last uuid; n integer := 0;
begin
  select (public.app_now() at time zone s.time_zone)::date into today from public.couple_space s where s.id=target and s.status='active' for update;
  if not found then return 0; end if;
  for p in select * from public.anniversary_preset where auto order by month,day loop
    changed := public.adopt_anniversary_preset(target,p.id);
    if changed is null then
      next_date := make_date(extract(year from today)::int,p.month,p.day);
      if next_date<today then next_date := make_date(extract(year from today)::int+1,p.month,p.day); end if;
      insert into public.space_anniversary(space_id,title,event_date,repeat,preset_id) values(target,p.title_ko,next_date,'yearly',p.id) on conflict do nothing returning id into changed;
    end if;
    if changed is not null then n := n+1; last := changed; end if;
  end loop;
  if n>0 then perform public.notify_space(target,'anniversary',jsonb_build_object('id',last)); end if;
  return n;
end $$;
revoke all on function public.adopt_anniversary_preset(uuid,text), public.seed_couple_presets(uuid) from public,anon,authenticated;

create or replace function public.create_space(actor uuid, anniversary date, tz text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare created jsonb;
begin
  perform public.guard_account(actor);
  created := public.create_space_only(actor, anniversary, tz);
  perform public.ensure_initial_room((created->>'spaceId')::uuid);
  perform public.seed_couple_presets((created->>'spaceId')::uuid);
  return created;
end $$;

drop function public.create_custom_anniversary(uuid,uuid,text,text,date,text);
-- With a preset the call is safe to repeat: an active row comes back unchanged and a deleted one is revived in its own slot.
create function public.create_custom_anniversary(actor uuid, target uuid, p_title text, p_memo text, p_date date, p_repeat text, p_preset text default null) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare a public.space_anniversary%rowtype;
begin
  perform public.require_member(actor,target);
  perform 1 from public.couple_space where id=target for update;
  if p_title is null or char_length(btrim(p_title)) not between 1 and 40 or (p_memo is not null and char_length(p_memo)>200) or p_date is null or p_repeat is null or p_repeat not in ('yearly','once') then raise exception 'INVALID_REQUEST'; end if;
  if p_preset is not null then
    if not exists (select 1 from public.anniversary_preset where id=p_preset) then raise exception 'INVALID_REQUEST'; end if;
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
revoke all on function public.create_custom_anniversary(uuid,uuid,text,text,date,text,text) from public,anon,authenticated;
grant execute on function public.create_custom_anniversary(uuid,uuid,text,text,date,text,text) to service_role;

select public.seed_couple_presets(id) from public.couple_space where status='active';
