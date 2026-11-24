begin;
select plan(1);
-- New functions get EXECUTE for PUBLIC, anon and authenticated by default, so a function missing here must revoke them (d2f8351, f9fd16f).
select set_eq($$
  select p.oid::regprocedure::text, coalesce(r.rolname, 'PUBLIC')
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  cross join lateral aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) a
  left join pg_roles r on r.oid = a.grantee
  where n.nspname = 'public' and a.privilege_type = 'EXECUTE' and (a.grantee = 0 or r.rolname in ('anon', 'authenticated'))
$$, $$ values
  ('app_now()', 'anon'), ('app_now()', 'authenticated'),
  ('can_join_space_topic(text)', 'authenticated'),
  ('is_space_active(uuid)', 'anon'), ('is_space_active(uuid)', 'authenticated'),
  ('is_space_member(uuid)', 'anon'), ('is_space_member(uuid)', 'authenticated'),
  ('is_tester()', 'authenticated'),
  ('set_room_version_source()', 'anon'), ('set_room_version_source()', 'authenticated'),
  ('track_milestone_preset_request()', 'anon'), ('track_milestone_preset_request()', 'authenticated')
$$, 'only the listed public functions are executable by PUBLIC, anon or authenticated');
select * from finish();
rollback;
