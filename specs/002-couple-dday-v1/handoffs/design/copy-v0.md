# V0 copy (ko / en / ja) — all V1 copy keys

Extracted 2026-11-02 from the copy boards `copy-v0-*` of artifact https://claude.ai/artifact/M2WFQCFnVzoWbHNhJPCz5X (version `1793598115-fafc`). KO is the source; EN and JA are drafts awaiting native review. The `status` column says whether a key is new (신규), reuses an existing repo key with the same text (재사용 · 기존 키 …), or changes an existing key's text (변경). `⏎` marks a line break.

**Brand names**: the boards draw the app as 모피루 / Mopiru / モピル and the mascot as 모피 / Mopi / モピ; the owner has not decided the final name (spec A-01). In the app, only `app.name` and `mascot.name` may contain these words; every other value must reference them with i18next nesting, e.g. `$t(app.name)를 시작해요`. See `../H02-v1-shell-home.md` §6.

## V0 공통 (`copy-v0-common.dc.html`)
sections: 이 화면의 문구

| key | ko | en | ja | status |
|---|---|---|---|---|
| `app.name` | 모피루 | Mopiru | モピル | 변경 · 기존 키 main.appName (아룸 → 모피루, 화면 보드 이름 기준) |
| `app.slogan` | Our little world, together. | Our little world, together. | Our little world, together. | 재사용 · 기존 키 brand.tagline |
| `tab.home` | 홈 | Home | ホーム | 재사용 · 기존 키 tab.home |
| `tab.anniv` | 기념일 | Anniversaries | 記念日 | 신규 · EN·JA 초안 |
| `tab.settings` | 설정 | Settings | 設定 | 재사용 · 기존 키 tab.settings |
| `a11y.tabbar` | 탭 막대 | Tab bar | タブバー | 재사용 · 기존 키 a11y.tabbar |
| `a11y.tab` | {name} 탭, {total}개 중 {n}번째{sel} | {name} tab, {n} of {total}{sel} | {name}タブ、{total}件中{n}件目{sel} | 재사용 · 기존 키 a11y.tab |
| `dday.big` | D+{n} | Day {n} | {n}日目 | 신규 · EN·JA 초안 |
| `dday.a11y` | 함께한 지 {n}일째, {date}부터 | Day {n} together, since {date} | 一緒に{n}日目、{date}から | 변경 · 기존 키 dday.count (날짜를 붙인 읽기용) |
| `dday.together` | 함께한 지 | Together | 一緒に過ごして | 재사용 · 기존 키 dday.eyebrow |
| `dday.since` | {date}부터 | Since {date} | {date}から | 변경 · 기존 키 date.since (날짜 자리 템플릿으로) |
| `dday.left` | D-{n} | In {n} days | あと{n}日 | 신규 · EN·JA 초안 |
| `dday.left.one` | D-1 | Tomorrow | 明日 | 신규 · EN·JA 초안 |
| `dday.today` | 오늘 | Today | 今日 | 신규 · EN·JA 초안 |
| `dday.ago` | {n}일 전 | {n} days ago | {n}日前 | 신규 · EN·JA 초안 |
| `anniv.days` | {n}일 | {n} days | {n}日 | 재사용 · 기존 키 milestone.label.day |
| `anniv.years` | {n}주년 | {n}-year anniversary | {n}周年 | 재사용 · 기존 키 milestone.label.anniv |
| `anniv.birthday` | {name} 생일 | {name}'s birthday | {name}の誕生日 | 신규 · EN·JA 초안 |
| `anniv.birthday.me` | 내 생일 | My birthday | 私の誕生日 | 신규 · EN·JA 초안 |
| `anniv.pepero` | 빼빼로데이 | Pepero Day | ペペロデー | 신규 · EN·JA 초안 |
| `anniv.christmas` | 크리스마스 | Christmas | クリスマス | 신규 · EN·JA 초안 |
| `anniv.kind.milestone` | 함께한 날 | Our milestones | ふたりの記念日 | 신규 · EN·JA 초안 |
| `anniv.kind.birthday` | 생일 | Birthdays | 誕生日 | 신규 · EN·JA 초안 |
| `anniv.kind.season` | 시즌 기념일 | Seasonal days | 季節の記念日 | 신규 · EN·JA 초안 |
| `anniv.kind.custom` | 직접 추가한 기념일 | Added by you two | ふたりで追加した記念日 | 신규 · EN·JA 초안 |
| `anniv.badge.custom` | 직접 | Custom | 追加 | 신규 · EN·JA 초안 |
| `date.long` | {y}년 {m}월 {d}일 ({w}) | {w}, {M} {d}, {y} | {y}年{m}月{d}日({w}) | 신규 · EN·JA 초안 |
| `date.short` | {m}월 {d}일 ({w}) | {w}, {M} {d} | {m}月{d}日({w}) | 신규 · EN·JA 초안 |
| `date.md` | {m}월 {d}일 | {M} {d} | {m}月{d}日 | 신규 · EN·JA 초안 |
| `common.save` | 저장 | Save | 保存 | 재사용 · 기존 키 common.save |
| `common.cancel` | 취소 | Cancel | キャンセル | 재사용 · 기존 키 common.cancel |
| `common.delete` | 삭제 | Delete | 削除 | 신규 · EN·JA 초안 |
| `common.retry` | 다시 시도 | Try again | もう一度試す | 재사용 · 기존 키 common.retry |
| `common.next` | 다음 | Next | 次へ | 재사용 · 기존 키 common.next |
| `common.done` | 완료 | Done | 完了 | 재사용 · 기존 키 common.done |
| `common.edit` | 편집 | Edit | 編集 | 신규 · EN·JA 초안 |
| `common.back` | 뒤로 | Back | 戻る | 재사용 · 기존 키 common.back |
| `common.close` | 닫기 | Close | 閉じる | 재사용 · 기존 키 common.close |
| `common.ok` | 확인 | OK | OK | 신규 · EN·JA 초안 |
| `mascot.alt.wave` | 모피, 인사하고 있어요 | Mopi, waving | モピ、手を振っています | 변경 · 기존 키 a11y.mascot (아루미 → 모피) |
| `mascot.alt.cheer` | 모피, 신나 있어요 | Mopi, cheering | モピ、はしゃいでいます | 변경 · 기존 키 a11y.mascot (아루미 → 모피) |
| `mascot.alt.lookup` | 모피, 기다리고 있어요 | Mopi, waiting | モピ、待っています | 변경 · 기존 키 a11y.mascot (아루미 → 모피) |
| `a11y.tab.sel` | , 선택됨 | , selected | 、選択中 | 재사용 · 기존 키 a11y.tab.sel |

