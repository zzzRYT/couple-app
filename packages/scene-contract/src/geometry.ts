export type Rect = { x: number; y: number; width: number; height: number };
export type SceneNode = Rect & { rotationDeg: number };

/** Node coordinates are normalized centers; aspect converts canvas units to pixels. */
export function rotatedBounds(node: SceneNode, aspect = 1): Rect {
  const radians = node.rotationDeg * Math.PI / 180;
  const cos = Math.abs(Math.cos(radians));
  const sin = Math.abs(Math.sin(radians));
  const width = node.width * cos + node.height * sin / aspect;
  const height = node.width * sin * aspect + node.height * cos;
  return { x: node.x - width / 2, y: node.y - height / 2, width, height };
}
export function overlaps(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}
