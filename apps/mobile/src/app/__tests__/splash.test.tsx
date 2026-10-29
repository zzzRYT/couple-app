import { render, waitFor } from '@testing-library/react-native';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import RootLayout from '../_layout';
jest.mock('expo-font', () => ({ useFonts: jest.fn() }));
jest.mock('expo-splash-screen', () => ({ preventAutoHideAsync: jest.fn().mockResolvedValue(true), hideAsync: jest.fn().mockResolvedValue(true) }));
jest.mock('expo-router', () => { const Stack = () => null; Stack.Screen = () => null; return { Stack }; });
jest.mock('../../lib/AppContext', () => ({ AppProvider: ({ children }: { children: unknown }) => children, useApp: () => ({ session: null, sessionLoaded: false, sessionExpired: false }) }));
jest.mock('../../features/space/SpaceContext', () => ({ SpaceProvider: ({ children }: { children: unknown }) => children, useSpace: () => ({ entry: 'loading', spaceId: null, ended: null, reload: jest.fn() }) }));

it('keeps the splash screen until fonts and translations are ready', async () => {
  const fonts = useFonts as jest.Mock;
  fonts.mockReturnValue([false, null]);
  const screen = await render(<RootLayout />);
  expect(SplashScreen.preventAutoHideAsync).toHaveBeenCalled();
  expect(screen.toJSON()).toBeNull();
  expect(SplashScreen.hideAsync).not.toHaveBeenCalled();
  fonts.mockReturnValue([true, null]);
  await screen.rerender(<RootLayout />);
  await waitFor(() => expect(SplashScreen.hideAsync).toHaveBeenCalled());
});