## V0-01 시작 (`copy-v0-start.dc.html`)
sections: 이 화면의 문구

| key | ko | en | ja | status |
|---|---|---|---|---|
| `start.intro.title` | 우리 둘의 날을 세어요 | Count your days together | ふたりの日を数えよう | 신규 · EN·JA 초안 |
| `start.intro.f1` | 사귄 날부터 D+Day를 세어요 | Counts D+Day from the day you got together | 付き合った日からD+Dayを数えます | 신규 · EN·JA 초안 |
| `start.intro.f2` | 50일·100일·주년·생일을 미리 알려 줘요 | Reminds you of 50 days, 100 days, anniversaries and birthdays | 50日・100日・記念日・誕生日をお知らせします | 신규 · EN·JA 초안 |
| `start.intro.f3` | 홈 화면과 잠금 화면 위젯으로 바로 봐요 | See it on your Home Screen and Lock Screen | ホーム画面とロック画面のウィジェットですぐ見られます | 신규 · EN·JA 초안 |
| `auth.apple` | Apple로 계속하기 | Continue with Apple | Appleで続ける | 재사용 · 기존 키 login.apple |
| `start.intro.terms` | 계속하면 이용약관과 개인정보 처리방침에 동의하게 돼요. | By continuing, you agree to the Terms of Use and Privacy Policy. | 続けると、利用規約とプライバシーポリシーに同意したことになります。 | 신규 · EN·JA 초안 |
| `start.choose.title` | 어떻게 시작할까요? | How would you like to start? | どうやって始めますか？ | 신규 · EN·JA 초안 |
| `start.choose.new.title` | 새로 시작하기 | Start fresh | 新しく始める | 신규 · EN·JA 초안 |
| `start.choose.new.body` | 사귄 날을 넣고 상대를 초대해요 | Enter your start date and invite your partner | 付き合った日を入れて相手を招待します | 신규 · EN·JA 초안 |
| `start.choose.join.title` | 초대 코드가 있어요 | I have an invite code | 招待コードがあります | 재사용 · 기존 키 join.haveCode |
| `start.choose.join.body` | 상대에게 받은 8자리 코드를 넣어요 | Enter the 8-character code from your partner | 相手から届いた8桁のコードを入れます | 신규 · EN·JA 초안 |
| `start.date.title` | 사귄 날을 알려 주세요 | When did you two start dating? | 付き合い始めた日を教えてください | 변경 · 기존 키 space.title |
| `start.date.body` | 이 날이 1일째(D+1)예요. 나중에 설정에서 고칠 수 있어요. | This day counts as Day 1. You can change it later in Settings. | この日が1日目です。あとで設定から変更できます。 | 변경 · 기존 키 space.body |
| `start.date.label` | 사귄 날 | Start date | 付き合った日 | 변경 · 기존 키 space.date.label |
| `start.date.preview` | 오늘은 {n}일째 · D+{n} | Today is Day {n} | 今日は{n}日目です | 신규 · EN·JA 초안 |
| `start.date.err.future` | 오늘 이후의 날짜는 고를 수 없어요. | You can't pick a date after today. | 今日より後の日付は選べません。 | 재사용 · 기존 키 space.date.future |
| `start.date.picker` | 날짜 고르기 | Choose a date | 日付を選ぶ | 재사용 · 기존 키 space.date.pick |
| `start.profile.title` | 나를 알려 주세요 | Tell us about you | あなたのことを教えてください | 신규 · EN·JA 초안 |
| `start.profile.name` | 내 이름 | Your name | あなたの名前 | 신규 · EN·JA 초안 |
| `start.profile.name.ph` | 상대에게 보일 이름 | The name your partner sees | 相手に表示される名前 | 신규 · EN·JA 초안 |
| `start.profile.birthday` | 내 생일 (선택) | Your birthday (optional) | 誕生日（任意） | 신규 · EN·JA 초안 |
| `start.profile.year` | 태어난 해도 넣기 | Include birth year | 生まれた年も入れる | 신규 · EN·JA 초안 |
| `start.profile.birthdayHint` | 두 사람 모두 생일을 넣으면 서로의 기념일에 함께 보여요. 양력 기준이에요. | Once you both add your birthdays, they show up in each other's anniversaries. Uses the Gregorian (solar) calendar. | ふたりとも誕生日を入れると、お互いの記念日に表示されます。新暦（太陽暦）です。 | 신규 · EN·JA 초안 |
| `start.profile.err.name` | 이름을 넣어 주세요 | Please enter your name | 名前を入力してください | 신규 · EN·JA 초안 |
| `start.profile.skip` | 생일은 나중에 넣을게요 | I'll add my birthday later | 誕生日はあとで入れます | 신규 · EN·JA 초안 |
| `invite.title` | 상대를 초대해 주세요 | Invite your partner | パートナーを招待しましょう | 재사용 · 기존 키 invite.title |
| `invite.body` | 아래 코드를 상대에게 보내 주세요. 코드는 24시간 동안 한 번만 쓸 수 있어요. | Send this code to your partner. It works once and expires in 24 hours. | このコードをパートナーに送ってください。コードは24時間のあいだ、1回だけ使えます。 | 재사용 · 기존 키 invite.body |
| `invite.label` | 초대 코드 | Invite code | 招待コード | 재사용 · 기존 키 invite.code.label |
| `invite.expires` | {h}시간 {m}분 뒤에 만료돼요 | Expires in {h} h {m} min | あと{h}時間{m}分で期限切れ | 재사용 · 기존 키 invite.expires |
| `invite.share` | 코드 공유하기 | Share code | コードを共有 | 재사용 · 기존 키 invite.share |
| `invite.copy` | 코드 복사 | Copy code | コードをコピー | 재사용 · 기존 키 invite.copy |
| `start.invite.home` | 홈에서 기다릴게요 | I'll wait on Home | ホームで待ちます | 신규 · EN·JA 초안 |
| `start.invite.hint` | 코드는 홈에도 계속 보여요. 상대가 넣으면 바로 연결돼요. | The code stays on Home too. You connect as soon as your partner enters it. | コードはホームにも表示されたままです。相手が入力するとすぐつながります。 | 신규 · EN·JA 초안 |
| `join.title` | 초대 코드를 입력해 주세요 | Enter your invite code | 招待コードを入力してください | 재사용 · 기존 키 join.title |
| `join.body` | 상대에게 받은 8자리 코드를 입력해 주세요. | Enter the 8-character code your partner sent you. | パートナーから受け取った8文字のコードを入力してください。 | 재사용 · 기존 키 join.body |
| `join.paste` | 붙여넣기 | Paste | 貼り付け | 재사용 · 기존 키 join.paste |
| `join.check` | 코드 확인 | Check code | コードを確認 | 재사용 · 기존 키 join.check |
| `join.found.title` | 이 공간에 참여할까요? | Join this space? | このスペースに参加しますか？ | 재사용 · 기존 키 join.found.heading |
| `join.found.who` | {name}님의 공간이에요 | {name}'s space | {name}さんのスペースです | 재사용 · 기존 키 join.found.title |
| `start.join.found.body` | 사귄 날은 {date}이에요. 오늘은 {n}일째예요. | You started dating on {date}. Today is Day {n}. | 付き合った日は{date}です。今日は{n}日目です。 | 변경 · 기존 키 join.found.body |
| `join.accept` | 참여하기 | Join | 参加する | 재사용 · 기존 키 join.accept |
| `join.decline` | 참여하지 않기 | Don't join | 参加しない | 재사용 · 기존 키 join.decline |
| `start.connected.title` | 연결됐어요! | You're connected! | つながりました！ | 신규 · EN·JA 초안 |
| `start.connected.body` | {name}님과 함께한 지 {n}일째예요 | Day {n} with {name} | {name}さんと一緒に{n}日目です | 신규 · EN·JA 초안 |
| `start.connected.cta` | 시작하기 | Get started | はじめる | 재사용 · 기존 키 onb.start |
| `notify.pre.title` | 기념일을 잊지 않게 알려 드릴까요? | Want a reminder so you never miss a day? | 記念日を忘れないようにお知らせしましょうか？ | 신규 · EN·JA 초안 |
| `notify.pre.body` | 기념일 당일 오전 9시에 알려 드려요. 시간과 미리 알림은 설정에서 바꿀 수 있어요. | We'll remind you at 9:00 AM on the day. You can change the time and early reminders in Settings. | 記念日当日の午前9時にお知らせします。時間と事前のお知らせは設定で変更できます。 | 신규 · EN·JA 초안 |
| `notify.sample.body` | 오늘은 빼빼로데이예요. 모피가 함께 축하해요. | Today is Pepero Day. Mopi is celebrating with you. | 今日はペペロデーです。モピもいっしょにお祝いします。 | 신규 · EN·JA 초안 |
| `notify.sample.when` | 지금 | now | 今 | 신규 · EN·JA 초안 |
| `notify.pre.allow` | 알림 켜기 | Turn on | オンにする | 재사용 · 기존 키 notif.prompt.allow |
| `notify.pre.later` | 다음에 | Not now | あとで | 재사용 · 기존 키 notif.prompt.later |
| `notify.os.title` | "모피루"에서 알림을 보내고자 합니다 | "Mopiru" Would Like to Send You Notifications | "モピル"は通知を送信します。よろしいですか？ | 신규 · EN·JA 초안 |
| `notify.os.allow` | 허용 | Allow | 許可 | 신규 · EN·JA 초안 |
| `notify.os.deny` | 허용 안 함 | Don't Allow | 許可しない | 신규 · EN·JA 초안 |
| `notify.os.label` | iOS 시스템 권한 창 (문구는 OS가 정함, 본문만 앱이 정함) | iOS system prompt | iOS システムの許可ダイアログ | 신규 · EN·JA 초안 |
| `notify.os.body` | 기념일 당일에 알려 드려요. | We'll remind you on your special days. | 記念日の当日にお知らせします。 | 신규 · EN·JA 초안 |

