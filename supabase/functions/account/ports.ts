import type { SupabaseClient } from 'npm:@supabase/supabase-js@2';
import { rpcDb, serviceClient } from '../_shared/db.ts';
import { appleClient, appleConfigFromEnv } from '../_shared/providers/apple.ts';
import { kakaoClientFromEnv } from '../_shared/providers/kakao.ts';
import { credentialBox } from '../_shared/credentialBox.ts';
import { safeLogFields } from '../_shared/logging.ts';
import { bucketStorage } from '../lifecycle-sweep/index.ts';
import { PROVIDERS, type Provider } from './reauth.ts';
import type { AuthAdmin, DeletionPorts } from './runner.ts';

/** Supabase Auth admin calls for the runner. Identity field names are from supabase-js v2 and not yet checked against a Kakao identity. */
export function authAdmin(client: SupabaseClient): AuthAdmin {
  return {
    async providerUserId(userId, provider) {
      const { data, error } = await client.auth.admin.getUserById(userId);
      if (error) { if ((error as { status?: number }).status === 404) return null; throw new Error('AUTH_LOOKUP_FAILED'); }
      const identity = data.user?.identities?.find((entry) => entry.provider === provider) as { provider_id?: string; id?: string } | undefined;
      return identity?.provider_id ?? identity?.id ?? null;
    },
    async deleteUser(userId) {
      // A hard delete (not soft): the same login can sign up again as a new, empty account.
      const { error } = await client.auth.admin.deleteUser(userId, false);
      if (error && (error as { status?: number }).status !== 404) throw new Error('AUTH_DELETE_FAILED');
    },
  };
}

/** Server wiring: service-role client, Storage purge, Apple and Kakao clients from Supabase secrets, and the sealing key. */
export async function defaultDeletionPorts(env: (name: string) => string | undefined = Deno.env.get) {
  const client = serviceClient(env);
  const serviceKey = env('SUPABASE_SERVICE_ROLE_KEY')!;
  const ports: DeletionPorts = {
    db: rpcDb(client), storage: bucketStorage(client), auth: authAdmin(client),
    apple: appleClient(appleConfigFromEnv(env)), kakao: kakaoClientFromEnv(env),
    box: await credentialBox(env('ACCOUNT_CREDENTIAL_KEY') ?? serviceKey),
    warn: (code) => console.warn(JSON.stringify(safeLogFields({ event: 'account-deletion-alert', code }))),
  };
  return {
    ports, serviceKey,
    async signOutEverywhere(jwt: string) { await client.auth.admin.signOut(jwt, 'global'); },
    async providerOf(userId: string): Promise<Provider | null> {
      const { data } = await client.auth.admin.getUserById(userId);
      const value = data.user?.app_metadata?.provider;
      return typeof value === 'string' && (PROVIDERS as readonly string[]).includes(value) ? value as Provider : null;
    },
  };
}
