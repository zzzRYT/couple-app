// AES-GCM sealing for the Apple token kept (at most 24 hours) to retry a revoke. The key is derived from a server secret
// with HKDF, so the database alone cannot reveal the token. Runs in Deno and in Node tests.

export interface CredentialBox {
  seal(plain: string): Promise<string>;
  open(sealed: string): Promise<string>;
}
export async function credentialBox(secret: string): Promise<CredentialBox> {
  if (!secret) throw new Error('MISSING_SERVER_CONFIG');
  const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), 'HKDF', false, ['deriveKey']);
  const key = await crypto.subtle.deriveKey({ name: 'HKDF', hash: 'SHA-256', salt: new Uint8Array(32), info: new TextEncoder().encode('aroom-account-deletion-credential-v1') },
    base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  return {
    async seal(plain) {
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const sealed = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(plain)));
      return `v1.${toBase64(iv)}.${toBase64(sealed)}`;
    },
    async open(sealed) {
      const [version, iv, data] = sealed.split('.');
      if (version !== 'v1' || !iv || !data) throw new Error('CREDENTIAL_UNREADABLE');
      const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromBase64(iv) }, key, fromBase64(data)).catch(() => { throw new Error('CREDENTIAL_UNREADABLE'); });
      return new TextDecoder().decode(plain);
    },
  };
}
function toBase64(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}
function fromBase64(text: string): Uint8Array<ArrayBuffer> {
  const binary = atob(text);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}
