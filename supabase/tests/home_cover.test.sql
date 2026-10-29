begin;
select plan(17);
insert into auth.users (id,aud,role,email) values
 ('00000000-0000-0000-0000-000000000071','authenticated','authenticated','cover-a@example.invalid'),
 ('00000000-0000-0000-0000-000000000072','authenticated','authenticated','cover-b@example.invalid'),
 ('00000000-0000-0000-0000-000000000073','authenticated','authenticated','cover-c@example.invalid');
insert into public.couple_space (id,anniversary_date) values ('10000000-0000-0000-0000-000000000071','2025-01-01');
insert into public.space_member (space_id,user_id) values
 ('10000000-0000-0000-0000-000000000071','00000000-0000-0000-0000-000000000071'),
 ('10000000-0000-0000-0000-000000000071','00000000-0000-0000-0000-000000000072');

select has_table('public', 'home_cover_photo', 'cover metadata has one row per space');
select has_table('public', 'home_cover_upload', 'short lived uploads have one use tickets');
select ok((select not public from storage.buckets where id='home-cover'), 'cover storage is private');
select ok((select count(*) = 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='home_cover_storage_read'), 'active members have a scoped read policy');
select ok((select not exists(select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname like 'home_cover_storage_%' and policyname <> 'home_cover_storage_read')), 'direct client writes cannot bypass re-encoding');
select ok(has_function_privilege('service_role', 'public.commit_home_cover(uuid,uuid,uuid,text,text,bigint,integer,integer,text,jsonb,timestamptz)', 'execute'), 'service role may commit transformed covers');
select ok(not has_function_privilege('authenticated', 'public.commit_home_cover(uuid,uuid,uuid,text,text,bigint,integer,integer,text,jsonb,timestamptz)', 'execute'), 'authenticated clients cannot commit metadata directly');
select ok(not exists(select 1 from information_schema.columns where table_schema='public' and table_name='home_cover_photo' and column_name in ('signed_url','url')), 'signed URLs are never persisted');
set local role service_role;
select is(public.create_home_cover_upload('10000000-0000-0000-0000-000000000071','20000000-0000-0000-0000-000000000071','00000000-0000-0000-0000-000000000071','image/jpeg',100,'2026-11-02T00:05:00Z')->>'path','10000000-0000-0000-0000-000000000071/incoming/20000000-0000-0000-0000-000000000071','a member receives a space-scoped upload ticket');
select public.mark_home_cover_uploaded('10000000-0000-0000-0000-000000000071','20000000-0000-0000-0000-000000000071','00000000-0000-0000-0000-000000000071','2026-11-02T00:00:00Z');
select lives_ok($$select public.commit_home_cover('10000000-0000-0000-0000-000000000071','20000000-0000-0000-0000-000000000071','00000000-0000-0000-0000-000000000071','10000000-0000-0000-0000-000000000071/cover/one.jpg','image/jpeg',90,300,200,repeat('a',64),'{"x":0,"y":0,"width":1,"height":1}','2026-11-02T00:00:00Z')$$,'a transformed image commits after a valid ticket');
select public.create_home_cover_upload('10000000-0000-0000-0000-000000000071','20000000-0000-0000-0000-000000000072','00000000-0000-0000-0000-000000000072','image/png',100,'2026-11-02T00:10:00Z');
select public.mark_home_cover_uploaded('10000000-0000-0000-0000-000000000071','20000000-0000-0000-0000-000000000072','00000000-0000-0000-0000-000000000072','2026-11-02T00:01:00Z');
select lives_ok($$select public.commit_home_cover('10000000-0000-0000-0000-000000000071','20000000-0000-0000-0000-000000000072','00000000-0000-0000-0000-000000000072','10000000-0000-0000-0000-000000000071/cover/two.jpg','image/jpeg',90,300,200,repeat('b',64),'{"x":0,"y":0,"width":1,"height":1}','2026-11-02T00:01:00Z')$$,'a second member can replace the cover');
select is((select version from public.home_cover_photo where space_id='10000000-0000-0000-0000-000000000071'),2::bigint,'replacement increments the version');
select is((select pending_delete->0->>'path' from public.home_cover_photo where space_id='10000000-0000-0000-0000-000000000071'),'10000000-0000-0000-0000-000000000071/cover/one.jpg','the prior object is queued only after replacement');
select is((select metadata from public.space_lifecycle_event where event_type='cover_changed' order by occurred_at desc limit 1),'{"version":2}'::jsonb,'cover events carry version only');
select is(public.remove_home_cover('10000000-0000-0000-0000-000000000071','00000000-0000-0000-0000-000000000071','2026-11-02T00:02:00Z')->>'status','none','removal makes the cover unavailable and records the actor');
select is((select count(*) from public.due_home_cover_deletes('2026-11-02T00:02:00Z')),0::bigint,'prior files are retained during the delay');
reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000073',true);
select is((select count(*) from public.home_cover_photo),0::bigint,'a non-member cannot read cover metadata');
reset role;

select * from finish();
rollback;
