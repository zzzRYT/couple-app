/** Stand-in for Hot Updater in Jest, which has no native module: tests pass their own updater to checkForOtaUpdate. */
export const HotUpdater = {
  init: () => ({ checkForUpdate: async () => null, reload: async () => undefined }),
};
