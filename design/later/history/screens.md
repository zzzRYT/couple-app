> **V1 이후 · 기록 포함 버전 (1차에서는 쓰지 않아요)**
> 이 폴더는 1차(V1)에 쓰지 않는 설계예요. V1 문서의 화면 수·키 수·매니페스트 수에 들어가지 않아요.

# screens.md (V1 이후 · 기록 포함 버전)

캔버스 `L-` 보드에 그린 화면의 목적·이동·상태·사용하는 키예요. 상태 ID는 캔버스 프레임 캡션과 같고 V1과 겹치지 않게 앞에 `L-`을 붙였어요. 키는 [`copy-keys.md`](copy-keys.md)에 있어요.

| 캔버스 보드 | 내용 |
|---|---|
| `L-S11-history` | 기록 화면(목록 · 상세 · 복구 확인 · 성공 · 빈 기록 · 읽을 수 없는 버전 · 상대 점유 중 복구 불가) |
| `L-S25-tab-history` | 기록 탭 상태(첫 실행 · 보통 · 로딩 · 오프라인 · 오류 · 상대가 꾸미는 중) |
| `L-S24-room-with-history` | 방 탭 — 도구 막대에 기록 바로가기가 있고 하단 탭 바가 4개인 버전 |
| `L-S27-navigation-4tabs` | 4탭 구조와 이동 규칙 |

V1의 S24(방 탭)·S27(탭 구조)과 달리 이 보드의 모든 방·탭 프레임은 **4탭 바(홈·방·기록·설정)**이고, 방 도구 막대는 **되돌리기 · 꾸미기 · 기록 3개**(글자 ≥160%에서는 꾸미기 한 줄 + 되돌리기·기록 한 줄)예요.

## L-S11 기록 탭 — 버전 기록 / 복구

- **캔버스 보드**: `L-S11-history, S25-tab-history`
- **목적**: 버전 목록(시각·변경자·변경 요약, 프롬프트 전문은 숨김), 버전 선택 미리 보기, 복구 확인·성공, 빈 기록, 읽을 수 없는 이전 버전, 상대 점유 중 복구 불가.
- **이동**: 탭 루트(기록). 버전 → 상세(푸시, 탭 바 숨김) → 복구 확인(다이얼로그) → 기록 루트. 빈 기록의 "방 꾸미러 가기" → 방 탭.
- 복구는 새 버전으로 쌓여서 현재 방도 기록에 남아요(되돌릴 수 있음).
- 복구도 방을 바꾸는 일이라 점유가 필요하다고 가정했어요(열린 질문).
- 섬네일은 방의 현재 낮/밤 모습으로 그려요.
- **긴 문구·언어 사례**: 변경 요약 태그가 길어지면 다음 줄로 넘어가요.

