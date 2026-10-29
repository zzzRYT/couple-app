# Account deletion web page (T157, FR-074)

The page Google Play asks for next to the in-app path, and the one to enter in the Data safety form. It lives in this repository at `site/delete-account/` (Korean), `site/en/delete-account/` and `site/ja/delete-account/`, and is served at `https://aroom.jinjinstar.com/delete-account` once the owner connects the domain (see `site/README.md`). The domain, the public support email (G10) and the legal wording (G1, G18) are still open; the page marks them as placeholders.

Policy behind the text: `specs/001-couple-prompt-todo/spec.md` Decided 41-51 (owner accepted the recommendations on 2026-10-29). Account deletion hard-deletes the person's spaces at once (no 30-day wait on this path only), keeps no profile shell, offers no export, and keeps only content-free report fingerprints. Ending a space or disconnecting still keeps data internally for 30 days.

## Page content

Each language has the same four parts. Keep them in sync with the HTML.

### 한국어

- **앱에서 삭제하기**: 설정 화면 아래쪽 "공간" 묶음의 "계정 삭제" → 안내를 읽고 "내용을 확인했어요"를 켠 뒤 같은 로그인 방식으로 다시 로그인 → 계정 삭제하기. 인터넷 연결이 필요하며, 연결이 없으면 요청을 보내거나 나중에 보내려고 쌓아 두지 않습니다.
- **바로 삭제되는 것**: 로그인 정보(인증 계정), 프로필 정보, AI 처리 동의 기록, 대기 중인 초대 코드. 함께 쓰던 공간은 종료되고 방·D-day·홈 사진·장식·프롬프트 기록이 보관 기간 없이 바로 완전히 삭제됩니다. 모든 기기에서 로그아웃됩니다. Apple로 로그인했다면 앱과의 연결(토큰)도 해제합니다.
- **남는 것**: 상대에게 "상대가 계정을 삭제했어요"라는 안내 한 번(이름 없음). 개인정보가 없는 기록(공간 종료·삭제 시각, 신고의 종류·사유·시각만 담은 지문). 이 기록의 보관 기간은 법률 검토 중입니다. 데이터 내보내기와 복구는 제공하지 않습니다.
- **앱을 쓸 수 없을 때**: 공개 지원 이메일(준비 중)로 요청하면 운영자가 가입에 쓴 이메일로 회신해 본인을 확인한 뒤 같은 방식으로 삭제합니다(법률·운영 검토 전 가정).

### English

- **Delete in the app**: Settings, "Delete account" in the "Space" group near the bottom → read the consequences, turn on "I understand", sign in again with the same method → Delete account. An internet connection is required; without one nothing is sent or queued for later.
- **Deleted right away**: your login (auth account), profile information, AI processing consent records and pending invite codes. A shared space ends, and its room, D-day, home photo, decorations and prompt history are permanently deleted at once, with no retention period. You are signed out on every device. If you signed in with Apple, the app's connection (tokens) is revoked.
- **What remains**: a one-time notice for your partner, "Your partner deleted their account", without your name; records without personal information (when a space ended or was deleted, and report fingerprints with only the type, reason and time). Their retention period is under legal review. There is no export and no restore.
- **Cannot use the app**: write to the public support email (coming soon). An operator replies to the email you signed up with to confirm it is you, then deletes the account the same way (an assumption pending legal and operational review).

### 日本語

- **アプリで削除する**: 設定画面の下の「スペース」にある「アカウントを削除」 → 内容を読んで「内容を確認しました」をオン → 同じ方法でもう一度ログイン → アカウントを削除する。インターネット接続が必要で、接続がないときは送信も後で送るための保存もしません。
- **すぐに削除されるもの**: ログイン情報（認証アカウント）、プロフィール情報、AI 処理の同意記録、未使用の招待コード。共有スペースは終了し、部屋・D-day・ホーム写真・飾り・プロンプト記録は保存期間なしですぐに完全に削除されます。すべての端末でログアウトします。Apple でログインした場合はアプリとの連携（トークン）も解除します。
- **残るもの**: 相手への「相手がアカウントを削除しました」という一度だけの案内（名前なし）。個人情報を含まない記録（スペースの終了・削除の時刻、報告の種類・理由・時刻だけの指紋）。保存期間は法的確認中です。データのエクスポートと復元はありません。
- **アプリを使えない場合**: 公開サポートメール（準備中）に依頼すると、運営者が登録に使ったメールに返信して本人確認をしたうえで同じ方法で削除します（法務・運用確認待ちの仮定）。

## Out-of-app request procedure

The operator steps are in `docs/operator-review-runbook.md` ("Account deletion requests from outside the app").
