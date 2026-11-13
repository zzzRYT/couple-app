import { URL } from 'node:url';
export function allowedEmail(email, allowlist) {
  if (typeof email !== 'string' || !allowlist) return false;
  const normalized = email.trim().toLowerCase();
  return normalized.length > 0 && allowlist.split(',').some(item => item.trim().toLowerCase() === normalized);
}
export function isAllowed(session, allowlist) {
  return session?.user?.emailVerified === true && allowedEmail(session.user.email, allowlist);
}
// The bypass is usable only by a development server against a local database.
export function testSession(env) {
  if (env.NODE_ENV !== 'development' || env.VERCEL_ENV === 'production' || env.ADMIN_TEST_BYPASS !== '1') return null;
  try {
    const db = new URL(env.ADMIN_DATABASE_URL);
    if (!['localhost','127.0.0.1','::1','[::1]'].includes(db.hostname) || db.search) return null;
  } catch { return null; }
  return {user:{email:env.ADMIN_TEST_EMAIL, emailVerified:true}};
}
