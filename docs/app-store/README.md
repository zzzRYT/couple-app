# App Store 제출 자료 (V0)

App Store Connect(ASC)에 넣을 초안이다. 이 저장소는 아무것도 제출하지 않는다. 제출, 약관 동의, 법적 확인은 소유자가 한다. 기준일 2026-11-06, Apple 원문으로 확인했다.

## 메타데이터

언어별 원문은 `metadata/<언어>/*.txt`에 있고 그대로 붙여 넣으면 된다. 글자 수 한도는 `tools/tests/store-readiness.test.mjs`가 확인한다.

| ASC 항목 | 파일 | 한도 |
|---|---|---|
| Name | `name.txt` | 2~30자 |
| Subtitle | `subtitle.txt` | 30자 |
| Promotional Text | `promotional_text.txt` | 170자 |
| Description | `description.txt` | 4,000자, 일반 텍스트 |
| Keywords | `keywords.txt` | 100바이트, 앱 이름·다른 앱 이름 금지 |
| Support URL | `support_url.txt` | 실제 연락처로 이어져야 함 |
| Privacy Policy URL | `privacy_url.txt` | |

- 이름 `Aroom`은 다른 앱이 쓰고 있으면 등록되지 않는다. 그때는 `아룸 - 커플 디데이`, `Aroom - Couple D+Day`처럼 설명을 붙인다(소유자 결정, G2).
- 첫 버전이라 What's New는 쓰지 않는다.
- Copyright: `2026 <소유자 이름>`. 이름은 소유자가 정한다.
- Primary Category: Lifestyle. Secondary: 없음.
- 가격: 무료. 인앱 결제 없음.
- 빼빼로데이는 앱 안의 시즌 이름일 뿐 메타데이터에는 쓰지 않는다(가이드라인 5.2.1, 제3자 상표). 초안도 "크리스마스 같은 시즌 기념일"로만 적었다.

## 연령 등급

ASC 설문에 소유자가 답한다. 아래는 V0 동작 기준의 권장 답이다.

| 항목 | 답 | 근거 |
|---|---|---|
| Parental Controls, Age Assurance | No | 없음 |
| Unrestricted Web Access | No | 링크는 개인정보 처리방침, 약관을 외부 브라우저로 열 뿐이다 |
| User-Generated Content | No | Apple 정의는 "broad distribution"이다. 기념일은 연결된 두 사람만 본다 |
| Social Media | No | 피드, 발견 기능 없음 |
| Messaging and Chat | No | 대화 기능 없음 |
| Advertising | No | 광고 없음 |
| 성숙한 주제, 의료, 성, 폭력, 도박, 콘테스트, 뽑기 | None / No | 없음 |
| Shared Location | No | 위치를 쓰지 않는다 |
| Dating and Relationships | No (소유자 확인) | 아래 참고 |

**Dating and Relationships**: 2026-11-16부터 ASC에 생기는 문항이다. Apple 정의는 "Features that enable dating or relationship connections between real people and/or a virtual companion"이고, 포함이면 최소 18+다. 아룸은 이미 아는 두 사람이 초대 코드로 일정을 공유할 뿐, 새로운 사람을 찾거나 연결하는 기능이 없어서 No를 권장한다. 다만 문장이 넓어서 해석은 소유자 몫이고, 심사 메모에 같은 설명을 넣어 두었다.

앱은 "만 14세 이상"이라고 안내한다(`onb.age`). 설문 결과는 4+가 될 텐데, Apple은 앱 정책이 더 높으면 등급을 올려 설정할 수 있게 한다. Apple 등급에 14+는 없고 그 위는 16+다. 유지 또는 상향은 소유자 결정이다.

## App Privacy

수집 데이터는 모두 **Tracking: No**, 목적은 **App Functionality**다.

| ASC 분류 → 유형 | 앱에서의 내용 | 사용자 연결 |
|---|---|---|
| Contact Info → Name | 직접 입력한 이름(상대에게 보임). Apple에서 받지 않음 | Yes |
| Contact Info → Email Address | Apple 로그인이 준 주소를 Supabase Auth가 보관. 가리기 주소일 수 있음 | Yes |
| User Content → Other User Content | 사귄 날, 시간대, 직접 추가한 기념일(제목, 메모, 날짜, 반복), 생일 월·일, 선택 입력한 태어난 해 | Yes |
| Identifiers → User ID | 계정 id(무작위 UUID) | Yes |
| Diagnostics → Crash Data | `expo-updates`를 쓰는 앱에 Expo 공식 안내가 요구하는 답 | No |

