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
- 공개 지원 이메일: `jinjinstar3@gmail.com`. 앱 문의하기 행, 사이트, 심사 메모가 같은 주소를 쓴다.
- 첫 버전이라 What's New는 쓰지 않는다.
- Copyright: `metadata/copyright.txt`. 언어별 항목이 아니라 한 값만 넣는다. Apple 문서는 기호가 자동으로 붙는다고 하므로, ASC 입력 칸 미리보기에서 `©`가 두 번 보이지 않는지 확인한다.
- 운영자 표기: 처리방침에 `이재진`(ko), `Jaejin Lee`(en, ja). 연락처는 공개 지원 이메일만 쓰고 전화번호와 주소는 넣지 않는다.
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
| Contact Info → Email Address | Apple 로그인이 준 주소 또는 이메일 로그인 주소를 Supabase Auth가 보관. 가리기 주소일 수 있음 | Yes |
| User Content → Other User Content | 사귄 날, 시간대, 직접 추가한 기념일(제목, 메모, 날짜, 반복), 생일 월·일, 선택 입력한 태어난 해 | Yes |
| Identifiers → User ID | 계정 id(무작위 UUID) | Yes |
| Diagnostics → Crash Data | `expo-updates`를 쓰는 앱에 Expo 공식 안내가 요구하는 답 | No |

- Expo 공식 안내(<https://docs.expo.dev/distribution/app-stores/>)는 `expo-updates`를 쓰면 "Yes, we collect data"와 Crash Data를 고르라고 한다.
- EAS Update 요청에는 OS, 프로젝트 ID, 설치별 임의 토큰이 들어간다(<https://expo.dev/privacy-explained>). 이 토큰이 Identifiers → Device ID에 해당하는지는 Apple, Expo 어디에도 명시가 없다. 재설치하면 바뀌고 계정과 연결되지 않는다. Apple 정의가 "other device-level ID"까지 넓으므로 Device ID(사용자 연결 No)로 신고하는 쪽을 권장한다. 최종 판단은 소유자 몫이다.
- 비밀번호는 Supabase Auth에 해시로만 남는다. Apple의 "collect" 정의는 읽을 수 있는 형태로 보관하는 경우이고 비밀번호 유형도 없어서 따로 신고하지 않는다.
- 봉인한 Apple 토큰은 서버가 열 수 있으므로 읽을 수 있는 형태로 볼 여지가 있고, 맞는 유형은 Other Data Types("Any other data types not mentioned")뿐이다. Apple 문서에 명시가 없으니 Other Data Types(App Functionality, 사용자 연결 Yes)로 신고하는 쪽을 권장하고, 최종 판단은 소유자 몫이다.
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

심사자는 Apple 계정 없이 첫 화면의 "이메일로 로그인"으로 데모 계정에 들어온다. 상대가 연결된 계정이라 두 번째 사람 없이 홈을 본다. 초대 흐름은 심사자가 자기 Apple 계정으로 새로 시작해서 본다.

앱에 데모 모드나 심사용 로그인을 넣지 않는다. 메일을 연결하기 전까지 이메일 계정은 `review_login_email` 주소만 만들 수 있고, 만드는 쪽은 운영자뿐이다. `app.config.ts`의 개발 로그인 차단도 그대로다.

준비 (소유자, production 빌드 설치 뒤, 제출 직전):

1. `docs/password-auth-operations.md`의 "App Review 데모 계정" 순서대로 두 계정을 만들고 연결한다. 비밀번호는 저장소, 채팅, 문서에 적지 않는다.
2. ASC App Review Information → Sign-in information에 `review@…` 주소와 비밀번호를 넣는다. Apple은 데모 계정을 이 칸에 넣고, 만료되지 않게 두라고 한다.
3. `review-notes.txt`를 복사해 `{{DEMO_EMAIL}}`, `{{DEMO_PASSWORD}}`를 채운 뒤 Notes에 넣는다. 4,000바이트 안이다. 저장소의 파일에는 실제 값을 넣지 않는다.
4. 메일을 연결했다면 메모에서 "Email sign-up and password reset are not open yet" 단락을 지운다.

재심사: 심사자가 계정을 삭제했으면 같은 문서의 "심사자가 삭제한 뒤 다시 만들기"를 한다. 연결만 끊었으면 계정은 남으므로 "처음 만들기"의 3~5단계만 다시 한다. 심사자가 비밀번호를 바꿨으면 Dashboard에서 다시 정한다.

제출 전에 App Review 연락처(이름, 이메일, 국가 번호가 붙은 전화번호)가 필요하다.
