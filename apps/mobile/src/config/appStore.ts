// Kept out of identity.ts: app.config.ts imports that file, so editing it changes the runtime fingerprint and blocks OTA.
/** The production App Store record (eas.json submit.production ascAppId); V0-11 reads its published version. */
export const APP_STORE = { id: '6831581664', url: 'https://apps.apple.com/app/id6831581664' } as const;
