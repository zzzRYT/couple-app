import { V0_FEATURES } from '../features';
import { authOptions } from '../auth';
it('V0-NF-06 hides later slices and reuses auth switches', () => {
  expect(V0_FEATURES).toEqual({ room: false, prompt: false, cover: false, reportBlock: false, notifications: false, kakaoLogin: authOptions.kakao, emailLogin: authOptions.devEmail });
});
