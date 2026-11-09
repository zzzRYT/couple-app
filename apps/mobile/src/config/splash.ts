import { tokens } from '../theme/tokens.ts';

/**
 * V0-12: the native launch screen (expo-splash-screen in app.config.ts) and the in-app splash draw the same Aroomi
 * image at the same width, centred on the app ground, so the handoff between them is invisible.
 */
export const SPLASH = {
  image: './assets/icon/splash-icon.png',
  imageWidth: 200,
  background: { light: tokens.color.app.light.normal.bg, dark: tokens.color.app.dark.normal.bg },
} as const;
