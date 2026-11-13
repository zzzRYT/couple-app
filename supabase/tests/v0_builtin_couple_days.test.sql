begin;
select plan(4);
insert into auth.users(id,aud,role,email) values ('00000000-0000-0000-0000-0000000000e1','authenticated','authenticated','builtin-test@example.invalid');
create temp table ctx as select (public.create_space('00000000-0000-0000-0000-0000000000e1','2024-01-01','UTC')->>'spaceId')::uuid as id;
-- Use distinct spaces because preset IDs are unique within a space.
create temp table cases(label text, id uuid);
insert into cases select label, gen_random_uuid() from unnest(array['untouched','deleted','renamed','memo','moved','author','repeat','edited']) label;
insert into public.couple_space(id, status, time_zone, anniversary_date)
select id, 'active', 'UTC', '2024-01-01' from cases;
insert into public.space_anniversary(space_id,preset_id,title,event_date,repeat,created_by,updated_by,version,memo,deleted_at)
select id,'valentine',case when label='renamed' then 'Ours' else '발렌타인데이' end,
  case when label='moved' then '2027-02-15'::date else '2027-02-14'::date end,
  case when label='repeat' then 'once' else 'yearly' end,
  case when label='author' then '00000000-0000-0000-0000-0000000000e1'::uuid end,
  case when label in ('deleted','edited') then '00000000-0000-0000-0000-0000000000e1'::uuid end,
  case when label in ('deleted','edited') then 2 else 1 end,
  case when label='memo' then 'kept' end, case when label='deleted' then now() end from cases;
select public.cleanup_seeded_couple_days();
select is((select count(*) from public.space_anniversary a join cases c on c.id=a.space_id where c.label in ('untouched','deleted')),0::bigint,'untouched and deleted seed rows are removed');
select is((select count(*) from public.space_anniversary a join cases c on c.id=a.space_id),6::bigint,'renamed, memo, moved, authored, repeat and edited rows survive');
select public.cleanup_seeded_couple_days();
select is((select count(*) from public.space_anniversary a join cases c on c.id=a.space_id),6::bigint,'migration is idempotent');
select is((select count(*) from public.anniversary_preset where auto),0::bigint,'no days are seeded');
select * from finish();
rollback;
