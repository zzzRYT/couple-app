import { d1Database, r2Storage } from '@hot-updater/cloudflare';
import { expo } from '@hot-updater/expo';
import { defineConfig } from 'hot-updater';
import { apiKeys, insights, remoteConfig } from 'hot-updater/plugins';
import { existsSync } from 'node:fs';
import { productionTarget, supabaseBuildValues } from './src/config/supabase.ts';

/** The Aroom OTA server (docs/ota.md); ids are public configuration, the credentials below are not. */
export const OTA_CLOUDFLARE = {
  accountId: 'edceb7e9102d2a0806ab186a86b4b2c5',
  bucketName: 'aroom-hot-updater',
  databaseId: '21a8c110-9502-4212-a418-72fe45e8053d',
} as const;

// Credentials come from the untracked .env.hotupdater locally and from the EAS preview environment in CI.
// Native builds load this file only for updateStrategy, so it must load without them.
if (existsSync('.env.hotupdater')) {
  process.loadEnvFile('.env.hotupdater');
}

const storage = r2Storage({
  bucketName: OTA_CLOUDFLARE.bucketName,
  accountId: OTA_CLOUDFLARE.accountId,
  credentials: {
    accessKeyId: process.env.HOT_UPDATER_CLOUDFLARE_R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.HOT_UPDATER_CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
  },
});
const database = d1Database({
  databaseId: OTA_CLOUDFLARE.databaseId,
  accountId: OTA_CLOUDFLARE.accountId,
  cloudflareApiToken: process.env.HOT_UPDATER_CLOUDFLARE_API_TOKEN!,
});

/**
 * deploy defaults to the production channel, which normally receives only `bundle promote` of a checked preview bundle.
 * A bundle inlines EXPO_PUBLIC_* values, so one built without the client key, or for another variant, would stop later updates.
 */
export function checkBundleEnv(channel: string, env: NodeJS.ProcessEnv) {
  if (channel === 'production' && env.HOT_UPDATER_PRODUCTION_DEPLOY !== 'true') {
    throw new Error('Production gets a checked preview bundle through `hot-updater bundle promote` (docs/ota.md); set HOT_UPDATER_PRODUCTION_DEPLOY=true to build one for production on purpose');
  }
  if (!env.EXPO_PUBLIC_HOT_UPDATER_API_KEY) throw new Error('EXPO_PUBLIC_HOT_UPDATER_API_KEY must be set to build an OTA bundle (run it through `eas env:exec`)');
  if ((channel === 'production' || channel === 'preview') && env.EXPO_PUBLIC_APP_VARIANT !== channel) {
    throw new Error(`An OTA bundle for the ${channel} channel must be built with APP_VARIANT and EXPO_PUBLIC_APP_VARIANT=${channel}`);
  }
  // Preview talks to Aroom-dev, and promote copies the bundle to production unchanged, so it must also carry Aroom-prod's values.
  if ((channel === 'production' || channel === 'preview') && !productionTarget(supabaseBuildValues(env))) {
    throw new Error(`An OTA bundle for the ${channel} channel must carry Aroom-prod's public values (EXPO_PUBLIC_SUPABASE_PROD_URL and EXPO_PUBLIC_SUPABASE_PROD_PUBLISHABLE_KEY in the EAS preview environment)`);
  }
}

// options is null for commands without a platform (native builds, fingerprint, promote) and { platform, channel } for deploy.
export default defineConfig((options) => {
  if (options?.platform) checkBundleEnv(options.channel, process.env);
  return {
    build: expo(),
    storage,
    database,
    // The deployed Worker runs these plugins; the CLI and console must list the same ones.
    plugins: [apiKeys(), insights(), remoteConfig()],
    updateStrategy: 'fingerprint',
    // Bumped when JS starts to rely on a config-plugin change the hash can't see (docs/ota.md).
    // 2: the V0-12 launch screen that src/features/splash/BrandSplash.tsx takes over from.
    fingerprint: { nativeVersion: 2 },
  };
});