## V0-02 홈 (`copy-v0-home.dc.html`)
sections: 이 화면의 문구

| key | ko | en | ja | status |
|---|---|---|---|---|
| `home.names.a11y` | {me}님과 {partner}님 | {me} and {partner} | {me}さんと{partner}さん | 신규 · EN·JA 초안 |
| `home.next.label` | 다음 기념일 | Next up | 次の記念日 | 신규 · EN·JA 초안 |
| `home.upcoming.title` | 다가오는 기념일 | Coming up | もうすぐの記念日 | 신규 · EN·JA 초안 |
| `home.upcoming.all` | 전체 보기 | See all | すべて見る | 신규 · EN·JA 초안 |
| `home.today.title` | 오늘은 우리 {title} | Today is our {title} | 今日はふたりの{title} | 신규 · EN·JA 초안 |
| `home.today.title.season` | 오늘은 {title} | Today is {title} | 今日は{title} | 신규 · EN·JA 초안 |
| `home.today.title.birthday` | 오늘은 {name}님 생일 | Today is {name}'s birthday | 今日は{name}さんの誕生日 | 신규 · EN·JA 초안 |
| `home.today.body.milestone` | {date}부터 {n}일째 함께했어요. | You've spent {n} days together since {date}. | {date}から一緒に{n}日目です。 | 신규 · EN·JA 초안 |
| `home.today.body.season` | 모피가 둘의 오늘을 함께 축하해요. | Mopi is celebrating your day with you. | モピがふたりの今日をいっしょにお祝いします。 | 변경 · 기존 키 milestone.body.today (아루미 → 모피) |
| `home.today.late` | {date}이 {title}이었어요. 모피가 조금 늦게 축하해요. | {date} was your {title}. Mopi is celebrating a little late. | {date}は{title}でした。モピが少し遅れてお祝いします。 | 변경 · 기존 키 milestone.body.late |
| `home.today.close` | 축하 카드 닫기 | Close the celebration card | お祝いカードを閉じる | 재사용 · 기존 키 a11y.milestone.close |
| `home.today.chip` | 오늘 {title} | Today: {title} | 今日は{title} | 신규 · EN·JA 초안 |
| `home.pending.partner` | 상대 | Partner | 相手 | 신규 · EN·JA 초안 |
| `home.pending.chip` | 상대를 기다리는 중 | Waiting for your partner | 相手を待っています | 변경 · 기존 키 main.chip.waiting |
| `home.pending.title` | 상대가 코드를 넣으면 연결돼요 | You'll connect when your partner enters the code | 相手がコードを入力するとつながります | 신규 · EN·JA 초안 |
| `home.pending.hint` | 연결되면 상대의 생일과 직접 추가한 기념일도 함께 보여요. | Once connected, your partner's birthday and your custom days show up too. | つながると、相手の誕生日や追加した記念日も表示されます。 | 신규 · EN·JA 초안 |
| `home.partnerEdited` | {name}님이 사귄 날을 {date}로 바꿨어요 | {name} changed your start date to {date} | {name}さんが付き合った日を{date}に変更しました | 신규 · EN·JA 초안 |

