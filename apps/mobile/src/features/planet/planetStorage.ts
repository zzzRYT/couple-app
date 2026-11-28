import * as SecureStore from 'expo-secure-store';
import type { Placement } from './placement';

export type PlanetData = { maxLevel: number; placements: Placement[] };
export const emptyPlanet: PlanetData = { maxLevel: 1, placements: [] };
const key = (spaceId: string) => `v1.planet.${spaceId}`;

// shortcut: local metadata and bundled demo asset are device-only; replace with shared server assets and placements before release.
export async function readPlanet(spaceId: string): Promise<PlanetData> {
  const saved = await SecureStore.getItemAsync(key(spaceId));
  if (!saved) return emptyPlanet;
  const data = JSON.parse(saved) as PlanetData;
  if (!data || !Number.isInteger(data.maxLevel) || data.maxLevel < 1 || data.maxLevel > 4 || !Array.isArray(data.placements) || data.placements.some((item) => !item || typeof item.id !== 'string' || !item.id || ![item.latitude, item.longitude, item.heading, item.radius].every(Number.isFinite) || Math.abs(item.latitude) > 90 || Math.abs(item.longitude) > 180 || item.radius <= 0 || (item.assetId !== undefined && typeof item.assetId !== 'string') || (item.scale !== undefined && !(Number.isFinite(item.scale) && item.scale > 0))) || new Set(data.placements.map((item) => item.id)).size !== data.placements.length) throw new Error('Invalid planet data');
  return data;
}
export async function writePlanet(spaceId: string, data: PlanetData): Promise<void> {
  await SecureStore.setItemAsync(key(spaceId), JSON.stringify(data));
}
