// Proposed values; the owner must confirm the thresholds and benefits.
const levels = [
  { days: 0, scale: 1, capacity: 4, maxObject: 0.3 },
  { days: 100, scale: 1.15, capacity: 6, maxObject: 0.34 },
  { days: 365, scale: 1.3, capacity: 8, maxObject: 0.38 },
  { days: 730, scale: 1.45, capacity: 10, maxObject: 0.42 },
] as const;

export function planetLevel(days: number, entitlementLevels: readonly number[] = []) {
  const timeLevel = levels.reduce((level, entry, index) => days >= entry.days ? index + 1 : level, 1);
  const level = Math.max(timeLevel, ...entitlementLevels.filter((value) => Number.isInteger(value) && value >= 1 && value <= levels.length));
  return { level, ...levels[level - 1]! };
}

export function fitObject(boundingRadius: number, maxObject: number): { scale: number; radius: number } | null {
  if (!Number.isFinite(boundingRadius) || boundingRadius <= 0) return null;
  const scale = Math.min(1, maxObject / boundingRadius);
  return { scale, radius: boundingRadius * scale };
}
