import { renderHook } from '@testing-library/react-native';
import { useColorScheme } from 'react-native';
import { tokens } from '../tokens';
import { useAppColor } from '../useAppColor';

jest.mock('react-native/Libraries/Utilities/useColorScheme', () => ({ __esModule: true, default: jest.fn() }));

it('V0-NF-03 follows the system light/dark scheme by default and resolves colours from the shared tokens', async () => {
  const scheme = useColorScheme as jest.Mock;
  expect(Object.keys(tokens.color.app.dark.normal).sort()).toEqual(Object.keys(tokens.color.app.light.normal).sort());
  scheme.mockReturnValue('dark');
  expect((await renderHook(() => useAppColor())).result.current).toBe(tokens.color.app.dark.normal);
  scheme.mockReturnValue('light');
  expect((await renderHook(() => useAppColor())).result.current).toBe(tokens.color.app.light.normal);
});
