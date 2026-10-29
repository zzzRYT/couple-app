import entries from '../../../../assets/catalog/manifest.json';
import { catalogImages } from './catalogImages';
export type CatalogEntry = (typeof entries)[number];
export function getAsset(assetId: string, source: CatalogEntry[] = entries): CatalogEntry | null {
  return source.find((item) => item.asset_id === assetId && item.status === 'active') ?? null;
}
export function getLegacyAsset(assetId: string, source: CatalogEntry[] = entries): CatalogEntry | null {
  return source.find((item) => item.asset_id === assetId) ?? null;
}
export function variantUri(asset: CatalogEntry, mode: 'day' | 'night'): string {
  return mode === 'night' && 'night_variant' in asset && asset.night_variant ? asset.night_variant.uri : asset.uri;
}
export const mascotPoses = {
  wave_main: require('../../../../assets/catalog/images/mascot_wave_main.png'),
  cheer: require('../../../../assets/catalog/images/mascot_cheer.png'),
  lookup: require('../../../../assets/catalog/images/mascot_lookup.png'),
  walk: require('../../../../assets/catalog/images/mascot_walk.png'),
  lie: require('../../../../assets/catalog/images/mascot_lie.png'),
  sleep: require('../../../../assets/catalog/images/mascot_sleep.png'),
};
export { entries as catalogEntries };

export function imageForAsset(asset: CatalogEntry, mode: 'day' | 'night'): number | undefined {
  return catalogImages[mode === 'night' && 'night_variant' in asset && asset.night_variant ? `${asset.asset_id}__night` : asset.asset_id];
}
/** A bundled catalog image by id, for app UI art (spots, loader, intro cards); fails loudly on a typo instead of drawing nothing. */
export function catalogArt(id: string): number {
  const image = catalogImages[id];
  if (image === undefined) throw new Error(`unknown catalog image ${id}`);
  return image;
}
