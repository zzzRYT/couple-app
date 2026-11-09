import { readdirSync } from 'fs';
import { resolve } from 'path';
import { useState } from 'react';
import { Text } from 'react-native';
import { Stack } from 'expo-router';
import { act, renderRouter, screen } from 'expo-router/testing-library';
import { AppStack } from '../AppStack';
import type { AppGate } from '../appGate';

type Gate = AppGate['kind'];
let setGate: (gate: Gate) => void = () => {};
/** Booting draws no stack (the splash covers it), so the stack mounts again once the gate settles, as in the app. */
function Root({ initial }: { initial: Gate }) {
  const [gate, set] = useState<Gate>(initial);
  setGate = set;
  return gate === 'booting' ? null : <AppStack gate={gate} />;
}
// Every route file, each drawn as its own name, so a screen added later is covered too.
const files = (readdirSync(resolve(__dirname, '../../app'), { recursive: true }) as string[])
  .filter((file) => file.endsWith('.tsx') && !file.includes('__tests__') && !file.endsWith('_layout.tsx'))
  .map((file) => file.replace(/\.tsx$/, ''));
function routes(initial: Gate) {
  const map: Record<string, () => React.JSX.Element> = { _layout: () => <Root initial={initial} />, '(auth)/_layout': () => <Stack />, '(onboarding)/_layout': () => <Stack />, '(tabs)/_layout': () => <Stack /> };
  for (const file of files) map[file] = () => <Text>{`route:${file}`}</Text>;
  return map;
}
const shown = (file: string) => screen.getByText(`route:${file}`);
const gate = (next: Gate) => act(async () => { setGate(next); });

it('a first Apple sign-in lands on the password prompt, not the auth-callback loader that never ends', async () => {
  const app = await renderRouter(routes('signedOut'), { initialUrl: '/' });
  expect(shown('(auth)/index')).toBeTruthy();
  await gate('booting');
  await gate('needsPasswordPrompt');
  expect(app.getPathname()).toBe('/set-password-prompt');
  expect(shown('set-password-prompt')).toBeTruthy();
  expect(screen.queryByText('route:auth-callback')).toBeNull();
});

it('opens the prompt on a relaunch while it is still due, and the space choice once it is answered', async () => {
  const app = await renderRouter(routes('needsPasswordPrompt'), { initialUrl: '/' });
  expect(app.getPathname()).toBe('/set-password-prompt');
  await gate('needsOnboardingChoice');
  expect(shown('(onboarding)/index')).toBeTruthy();
});

it('the gate flipping without a boot in between still opens the prompt', async () => {
  await renderRouter(routes('signedOut'), { initialUrl: '/login' });
  await gate('needsPasswordPrompt');
  expect(shown('set-password-prompt')).toBeTruthy();
});

it.each([
  ['signedOut', '(auth)/index'],
  ['passwordRecovery', 'new-password'],
  ['needsOnboardingChoice', '(onboarding)/index'],
  ['ended', 'ended'],
  ['active', '(tabs)/index'],
] as const)('a cold start in %s opens %s', async (initial, file) => {
  await renderRouter(routes(initial), { initialUrl: '/' });
  expect(shown(file)).toBeTruthy();
});

it('keeps invite links reachable before sign-in', async () => {
  await renderRouter(routes('signedOut'), { initialUrl: '/i/ABCD2345' });
  expect(shown('i/[code]')).toBeTruthy();
});

it('V0-NF-06 keeps the V1 end-space screen behind its flag, like report', async () => {
  await renderRouter(routes('active'), { initialUrl: '/settings/end-space' });
  expect(screen.queryByText('route:settings/end-space')).toBeNull();
  await renderRouter(routes('active'), { initialUrl: '/settings/disconnect' });
  expect(shown('settings/disconnect')).toBeTruthy();
});
