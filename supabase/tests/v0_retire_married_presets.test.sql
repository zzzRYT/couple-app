-- Married-couple presets are no longer offered, but a couple who already added one keeps it and can still edit or delete it.
begin;
select plan(9);
insert into auth.users(id,aud,role,email) values
 ('00000000-0000-0000-0000-0000000000e1','authenticated','authenticated','retire-a@example.invalid');
create temp table ctx(k text primary key,v uuid);
insert into ctx select 'space',(public.create_space('00000000-0000-0000-0000-0000000000e1','2025-01-01','Asia/Seoul')->>'spaceId')::uuid;
insert into public.space_anniversary(space_id,title,event_date,repeat,created_by,updated_by,preset_id)
  select v,'부부의 날','2026-05-21','yearly','00000000-0000-0000-0000-0000000000e1','00000000-0000-0000-0000-0000000000e1','married' from ctx where k='space';
insert into ctx select 'married',id from public.space_anniversary where preset_id='married';

select ok(public.space_snapshot('00000000-0000-0000-0000-0000000000e1',(select v from ctx where k='space'))->'anniversaries' @> '[{"title":"부부의 날","date":"2026-05-21","presetId":"married"}]'::jsonb,'an existing married anniversary stays in the snapshot as it was');
select throws_ok($$select public.create_custom_anniversary('00000000-0000-0000-0000-0000000000e1',(select v from ctx where k='space'),'부부의 날',null,'2026-05-21','yearly','married')$$,'P0001','INVALID_REQUEST','married can no longer be added, even by a couple who has it');
select throws_ok($$select public.create_custom_anniversary('00000000-0000-0000-0000-0000000000e1',(select v from ctx where k='space'),'좋은 부부의 날',null,'2026-11-22','yearly','goodCouple')$$,'P0001','INVALID_REQUEST','goodCouple can no longer be added');
select is((public.create_custom_anniversary('00000000-0000-0000-0000-0000000000e1',(select v from ctx where k='space'),'키스데이',null,'2026-06-14','yearly','kiss')->>'presetId'),'kiss','an offered optional preset still works');
select is((select count(*) from public.space_anniversary where space_id=(select v from ctx where k='space') and preset_id='married'),1::bigint,'the rejected call left the married row alone');
select is((public.update_custom_anniversary('00000000-0000-0000-0000-0000000000e1',(select v from ctx where k='space'),(select v from ctx where k='married'),1,'우리 부부의 날','memo','2026-05-21','yearly')->>'presetId'),'married','the married row can still be edited and keeps its presetId');
select lives_ok($$select public.delete_custom_anniversary('00000000-0000-0000-0000-0000000000e1',(select v from ctx where k='space'),(select v from ctx where k='married'),2)$$,'the married row can still be deleted');
select throws_ok($$select public.create_custom_anniversary('00000000-0000-0000-0000-0000000000e1',(select v from ctx where k='space'),'부부의 날',null,'2026-05-21','yearly','married')$$,'P0001','INVALID_REQUEST','a deleted married row cannot be revived through the preset');
select throws_ok($$update public.anniversary_preset set auto=true where id='married'$$,'23514',null,'a retired preset can never be auto-seeded');
select * from finish();
rollback;
