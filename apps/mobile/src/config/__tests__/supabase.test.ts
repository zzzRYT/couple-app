import { APP_IDENTITY } from '../identity';
import { SUPABASE_PROJECTS, productionTarget, projectUrl, supabaseBuildValues, supabaseTarget } from '../supabase';

const dev = { url: projectUrl('dev'), key: 'dev-publishable' };
const prod = { url: projectUrl('prod'), key: 'prod-publishable' };
// What a preview bundle inlines from the EAS preview environment (docs/remote-supabase-setup.md).
const previewBundle = { ...dev, prodUrl: prod.url, prodKey: prod.key };

it('keeps the two hosted projects apart', () => {
  expect(SUPABASE_PROJECTS.dev.ref).not.toBe(SUPABASE_PROJECTS.prod.ref);
  expect(projectUrl('prod')).toBe(`https://${SUPABASE_PROJECTS.prod.ref}.supabase.co`);
});
it('sends .dev builds to the project their bundle was built for', () => {
  expect(supabaseTarget(APP_IDENTITY.devIosBundleId, previewBundle)).toEqual(dev);
  expect(supabaseTarget(APP_IDENTITY.devIosBundleId, { url: 'http://192.168.0.2:54321', key: 'local' })).toEqual({ url: 'http://192.168.0.2:54321', key: 'local' });
  expect(supabaseTarget(null, {})).toEqual({ url: 'http://127.0.0.1:54321', key: '' });
});
it('sends the App Store binary to Aroom-prod', () => {
  expect(supabaseTarget(APP_IDENTITY.iosBundleId, prod)).toEqual(prod);
  expect(supabaseTarget(APP_IDENTITY.androidApplicationId, prod)).toEqual(prod);
});
it('keeps a preview bundle promoted to production on Aroom-prod', () => {
  expect(supabaseTarget(APP_IDENTITY.iosBundleId, previewBundle)).toEqual(prod);
});
it('refuses to start the App Store binary on any other project', () => {
  expect(() => supabaseTarget(APP_IDENTITY.iosBundleId, dev)).toThrow(/only talks to Aroom-prod/);
  expect(() => supabaseTarget(APP_IDENTITY.iosBundleId, {})).toThrow(/only talks to Aroom-prod/);
  expect(() => supabaseTarget(APP_IDENTITY.iosBundleId, { ...prod, prodUrl: dev.url, prodKey: dev.key })).toThrow(/only talks to Aroom-prod/);
  // A prod URL without its own key never borrows the dev key.
  expect(() => supabaseTarget(APP_IDENTITY.iosBundleId, { ...dev, prodUrl: prod.url })).toThrow(/only talks to Aroom-prod/);
});
it('reads the build variables by name', () => {
  const env = { EXPO_PUBLIC_SUPABASE_URL: dev.url, EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: dev.key, EXPO_PUBLIC_SUPABASE_PROD_URL: prod.url, EXPO_PUBLIC_SUPABASE_PROD_PUBLISHABLE_KEY: prod.key };
  expect(supabaseBuildValues(env)).toEqual(previewBundle);
  expect(productionTarget(supabaseBuildValues(env))).toEqual(prod);
});
