/** Compares dotted release versions numerically ("1.0.10" is newer than "1.0.9"; "1.0" equals "1.0.0"). */
export function isNewer(candidate: string, installed: string): boolean {
  const a = candidate.split('.').map(Number); const b = installed.split('.').map(Number);
  for (let i = 0; i < Math.max(a.length, b.length); i += 1) {
    const diff = (a[i] ?? 0) - (b[i] ?? 0);
    if (diff !== 0) return diff > 0;
  }
  return false;
}

type Fetch = (url: string) => Promise<{ ok: boolean; json(): Promise<unknown> }>;
/**
 * V0-11: the latest Aroom version published on the App Store, read from Apple's public lookup (iTunes Search API) by app id.
 * The device region's store comes first; without a result there, the default store. Null when nothing usable comes back.
 */
export async function storeVersion(appStoreId: string, region: string | null | undefined, fetchJson: Fetch = fetch): Promise<string | null> {
  const countries = [...new Set([region?.toLowerCase(), undefined])];
  for (const country of countries) {
    const response = await fetchJson(`https://itunes.apple.com/lookup?id=${appStoreId}${country ? `&country=${country}` : ''}`);
    if (!response.ok) continue;
    const body = await response.json() as { results?: { version?: unknown }[] };
    const version = body?.results?.[0]?.version;
    if (typeof version === 'string' && /^\d+(\.\d+)*$/.test(version)) return version;
  }
  return null;
}
