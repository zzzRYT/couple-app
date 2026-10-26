> **V1 이후 · 기록 포함 버전 (1차에서는 쓰지 않아요)**
> 이 폴더는 1차(V1)에 쓰지 않는 설계예요. V1 문서의 화면 수·키 수·매니페스트 수에 들어가지 않아요.

# copy-keys.md (V1 이후 · 기록 포함 버전)

기록을 넣을 때 번역 리소스에 **다시 추가할 키**예요(한국어 · English · 日本語). V1의 `i18n-copy.md`(541키)에는 들어 있지 않아요. 영어·일본어 문구는 원어민 검수 전이에요.

## 추가할 키 (35개)

| 키 | 한국어 | English | 日本語 |
|---|---|---|---|
| `room.ctl.history` | 기록 | History | 履歴 |
| `history.title` | 방 기록 | Room history | 部屋の履歴 |
| `history.version` | 버전 {n} | Version {n} | バージョン{n} |
| `history.current` | 지금 방 | Current | 現在 |
| `history.by` | {name} · {time} | {name} · {time} | {name} · {time} |
| `history.time.1` | 오늘 오후 9:14 | Today, 9:14 PM | 今日 21:14 |
| `history.time.2` | 오늘 오후 6:40 | Today, 6:40 PM | 今日 18:40 |
| `history.time.3` | 어제 오후 11:05 | Yesterday, 11:05 PM | 昨日 23:05 |
| `history.time.4` | 10월 20일 | Oct 20 | 10月20日 |
| `history.sum.added` | 소품 추가 | Items added | 小物を追加 |
| `history.sum.moved` | 소품 이동·제거 | Items moved or removed | 小物を移動・削除 |
| `history.sum.text` | 문구 변경 | Text changed | 文言を変更 |
| `history.sum.dday` | 날짜 위젯 모양 변경 | Day counter restyled | 日数ウィジェットの見た目を変更 |
| `history.sum.mascot` | 마스코트 변경 | Mascot changed | マスコットを変更 |
| `history.sum.restore` | 이전 버전에서 복구 | Restored from an earlier version | 以前のバージョンから復元 |
| `history.privacy` | 프롬프트 내용은 기록 목록에 보이지 않아요. | Prompt text isn't shown in this list. | プロンプトの内容は履歴の一覧には表示されません。 |
| `history.view` | 이 버전 보기 | View this version | このバージョンを見る |
| `history.restore` | 이 버전으로 복구 | Restore this version | このバージョンに復元 |
| `history.restore.title` | 버전 {n}으로 복구할까요? | Restore version {n}? | バージョン{n}に復元しますか？ |
| `history.restore.body` | 지금 방이 이 버전의 모습으로 바뀌고, 상대 화면에도 반영돼요. 지금 방은 기록에 남아 있어서 다시 돌아올 수 있어요. | The room changes to how it looked in this version, and your partner's screen follows. The current room stays in History, so you can come back. | 今の部屋がこのバージョンの状態に変わり、パートナーの画面にも反映されます。今の部屋は履歴に残るので、元に戻せます。 |
| `history.restore.progress` | 복구하는 중이에요 | Restoring | 復元しています |
| `history.restore.done` | 버전 {n}으로 복구했어요 | Restored version {n} | バージョン{n}に復元しました |
| `history.restore.busy` | {name}님이 꾸미는 중이라 지금은 복구할 수 없어요 | {name} is decorating, so you can't restore right now | {name}さんが飾っているため、今は復元できません |
| `history.restore.err` | 복구하지 못했어요. 방은 그대로예요. | Couldn't restore it. The room is unchanged. | 復元できませんでした。部屋はそのままです。 |
| `history.empty.title` | 아직 기록이 없어요 | No history yet | まだ履歴がありません |
| `history.empty.body` | 방을 꾸미고 적용하면 여기에 쌓여요. | Versions appear here after you decorate and apply. | 部屋を飾って反映すると、ここに記録されます。 |
| `history.old.title` | 이 버전은 지금 앱에서 열 수 없어요 | This version can't be opened in this app | このバージョンは今のアプリでは開けません |
| `history.old.body` | 앱을 최신 버전으로 업데이트하면 볼 수 있어요. | Update the app to the latest version to view it. | アプリを最新バージョンに更新すると表示できます。 |
| `history.loading` | 기록을 불러오는 중이에요 | Loading history | 履歴を読み込んでいます |
| `history.preview.note` | 미리 보기 · 방은 아직 바뀌지 않았어요 | Preview · the room hasn't changed | プレビュー · 部屋はまだ変わっていません |
| `history.empty.action` | 방 꾸미러 가기 | Go decorate the room | 部屋を飾りに行く |
| `history.first.tip` | 방을 적용할 때마다 기록이 쌓여요 | A version is saved each time you apply | 反映するたびに履歴が貯まります |
| `history.offline` | 오프라인 · 마지막으로 받은 기록만 보여요 | Offline · showing the history last loaded | オフライン · 最後に読み込んだ履歴のみ表示 |
| `a11y.history` | 방 기록 열기 | Open room history | 部屋の履歴を開く |
| `tab.history` | 기록 | History | 履歴 |