| 상태 ID | 설명 | 사용하는 키 | 그린 조합 |
|---|---|---|---|
| `L-S11-loading` | 목록 로딩 | `history.loading` `history.title` `a11y.tabbar` `tab.home` `a11y.tab` `tab.room` `tab.history` `a11y.tab.sel` `tab.settings` | iOS·낮·밝게·ko, Android·밤·어둡게·ko |
| `L-S11-list` | 버전 목록 · 시각 · 변경자 · 요약 | `sample.me` `history.time.1` `history.sum.added` `sample.partner` `history.time.2` `history.sum.moved` `history.sum.text` `history.time.3` `history.sum.mascot` `history.time.4` `history.sum.restore` `a11y.version` `a11y.pose.wave_main` `a11y.mascot` `history.version` `history.current` `history.by` `a11y.pose.lookup` `history.privacy` `history.title` `a11y.tabbar` `tab.home` `a11y.tab` `tab.room` `tab.history` `a11y.tab.sel` `tab.settings` | iOS·낮·밝게·ko, Android·밤·어둡게·ko, iOS·낮·밝게·en, Android·밤·어둡게·ja 외 4 |
| `L-S11-select` | 버전 선택 · 미리 보기 + 복구 | `a11y.pose.wave_main` `a11y.mascot` `a11y.pose.walk` `a11y.pose.cheer` `a11y.pose.lookup` `a11y.pose.lie` `a11y.pose.sleep` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `history.preview.note` `history.version` `sample.partner` `history.time.2` `history.by` `history.restore` | iOS·낮·밝게·ko, Android·밤·어둡게·ko |
| `L-S11-confirm` | 복구 확인 | `a11y.pose.wave_main` `a11y.mascot` `a11y.pose.walk` `a11y.pose.cheer` `a11y.pose.lookup` `a11y.pose.lie` `a11y.pose.sleep` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `history.preview.note` `history.version` `sample.partner` `history.time.2` `history.by` `history.restore` `history.restore.title` `history.restore.body` `common.cancel` | iOS·낮·밝게·ko, Android·밤·어둡게·ko, iOS·낮·밝게·en, Android·밤·어둡게·ja |
| `L-S11-progress` | 복구 중 | `a11y.pose.wave_main` `a11y.mascot` `a11y.pose.walk` `a11y.pose.cheer` `a11y.pose.lookup` `a11y.pose.lie` `a11y.pose.sleep` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `history.preview.note` `history.version` `sample.partner` `history.time.2` `history.by` `history.restore` `history.restore.progress` | iOS·낮·밝게·ko, Android·밤·어둡게·ko |
| `L-S11-done` | 복구 성공 (새 버전으로 기록) | `sample.me` `history.time.1` `history.sum.added` `sample.partner` `history.time.2` `history.sum.moved` `history.sum.text` `history.time.3` `history.sum.mascot` `history.time.4` `history.sum.restore` `a11y.version` `a11y.pose.wave_main` `a11y.mascot` `history.version` `history.current` `history.by` `a11y.pose.lookup` `history.title` `a11y.tabbar` `tab.home` `a11y.tab` `tab.room` `tab.history` `a11y.tab.sel` `tab.settings` `history.restore.done` | iOS·낮·밝게·ko, Android·밤·어둡게·ko |
| `L-S11-busy` | 상대 점유 중 · 복구 불가 | `sample.partner` `history.restore.busy` `a11y.pose.wave_main` `a11y.mascot` `a11y.pose.walk` `a11y.pose.cheer` `a11y.pose.lookup` `a11y.pose.lie` `a11y.pose.sleep` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `history.preview.note` `history.version` `history.time.2` `history.by` `history.restore` | iOS·낮·밝게·ko, Android·밤·어둡게·ko |
| `L-S11-err` | 복구 실패 | `history.restore.err` `common.retry` `a11y.pose.wave_main` `a11y.mascot` `a11y.pose.walk` `a11y.pose.cheer` `a11y.pose.lookup` `a11y.pose.lie` `a11y.pose.sleep` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `history.preview.note` `history.version` `sample.partner` `history.time.2` `history.by` `history.restore` | iOS·낮·밝게·ko, Android·밤·어둡게·ko |
| `L-S11-empty` | 빈 기록 | `history.empty.title` `history.empty.body` `history.title` `a11y.tabbar` `tab.home` `a11y.tab` `tab.room` `tab.history` `a11y.tab.sel` `tab.settings` | iOS·낮·밝게·ko, Android·밤·어둡게·ko |
| `L-S11-old` | 이전 데이터 호환 오류 (읽을 수 없는 버전) | `sample.me` `history.time.1` `history.sum.added` `a11y.version` `a11y.pose.wave_main` `a11y.mascot` `history.version` `history.current` `history.by` `sample.partner` `history.time.4` `history.old.title` `history.old.body` `sys.old.action` `history.title` `a11y.tabbar` `tab.home` `a11y.tab` `tab.room` `tab.history` `a11y.tab.sel` `tab.settings` | iOS·낮·밝게·ko, Android·밤·어둡게·ko, iOS·낮·밝게·en, Android·밤·어둡게·ja |


## L-S24 방 탭 (기록 바로가기 포함)

