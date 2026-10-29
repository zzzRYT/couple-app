import { signInAsync } from '../../test/appleAuthMock';
import { supabaseReauth } from '../reauth';

jest.mock('expo-crypto', () => ({
  randomUUID: jest.fn(() => 'raw'),
  CryptoDigestAlgorithm: { SHA256: 'SHA-256' },
  digestStringAsync: jest.fn(async (_algorithm: string, value: string) => `sha256(${value})`),
}));
jest.mock('expo-linking', () => ({
  createURL: jest.fn(() => 'aroom://auth-callback'),
  openURL: jest.fn(async () => undefined),
  addEventListener: jest.fn((_event: string, handler: (event: { url: string }) => void) => {
    setTimeout(() => handler({ url: 'aroom://auth-callback?code=c' }), 0);
    return { remove: jest.fn() };
  }),
}));

/** A client whose session user changes to `afterId` once a sign-in call succeeds, like Supabase replacing the session. */
function client(beforeId: string | null, afterId: string) {
  let userId = beforeId;
  const swap = async () => { userId = afterId; return { error: null }; };
  const signOut = jest.fn().mockResolvedValue({ error: null });
  return {
    signOut,
    client: {
      auth: {
        getSession: jest.fn(async () => ({ data: { session: userId ? { user: { id: userId, email: 'me@example.com' } } : null } })),
        signInWithIdToken: jest.fn(swap),
        verifyOtp: jest.fn(swap),
        signInWithOAuth: jest.fn(async () => ({ data: { url: 'https://example.test/oauth' }, error: null })),
        exchangeCodeForSession: jest.fn(swap),
        signOut,
      },
    } as never,
  };
}
beforeEach(() => signInAsync.mockReset());

describe('re-authentication keeps the account being deleted', () => {
  it('apple: the same user passes, a different user is an error and that session is signed out locally', async () => {
    signInAsync.mockResolvedValue({ identityToken: 'id', authorizationCode: 'code' });
    const same = client('u1', 'u1');
    expect(await supabaseReauth(same.client).apple()).toEqual({ kind: 'ok', reauth: { provider: 'apple', authorizationCode: 'code' } });
    expect(same.signOut).not.toHaveBeenCalled();
    const other = client('u1', 'u2');
    expect(await supabaseReauth(other.client).apple()).toEqual({ kind: 'error' });
    expect(other.signOut).toHaveBeenCalledWith({ scope: 'local' });
  });
  it('kakao: a different user is an error', async () => {
    const same = client('u1', 'u1');
    expect(await supabaseReauth(same.client).kakao()).toEqual({ kind: 'ok', reauth: { provider: 'kakao' } });
    const other = client('u1', 'u2');
    expect(await supabaseReauth(other.client).kakao()).toEqual({ kind: 'error' });
    expect(other.signOut).toHaveBeenCalledWith({ scope: 'local' });
  });
  it('email: a different user is an error; no session at all is an error without signing in', async () => {
    const same = client('u1', 'u1');
    expect(await supabaseReauth(same.client).verifyEmailCode('123456')).toEqual({ kind: 'ok', reauth: { provider: 'email' } });
    const other = client('u1', 'u2');
    expect(await supabaseReauth(other.client).verifyEmailCode('123456')).toEqual({ kind: 'error' });
    expect(other.signOut).toHaveBeenCalledWith({ scope: 'local' });
    const none = client(null, 'u2');
    expect(await supabaseReauth(none.client).verifyEmailCode('123456')).toEqual({ kind: 'error' });
  });
});