## V0-03 시스템 상태 (`copy-v0-states.dc.html`)
sections: 이 화면의 문구

| key | ko | en | ja | status |
|---|---|---|---|---|
| `state.loading` | 불러오는 중이에요 | Loading | 読み込み中です | 재사용 · 기존 키 common.loading |
| `state.error.title` | 화면을 불러오지 못했어요 | Couldn't load | 読み込めませんでした | 변경 · 기존 키 sys.loadFail.title (방 → 화면) |
| `state.error.body` | 인터넷 연결을 확인하고 다시 시도해 주세요. | Check your internet connection and try again. | インターネット接続を確認して、もう一度お試しください。 | 재사용 · 기존 키 set.err.body |
| `state.offline.banner` | 오프라인이에요 · 마지막 확인 {time} | Offline · Last updated {time} | オフライン・最終確認 {time} | 변경 · 기존 키 main.lastSeen |
| `state.offline.readonly` | 연결되면 다시 고칠 수 있어요 | You can edit again once you are online | オンラインになると編集できます | 신규 · EN·JA 초안 |
| `state.offline.empty.title` | 아직 불러온 내용이 없어요 | Nothing loaded yet | まだ読み込んだ内容がありません | 신규 · EN·JA 초안 |
| `state.offline.empty.body` | 인터넷에 연결하면 바로 보여 드릴게요. | We'll show it as soon as you're online. | インターネットにつながるとすぐ表示します。 | 신규 · EN·JA 초안 |
| `end.byPartnerDisconnect` | {name}님이 연결을 끊었어요 | {name} disconnected | {name}さんがつながりを終了しました | 재사용 · 기존 키 end.byPartnerDisconnect |
| `end.byPartnerDeleted` | 상대가 계정을 삭제했어요 | Your partner deleted their account | 相手がアカウントを削除しました | 재사용 · 기존 키 end.byPartnerDeleted |
| `state.ended.body` | 두 사람의 공간이 끝났어요. 날짜와 기념일은 더 이상 볼 수 없어요. | Your shared space has ended. Your dates and anniversaries are no longer available. | ふたりのスペースは終了しました。日付と記念日はもう表示されません。 | 신규 · EN·JA 초안 |
| `state.ended.cta` | 새로 시작하기 | Start over | 新しく始める | 신규 · EN·JA 초안 |
| `time.sample` | 오후 9:12 | 9:12 PM | 21:12 | 재사용 · 기존 키 main.lastSeen.sample |

## V0-04 기념일 (`copy-v0-anniv.dc.html`)
sections: 이 화면의 문구

