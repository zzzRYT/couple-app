import { PostHog } from 'posthog-react-native';
import { APP_IDENTITY } from '../../config/identity';
import { analyticsEnvironment, POSTHOG_HOST } from '../../config/analytics';
import { postHogOptions, track } from '../analytics';
jest.unmock('../analytics');

type Sent = { batch: { event: string; properties: Record<string, unknown> }[] };
const inviteLink = 'https://aroom.jinjinstar.com/i/ABCD2345';
const token = 'phc_test';

it('sends the funnel without the launch URL, tagged with the environment, and asks for no flags or surveys', async () => {
  const fetch = jest.fn<Promise<unknown>, [string, { method: string; body?: string }]>(async () => ({ status: 200, ok: true, json: async () => ({}), text: async () => '{}' }));
  global.fetch = fetch as unknown as typeof global.fetch;
  const client = new PostHog(token, { ...postHogOptions('development'), persistence: 'memory', flushAt: 1, disableCompression: true });
  client.capture('Application Opened', { url: inviteLink, $current_url: inviteLink });
  client.capture('invite_shared', { surface: 'invite_screen', method: 'share' });
  await client.flush();
  await client.shutdown();
  const batches = fetch.mock.calls.filter(([url]) => url === `${POSTHOG_HOST}/batch/`);
  const events = batches.flatMap(([, init]) => (JSON.parse(init.body!) as Sent).batch);
  expect(events.map((event) => event.event)).toEqual(expect.arrayContaining(['Application Opened', 'invite_shared']));
  expect(events.find((event) => event.event === 'invite_shared')!.properties).toMatchObject({ surface: 'invite_screen', method: 'share' });
  for (const { properties } of events) {
    expect(properties.environment).toBe('development');
    expect(properties).not.toHaveProperty('url');
    expect(properties).not.toHaveProperty('$current_url');
  }
  for (const [url, init] of fetch.mock.calls) expect(`${url} ${init.body ?? ''}`).not.toContain('ABCD2345');
  // 4.84.3 always loads the remote config, a GET of the public project config that carries no event or device data. Nothing else may go out: no flags, no surveys.
  const others = fetch.mock.calls.filter(([url]) => url !== `${POSTHOG_HOST}/batch/`);
  expect(others.map(([url, init]) => [url, init.method, init.body])).toEqual([[`https://us-assets.i.posthog.com/array/${token}/config`, 'GET', undefined]]);
});

it('sends nothing from a build without a project token', () => {
  jest.isolateModules(() => {
    const PostHogClass = jest.fn();
    jest.doMock('posthog-react-native', () => ({ PostHog: PostHogClass }));
    const isolated = jest.requireActual<typeof import('../analytics')>('../analytics');
    delete process.env.EXPO_PUBLIC_POSTHOG_TOKEN;
    isolated.track('invite_opened');
    expect(PostHogClass).not.toHaveBeenCalled();
  });
});

it('calls only the store builds production', () => {
  expect(analyticsEnvironment(APP_IDENTITY.iosBundleId)).toBe('production');
  expect(analyticsEnvironment(APP_IDENTITY.androidApplicationId)).toBe('production');
  expect(analyticsEnvironment(APP_IDENTITY.devIosBundleId)).toBe('development');
  expect(analyticsEnvironment(APP_IDENTITY.devAndroidApplicationId)).toBe('development');
  expect(analyticsEnvironment(null)).toBe('development');
});

export const rejectsFreeformProperties = () => {
  // @ts-expect-error an invite code is not an invite_shared property
  track('invite_shared', { surface: 'invite_screen', method: 'share', code: 'X' });
  // @ts-expect-error invite_opened carries no properties
  track('invite_opened', { code: 'X' });
};
