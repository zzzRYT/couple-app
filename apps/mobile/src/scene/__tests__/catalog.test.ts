import { catalogEntries, getAsset, getLegacyAsset, imageForAsset, variantUri } from '../catalog';
it('loads catalog entries and chooses lamp night art', () => {
  expect(catalogEntries).toHaveLength(24);
  expect(getAsset('unknown')).toBeNull();
  expect(getLegacyAsset('unknown')).toBeNull();
  const lamp = getAsset('obj_decor_lamp');
  expect(lamp).not.toBeNull();
  expect(variantUri(lamp!, 'night')).toContain('__night');
  expect(imageForAsset(lamp!, 'night')).toBeDefined();
  const retired = [{ ...lamp!, status: 'retired' }];
  expect(getAsset('obj_decor_lamp', retired)).toBeNull();
  expect(getLegacyAsset('obj_decor_lamp', retired)).toEqual(retired[0]);
});
