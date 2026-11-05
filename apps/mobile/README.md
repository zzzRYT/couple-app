# Mobile

The owner creates and manages the Expo account. This app uses EAS for development, preview, TestFlight, production builds, and OTA updates. Check the current EAS plan allowance before using build capacity.

## Release

- `development` is the dev client; `preview` is an ad hoc internal build; `testflight` is the store-signed iOS profile that uploads to the `preview` channel; `production` uses the `production` channel.
- App version is `1.0.0`; EAS remote versioning increments the build number. OTA compatibility uses the `fingerprint` runtime policy.
- Use **Actions → Release iOS** to build the `testflight` profile and optionally submit it. Use **Actions → OTA** to publish a preview update or republish a checked update group to production.
- Before the first release, complete the [owner-only steps in H01](../../specs/002-couple-dday-v0/handoffs/H01-release-pipeline.md#10-owner-only-steps).

## TestFlight and App Store Connect

Drafts for the owner to paste or confirm in App Store Connect (ASC) for the `.dev` app (`com.jinjinstar.aroom.dev`). Nothing here is published or submitted by the repository, and none of it is legal advice: the owner (and legal review) decides the final wording. Everything below describes the V0 build as of this commit: Apple sign-in (Kakao is off, email sign-in is development-only), invite-link pairing, the D+Day home, custom anniversaries, local reminders, and widgets once the extension is signed (`IOS_WIDGETS_SIGNED`, H04 §9). Room, prompt, cover photo and report/block screens are hidden by `V0_FEATURES`. If any of those come back, redo the privacy answers.

### App Privacy answers (V0)

Collected, **linked to the user**, **not used for tracking**, purpose **App Functionality** for every row:

| ASC category → type | What it is in the app | Notes |
|---|---|---|
| Contact Info → Name | the display name the person types (1–20 characters), shown to the partner | not read from the Apple or Kakao profile |
| Contact Info → Email Address | the address the sign-in provider returns, kept as the login identifier in Supabase Auth | **not in the H06 default list; added here** because Supabase Auth stores it. With Apple it can be a private relay address, and it may be empty. Owner: keep this row unless the Auth data is changed to not keep it |
| User Content → Other User Content | start date, time zone, custom anniversaries (title, memo, date, repeat), birthday month and day | the optional birth year is stored too but only its owner can read it |
| Identifiers → User ID | the account id (a random UUID) | |

Not collected, answer **No** for each: Location, Contacts, Health & Fitness, Financial Info, Sensitive Info, Photos or Videos, Audio, Browsing or Search History, Purchases, Usage Data (product interaction, advertising), Diagnostics (crash and performance), Other Data. Tracking: **No**; no third-party advertising or analytics SDK is in the app (checked against `apps/mobile/package.json`: no analytics, crash reporter, ads or attribution package; there is no push token because reminders are scheduled locally on the device).

Third parties to mention when ASC or the policy asks: Supabase (database, auth and realtime hosting) and Apple (sign-in). OTA updates use Expo (EAS Update). Whether EAS Update's request metadata counts as a data type is the owner's call.

Privacy Policy URL to enter: `https://aroom.jinjinstar.com/privacy/` (ko), `/en/privacy/`, `/ja/privacy/`. The pages are still drafts, see the checklist below.

### Export compliance

`ITSAppUsesNonExemptEncryption = false` is already set in `app.config.ts` (`ios.infoPlist`). The app only uses encryption built into iOS (HTTPS/TLS), so ASC should not ask the export-compliance question per build. If ASC still asks, answer that the app uses no encryption beyond what the operating system provides and is exempt.

### TestFlight: What to Test

Korean (paste as-is):

```
이번 빌드에서 확인해 주세요.
1. Apple로 로그인하고 이름·생일을 입력해 보세요.
2. 초대 링크를 상대에게 보내 연결해 보세요. 연결되면 같은 D+Day가 두 폰에 보여야 해요.
3. 사귄 날을 바꾸고, 직접 기념일(제목·날짜·매년 반복)을 추가·수정·삭제해 보세요. 상대 폰에도 바뀐 내용이 보이는지 확인해 주세요.
4. 설정에서 알림을 켜고 시각과 미리 알림을 바꿔 보세요. 기념일 당일과 전날에 알림이 오는지 확인해 주세요.
5. 설정에서 언어(한국어·English·日本語)와 화면 모드(라이트·다크)를 바꿔 보세요. 글자 크기를 크게 해도 잘리는 곳이 없는지 봐 주세요.
6. 로그아웃, 연결 끊기, 계정 삭제 뒤에 예약된 알림이 오지 않는지 확인해 주세요.
어색한 문구, 잘리는 글자, 앱이 멈추는 순간이 있으면 스크린샷과 함께 알려 주세요.
```

English (paste as-is):

```
Please check the following in this build.
1. Sign in with Apple, then enter your name and birthday.
2. Send an invite link to your partner and connect. Both phones should show the same D+Day.
3. Change the day you started dating, then add, edit and delete a custom anniversary (title, date, repeat yearly). Check that the other phone shows the change.
4. In Settings, turn on notifications and change the time and the early reminder. Check that reminders arrive on the day and the day before.
5. In Settings, switch the language (한국어 / English / 日本語) and the appearance (light / dark). Try larger text sizes and look for clipped text.
6. After logging out, disconnecting or deleting your account, check that no scheduled reminder still arrives.
Please send a screenshot for anything that reads oddly, is cut off, or freezes the app.
```

If the widgets are signed in the build under test, add this line to both: `7. 홈 화면·잠금 화면에 D+Day 위젯을 추가해 보세요.` / `7. Add the D+Day widget to the Home Screen and Lock Screen.`

### TestFlight: beta description

Korean: `아룸(Aroom)은 두 사람이 함께한 날(D+Day)과 기념일을 같이 보는 앱이에요. 초대 링크로 연결하면 두 폰에서 같은 날짜와 기념일이 보이고, 기념일 알림과 위젯을 쓸 수 있어요. 지금은 가족·친구와 함께 쓰는 비공개 테스트 빌드예요.`

English: `Aroom shows a couple the days they have been together (D+Day) and their anniversaries on both phones. Connect with an invite link, then use reminders and widgets. This is a private test build shared with family and friends.`

Feedback email: use `APP_IDENTITY.supportEmail` once it is set (`apps/mobile/src/config/identity.ts`, A-23). It is `null` today, so leave the ASC feedback email on the owner's personal address until then. Internal testers need neither Beta App Review nor a public description; external testing is out of scope for V0 (H01 §10).

### Owner checklist: `site/` pages that still describe the old product

The pages are drafts marked "pending legal review". Nothing below was edited. Each item says what to change in all of `site/privacy/`, `site/en/privacy/`, `site/ja/privacy/` (and the delete-account pages where noted).

- [ ] **Information processed**: the sentence lists shared room content, home cover photos, generated decorations, prompts, reports and generation attempts. V0 handles: login identifier, display name, birthday month and day (optional year, readable only by its owner), start date, time zone, language and appearance settings, custom anniversaries, invite codes.
- [ ] **AI processing section**: V0 sends nothing to an AI provider. Remove it, or keep it only if the room/prompt features return.
- [ ] **Retention and deletion**: the page says home cover photos, decorations, prompts and generation attempts are deleted. For V0, list what is deleted with the space (the start date, custom anniversaries and member links). The server's 30-day wait after ending or disconnecting (`purge_after_days = 30`) and the immediate purge on account deletion are unchanged; make the page match the in-app wording. Drop the "24 hours for replaced cover photos" sentence.
- [ ] **On-device data**: add that reminders are scheduled on the device, and that widget data and a cached copy of the space are stored on the device and removed on logout, disconnect, partner-ended and account deletion.
- [ ] **Delete account page** (`site/delete-account/`, `/en/`, `/ja/`): replace "방, 홈 커버 사진, 생성 장식, 프롬프트 기록" and the AI-consent-record wording with the V0 data above. Check the path described (Settings → "계정 삭제") still matches the settings screen.
- [ ] **Third parties and transfers**: name Supabase and Apple (and Kakao only if sign-in is turned on), and any overseas transfer legal requires.
- [ ] **Support email**: the pages say "[address coming soon]". Set `supportEmail` in `site/contact.js` and `APP_IDENTITY.supportEmail` in one change (A-23); the app's "Contact us" row appears when the latter is set.
- [ ] **Terms of Use**: there is no page, so the settings "Terms of Use" row stays disabled. Decide whether to publish terms; the row needs a URL from the owner (H06 §9).
- [ ] **Licences**: the fonts bundled in the app are OFL-licensed and the V0 settings screen has no licences row. Ask legal whether the app must show them.
- [ ] Remove the "draft — pending legal review" banners and the `[pending legal review]` placeholders only after legal signs off.
