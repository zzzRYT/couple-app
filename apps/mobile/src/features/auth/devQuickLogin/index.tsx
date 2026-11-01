// TEMPORARY: local test accounts only. Remove this folder after simulator testing.
import { useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { createSupabase } from '../../../lib/supabase';
import { AppText, Banner, Button } from '../../../ui/components';

type Client = ReturnType<typeof createSupabase>;
type GuardInput = { variant?: string; flag?: string; url?: string };
export function quickLoginAllowed({ variant, flag, url }: GuardInput): boolean {
  if (variant !== 'development' || flag !== 'true' || !url) return false;
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password) return false;
    const host = parsed.hostname.toLowerCase();
    if (host === 'supabase.co' || host.endsWith('.supabase.co')) return false;
    if (host === 'localhost' || host === '127.0.0.1') return true;
    const parts = host.split('.');
    if (parts.length !== 4 || parts.some((p) => !/^(0|[1-9]\d*)$/.test(p) || Number(p) > 255)) return false;
    const a = Number(parts[0]);
    const b = Number(parts[1]);
    return a === 10 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168);
  } catch { return false; }
}
const config = { variant: process.env.EXPO_PUBLIC_APP_VARIANT, flag: process.env.EXPO_PUBLIC_DEV_QUICK_LOGIN, url: process.env.EXPO_PUBLIC_SUPABASE_URL };
const password = 'local-only-aroom-pair-test-2026';
const accounts = ['paira@example.test', 'pairb@example.test'] as const;
export async function quickLogin(client: Client, email: typeof accounts[number]): Promise<boolean> {
  if (!quickLoginAllowed(config) || !accounts.includes(email)) return false;
  // Bind the guard to the actual client, not just the environment used to display the buttons.
  if ((client as unknown as { supabaseUrl: string }).supabaseUrl?.replace(/\/$/, '') !== config.url?.replace(/\/$/, '')) return false;
  const credentials = { email, password };
  const signedIn = await client.auth.signInWithPassword(credentials);
  if (!signedIn.error && signedIn.data.session) return true;
  // Only an invalid-credentials response can mean the local account does not exist yet.
  if (signedIn.error?.code !== 'invalid_credentials') return false;
  const created = await client.auth.signUp(credentials);
  return !created.error && !!created.data.session;
}
export function DevQuickLogin({ client, onDone }: { client: Client; onDone: () => void }) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  if (!quickLoginAllowed(config)) return null;
  async function login(email: typeof accounts[number]) {
    setBusy(true); setFailed(false);
    const ok = await quickLogin(client, email).catch(() => false);
    setBusy(false);
    if (ok) onDone(); else setFailed(true);
  }
  return <View style={{ gap: 8 }}>
    <AppText variant="caption">{t('login.quick.title')}</AppText>
    {accounts.map((email) => <Button key={email} label={email} variant="secondary" disabled={busy} onPress={() => void login(email)} />)}
    {failed && <Banner kind="danger" text={t('login.error.title')} body={t('login.error.body')} />}
  </View>;
}
