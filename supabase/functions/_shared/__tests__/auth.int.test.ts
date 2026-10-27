import { assertEquals, assertMatch } from 'jsr:@std/assert@1';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { requireUser } from '../auth.ts';
import { clientVerifier } from '../db.ts';
import { localEnv, service } from './local.ts';

async function latestCode(mailUrl: string, email: string): Promise<string> {
  for (let i = 0; i < 40; i++) {
    const list = await (await fetch(`${mailUrl}/api/v1/messages?limit=50`)).json();
    const id = list.messages?.find((m: { To: { Address: string }[] }) => m.To.some((to) => to.Address === email))?.ID;
    if (id) {
      const message = await (await fetch(`${mailUrl}/api/v1/message/${id}`)).json();
      const code = String(message.HTML ?? message.Text).match(/\b(\d{6})\b/)?.[1];
      if (code) return code;
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error('no OTP email arrived');
}
Deno.test('email OTP signs up and signs in with a 6-digit code locally', async () => {
  const env = await localEnv();
  if (!env.mailUrl) throw new Error('local mail capture is not running');
  const anon = createClient(env.url, env.anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const email = `otp-${crypto.randomUUID()}@example.invalid`;
  const sent = await anon.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
  assertEquals(sent.error, null);
  const code = await latestCode(env.mailUrl, email);
  assertMatch(code, /^\d{6}$/);
  const verified = await anon.auth.verifyOtp({ email, token: code, type: 'email' });
  assertEquals(verified.error, null);
  const userId = await requireUser(`Bearer ${verified.data.session!.access_token}`, clientVerifier(await service()));
  assertEquals(userId, verified.data.user!.id);
});
