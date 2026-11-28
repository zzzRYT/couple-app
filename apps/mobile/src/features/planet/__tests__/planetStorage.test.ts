import * as SecureStore from 'expo-secure-store';
import { planetLevel } from '../level';
import { readPlanet, writePlanet } from '../planetStorage';

jest.mock('expo-secure-store', () => ({ getItemAsync: jest.fn(), setItemAsync: jest.fn() }));

it('preserves placements and the highest level when the current entitlement is lower', async () => {
  const data = { maxLevel: 4, placements: [{ id: 'one', latitude: 0, longitude: 0, heading: 30, radius: 0.2 }, { id: 'two', latitude: 0, longitude: 90, heading: 0, radius: 0.3, assetId: 'sample-tree', scale: 0.5 }] };
  await writePlanet('space-1', data);
  expect(SecureStore.setItemAsync).toHaveBeenCalledWith('v1.planet.space-1', JSON.stringify(data));
  jest.mocked(SecureStore.getItemAsync).mockResolvedValueOnce(JSON.stringify(data));
  const restored = await readPlanet('space-1');
  expect(restored.placements).toEqual(data.placements);
  expect(planetLevel(0, [restored.maxLevel]).level).toBe(4);
});

it('does not replace corrupt stored placements with an empty planet', async () => {
  jest.mocked(SecureStore.getItemAsync).mockResolvedValueOnce('{"maxLevel":4,"placements":[{}]}');
  await expect(readPlanet('space-1')).rejects.toThrow('Invalid planet data');
  jest.mocked(SecureStore.getItemAsync).mockResolvedValueOnce('{"maxLevel":1,"placements":[{"id":"a","latitude":0,"longitude":0,"heading":0,"radius":0.3,"scale":0}]}');
  await expect(readPlanet('space-1')).rejects.toThrow('Invalid planet data');
});
