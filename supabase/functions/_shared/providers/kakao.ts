// Kakao "unlink" placeholder behind the same hidden flag as Kakao sign-in (app config KAKAO_ENABLED = false).
// The call shape follows Kakao's REST "Unlink" with the admin key; it has never been run against Kakao (G5, G18).

export interface KakaoClient {
  /** Disconnects the app from the Kakao account; Kakao asks apps to treat the account as withdrawn only after this succeeds. */
  unlink(kakaoUserId: string): Promise<void>;
}
type Fetch = (input: string, init: RequestInit) => Promise<Response>;

/** Null unless KAKAO_UNLINK_ENABLED is "true" and KAKAO_ADMIN_KEY is set; callers then refuse a Kakao deletion before changing anything. */
export function kakaoClientFromEnv(env: (name: string) => string | undefined, fetchFn: Fetch = fetch): KakaoClient | null {
  const adminKey = env('KAKAO_ADMIN_KEY');
  if (env('KAKAO_UNLINK_ENABLED') !== 'true' || !adminKey) return null;
  return {
    async unlink(kakaoUserId) {
      const body = new URLSearchParams({ target_id_type: 'user_id', target_id: kakaoUserId });
      const response = await fetchFn('https://kapi.kakao.com/v1/user/unlink', {
        method: 'POST', headers: { Authorization: `KakaoAK ${adminKey}`, 'Content-Type': 'application/x-www-form-urlencoded' }, body: body.toString(),
      });
      if (!response.ok) throw new Error('KAKAO_UNLINK_FAILED');
    },
  };
}
