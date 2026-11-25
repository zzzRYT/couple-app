begin;
select plan(20);
insert into auth.users(id,aud,role,email) values
 ('00000000-0000-0000-0000-0000000000e1','authenticated','authenticated','event-a@example.invalid'),
 ('00000000-0000-0000-0000-0000000000e2','authenticated','authenticated','event-b@example.invalid'),
 ('00000000-0000-0000-0000-0000000000e3','authenticated','authenticated','event-c@example.invalid');
create temp table ctx(k text primary key,v uuid);
insert into ctx select 'space',(public.create_space('00000000-0000-0000-0000-0000000000e1','2025-01-01','Asia/Seoul')->>'spaceId')::uuid;
insert into public.space_member(space_id,user_id,space_active) select v,'00000000-0000-0000-0000-0000000000e2',true from ctx where k='space';
select is(public.space_snapshot('00000000-0000-0000-0000-0000000000e1',(select v from ctx where k='space'))->'events','[]'::jsonb,'V0-F19-AC-01 a new space has no events');
insert into ctx select 'item',(public.create_space_event('00000000-0000-0000-0000-0000000000e1',(select v from ctx where k='space'),'  Dinner  ','2025-05-03','19:00','21:30','30m',null)->>'id')::uuid;
select is(public.space_event_json(e)-'id'-'createdAt'-'updatedAt','{"title":"Dinner","date":"2025-05-03","time":"19:00","endTime":"21:30","alert":"30m","ownerId":null,"createdBy":"00000000-0000-0000-0000-0000000000e1","updatedBy":"00000000-0000-0000-0000-0000000000e1","version":1}'::jsonb,'V0-F19-AC-03 created by me, owner defaults to together (null), title trimmed, times as HH:MM')
  from public.space_event e where id=(select v from ctx where k='item');
select public.create_space_event('00000000-0000-0000-0000-0000000000e2',(select v from ctx where k='space'),'Trip','2025-05-03',null,null,'1d','00000000-0000-0000-0000-0000000000e2');
select public.create_space_event('00000000-0000-0000-0000-0000000000e2',(select v from ctx where k='space'),'Lunch','2025-05-03','12:00',null,'none',null);
select is((select jsonb_agg(x->>'title') from jsonb_array_elements(public.space_snapshot('00000000-0000-0000-0000-0000000000e2',(select v from ctx where k='space'))->'events') x),'["Trip","Lunch","Dinner"]'::jsonb,'V0-F19-AC-01 V0-F19-AC-02 snapshot carries events for the partner, all-day first then by start time');
select is(jsonb_array_length(public.space_snapshot('00000000-0000-0000-0000-0000000000e1',(select v from ctx where k='space'))->'events'),3,'V0-F19-AC-01 snapshot carries the same events for me');
select is((select x->'time' from jsonb_array_elements(public.space_snapshot('00000000-0000-0000-0000-0000000000e1',(select v from ctx where k='space'))->'events') x where x->>'title'='Trip'),'null'::jsonb,'V0-F19-AC-02 all-day event has null time');
select is((select x->>'ownerId' from jsonb_array_elements(public.space_snapshot('00000000-0000-0000-0000-0000000000e1',(select v from ctx where k='space'))->'events') x where x->>'title'='Trip'),'00000000-0000-0000-0000-0000000000e2','V0-F19-AC-03 an event can belong to one active member');
select throws_ok($$select public.create_space_event('00000000-0000-0000-0000-0000000000e1',(select v from ctx where k='space'),'X','2025-05-03',null,null,'none','00000000-0000-0000-0000-0000000000e3')$$,'P0001','INVALID_REQUEST','V0-F19-AC-03 a non-member owner rejected');
select throws_ok($$select public.create_space_event('00000000-0000-0000-0000-0000000000e1',(select v from ctx where k='space'),'X','2025-05-03',null,null,'5m',null)$$,'P0001','INVALID_REQUEST','V0-F19-AC-03 all-day event rejects a 5m alert');
select throws_ok($$select public.create_space_event('00000000-0000-0000-0000-0000000000e1',(select v from ctx where k='space'),'X','2025-05-03','19:00','18:00','none',null)$$,'P0001','INVALID_REQUEST','V0-F19-AC-03 end before start rejected');
select throws_ok($$select public.create_space_event('00000000-0000-0000-0000-0000000000e1',(select v from ctx where k='space'),'X','2025-05-03',null,'18:00','none',null)$$,'P0001','INVALID_REQUEST','V0-F19-AC-03 end without start rejected');
select throws_ok($$select public.create_space_event('00000000-0000-0000-0000-0000000000e1',(select v from ctx where k='space'),'   ','2025-05-03',null,null,'none',null)$$,'P0001','INVALID_REQUEST','V0-F19-AC-03 blank title rejected');
select throws_ok($$select public.create_space_event('00000000-0000-0000-0000-0000000000e3',(select v from ctx where k='space'),'X','2025-05-03',null,null,'none',null)$$,'P0001','NOT_FOUND','V0-F19-AC-04 non-member rejected');
select throws_ok($$select public.update_space_event('00000000-0000-0000-0000-0000000000e2',(select v from ctx where k='space'),(select v from ctx where k='item'),1,'Dinner out','2025-05-04',null,null,'at','00000000-0000-0000-0000-0000000000e3')$$,'P0001','INVALID_REQUEST','V0-F19-AC-03 edit to a non-member owner rejected');
select is((select (r->>'version')::integer || '/' || (r->>'ownerId') || '/' || (r->>'createdBy') || '/' || (r->>'updatedBy') from (select public.update_space_event('00000000-0000-0000-0000-0000000000e2',(select v from ctx where k='space'),(select v from ctx where k='item'),1,'Dinner out','2025-05-04',null,null,'at','00000000-0000-0000-0000-0000000000e2') r) q),
  '2/00000000-0000-0000-0000-0000000000e2/00000000-0000-0000-0000-0000000000e1/00000000-0000-0000-0000-0000000000e2','V0-F19-AC-04 partner edits and changes the owner; the author stays the original writer');
select throws_ok($$select public.update_space_event('00000000-0000-0000-0000-0000000000e1',(select v from ctx where k='space'),(select v from ctx where k='item'),1,'Stale','2025-05-03',null,null,'none',null)$$,'P0001','VERSION_CONFLICT','V0-F19-AC-06 stale edit rejected');
select public.delete_space_event('00000000-0000-0000-0000-0000000000e2',(select v from ctx where k='space'),(select v from ctx where k='item'),2);
select is(jsonb_array_length(public.space_snapshot('00000000-0000-0000-0000-0000000000e1',(select v from ctx where k='space'))->'events'),2,'V0-F19-AC-04 partner deletes; deleted event excluded');
select throws_ok($$select public.update_space_event('00000000-0000-0000-0000-0000000000e1',(select v from ctx where k='space'),(select v from ctx where k='item'),3,'Late','2025-05-03',null,null,'none',null)$$,'P0001','NOT_FOUND:{"gone":true}','V0-F19-AC-06 edit of a deleted event reports gone');
select ok(not has_table_privilege('authenticated','public.space_event','insert'),'direct insert denied');
select ok(not has_table_privilege('authenticated','public.space_event','update'),'direct update denied');
select ok(not has_table_privilege('authenticated','public.space_event','delete'),'direct delete denied');
select * from finish();
rollback;
