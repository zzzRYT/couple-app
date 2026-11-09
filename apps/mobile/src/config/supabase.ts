import { APP_IDENTITY } from './identity.ts';

/** The hosted Supabase projects (docs/remote-supabase-setup.md). Refs are public configuration; URLs and keys come from EXPO_PUBLIC_* build variables. */
export const SUPABASE_PROJECTS = {
  dev: { name: 'Aroom-dev', ref: 'opwtvlqpkrwgbjbmkqcw' },
  prod: { name: 'Aroom-prod', ref: 'mhyctlxweuwznenrdsrl' },
} as const;
export const projectUrl = (project: keyof typeof SUPABASE_PROJECTS) => `https://${SUPABASE_PROJECTS[project].ref}.supabase.co`;

/** What a bundle inlines: its environment's project, and on preview also Aroom-prod's values for when the bundle is promoted. */
export type SupabaseBuildValues = { url?: string; key?: string; prodUrl?: string; prodKey?: string };
export type SupabaseTarget = { url: string; key: string };

/** Node callers (hot-updater.config.ts) read a build environment; the app passes its inlined `process.env.EXPO_PUBLIC_*` reads. */
export function supabaseBuildValues(env: Record<string, string | undefined>): SupabaseBuildValues {
  return { url: env.EXPO_PUBLIC_SUPABASE_URL, key: env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY, prodUrl: env.EXPO_PUBLIC_SUPABASE_PROD_URL, prodKey: env.EXPO_PUBLIC_SUPABASE_PROD_PUBLISHABLE_KEY };
}

/** Aroom-prod's values in a bundle, or null when the bundle cannot reach Aroom-prod. */
export function productionTarget(values: SupabaseBuildValues): SupabaseTarget | null {
  const [url, key] = values.prodUrl ? [values.prodUrl, values.prodKey] : [values.url, values.key];
  return url === projectUrl('prod') && key ? { url, key } : null;
}

/**
 * The native binary picks the project, not the bundle: Hot Updater promotes the bundle checked on preview (Aroom-dev) to
 * production as is (docs/ota.md). The App Store binary refuses to start rather than use another project; Hot Updater then
 * marks that bundle as crashed and goes back to the previous one.
 */
export function supabaseTarget(applicationId: string | null | undefined, values: SupabaseBuildValues): SupabaseTarget {
  if (applicationId !== APP_IDENTITY.iosBundleId && applicationId !== APP_IDENTITY.androidApplicationId) {
    return { url: values.url ?? 'http://127.0.0.1:54321', key: values.key ?? '' };
  }
  const target = productionTarget(values);
  if (!target) throw new Error(`The production app only talks to ${SUPABASE_PROJECTS.prod.name}, and this bundle has no values for it`);
  return target;
}
