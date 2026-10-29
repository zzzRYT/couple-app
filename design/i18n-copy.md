# i18n-copy.md — 모든 화면 문구와 번역 (한국어 · English · 日本語)

> 이 문서는 디자인 원본에서 자동으로 만든 표예요. 구현은 **키만 코드에 쓰고** 텍스트는 번역 리소스(`ko-KR`, `en-US`, `ja-JP`)로 둬요. `{name}` 형태는 보간 변수예요. 달력·할 일·가격을 떠올리게 하는 표현과(마일스톤 알림 문구는 예외)(홈 배경 사진 한 장 말고는) 사진 기능 표현은 쓰지 않았어요. 일본어·영어 문구는 디자이너가 쓴 초안이라 **원어민 검수**가 필요해요(handoff.md).

- 총 키 수: **642**
- 사용자가 입력한 방 문구와 프롬프트는 번역하지 않고 입력한 그대로 저장·표시해요.
- 서버 오류는 언어 중립 코드(`VERSION_CONFLICT` 등)만 오고, 앱이 아래 키로 문구를 골라요: `VERSION_CONFLICT`→`preview.conflict.*`·`undo.conflict.*`, `QUOTA_REACHED`→`prompt.quota.*`, `CONSENT_REQUIRED`→`prompt.consent.need`, `SESSION_OCCUPIED`→`prompt.partner`, `SESSION_EXPIRED`→`prompt.idle.me.*`, `INVITE_EXPIRED`→`join.expired.*`, `INVITE_USED`→`join.used.*`, `SPACE_FULL`→`join.full.*`, `ALREADY_IN_SPACE`→`join.hasSpace.*`, `GENERATION_REFUSED`(`category`별)→`gen.refuse.*`(`ip`→`gen.refuse.ip`, `people`, `unsafe`, `personal`, `photo_like`→`gen.refuse.photo`, `off_purpose`·`injection`→`gen.refuse.purpose`), `GENERATION_FAILED`→`gen.fail.*`, `GENERATION_DISABLED`→`gen.disabled.*`, `LIBRARY_FULL`→`gen.lib.full`, `REPORT_RATE_LIMITED`→`report.obj.limit`, `UNSUPPORTED_REQUEST`→`prompt.unsupported.*`, `BRAND_REQUEST`→`prompt.brand.*`, `AUTH_EXPIRED`→`sys.login.*`. (코드 이름은 계약 문서 `contracts/api.md`의 이름을 확인해서 맞춰야 해요.)

## 샘플 데이터(사용자가 입력하는 값 · 번역하지 않음)

| 키 | 한국어 | English | 日本語 |
|---|---|---|---|
| `sample.partner` | 하루 | Haru | ハル |
| `sample.me` | 나 | You | 自分 |

## 날짜 표기

| 키 | 한국어 | English | 日本語 |
|---|---|---|---|
| `date.since` | 2025년 6월 29일부터 | since June 29, 2025 | 2025年6月29日から |
| `date.sinceShort` | 2025.06.29부터 | Since Jun 29, 2025 | 2025/06/29から |

## D-day 문구(숫자와 단어 순서를 템플릿으로)

| 키 | 한국어 | English | 日本語 |
|---|---|---|---|
| `dday.eyebrow` | 함께한 지 | Together | 一緒に過ごして |
| `dday.count` | {n}일째 | Day {n} | {n}日目 |

## 방

| 키 | 한국어 | English | 日本語 |
|---|---|---|---|
| `room.ctl.settings` | 설정 | Settings | 設定 |
| `room.ctl.decorate` | 꾸미기 | Decorate | 飾る |
| `room.loading` | 방을 불러오는 중이에요 | Loading your room | 部屋を読み込んでいます |
| `room.offline` | 인터넷이 끊겨서 보기만 할 수 있어요 | You're offline, so the room is view-only | オフラインのため、表示のみ可能です |
| `room.syncing` | 동기화하는 중 | Syncing | 同期中 |
| `room.syncFail.title` | 동기화하지 못했어요 | Couldn't sync | 同期できませんでした |
| `room.syncFail.body` | 마지막으로 확인한 방을 보여 드리고 있어요. | Showing the room as last seen. | 最後に確認した部屋を表示しています。 |
| `room.partnerChanged` | {name}님이 방을 바꿨어요 | {name} changed the room | {name}さんが部屋を変更しました |
| `room.recover.title` | 방 데이터를 읽지 못했어요 | Couldn't read the room data | 部屋のデータを読み込めませんでした |
| `room.recover.body` | 저장된 방은 그대로 있어요. 다시 불러와 주세요. | Your saved room is untouched. Please try loading it again. | 保存されている部屋はそのままです。もう一度読み込んでください。 |
| `room.recover.action` | 다시 불러오기 | Load again | もう一度読み込む |
| `room.ddayHidden` | 날짜 위젯은 이 방에서 숨겨져 있어요. 메인 화면에서는 그대로 보여요. | The day counter is hidden in this room. It still shows on the home screen. | 日数ウィジェットはこの部屋では非表示です。メイン画面ではそのまま表示されます。 |
| `room.protect.legend.system` | 시스템 영역 | System area | システム領域 |
| `room.protect.legend.ctl` | 방 도구 막대 | Room toolbar | 部屋のツールバー |
| `room.protect.legend.dday` | 날짜 위젯 | Day counter | 日数ウィジェット |
| `room.protect.legend.text` | 글자 가독성 영역 | Text readability area | 文字の可読領域 |
| `room.partnerLive` | {name}님이 꾸미는 중 · 실시간으로 보고 있어요 | {name} is decorating · live view | {name}さんが飾り中 · ライブ表示 |
| `room.watch` | 지켜보기 | Watch | 見守る |
| `room.protect.legend.tab` | 시스템 탭 막대 | System tab bar | システムのタブバー |

## 공통

| 키 | 한국어 | English | 日本語 |
|---|---|---|---|
| `common.back` | 뒤로 | Back | 戻る |
| `common.close` | 닫기 | Close | 閉じる |
| `common.cancel` | 취소 | Cancel | キャンセル |
| `common.confirm` | 확인 | OK | OK |
| `common.retry` | 다시 시도 | Try again | もう一度試す |
| `common.next` | 다음 | Next | 次へ |
| `common.done` | 완료 | Done | 完了 |
| `common.save` | 저장 | Save | 保存 |
| `common.later` | 나중에 | Not now | あとで |
| `common.loading` | 불러오는 중이에요 | Loading | 読み込み中です |

## S01 온보딩

| 키 | 한국어 | English | 日本語 |
|---|---|---|---|
| `onb.p1.title` | 둘이 함께한 날을 세어요 | Count the days you've had together | ふたりで過ごした日を数えます |
| `onb.p1.body` | 함께한 날짜를 정하면 메인 화면에서 오늘이 며칠째인지 볼 수 있어요. | Set the date you got together and see which day it is on the home screen. | 一緒に過ごし始めた日を決めると、メイン画面で今日が何日目か分かります。 |
| `onb.p2.title` | 프롬프트로 우리 방을 꾸며요 | Decorate your room with a prompt | プロンプトでふたりの部屋を飾ろう |
| `onb.p2.body` | 원하는 분위기를 글로 적으면 미리 보기가 나와요. 마음에 들 때만 적용해요. | Describe the mood you want and see a preview. Apply it only when you like it. | 好きな雰囲気を書くとプレビューが出ます。気に入ったときだけ反映できます。 |
| `onb.p3.title` | 방에는 아루미가 함께 있어요 | Aroomi lives in your room | 部屋にはアルーミがいます |
| `onb.p3.body` | 방 한쪽에서 두 사람을 반겨 줘요. | It greets the two of you from a corner of the room. | 部屋の一角で、ふたりを迎えてくれます。 |
| `onb.start` | 시작하기 | Get started | はじめる |
| `onb.hasAccount` | 이미 계정이 있어요 | I already have an account | アカウントをお持ちの方 |
| `onb.legal.lead` | 계속하면 만 14세 이상이며 아래 내용에 동의하는 것으로 봐요. | By continuing, you confirm you are 14 or older and agree to the following. | 続けると、14歳以上であり、以下に同意したものとみなされます。 |
| `onb.legal.links` | 이용약관 · 개인정보 처리방침 | Terms of Use · Privacy Policy | 利用規約 · プライバシーポリシー |
| `onb.age` | 만 14세 이상만 사용할 수 있어요. | You must be 14 or older to use Aroom. | ご利用は14歳以上の方に限ります。 |
| `onb.back.title` | 다시 만나서 반가워요 | Welcome back | おかえりなさい |
| `onb.back.body` | 지난번에 쓴 방법으로 로그인해 주세요. | Sign in the way you did last time. | 前回と同じ方法でログインしてください。 |
| `onb.lastUsed` | 최근 사용 | Last used | 前回の方法 |
| `onb.skip` | 건너뛰기 | Skip | スキップ |
| `onb.pageOf` | {n} / {total} | {n} of {total} | {n} / {total} |

## S02 로그인

| 키 | 한국어 | English | 日本語 |
|---|---|---|---|
| `login.title` | 로그인 방법을 골라 주세요 | Choose how to sign in | ログイン方法を選んでください |
| `login.kakao` | 카카오로 계속하기 | Continue with Kakao | Kakaoで続ける |
| `login.apple` | Apple로 계속하기 | Continue with Apple | Appleで続ける |
| `login.email` | 이메일로 계속하기 | Continue with email | メールで続ける |
| `login.redirect.title` | 카카오로 이동하고 있어요 | Opening Kakao | Kakaoに移動しています |
| `login.redirect.body` | 로그인을 마치면 아룸으로 돌아와요. | You'll come back to Aroom after signing in. | ログインが終わると、アルームに戻ります。 |
| `login.processing` | 로그인하는 중이에요 | Signing you in | ログインしています |
| `login.cancelled.title` | 로그인을 취소했어요 | Sign-in was canceled | ログインをキャンセルしました |
| `login.cancelled.body` | 원할 때 다시 시도할 수 있어요. | You can try again whenever you like. | いつでももう一度試せます。 |
| `login.error.title` | 로그인하지 못했어요 | Couldn't sign you in | ログインできませんでした |
| `login.error.body` | 잠시 후 다시 시도하거나 다른 방법을 골라 주세요. | Try again in a moment, or choose another method. | しばらくしてからもう一度試すか、別の方法を選んでください。 |
| `login.email.title` | 이메일 주소를 입력해 주세요 | Enter your email address | メールアドレスを入力してください |
| `login.email.label` | 이메일 | Email | メールアドレス |
| `login.email.invalid` | 이메일 주소 형식을 확인해 주세요. | Check the format of the email address. | メールアドレスの形式を確認してください。 |
| `login.email.send` | 인증 코드 받기 | Send me a code | 認証コードを受け取る |
| `login.code.title` | 메일로 보낸 코드를 입력해 주세요 | Enter the code we emailed you | メールで送ったコードを入力してください |
| `login.code.body` | {email}로 6자리 코드를 보냈어요. 메일의 링크를 눌러도 로그인할 수 있어요. | We sent a 6-digit code to {email}. You can also tap the link in the email. | {email}に6桁のコードを送りました。メールのリンクをタップしてもログインできます。 |
| `login.code.label` | 인증 코드 | Verification code | 認証コード |
| `login.code.confirm` | 확인 | Verify | 確認する |
| `login.code.resend` | 코드 다시 받기 | Resend code | コードを再送する |
| `login.code.resendIn` | {s}초 뒤에 다시 받을 수 있어요 | You can resend in {s}s | {s}秒後に再送できます |
| `login.code.wrong` | 코드가 맞지 않아요. 다시 확인해 주세요. | That code isn't right. Check it and try again. | コードが違います。もう一度確認してください。 |
| `login.code.expired` | 코드가 만료됐어요. 새 코드를 받아 주세요. | That code has expired. Request a new one. | コードの有効期限が切れました。新しいコードを受け取ってください。 |
| `login.code.rate` | 시도가 너무 많아요. {m}분 뒤에 다시 해 주세요. | Too many attempts. Try again in {m} minutes. | 試行回数が多すぎます。{m}分後にもう一度お試しください。 |
| `login.other` | 다른 방법으로 로그인 | Use another method | 別の方法でログイン |
| `login.cancel` | 로그인 취소 | Cancel sign-in | ログインをやめる |
| `login.brandNote` | 공식 버튼 에셋으로 교체 | Replace with official button asset | 公式ボタン素材に差し替え |

## S03 커플 공간 생성

