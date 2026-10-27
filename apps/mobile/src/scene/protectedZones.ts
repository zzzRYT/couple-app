import { findIntrusions, protectedZones as contractZones } from '../../../../packages/scene-contract/src/protectedZones';
import type { Rect } from '../../../../packages/scene-contract/src/geometry';
import { defaultMascotPlacement } from '../../../../packages/scene-contract/src/mascot';
import type { SceneDocument, SceneObject, SceneText } from '../lib/client';
export type PixelRect = { x: number; y: number; width: number; height: number };
export type RoomLayout = { width: number; height: number; safeTop: number; safeBottom: number; toolbar: PixelRect; ddayWidget: PixelRect | null; tabBarHeight: number };
/** Design defaults (design/handoff.md §8) used until views report their measured frames; text scaling grows the toolbar up to the 160% cap. */
export function estimateLayout(width: number, height: number, fontScale: number, os: 'ios' | 'android'): RoomLayout {
  const [safeTop, safeBottom] = os === 'ios' ? [47, 34] : [32, 24];
  const toolbarHeight = 56 * Math.min(Math.max(fontScale, 1), 1.6);
  return { width, height, safeTop, safeBottom, toolbar: { x: 0, y: safeTop, width, height: toolbarHeight }, ddayWidget: null, tabBarHeight: os === 'ios' ? 49 : 56 };
}
const normalize = (rect: PixelRect, layout: RoomLayout): Rect => ({ x: rect.x / layout.width, y: rect.y / layout.height, width: rect.width / layout.width, height: rect.height / layout.height });
/** Protected zones in normalized scene units: system safe areas, the room toolbar, the D-day widget and the system tab bar. */
export function roomProtectedZones(layout: RoomLayout): Rect[] {
  const controls = [layout.toolbar, ...(layout.ddayWidget ? [layout.ddayWidget] : [])].map((rect) => normalize(rect, layout));
  return contractZones({ width: layout.width, height: layout.height, safeTop: layout.safeTop, safeBottom: layout.safeBottom + layout.tabBarHeight, controls });
}
/** Decorations that would cover protected UI are not drawn; a misplaced mascot falls back to its default spot. */
export function placeNodes(scene: SceneDocument, layout: RoomLayout): { objects: SceneObject[]; texts: SceneText[]; hidden: number } {
  const zones = roomProtectedZones(layout);
  const aspect = layout.width / layout.height;
  const objectIntrusions = new Set(findIntrusions(scene.objects, zones, aspect));
  const textIntrusions = new Set(findIntrusions(scene.texts, zones, aspect));
  const objects = scene.objects.flatMap((node, index) => {
    if (!objectIntrusions.has(index)) return [node];
    if (node.assetId === 'app_mascot') { const fallback = { ...node, ...defaultMascotPlacement() }; return findIntrusions([fallback], zones, aspect).length ? [] : [fallback]; }
    return [];
  });
  const texts = scene.texts.filter((_node, index) => !textIntrusions.has(index));
  return { objects, texts, hidden: scene.objects.length - objects.length + scene.texts.length - texts.length };
}
export { findIntrusions };
