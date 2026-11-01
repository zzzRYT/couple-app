import { quickLoginAllowed } from './index';

it('requires every development, flag and local host guard', () => {
  for (const variant of ['development', 'preview', 'production', undefined]) {
    for (const flag of ['true', 'false', undefined]) {
      for (const url of ['http://localhost:54321', 'http://127.0.0.1:54321', 'http://10.0.0.1', 'http://172.16.0.1', 'http://192.168.1.2', 'https://mhyctlxweuwznenrdsrl.supabase.co', 'https://example.com', undefined]) {
        const local = !!url && /localhost|127\.0\.0\.1|10\.0\.0\.1|172\.16\.0\.1|192\.168\.1\.2/.test(url);
        expect(quickLoginAllowed({ variant, flag, url })).toBe(variant === 'development' && flag === 'true' && local);
      }
    }
  }
});
it('rejects malformed and non-private addresses', () => {
  for (const url of ['bad', 'http://172.15.0.1', 'http://172.32.0.1', 'http://192.169.0.1', 'http://localhost.supabase.co', 'http://user@localhost', 'file://localhost/a']) {
    expect(quickLoginAllowed({ variant: 'development', flag: 'true', url })).toBe(false);
  }
});