| 키 | 한국어 | English | 日本語 |
|---|---|---|---|
| `space.choice.title` | 우리 공간을 시작해요 | Start your space | ふたりのスペースを始めましょう |
| `space.choice.body` | 새 공간을 만들거나 상대에게 받은 초대 코드로 참여할 수 있어요. | Create a new space or join with an invitation code from your partner. | 新しく作るか、パートナーからの招待コードで参加できます。 |
| `space.title` | 함께한 날짜를 알려 주세요 | When did you two get together? | ふたりが一緒になった日を教えてください |
| `space.body` | 이 날짜부터 함께한 일수를 세어요. 나중에 설정에서 고칠 수 있어요. | We'll count the days from this date. You can change it later in Settings. | この日から一緒に過ごした日数を数えます。あとで設定から変更できます。 |
| `space.date.label` | 함께한 날짜 | Date you got together | 一緒になった日 |
| `space.date.hint` | 예: 2025년 6월 29일 | e.g. June 29, 2025 | 例：2025年6月29日 |
| `space.date.future` | 오늘 이후의 날짜는 고를 수 없어요. | You can't pick a date after today. | 今日より後の日付は選べません。 |
| `space.date.invalid` | 존재하지 않는 날짜예요. 다시 확인해 주세요. | That date doesn't exist. Check it again. | 存在しない日付です。もう一度確認してください。 |
| `space.tz.note` | 방의 낮·밤은 지금 있는 곳의 시간대({tz})에 맞춰 바뀌어요. 설정에서 바꿀 수 있어요. | Day and night in your room follow your current time zone ({tz}). You can change it in Settings. | 部屋の昼と夜は、今いる場所のタイムゾーン（{tz}）に合わせて切り替わります。設定で変更できます。 |
| `space.tz.name` | 서울 | Seoul | ソウル |
| `space.create` | 우리 공간 만들기 | Create our space | ふたりのスペースを作る |
| `space.creating` | 공간을 만들고 있어요 | Creating your space | スペースを作っています |
| `space.ok.title` | 공간이 만들어졌어요 | Your space is ready | スペースができました |
| `space.ok.body` | 이제 상대를 초대해 주세요. | Next, invite your partner. | 次はパートナーを招待しましょう。 |
| `space.ok.next` | 상대 초대하기 | Invite your partner | パートナーを招待する |
| `space.err.title` | 공간을 만들지 못했어요 | Couldn't create your space | スペースを作れませんでした |
| `space.err.body` | 인터넷 연결을 확인하고 다시 시도해 주세요. | Check your internet connection and try again. | インターネット接続を確認して、もう一度お試しください。 |
| `space.date.pick` | 날짜 고르기 | Choose a date | 日付を選ぶ |
| `space.year` | 년 | Year | 年 |
| `space.month` | 월 | Month | 月 |
| `space.day` | 일 | Day | 日 |

## S04 초대 코드 생성·공유

| 키 | 한국어 | English | 日本語 |
|---|---|---|---|
| `invite.title` | 상대를 초대해 주세요 | Invite your partner | パートナーを招待しましょう |
| `invite.body` | 아래 코드를 상대에게 보내 주세요. 코드는 24시간 동안 한 번만 쓸 수 있어요. | Send this code to your partner. It works once and expires in 24 hours. | このコードをパートナーに送ってください。コードは24時間のあいだ、1回だけ使えます。 |
| `invite.code.label` | 초대 코드 | Invite code | 招待コード |
| `invite.expires` | {h}시간 {m}분 뒤에 만료돼요 | Expires in {h} h {m} min | あと{h}時間{m}分で期限切れです |
| `invite.expiresAt` | {date}까지 | Until {date} | {date}まで |
| `invite.expiresAt.sample` | 10월 25일 오후 8:30 | Oct 25, 8:30 PM | 10月25日 20:30 |
| `invite.expiring` | 곧 만료돼요 · {m}분 남았어요 | Expiring soon · {m} min left | まもなく期限切れ · 残り{m}分 |
| `invite.expired.title` | 코드가 만료됐어요 | This code has expired | コードの期限が切れました |
| `invite.expired.body` | 새 코드를 만들어 상대에게 다시 보내 주세요. | Create a new code and send it to your partner. | 新しいコードを作って、パートナーにもう一度送ってください。 |
| `invite.share` | 코드 공유하기 | Share code | コードを共有 |
| `invite.copy` | 코드 복사 | Copy code | コードをコピー |
| `invite.copied` | 복사했어요 | Copied | コピーしました |
| `invite.shareMsg` | 우리 공간에 와 줘요. {link} 초대 코드: {code} (24시간 안에 입력해 주세요) | Come join our space. {link} Invite code: {code} (use it within 24 hours) | ふたりのスペースに来てね。 {link} 招待コード：{code}（24時間以内に入力してください） |
| `invite.shareSheet.title` | 공유 | Share | 共有 |
| `invite.shareCancelled` | 공유를 취소했어요. 코드는 그대로 쓸 수 있어요. | Sharing was canceled. The code still works. | 共有をキャンセルしました。コードはそのまま使えます。 |
| `invite.reissue` | 새 코드 만들기 | Create a new code | 新しいコードを作る |
| `invite.reissue.title` | 새 코드를 만들까요? | Create a new code? | 新しいコードを作りますか？ |
| `invite.reissue.body` | 지금 코드는 바로 쓸 수 없게 돼요. 상대가 아직 입력하지 않았다면 새 코드를 보내야 해요. | The current code stops working right away. If your partner hasn't used it yet, you'll need to send the new one. | 今のコードはすぐに使えなくなります。パートナーがまだ入力していない場合は、新しいコードを送る必要があります。 |
| `invite.waiting.title` | 상대를 기다리고 있어요 | Waiting for your partner | パートナーを待っています |
| `invite.waiting.body` | 상대가 코드를 입력한 뒤 앱을 열면 여기에서 확인할 수 있어요. | Once your partner enters the code, you'll see it here when you open the app. | パートナーがコードを入力したあと、アプリを開くとここで確認できます。 |
| `invite.generating` | 코드를 만들고 있어요 | Creating your code | コードを作っています |
| `invite.err.title` | 코드를 만들지 못했어요 | Couldn't create a code | コードを作れませんでした |
| `invite.err.body` | 인터넷 연결을 확인하고 다시 시도해 주세요. | Check your internet connection and try again. | インターネット接続を確認して、もう一度お試しください。 |
| `invite.later` | 나중에 초대하기 | Invite later | あとで招待する |
| `invite.once` | 한 번만 쓸 수 있어요 | One use only | 1回だけ使えます |

## S05 초대 코드 입력

| 키 | 한국어 | English | 日本語 |
|---|---|---|---|
| `join.title` | 초대 코드를 입력해 주세요 | Enter your invite code | 招待コードを入力してください |
| `join.body` | 상대에게 받은 8자리 코드를 입력해 주세요. | Enter the 8-character code your partner sent you. | パートナーから受け取った8文字のコードを入力してください。 |
| `join.paste` | 붙여넣기 | Paste | 貼り付け |
| `join.check` | 코드 확인 | Check code | コードを確認 |
| `join.checking` | 코드를 확인하고 있어요 | Checking the code | コードを確認しています |
| `join.found.heading` | 이 공간에 참여할까요? | Join this space? | このスペースに参加しますか？ |
| `join.found.title` | {name}님의 공간이에요 | {name}'s space | {name}さんのスペース |
| `join.found.body` | 함께한 날짜는 {date}이에요. 참여하면 두 사람의 공간이 돼요. | You got together on {date}. Joining makes it your space for two. | 一緒になった日は{date}です。参加すると、ふたりのスペースになります。 |
| `join.accept` | 참여하기 | Join | 参加する |
| `join.decline` | 참여하지 않기 | Don't join | 参加しない |
| `join.expired.title` | 이 코드는 만료됐어요 | This code has expired | このコードは期限切れです |
| `join.expired.body` | 상대에게 새 코드를 보내 달라고 해 주세요. | Ask your partner to send a new code. | パートナーに新しいコードを送ってもらってください。 |
| `join.used.title` | 이미 사용된 코드예요 | This code was already used | このコードは使用済みです |
| `join.used.body` | 한 번 쓴 코드는 다시 쓸 수 없어요. 상대에게 새 코드를 요청해 주세요. | A code can only be used once. Ask your partner for a new one. | 一度使ったコードは再利用できません。パートナーに新しいコードをお願いしてください。 |
| `join.invalid.title` | 코드가 맞지 않아요 | That code isn't valid | コードが正しくありません |
| `join.invalid.body` | 문자를 다시 확인해 주세요. 헷갈리는 0과 O, 1과 I는 코드에 쓰지 않아요. | Check the characters. Codes never use 0/O or 1/I. | 文字をもう一度確認してください。コードには0とO、1とIは使われません。 |
| `join.full.title` | 이미 두 사람이 있는 공간이에요 | This space already has two people | すでに2人いるスペースです |
| `join.full.body` | 이 공간에는 더 참여할 수 없어요. 상대에게 확인해 주세요. | You can't join this space. Check with your partner. | このスペースには参加できません。パートナーに確認してください。 |
| `join.hasSpace.title` | 이미 다른 공간에 있어요 | You're already in another space | すでに別のスペースにいます |
| `join.hasSpace.body` | 한 번에 하나의 공간만 쓸 수 있어요. 지금 공간에서 먼저 나온 뒤(설정의 공간 종료) 코드를 다시 입력해 주세요. | You can only be in one space at a time. Leave your current space first (Settings › End space), then enter the code again. | 同時に使えるスペースは1つだけです。まず今のスペースから抜けて（設定の「スペースを終了」）、もう一度コードを入力してください。 |
| `join.hasSpace.action` | 지금 공간 보기 | View current space | 今のスペースを見る |
| `join.ok.title` | 참여했어요 | You're in | 参加しました |
| `join.ok.body` | {name}님과 함께하는 공간이 열렸어요. | Your space with {name} is open. | {name}さんとのスペースが開きました。 |
| `join.ok.next` | 메인으로 가기 | Go to home | メインへ進む |
| `join.err` | 코드를 확인하지 못했어요. 인터넷 연결을 확인해 주세요. | Couldn't check the code. Check your internet connection. | コードを確認できませんでした。インターネット接続を確認してください。 |
| `join.haveCode` | 초대 코드가 있어요 | I have an invite code | 招待コードがあります |
| `join.createSpace` | 새 공간 만들기 | Create a new space | 新しいスペースを作る |

## S06 홈(메인 D-day)

| 키 | 한국어 | English | 日本語 |
|---|---|---|---|
| `main.appName` | 아룸 | Aroom | アルーム |
| `brand.tagline` | Our little world, together. | Our little world, together. | Our little world, together. |
| `main.invitePending.title` | 상대를 기다리고 있어요 | Waiting for your partner | パートナーを待っています |
| `main.invitePending.body` | 초대 코드는 {h}시간 뒤에 만료돼요. | The invite code expires in {h} hours. | 招待コードはあと{h}時間で期限切れになります。 |
| `main.invitePending.action` | 초대 코드 보기 | View invite code | 招待コードを見る |
| `main.chip.both` | {name}님과 함께해요 | With {name} | {name}さんと一緒 |
| `main.chip.waiting` | 상대 초대 전 | Partner not invited yet | パートナー未招待 |
| `main.openRoom` | 우리 방 열기 | Open our room | ふたりの部屋を開く |
| `main.editDate` | 함께한 날짜 고치기 | Change the date | 日付を変更 |
| `main.roomCard.title` | 우리 방 | Our room | ふたりの部屋 |
| `main.roomCard.day` | 지금 우리 방은 낮이에요 | It's daytime in your room | 今、部屋は昼です |
| `main.roomCard.night` | 지금 우리 방은 밤이에요 | It's nighttime in your room | 今、部屋は夜です |
| `main.noDate.title` | 함께한 날짜를 정해 주세요 | Set the date you got together | 一緒になった日を決めてください |
| `main.noDate.body` | 날짜를 정하면 며칠째인지 보여 드려요. | Once you set it, you'll see which day it is. | 日付を決めると、何日目か表示されます。 |
| `main.noDate.action` | 날짜 정하기 | Set the date | 日付を決める |
| `main.editSheet.title` | 함께한 날짜 고치기 | Change the date | 日付を変更 |
| `main.editSheet.body` | 날짜를 바꾸면 두 사람 화면의 일수가 모두 바뀌어요. | Changing the date updates the day count on both of your screens. | 日付を変更すると、ふたりの画面の日数がどちらも変わります。 |
| `main.editSheet.saved` | 날짜를 고쳤어요 | Date updated | 日付を変更しました |
| `main.loading` | 불러오는 중이에요 | Loading | 読み込み中です |
| `main.sync.title` | 동기화하지 못했어요 | Couldn't sync | 同期できませんでした |
| `main.sync.body` | 마지막으로 저장된 내용을 보여 드리고 있어요. | Showing what was saved last. | 最後に保存された内容を表示しています。 |
| `main.offline.title` | 인터넷에 연결되어 있지 않아요 | You're offline | インターネットに接続されていません |
| `main.offline.body` | 마지막으로 확인한 내용을 보여 드리고 있어요. 방 꾸미기는 연결된 뒤에 할 수 있어요. | Showing what was last loaded. You can decorate once you're back online. | 最後に確認した内容を表示しています。飾り付けは、接続が戻ってからできます。 |
| `main.lastSeen` | 마지막 확인 {time} | Last checked {time} | 最終確認 {time} |
| `main.lastSeen.sample` | 오후 9:12 | 9:12 PM | 21:12 |
| `main.mascot.alt` | 아루미 | Aroomi | アルーミ |

