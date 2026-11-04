import { APP_IDENTITY, EAS_PROJECT, appVariant } from './src/config/identity.ts';

// APP_VARIANT comes from the EAS build profile (eas.json). Development and preview builds use the separate .dev
// bundle id so the owner can register it with Apple before the production name check (G2).
const variant = appVariant(process.env.APP_VARIANT);
const dev = variant !== 'production';
if (!dev && process.env.EXPO_PUBLIC_DEV_EMAIL_LOGIN === 'true') {
  throw new Error('EXPO_PUBLIC_DEV_EMAIL_LOGIN must not be set for production builds');
}

if (variant !== 'development' && process.env.EXPO_PUBLIC_DEV_QUICK_LOGIN === 'true') {
  throw new Error('EXPO_PUBLIC_DEV_QUICK_LOGIN must not be set for preview or production builds');
}

export default {
  expo: {
    name: dev ? `${APP_IDENTITY.name} (${variant})` : APP_IDENTITY.name,
    slug: APP_IDENTITY.slug,
    userInterfaceStyle: 'automatic',
    owner: EAS_PROJECT.owner,
    scheme: dev ? ['aroom-dev', 'aroom'] : 'aroom',
    version: '1.0.0',
    runtimeVersion: { policy: 'fingerprint' },
    updates: { url: `https://u.expo.dev/${EAS_PROJECT.projectId}` },
    ios: { bundleIdentifier: dev ? APP_IDENTITY.devIosBundleId : APP_IDENTITY.iosBundleId, usesAppleSignIn: true, associatedDomains: ['applinks:aroom.jinjinstar.com'], infoPlist: { ITSAppUsesNonExemptEncryption: false } },
    android: { package: dev ? APP_IDENTITY.devAndroidApplicationId : APP_IDENTITY.androidApplicationId, intentFilters: [{ action: 'VIEW', autoVerify: true, data: [{ scheme: 'https', host: 'aroom.jinjinstar.com', pathPrefix: '/i/' }], category: ['BROWSABLE', 'DEFAULT'] }] },
    plugins: ['expo-router', 'expo-apple-authentication'],
    extra: { eas: { projectId: EAS_PROJECT.projectId }, appVariant: variant },
  },
};
