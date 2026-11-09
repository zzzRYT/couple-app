import { checkForOtaUpdate, hotUpdater } from '../ota';

type Update = { shouldForceUpdate: boolean; updateBundle: () => Promise<boolean> };
const updater = (update: Update | null | Error) => ({
  checkForUpdate: jest.fn(async () => { if (update instanceof Error) throw update; return update; }),
  reload: jest.fn(async () => undefined),
});
const cast = (fake: ReturnType<typeof updater>) => fake as unknown as Parameters<typeof checkForOtaUpdate>[0];

describe('V0-F14-AC-03 OTA update check (Hot Updater)', () => {
  it('stays off in builds without the client key', async () => {
    expect(hotUpdater).toBeNull();
    await expect(checkForOtaUpdate()).resolves.toBeUndefined();
  });

  it('asks for the build fingerprint and stages the update for the next launch', async () => {
    const updateBundle = jest.fn(async () => true);
    const fake = updater({ shouldForceUpdate: false, updateBundle });
    await checkForOtaUpdate(cast(fake));
    expect(fake.checkForUpdate).toHaveBeenCalledWith({ updateStrategy: 'fingerprint' });
    expect(updateBundle).toHaveBeenCalledTimes(1);
    expect(fake.reload).not.toHaveBeenCalled();
  });

  it('reloads at once only for a forced update that downloaded', async () => {
    const forced = updater({ shouldForceUpdate: true, updateBundle: async () => true });
    await checkForOtaUpdate(cast(forced));
    expect(forced.reload).toHaveBeenCalledTimes(1);
    const failed = updater({ shouldForceUpdate: true, updateBundle: async () => false });
    await checkForOtaUpdate(cast(failed));
    expect(failed.reload).not.toHaveBeenCalled();
  });

  it('keeps the running bundle when nothing is new or the check fails', async () => {
    const none = updater(null);
    await checkForOtaUpdate(cast(none));
    expect(none.reload).not.toHaveBeenCalled();
    const offline = updater(new TypeError('Network request failed'));
    await expect(checkForOtaUpdate(cast(offline))).resolves.toBeUndefined();
    expect(offline.reload).not.toHaveBeenCalled();
  });
});