| key | ko | en | ja | status |
|---|---|---|---|---|
| `anniv.add` | 기념일 추가 | Add anniversary | 記念日を追加 | 신규 · EN·JA 초안 |
| `anniv.filter.all` | 전체 | All | すべて | 신규 · EN·JA 초안 |
| `anniv.filter.custom` | 직접 추가 | Custom | 追加した記念日 | 신규 · EN·JA 초안 |
| `anniv.section.today` | 오늘 | Today | 今日 | 신규 · EN·JA 초안 |
| `anniv.section.upcoming` | 다가오는 기념일 | Upcoming | これからの記念日 | 신규 · EN·JA 초안 |
| `anniv.section.past` | 지난 기념일 | Past | 過ぎた記念日 | 신규 · EN·JA 초안 |
| `anniv.past.show` | 지난 기념일 {n}개 보기 | Show {n} past | 過ぎた記念日を{n}件見る | 신규 · EN·JA 초안 |
| `anniv.past.hide` | 지난 기념일 접기 | Hide past | 過ぎた記念日を閉じる | 신규 · EN·JA 초안 |
| `anniv.birthday.wait` | {name}님이 생일을 넣으면 함께 보여요 | {name}'s birthday shows up once they add it | {name}さんが誕生日を入れると表示されます | 신규 · EN·JA 초안 |
| `anniv.birthday.mine` | 내 생일을 넣으면 서로 보여요 | Add your birthday so you can both see it | 誕生日を入れるとお互いに表示されます | 신규 · EN·JA 초안 |
| `anniv.birthday.add` | 내 생일 넣기 | Add my birthday | 誕生日を入れる | 신규 · EN·JA 초안 |
| `anniv.empty.title` | 둘만의 기념일을 추가해 보세요 | Add a day that is just yours | ふたりだけの記念日を追加しましょう | 신규 · EN·JA 초안 |
| `anniv.empty.body` | 처음 만난 날, 첫 여행처럼 둘에게 특별한 날을 남겨요. 상대에게도 함께 보여요. | Save days that matter to you two, like the day you met or your first trip. Your partner sees them too. | 初めて会った日や初めての旅行など、ふたりの特別な日を残しましょう。相手にも表示されます。 | 신규 · EN·JA 초안 |
| `anniv.row.a11y` | {title}, {date}, {left} | {title}, {date}, {left} | {title}、{date}、{left} | 신규 · EN·JA 초안 |
| `anniv.detail.auto` | 사귄 날로 자동 계산돼요 | Calculated from your start date | 付き合った日から自動で計算されます | 신규 · EN·JA 초안 |
| `anniv.detail.auto.fixed` | 매년 자동으로 들어가는 기념일이에요 | Added automatically every year | 毎年自動で入る記念日です | 신규 · EN·JA 초안 |
| `anniv.rule.days` | 사귄 날({start})을 1일째로 세어 {n}일째 되는 날 | Day {n}, counting {start} as Day 1 | 付き合った日（{start}）を1日目として{n}日目 | 신규 · EN·JA 초안 |
| `anniv.rule.years` | 매년 사귄 날과 같은 날짜 ({md}) | Every year on your start date ({md}) | 毎年、付き合った日と同じ日付（{md}） | 신규 · EN·JA 초안 |
| `anniv.rule.fixed` | 매년 {md} | Every year on {md} | 毎年{md} | 신규 · EN·JA 초안 |
| `anniv.rule.birthday` | 매년 {md} · 양력 | Every year on {md} · Gregorian | 毎年{md}・新暦 | 신규 · EN·JA 초안 |
| `anniv.detail.when` | 날짜 | Date | 日付 | 신규 · EN·JA 초안 |
| `anniv.detail.rule` | 계산 | How it is counted | 計算 | 신규 · EN·JA 초안 |
| `anniv.detail.repeat` | 반복 | Repeat | 繰り返し | 신규 · EN·JA 초안 |
| `anniv.repeat.yearly` | 매년 | Every year | 毎年 | 신규 · EN·JA 초안 |
| `anniv.repeat.once` | 한 번만 | Once | 1回だけ | 신규 · EN·JA 초안 |
| `anniv.detail.memo` | 메모 | Note | メモ | 신규 · EN·JA 초안 |
| `anniv.detail.notify` | 알림 | Notifications | 通知 | 재사용 · 기존 키 set.sec.notif |
| `anniv.notify.default` | 기본 설정 ({time} · {early}) | Default ({time} · {early}) | 基本設定（{time}・{early}） | 신규 · EN·JA 초안 |
| `anniv.notify.off` | 알림 끄기 | Off | オフ | 신규 · EN·JA 초안 |
| `anniv.detail.by` | {name}님이 추가했어요 · {date} 수정 | Added by {name} · Edited {date} | {name}さんが追加・{date}に編集 | 신규 · EN·JA 초안 |
| `anniv.detail.byMe` | 내가 추가했어요 · {date} 수정 | Added by you · Edited {date} | 自分で追加・{date}に編集 | 신규 · EN·JA 초안 |
| `anniv.detail.nth` | {n}번째 {title} | {title} #{n} | {n}回目の{title} | 신규 · EN·JA 초안 |
| `anniv.detail.system.note` | 자동으로 들어가는 기념일은 고치거나 지울 수 없어요. 종류별 알림은 설정에서 바꿔요. | Automatic days can't be edited or deleted. Change reminders by type in Settings. | 自動で入る記念日は編集・削除できません。種類ごとの通知は設定で変更します。 | 신규 · EN·JA 초안 |
| `anniv.detail.openSettings` | 알림 설정 열기 | Open reminder settings | 通知設定を開く | 신규 · EN·JA 초안 |
| `anniv.detail.birthday.note` | 생일은 본인만 고칠 수 있어요. | Only the birthday person can change it. | 誕生日は本人だけが変更できます。 | 신규 · EN·JA 초안 |

## V0-05 기념일 편집 (`copy-v0-edit.dc.html`)
sections: 이 화면의 문구

