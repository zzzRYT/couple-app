// Proposed values; the owner must confirm the thresholds and benefits.
const levels = [
  { days: 0, scale: 1, capacity: 4 },
  { days: 100, scale: 1.15, capacity: 6 },
  { days: 365, scale: 1.3, capacity: 8 },
  { days: 730, scale: 1.45, capacity: 10 },
] as const;

export function planetLevel(days: number, entitlementLevels: readonly number[] = []) {
  const timeLevel = levels.reduce((level, entry, index) => days >= entry.days ? index + 1 : level, 1);
  const level = Math.max(timeLevel, ...entitlementLevels.filter((value) => Number.isInteger(value) && value >= 1 && value <= levels.length));
  return { level, ...levels[level - 1]! };
}
