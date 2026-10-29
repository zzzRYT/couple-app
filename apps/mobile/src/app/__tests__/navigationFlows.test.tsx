import { Text } from 'react-native';
import { router, Slot, Stack, Tabs } from 'expo-router';
import { act, renderRouter, testRouter, waitFor } from 'expo-router/testing-library';

const screen = (name: string) => () => <Text>{name}</Text>;
const tabsLayout = () => <Tabs><Tabs.Screen name="home" /><Tabs.Screen name="room" /><Tabs.Screen name="settings/index" /></Tabs>;
const routes = {
  _layout: () => <Stack />,
  '(auth)/_layout': () => <Slot />,
  '(auth)/index': screen('welcome'),
  '(auth)/welcome': screen('welcome'),
  '(auth)/login': screen('login'),
  '(onboarding)/_layout': () => <Slot />,
  '(onboarding)/index': screen('choice'),
  '(onboarding)/choose-space': screen('choice'),
  '(onboarding)/create-space': screen('create'),
  '(onboarding)/join': screen('join'),
  '(tabs)/_layout': tabsLayout,
  '(tabs)/index': screen('home'),
  '(tabs)/home': screen('home'),
  '(tabs)/room': screen('room'),
  '(tabs)/settings/index': screen('settings'),
  invite: screen('invite'),
  'prompt/index': screen('prompt'),
};

type NavState = { routes?: { name: string; state?: NavState }[] };
function countTabs(state: NavState | undefined): number {
  return (state?.routes ?? []).reduce((total, route) => total + (route.name === '(tabs)' ? 1 : 0) + countTabs(route.state), 0);
}

const cases = [
  { name: '1 cold signed-out start', start: '/welcome', actions: [], back: false, tabs: 0, path: '/welcome' },
  { name: '2 sign-in success discards auth history', start: '/welcome', actions: [['push', '/login'], ['replace', '/home']], back: false, tabs: 1, path: '/home' },
  { name: '3 created space then invite keeps Home below it', start: '/choose-space', actions: [['push', '/create-space'], ['replace', '/home'], ['push', '/invite']], back: true, tabs: 1, path: '/invite' },
  { name: '4 invite later returns to one Home root', start: '/home', actions: [['push', '/invite'], ['back']], back: false, tabs: 1, path: '/home' },
  { name: '5 Home opens invite above the existing tabs', start: '/home', actions: [['push', '/invite']], back: true, tabs: 1, path: '/invite' },
  { name: '6 invite close does not add a second tabs navigator', start: '/home', actions: [['push', '/invite'], ['back']], back: false, tabs: 1, path: '/home' },
  { name: '7 logout removes the previous tabs tree', start: '/home', actions: [['replace', '/login']], back: false, tabs: 0, path: '/login' },
  { name: '8 re-login starts a clean tabs tree', start: '/home', actions: [['replace', '/login'], ['replace', '/home']], back: false, tabs: 1, path: '/home' },
  { name: '9 clean logout has no back stack', start: '/settings', actions: [['replace', '/login']], back: false, tabs: 0, path: '/login' },
  { name: '10 warm invite link backs to Home', start: '/home', actions: [['push', '/join'], ['back']], back: false, tabs: 1, path: '/home' },
  { name: '11 cold invite Join back goes to choice anchor', start: '/join', actions: [['dismissTo', '/choose-space']], back: false, tabs: 0, path: '/choose-space' },
  { name: '12 repeated prompt navigation resolves to one modal route', start: '/room', actions: [['navigate', '/prompt'], ['navigate', '/prompt']], back: true, tabs: 1, path: '/prompt' },
] as const;

it.each(cases)('$name', async ({ start, actions, back, tabs, path }) => {
  const result = await renderRouter(routes, { initialUrl: start });
  for (const [method, target] of actions) {
    if (method === 'back') await testRouter.back();
    else if (method === 'dismissTo') await act(async () => { router.dismissTo(target!); });
    else if (method === 'push') await testRouter.push(target!);
    else if (method === 'replace') await testRouter.replace(target!);
    else await testRouter.navigate(target!);
  }
  await waitFor(() => expect(result.getPathname()).toBe(path));
  expect(testRouter.canGoBack()).toBe(back);
  expect(countTabs(result.getRouterState() as NavState)).toBe(tabs);
});