| key | ko | en | ja | status |
|---|---|---|---|---|
| `edit.new.title` | 기념일 추가 | New anniversary | 記念日を追加 | 신규 · EN·JA 초안 |
| `edit.edit.title` | 기념일 편집 | Edit anniversary | 記念日を編集 | 신규 · EN·JA 초안 |
| `edit.field.title` | 제목 | Title | タイトル | 신규 · EN·JA 초안 |
| `edit.field.title.ph` | 예: 처음 만난 날 | e.g. The day we met | 例：初めて会った日 | 신규 · EN·JA 초안 |
| `edit.counter` | {n}/{max} | {n}/{max} | {n}/{max} | 신규 · EN·JA 초안 |
| `edit.field.date` | 날짜 | Date | 日付 | 신규 · EN·JA 초안 |
| `edit.field.repeat` | 반복 | Repeat | 繰り返し | 신규 · EN·JA 초안 |
| `edit.field.memo` | 메모 (선택) | Note (optional) | メモ（任意） | 신규 · EN·JA 초안 |
| `edit.field.memo.ph` | 둘만 아는 이야기를 적어요 | Something only you two know | ふたりだけの思い出を書きましょう | 신규 · EN·JA 초안 |
| `edit.field.notify` | 알림 | Notifications | 通知 | 재사용 · 기존 키 set.sec.notif |
| `edit.preview.next` | 다음 기념일 {date} · {left} | Next: {date} · {left} | 次は{date}・{left} | 신규 · EN·JA 초안 |
| `edit.preview.past` | 지난 날짜예요. 지난 기념일에 들어가요. | This date has passed, so it'll go under Past. | 過ぎた日付です。過ぎた記念日に入ります。 | 신규 · EN·JA 초안 |
| `edit.err.title.empty` | 제목을 넣어 주세요 | Please enter a title | タイトルを入力してください | 신규 · EN·JA 초안 |
| `edit.err.title.long` | 제목은 20자까지 쓸 수 있어요 | Titles can be up to 20 characters | タイトルは20文字までです | 신규 · EN·JA 초안 |
| `edit.err.memo.long` | 메모는 100자까지 쓸 수 있어요 | Notes can be up to 100 characters | メモは100文字までです | 신규 · EN·JA 초안 |
| `edit.shared.hint` | 저장하면 {name}님에게도 보여요. {name}님 앱이 닫혀 있으면 앱을 열 때 반영돼요. | Once saved, {name} sees it too. If {name}'s app is closed, their phone updates when they open it. | 保存すると{name}さんにも表示されます。{name}さんのアプリが閉じていると、次に開いたときに反映されます。 | 신규 · EN·JA 초안 |
| `edit.delete` | 이 기념일 삭제 | Delete this anniversary | この記念日を削除 | 신규 · EN·JA 초안 |
| `edit.delete.title` | 기념일을 삭제할까요? | Delete this anniversary? | この記念日を削除しますか？ | 신규 · EN·JA 초안 |
| `edit.delete.body` | {name}님 화면에서도 사라지고 되돌릴 수 없어요. | It'll disappear for {name} too, and this can't be undone. | {name}さんの画面からも消え、元に戻せません。 | 신규 · EN·JA 초안 |
| `edit.saved` | 저장했어요 | Saved | 保存しました | 신규 · EN·JA 초안 |
| `edit.deleted` | 삭제했어요 | Deleted | 削除しました | 신규 · EN·JA 초안 |
| `edit.saving` | 저장하는 중이에요 | Saving | 保存しています | 신규 · EN·JA 초안 |
| `edit.conflict.title` | {name}님이 먼저 고쳤어요 | {name} edited this first | {name}さんが先に編集しました | 신규 · EN·JA 초안 |
| `edit.conflict.body` | 최신 내용을 불러왔어요. 확인하고 다시 저장해 주세요. | We loaded the latest version. Check it and save again. | 最新の内容を読み込みました。確認してもう一度保存してください。 | 신규 · EN·JA 초안 |
| `edit.gone.title` | 이미 삭제된 기념일이에요 | This anniversary was already deleted | この記念日はすでに削除されています | 신규 · EN·JA 초안 |
| `edit.gone.body` | {name}님이 삭제했어요. 목록으로 돌아갈게요. | {name} deleted it. We'll take you back to the list. | {name}さんが削除しました。一覧に戻ります。 | 신규 · EN·JA 초안 |
| `edit.discard.title` | 고친 내용을 버릴까요? | Discard your changes? | 変更を破棄しますか？ | 신규 · EN·JA 초안 |
| `edit.discard.cta` | 버리기 | Discard | 破棄 | 신규 · EN·JA 초안 |
| `edit.discard.keep` | 계속 고치기 | Keep editing | 編集を続ける | 신규 · EN·JA 초안 |
| `edit.save.err` | 저장하지 못했어요. 고친 내용은 그대로 있어요. | Couldn't save. Your changes are still here. | 保存できませんでした。変更はそのまま残っています。 | 신규 · EN·JA 초안 |

## V0-06 위젯 (`copy-v0-widgets.dc.html`)
sections: 이 화면의 문구

| key | ko | en | ja | status |
|---|---|---|---|---|
| `widget.gallery.dday.name` | D+Day | D+Day | D+Day | 신규 · EN·JA 초안 |
| `widget.gallery.dday.desc` | 함께한 날과 다음 기념일을 보여 줘요. | Shows your days together and what is coming up. | 一緒の日数と次の記念日を表示します。 | 신규 · EN·JA 초안 |
| `widget.gallery.list.name` | 다가오는 기념일 | Coming up | もうすぐの記念日 | 신규 · EN·JA 초안 |
| `widget.gallery.list.desc` | 다가오는 기념일을 날짜순으로 보여 줘요. | Shows your upcoming anniversaries in order. | これからの記念日を日付順に表示します。 | 신규 · EN·JA 초안 |
| `widget.next` | 다음 | Next | 次へ | 재사용 · 기존 키 common.next |
| `widget.today` | 오늘은 {title} | Today: {title} | 今日は{title} | 신규 · EN·JA 초안 |
| `widget.pending` | 상대 연결 전 | Partner not joined | 相手の参加待ち | 신규 · EN·JA 초안 |
| `widget.pending.body` | 앱에서 초대 코드를 보내요 | Send the invite code from the app | アプリから招待コードを送りましょう | 신규 · EN·JA 초안 |
| `widget.none.title` | 모피루를 시작해요 | Start Mopiru | モピルをはじめよう | 신규 · EN·JA 초안 |
| `widget.none.body` | 앱을 열어 둘의 공간을 만들어요 | Open the app to set up your space | アプリを開いてふたりのスペースを作りましょう | 신규 · EN·JA 초안 |
| `widget.ended` | 공간이 끝났어요 | Space ended | スペースは終了しました | 신규 · EN·JA 초안 |
| `widget.a11y` | 함께한 지 {n}일째. 다음 기념일 {title}, {left} | Day {n} together. Next: {title}, {left} | 一緒に{n}日目。次の記念日は{title}、{left} | 신규 · EN·JA 초안 |
| `widget.lock.days` | D+ | Day | 日目 | 신규 · EN·JA 초안 |

## V0-07 설정 (`copy-v0-settings.dc.html`)
sections: 이 화면의 문구

