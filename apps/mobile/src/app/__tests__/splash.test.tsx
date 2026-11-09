import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import RootLayout from '../_layout';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { safeMetrics } from '../../test/render';
jest.mock('expo-font', () => ({ useFonts: jest.fn() }));
jest.mock('expo-splash-screen', () => ({ preventAutoHideAsync: jest.fn().mockResolvedValue(true), hideAsync: jest.fn().mockResolvedValue(true) }));
jest.mock('expo-notifications', () => ({ setNotificationHandler: jest.fn() }));
jest.mock('expo-router', () => { const Stack = () => null; Stack.Screen = () => null; return { Stack }; });
jest.mock('../../lib/AppContext', () => ({ AppProvider: ({ children }: { children: unknown }) => children, useApp: () => ({ session: null, sessionLoaded: false, sessionExpired: false }) }));
jest.mock('../../features/space/SpaceContext', () => ({ SpaceProvider: ({ children }: { children: unknown }) => children, useSpace: () => ({ entry: 'loading', spaceId: null, ended: null, state: { status: 'loading', snapshot: null, offline: false }, reload: jest.fn() }) }));
afterEach(() => { jest.useRealTimers(); jest.clearAllMocks(); });
const app = <SafeAreaProvider initialMetrics={safeMetrics}><RootLayout /></SafeAreaProvider>;

it('V0-F13-AC-06 takes over from the launch screen with the Aroomi splash and keeps it while the app boots', async () => {
  const fonts = useFonts as jest.Mock;
  fonts.mockReturnValue([false, null]);
  const screen = await render(app);
  expect(SplashScreen.preventAutoHideAsync).toHaveBeenCalled();
  expect(screen.getByTestId('brand-splash')).toBeTruthy();
  expect(SplashScreen.hideAsync).not.toHaveBeenCalled();
  await fireEvent(screen.getByTestId('brand-splash-image'), 'load');
  expect(SplashScreen.hideAsync).toHaveBeenCalledTimes(1);
  // Fonts and translations ready, the session still loading: the splash, not a skeleton, covers the boot.
  fonts.mockReturnValue([true, null]);
  await screen.rerender(app);
  await waitFor(() => expect(screen.getByLabelText(/불러오는 중이에요|Loading|読み込み中です/)).toBeTruthy());
  expect(screen.getByTestId('brand-splash')).toBeTruthy();
  expect(SplashScreen.hideAsync).toHaveBeenCalledTimes(1);
});

it('drops the launch screen anyway if the splash image never reports', async () => {
  jest.useFakeTimers();
  (useFonts as jest.Mock).mockReturnValue([false, null]);
  await render(app);
  expect(SplashScreen.hideAsync).not.toHaveBeenCalled();
  await act(() => { jest.advanceTimersByTime(1500); });
  expect(SplashScreen.hideAsync).toHaveBeenCalledTimes(1);
});
