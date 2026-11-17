'use server';
import { redirect } from 'next/navigation';
import { allowedSession } from '../../lib/session';
import { changeTester } from '../../lib/testers';
import { validTesterChange } from '../../lib/tester-input.mjs';
export async function updateTester(form: FormData) {
  const session = await allowedSession();
  if (!session) redirect('/');
  const action = form.get('action');
  const email = form.get('email');
  if (!validTesterChange(action, email) || (action !== 'add' && action !== 'remove') || typeof email !== 'string') redirect('/testers?error=1');
  const ok = await changeTester(action, email.trim(), session.user.email as string);
  redirect(ok ? '/testers' : '/testers?error=1');
}