## S08 공유 프롬프트 세션

| 키 | 한국어 | English | 日本語 |
|---|---|---|---|
| `prompt.title` | 함께 꾸미기 | Decorate together | いっしょに飾る |
| `prompt.free` | 지금은 아무도 꾸미고 있지 않아요 | No one is decorating right now | 今は誰も飾っていません |
| `prompt.mine` | 내가 꾸미는 중 | You're decorating | あなたが飾っています |
| `prompt.partner` | {name}님이 꾸미는 중 | {name} is decorating | {name}さんが飾っています |
| `prompt.partner.typing` | {name}님이 쓰는 중… | {name} is typing… | {name}さんが入力中… |
| `prompt.partner.thinking` | 미리 보기를 만드는 중이에요 | Creating a preview | プレビューを作成中です |
| `prompt.start` | 내가 꾸밀게요 | I'll decorate | 私が飾る |
| `prompt.start.help` | 시작하면 이 방을 내가 맡아요. 상대는 대화와 미리 보기를 볼 수만 있어요. | Once you start, you're in charge of the room. Your partner can only watch the conversation and preview. | 始めると、あなたが部屋を担当します。パートナーは会話とプレビューを見るだけになります。 |
| `prompt.idleHint` | 3분 동안 아무것도 하지 않으면 자동으로 풀려요. | If nothing happens for 3 minutes, it's released automatically. | 3分間何もしないと、自動で解除されます。 |
| `prompt.placeholder` | 어떻게 꾸미고 싶나요? | How would you like to decorate? | どんな部屋にしたいですか？ |
| `prompt.input.partner` | {name}님이 꾸미는 중이라 지금은 쓸 수 없어요 | {name} is decorating, so you can't type right now | {name}さんが飾っているため、今は入力できません |
| `prompt.send` | 보내기 | Send | 送信 |
| `prompt.sending` | 만드는 중이에요 | Working on it | 作成中です |
| `prompt.left` | 오늘 {n}번 더 꾸밀 수 있어요 | {n} more tries today | 今日はあと{n}回試せます |
| `prompt.quota.title` | 오늘 꾸미기를 모두 썼어요 | You've used all of today's tries | 今日の回数を使い切りました |
| `prompt.quota.body` | 하루 3번까지 쓸 수 있어요. 만들어지지 못했거나 거절된 요청은 세지 않아요. 내일 다시 이어서 꾸밀 수 있고, 지금 방은 그대로예요. | You can decorate up to 3 times a day. Requests that fail or are declined don't count. Pick it up again tomorrow — the room stays as it is. | 1日3回まで使えます。作れなかったリクエストや断られたリクエストは数えません。明日また続けられます。今の部屋はそのままです。 |
| `prompt.consent.need` | 꾸미려면 두 사람 모두 해외 AI 처리에 동의해야 해요 | Both partners must agree to overseas AI processing before decorating | 飾るには、ふたりとも海外でのAI処理に同意する必要があります |
| `prompt.consent.action` | 안내 보기 | View details | 詳細を見る |
| `prompt.offline` | 인터넷에 연결되어야 꾸밀 수 있어요 | You need an internet connection to decorate | 飾るにはインターネット接続が必要です |
| `prompt.unsupported.title` | 이 요청은 만들 수 없어요 | I can't make that | このリクエストは作れません |
| `prompt.unsupported.body` | 방에는 라이선스가 확인된 소품과 짧은 문구만 둘 수 있어요. 소품을 옮기거나 문구를 바꾸는 식으로 다시 말해 보세요. | Rooms can only hold licensed items and short text. Try asking to move an item or change a phrase. | 部屋に置けるのは、ライセンス確認済みの小物と短い文言だけです。小物を動かす、文言を変えるなどの形でもう一度お願いしてください。 |
| `prompt.brand.refuse` | 특정 캐릭터나 브랜드는 방에 넣을 수 없어요. 비슷한 분위기의 소품으로 만들어 볼까요? | Specific characters and brands can't go in the room. Want me to make an item with a similar mood instead? | 特定のキャラクターやブランドは部屋に置けません。似た雰囲気の小物で作りましょうか？ |
| `prompt.brand.action` | 비슷한 소품으로 만들기 | Make a similar item | 似た小物で作る |
| `prompt.fail.title` | 미리 보기를 만들지 못했어요 | Couldn't create a preview | プレビューを作れませんでした |
| `prompt.fail.body` | 잠시 후 다시 시도해 주세요. 방은 바뀌지 않았어요. | Try again in a moment. The room hasn't changed. | しばらくしてからもう一度お試しください。部屋は変わっていません。 |
| `prompt.limit` | 한 방에는 소품 16개, 문구 3개까지 둘 수 있어요. 일부를 줄여서 다시 제안했어요. | A room holds up to 16 items and 3 pieces of text. I trimmed the suggestion to fit. | 部屋に置けるのは小物16個、文言3つまでです。収まるように減らして提案し直しました。 |
| `prompt.idle.me.title` | 꾸미기가 자동으로 풀렸어요 | Decorating was released automatically | 飾る権限が自動で解除されました |
| `prompt.idle.me.body` | 3분 동안 입력이 없었어요. 쓰던 글은 남아 있어요. | There was no input for 3 minutes. What you were typing is still here. | 3分間入力がありませんでした。入力中の文章は残っています。 |
| `prompt.idle.me.action` | 다시 꾸미기 | Decorate again | もう一度飾る |
| `prompt.expiring` | {s}초 뒤에 풀려요 | Releases in {s}s | あと{s}秒で解除されます |
| `prompt.expiring.action` | 계속하기 | Keep going | 続ける |
| `prompt.takeover.title` | {name}님이 자리를 비웠어요 | {name} seems to be away | {name}さんは席を外しているようです |
| `prompt.takeover.body` | 3분 넘게 활동이 없어서 이어받을 수 있어요. 지금까지의 대화와 미리 보기는 그대로 보여요. | There's been no activity for over 3 minutes, so you can take over. The conversation and preview so far stay visible. | 3分以上操作がないため、引き継げます。これまでの会話とプレビューはそのまま表示されます。 |
| `prompt.takeover.action` | 이어서 꾸미기 | Take over | 引き継ぐ |
| `prompt.takeover.lost` | {name}님이 먼저 이어받았어요 | {name} took over first | {name}さんが先に引き継ぎました |
| `prompt.msg.me` | 분위기를 조금 포근하게 바꿔 줘. 쿠션이랑 조명을 놓고 싶어. | Make it a bit cozier. I'd like a cushion and a lamp. | もう少し温かい雰囲気にして。クッションとランプを置きたい。 |
| `prompt.msg.partner` | 별도 하나만 더 달아 줘. | Add one more star too. | 星ももうひとつ付けて。 |
| `prompt.msg.result` | 쿠션 1개, 조명 1개를 놓았어요. 미리 보기를 확인해 주세요. | I added 1 cushion and 1 lamp. Take a look at the preview. | クッションを1個、ランプを1個置きました。プレビューを確認してください。 |
| `prompt.msg.status.preview` | 미리 보기를 만들었어요 | Preview created | プレビューを作成しました |
| `prompt.msg.status.applied` | {name}님이 적용했어요 | {name} applied it | {name}さんが反映しました |
| `prompt.msg.status.cancelled` | {name}님이 취소했어요. 방은 그대로예요. | {name} canceled it. The room stays the same. | {name}さんがキャンセルしました。部屋はそのままです。 |
| `prompt.msg.status.released` | 꾸미기가 풀렸어요 | Decorating was released | 飾る権限が解除されました |
| `prompt.msg.time` | 오후 9:14 | 9:14 PM | 21:14 |
| `prompt.history.empty` | 아직 대화가 없어요. 원하는 분위기를 적어 보세요. | No conversation yet. Describe the mood you want. | まだ会話がありません。好きな雰囲気を書いてみてください。 |
| `prompt.kbd` | 키보드 영역 | Keyboard area | キーボード領域 |

## S09 미리 보기·적용

| 키 | 한국어 | English | 日本語 |
|---|---|---|---|
| `preview.badge` | 미리 보기 · 아직 적용되지 않았어요 | Preview · not applied yet | プレビュー · まだ反映されていません |
| `preview.shared` | 두 사람 모두에게 보이지만 방은 바뀌지 않았어요. | You both can see it, but the room hasn't changed. | ふたりに表示されていますが、部屋はまだ変わっていません。 |
| `preview.view.current` | 현재 방 | Current | 今の部屋 |
| `preview.view.candidate` | 미리 보기 | Preview | プレビュー |
| `preview.apply` | 적용하기 | Apply | 反映する |
| `preview.applying` | 적용하는 중이에요 | Applying | 反映しています |
| `preview.cancel` | 취소 | Cancel | キャンセル |
| `preview.cancel.toast` | 취소했어요. 우리 방은 그대로예요. | Canceled. Your room stays the same. | キャンセルしました。部屋はそのままです。 |
| `preview.applyHint` | 적용하면 두 사람의 방이 바뀌고, 적용한 뒤에는 되돌릴 수 없어요. | Applying changes the room for both of you, and it can't be undone once applied. | 反映するとふたりの部屋が変わり、反映した後は元に戻せません。 |
| `preview.undo` | 이전 미리 보기로 되돌리기 | Go back to the previous preview | 前のプレビューに戻す |
| `preview.confirm.title` | 적용할까요? | Apply it? | 反映しますか？ |
| `preview.confirm.body` | 두 사람의 방이 바뀌어요. 적용한 뒤에는 되돌릴 수 없어요. 적용하기 전에 미리 보기를 한 번 더 확인해 주세요. | Your shared room will change for both of you. It can't be undone once applied, so take one more look at the preview first. | ふたりの部屋が変わります。反映した後は元に戻せません。反映する前に、もう一度プレビューを確認してください。 |
| `preview.partner.wait` | {name}님이 적용할지 정하고 있어요 | {name} is deciding whether to apply it | {name}さんが反映するか決めています |
| `preview.partner.readonly` | 지금은 보기만 할 수 있어요 | You can only watch for now | 今は見ることだけできます |
| `preview.applied.title` | 적용했어요 | Applied | 反映しました |
| `preview.applied.body` | 적용한 변경은 되돌릴 수 없어요. 상대 화면에는 동기화되면 바로 바뀌어요. | Applied changes can't be undone. Your partner's screen updates as soon as it syncs. | 反映した変更は元に戻せません。パートナーの画面は、同期され次第すぐに変わります。 |
| `preview.warn.limit` | 소품이 많아서 일부는 빼고 보여 드려요. | There are too many items, so a few are left out. | 小物が多いため、一部を除いて表示しています。 |
| `preview.warn.protected` | 버튼이나 날짜 위젯을 가리는 소품은 위치를 자동으로 옮겼어요. | Items that covered the buttons or the day counter were moved automatically. | ボタンや日数ウィジェットを隠す小物は、自動で位置を動かしました。 |
| `preview.suggest` | 이렇게 줄여서 만들어 봤어요 | Here's a trimmed version | こう減らして作ってみました |
| `preview.expiring` | {s}초 뒤에 세션이 끝나요. 적용하지 않으면 미리 보기만 남아요. | The session ends in {s}s. If you don't apply, only the preview remains. | あと{s}秒でセッションが終わります。反映しない場合はプレビューだけが残ります。 |
| `preview.apply.err.title` | 적용하지 못했어요 | Couldn't apply it | 反映できませんでした |
| `preview.apply.err.body` | 방은 바뀌지 않았어요. 다시 시도해 주세요. | The room hasn't changed. Please try again. | 部屋は変わっていません。もう一度お試しください。 |
| `preview.model.err` | 미리 보기를 만드는 중에 문제가 생겼어요. 방은 바뀌지 않았어요. | Something went wrong while creating the preview. The room hasn't changed. | プレビューの作成中に問題が起きました。部屋は変わっていません。 |
| `preview.conflict.title` | 방이 방금 바뀌었어요 | The room just changed | 部屋がたった今変更されました |
| `preview.conflict.body` | 최신 방을 불러왔어요. 미리 보기를 다시 만들어 주세요. | We loaded the latest room. Please create the preview again. | 最新の部屋を読み込みました。プレビューをもう一度作ってください。 |
| `preview.changes` | 변경 내용 | Changes | 変更内容 |
| `preview.changes.list` | 쿠션 · 조명 · 별 추가 | Added a cushion, a lamp and a star | クッション・ランプ・星を追加 |

