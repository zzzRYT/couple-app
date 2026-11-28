import { surfacePosition } from './model';

export type Placement = { id: string; latitude: number; longitude: number; heading: number; radius: number; assetId?: string; scale?: number };

// Radius is a conservative bounding sphere in world units, including the character.
export function canPlace(placements: readonly Placement[], candidate: Placement, capacity: number, scale: number): 'ok' | 'capacity' | 'overlap' | 'invalid' {
  if (placements.length >= capacity) return 'capacity';
  if (!candidate.id || placements.some((p) => p.id === candidate.id) || ![candidate.latitude, candidate.longitude, candidate.heading, candidate.radius, scale].every(Number.isFinite) || Math.abs(candidate.latitude) > 90 || Math.abs(candidate.longitude) > 180 || candidate.radius <= 0 || scale <= 0) return 'invalid';
  const position = surfacePosition(candidate.latitude, candidate.longitude).map((v) => v * scale);
  const neighbors = [...placements, { id: 'character', latitude: 90, longitude: 0, heading: 0, radius: 0.5 }];
  return neighbors.some((other) => {
    const point = surfacePosition(other.latitude, other.longitude);
    return Math.hypot(...point.map((value, index) => value * scale - position[index]!)) < candidate.radius + other.radius;
  }) ? 'overlap' : 'ok';
}
