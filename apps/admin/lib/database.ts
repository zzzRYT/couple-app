import 'server-only';
import { Client } from 'pg';
export async function getStats(): Promise<Record<string, unknown> | null> {
  const url = process.env.ADMIN_DATABASE_URL;
  if (!url) return null;
  let client: Client | undefined;
  try {
    const parsed = new URL(url);
    if (!/^admin_dashboard_reader(?:\.[a-z0-9]+)?$/.test(decodeURIComponent(parsed.username))) return null;
    const local = ['localhost','127.0.0.1','::1','[::1]'].includes(parsed.hostname);
    // Ignore URL query options: pg accepts host and TLS overrides there.
    parsed.search = '';
    client = new Client({connectionString:parsed.toString(), ssl:local ? false : {rejectUnauthorized:true}, connectionTimeoutMillis:5000, statement_timeout:5000});
    await client.connect();
    const result = await client.query<{stats:Record<string,unknown>}>('select public.admin_dashboard() as stats');
    return result.rows[0]?.stats ?? null;
  } catch { return null; }
  finally { if (client) await client.end().catch(()=>{}); }
}
