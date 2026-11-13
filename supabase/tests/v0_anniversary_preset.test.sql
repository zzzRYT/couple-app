-- Couple-day presets: valentine and white are seeded once per active space, never doubled and never brought back once deleted; optional presets are added on request.
begin;
select plan(23);
insert into auth.users(id,aud,role,email) values
 ('00000000-0000-0000-0000-0000000000d1','authenticated','authenticated','preset-a@example.invalid'),
 ('00000000-0000-0000-0000-0000000000d2','authenticated','authenticated','preset-b@example.invalid'),
 ('00000000-0000-0000-0000-0000000000d3','authenticated','authenticated','preset-c@example.invalid'),
 ('00000000-0000-0000-0000-0000000000d4','authenticated','authenticated','preset-d@example.invalid');
-- 2026-03-14 15:30 UTC is already 2026-03-15 in Seoul.
create or replace function public.app_now() returns timestamptz language sql stable set search_path = '' as $$ select '2026-03-14 15:30:00+00'::timestamptz $$;
create temp table ctx(k text primary key,v uuid);
insert into ctx select 'seoul',(public.create_space('00000000-0000-0000-0000-0000000000d1','2025-01-01','Asia/Seoul')->>'spaceId')::uuid;
insert into ctx select 'utc',(public.create_space('00000000-0000-0000-0000-0000000000d2','2025-01-01','UTC')->>'spaceId')::uuid;

select is((select array_agg(preset_id order by preset_id) from public.space_anniversary where space_id=(select v from ctx where k='seoul')),'{valentine,white}'::text[],'a new space gets exactly valentine and white');
select is((select count(*) from public.space_anniversary where space_id=(select v from ctx where k='seoul') and repeat='yearly' and created_by is null and updated_by is null and title in ('발렌타인데이','화이트데이')),2::bigint,'seeded rows are yearly, authorless and carry the Korean title');
select is((select event_date from public.space_anniversary where space_id=(select v from ctx where k='seoul') and preset_id='white'),'2027-03-14'::date,'the date is the next occurrence in the space time zone (Seoul is past 3/14)');
select is((select event_date from public.space_anniversary where space_id=(select v from ctx where k='seoul') and preset_id='valentine'),'2027-02-14'::date,'a day already past this year rolls to next year');
select is((select event_date from public.space_anniversary where space_id=(select v from ctx where k='utc') and preset_id='white'),'2026-03-14'::date,'today counts as the next occurrence (UTC is still on 3/14)');
select ok(public.space_snapshot('00000000-0000-0000-0000-0000000000d1',(select v from ctx where k='seoul'))->'anniversaries' @> '[{"presetId":"valentine"}]'::jsonb,'the snapshot carries presetId');
select is(public.seed_couple_presets((select v from ctx where k='seoul')),0,'seeding again adds nothing');
select is((select count(*) from public.space_anniversary where space_id=(select v from ctx where k='seoul')),2::bigint,'still two rows');

select public.delete_custom_anniversary('00000000-0000-0000-0000-0000000000d1',(select v from ctx where k='seoul'),(select id from public.space_anniversary where space_id=(select v from ctx where k='seoul') and preset_id='valentine'),1);
select is(public.seed_couple_presets((select v from ctx where k='seoul')),0,'a deleted preset is not seeded again');
select is((select count(*) from public.space_anniversary where space_id=(select v from ctx where k='seoul') and preset_id='valentine' and deleted_at is not null),1::bigint,'the deleted row stays as the tombstone');

