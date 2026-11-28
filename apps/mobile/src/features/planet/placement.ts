import { surfacePosition } from './model';

export type Placement = { id: string; latitude: number; longitude: number; heading: number; radius: number; assetId?: string; scale?: number };

export const spots = [...Array.from({ length: 6 }, (_, i) => ({ latitude: 0, longitude: i * 60 - 180 })), ...Array.from({ length: 4 }, (_, i) => ({ latitude: -55, longitude: i * 90 - 180 }))];

export function overlaps(point: readonly number[], radius: number, other: Pick<Placement, 'latitude' | 'longitude' | 'radius'>, scale: number): boolean {
  const center = surfacePosition(other.latitude, other.longitude);
  return Math.hypot(...center.map((value, index) => value * scale - point[index]!)) < radius + other.radius;
}

// Radius is a conservative bounding sphere in world units, including the character.
export function canPlace(placements: readonly Placement[], candidate: Placement, capacity: number, scale: number, character = { latitude: 90, longitude: 0 }): 'ok' | 'capacity' | 'overlap' | 'invalid' {
  if (placements.length >= capacity) return 'capacity';
  if (!candidate.id || placements.some((p) => p.id === candidate.id) || ![candidate.latitude, candidate.longitude, candidate.heading, candidate.radius, scale].every(Number.isFinite) || Math.abs(candidate.latitude) > 90 || Math.abs(candidate.longitude) > 180 || candidate.radius <= 0 || scale <= 0) return 'invalid';
  const position = surfacePosition(candidate.latitude, candidate.longitude).map((v) => v * scale);
  return [...placements, { ...character, radius: 0.5 }].some((other) => overlaps(position, candidate.radius, other, scale)) ? 'overlap' : 'ok';
}
