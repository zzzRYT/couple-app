export const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
/** CSPRNG code; 256 is divisible by the 32-letter alphabet, so the modulo has no bias. */
export function generateCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  return Array.from(bytes, (byte) => ALPHABET[byte % ALPHABET.length]).join('');
}
export function formatCode(code: string): string { return `${code.slice(0, 4)}-${code.slice(4)}`; }
export function normalizeCode(input: string): string | null {
  const code = input.toUpperCase().replace(/[\s-]/g, '');
  return code.length === 8 && [...code].every((ch) => ALPHABET.includes(ch)) ? code : null;
}
export async function hashCode(code: string, pepper: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${pepper}:${code}`));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}