## S10 되돌리기

| 키 | 한국어 | English | 日本語 |
|---|---|---|---|
| `undo.title` | 이전 미리 보기로 되돌릴까요? | Go back to the previous preview? | 前のプレビューに戻しますか？ |
| `undo.body` | 이 대화에서 방금 만든 변경을 취소하고 바로 앞 미리 보기로 돌아가요. 방은 아직 바뀌지 않았어요. 적용한 방은 되돌릴 수 없어요. | This drops the change you just made in this conversation and goes back to the preview before it. The room hasn't changed. A room you already applied can't be undone. | この会話で作ったばかりの変更を取り消し、ひとつ前のプレビューに戻ります。部屋はまだ変わっていません。反映した部屋は元に戻せません。 |
| `undo.confirm` | 되돌리기 | Undo | 元に戻す |
| `undo.progress` | 되돌리는 중이에요 | Undoing | 元に戻しています |
| `undo.done.title` | 되돌렸어요 | Undone | 元に戻しました |
| `undo.done.body` | 바로 앞 미리 보기예요. | This is the preview before it. | ひとつ前のプレビューです。 |
| `undo.none.title` | 되돌릴 변경이 없어요 | Nothing to undo | 元に戻せる変更がありません |
| `undo.none.body` | 이 대화에서 만든 변경이 아직 없어요. 이미 적용한 방은 되돌릴 수 없어요. | There are no changes from this conversation yet. A room you already applied can't be undone. | この会話で作った変更はまだありません。すでに反映した部屋は元に戻せません。 |
| `undo.busy.title` | {name}님이 꾸미는 중이에요 | {name} is decorating | {name}さんが飾っています |
| `undo.busy.body` | {name}님만 이 미리 보기를 되돌릴 수 있어요. | Only {name} can undo this preview. | このプレビューを元に戻せるのは{name}さんだけです。 |
| `undo.conflict.title` | 이미 되돌려졌거나 미리 보기가 바뀌었어요 | It was already undone, or the preview changed | すでに元に戻されたか、プレビューが変更されました |
| `undo.conflict.body` | 최신 미리 보기를 불러왔어요. 필요하면 다시 되돌려 주세요. | We loaded the latest preview. Undo again if you still need to. | 最新のプレビューを読み込みました。必要であればもう一度元に戻してください。 |
| `undo.err.title` | 되돌리지 못했어요 | Couldn't undo | 元に戻せませんでした |
| `undo.err.body` | 미리 보기는 그대로예요. 다시 시도해 주세요. | The preview is unchanged. Please try again. | プレビューはそのままです。もう一度お試しください。 |

## S12 해외 AI 처리 동의

| 키 | 한국어 | English | 日本語 |
|---|---|---|---|
| `consent.title` | 해외 AI로 방 꾸미기를 처리해요 | Room decorating is processed by AI overseas | 部屋の飾り付けは海外のAIで処理されます |
| `consent.lead` | 꾸미기를 요청하면 아래 정보가 해외 AI 사업자의 서버로 전송돼요. 동의하지 않아도 D-day와 방 보기는 그대로 쓸 수 있어요. | When you ask to decorate, the information below is sent to an AI provider's servers overseas. Without consent, the day count and viewing the room still work. | 飾り付けをリクエストすると、以下の情報が海外のAI事業者のサーバーに送信されます。同意しなくても、日数表示や部屋の閲覧は使えます。 |
| `consent.sent.label` | 보내는 정보 | What's sent | 送信する情報 |
| `consent.sent.body` | 내가 쓴 요청 글과, 요청을 만드는 데 필요한 방 배치(소품 종류·위치·문구). 함께한 날짜, 이름, 이메일은 보내지 않아요. | The request you typed, and the room layout needed to build it (item types, positions, text). Your together-date, names and email are not sent. | 入力したリクエスト文と、作成に必要な部屋の配置（小物の種類・位置・文言）。一緒になった日、名前、メールアドレスは送信しません。 |
| `consent.purpose.label` | 사용 목적 | Purpose | 利用目的 |
| `consent.purpose.body` | 요청에 맞는 방 꾸미기 미리 보기를 만드는 것 | To create a room preview that matches your request | リクエストに合った部屋のプレビューを作ること |
| `consent.processor.label` | 처리하는 곳 | Processed by | 処理する事業者 |
| `consent.processor.body` | Anthropic PBC(미국). 아룸 서버를 거쳐 전송돼요. | Anthropic PBC (United States). Sent through Aroom's servers. | Anthropic PBC（米国）。アルームのサーバーを経由して送信されます。 |
| `consent.keep.label` | 보관과 철회 | Retention and withdrawal | 保管と撤回 |
| `consent.keep.body` | 적용한 요청 글은 30일, 적용하지 않은 미리 보기는 24시간 뒤 아룸 서버에서 삭제돼요. 설정의 'AI 처리 동의'에서 언제든 철회할 수 있어요. | Applied requests are deleted from Aroom's servers after 30 days, and unapplied previews after 24 hours. You can withdraw any time in Settings under "AI processing consent". | 反映したリクエスト文は30日後、反映しなかったプレビューは24時間後に、アルームのサーバーから削除されます。設定の「AI処理への同意」からいつでも撤回できます。 |
| `consent.provider.keep` | 해외 사업자의 보관 기간: [법무 확인 후 입력] | Provider retention period: [fill in after legal review] | 海外事業者の保管期間：[法務確認後に記入] |
| `consent.couple.label` | 두 사람이 함께 쓰는 방이에요 | This room is shared by two | ふたりで使う部屋です |
| `consent.couple.body` | 동의는 사람마다 따로 해요. 내 동의는 내가 보내는 요청에만 적용돼요. 요청에는 두 사람이 함께 꾸민 방 배치가 들어가요. | Consent is given per person. Yours applies only to requests you send. Requests include the room layout you two decorated together. | 同意は一人ひとり別々です。あなたの同意は、あなたが送るリクエストにのみ適用されます。リクエストには、ふたりで飾った部屋の配置が含まれます。 |
| `consent.agree` | 동의하고 계속 | Agree and continue | 同意して続ける |
| `consent.later` | 나중에 | Not now | あとで |
| `consent.status.on` | 동의함 · {date} | Agreed · {date} | 同意済み · {date} |
| `consent.status.off` | 동의하지 않음 | Not agreed | 未同意 |
| `consent.status.date` | 2026년 10월 24일 | Oct 24, 2026 | 2026年10月24日 |
| `consent.withdraw` | 동의 철회 | Withdraw consent | 同意を撤回 |
| `consent.withdraw.title` | 동의를 철회할까요? | Withdraw your consent? | 同意を撤回しますか？ |
| `consent.withdraw.body` | 철회하면 요청이 더 이상 해외로 전송되지 않아요. 지금 방은 그대로 남고, 다시 꾸미려면 다시 동의해야 해요. | After you withdraw, requests are no longer sent overseas. The room stays as it is, and you'll need to agree again to decorate. | 撤回すると、リクエストは海外に送信されなくなります。今の部屋はそのまま残り、また飾るには再度の同意が必要です。 |
| `consent.withdraw.done` | 동의를 철회했어요 | Consent withdrawn | 同意を撤回しました |
| `consent.later.note` | 동의하기 전까지는 꾸미기를 쓸 수 없어요. 방 보기와 D-day는 그대로예요. | You can't decorate until you agree. Viewing the room and the day count are unaffected. | 同意するまで飾り付けは使えません。部屋の閲覧と日数表示はそのまま使えます。 |

## S13 설정

| 키 | 한국어 | English | 日本語 |
|---|---|---|---|
| `set.title` | 설정 | Settings | 設定 |
| `set.sec.account` | 계정 | Account | アカウント |
| `set.sec.couple` | 우리 공간 | Our space | ふたりのスペース |
| `set.sec.room` | 방 · 두 사람에게 적용돼요 | Room · applies to both of you | 部屋 · ふたりに適用されます |
| `set.sec.app` | 이 기기의 화면 · 이 기기에만 적용돼요 | This device's display · applies to this device only | この端末の表示 · この端末のみに適用されます |
| `set.sec.ai` | AI 처리 | AI processing | AI処理 |
| `set.sec.info` | 앱 정보 | About | アプリ情報 |
| `set.sec.danger` | 공간 | Space | スペース |
| `set.login.kakao` | 카카오 로그인 | Signed in with Kakao | Kakaoでログイン中 |
| `set.logout` | 로그아웃 | Sign out | ログアウト |
| `set.logout.title` | 로그아웃할까요? | Sign out? | ログアウトしますか？ |
| `set.logout.body` | 로그아웃해도 공간과 방은 그대로예요. | Signing out doesn't change your space or room. | ログアウトしても、スペースと部屋はそのままです。 |
| `set.together` | 함께한 날짜 | Together since | 一緒になった日 |
| `set.together.value` | 2025년 6월 29일 | June 29, 2025 | 2025年6月29日 |
| `set.room.mode` | 방의 낮·밤 | Room day / night | 部屋の昼と夜 |
| `set.room.mode.auto` | 시간대 따라 | By time zone | 時間帯に合わせる |
| `set.room.mode.day` | 낮 | Day | 昼 |
| `set.room.mode.night` | 밤 | Night | 夜 |
| `set.room.mode.help` | '시간대 따라'는 두 사람의 공간 시간대에 맞춰 오전 6시부터 오후 6시까지 낮으로 보여 줘요. | "By time zone" follows your shared space time zone. Day runs from 6 AM to 6 PM. | 「時間帯に合わせる」は、二人のスペースのタイムゾーンに従います。午前6時から午後6時までは昼として表示します。 |
| `set.room.tz` | 시간대 | Time zone | タイムゾーン |
| `set.room.tz.value` | 서울 (UTC+9) | Seoul (UTC+9) | ソウル（UTC+9） |
| `set.room.tz.pick` | 시간대 고르기 | Choose a time zone | タイムゾーンを選ぶ |
| `set.room.tz.search` | 도시 검색 | Search cities | 都市を検索 |
| `set.room.tz.tokyo` | 도쿄 (UTC+9) | Tokyo (UTC+9) | 東京（UTC+9） |
| `set.room.tz.la` | 로스앤젤레스 (UTC-8) | Los Angeles (UTC-8) | ロサンゼルス（UTC-8） |
| `set.room.tz.ny` | 뉴욕 (UTC-5) | New York (UTC-5) | ニューヨーク（UTC-5） |
| `set.room.tz.london` | 런던 (UTC+0) | London (UTC+0) | ロンドン（UTC+0） |
| `set.room.now` | 지금 방은 {mode}이에요 | The room is showing {mode} now | 今、部屋は{mode}です |
| `set.lang` | 언어 | Language | 言語 |
| `set.lang.system` | 기기 설정 따르기 | Follow device | 端末の設定に従う |
| `set.lang.sheet` | 앱 언어 | App language | アプリの言語 |
| `set.lang.note` | 방에 쓴 문구와 프롬프트는 번역되지 않고 쓴 그대로 보여요. | Text you write in the room and prompts are not translated; they appear as written. | 部屋に書いた文言とプロンプトは翻訳されず、書いたとおりに表示されます。 |
| `set.theme` | 화면 모드 | Appearance | 外観 |
| `set.theme.system` | 기기 설정 | Device | 端末設定 |
| `set.theme.light` | 밝게 | Light | ライト |
| `set.theme.dark` | 어둡게 | Dark | ダーク |
| `set.hc` | 고대비 | High contrast | ハイコントラスト |
| `set.hc.help` | 글자와 버튼을 더 또렷하게 보여 줘요. 방 소품 그림은 그대로예요. | Makes text and controls stronger. Room item artwork stays the same. | 文字とボタンをよりはっきり表示します。部屋の小物の絵は変わりません。 |
| `set.ai.consent` | AI 처리 동의 | AI processing consent | AI処理への同意 |
| `set.about.version` | 버전 {v} | Version {v} | バージョン{v} |
| `set.about.licenses` | 글꼴·오픈소스 라이선스 | Font and open-source licenses | フォント・オープンソースのライセンス |
| `set.terms` | 이용약관 | Terms of Use | 利用規約 |
| `set.privacy` | 개인정보 처리방침 | Privacy Policy | プライバシーポリシー |
| `set.support` | 문의 · 신고 | Contact and reports | お問い合わせ・通報 |
| `set.end` | 공간 종료 | End space | スペースを終了 |
| `set.end.help` | 종료하면 함께 쓰던 데이터가 삭제돼요. 되돌릴 수 없어요. | Ending deletes the data you shared. This can't be undone. | 終了すると、いっしょに使っていたデータが削除されます。元に戻せません。 |
| `set.account.delete` | 계정 삭제 | Delete account | アカウントを削除 |
| `set.account.delete.sub` | 되돌릴 수 없어요 | This can't be undone | 元に戻せません |
| `set.loading` | 설정을 불러오는 중이에요 | Loading settings | 設定を読み込んでいます |
| `set.err.title` | 설정을 불러오지 못했어요 | Couldn't load settings | 設定を読み込めませんでした |
| `set.err.body` | 인터넷 연결을 확인하고 다시 시도해 주세요. | Check your internet connection and try again. | インターネット接続を確認して、もう一度お試しください。 |
| `set.name` | 별명 | Nickname | ニックネーム |
| `set.name.value` | 지우 | Jiu | ジウ |
| `set.offline.title` | 오프라인이에요 | You're offline | オフラインです |
| `set.offline.body` | 방 낮·밤과 시간대는 연결된 뒤에 바꿀 수 있어요. 이 기기의 화면 설정은 지금도 바꿀 수 있어요. | Room day/night and time zone can be changed once you're back online. This device's display settings still work. | 部屋の昼夜とタイムゾーンは、接続が戻ってから変更できます。この端末の表示設定は今でも変更できます。 |
| `set.cover` | 홈 배경 사진 | Home background photo | ホームの背景写真 |
| `set.cover.on` | 설정됨 | Set | 設定済み |
| `set.cover.off` | 없음 | None | なし |

