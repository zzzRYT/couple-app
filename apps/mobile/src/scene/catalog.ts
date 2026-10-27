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
  wave_main: require('../../../../assets/catalog/images/mascot_wave_main@2x.png'),
  cheer: require('../../../../assets/catalog/images/mascot_cheer@2x.png'),
  lookup: require('../../../../assets/catalog/images/mascot_lookup@2x.png'),
  walk: require('../../../../assets/catalog/images/mascot_walk@2x.png'),
  lie: require('../../../../assets/catalog/images/mascot_lie@2x.png'),
  sleep: require('../../../../assets/catalog/images/mascot_sleep@2x.png'),
};
export { entries as catalogEntries };

export function imageForAsset(asset: CatalogEntry, mode: 'day' | 'night'): number | undefined {
  return catalogImages[mode === 'night' && 'night_variant' in asset && asset.night_variant ? `${asset.asset_id}__night` : asset.asset_id];
}