| 상태 ID | 설명 | 사용하는 키 |
|---|---|---|
| `L-S24-first` | 방 · 첫 실행(마스코트만) + 꾸미기 안내 | `coach.room` `coach.ok` `a11y.pose.wave_main` `a11y.mascot` `a11y.pose.walk` `a11y.pose.cheer` `a11y.pose.lookup` `a11y.pose.lie` `a11y.pose.sleep` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `room.ctl.undo` `room.ctl.decorate` `room.ctl.history` `a11y.tabbar` `tab.home` `a11y.tab` `tab.room` `a11y.tab.sel` `tab.history` `tab.settings` |
| `L-S24-empty` | 방 · 비어 있음(새 방 그대로) | `a11y.pose.wave_main` `a11y.mascot` `a11y.pose.walk` `a11y.pose.cheer` `a11y.pose.lookup` `a11y.pose.lie` `a11y.pose.sleep` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `room.ctl.undo` `room.ctl.decorate` `room.ctl.history` `a11y.tabbar` `tab.home` `a11y.tab` `tab.room` `a11y.tab.sel` `tab.history` `tab.settings` |
| `L-S24-normal` | 방 · 보통(꾸민 방) | `a11y.pose.wave_main` `a11y.mascot` `a11y.pose.walk` `a11y.pose.cheer` `a11y.pose.lookup` `a11y.pose.lie` `a11y.pose.sleep` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `room.ctl.undo` `room.ctl.decorate` `room.ctl.history` `a11y.tabbar` `tab.home` `a11y.tab` `tab.room` `a11y.tab.sel` `tab.history` `tab.settings` |
| `L-S24-partner` | 방 · 상대가 꾸미는 중(실시간 읽기 전용 · 되돌리기 잠김) | `sample.partner` `room.partnerLive` `a11y.pose.wave_main` `a11y.mascot` `a11y.pose.walk` `a11y.pose.cheer` `a11y.pose.lookup` `a11y.pose.lie` `a11y.pose.sleep` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `room.ctl.undo` `room.watch` `room.ctl.history` `a11y.tabbar` `tab.home` `a11y.tab` `tab.room` `a11y.tab.sel` `tab.history` `tab.settings` |
| `L-S24-loading` | 방 · 로딩 | `room.loading` `room.ctl.undo` `room.ctl.decorate` `room.ctl.history` `a11y.tabbar` `tab.home` `a11y.tab` `tab.room` `a11y.tab.sel` `tab.history` `tab.settings` |
| `L-S24-offline` | 방 · 오프라인 읽기 전용 | `room.offline` `a11y.pose.wave_main` `a11y.mascot` `a11y.pose.walk` `a11y.pose.cheer` `a11y.pose.lookup` `a11y.pose.lie` `a11y.pose.sleep` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `room.ctl.undo` `room.ctl.decorate` `room.ctl.history` `a11y.tabbar` `tab.home` `a11y.tab` `tab.room` `a11y.tab.sel` `tab.history` `tab.settings` |
| `L-S24-error` | 방 · 동기화 실패 / 장면 복구 오류 | `room.syncFail.title` `room.syncFail.body` `common.retry` `a11y.pose.wave_main` `a11y.mascot` `a11y.pose.walk` `a11y.pose.cheer` `a11y.pose.lookup` `a11y.pose.lie` `a11y.pose.sleep` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `room.ctl.undo` `room.ctl.decorate` `room.ctl.history` `a11y.tabbar` `tab.home` `a11y.tab` `tab.room` `a11y.tab.sel` `tab.history` `tab.settings` |
| `L-S24-push-history` | 방 → 기록 바로가기(기록 탭으로 전환) | `sample.me` `history.time.1` `history.sum.added` `sample.partner` `history.time.2` `history.sum.moved` `history.sum.text` `history.time.3` `history.sum.mascot` `history.time.4` `history.sum.restore` `a11y.version` `a11y.pose.wave_main` `a11y.mascot` `history.version` `history.current` `history.by` `a11y.pose.lookup` `history.privacy` `history.title` `a11y.tabbar` `tab.home` `a11y.tab` `tab.room` `tab.history` `a11y.tab.sel` `tab.settings` |
| `L-S24-modal-decorate` | 방 → 꾸미기(모달 시트 · 탭 바를 덮음) | `prompt.msg.me` `prompt.msg.time` `prompt.msg.result` `prompt.placeholder` `a11y.input` `a11y.send` `prompt.left` `prompt.idleHint` `a11y.pose.wave_main` `a11y.mascot` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `prompt.title` `prompt.mine` `a11y.presence` `prompt.tab.prompt` `prompt.tab.mascot` |