## S14 공간 종료

| 키 | 한국어 | English | 日本語 |
|---|---|---|---|
| `end.title` | 공간을 종료할까요? | End this space? | スペースを終了しますか？ |
| `end.body` | 종료하면 두 사람 모두 D-day와 방에 들어갈 수 없어요. 함께 쓰던 방·사진·장식은 삭제되고 되돌릴 수 없어요. | Once ended, neither of you can open the day count or the room. The room, photos and decorations you shared will be deleted and can't be brought back. | 終了すると、ふたりとも日数表示と部屋に入れなくなります。いっしょに使っていた部屋・写真・飾りは削除され、元に戻せません。 |
| `end.b1` | 두 사람 모두 접근이 중단돼요 | Both of you lose access | ふたりともアクセスできなくなります |
| `end.b2` | 방·사진·장식이 삭제돼요 | The room, photos and decorations are deleted | 部屋・写真・飾りが削除されます |
| `end.b3` | 삭제된 내용은 되돌릴 수 없어요 | Deleted content can't be brought back | 削除された内容は元に戻せません |
| `end.check` | 내용을 확인했어요 | I understand | 内容を確認しました |
| `end.confirm` | 공간 종료하기 | End space | スペースを終了する |
| `end.cancel` | 취소 | Cancel | キャンセル |
| `end.progress` | 종료하는 중이에요 | Ending your space | 終了しています |
| `end.done.title` | 공간을 종료했어요 | Space ended | スペースを終了しました |
| `end.done.body` | 함께 쓰던 데이터는 삭제돼요. 새 공간을 시작할 수 있어요. | The data you shared will be deleted. You can start a new space. | いっしょに使っていたデータは削除されます。新しいスペースを始められます。 |
| `end.byPartner` | {name}님이 공간을 종료했어요 | {name} ended the space | {name}さんがスペースを終了しました |
| `end.byPartnerDisconnect` | {name}님이 연결을 끊었어요 | {name} disconnected | {name}さんがつながりを終了しました |
| `end.byPartnerDeleted` | 상대가 계정을 삭제했어요 | Your partner deleted their account | 相手がアカウントを削除しました |
| `end.newSpace` | 새 공간 시작하기 | Start a new space | 新しいスペースを始める |
| `end.err.title` | 종료하지 못했어요 | Couldn't end the space | 終了できませんでした |
| `end.err.body` | 공간은 그대로예요. 다시 시도해 주세요. | The space is unchanged. Please try again. | スペースはそのままです。もう一度お試しください。 |

## 계정 삭제 (US10 · P1, 2026-10-27 가정)

영어·일본어는 원어민 검수 전 초안이에요. 확인 체크 문구는 `end.check`를 같이 써요. 재로그인 화면은 `login.*`를 그대로 써요.

| 키 | 한국어 | English | 日本語 |
|---|---|---|---|
| `acct.delete.title` | 계정을 삭제할까요? | Delete your account? | アカウントを削除しますか？ |
| `acct.delete.lead` | 삭제하면 바로 로그아웃되고, 되돌릴 수 없어요. | You'll be signed out right away, and this can't be undone. | すぐにログアウトされ、元に戻せません。 |
| `acct.delete.b1` | 내 계정과 프로필 정보가 삭제돼요 | Your account and profile information are deleted | アカウントとプロフィール情報が削除されます |
| `acct.delete.b2` | 함께 쓰는 공간이 있다면 종료돼요. 두 사람 모두 들어갈 수 없고 방·사진·장식이 삭제돼요 | If you share a space, it ends. Neither of you can open it, and the room, photos and decorations are deleted | 共有中のスペースがある場合は終了します。ふたりとも入れなくなり、部屋・写真・飾りが削除されます |
| `acct.delete.b3` | 같은 계정으로 다시 가입해도 이전 내용은 돌아오지 않아요 | Signing up again with the same login won't bring anything back | 同じアカウントで登録し直しても、以前の内容は戻りません |
| `acct.delete.confirm` | 계정 삭제하기 | Delete account | アカウントを削除する |
| `acct.delete.reauth.title` | 본인 확인이 필요해요 | Please confirm it's you | 本人確認が必要です |
| `acct.delete.reauth.body` | 계정을 지키기 위해 한 번 더 로그인해 주세요. | For your safety, please sign in once more. | 安全のため、もう一度ログインしてください。 |
| `acct.delete.reauth.fail` | 본인 확인에 실패했어요. 다시 시도해 주세요. | We couldn't confirm it's you. Please try again. | 本人確認に失敗しました。もう一度お試しください。 |
| `acct.delete.progress` | 계정을 삭제하는 중이에요 | Deleting your account | アカウントを削除しています |
| `acct.delete.done` | 계정을 삭제했어요 | Your account was deleted | アカウントを削除しました |
| `acct.delete.offline` | 인터넷에 연결되어야 계정을 삭제할 수 있어요 | You need an internet connection to delete your account | アカウントの削除にはインターネット接続が必要です |
| `acct.delete.fail.title` | 삭제하지 못했어요 | Couldn't delete it | 削除できませんでした |
| `acct.delete.fail.body` | 아직 아무것도 지워지지 않았어요. 잠시 뒤 다시 시도해 주세요. | Nothing was deleted yet. Please try again in a moment. | まだ何も削除されていません。しばらくしてからもう一度お試しください。 |

## S15 신고·연결 끊기

| 키 | 한국어 | English | 日本語 |
|---|---|---|---|
| `report.title` | 신고 · 연결 끊기 | Report or disconnect | 通報・つながりを終了 |
| `report.what` | 무엇을 신고할까요? | What do you want to report? | 何を通報しますか？ |
| `report.target.partner` | 상대 | My partner | パートナー |
| `report.target.text` | 공유된 문구 | Shared text | 共有された文言 |
| `report.target.scene` | 방 장면 | Room scene | 部屋のシーン |
| `report.why` | 이유를 골라 주세요 | Choose a reason | 理由を選んでください |
| `report.reason.harass` | 괴롭히거나 불쾌한 내용 | Harassing or upsetting content | 嫌がらせや不快な内容 |
| `report.reason.inappropriate` | 부적절한 문구나 장면 | Inappropriate text or scene | 不適切な文言やシーン |
| `report.reason.privacy` | 개인정보가 들어 있어요 | It contains personal information | 個人情報が含まれています |
| `report.reason.other` | 기타 | Something else | その他 |
| `report.detail` | 자세한 내용 (선택) | Details (optional) | 詳細（任意） |
| `report.detail.placeholder` | 어떤 일이 있었는지 적어 주세요 | Tell us what happened | 何があったか書いてください |
| `report.submit` | 신고 보내기 | Send report | 通報を送信 |
| `report.sending` | 보내는 중이에요 | Sending | 送信しています |
| `report.done.title` | 신고를 보냈어요 | Report sent | 通報を送信しました |
| `report.done.body` | 내용을 확인할 거예요. 처리 결과를 앱에서 따로 알려 드리지는 않아요. | We'll review it. We won't send you a separate result in the app. | 内容を確認します。処理結果をアプリで別途お知らせすることはありません。 |
| `report.fail.title` | 신고를 보내지 못했어요 | Couldn't send the report | 通報を送信できませんでした |
| `report.fail.body` | 쓴 내용은 그대로 남아 있어요. 다시 시도해 주세요. | What you wrote is still here. Please try again. | 入力した内容は残っています。もう一度お試しください。 |
| `report.contact` | 문의: [지원 이메일] | Contact: [support email] | お問い合わせ：[サポートメール] |
| `report.block` | {name}님과 연결 끊기 | Disconnect from {name} | {name}さんとのつながりを終了 |
| `report.block.title` | {name}님과 연결을 끊을까요? | Disconnect from {name}? | {name}さんとのつながりを終了しますか？ |
| `report.block.body` | 연결을 끊으면 {name}님은 이 공간의 방과 대화를 볼 수 없고, 이 공간이 종료돼요. 함께 쓰던 데이터는 삭제돼요. | If you disconnect, {name} can no longer see this space's room or conversation, and the space ends. The data you shared will be deleted. | つながりを終了すると、{name}さんはこのスペースの部屋や会話を見られなくなり、スペースが終了します。いっしょに使っていたデータは削除されます。 |
| `report.block.confirm` | 연결 끊기 | Disconnect | つながりを終了する |
| `report.block.done` | 연결을 끊었어요 | Disconnected | つながりを終了しました |
| `report.msg.menu` | 이 메시지 신고 | Report this message | このメッセージを通報 |
| `report.msg.menu.cancel` | 닫기 | Close | 閉じる |

## 생성 장식(US8 · P2, 2026-10-27 가정)

영어·일본어는 원어민 검수 전 초안이에요. 거절 문구는 무엇이 안 되는지와 이유를 짧게 말하고 허용되는 대안을 권해요(`ai-guardrails.md` 2.3).

