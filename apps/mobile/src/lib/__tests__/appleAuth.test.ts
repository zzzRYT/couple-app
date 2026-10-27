import * as Crypto from 'expo-crypto';
import { signInAsync } from '../../test/appleAuthMock';
import { supabaseAuth } from '../auth';

jest.mock('expo-crypto', () => ({
  randomUUID: jest.fn(() => 'raw'),
  CryptoDigestAlgorithm: { SHA256: 'SHA-256' },
  digestStringAsync: jest.fn(async (_algorithm: string, value: string) => `sha256(${value})`),
}));
function client(error: unknown = null) {
  const signInWithIdToken = jest.fn().mockResolvedValue({ error });
  return { client: { auth: { signInWithIdToken } } as never, signInWithIdToken };
}
beforeEach(() => signInAsync.mockReset());

it('sends the hashed nonce to Apple and the raw nonce with the id token to Supabase, without asking for the name', async () => {
  signInAsync.mockResolvedValue({ identityToken: 'id-token', fullName: null });
  const { client: c, signInWithIdToken } = client();
  expect(await supabaseAuth(c).apple()).toBe('ok');
  expect(Crypto.digestStringAsync).toHaveBeenCalledWith('SHA-256', 'rawraw');
  expect(signInAsync).toHaveBeenCalledWith({ requestedScopes: [1], nonce: 'sha256(rawraw)' });
  expect(signInWithIdToken).toHaveBeenCalledWith({ provider: 'apple', token: 'id-token', nonce: 'rawraw' });
});
it('maps cancel, missing token and Supabase errors', async () => {
  signInAsync.mockRejectedValueOnce(Object.assign(new Error('cancel'), { code: 'ERR_REQUEST_CANCELED' }));
  expect(await supabaseAuth(client().client).apple()).toBe('cancelled');
  signInAsync.mockResolvedValueOnce({ identityToken: null });
  expect(await supabaseAuth(client().client).apple()).toBe('error');
  signInAsync.mockResolvedValueOnce({ identityToken: 'id-token' });
  expect(await supabaseAuth(client({ message: 'bad nonce' }).client).apple()).toBe('error');
  signInAsync.mockRejectedValueOnce(new Error('not available'));
  expect(await supabaseAuth(client().client).apple()).toBe('error');
});
