import { APP_IDENTITY, EAS_PROJECT, appVariant } from './src/config/identity.ts';

// APP_VARIANT comes from the EAS build profile (eas.json). Development and preview builds use the separate .dev
// bundle id so the owner can register it with Apple before the production name check (G2).
const variant = appVariant(process.env.APP_VARIANT);
const dev = variant !== 'production';
if (!dev && process.env.EXPO_PUBLIC_DEV_EMAIL_LOGIN === 'true') {
  throw new Error('EXPO_PUBLIC_DEV_EMAIL_LOGIN must not be set for production builds');
}

export default {
  expo: {
    name: dev ? `${APP_IDENTITY.name} (${variant})` : APP_IDENTITY.name,
    slug: APP_IDENTITY.slug,
    owner: EAS_PROJECT.owner,
    scheme: dev ? ['aroom-dev', 'aroom'] : 'aroom',
    ios: { bundleIdentifier: dev ? APP_IDENTITY.devIosBundleId : APP_IDENTITY.iosBundleId, usesAppleSignIn: true, associatedDomains: ['applinks:aroom.jinjinstar.com'] },
    android: { package: dev ? APP_IDENTITY.devAndroidApplicationId : APP_IDENTITY.androidApplicationId, intentFilters: [{ action: 'VIEW', autoVerify: true, data: [{ scheme: 'https', host: 'aroom.jinjinstar.com', pathPrefix: '/i/' }], category: ['BROWSABLE', 'DEFAULT'] }] },
    plugins: ['expo-router', 'expo-apple-authentication'],
    extra: { eas: { projectId: EAS_PROJECT.projectId }, appVariant: variant },
  },
};