| key | ko | en | ja | status |
|---|---|---|---|---|
| `set.title` | 설정 | Settings | 設定 | 재사용 · 기존 키 set.title |
| `set.section.me` | 내 정보 | About me | 自分の情報 | 신규 · EN·JA 초안 |
| `set.me.name` | 이름 | Name | 名前 | 변경 · 기존 키 set.name (별명 → 이름) |
| `set.me.birthday` | 생일 | Birthday | 誕生日 | 신규 · EN·JA 초안 |
| `set.me.birthday.none` | 넣지 않음 | Not set | 未設定 | 신규 · EN·JA 초안 |
| `set.me.edit.title` | 내 정보 고치기 | Edit my info | 自分の情報を編集 | 신규 · EN·JA 초안 |
| `set.me.birthday.partnerWait` | {name}님은 아직 생일을 넣지 않았어요. 둘 다 넣으면 서로 보여요. | {name} hasn't added a birthday yet. Once you both do, you'll see each other's. | {name}さんはまだ誕生日を入れていません。ふたりとも入れるとお互いに表示されます。 | 신규 · EN·JA 초안 |
| `set.section.us` | 우리 | Us | ふたり | 신규 · EN·JA 초안 |
| `set.us.start` | 사귄 날 | Start date | 付き合った日 | 신규 · EN·JA 초안 |
| `set.us.partner` | 상대 | Partner | 相手 | 신규 · EN·JA 초안 |
| `set.us.connected` | {name} · 연결됨 | {name} · Connected | {name}・つながっています | 신규 · EN·JA 초안 |
| `set.us.tz` | 기준 시간대 | Time zone | 基準タイムゾーン | 변경 · 기존 키 set.room.tz |
| `set.us.tz.value` | 서울 (UTC+9) | Seoul (UTC+9) | ソウル（UTC+9） | 재사용 · 기존 키 set.room.tz.value |
| `set.us.tz.note` | 날짜가 바뀌는 자정과 알림 시간은 이 시간대를 따라요. 두 사람에게 같이 적용돼요. | Midnight and reminder times follow this time zone, for both of you. | 日付が変わる時刻と通知時刻はこのタイムゾーンに従います。ふたりに適用されます。 | 신규 · EN·JA 초안 |
| `set.start.title` | 사귄 날 고치기 | Change start date | 付き合った日を変更 | 신규 · EN·JA 초안 |
| `set.start.preview` | 바꾸면 오늘이 {n}일째가 돼요 | After the change, today will be Day {n} | 変更すると今日は{n}日目になります | 신규 · EN·JA 초안 |
| `set.start.confirm.title` | 사귄 날을 바꿀까요? | Change your start date? | 付き合った日を変更しますか？ | 신규 · EN·JA 초안 |
| `set.start.confirm.body` | {old} → {new}. {name}님 화면과 위젯, 날짜 기념일도 함께 바뀌어요. | {old} → {new}. {name}'s screen, widgets and milestone dates change too. | {old} → {new}。{name}さんの画面とウィジェット、記念日の日付も変わります。 | 신규 · EN·JA 초안 |
| `set.start.confirm.cta` | 바꾸기 | Change | 変更する | 신규 · EN·JA 초안 |
| `set.section.notify` | 알림 | Notifications | 通知 | 재사용 · 기존 키 set.sec.notif |
| `set.notify.toggle` | 기념일 알림 | Anniversary reminders | 記念日の通知 | 신규 · EN·JA 초안 |
| `set.notify.time` | 알림 시간 | Time | 通知時刻 | 신규 · EN·JA 초안 |
| `set.notify.time.value` | 오전 9:00 | 9:00 AM | 午前9:00 | 신규 · EN·JA 초안 |
| `set.notify.early` | 미리 알림 | Early reminder | 事前通知 | 신규 · EN·JA 초안 |
| `set.notify.early.none` | 없음 | None | なし | 신규 · EN·JA 초안 |
| `set.notify.early.1d` | 하루 전 | 1 day before | 1日前 | 신규 · EN·JA 초안 |
| `set.notify.early.3d` | 3일 전 | 3 days before | 3日前 | 신규 · EN·JA 초안 |
| `set.notify.early.7d` | 일주일 전 | 1 week before | 1週間前 | 신규 · EN·JA 초안 |
| `set.notify.kinds` | 알림 받을 기념일 | Remind me about | 通知する記念日 | 신규 · EN·JA 초안 |
| `set.notify.note` | 알림은 이 기기에서만 울려요. {name}님 알림은 {name}님이 정해요. 가까운 기념일부터 최대 50개를 이 기기에 미리 예약하고, {name}님이 기념일을 바꾸면 앱을 열 때 다시 맞춰요. | Reminders ring on this device only; {name} sets their own. Up to 50 upcoming days are scheduled on this device, and changes {name} makes are picked up when you open the app. | 通知はこの端末だけで鳴ります。{name}さんの通知は{name}さんが決めます。近い記念日から最大50件をこの端末に予約し、{name}さんが記念日を変えるとアプリを開いたときに合わせ直します。 | 신규 · EN·JA 초안 |
| `set.notify.denied.title` | 기기에서 알림이 꺼져 있어요 | Notifications are off on this device | 端末で通知がオフです | 재사용 · 기존 키 set.notif.sub.denied |
| `set.notify.denied.body` | 기기 설정에서 모피루 알림을 켜면 기념일에 받을 수 있어요. | Turn on Mopiru notifications in your device settings to get reminders. | 端末の設定でモピルの通知をオンにすると、記念日に受け取れます。 | 변경 · 기존 키 set.notif.denied.body (아룸 → 모피루) |
| `set.notify.denied.cta` | 기기 설정 열기 | Open device settings | 端末の設定を開く | 재사용 · 기존 키 set.notif.denied.action |
| `notify.body.milestone` | 오늘은 우리 {title}이에요 | Today is your {title} | 今日はふたりの{title}です | 신규 · EN·JA 초안 |
| `notify.body.season` | 오늘은 {title}예요 | Today is {title} | 今日は{title}です | 신규 · EN·JA 초안 |
| `notify.body.birthday` | 오늘은 {name}님 생일이에요 | Today is {name}'s birthday | 今日は{name}さんの誕生日です | 신규 · EN·JA 초안 |
| `notify.body.custom` | 오늘은 둘만의 기념일이 있어요 | You have a special day today | 今日はふたりだけの記念日があります | 신규 · EN·JA 초안 |
| `notify.body.early` | {title}까지 {n}일 남았어요 | {n} days until {title} | {title}まであと{n}日 | 신규 · EN·JA 초안 |
| `notify.body.early.custom` | 둘만의 기념일까지 {n}일 남았어요 | {n} days until your special day | ふたりの記念日まであと{n}日 | 신규 · EN·JA 초안 |
| `notify.title` | 모피루 | Mopiru | モピル | 신규 · EN·JA 초안 |
| `set.section.display` | 화면 | Display | 表示 | 신규 · EN·JA 초안 |
| `set.lang` | 언어 | Language | 言語 | 재사용 · 기존 키 set.lang |
| `set.lang.system` | 기기 설정 따르기 | Follow device | 端末の設定に従う | 재사용 · 기존 키 set.lang.system |
| `set.mode` | 화면 모드 | Appearance | 外観 | 재사용 · 기존 키 set.theme |
| `set.mode.system` | 시스템 설정 따르기 | Use system setting | システムの設定に従う | 신규 · EN·JA 초안 |
| `set.mode.light` | 밝게 | Light | ライト | 재사용 · 기존 키 set.theme.light |
| `set.mode.dark` | 어둡게 | Dark | ダーク | 재사용 · 기존 키 set.theme.dark |
| `set.display.note` | 이 기기에만 적용돼요. | Applies to this device only. | この端末だけに適用されます。 | 신규 · EN·JA 초안 |
| `set.section.help` | 도움 | Help | ヘルプ | 신규 · EN·JA 초안 |
| `set.help.contact` | 문의하기 | Contact us | お問い合わせ | 신규 · EN·JA 초안 |
| `set.help.privacy` | 개인정보 처리방침 | Privacy Policy | プライバシーポリシー | 재사용 · 기존 키 set.privacy |
| `set.help.terms` | 이용약관 | Terms of Use | 利用規約 | 재사용 · 기존 키 set.terms |
| `set.help.version` | 버전 | Version | バージョン | 신규 · EN·JA 초안 |
| `set.section.account` | 계정 | Account | アカウント | 재사용 · 기존 키 set.sec.account |
| `set.account.apple` | Apple로 로그인함 | Signed in with Apple | Appleでサインイン中 | 신규 · EN·JA 초안 |
| `set.account.logout` | 로그아웃 | Sign out | ログアウト | 재사용 · 기존 키 set.logout |
| `set.account.disconnect` | 연결 끊기 | Disconnect | つながりを解除 | 신규 · EN·JA 초안 |
| `set.account.delete` | 계정 삭제 | Delete account | アカウントを削除 | 재사용 · 기존 키 set.account.delete |
| `set.disconnect.title` | 연결을 끊을까요? | Disconnect? | つながりを解除しますか？ | 신규 · EN·JA 초안 |
| `set.disconnect.i1` | 두 사람의 공간이 끝나요. {name}님도 더 이상 볼 수 없어요. | Your shared space ends. {name} can't see it anymore either. | ふたりのスペースが終了します。{name}さんも見られなくなります。 | 신규 · EN·JA 초안 |
| `set.disconnect.i2` | 사귄 날, 직접 추가한 기념일, 서로의 생일 공유가 지워져요. | Your start date, custom anniversaries and shared birthdays are deleted. | 付き合った日、追加した記念日、誕生日の共有が削除されます。 | 신규 · EN·JA 초안 |
| `set.disconnect.i3` | 되돌릴 수 없어요. 다시 쓰려면 새로 연결해야 해요. | This can't be undone. To use it again, you'll need to connect anew. | 元に戻せません。また使うには新しくつながる必要があります。 | 신규 · EN·JA 초안 |
| `set.disconnect.i4` | 위젯과 이 기기의 알림도 함께 지워져요. | Widgets and reminders on this device are cleared too. | ウィジェットとこの端末の通知も消えます。 | 신규 · EN·JA 초안 |
| `set.confirm.check` | 내용을 확인했어요 | I understand | 内容を確認しました | 재사용 · 기존 키 end.check |
| `set.delete.title` | 계정을 삭제할까요? | Delete your account? | アカウントを削除しますか？ | 재사용 · 기존 키 acct.delete.title |
| `set.delete.body` | 삭제하면 바로 로그아웃되고, 되돌릴 수 없어요. | You'll be signed out right away, and this can't be undone. | すぐにログアウトされ、元に戻せません。 | 재사용 · 기존 키 acct.delete.lead |
| `set.delete.i1` | 내 계정과 프로필 정보가 삭제돼요 | Your account and profile information are deleted | アカウントとプロフィール情報が削除されます | 재사용 · 기존 키 acct.delete.b1 |
| `set.delete.i2` | 함께 쓰는 공간이 있다면 종료돼요. 두 사람 모두 들어갈 수 없고 날짜·기념일이 삭제돼요 | If you share a space, it ends. Neither of you can open it, and your dates and anniversaries are deleted | 共有のスペースがあれば終了します。ふたりとも入れなくなり、日付と記念日が削除されます | 변경 · 기존 키 acct.delete.b2 (방·사진·장식 → 날짜·기념일) |
| `set.delete.i3` | 같은 계정으로 다시 가입해도 이전 내용은 돌아오지 않아요 | Signing up again with the same login won't bring anything back | 同じアカウントで登録し直しても、以前の内容は戻りません | 재사용 · 기존 키 acct.delete.b3 |
| `set.delete.cta` | 계정 삭제하기 | Delete account | アカウントを削除する | 재사용 · 기존 키 acct.delete.confirm |
| `set.delete.reauth` | {provider}로 다시 로그인해 확인 | Sign in again with {provider} to confirm | {provider}で再ログインして確認 | 재사용 · 기존 키 acct.delete.reauth.forgot.oauth |
| `set.delete.apple.note` | Apple로 가입한 계정은 삭제할 때 Apple 연결도 함께 해제돼요. | For accounts created with Apple, the Apple connection is also removed when you delete. | Appleで作成したアカウントは、削除するとAppleとの連携も解除されます。 | 재사용 · 기존 키 acct.delete.reauth.apple |

