# S08 공유 프롬프트 대화 / 입력

승인자: 미승인
승인일: 미정

## 목적, ID, 경로

ID: S08
Route: /prompt

## 디자인 원본

- [S08-prompt-session.dc.html](../../../canvas/project/S08-prompt-session.dc.html)

## 이미지

- [S08-gen-refused__ios-day-light-ko.png](../../../exports/S08-gen-refused__ios-day-light-ko.png)
- [S08-library__ios-day-light-ko.png](../../../exports/S08-library__ios-day-light-ko.png)
- [S08-quota__ios-day-light-ko.png](../../../exports/S08-quota__ios-day-light-ko.png)
- [S08-mine__ios-day-light-ko.png](../../../exports/S08-mine__ios-day-light-ko.png)
- [S08-free__ios-day-light-ko.png](../../../exports/S08-free__ios-day-light-ko.png)
- [S08-partner-typing__ios-day-light-ko.png](../../../exports/S08-partner-typing__ios-day-light-ko.png)
- [S08-nudge__ios-day-light-ko.png](../../../exports/S08-nudge__ios-day-light-ko.png)
- [S08-handover__ios-day-light-ko.png](../../../exports/S08-handover__ios-day-light-ko.png)
- [S08-takeover__ios-day-light-ko.png](../../../exports/S08-takeover__ios-day-light-ko.png)
- [S08-quota-last__ios-day-light-ko.png](../../../exports/S08-quota-last__ios-day-light-ko.png)

## 상태와 상호작용

> **2026-11-10 · 꾸미기 독으로 바뀌었어요.** 아래 설명과 상태 표의 일부는 2026-10 설계(꾸미기 시트 · 적용 확인 화면) 기준으로 남아 있어요. 지금 흐름은 방 아래 작은 독 + 방 위 미리 보기이고, 오너가 2026-11-10에 정한 규칙은 ① 적용 직후 방 위 ‘적용했어요 · 되돌리기’ 한 줄(한 단계 · 다시 적용 없음 · 다음 요청, 방 탭을 떠날 때, 3분 유휴에 끝남) ② 차례 부탁하기 · 넘겨주기 ③ 독의 ‘오늘 n번 남음’이에요. 현재 상태 목록은 캔버스 보드를, 규칙은 [interaction notes](../../../interaction-notes.md) §4–§6 · §9 · §14와 [spec](../../../../specs/001-couple-prompt-todo/spec.md)의 FR-011 · FR-013 · FR-028 · FR-030 · FR-031을 따르세요. 위 이미지는 현재 보드에서 다시 뽑았어요.

- **캔버스 보드**: `S08-prompt-session`
- **목적**: 공유 대화와 미리 보기, 점유 상태 6가지(비어 있음 / 내가 점유 / 상대가 점유(쓰는 중·만드는 중) / 내 점유 만료 임박 / 내 점유 만료 / 상대 만료 후 이어받기), 이어받기 경합, 동의 필요, 하루 3회 소진, 오프라인, 미지원 요청, 브랜드 요청 거절, 실패·재시도, 키보드.
- **이동**: 방 탭의 꾸미기 → 모달 시트. 비어 있을 때 "내가 꾸밀게요"로 점유. 닫기 → 방.
- 점유는 자동이 아니라 "내가 꾸밀게요"로 시작해요(상대가 의도치 않게 막히는 것 방지). 3분(가정) 입력이 없으면 풀리고 쓰던 글은 남아요.
- 상대는 대화·미리 보기를 실시간 읽기 전용으로 봐요. 입력칸은 잠금 아이콘과 이유를 보여요.
- AI 배지는 두지 않았어요(스펙). 결과 카드는 "제안"으로 말해요.
- 탭 바는 모달 시트가 덮어요.
- **긴 문구·언어 사례**: 점유 표시 칩은 두 줄 헤더(제목 + 칩)로 둬서 영어·일본어 이름이 길어도 줄바꿈되지 않아요.