| 키 | 한국어 | English | 日本語 |
|---|---|---|---|
| `gen.refuse.title` | 이 장식은 만들 수 없어요 | We can't make that decoration | その飾りは作れません |
| `gen.refuse.ip` | 이미 있는 캐릭터·브랜드·로고나 다른 사람의 작품을 닮은 그림은 만들 수 없어요. 저작권 문제가 생길 수 있어서예요. 대신 '연한 노란 별 무늬 벽 장식'처럼 모양과 색으로 말해 주세요. | We can't make art that copies existing characters, brands, logos or someone else's work, because it could cause copyright problems. Try describing shapes and colors instead, like "a wall piece with soft yellow stars." | 既存のキャラクター・ブランド・ロゴ、他の人の作品に似た絵は作れません。著作権の問題になるおそれがあるためです。「やわらかな黄色い星柄の壁飾り」のように、形と色で伝えてみてください。 |
| `gen.refuse.people` | 실제 사람이나 유명인이 나오는 그림은 만들 수 없어요. 대신 '구름 사이로 달이 보이는 창밖 풍경'처럼 풍경이나 무늬로 말해 주세요. | We can't make pictures of real people or celebrities. Try a scene or pattern instead, like "a window view with the moon between clouds." | 実在の人物や有名人の絵は作れません。「雲の間に月が見える窓の外の景色」のように、風景や模様で伝えてみてください。 |
| `gen.refuse.unsafe` | 성적이거나 폭력적이거나 누군가를 해치거나 차별하는 내용은 만들 수 없어요. 포근한 분위기의 장식으로 다시 말해 주세요. | We can't make anything sexual, violent, hateful or harmful. Try describing something cozy instead. | 性的・暴力的・差別的な内容や、誰かを傷つける内容は作れません。ほっとするような飾りで言い直してみてください。 |
| `gen.refuse.personal` | 전화번호, 주소, 링크, QR 코드나 글자가 많은 그림은 만들 수 없어요. 글자는 방의 짧은 문구로 따로 넣을 수 있어요. | We can't make pictures with phone numbers, addresses, links, QR codes or lots of text. You can add short text to the room separately. | 電話番号・住所・リンク・QRコード・文字の多い絵は作れません。文字は部屋の短い文として別に入れられます。 |
| `gen.refuse.photo` | 사진처럼 실제 같은 이미지는 만들 수 없어요. 아루미의 세계처럼 부드러운 손그림 느낌으로 말해 주세요. | We can't make realistic, photo-like images. Describe something soft and hand-drawn, like Aroomi's world. | 写真のようにリアルな画像は作れません。アルーミの世界のような、やわらかな手描き風で伝えてみてください。 |
| `gen.refuse.purpose` | 배경, 말풍선, 작은 방 소품 장식만 만들 수 있어요. 캐릭터는 만들 수 없고, 아루미는 바꿀 수 없어요. '벽 아래 물결 띠'나 '동그란 쿠션'처럼 말해 주세요. | We can only make backgrounds, speech-bubble frames and small room props. We can't make characters, and Aroomi can't be changed. Try something like "a wavy band along the wall" or "a round cushion." | 作れるのは背景、吹き出しの飾り、小さな部屋の小物だけです。キャラクターは作れず、アルーミも変えられません。「壁の下の波模様の帯」や「丸いクッション」のように伝えてみてください。 |
| `gen.refuse.note` | 이번 요청은 오늘 횟수에 들어가지 않았어요. | This request didn't count toward today's limit. | このリクエストは今日の回数に含まれていません。 |
| `gen.refuse.action` | 다시 말해 보기 | Try again | 言い直す |
| `gen.fail.title` | 이번에는 만들지 못했어요 | We couldn't make it this time | 今回は作れませんでした |
| `gen.fail.body` | 잠시 뒤 다시 말해 주세요. 방은 그대로예요. 오늘 횟수는 쓰지 않았어요. | Please try again in a moment. The room is unchanged, and this didn't use up today's limit. | しばらくしてからもう一度お試しください。部屋はそのままで、今日の回数も使っていません。 |
| `gen.disabled.title` | 새 장식 만들기를 잠시 쉬어요 | New decorations are taking a break | 新しい飾り作りはお休み中です |
| `gen.disabled.body` | 이미 만든 장식과 다른 꾸미기는 그대로 쓸 수 있어요. 나중에 다시 와 주세요. | You can still use the decorations you made and the other ways to decorate. Please check back later. | すでに作った飾りやほかの飾り付けはそのまま使えます。またあとで来てください。 |
| `gen.badge` | 새로 만든 장식 | New decoration | 新しい飾り |
| `gen.preview.count` | 새로 만든 장식 {n}개 | {n} new decorations | 新しい飾り{n}個 |
| `gen.lib.title` | 우리 장식 | Our decorations | ふたりの飾り |
| `gen.lib.count` | {n}/{max} | {n}/{max} | {n}/{max} |
| `gen.lib.empty` | 아직 만든 장식이 없어요. 꾸미기에서 '벽 장식을 만들어 줘'처럼 말해 보세요. | No decorations yet. Try asking, like "make me a wall decoration." | まだ飾りがありません。「壁の飾りを作って」のように話しかけてみてください。 |
| `gen.lib.by` | {name}님이 만들었어요 | Made by {name} | {name}さんが作りました |
| `gen.lib.byMe` | 내가 만들었어요 | Made by you | あなたが作りました |
| `gen.lib.use` | 다시 쓰기 | Use again | もう一度使う |
| `gen.lib.chip` | ‘{label}’ 놓기 | Place "{label}" | 「{label}」を置く |
| `gen.lib.delete` | 지우기 | Delete | 削除 |
| `gen.lib.delete.title` | 이 장식을 지울까요? | Delete this decoration? | この飾りを削除しますか？ |
| `gen.lib.delete.body` | 보관함에서 지우면 다시 찾을 수 없어요. | It will be gone from your collection and can't be brought back. | コレクションから消えて、元に戻せません。 |
| `gen.lib.delete.confirm` | 지우기 | Delete | 削除する |
| `gen.lib.delete.inuse` | 지금 방에 놓여 있어요. 지우면 방에서도 사라져요. | It's in the room right now. Deleting it removes it from the room too. | いま部屋に置かれています。削除すると部屋からも消えます。 |
| `gen.lib.full` | 보관함이 가득 찼어요. 쓰지 않는 장식을 지워 주세요. | Your collection is full. Please delete decorations you don't use. | コレクションがいっぱいです。使っていない飾りを削除してください。 |

## 장식 상세 · 신고 상태(US9 · P2)

| 키 | 한국어 | English | 日本語 |
|---|---|---|---|
| `obj.detail.kind.bg` | 배경 장식 | Background decoration | 背景の飾り |
| `obj.detail.kind.bubble` | 말풍선 틀 | Speech-bubble frame | 吹き出しの枠 |
| `obj.detail.kind.prop` | 방 소품 | Room prop | 部屋の小物 |
| `obj.report` | 신고하기 | Report | 報告する |
| `obj.report.scene` | 방 전체 신고 | Report the whole room | 部屋全体を報告 |
| `obj.reported` | 신고했어요 · 접수됨 | Reported · received | 報告しました・受付済み |
| `obj.reviewed` | 검토를 마쳤어요 | Review finished | 確認が完了しました |
| `obj.hidden.note` | 내 화면에서만 숨겼어요. | Hidden on your screen only. | あなたの画面でだけ非表示にしました。 |
| `obj.removed.notice` | 검토 결과 이 장식은 방에서 빠졌어요. | After review, this decoration was removed from the room. | 確認の結果、この飾りは部屋から外されました。 |

## 장식 신고(US9 · P2)

| 키 | 한국어 | English | 日本語 |
|---|---|---|---|
| `report.obj.title` | 장식 신고 | Report a decoration | 飾りの報告 |
| `report.obj.lead` | 어떤 점이 문제인가요? | What's wrong with it? | どんな点が問題ですか？ |
| `report.obj.reason.copyright` | 다른 사람의 그림·캐릭터·브랜드를 닮았어요 | It looks like someone else's art, a character or a brand | 他の人の絵・キャラクター・ブランドに似ています |
| `report.obj.reason.offensive` | 불쾌하거나 성적·폭력적이에요 | It's offensive, sexual or violent | 不快、または性的・暴力的です |
| `report.obj.reason.personal` | 개인정보가 들어 있어요 | It contains personal information | 個人情報が含まれています |
| `report.obj.reason.other` | 기타 | Something else | その他 |
| `report.obj.note` | 자세한 내용(선택) | Details (optional) | 詳しい内容（任意） |
| `report.obj.note.hint` | 상대에게는 보이지 않아요. | Your partner won't see this. | 相手には表示されません。 |
| `report.obj.send` | 신고 보내기 | Send report | 報告を送る |
| `report.obj.done.title` | 신고를 접수했어요 | Report received | 報告を受け付けました |
| `report.obj.done.body` | 이 장식은 내 화면에서 숨겼어요. 검토 뒤에 방에서 빼기로 하면 두 사람 화면 모두에서 사라져요. | We've hidden this decoration on your screen. If it's removed after review, it will disappear for both of you. | この飾りはあなたの画面で非表示にしました。確認の結果外すことになった場合は、ふたりの画面から消えます。 |
| `report.obj.fail.title` | 보내지 못했어요 | Couldn't send the report | 送れませんでした |
| `report.obj.fail.body` | 입력한 내용은 그대로예요. 잠시 뒤 다시 시도해 주세요. | What you wrote is still here. Please try again in a moment. | 入力した内容はそのままです。しばらくしてからもう一度お試しください。 |
| `report.obj.limit` | 오늘은 신고를 더 보낼 수 없어요. 내일 다시 시도해 주세요. | You can't send more reports today. Please try again tomorrow. | 今日はこれ以上報告できません。明日もう一度お試しください。 |

## S16 공통 상태

| 키 | 한국어 | English | 日本語 |
|---|---|---|---|
| `sys.server.title` | 서버가 잠시 불안정해요 | Our servers are having trouble | サーバーが一時的に不安定です |
| `sys.server.body` | 잠시 후 다시 시도해 주세요. 방은 그대로예요. | Please try again in a moment. Your room is unchanged. | しばらくしてからもう一度お試しください。部屋はそのままです。 |
| `sys.ai.title` | 꾸미기를 잠시 쓸 수 없어요 | Decorating is unavailable for now | 飾り付けは一時的に使えません |
| `sys.ai.body` | D-day와 방 보기는 그대로 쓸 수 있어요. 잠시 후 다시 시도해 주세요. | The day count and viewing the room still work. Please try again later. | 日数表示と部屋の閲覧はそのまま使えます。しばらくしてからお試しください。 |
| `sys.login.title` | 로그인이 만료됐어요 | Your sign-in has expired | ログインの有効期限が切れました |
| `sys.login.body` | 다시 로그인하면 이어서 쓸 수 있어요. | Sign in again to pick up where you left off. | もう一度ログインすると、続きから使えます。 |
| `sys.login.action` | 다시 로그인 | Sign in again | もう一度ログイン |
| `sys.denied.title` | 이 공간에 들어갈 수 없어요 | You can't open this space | このスペースには入れません |
| `sys.denied.body` | 이 공간의 구성원이 아니거나, 공간이 종료됐어요. | You're not a member of this space, or it has ended. | このスペースのメンバーではないか、スペースが終了しています。 |
| `sys.old.title` | 이 방은 더 새로운 앱에서 꾸몄어요 | This room was decorated in a newer app version | この部屋はより新しいバージョンのアプリで飾られています |
| `sys.old.body` | 앱을 업데이트하면 전부 볼 수 있어요. 지금은 읽을 수 있는 부분만 보여 드려요. | Update the app to see it all. For now you're seeing the parts this version can read. | アプリを更新するとすべて表示できます。今は読み取れる部分だけを表示しています。 |
| `sys.old.action` | 앱 업데이트 | Update the app | アプリを更新 |
| `sys.asset.title` | 일부 소품을 불러오지 못했어요 | Some items couldn't be loaded | 一部の小物を読み込めませんでした |
| `sys.asset.body` | 빈 자리는 비워 두었어요. 연결이 좋아지면 자동으로 다시 불러와요. | The spots are left empty. They reload automatically when your connection improves. | その場所は空けてあります。接続が良くなると自動で読み込み直します。 |
| `sys.pending.title` | 동기화를 기다리고 있어요 | Waiting to sync | 同期を待っています |
| `sys.pending.body` | 인터넷에 연결되면 최신 내용으로 바뀌어요. | It updates to the latest once you're connected. | インターネットに接続されると、最新の内容に更新されます。 |
| `sys.quota.title` | 오늘 꾸미기를 모두 썼어요 | You've used all of today's tries | 今日の回数を使い切りました |
| `sys.empty.title` | 아직 보여 드릴 게 없어요 | Nothing to show yet | まだ表示できるものがありません |
| `sys.empty.body` | 내용이 생기면 여기에 나타나요. | Content will show up here once there is some. | 表示できる内容ができると、ここに表示されます。 |
| `sys.retry` | 다시 시도 | Try again | もう一度試す |

## 접근성 이름(스크린 리더)

