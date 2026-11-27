import { BufferGeometry, Material, Texture, type Object3D } from 'three';
import { disposePlanetAsset } from '../planetAsset';

jest.mock('three', () => ({
  BufferGeometry: class { dispose = jest.fn(); },
  Material: class { dispose = jest.fn(); },
  Texture: class { dispose = jest.fn(); },
}));
jest.mock('three/examples/jsm/loaders/GLTFLoader.js', () => ({ GLTFLoader: class {} }));

it('disposes shared geometry, materials and textures once when an asset is released', () => {
  const geometry = new BufferGeometry(); const texture = new Texture(); const material = new Material() as Material & { map: Texture };
  material.map = texture;
  const node = { geometry, material };
  const asset = { traverse: (visit: (node: unknown) => void) => { visit(node); visit(node); } } as unknown as Object3D;
  disposePlanetAsset(asset);
  expect(geometry.dispose).toHaveBeenCalledTimes(1);
  expect(material.dispose).toHaveBeenCalledTimes(1);
  expect(texture.dispose).toHaveBeenCalledTimes(1);
});
