import { overlaps, rotatedBounds, type Rect, type SceneNode } from './geometry.ts';

export function protectedZones(input: { width: number; height: number; safeTop: number; safeBottom: number; controls: Rect[] }): Rect[] {
  return [
    { x: 0, y: 0, width: 1, height: input.safeTop / input.height },
    { x: 0, y: 1 - input.safeBottom / input.height, width: 1, height: input.safeBottom / input.height },
    ...input.controls,
  ];
}
export function findIntrusions(nodes: SceneNode[], zones: Rect[], aspect = 1): number[] {
  return nodes.flatMap((node, index) => {
    const rect = rotatedBounds(node, aspect);
    const outside = rect.x < 0 || rect.y < 0 || rect.x + rect.width > 1 || rect.y + rect.height > 1;
    return outside || zones.some((zone) => overlaps(rect, zone)) ? [index] : [];
  });
}