| 키 | 한국어 | English | 日本語 |
|---|---|---|---|
| `a11y.dday` | 함께한 지 {n}일째, 2025년 6월 29일부터 | Day {n} together, since June 29, 2025 | 一緒に過ごして{n}日目、2025年6月29日から |
| `a11y.back` | 뒤로 가기 | Go back | 戻る |
| `a11y.close` | 닫기 | Close | 閉じる |
| `a11y.home` | 메인 화면으로 이동 | Go to the home screen | メイン画面へ移動 |
| `a11y.settings` | 설정 열기 | Open settings | 設定を開く |
| `a11y.decorate` | 방 꾸미기 열기 | Open room decorating | 部屋の飾り付けを開く |
| `a11y.undo` | 이전 미리 보기로 되돌리기 | Go back to the previous preview | 前のプレビューに戻す |
| `a11y.mascot` | 아루미, {pose} | Aroomi, {pose} | アルーミ、{pose} |
| `a11y.send` | 요청 보내기 | Send request | リクエストを送信 |
| `a11y.input` | 꾸미기 요청 입력칸 | Decorating request field | 飾り付けリクエストの入力欄 |
| `a11y.input.ro` | {name}님이 꾸미는 중이라 입력할 수 없어요 | Can't type: {name} is decorating | 入力できません：{name}さんが飾っています |
| `a11y.apply` | 미리 보기를 방에 적용 | Apply the preview to the room | プレビューを部屋に反映 |
| `a11y.cancel` | 미리 보기 취소 | Cancel the preview | プレビューをキャンセル |
| `a11y.toggle.view` | 보기 전환: {state} | View: {state} | 表示切替：{state} |
| `a11y.code` | 초대 코드 {code}, 글자 하나씩 읽어요 | Invite code {code}, read one character at a time | 招待コード {code}、1文字ずつ読み上げます |
| `a11y.share` | 초대 코드 공유 시트 열기 | Open the share sheet for the invite code | 招待コードの共有シートを開く |
| `a11y.copy` | 초대 코드 복사 | Copy the invite code | 招待コードをコピー |
| `a11y.switch` | {name}, {state} | {name}, {state} | {name}、{state} |
| `a11y.on` | 켜짐 | on | オン |
| `a11y.off` | 꺼짐 | off | オフ |
| `a11y.presence` | 꾸미기 상태: {state} | Decorating status: {state} | 飾り付けの状態：{state} |
| `a11y.countdown` | {s}초 뒤에 꾸미기가 풀려요 | Decorating releases in {s} seconds | あと{s}秒で飾る権限が解除されます |
| `a11y.decor` | 장식 소품, 읽지 않아도 돼요 | Decorative item | 装飾の小物（読み上げ不要） |
| `a11y.version` | 버전 {n}, {by}, {time} | Version {n}, by {by}, {time} | バージョン{n}、{by}、{time} |
| `a11y.pose.wave_main` | 인사하고 있어요 | waving | 手を振っています |
| `a11y.pose.cheer` | 신나 있어요 | cheering | はしゃいでいます |
| `a11y.pose.lookup` | 올려다보고 있어요 | looking up | 見上げています |
| `a11y.pose.walk` | 걷고 있어요 | walking | 歩いています |
| `a11y.pose.lie` | 쉬고 있어요 | resting | 休んでいます |
| `a11y.pose.sleep` | 자고 있어요 | sleeping | 眠っています |
| `a11y.pose.back` | 뒤돌아 있어요 | seen from behind | 後ろを向いています |
| `a11y.pose.star_sit` | 별을 안고 있어요 | holding a star | 星を抱いています |
| `a11y.pose.box` | 상자에서 내다보고 있어요 | peeking out of a box | 箱からのぞいています |
| `a11y.pose.heart` | 하트를 안고 있어요 | holding a heart | ハートを抱えています |
| `a11y.pose.phone` | 폰을 보고 있어요 | looking at a phone | スマホを見ています |
| `a11y.dateField` | 함께한 날짜 입력 | Enter the date you got together | 一緒になった日を入力 |
| `a11y.progress` | 진행 중 | In progress | 処理中 |
| `a11y.tabbar` | 탭 막대 | Tab bar | タブバー |
| `a11y.tab` | {name} 탭, {total}개 중 {n}번째{sel} | {name} tab, {n} of {total}{sel} | {name}タブ、{total}件中{n}件目{sel} |
| `a11y.tab.sel` | , 선택됨 | , selected | 、選択中 |
| `a11y.toolbar` | 방 도구 막대 | Room toolbar | 部屋のツールバー |
| `a11y.coach` | 안내: {text} | Tip: {text} | ヒント：{text} |
| `a11y.cover.add` | 홈 배경 사진 추가 | Add a home background photo | ホームの背景写真を追加 |
| `a11y.cover.change` | 홈 배경 사진 바꾸기 | Change the home background photo | ホームの背景写真を変更 |
| `a11y.cover.photo` | 우리가 올린 배경 사진 | Background photo you shared | ふたりで設定した背景写真 |
| `a11y.cover.crop` | 사진 자르기 영역 | Photo crop area | 写真の切り抜き範囲 |
| `a11y.gen.open` | {label} 장식 정보 열기 | Open details for {label} | {label}の詳細を開く |

## 탭 이름(시스템 탭 바)

| 키 | 한국어 | English | 日本語 |
|---|---|---|---|
| `tab.home` | 홈 | Home | ホーム |
| `tab.room` | 방 | Room | 部屋 |
| `tab.settings` | 설정 | Settings | 設定 |

## 첫 실행 안내

| 키 | 한국어 | English | 日本語 |
|---|---|---|---|
| `coach.home` | 방 탭에서 우리 방을 꾸며 보세요 | Open the Room tab to decorate your room | 部屋タブで、ふたりの部屋を飾ってみましょう |
| `coach.room` | 꾸미기를 눌러 첫 방을 꾸며 보세요 | Tap Decorate to style your first room | 「飾る」をタップして最初の部屋を飾りましょう |
| `coach.ok` | 알겠어요 | Got it | わかりました |

## 마스코트 이름

| 키 | 한국어 | English | 日本語 |
|---|---|---|---|
| `mascot.name` | 아루미 | Aroomi | アルーミ |

## 에셋 이름(마스코트 11 · 오브젝트 18)

| 키 | 한국어 | English | 日本語 |
|---|---|---|---|
| `asset.mascot_wave_main` | 서서 손 흔들기 | Standing, waving | 立って手を振る |
| `asset.mascot_cheer` | 신나게 인사 | Cheering | はしゃいで挨拶 |
| `asset.mascot_lookup` | 올려다보기 | Looking up | 見上げる |
| `asset.mascot_walk` | 걷기 | Walking | 歩く |
| `asset.mascot_lie` | 엎드려 쉬기 | Lying down | ごろんと休む |
| `asset.mascot_sleep` | 잠자기 | Sleeping | おやすみ |
| `asset.mascot_back` | 뒷모습 | Back view | 後ろ姿 |
| `asset.mascot_star_sit` | 별 안고 앉기 | Sitting with a star | 星を抱いて座る |
| `asset.mascot_box` | 상자에서 빼꼼 | Peeking out of a box | 箱からひょっこり |
| `asset.mascot_heart` | 하트 들기 | Holding a heart | ハートを持つ |
| `asset.mascot_phone` | 폰 보기 | Looking at a phone | スマホを見る |
| `asset.obj_plant_potted` | 화분 식물 | Potted plant | 鉢植え |
| `asset.obj_plant_flowerpot` | 꽃 화분 | Flower pot | 花の鉢 |
| `asset.obj_decor_lamp` | 조명 | Lamp | ランプ |
| `asset.obj_decor_books` | 책 더미 | Book stack | 積み本 |
| `asset.obj_decor_cushion` | 쿠션 | Cushion | クッション |
| `asset.obj_decor_frame` | 액자 | Picture frame | 額縁 |
| `asset.obj_keep_mug` | 머그컵 | Mug | マグカップ |
| `asset.obj_keep_gift` | 선물 상자 | Gift box | ギフトボックス |
| `asset.obj_keep_letter` | 편지 봉투 | Envelope | 封筒 |
| `asset.obj_sky_moon` | 달 | Moon | 月 |
| `asset.obj_sky_star` | 별 | Star | 星 |
| `asset.obj_sky_cloud` | 구름 | Cloud | 雲 |
| `asset.obj_party_balloon` | 풍선 | Balloon | 風船 |
| `asset.obj_party_cake` | 케이크 | Cake | ケーキ |
| `asset.obj_party_ribbon` | 리본 | Ribbon | リボン |
| `asset.obj_shape_sparkle` | 반짝임 | Sparkle | きらめき |
| `asset.obj_shape_dots` | 점 무늬 | Dots | ドット |
| `asset.obj_shape_squiggle` | 물결선 | Squiggle | 波線 |
| `asset.alt.mascot_wave_main` | 마스코트가 한 손을 들고 인사해요 | Mascot standing and waving | マスコットが手を振っています |
| `asset.alt.mascot_cheer` | 마스코트가 신나서 손을 흔들어요 | Mascot cheering happily | マスコットがはしゃいで手を振っています |
| `asset.alt.mascot_lookup` | 마스코트가 위를 올려다봐요 | Mascot looking up | マスコットが見上げています |
| `asset.alt.mascot_walk` | 마스코트가 걸어가요 | Mascot walking | マスコットが歩いています |
| `asset.alt.mascot_lie` | 마스코트가 엎드려 쉬어요 | Mascot lying down | マスコットがごろんと休んでいます |
| `asset.alt.mascot_sleep` | 마스코트가 자고 있어요 | Mascot sleeping | マスコットが眠っています |
| `asset.alt.mascot_back` | 마스코트의 뒷모습 | Back view of the mascot | マスコットの後ろ姿 |
| `asset.alt.mascot_star_sit` | 마스코트가 별을 안고 앉아 있어요 | Mascot sitting with a star | マスコットが星を抱いて座っています |
| `asset.alt.mascot_box` | 마스코트가 상자에서 빼꼼 내다봐요 | Mascot peeking out of a box | マスコットが箱からのぞいています |
| `asset.alt.mascot_heart` | 마스코트가 하트를 안고 윙크해요 | Mascot holding a heart and winking | マスコットがハートを抱えてウインクしています |
| `asset.alt.mascot_phone` | 마스코트가 폰을 보고 있어요 | Mascot looking at a phone | マスコットがスマホを見ています |

## 에셋 분류

| 키 | 한국어 | English | 日本語 |
|---|---|---|---|
| `assetcat.mascot` | 마스코트 포즈 | Mascot poses | マスコットのポーズ |
| `assetcat.illus` | 마스코트 일러스트 | Mascot illustrations | マスコットのイラスト |
| `assetcat.plant` | 식물·화분 | Plants | 植物・鉢 |
| `assetcat.decor` | 방 소품 | Room decor | ルームの小物 |
| `assetcat.keepsake` | 작은 수집품 | Keepsakes | 小さなコレクション |
| `assetcat.sky` | 하늘·날씨 | Sky | 空・天気 |
| `assetcat.party` | 기념·축하 | Celebration | お祝い |
| `assetcat.shape` | 도형·반짝임 | Shapes | 図形・きらめき |

## 라이선스 화면

| 키 | 한국어 | English | 日本語 |
|---|---|---|---|
| `lic.title` | 글꼴·오픈소스 라이선스 | Font and open-source licenses | フォント・オープンソースのライセンス |
| `lic.ofl` | SIL 오픈 폰트 라이선스 1.1 | SIL Open Font License 1.1 | SIL Open Font License 1.1 |
| `lic.inter` | Inter · © 2020 The Inter Project Authors | Inter · © 2020 The Inter Project Authors | Inter · © 2020 The Inter Project Authors |
| `lic.notokr` | Noto Sans KR · Noto 프로젝트 | Noto Sans KR · The Noto Project | Noto Sans KR · Noto プロジェクト |
| `lic.notojp` | Noto Sans JP · Noto 프로젝트 | Noto Sans JP · The Noto Project | Noto Sans JP · Noto プロジェクト |
| `lic.view` | 전문 보기 | View full text | 全文を見る |
| `lic.note` | 아룸의 글꼴은 위 라이선스에 따라 앱에 포함되어 있어요. | The fonts in Aroom are bundled under the licenses above. | アルームのフォントは、上記のライセンスに基づいてアプリに同梱されています。 |

## cover

