import { authOptions } from './auth';

export const V0_FEATURES = {
  room: false, prompt: false, cover: false, reportBlock: false, endSpace: false,
  kakaoLogin: authOptions.kakao, emailLogin: authOptions.devEmail, notifications: true,
} as const;

export function v1Features(variant: string | undefined) { return { planet: variant === 'development' }; }
export const V1_FEATURES = v1Features(process.env.EXPO_PUBLIC_APP_VARIANT);
