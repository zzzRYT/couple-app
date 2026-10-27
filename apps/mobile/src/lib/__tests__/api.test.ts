import { createApi } from '../api';
import { ApiError, errorBodyKey, errorKey, errorKeys } from '../errors';
import { routes } from '../routes';
import translations from '../../i18n/locales/en-US.json';

it('reuses the idempotency key for retries of the same mutation', async () => {
  const call = jest.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce({ status: 200 });
  const api = createApi(call, () => 'fixed-id');
  await api.request('/test', { method: 'POST', body: { value: 1 } });
  expect(call).toHaveBeenCalledTimes(2);
  expect(call.mock.calls[0][1].headers['Idempotency-Key']).toBe('fixed-id');
  expect(call.mock.calls[1][1].headers['Idempotency-Key']).toBe('fixed-id');
});
it('maps every shared error to an existing translation key', () => {
  for (const key of Object.values(errorKeys)) expect(Object.prototype.hasOwnProperty.call(translations, key)).toBe(true);
});
it('maps every error body key to an existing translation', () => {
  for (const code of Object.keys(errorKeys)) {
    const body = errorBodyKey(code);
    if (body) expect(Object.prototype.hasOwnProperty.call(translations, body)).toBe(true);
  }
  expect(errorKey('UNKNOWN_CODE')).toBe('sys.server.title');
});
it('sends the same idempotency key in the header and body and parses error details', async () => {
  const call = jest.fn().mockResolvedValue({ status: 409, json: async () => ({ error: { code: 'SESSION_OCCUPIED', retryable: false }, ownerUserId: 'u2', expiresAt: '2026-10-27T03:03:00Z' }) });
  const api = createApi(call, () => 'key-1');
  await expect(api.json('x', { method: 'POST', body: {}, keyInBody: true })).rejects.toMatchObject({ code: 'SESSION_OCCUPIED', status: 409, details: { ownerUserId: 'u2', retryable: false } });
  expect(JSON.parse(call.mock.calls[0][1].body)).toEqual({ idempotencyKey: 'key-1' });
  expect(call.mock.calls[0][1].headers['Idempotency-Key']).toBe('key-1');
});
it('routes logical contract paths to edge function names', () => {
  expect(routes.mySpace()).toBe('spaces/spaces/mine');
  expect(routes.session('s', 'p', 'undo')).toBe('prompt-session/spaces/s/prompt-session/p/undo');
  expect(routes.cancelPreview('s', 'v', 'a b')).toBe('decoration-previews/spaces/s/decoration-previews/v?sessionId=a%20b');
  expect(new ApiError(404, 'NOT_FOUND')).toBeInstanceOf(Error);
});
