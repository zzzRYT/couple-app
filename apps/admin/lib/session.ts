import { getToken } from 'next-auth/jwt';
import { headers } from 'next/headers';
import { NextRequest } from 'next/server';
import { isAllowed, testSession } from './access.mjs';
export async function allowedSession() {
  const token = await getToken({req:new NextRequest('http://localhost/', {headers:await headers()}), secret:process.env.NEXTAUTH_SECRET, secureCookie:process.env.NODE_ENV === 'production'});
  const session = testSession(process.env) ?? (token ? {user:{email:token.email, emailVerified:token.emailVerified}} : null);
  return isAllowed(session, process.env.ADMIN_ALLOWLIST_EMAILS) ? session : null;
}
