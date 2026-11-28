import { BufferGeometry, Material, Texture, type Object3D } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export async function loadPlanetAsset(glb: ArrayBuffer): Promise<Object3D> {
  return (await new GLTFLoader().parseAsync(glb, '')).scene;
}

export function disposePlanetAsset(asset: Object3D): void {
  const resources = new Set<{ dispose(): void }>();
  asset.traverse((node) => {
    const renderable = node as Object3D & { geometry?: BufferGeometry; material?: Material | Material[] };
    if (renderable.geometry instanceof BufferGeometry) resources.add(renderable.geometry);
    const materials = Array.isArray(renderable.material) ? renderable.material : [renderable.material];
    for (const material of materials) {
      if (!(material instanceof Material)) continue;
      resources.add(material);
      for (const value of Object.values(material)) if (value instanceof Texture) resources.add(value);
    }
  });
  for (const resource of resources) resource.dispose();
}
