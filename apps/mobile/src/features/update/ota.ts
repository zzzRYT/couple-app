import { HotUpdater } from '@hot-updater/react-native';

/** The Cloudflare Worker that serves OTA updates to builds from 1.0.1 on (docs/ota.md). 1.0.0 still asks EAS Update. */
export const OTA_SERVER_URL = 'https://aroom-hot-updater.jinjinstar3.workers.dev';
type Updater = Pick<ReturnType<typeof HotUpdater.init>, 'checkForUpdate' | 'reload'>;

// Direct `process.env.EXPO_PUBLIC_*` reads are inlined at build time: store builds and OTA bundles both take the client
// key from the EAS environment (docs/secrets.md). Builds without it, such as development builds and tests, never check.
const apiKey = process.env.EXPO_PUBLIC_HOT_UPDATER_API_KEY;
/** Created once at module scope, as Hot Updater requires; init verifies the launched bundle but never checks by itself. */
export const hotUpdater: Updater | null = apiKey ? HotUpdater.init({ baseURL: OTA_SERVER_URL, requestHeaders: { 'x-api-key': apiKey } }) : null;

/**
 * Keeps the expo-updates default this replaces: one check per cold start, a background download, and the new bundle runs
 * from the next launch. Only a bundle deployed with --force-update reloads at once. A failed check keeps the running bundle.
 */
export async function checkForOtaUpdate(updater: Updater | null = hotUpdater) {
  if (!updater) return;
  try {
    const update = await updater.checkForUpdate({ updateStrategy: 'fingerprint' });
    if (!update) return;
    const staged = await update.updateBundle();
    if (staged && update.shouldForceUpdate) await updater.reload();
  } catch {
    /* Nothing to show: the app keeps working on the bundle it has. */
  }
}
