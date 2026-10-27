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
    scheme: dev ? `${APP_IDENTITY.slug}-dev` : APP_IDENTITY.slug,
    ios: { bundleIdentifier: dev ? APP_IDENTITY.devIosBundleId : APP_IDENTITY.iosBundleId, usesAppleSignIn: true },
    android: { package: dev ? APP_IDENTITY.devAndroidApplicationId : APP_IDENTITY.androidApplicationId },
    plugins: ['expo-router', 'expo-apple-authentication'],
    extra: { eas: { projectId: EAS_PROJECT.projectId }, appVariant: variant },
  },
};
