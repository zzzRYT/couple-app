// TODO(G2 이름 확인 전: 스토어에 등록 금지) — the production ids are placeholders; only the development ids may be registered now.
export const APP_IDENTITY = {
  name: 'Aroom',
  slug: 'aroom',
  iosBundleId: 'com.jinjinstar.aroom',
  androidApplicationId: 'com.jinjinstar.aroom',
  devIosBundleId: 'com.jinjinstar.aroom.dev',
  devAndroidApplicationId: 'com.jinjinstar.aroom.dev',
  appGroupId: 'group.com.jinjinstar.aroom',
  devAppGroupId: 'group.com.jinjinstar.aroom.dev',
  widgetBundleIdSuffix: '.widgets',
  supportDomain: 'aroom.jinjinstar.com',
  supportEmail: 'jinjinstar3@gmail.com' as string | null,
  PLACEHOLDER: true,
} as const;
/** Off until H04 §9 steps 1-3 are done: a store build with the extension has no signing for it, so Release iOS fails. Simulator builds need no signing and turn it on with `IOS_WIDGETS=true`. */
export const IOS_WIDGETS_SIGNED = true;
/** Expo project @zzzryt/aroom; the id is public configuration, not a secret. */
export const EAS_PROJECT = { owner: 'zzzryt', projectId: '99310e9a-4aee-4116-b9da-b6a26460f7e3' } as const;
export type AppVariant = 'development' | 'preview' | 'production';
export function appVariant(value: string | undefined): AppVariant {
  return value === 'development' || value === 'preview' ? value : 'production';
}
