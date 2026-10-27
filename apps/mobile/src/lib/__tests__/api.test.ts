import { createApi } from '../api';
import { errorKeys } from '../errors';
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