-- A space made before presets existed, with its own Valentine's row and a deleted White Day row.
insert into ctx select 'old',(public.create_space_only('00000000-0000-0000-0000-0000000000d3','2024-01-01','Asia/Seoul')->>'spaceId')::uuid;
insert into ctx select 'manual',(public.create_custom_anniversary('00000000-0000-0000-0000-0000000000d3',(select v from ctx where k='old'),'Valentine''s Day',null,'2025-02-14','yearly')->>'id')::uuid;
insert into ctx select 'manualWhite',(public.create_custom_anniversary('00000000-0000-0000-0000-0000000000d3',(select v from ctx where k='old'),'화이트데이','memo','2025-03-14','yearly')->>'id')::uuid;
select public.delete_custom_anniversary('00000000-0000-0000-0000-0000000000d3',(select v from ctx where k='old'),(select v from ctx where k='manualWhite'),1);
select is(public.seed_couple_presets((select v from ctx where k='old')),2,'both presets are adopted');
select is((select count(*) from public.space_anniversary where space_id=(select v from ctx where k='old')),2::bigint,'adoption creates no new row');
select is((select preset_id || ':' || version || ':' || created_by from public.space_anniversary where id=(select v from ctx where k='manual')),'valentine:1:00000000-0000-0000-0000-0000000000d3','the manual English row becomes the valentine row as it was');
select ok((select deleted_at is not null and preset_id='white' from public.space_anniversary where id=(select v from ctx where k='manualWhite')),'a deleted manual row is adopted and stays deleted');

-- Optional presets on request.
insert into ctx select 'samgyeopsal',(public.create_custom_anniversary('00000000-0000-0000-0000-0000000000d1',(select v from ctx where k='seoul'),'삼겹살데이',null,'2027-03-03','yearly','samgyeopsal')->>'id')::uuid;
select is((public.create_custom_anniversary('00000000-0000-0000-0000-0000000000d1',(select v from ctx where k='seoul'),'삼겹살데이','again','2027-03-03','yearly','samgyeopsal')->>'id')::uuid,(select v from ctx where k='samgyeopsal'),'adding an optional preset twice returns the same row');
select is((select count(*)::int || ':' || coalesce(max(memo),'-') from public.space_anniversary where space_id=(select v from ctx where k='seoul') and preset_id='samgyeopsal'),'1:-','one row, unchanged');
select public.delete_custom_anniversary('00000000-0000-0000-0000-0000000000d1',(select v from ctx where k='seoul'),(select v from ctx where k='samgyeopsal'),1);
select is((public.create_custom_anniversary('00000000-0000-0000-0000-0000000000d1',(select v from ctx where k='seoul'),'Samgyeopsal Day','back','2027-03-03','yearly','samgyeopsal')->>'id')::uuid,(select v from ctx where k='samgyeopsal'),'adding it after a delete revives the same row');
select is((select (deleted_at is null) || ':' || version || ':' || title || ':' || memo from public.space_anniversary where id=(select v from ctx where k='samgyeopsal')),'true:3:Samgyeopsal Day:back','the revived row takes the new fields and a new version');
insert into ctx select 'kissManual',(public.create_custom_anniversary('00000000-0000-0000-0000-0000000000d1',(select v from ctx where k='seoul'),'키스데이',null,'2026-06-14','yearly')->>'id')::uuid;
select is((public.create_custom_anniversary('00000000-0000-0000-0000-0000000000d1',(select v from ctx where k='seoul'),'키스데이',null,'2026-06-14','yearly','kiss')->>'presetId'),'kiss','adding a preset adopts the matching manual row');
select is((select count(*) from public.space_anniversary where space_id=(select v from ctx where k='seoul') and extract(month from event_date)=6),1::bigint,'and does not add a second one');
select throws_ok($$select public.create_custom_anniversary('00000000-0000-0000-0000-0000000000d1',(select v from ctx where k='seoul'),'X',null,'2027-03-03','yearly','nope')$$,'P0001','INVALID_REQUEST','an unknown preset is rejected');

-- The backfill only touches active spaces.
insert into ctx select 'ended',(public.create_space_only('00000000-0000-0000-0000-0000000000d4','2024-01-01','UTC')->>'spaceId')::uuid;
update public.couple_space set status='ended' where id=(select v from ctx where k='ended');
select public.seed_couple_presets(id) from public.couple_space where status='active';
select is((select count(*) from public.space_anniversary where space_id=(select v from ctx where k='ended')),0::bigint,'an ended space gets nothing from the backfill');
select is(public.seed_couple_presets((select v from ctx where k='ended')),0,'nor when seeded directly');
select * from finish();
rollback;
