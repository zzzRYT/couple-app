import { rpcDb, serviceClient, type Db } from '../_shared/db.ts';
import { safeLogFields } from '../_shared/logging.ts';

/** Scheduled job (pg_cron or a Supabase schedule) authenticated with the service-role key; safe to re-run. */
export function lifecycleSweepHandler(db: Db, serviceKey: string, now: () => Date = () => new Date()) {
  return async (request: Request): Promise<Response> => {
    if (request.headers.get('Authorization') !== `Bearer ${serviceKey}`) return Response.json({ error: { code: 'UNAUTHORIZED', retryable: false } }, { status: 401 });
    const result = await db.rpc<Record<string, number>>('sweep_prompt_data', { at: now().toISOString() });
    console.log(JSON.stringify(safeLogFields({ event: 'lifecycle-sweep', status: 200 })));
    return Response.json(result);
  };
}
if (import.meta.main) Deno.serve(lifecycleSweepHandler(rpcDb(serviceClient()), Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? crypto.randomUUID()));