## L-S25 기록 탭

| 상태 ID | 설명 | 사용하는 키 |
|---|---|---|
| `L-S25-first` | 기록 · 첫 실행(아직 기록 없음) + 방 꾸미러 가기 | `history.empty.title` `history.empty.body` `history.empty.action` `history.title` `a11y.tabbar` `tab.home` `a11y.tab` `tab.room` `tab.history` `a11y.tab.sel` `tab.settings` |
| `L-S25-normal` | 기록 · 보통(버전 목록) | `sample.me` `history.time.1` `history.sum.added` `sample.partner` `history.time.2` `history.sum.moved` `history.sum.text` `history.time.3` `history.sum.mascot` `history.time.4` `history.sum.restore` `a11y.version` `a11y.pose.wave_main` `a11y.mascot` `history.version` `history.current` `history.by` `a11y.pose.lookup` `history.privacy` `history.title` `a11y.tabbar` `tab.home` `a11y.tab` `tab.room` `tab.history` `a11y.tab.sel` `tab.settings` |
| `L-S25-loading` | 기록 · 로딩 | `history.loading` `history.title` `a11y.tabbar` `tab.home` `a11y.tab` `tab.room` `tab.history` `a11y.tab.sel` `tab.settings` |
| `L-S25-offline` | 기록 · 오프라인(마지막으로 받은 목록) | `main.offline.title` `history.offline` `sample.me` `history.time.1` `history.sum.added` `sample.partner` `history.time.2` `history.sum.moved` `history.sum.text` `history.time.3` `history.sum.mascot` `history.time.4` `history.sum.restore` `a11y.version` `a11y.pose.wave_main` `a11y.mascot` `history.version` `history.current` `history.by` `a11y.pose.lookup` `history.title` `a11y.tabbar` `tab.home` `a11y.tab` `tab.room` `tab.history` `a11y.tab.sel` `tab.settings` |
| `L-S25-error` | 기록 · 불러오기 오류 / 읽을 수 없는 버전 | `sample.me` `history.time.1` `history.sum.added` `a11y.version` `a11y.pose.wave_main` `a11y.mascot` `history.version` `history.current` `history.by` `sample.partner` `history.time.4` `history.old.title` `history.old.body` `sys.old.action` `history.title` `a11y.tabbar` `tab.home` `a11y.tab` `tab.room` `tab.history` `a11y.tab.sel` `tab.settings` |
| `L-S25-busy` | 기록 · 상대가 꾸미는 중(복구는 잠김) | `sample.partner` `history.restore.busy` `sample.me` `history.time.1` `history.sum.added` `history.time.2` `history.sum.moved` `history.sum.text` `history.time.3` `history.sum.mascot` `history.time.4` `history.sum.restore` `a11y.version` `a11y.pose.wave_main` `a11y.mascot` `history.version` `history.current` `history.by` `a11y.pose.lookup` `history.title` `a11y.tabbar` `tab.home` `a11y.tab` `tab.room` `tab.history` `a11y.tab.sel` `tab.settings` |
| `L-S25-push-detail` | 기록 → 버전 상세(푸시 · 탭 바 숨김) | `a11y.pose.wave_main` `a11y.mascot` `a11y.pose.walk` `a11y.pose.cheer` `a11y.pose.lookup` `a11y.pose.lie` `a11y.pose.sleep` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `history.preview.note` `history.version` `sample.partner` `history.time.2` `history.by` `history.restore` |
| `L-S25-dialog-restore` | 기록 → 복구 확인 | `a11y.pose.wave_main` `a11y.mascot` `a11y.pose.walk` `a11y.pose.cheer` `a11y.pose.lookup` `a11y.pose.lie` `a11y.pose.sleep` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `history.preview.note` `history.version` `sample.partner` `history.time.2` `history.by` `history.restore` `history.restore.title` `history.restore.body` `common.cancel` |


