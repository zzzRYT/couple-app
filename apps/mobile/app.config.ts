import { APP_IDENTITY, EAS_PROJECT, IOS_WIDGETS_SIGNED, appVariant } from './src/config/identity.ts';
import { productionTarget, supabaseBuildValues } from './src/config/supabase.ts';
import { SPLASH } from './src/config/splash.ts';

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

// Hot Updater's native default channel (docs/ota.md): an OTA bundle reaches only builds on its channel and fingerprint.
// HOT_UPDATER_CHANNEL points a local Release build at a test channel; store builds always use their variant's channel.
const otaChannel = process.env.HOT_UPDATER_CHANNEL || variant;
if (process.env.EAS_BUILD === 'true' && process.env.HOT_UPDATER_CHANNEL) {
  throw new Error('HOT_UPDATER_CHANNEL is for local test builds; EAS builds use the channel of their variant');
}
if (process.env.EAS_BUILD === 'true' && variant !== 'development' && !process.env.EXPO_PUBLIC_HOT_UPDATER_API_KEY) {
  throw new Error('EXPO_PUBLIC_HOT_UPDATER_API_KEY must be set in the EAS environment for preview and production builds');
}
// The App Store binary refuses to start without Aroom-prod's values (src/config/supabase.ts), so its build stops first.
if (process.env.EAS_BUILD === 'true' && variant === 'production' && !productionTarget(supabaseBuildValues(process.env))) {
  throw new Error('EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY in the EAS production environment must be Aroom-prod\'s');
}

const iosBundleId = dev ? APP_IDENTITY.devIosBundleId : APP_IDENTITY.iosBundleId;
const widgets = IOS_WIDGETS_SIGNED || process.env.IOS_WIDGETS === 'true';
const widgetDefinitions = 'src/features/widgets/definitions.ts';
const homeFamilies = ['systemMedium', 'systemLarge'];
const ddayFamilies = ['systemSmall', ...homeFamilies, 'accessoryCircular', 'accessoryRectangular', 'accessoryInline'];
// Listed before expo-widgets: mods run last-added first, and this one needs the extension target that plugin creates.
const widgetPlugins = [
  './plugins/withWidgetResources.js',
  ['expo-widgets', {
    bundleIdentifier: `${iosBundleId}${APP_IDENTITY.widgetBundleIdSuffix}`,
    groupIdentifier: dev ? APP_IDENTITY.devAppGroupId : APP_IDENTITY.appGroupId,
    // The names are Localizable.strings keys: SwiftUI looks these literals up in the extension bundle.
    widgets: [
      { name: 'DDayWidget', displayName: 'widget.gallery.dday.name', description: 'widget.gallery.dday.desc', ios: { supportedFamilies: ddayFamilies, contentMarginsDisabled: true, initialLayout: widgetDefinitions } },
      { name: 'ListWidget', displayName: 'widget.gallery.list.name', description: 'widget.gallery.list.desc', ios: { supportedFamilies: homeFamilies, contentMarginsDisabled: true, initialLayout: widgetDefinitions } },
    ],
  }],
];

export default {
  expo: {
    name: dev ? `${APP_IDENTITY.name} (${variant})` : APP_IDENTITY.name,
    slug: APP_IDENTITY.slug,
    icon: './assets/icon/icon.png',
    orientation: 'portrait',
    userInterfaceStyle: 'automatic',
    owner: EAS_PROJECT.owner,
    scheme: dev ? ['aroom-dev', 'aroom'] : 'aroom',
    version: '1.0.1',
    ios: { bundleIdentifier: iosBundleId, icon: { light: './assets/icon/icon.png', dark: './assets/icon/icon-dark.png', tinted: './assets/icon/icon-tinted.png' }, usesAppleSignIn: true, associatedDomains: ['applinks:aroom.jinjinstar.com', 'webcredentials:aroom.jinjinstar.com'], infoPlist: { ITSAppUsesNonExemptEncryption: false } },
    android: { package: dev ? APP_IDENTITY.devAndroidApplicationId : APP_IDENTITY.androidApplicationId, adaptiveIcon: { foregroundImage: './assets/icon/adaptive-icon-foreground.png', backgroundColor: '#FBF1E3', monochromeImage: './assets/icon/adaptive-icon-monochrome.png' }, intentFilters: [{ action: 'VIEW', autoVerify: true, data: [{ scheme: 'https', host: 'aroom.jinjinstar.com', pathPrefix: '/i/' }], category: ['BROWSABLE', 'DEFAULT'] }] },
    plugins: [
      'expo-router',
      'expo-apple-authentication',
      // V0-12 launch screen; src/features/splash/BrandSplash.tsx takes over with the same image, size and ground.
      ['expo-splash-screen', { image: SPLASH.image, imageWidth: SPLASH.imageWidth, resizeMode: 'contain', backgroundColor: SPLASH.background.light, dark: { backgroundColor: SPLASH.background.dark } }],
      ['@hot-updater/expo', { channel: otaChannel }],
      ...(widgets ? widgetPlugins : []),
    ],
    extra: { eas: { projectId: EAS_PROJECT.projectId }, appVariant: variant },
  },
};
