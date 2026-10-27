import { findIntrusions, protectedZones, validatePresentation, validateScene, validateTheme, type ValidationResult } from '../../../packages/scene-contract/src/index.ts';

/** Server viewport profile for `room-portrait-v1`: system safe areas plus the room toolbar and tab bar. */
export const VIEWPORT = { width: 390, height: 844, safeTop: 47 + 56, safeBottom: 34 + 49 };
export type Candidate = { sceneDocument: unknown; roomPresentation: unknown; roomThemeDocument: unknown };
export function validateCandidate(candidate: Candidate, activeAssetIds: Iterable<string>): ValidationResult {
  const ids = new Set(['app_mascot', ...activeAssetIds]);
  const errors = [
    ...validateScene(candidate.sceneDocument, ids).errors,
    ...validatePresentation(candidate.roomPresentation).errors.map((e) => ({ path: `/roomPresentation${e.path}`, code: e.code })),
    ...validateTheme(candidate.roomThemeDocument).errors.map((e) => ({ path: `/roomThemeDocument${e.path}`, code: e.code })),
  ];
  if (errors.length === 0) {
    const scene = candidate.sceneDocument as { objects: { x: number; y: number; width: number; height: number; rotationDeg: number }[]; texts: { x: number; y: number; width: number; height: number; rotationDeg: number }[] };
    const zones = protectedZones({ ...VIEWPORT, controls: [] });
    const aspect = VIEWPORT.width / VIEWPORT.height;
    for (const index of findIntrusions(scene.objects, zones, aspect)) errors.push({ path: `/objects/${index}`, code: 'protectedZone' });
    for (const index of findIntrusions(scene.texts, zones, aspect)) errors.push({ path: `/texts/${index}`, code: 'protectedZone' });
  }
  return { ok: errors.length === 0, errors };
}
export { validateScene } from '../../../packages/scene-contract/src/index.ts';
