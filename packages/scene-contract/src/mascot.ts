export type MascotPlacement = { assetId: 'app_mascot'; x: number; y: number; width: number; height: number; rotationDeg: number; zIndex: number; opacity: number };
export function defaultMascotPlacement(): MascotPlacement {
  return { assetId: 'app_mascot', x: 0.5, y: 0.72, width: 0.2, height: 0.2, rotationDeg: 0, zIndex: 1, opacity: 1 };
}
export function ensureSingleMascot<T extends { assetId: string }>(objects: T[]): boolean {
  return objects.filter((item) => item.assetId === 'app_mascot').length === 1;
}
export function rejectMascotAppearance(candidate: Record<string, unknown>): boolean {
  if (candidate.assetId !== 'app_mascot') return false;
  return Object.keys(candidate).some((key) => !['assetId', 'x', 'y', 'width', 'height', 'rotationDeg', 'zIndex', 'opacity'].includes(key));
}