| 상태 ID | 설명 | 사용하는 키 | 그린 조합 |
|---|---|---|---|
| `S08-free` | 비어 있음 (아무도 점유 안 함) · 내가 꾸밀게요 | `prompt.msg.status.released` `prompt.msg.me` `prompt.msg.time` `prompt.msg.result` `prompt.start` `prompt.start.help` `a11y.pose.wave_main` `a11y.mascot` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `prompt.title` `prompt.free` `a11y.presence` | iOS·낮·밝게·ko, Android·밤·어둡게·ko, iOS·낮·밝게·ko·200%, Android·밤·어둡게·ja·200% |
| `S08-empty` | 비어 있음 · 대화 없음(처음) | `prompt.history.empty` `prompt.start` `prompt.start.help` `a11y.pose.wave_main` `a11y.mascot` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `prompt.title` `prompt.free` `a11y.presence` | iOS·낮·밝게·ko, Android·밤·어둡게·ko |
| `S08-mine` | 내가 점유 · 입력 가능 | `prompt.msg.me` `prompt.msg.time` `prompt.msg.result` `prompt.placeholder` `a11y.input` `a11y.send` `prompt.left` `prompt.idleHint` `a11y.pose.wave_main` `a11y.mascot` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `prompt.title` `prompt.mine` `a11y.presence` | iOS·낮·밝게·ko, Android·밤·어둡게·ko, iOS·낮·밝게·en, Android·밤·어둡게·ja 외 3 |
| `S08-kbd` | 내가 점유 · 키보드 입력 중 (탭 바·도구 막대를 가리지 않는 모달) | `prompt.msg.result` `prompt.msg.me` `prompt.placeholder` `a11y.input` `a11y.send` `prompt.left` `prompt.idleHint` `a11y.pose.wave_main` `a11y.mascot` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `prompt.title` `prompt.mine` `a11y.presence` `prompt.kbd` | iOS·낮·밝게·ko, Android·밤·어둡게·ko |
| `S08-sending` | 제출 중 · 입력 잠김 | `prompt.msg.me` `prompt.msg.time` `prompt.sending` `sample.partner` `prompt.input.partner` `a11y.input.ro` `a11y.send` `a11y.pose.wave_main` `a11y.mascot` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `prompt.title` `prompt.mine` `a11y.presence` | iOS·낮·밝게·ko, Android·밤·어둡게·ko |
| `S08-partner-typing` | 상대 점유 · 쓰는 중 (읽기 전용 실시간) | `prompt.msg.me` `prompt.msg.time` `sample.partner` `prompt.msg.partner` `prompt.partner.typing` `prompt.input.partner` `a11y.input.ro` `a11y.send` `a11y.pose.wave_main` `a11y.mascot` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `prompt.title` `prompt.partner` `a11y.presence` | iOS·낮·밝게·ko, Android·밤·어둡게·ko, iOS·낮·밝게·en, Android·밤·어둡게·ja |
| `S08-partner-working` | 상대 점유 · 미리 보기 만드는 중 | `sample.partner` `prompt.msg.partner` `prompt.msg.time` `prompt.partner.thinking` `prompt.input.partner` `a11y.input.ro` `a11y.send` `a11y.pose.wave_main` `a11y.mascot` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `prompt.title` `prompt.partner` `a11y.presence` | iOS·낮·밝게·ko, Android·밤·어둡게·ko |
| `S08-expiring` | 내 점유 · 만료 임박 (30초 전) | `prompt.msg.me` `prompt.msg.time` `prompt.msg.result` `prompt.expiring` `prompt.expiring.action` `prompt.placeholder` `a11y.input` `a11y.send` `prompt.left` `prompt.idleHint` `a11y.pose.wave_main` `a11y.mascot` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `prompt.title` `prompt.mine` `a11y.presence` | iOS·낮·밝게·ko, Android·밤·어둡게·ko |
| `S08-idle` | 내 점유 · 유휴로 해제됨 (쓰던 글 남음) | `prompt.msg.me` `prompt.msg.time` `prompt.msg.result` `prompt.idle.me.title` `prompt.idle.me.body` `prompt.placeholder` `a11y.input` `a11y.send` `prompt.idle.me.action` `a11y.pose.wave_main` `a11y.mascot` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `prompt.title` `prompt.free` `a11y.presence` | iOS·낮·밝게·ko, Android·밤·어둡게·ko |
| `S08-takeover` | 상대 유휴 만료 · 이어받기 (이전 미리 보기 유지) | `preview.badge` `prompt.msg.me` `prompt.msg.time` `prompt.msg.result` `prompt.msg.status.preview` `sample.partner` `prompt.takeover.title` `prompt.takeover.body` `prompt.takeover.action` `a11y.pose.wave_main` `a11y.mascot` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `prompt.title` `prompt.free` `a11y.presence` | iOS·낮·밝게·ko, Android·밤·어둡게·ko, iOS·낮·밝게·en, Android·밤·어둡게·ja |
| `S08-takeover-lost` | 이어받기 경합 · 상대가 먼저 | `preview.badge` `prompt.msg.me` `prompt.msg.time` `prompt.msg.result` `prompt.msg.status.preview` `sample.partner` `prompt.input.partner` `a11y.input.ro` `a11y.send` `a11y.pose.wave_main` `a11y.mascot` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `prompt.title` `prompt.partner` `a11y.presence` `prompt.takeover.lost` | iOS·낮·밝게·ko, Android·밤·어둡게·ko |
| `S08-consent` | 동의 필요 · 입력 막힘 | `prompt.consent.need` `prompt.consent.action` `a11y.input` `a11y.send` `a11y.pose.wave_main` `a11y.mascot` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `prompt.title` `prompt.mine` `a11y.presence` | iOS·낮·밝게·ko, Android·밤·어둡게·ko |
| `S08-quota` | 하루 3회 소진 | `prompt.msg.me` `prompt.msg.time` `prompt.msg.result` `prompt.quota.title` `prompt.quota.body` `a11y.input` `a11y.send` `a11y.pose.wave_main` `a11y.mascot` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `prompt.title` `prompt.mine` `a11y.presence` | iOS·낮·밝게·ko, Android·밤·어둡게·ko |
| `S08-offline` | 오프라인 · 온라인 전용 | `prompt.msg.me` `prompt.msg.time` `prompt.msg.result` `main.offline.title` `prompt.offline` `a11y.input` `a11y.send` `a11y.pose.wave_main` `a11y.mascot` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `prompt.title` `prompt.mine` `a11y.presence` | iOS·낮·밝게·ko, Android·밤·어둡게·ko |
| `S08-unsupported` | 지원하지 않는 요청 | `prompt.unsupported.title` `prompt.unsupported.body` `prompt.placeholder` `a11y.input` `a11y.send` `prompt.left` `prompt.idleHint` `a11y.pose.wave_main` `a11y.mascot` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `prompt.title` `prompt.mine` `a11y.presence` | iOS·낮·밝게·ko, Android·밤·어둡게·ko |
| `S08-brand` | 기존 캐릭터·브랜드 요청 거절 | `prompt.brand.refuse` `prompt.brand.action` `prompt.placeholder` `a11y.input` `a11y.send` `prompt.left` `prompt.idleHint` `a11y.pose.wave_main` `a11y.mascot` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `prompt.title` `prompt.mine` `a11y.presence` | iOS·낮·밝게·ko, Android·밤·어둡게·ko |
| `S08-fail` | 실패 · 재시도 | `prompt.msg.me` `prompt.msg.time` `prompt.fail.title` `prompt.fail.body` `common.retry` `prompt.placeholder` `a11y.input` `a11y.send` `prompt.left` `prompt.idleHint` `a11y.pose.wave_main` `a11y.mascot` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `prompt.title` `prompt.mine` `a11y.presence` | iOS·낮·밝게·ko, Android·밤·어둡게·ko |
| `S08-gen-refused` | 생성 요청 거절 · 저작권·브랜드 (이유 + 대안 + 횟수 안 씀) | `gen.refuse.title` `gen.refuse.ip` `gen.refuse.note` `gen.refuse.action` `prompt.placeholder` `a11y.input` `a11y.send` `prompt.left` `prompt.idleHint` `a11y.pose.wave_main` `a11y.mascot` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `prompt.title` `prompt.mine` `a11y.presence` | iOS·낮·밝게·ko, Android·밤·어둡게·ko, iOS·낮·밝게·en, Android·밤·어둡게·ja 외 2 |
| `S08-gen-refused-purpose` | 생성 요청 거절 · 배경·말풍선 밖의 목적(마스코트·캐릭터·소품) | `gen.refuse.title` `gen.refuse.purpose` `gen.refuse.note` `gen.refuse.action` `prompt.placeholder` `a11y.input` `a11y.send` `prompt.left` `prompt.idleHint` `a11y.pose.wave_main` `a11y.mascot` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `prompt.title` `prompt.mine` `a11y.presence` | iOS·낮·밝게·ko, Android·밤·어둡게·ko, iOS·낮·밝게·en, Android·밤·어둡게·ja |
| `S08-gen-failed` | 생성 실패 · 재시도 1회 뒤에도 안 됨 (횟수 안 씀) | `prompt.msg.time` `gen.fail.title` `gen.fail.body` `common.retry` `prompt.placeholder` `a11y.input` `a11y.send` `prompt.left` `prompt.idleHint` `a11y.pose.wave_main` `a11y.mascot` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `prompt.title` `prompt.mine` `a11y.presence` | iOS·낮·밝게·ko, Android·밤·어둡게·ko |
| `S08-gen-disabled` | 새 장식 만들기 잠시 중단 (킬 스위치, 다른 꾸미기는 계속) | `gen.disabled.title` `gen.disabled.body` `sample.partner` `prompt.input.partner` `a11y.input.ro` `a11y.send` `a11y.pose.wave_main` `a11y.mascot` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `prompt.title` `prompt.mine` `a11y.presence` | iOS·낮·밝게·ko, Android·밤·어둡게·ko |
| `S08-library` | 우리 장식 보관함 (다시 쓰기 · 지우기 · 방에 놓인 장식도 지울 수 있음) | `prompt.placeholder` `a11y.input` `a11y.send` `prompt.left` `prompt.idleHint` `a11y.pose.wave_main` `a11y.mascot` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `prompt.title` `prompt.mine` `a11y.presence` `gen.lib.title` `gen.lib.count` `gen.lib.byMe` `gen.lib.use` `gen.lib.delete` `sample.partner` `gen.lib.by` `gen.lib.delete.inuse` | iOS·낮·밝게·ko, Android·밤·어둡게·ko, iOS·낮·밝게·en, Android·밤·어둡게·ja |
| `S08-library-full` | 보관함이 가득 참 (설정값 상한) · 모델 호출 전에 막음 | `prompt.msg.time` `gen.lib.count` `gen.lib.title` `gen.lib.full` `prompt.placeholder` `a11y.input` `a11y.send` `prompt.left` `prompt.idleHint` `a11y.pose.wave_main` `a11y.mascot` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `prompt.title` `prompt.mine` `a11y.presence` | iOS·낮·밝게·ko, Android·밤·어둡게·ko |
| `S08-library-delete` | 장식 지우기 확인 | `prompt.placeholder` `a11y.input` `a11y.send` `prompt.left` `prompt.idleHint` `a11y.pose.wave_main` `a11y.mascot` `date.since` `a11y.dday` `dday.eyebrow` `dday.count` `prompt.title` `prompt.mine` `a11y.presence` `gen.lib.delete.title` `gen.lib.delete.body` `gen.lib.delete.inuse` `gen.lib.delete.confirm` `common.cancel` | iOS·낮·밝게·ko, Android·밤·어둡게·ko |

## 이동 및 뒤로

F03: S07 → S08 → S09 → 적용 후 S07; S09 → S10 → 이전 미리보기; 필요 시 S12 동의. 뒤로: 대화/시트 또는 확인을 닫고 이전 단계로. 취소 시 방은 유지.

## 접근성

상태 표에 나열된 `a11y.*` 키를 스크린 리더 이름으로 사용합니다. 공통 접근성 및 200% 글자 규칙은 [interaction notes](../../../interaction-notes.md#10-접근성-상호작용)를 참조하세요. TODO: 해당 상태에 명시되지 않은 역할과 이름을 확인하세요.

## 수락 시나리오

- [ ] S08-AC-01: 상대가 점유 중이면 대화를 읽기 전용으로 표시한다.

## 열린 질문 / 추적

TODO: 명세에 없는 disabled/offline 상태의 적용 여부와 정확한 뒤로 대상을 확인하세요. 시나리오와 요구사항·테스트·실행 결과는 [추적표](../../traceability.md)에 연결하세요.