## 기록을 넣을 때 다시 쓸 문구 (제안)

V1에서는 기록으로 이어지던 문장을 기록 없는 문구로 바꿨고, 되돌리기는 열린 대화 안으로 한정했어요(`design/i18n-copy.md`). 기록을 채택하면 아래처럼 다시 연결할 수 있어요. 아래 "기록 채택 시"는 제안이고 번역 검수 전이에요.

| 키 | V1 현재(ko) | 기록 채택 시(ko) |
|---|---|---|
| `undo.none.body` | 이 대화에서 만든 변경이 아직 없어요. 이미 적용한 방은 되돌릴 수 없어요. | 이 대화에서 만든 변경이 아직 없어요. 이미 적용한 방은 기록에서 복구할 수 있어요. |
| `preview.applyHint` | 적용하면 두 사람의 방이 바뀌고, 적용한 뒤에는 되돌릴 수 없어요. | 적용하면 두 사람의 방이 바뀌어요. 적용한 뒤에는 기록에서 이전 버전으로 복구할 수 있어요. |
| `preview.confirm.body` | 두 사람의 방이 바뀌어요. 적용한 뒤에는 되돌릴 수 없어요. 적용하기 전에 미리 보기를 한 번 더 확인해 주세요. | 두 사람의 방이 바뀌어요. 적용한 뒤에는 기록에서 이전 버전을 골라 복구할 수 있어요. |
| `preview.applied.body` | 적용한 변경은 되돌릴 수 없어요. 상대 화면에는 동기화되면 바로 바뀌어요. | 상대 화면에는 동기화되면 바로 바뀌어요. 이전 모습은 기록에 남아 있어요. |
| `undo.body` | 이 대화에서 방금 만든 변경을 취소하고 바로 앞 미리 보기로 돌아가요. 방은 아직 바뀌지 않았어요. 적용한 방은 되돌릴 수 없어요. | 이 대화에서 방금 만든 변경을 취소하고 바로 앞 미리 보기로 돌아가요. 방은 아직 바뀌지 않았어요. 적용한 방은 기록에서 복구할 수 있어요. |
| `room.recover.body` / `room.recover.action` | 저장된 방은 그대로 있어요. 다시 불러와 주세요. / 다시 불러오기 | 저장된 이전 버전으로 방을 복구할 수 있어요. / 이전 버전 보기 (기록 탭으로 이동) |
| `sys.empty.title` / `sys.empty.body` | 아직 보여 드릴 게 없어요 / 내용이 생기면 여기에 나타나요. | 옛 `sys.empty.hist`(아직 보여 드릴 게 없어요) 1개로 되돌릴 수도 있어요 |