| 키 | 한국어 | English | 日本語 |
|---|---|---|---|
| `cover.add` | 사진 추가 | Add photo | 写真を追加 |
| `cover.sheet.title` | 홈 배경 사진 | Home background photo | ホームの背景写真 |
| `cover.sheet.pick` | 앨범에서 고르기 | Choose from your photos | アルバムから選ぶ |
| `cover.sheet.remove` | 사진 없애기 | Remove photo | 写真を外す |
| `cover.sheet.note` | 두 사람이 같은 사진을 봐요. 어느 쪽이든 바꾸거나 없앨 수 있고, 마지막에 바꾼 사진이 보여요. | You both see the same photo. Either of you can change or remove it, and the last change is the one shown. | ふたりに同じ写真が表示されます。どちらでも変更・削除でき、最後に変更した写真が表示されます。 |
| `cover.by` | 마지막으로 {name}님이 바꿨어요 · {time} | Last changed by {name} · {time} | 最後に{name}さんが変更しました · {time} |
| `cover.by.time` | 오늘 오후 9:14 | Today, 9:14 PM | 今日 21:14 |
| `cover.crop.title` | 보여 줄 부분을 맞춰 주세요 | Choose the part to show | 表示する部分を合わせてください |
| `cover.crop.hint` | 끌어서 옮기고, 두 손가락으로 크기를 바꿔요. | Drag to move, pinch to resize. | ドラッグで移動、2本指で大きさを変えます。 |
| `cover.crop.done` | 완료 | Done | 完了 |
| `cover.up.title` | 사진을 올리고 있어요 | Uploading your photo | 写真をアップロード中 |
| `cover.err.title` | 사진을 올리지 못했어요 | Couldn't upload the photo | 写真をアップロードできませんでした |
| `cover.err.body` | 인터넷 연결을 확인하고 다시 시도해 주세요. 지금 사진은 그대로예요. | Check your connection and try again. Your current photo is unchanged. | インターネット接続を確認して、もう一度お試しください。今の写真はそのままです。 |
| `cover.rej.title` | 이 사진은 쓸 수 없어요 | This photo can't be used | この写真は使えません |
| `cover.rej.body` | JPG·PNG·HEIC 사진만 올릴 수 있어요. 20MB 이하로 골라 주세요. | Only JPG, PNG or HEIC photos up to 20 MB can be used. | JPG・PNG・HEICの20MB以下の写真のみ使えます。 |
| `cover.load.err` | 사진을 불러오지 못했어요 | Couldn't load the photo | 写真を読み込めませんでした |
| `cover.removed` | 배경 사진을 없앴어요 | Background photo removed | 背景写真を外しました |
| `cover.updated` | 배경 사진을 바꿨어요 | Background photo updated | 背景写真を変更しました |
| `cover.partner.changed` | {name}님이 배경 사진을 바꿨어요 | {name} changed the background photo | {name}さんが背景写真を変更しました |
| `cover.partner.removed` | {name}님이 배경 사진을 없앴어요 | {name} removed the background photo | {name}さんが背景写真を外しました |
| `cover.loading` | 사진을 불러오는 중 | Loading photo | 写真を読み込み中 |

## 마일스톤 축하 (S28)

앱을 열었을 때 앱 안에서 보이는 고정 문구예요(AI 호출 없음). 알림 본문은 아래 `notif.body`예요. `{label}`은 `milestone.label.day` / `milestone.label.anniv` 결과, `{date}`는 로케일 날짜(10월 24일 / Oct 24 / 10月24日)예요.

| 키 | 한국어 | English | 日本語 |
|---|---|---|---|
| `milestone.label.day` | {n}일 | {n} days | {n}日 |
| `milestone.label.anniv` | {n}주년 | {n}-year anniversary | {n}周年 |
| `milestone.title.day` | {n}일을 함께했어요 | {n} days together | {n}日目です |
| `milestone.title.anniv` | {n}주년을 맞았어요 | Your {n}-year anniversary | {n}周年です |
| `milestone.body.today` | 아루미가 두 사람의 오늘을 함께 축하해요. | Aroomi is celebrating today with the two of you. | アルーミがふたりの今日をいっしょにお祝いします。 |
| `milestone.body.late` | {date}이 기념일이었어요. 아루미가 조금 늦게 축하해요. | Your milestone was on {date}. Aroomi is celebrating a little late. | 記念日は{date}でした。アルーミが少し遅れてお祝いします。 |
| `milestone.action.suggest` | 기념 방 꾸미기 보기 | See a decorating idea | 記念の飾り付けを見る |
| `milestone.bubble.day` | {n}일째, 축하해요! | Day {n}! Congrats! | {n}日目、おめでとう！ |
| `milestone.bubble.anniv` | {n}주년, 축하해요! | {n}-year anniversary! Congrats! | {n}周年、おめでとう！ |
| `milestone.suggest.chip` | {label} 기념 꾸미기 | Decorate for {label} | {label}の飾り付け |
| `milestone.suggest.hint` | AI 없이 앱이 준비한 제안이에요 | A ready-made idea from the app, no AI | AIなしで、アプリが用意した提案です |
| `milestone.suggest.busy` | 상대가 꾸미는 중이라 지금은 제안을 볼 수 없어요. | Your partner is decorating, so the idea isn't available right now. | パートナーが飾り付け中のため、今は提案を見られません。 |
| `milestone.suggest.full` | 방이 가득 차서 소품을 놓을 수 없어요. 소품을 줄이면 볼 수 있어요. | The room is full, so nothing can be added. Remove an item to see the idea. | 部屋がいっぱいで小物を置けません。小物を減らすと見られます。 |
| `milestone.suggest.partial` | 방에 자리가 모자라 소품 {n}개만 놓았어요. | The room is nearly full, so only {n} items were placed. | 部屋の空きが足りず、小物を{n}個だけ置きました。 |
| `milestone.preview.badge` | {label} 제안 | {label} idea | {label}の提案 |
| `milestone.msg.suggest` | 아루미가 {label} 기념 꾸미기를 제안했어요. | Aroomi suggested a decoration for {label}. | アルーミが{label}の飾り付けを提案しました。 |
| `milestone.preview.note` | AI를 쓰지 않는 앱의 제안이에요. 마음에 들 때만 적용해요. | This is the app's own idea, with no AI. Apply it only if you like it. | AIを使わないアプリからの提案です。気に入ったときだけ反映できます。 |
| `milestone.preview.changes` | 케이크·풍선·리본 같은 소품 {n}개와 문구 1개 | {n} party items (cake, balloons, ribbon) and 1 text | ケーキ・風船・リボンなどの小物{n}個と文言1つ |
| `milestone.plate.day` | 우리 {n}일 | Our day {n} | ふたりの{n}日 |
| `milestone.plate.anniv` | 우리 {n}주년 | Our {n}-year anniversary | ふたりの{n}周年 |
| `a11y.milestone.card` | {label} 축하 카드 | {label} celebration card | {label}のお祝いカード |
| `a11y.milestone.close` | 축하 카드 닫기 | Close the celebration card | お祝いカードを閉じる |
| `a11y.milestone.bubble` | 아루미의 말풍선: {text} | Aroomi's speech bubble: {text} | アルーミの吹き出し：{text} |

## 마일스톤 알림 · 마스코트 되살림

옵트인 기기 예약 로컬 알림의 문구(알림 본문은 잠금 화면에 보이므로 이름·날짜·일수가 없는 한 문장)와 설정 행, 방의 "아루미 다시 부르기" 컨트롤이에요. 알림 제목은 `main.appName`을 써요.

| 키 | 한국어 | English | 日本語 |
|---|---|---|---|
| `notif.body` | 아루미가 축하할 일이 생겼어요. | Aroomi has something to celebrate. | アルーミからお祝いのお知らせです。 |
| `notif.prompt.title` | 기념일에 아루미가 알려 줄까요? | Want Aroomi to remind you on milestones? | 記念日にアルーミがお知らせしましょうか？ |
| `notif.prompt.body` | 50일, 100일, 1주년 같은 날 오전 9시(방 시간대)에 이 기기로 알려 줘요. 알림에는 이름이나 날짜를 담지 않고, 설정에서 언제든 끌 수 있어요. | On days like 50, 100 or your anniversary, this device will notify you at 9:00 am (room time zone). The notification has no names or dates, and you can turn it off anytime in Settings. | 50日・100日・1周年などの日の午前9時（部屋のタイムゾーン）に、この端末でお知らせします。通知に名前や日付は入れず、設定でいつでもオフにできます。 |
| `notif.prompt.allow` | 알림 켜기 | Turn on | オンにする |
| `notif.prompt.later` | 다음에 | Not now | あとで |
| `notif.prompt.note` | 다음 화면에서 기기가 알림 권한을 물어봐요. | Your device will ask for notification permission next. | 次の画面で端末が通知の許可を確認します。 |
| `set.sec.notif` | 알림 | Notifications | 通知 |
| `set.notif` | 마일스톤 알림 | Milestone notifications | 記念日の通知 |
| `set.notif.sub.off` | 꺼짐 · 이 기기에만 적용돼요 | Off · applies to this device only | オフ · この端末のみ |
| `set.notif.sub.on` | 켜짐 · 기념일 오전 9시 | On · 9:00 am on milestone days | オン · 記念日の午前9時 |
| `set.notif.sub.denied` | 기기에서 알림이 꺼져 있어요 | Notifications are off on this device | 端末で通知がオフです |
| `set.notif.help` | 다가오는 기념일을 이 기기에 예약해 두고 오전 9시에 알려 줘요. 상대 기기는 따로 정해요. | Upcoming milestones are scheduled on this device and delivered at 9:00 am. Your partner's device is set separately. | 近づく記念日をこの端末に予約し、午前9時にお知らせします。パートナーの端末は別に設定します。 |
| `set.notif.denied.title` | 알림이 꺼져 있어요 | Notifications are turned off | 通知がオフです |
| `set.notif.denied.body` | 기기 설정에서 아룸 알림을 켜면 기념일에 받을 수 있어요. | Turn on Aroom notifications in your device settings to receive them on milestone days. | 端末の設定でアルームの通知をオンにすると、記念日に受け取れます。 |
| `set.notif.denied.action` | 기기 설정 열기 | Open device settings | 端末の設定を開く |
| `room.mascot.recall` | 아루미 다시 부르기 | Call Aroomi back | アルーミを呼び戻す |
| `room.mascot.missing` | 방에 아루미가 없어요. 누르면 기본 자리로 돌아와요. | Aroomi isn't in the room. Tap to bring Aroomi back to the default spot. | 部屋にアルーミがいません。タップすると元の位置に戻ります。 |

## 앱 이름 · 캐릭터 이름 · 슬로건 (결정 반영)

| 항목 | 한국어 | English | 日本語 | 상태 |
|---|---|---|---|---|
| 앱 이름 (`main.appName`) | 아룸 | Aroom | アルーム | 캡틴 결정. 일본어 アルーム는 초안(G4 원어민 검수 전). 이름 사용 가능 여부는 **확인 전** |
| 캐릭터 이름 (`mascot.name`) | 아루미 | Aroomi | アルーミ | 캡틴 결정. 일본어 アルーミ는 초안(G4 원어민 검수 전, 'アルミ'(알루미늄)와 구별) |
| 슬로건 (`brand.tagline`) | Our little world, together. | Our little world, together. | Our little world, together. | 영어 원문 결정. 한국어·일본어 초안은 승인됐지만 화면에는 아직 영어를 써요(번역을 넣을 때 이 칸만 바꿔요) |

**한국어·일본어 슬로건 번역 초안 (소유자 승인 · 초안, 화면에는 아직 쓰지 않았어요)**

| 언어 | 초안 | 메모 |
|---|---|---|
| 한국어 | 우리의 작은 세상, 함께 | 영어의 어순을 살린 직역. 더 자연스러운 문장은 결정권자가 정해 주세요 |
| 日本語 | ふたりの小さな世界、いっしょに | "ふたり"를 넣은 의역. 원어민 검수 필요 |

번역을 확정하면 `brand.tagline`의 한국어·일본어 칸만 바꾸면 돼요(키 수는 그대로).

참고: 슬로건은 온보딩 첫 장(S01 소개 1)과 로그인 선택(S02)의 이름 아래에 보여요. 글자 크기 130% 이상에서는 작업 내용에 공간을 내주려고 이름·슬로건 묶음을 숨겨요.

스토어 등록 정보의 **부제**(ko "함께 꾸며가는 커플앱" / en "Decorate your world together"(초안) / ja "ふたりで飾るカップルアプリ"(초안))는 앱 화면 문구가 아니어서 이 표의 키에 넣지 않았어요(`handoff.md` §16 끝, 브랜드 슬로건과 별개).

### Invite link sharing (assumption)
`invite.shareMsg` includes both the public invite URL and the formatted code, with the existing 24-hour note, in ko/en/ja. The web fallback explains copy, install, open and paste in the browser language.
