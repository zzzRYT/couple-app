/** Stand-in for Hot Updater in Jest, which has no native module: tests pass their own updater to checkForOtaUpdate. */
export const HotUpdater = {
  init: () => ({ checkForUpdate: async () => null, reload: async () => undefined, getBundleId: () => '00000000-0000-0000-0000-000000000000', getChannel: () => 'production', getMinBundleId: () => '00000000-0000-0000-0000-000000000000' }),
};
