import { authOptions } from './auth';

export const V0_FEATURES = {
  room: false, prompt: false, cover: false, reportBlock: false,
  kakaoLogin: authOptions.kakao, emailLogin: authOptions.devEmail, notifications: true,
} as const;