- Expo 공식 안내(<https://docs.expo.dev/distribution/app-stores/>)는 `expo-updates`를 쓰면 "Yes, we collect data"와 Crash Data를 고르라고 한다.
- EAS Update 요청에는 OS, 프로젝트 ID, 설치별 임의 토큰이 들어간다(<https://expo.dev/privacy-explained>). 이 토큰이 Identifiers → Device ID에 해당하는지는 Apple, Expo 어디에도 명시가 없다. 재설치하면 바뀌고 계정과 연결되지 않는다. Apple 정의가 "other device-level ID"까지 넓으므로 Device ID(사용자 연결 No)로 신고하는 쪽을 권장한다. 최종 판단은 소유자 몫이다.
- 나머지는 모두 No: 위치, 연락처, 건강, 금융, 민감 정보, 사진·영상, 오디오, 검색·방문 기록, 구매, 사용 데이터.
- 알림은 기기에서 예약하고 위젯 데이터는 기기에 있으므로 Apple 기준의 "수집"이 아니다.
- 신고·방·프롬프트·커버 사진이 돌아오면 이 표를 다시 쓴다.

## 스크린샷

iPhone 전용(`TARGETED_DEVICE_FAMILY = 1`)이라 iPad는 필요 없다.

| 필수 슬롯 | 쓰는 크기 | 기기 |
|---|---|---|
| iPhone Dynamic Island (medium) | 1206 x 2622 | iPhone 17 |
| Dynamic Island (large), 없으면 Face ID (large) 필수 | 1320 x 2868 | iPhone 17 Pro Max |

PNG는 알파 채널이 없어야 한다. iPhone Duo 크기는 iOS 27.1 SDK 이상으로 빌드하는 앱에 2027년 4월부터 필요하다.

## 심사 경로

Sign in with Apple만 있어서 데모 계정이 없고, 연결 기능은 두 번째 사람이 필요하다. 앱에 데모 모드나 심사용 로그인을 넣지 않는다. 대신 심사자가 자기 Apple 계정으로 로그인해 미리 준비한 데모 공간에 초대 코드로 들어온다.

앱 코드가 그대로라 일반 사용자에게 켜질 수 있는 경로가 없고, `app.config.ts`의 개발 로그인 차단도 그대로다. 코드 유효 기간을 늘리는 일은 운영 DB의 SQL 편집기에서만 된다. `supabase/tests/app_review_invite.test.sql`이 다음을 확인한다: 앱 경로는 24시간 그대로, 로그인 사용자는 연장 불가, 연장한 코드도 1회용.

준비 (소유자, production 빌드 설치 뒤, 제출 직전):

1. 데모 공간을 쓸 Apple 계정으로 production 앱에 로그인한다. 아직 실제 데이터가 없으니 소유자 계정을 심사 기간 동안 쓰거나 별도 계정을 쓴다. 한 사람은 공간 하나에만 들어갈 수 있다.
2. "새로 시작하기"로 사귄 날을 넣고 이름을 `Demo`로, 생일도 넣는다.
3. 8자리 초대 코드를 적어 두고 "홈에서 기다릴게요"를 누른다. 이후 재발급을 누르지 않는다. 재발급하면 이 코드가 취소된다.
4. Supabase 대시보드 Authentication → Users에서 그 계정의 User UID를 복사한다.
5. 운영 프로젝트 SQL 편집기에서 실행하고 **정확히 1행**이 바뀌었는지 본다.

   ```sql
   update public.invitation
      set expires_at = now() + interval '30 days'
    where created_by_user_id = '<User UID>' and status = 'active'
   returning id, expires_at;
   ```

6. `review-notes.txt`의 `{{INVITE_CODE}}`, `{{INVITE_EXPIRES}}`, `{{REVIEW_CONTACT}}`를 채워 ASC App Review Information → Notes에 넣는다. 4,000바이트 안이다. Sign-in information에는 계정을 넣지 않는다.

재심사: 코드는 1회용이다. 심사자가 쓴 뒤 다시 심사받으려면 데모 계정에서 연결을 끊고 1~6을 다시 한다. 심사자가 계정을 삭제했다면 공간이 사라지므로 역시 처음부터 한다.

제출 전에 App Review 연락처(이름, 이메일, 국가 번호가 붙은 전화번호)가 필요하다. Apple이 데모 계정을 요구하며 반려하면 가이드라인 2.1대로 "built-in demo mode"는 사전 승인이 필요하므로, 답변으로 위 경로를 다시 설명하고 그래도 안 되면 소유자가 결정한다.
