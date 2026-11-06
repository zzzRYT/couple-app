// The password rules of boards V0-08 and V0-09. The app shows the same three (features/auth/passwordRules.ts); this copy is the one that counts.
// No Deno globals or runtime imports: the same module runs in Deno and in Node tests.

/** bcrypt reads at most 72 bytes, and Auth refuses anything longer. */
const MAX_BYTES = 72;
export function passwordIsAllowed(password: string, email: string): boolean {
  return password.length >= 8 && new TextEncoder().encode(password).length <= MAX_BYTES && /[A-Za-z]/.test(password) && /[0-9]/.test(password)
    && password.toLowerCase() !== email.trim().toLowerCase();
}
export function normalizedEmail(email: string): string {
  return email.trim().toLowerCase();
}
/** The attempt counter's key: an HMAC, so the table alone does not reveal which addresses were tried. */
export async function attemptKey(email: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const mac = new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`password-attempt-v1:${normalizedEmail(email)}`)));
  return [...mac].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}
