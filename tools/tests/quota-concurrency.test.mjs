import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { randomUUID } from 'node:crypto';
import pg from 'pg';

test('four concurrent reservations admit at most three', async () => {
  assert.ok(process.env.LOCAL_DATABASE_URL, 'LOCAL_DATABASE_URL is required for this local-only test');
  const pool = new pg.Pool({ connectionString: process.env.LOCAL_DATABASE_URL, max: 5 });
  const space = randomUUID();
  try {
    await pool.query("insert into public.couple_space(id, anniversary_date, time_zone) values($1, '2025-01-01', 'Asia/Seoul')", [space]);
    const results = await Promise.allSettled(Array.from({ length: 4 }, () => pool.query('select public.reserve_daily_request($1,$2)', [space, randomUUID()])));
    assert.equal(results.filter((r) => r.status === 'fulfilled').length, 3);
    const rejected = results.find((r) => r.status === 'rejected');
    assert.match(rejected.reason.message, /DAILY_LIMIT_REACHED/);
    const count = await pool.query("select count(*)::int as count from public.daily_request_reservation where space_id=$1 and status='reserved'", [space]);
    assert.equal(count.rows[0].count, 3);
  } finally {
    await pool.query('delete from public.couple_space where id=$1', [space]);
    await pool.end();
  }
});
