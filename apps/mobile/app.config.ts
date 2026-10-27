import { APP_IDENTITY } from './src/config/identity.ts';

export default {
  expo: {
    name: APP_IDENTITY.name,
    slug: APP_IDENTITY.slug,
    ios: { bundleIdentifier: APP_IDENTITY.iosBundleId },
    android: { package: APP_IDENTITY.androidApplicationId },
    plugins: ['expo-router'],
  },
};
