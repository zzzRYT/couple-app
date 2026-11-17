import 'server-only';
import { Client } from 'pg';
async function query<T extends import('pg').QueryResultRow>(sql: string, values: string[] = []): Promise<T[] | null> {
  let client: Client | undefined;
  try {
    const url = new URL(process.env.ADMIN_TESTER_DATABASE_URL ?? '');
    if (!/^admin_tester_manager(?:\.[a-z0-9]+)?$/.test(decodeURIComponent(url.username))) return null;
    const local = ['localhost','127.0.0.1','::1','[::1]'].includes(url.hostname);
    url.search = '';
    client = new Client({connectionString:url.toString(), ssl:local ? false : {rejectUnauthorized:true}, connectionTimeoutMillis:5000, statement_timeout:5000});
    await client.connect();
    return (await client.query<T>(sql, values)).rows;
  } catch { return null; }
  finally { if (client) await client.end().catch(() => {}); }
}
export const listTesters = () => query<{email:string; added_at:Date}>('select * from public.admin_list_testers()');
export async function changeTester(action: 'add' | 'remove', email: string, actor: string) {
  const result = action === 'add'
    ? await query<{ok:boolean}>('select public.admin_add_tester($1,$2) as ok', [email, actor])
    : await query<{ok:boolean}>('select public.admin_remove_tester($1) as ok', [email]);
  return result?.[0]?.ok === true;
}
