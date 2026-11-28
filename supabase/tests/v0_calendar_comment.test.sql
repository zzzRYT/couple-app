begin;
select plan(18);
insert into auth.users(id,aud,role,email) values
 ('00000000-0000-0000-0000-0000000000c1','authenticated','authenticated','comment-a@example.invalid'),
 ('00000000-0000-0000-0000-0000000000c2','authenticated','authenticated','comment-b@example.invalid'),
 ('00000000-0000-0000-0000-0000000000c3','authenticated','authenticated','comment-c@example.invalid');
create temp table ctx(k text primary key,v uuid);
insert into ctx select 'space',(public.create_space('00000000-0000-0000-0000-0000000000c1','2025-01-01','Asia/Seoul')->>'spaceId')::uuid;
insert into public.space_member(space_id,user_id,space_active) select v,'00000000-0000-0000-0000-0000000000c2',true from ctx where k='space';
insert into ctx select 'event',(public.create_space_event('00000000-0000-0000-0000-0000000000c1',(select v from ctx where k='space'),'Dinner','2025-05-03',null,null,'none',null)->>'id')::uuid;
insert into ctx select 'event2',(public.create_space_event('00000000-0000-0000-0000-0000000000c1',(select v from ctx where k='space'),'Trip','2025-05-04',null,null,'none',null)->>'id')::uuid;
select is(public.space_snapshot('00000000-0000-0000-0000-0000000000c1',(select v from ctx where k='space'))->'eventComments','[]'::jsonb,'V0-F19-AC-09 a new space has no event comments');
insert into ctx select 'partner',(public.create_space_event_comment('00000000-0000-0000-0000-0000000000c2',(select v from ctx where k='space'),(select v from ctx where k='event'),'  잘 다녀와  ')->>'id')::uuid;
select is(public.space_event_comment_json(c)-'id'-'createdAt',jsonb_build_object('eventId',(select v from ctx where k='event'),'body','잘 다녀와','createdBy','00000000-0000-0000-0000-0000000000c2'),'V0-F19-AC-09 partner comments on the author''s event; body trimmed')
  from public.space_event_comment c where id=(select v from ctx where k='partner');
insert into ctx select 'reply',(public.create_space_event_comment('00000000-0000-0000-0000-0000000000c1',(select v from ctx where k='space'),(select v from ctx where k='event'),'고마워')->>'id')::uuid;
select is((select jsonb_agg(x->>'body') from jsonb_array_elements(public.space_snapshot('00000000-0000-0000-0000-0000000000c1',(select v from ctx where k='space'))->'eventComments') x),'["잘 다녀와","고마워"]'::jsonb,'V0-F19-AC-09 the author replies; snapshot carries both comments in order for the author');
select is(public.space_snapshot('00000000-0000-0000-0000-0000000000c2',(select v from ctx where k='space'))->'eventComments',public.space_snapshot('00000000-0000-0000-0000-0000000000c1',(select v from ctx where k='space'))->'eventComments','V0-F19-AC-09 the partner sees the same comments');
select throws_ok($$select public.create_space_event_comment('00000000-0000-0000-0000-0000000000c1',(select v from ctx where k='space'),(select v from ctx where k='event'),'   ')$$,'P0001','INVALID_REQUEST','V0-F19-AC-09 blank comment rejected');
select throws_ok($$select public.create_space_event_comment('00000000-0000-0000-0000-0000000000c1',(select v from ctx where k='space'),(select v from ctx where k='event'),null)$$,'P0001','INVALID_REQUEST','V0-F19-AC-09 missing comment rejected');
select throws_ok($$select public.create_space_event_comment('00000000-0000-0000-0000-0000000000c1',(select v from ctx where k='space'),(select v from ctx where k='event'),repeat('a',401))$$,'P0001','INVALID_REQUEST','V0-F19-AC-09 comment over 400 characters rejected');
select throws_ok($$select public.create_space_event_comment('00000000-0000-0000-0000-0000000000c3',(select v from ctx where k='space'),(select v from ctx where k='event'),'hi')$$,'P0001','NOT_FOUND','V0-F19-AC-09 non-member rejected');
select throws_ok($$select public.create_space_event_comment('00000000-0000-0000-0000-0000000000c1',(select v from ctx where k='space'),gen_random_uuid(),'hi')$$,'P0001','NOT_FOUND','V0-F19-AC-09 comment on an unknown event rejected');
insert into public.space_event_comment(space_id,event_id,body,created_by) select (select v from ctx where k='space'),(select v from ctx where k='event2'),'n'||g,'00000000-0000-0000-0000-0000000000c1' from generate_series(1,200) g;
select throws_ok($$select public.create_space_event_comment('00000000-0000-0000-0000-0000000000c2',(select v from ctx where k='space'),(select v from ctx where k='event2'),'one more')$$,'P0001','INVALID_REQUEST','V0-F19-AC-09 an event holds at most 200 comments');
delete from public.space_event_comment where event_id=(select v from ctx where k='event2');
select throws_ok($$select public.delete_space_event_comment('00000000-0000-0000-0000-0000000000c2',(select v from ctx where k='space'),(select v from ctx where k='event'),(select v from ctx where k='reply'))$$,'P0001','NOT_FOUND','V0-F19-AC-10 partner cannot delete the author''s comment');
select public.delete_space_event_comment('00000000-0000-0000-0000-0000000000c1',(select v from ctx where k='space'),(select v from ctx where k='event'),(select v from ctx where k='reply'));
select is((select jsonb_agg(x->>'id') from jsonb_array_elements(public.space_snapshot('00000000-0000-0000-0000-0000000000c2',(select v from ctx where k='space'))->'eventComments') x),jsonb_build_array((select v from ctx where k='partner')),'V0-F19-AC-10 the writer deletes their own comment');
select throws_ok($$select public.delete_space_event_comment('00000000-0000-0000-0000-0000000000c1',(select v from ctx where k='space'),(select v from ctx where k='event'),(select v from ctx where k='reply'))$$,'P0001','NOT_FOUND','V0-F19-AC-10 a deleted comment is not found');
select public.delete_space_event('00000000-0000-0000-0000-0000000000c2',(select v from ctx where k='space'),(select v from ctx where k='event'),1);
select throws_ok($$select public.create_space_event_comment('00000000-0000-0000-0000-0000000000c2',(select v from ctx where k='space'),(select v from ctx where k='event'),'late')$$,'P0001','NOT_FOUND:{"gone":true}','V0-F19-AC-09 comment on a deleted event reports gone');
select is(public.space_snapshot('00000000-0000-0000-0000-0000000000c1',(select v from ctx where k='space'))->'eventComments','[]'::jsonb,'V0-F19-AC-09 a deleted event''s comments leave the snapshot');
select ok(not has_table_privilege('authenticated','public.space_event_comment','insert'),'direct insert denied');
select ok(not has_table_privilege('authenticated','public.space_event_comment','update'),'direct update denied');
select ok(not has_table_privilege('authenticated','public.space_event_comment','delete'),'direct delete denied');
select * from finish();
rollback;
