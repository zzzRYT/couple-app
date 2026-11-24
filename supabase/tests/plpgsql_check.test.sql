begin;
select plan(1);
create extension if not exists plpgsql_check with schema extensions;
-- CREATE FUNCTION checks only plpgsql syntax; plpgsql_check resolves every name and column as a call would (f8677ce, 45828f9).
select is_empty($$
  select p.oid::regprocedure::text || ': ' || c.message
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  join pg_language l on l.oid = p.prolang
  left join pg_trigger t on t.tgfoid = p.oid and not t.tgisinternal
  cross join lateral extensions.plpgsql_check_function_tb(p.oid, coalesce(t.tgrelid, 0)) c
  where n.nspname = 'public' and l.lanname = 'plpgsql' and c.level = 'error'
$$, 'every public plpgsql function passes plpgsql_check');
select * from finish();
rollback;
